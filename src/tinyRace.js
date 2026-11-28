// Tiny Race: race tracks for the tiny cars (the owner chose B, a circuit in the fields, Nov 2026;
// C, a mountain road, is to follow), in the town's pixel style: one pattern pixel per person pixel.
//
//   CIRCUIT                       the demo's track (a layout: anyone can make their own, see below)
//   makeTrack(layout)             a track: { W, H, curve, len, hw, ground (a canvas), things,
//                                 solids, at(s), near(x, y, hint), surface(x, y), grid(n) }
//   drawGrandstand(g, { x, y, w, seed })        a stand of people facing the track; (x, y): its front, left
//   drawStartLights(g, { x, y, lit, go })       start lights on a post: lit 0-4 red, go: all off (green)
//   drawTyreStack(g, { x, y })                  two tyres on top of each other; (x, y): its foot
//   drawThing(g, thing, t, cheer)              any of a track's things (tree, tyres, stand, lights)
//   paintTrack(g, track, { x, y, w, h })        paint a track's ground into a rectangle (makeTrack does it)
//
// A layout: { W, H, seed, terrain, hw (half the road's width), points: [[x, y], ...] (the middle of the
// road, a closed loop, driven in that order), start (how far along the line is), stands: [{ x, y, w }],
// trees: { count, types, clear } }. The road is a smooth curve through the points; kerbs (red and white)
// on the bends, tyre stacks outside them, a white line at each edge, a chequered start line and a grid.
// Plain ES module; draws with tinyNature (trees, grass) and tinyCharacters (the crowd's colours).

import { canvasOf, randomCharacter, seeded } from './tinyCharacters.js';
import { drawTerrain, drawTree } from './tinyNature.js';

const INK = '#2a2d32', ROAD = '#6f7378', ROAD_D = '#6a6e73', ROAD_L = '#74787d', PAINT = '#e8e4d8';
const KERB_R = '#d8402f', KERB_W = '#f2f2ee', TYRE = '#2a2d32', TYRE_T = '#3a3e44', STEEL = '#5a6068';
const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
/** A whole-pixel hash of a position (the same pixel always gets the same number, 0..1). */
function hash(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The demo's circuit: a long straight with the grandstand, a hairpin, an S, a sweeping bend. */
export const CIRCUIT = {
  name: 'Meadow circuit', W: 1300, H: 800, seed: 3, terrain: 'grass', hw: 16, start: 220,
  points: [[247, 676], [650, 676], [988, 676], [1144, 611], [1183, 442], [1066, 351], [897, 403], [767, 325],
    [806, 182], [650, 104], [377, 124], [221, 208], [143, 377], [163, 572]],
  stands: [{ x: 290, y: 626, w: 200 }, { x: 520, y: 626, w: 120 }, { x: 730, y: 626, w: 160 }],
  trees: { count: 700, types: ['oak', 'birch', 'poplar', 'fir', 'oak', 'maple'], clear: 44 },
};

// --- the road's line -----------------------------------------------------------------------
/** A closed smooth curve (Catmull-Rom) through the points, every half pixel: [{ x, y, s, tx, ty, k }]. */
function curveOf(pts) {
  const out = [], n = pts.length, P = (i) => pts[((i % n) + n) % n];
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)], m = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 2);
    for (let j = 0; j < m; j++) {
      const t = j / m, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  const N = out.length;
  let s = 0;
  out.forEach((q, i) => {
    if (i > 0) s += Math.hypot(q.x - out[i - 1].x, q.y - out[i - 1].y);
    q.s = s; q.i = i;
    const a = out[(i - 1 + N) % N], b = out[(i + 1) % N], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
    q.tx = tx / l; q.ty = ty / l;
  });
  const len = s + Math.hypot(out[0].x - out[N - 1].x, out[0].y - out[N - 1].y);
  // how sharply it bends (1 / radius, from the tangents 6 px either side), and which way (+: to the right)
  out.forEach((q, i) => {
    const a = out[(i - 12 + N) % N], b = out[(i + 12) % N], cross = a.tx * b.ty - a.ty * b.tx;
    q.k = Math.asin(Math.max(-1, Math.min(1, cross))) / 12; q.turn = Math.sign(cross);
  });
  return { curve: out, len };
}

/** Build a track from a layout: its curve, its ground picture, the things on it, what you bump into. */
export function makeTrack(layout = CIRCUIT) {
  const { W, H, hw = 16 } = layout, { curve, len } = curveOf(layout.points), N = curve.length;
  // nearest point of the line for every pixel within reach (distance, which side, which sample)
  const REACH = Math.max(60, hw + 44);
  const dist = new Float32Array(W * H).fill(1e9), idx = new Int32Array(W * H).fill(-1), side = new Int8Array(W * H);
  for (const q of curve) {
    const x0 = Math.max(0, Math.floor(q.x - REACH)), x1 = Math.min(W - 1, Math.ceil(q.x + REACH)), y0 = Math.max(0, Math.floor(q.y - REACH)), y1 = Math.min(H - 1, Math.ceil(q.y + REACH));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - q.x, dy = y + 0.5 - q.y, e = dx * dx + dy * dy, i = y * W + x;
      if (e < dist[i]) { dist[i] = e; idx[i] = q.i; side[i] = q.tx * dy - q.ty * dx > 0 ? 1 : -1; }
    }
  }
  for (let i = 0; i < dist.length; i++) if (dist[i] < 1e9) dist[i] = Math.sqrt(dist[i]);
  const at = (s) => curve[Math.floor(((((s % len) + len) % len) / len) * N) % N];
  const track = { layout, W, H, hw, curve, len, N, dist, idx, side, start: layout.start ?? 0, at };
  /** The nearest point of the line to (x, y): { q, d } (from the pixel table, or by a search near `hint`). */
  track.near = (x, y, hint = -1) => {
    const X = Math.floor(x), Y = Math.floor(y);
    if (X >= 0 && Y >= 0 && X < W && Y < H && idx[Y * W + X] >= 0) return { q: curve[idx[Y * W + X]], d: dist[Y * W + X] };
    let best = null, bd = Infinity;
    const from = hint >= 0 ? hint - 400 : 0, to = hint >= 0 ? hint + 400 : N;
    for (let j = from; j < to; j += 2) { const q = curve[((j % N) + N) % N], e = Math.hypot(q.x - x, q.y - y); if (e < bd) { bd = e; best = q; } }
    return { q: best, d: bd };
  };
  /** What is under (x, y): 'road', 'kerb' or 'grass' (off the map: 'out'). */
  track.surface = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return 'out';
    const d = dist[Math.floor(y) * W + Math.floor(x)];
    return d < hw ? 'road' : d < hw + 3 ? 'kerb' : 'grass';
  };
  // the things round it, each where the layout's own random stream puts it
  const rng = seeded((layout.seed ?? 1) * 7919 + 11), things = [], solids = [];
  const clearOf = (x, y, r) => track.near(x, y).d > r;
  // tyre stacks outside the bends
  for (let i = 0; i < N; i += 14) {
    const q = curve[i];
    if (Math.abs(q.k) < 0.009) continue;
    const sg = -q.turn, x = Math.round(q.x - q.ty * sg * (hw + 9)), y = Math.round(q.y + q.tx * sg * (hw + 9));
    if (!clearOf(x, y, hw + 6)) continue;
    things.push({ kind: 'tyres', x, y }); solids.push({ x, y: y - 1, r: 3 });
  }
  // the grandstands (their fronts on the ground, people in rows going back)
  for (const st of layout.stands ?? []) {
    things.push({ kind: 'stand', ...st, seed: (layout.seed ?? 1) + st.x });
    solids.push({ box: { x: st.x - 2, y: st.y - 46, w: st.w + 4, h: 47 } });
  }
  // the start lights by the line (on the outside), the banner over it
  const q0 = at(track.start), out = -1;
  track.lights = { kind: 'lights', x: Math.round(q0.x - q0.ty * out * (hw + 6)), y: Math.round(q0.y + q0.tx * out * (hw + 6)), lit: 0, go: false };
  things.push(track.lights); solids.push({ x: track.lights.x, y: track.lights.y, r: 2 });
  // trees: anywhere clear of the road (more room below the road, where a crown would hide it)
  const T = layout.trees ?? { count: 0 };
  for (let n = 0; n < (T.count ?? 0); n++) {
    const x = Math.round(rng() * W), y = Math.round(rng() * H), type = T.types[Math.floor(rng() * T.types.length)], seed = 1 + Math.floor(rng() * 999);
    const nr = track.near(x, y), below = nr.q.y < y ? 26 : 0;
    if (nr.d < (T.clear ?? 40) + below - 14) continue;
    if (things.some((o) => o.kind === 'stand' && x > o.x - 16 && x < o.x + o.w + 16 && y > o.y - 70 && y < o.y + 30)) continue;
    if (things.some((o) => o.kind === 'tree' && Math.abs(o.x - x) < 9 && Math.abs(o.y - y) < 6)) continue;
    things.push({ kind: 'tree', type, x, y, seed }); solids.push({ x, y: y - 1, r: 3 });
  }
  // the ground: grass, the road, its lines and kerbs, the start line and the grid
  const ground = canvasOf(W, H);
  paintTrack(ground.getContext('2d'), track, { x: 0, y: 0, w: W, h: H });
  Object.assign(track, { ground, things, solids });
  /** The starting grid: n places behind the line, two by two, staggered: [{ x, y, a }] (a: the angle, radians). */
  track.grid = (n) => Array.from({ length: n }, (_, j) => {
    const q = at(track.start - 26 - j * 22), off = j % 2 ? 8 : -8;
    return { x: q.x - q.ty * off, y: q.y + q.tx * off, a: Math.atan2(q.ty, q.tx) };
  });
  return track;
}

/** Paint a track's ground (grass, road, edge lines, kerbs, the chequered line, the grid boxes) into a rectangle. */
export function paintTrack(g, track, { x: X, y: Y, w, h }) {
  const { W, hw, dist, idx, curve, start, len } = track;
  drawTerrain(g, { type: track.layout.terrain ?? 'grass', x: X, y: Y, w, h, seed: track.layout.seed ?? 1 });
  for (let y = Y; y < Y + h; y++) for (let x = X; x < X + w; x++) {
    const i = y * W + x, e = dist[i];
    if (e > hw + 3) continue;
    const q = curve[idx[i]], s = q.s;
    let c;
    if (e < hw) {
      const v = hash(x, y, 5);
      c = v < 0.025 ? ROAD_D : v > 0.985 ? ROAD_L : ROAD;
      if (e >= hw - 2.2 && e < hw - 1.2) c = PAINT;                                                  // the edge lines
      const ds = ((s - start) % len + len) % len;
      if ((ds < 3 || ds > len - 1) && e < hw - 2.2) c = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? KERB_W : INK;   // the chequered line
    } else if (Math.abs(q.k) > 0.009) c = Math.floor(s / 4) % 2 ? KERB_R : KERB_W;                  // kerbs on the bends
    else if (e < hw + 1) c = '#8a9078';                                                              // a worn edge
    else continue;
    g.fillStyle = c; g.fillRect(x, y, 1, 1);
  }
  // the grid boxes: a white bracket in front of each place
  const at = (s) => curve[Math.floor(((((s % len) + len) % len) / len) * curve.length) % curve.length];
  for (let j = 0; j < 6; j++) {
    const q = at(start - 26 - j * 22 + 16), off = j % 2 ? 8 : -8, bx = Math.round(q.x - q.ty * off), by = Math.round(q.y + q.tx * off);
    if (bx < X - 8 || bx > X + w + 8 || by < Y - 8 || by > Y + h + 8) continue;
    px(g, PAINT, bx, by - 3, 1, 7); px(g, PAINT, bx - 3, by - 3, 3, 1); px(g, PAINT, bx - 3, by + 3, 3, 1);
  }
}

// --- the things round the track ------------------------------------------------------------
/** Two tyres stacked; (x, y): the foot. */
export function drawTyreStack(g, { x, y }) {
  x = Math.round(x); y = Math.round(y);
  for (const dy of [0, 3]) { px(g, TYRE, x - 2, y - 3 - dy, 5, 3); px(g, TYRE_T, x - 1, y - 3 - dy, 3, 1); px(g, '#4a4e54', x, y - 3 - dy); }
}
/** Start lights on a post: lit (0-4) red lamps; go: all out (the race is on). (x, y): the post's foot. */
export function drawStartLights(g, { x, y, lit = 0, go = false }) {
  x = Math.round(x); y = Math.round(y);
  px(g, STEEL, x, y - 22, 2, 22); px(g, '#7a8088', x, y - 22, 1, 22);
  px(g, INK, x - 9, y - 30, 20, 8);
  for (let i = 0; i < 4; i++) px(g, go ? '#3fbf5a' : i < lit ? '#ff4030' : '#4a3a3a', x - 7 + i * 5, y - 28, 3, 4);
}
/** A grandstand: rows of seats going back, the crowd in them, a roof on posts. (x, y): its front, left. */
export function drawGrandstand(g, { x, y, w = 120, seed = 1, t = 0, cheer = false }) {
  x = Math.round(x); y = Math.round(y);
  const rng = seeded(seed), rows = 5, H = rows * 7 + 1;
  px(g, '#7a7e84', x, y - H, w, H);
  for (let r = 0; r < rows; r++) { px(g, '#b8bcc0', x, y - H + 1 + r * 7, w, 5); px(g, '#9aa0a6', x, y - H + 6 + r * 7, w, 1); }
  for (let r = 0; r < rows; r++) for (let j = 0; j < Math.floor(w / 7) - 1; j++) {
    const c = randomCharacter(rng), empty = rng() < 0.12;
    if (empty) continue;
    const hop = cheer && Math.sin(t * 9 + j * 1.7 + r * 2.3) > 0.6 ? 1 : 0;
    const X = x + 3 + j * 7 + (r % 2) * 3, Y = y - H - 2 + r * 7 - hop;
    px(g, c.hair ?? INK, X + 1, Y - 1, 3, 1); px(g, c.skin ?? '#e2b08e', X + 1, Y, 3, 2); px(g, c.body ?? '#f2f2ee', X, Y + 2, 5, 3);
    if (hop) { px(g, c.skin ?? '#e2b08e', X - 1, Y - 1, 1, 2); px(g, c.skin ?? '#e2b08e', X + 5, Y - 1, 1, 2); }   // arms up
  }
  px(g, STEEL, x - 2, y - H - 10, w + 4, 5); px(g, KERB_R, x - 2, y - H - 6, w + 4, 1);
  for (const X of [x - 1, x + Math.floor(w / 2), x + w - 1]) px(g, STEEL, X, y - H - 5, 1, 6);
}
/** Draw one of a track's things (a tree, a tyre stack, a stand, the lights). */
export function drawThing(g, o, t = 0, cheer = false) {
  if (o.kind === 'tree') drawTree(g, { type: o.type, x: o.x, y: o.y, seed: o.seed, scale: 1.5 });
  else if (o.kind === 'tyres') drawTyreStack(g, o);
  else if (o.kind === 'stand') drawGrandstand(g, { ...o, t, cheer });
  else if (o.kind === 'lights') drawStartLights(g, o);
}
