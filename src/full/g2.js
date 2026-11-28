// Full-size ground, part 2: the basketball court (a pixel centre circle), the pond (a pixel
// edge of stones, the moving water inside the same pixel ellipse), the ring path round the pond
// park and the shrine's stepping stones. Everything on whole pixels: fillRect, and clips made of
// whole-pixel rectangles only (no ellipses, no strokes, nothing soft).
import { seeded } from '../tinyCharacters.js';

/** Rows of a pixel ellipse (centre cx, cy; radii rx, ry): Map y -> [L, R), the pixels whose centre is inside. */
function ellipseRows(cx, cy, rx, ry) {
  const rows = new Map();
  if (rx <= 0 || ry <= 0) return rows;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = y + 0.5 - cy;
    if (Math.abs(dy) >= ry) continue;
    const hw = rx * Math.sqrt(1 - (dy * dy) / (ry * ry));
    const L = Math.ceil(cx - hw - 0.5), R = Math.floor(cx + hw - 0.5) + 1;
    if (R > L) rows.set(y, [L, R]);
  }
  return rows;
}
const inRows = (rows, x, y) => { const r = rows.get(y); return !!r && x >= r[0] && x < r[1]; };
/** Clip g to a set of whole-pixel row spans [[y, L, R], ...] (rows with the same span merged into one rectangle). */
function clipSpans(g, spans) {
  g.beginPath();
  let run = null;
  const flush = () => { if (run) g.rect(run[1], run[0], run[2] - run[1], run[3]); };
  for (const [y, L, R] of spans) {
    if (run && run[0] + run[3] === y && run[1] === L && run[2] === R) run[3]++;
    else { flush(); run = [y, L, R, 1]; }
  }
  flush();
  g.clip();
}
const R = (g, col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

// --- the pond: an ellipse area with a bank of stones -------------------------------------------
const BANK = 2;                                                          // the stones' width (px)
const ponds = new Map();
/** The pond's shapes (cached per area): the outer ellipse, the water inside the bank, the bank's pixels. */
function pondOf(a) {
  const key = `${a.x},${a.y},${a.w},${a.h}`;
  if (ponds.has(key)) return ponds.get(key);
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2, rx = a.w / 2, ry = a.h / 2;
  const outer = ellipseRows(cx, cy, rx, ry), inner = ellipseRows(cx, cy, rx - BANK, ry - BANK);
  const water = [...inner].map(([y, [L, Rr]]) => [y, L, Rr]);
  // the bank: stones round the edge, each about 7 px along it, top-lit, with dark joints
  const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))), n = Math.max(8, Math.round(per / 7));
  const rng = seeded(a.x * 31 + a.y * 7 + 1), tone = Array.from({ length: n }, () => rng());
  const bank = [], shade = [];
  for (const [y, [L, Rr]] of outer) for (let x = L; x < Rr; x++) {
    if (inRows(inner, x, y)) {                                            // water: shaded under the bank at the top
      if (y < cy && !inRows(inner, x, y - 1)) shade.push([x, y]);
      continue;
    }
    const u = ((Math.atan2((y + 0.5 - cy) / ry, (x + 0.5 - cx) / rx) + Math.PI) / (2 * Math.PI)) * n, s = Math.floor(u) % n;
    let col = tone[s] < 0.33 ? '#808077' : tone[s] < 0.66 ? '#8a8a80' : '#94948a';
    if (u - Math.floor(u) < 1 / 7) col = '#727269';                       // a joint between two stones
    else if (!inRows(outer, x, y - 1) || (y > cy && inRows(inner, x, y - 1))) col = '#a8a89c';   // the top of a stone, in the light
    else if (y < cy && inRows(inner, x, y + 1)) col = '#6e6e66';            // the stone's face over the water
    bank.push([x, y, col]);
  }
  const p = { outer, water, bank, shade };
  ponds.set(key, p);
  return p;
}
/** The water's edge under the bank (drawn with the water, every frame). */
const pondShade = (g, p) => { for (const [x, y] of p.shade) R(g, '#5a88ac', x, y); };

// --- the court -------------------------------------------------------------------------------
/** A pixel ellipse outline (midpoint algorithm), integer radii, centred on the pixel (x0, y0). */
function ellipseOutline(g, col, x0, y0, rx, ry) {
  const pts = new Set(), plot = (x, y) => { for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) pts.add(`${x0 + sx * x},${y0 + sy * y}`); };
  const rx2 = rx * rx, ry2 = ry * ry;
  let x = 0, y = ry, dx = 0, dy = 2 * rx2 * y, p = ry2 - rx2 * ry + 0.25 * rx2;
  while (dx < dy) { plot(x, y); x++; dx += 2 * ry2; if (p < 0) p += dx + ry2; else { y--; dy -= 2 * rx2; p += dx - dy + ry2; } }
  p = ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2;
  while (y >= 0) { plot(x, y); y--; dy -= 2 * rx2; if (p > 0) p += rx2 - dy; else { x++; dx += 2 * ry2; p += dx - dy + rx2; } }
  g.fillStyle = col;
  for (const s of pts) { const [px, py] = s.split(',').map(Number); g.fillRect(px, py, 1, 1); }
}
/** A fenced area's fence (as fenceOf in tinyTown.js): its sides as pieces { x, y, w, h, side }, with the gates as gaps. */
function fenceOf(a) {
  const gates = a.gates ?? { top: a.gate ?? 0 }, out = [];
  const run = (side, x, y, len, across) => {
    const gw = gates[side] ?? 0, g0 = Math.round((len - gw) / 2), g1 = g0 + gw;
    const piece = (from, to) => { if (to > from) out.push(across ? { side, x: x + from, y, w: to - from, h: 3 } : { side, x, y: y + from, w: 2, h: to - from }); };
    if (gw) { piece(0, g0); piece(g1, len); } else piece(0, len);
  };
  run('top', a.x, a.y, a.w, true); run('bottom', a.x, a.y + a.h - 3, a.w, true);
  run('left', a.x, a.y, a.h, false); run('right', a.x + a.w - 2, a.y, a.h, false);
  return out;
}

export const PART = {
  // a coin-parking lot (the owner chose nose-in bays, Nov 2026): asphalt with a grey kerb round it, white
  // lines between bays 16 pixels wide (as many as fit), a yellow wheel stop in each, near its top
  parking: {
    approved: true,
    draw(g, a) {
      const Q = (col, x, y, w, h) => R(g, col, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      Q('#6e7277', a.x, a.y, a.w, a.h);
      for (let i = 0; i < a.w * a.h / 9; i++) { const kk = (i * 7919) % Math.round(a.w * a.h); Q(i % 3 ? '#73777c' : '#686c71', a.x + kk % Math.round(a.w), a.y + Math.floor(kk / Math.round(a.w)), 1, 1); }   // its grain
      Q('#9aa0a6', a.x, a.y + a.h - 1, a.w, 1); Q('#9aa0a6', a.x, a.y, 1, a.h); Q('#9aa0a6', a.x + a.w - 1, a.y, 1, a.h);   // the kerb (open to the street above)
      const n = Math.floor((a.w - 4) / 16);
      for (let i = 0; i <= n; i++) Q('#e8e8e4', a.x + 2 + i * 16, a.y + 3, 1, a.h - 4);
      for (let i = 0; i < n; i++) Q('#e8c840', a.x + 6 + i * 16, a.y + 5, 8, 1);
    },
  },
  court: {
    approved: true,
    draw(g, a, k) {
      const Q = (col, x, y, w, h) => R(g, col, Math.round(x), Math.round(y), Math.round(w), Math.round(h)), m = (v) => Math.round(v * k);
      Q('#2f5a80', a.x, a.y, a.w, a.h);                                    // the run-off: a deeper blue
      const cx = a.x + m(10), cy = a.y + m(8), cw = a.w - m(20), ch = a.h - m(16), line = '#f2f2ee';
      Q('#3f86c8', cx, cy, cw, ch);                                        // the court: blue
      Q(line, cx, cy, cw, 1); Q(line, cx, cy + ch - 1, cw, 1); Q(line, cx, cy, 1, ch); Q(line, cx + cw - 1, cy, 1, ch); Q(line, cx + Math.round(cw / 2), cy, 1, ch);
      for (const kx of [cx, cx + cw - m(22)]) { Q(line, kx, cy + Math.round(ch / 2) - m(10), m(22), 1); Q(line, kx, cy + Math.round(ch / 2) + m(10), m(22), 1); Q(line, kx === cx ? kx + m(22) : kx, cy + Math.round(ch / 2) - m(10), 1, m(20)); }   // the keys
      ellipseOutline(g, line, Math.round(cx + Math.round(cw / 2)), Math.round(cy + Math.round(ch / 2)), m(10), m(7));   // the centre circle, on the pixel grid
      // the fence (only with `fence: true`): posts and wire mesh round the edge, with its gates (gaps)
      if (a.fence) for (const f of fenceOf(a)) {
        if (f.side === 'top' || f.side === 'bottom') {
          for (let x = a.x + Math.ceil((f.x - a.x) / m(4)) * m(4); x < f.x + f.w; x += m(4)) Q('#9aa0a8', x, f.y, 1, 3);
          Q('#8a9096', f.x, f.side === 'top' ? f.y : f.y + 2, f.w, 1);
        } else for (let y = a.y + Math.ceil((f.y - a.y) / m(3)) * m(3); y < f.y + f.h; y += m(3)) Q('#9aa0a8', f.x, y, 2, 2);
      }
      if (a.fence && a.gatePosts) for (const f of fenceOf(a)) {            // the gates marked by a stouter post on each side
        const ends = f.side === 'top' || f.side === 'bottom' ? [[f.x, f.y], [f.x + f.w - 2, f.y]] : [[f.x, f.y], [f.x, f.y + f.h - 3]];
        for (const [x, y] of ends) if ((f.side === 'top' || f.side === 'bottom') ? (x > a.x + 1 && x < a.x + a.w - 3) : (y > a.y + 2 && y < a.y + a.h - 4)) { Q('#5f6670', x, y - 3, 2, 6); Q('#c8ccd0', x, y - 3, 2, 1); }
      }
    },
  },

  pond: {
    approved: true,
    draw(g, a, k, terrain) {
      const p = pondOf(a);
      g.save(); clipSpans(g, p.water); terrain(g); pondShade(g, p); g.restore();
      for (const [x, y, col] of p.bank) R(g, col, x, y);
    },
    water(g, a, k, water) {
      const p = pondOf(a);
      g.save(); clipSpans(g, p.water); water(g); pondShade(g, p); g.restore();
    },
  },

  ringPath: {
    approved: true,
    draw(g, a, k, terrain) {
      const m = (v) => Math.round(v * k);
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2, rx = a.w / 2 - m(8), ry = a.h / 2 - m(8), wd = m(6);
      const outer = ellipseRows(cx, cy, rx, ry), inner = ellipseRows(cx, cy, rx - wd, ry - wd);
      const spans = [];
      for (const [y, [L, Rr]] of outer) {
        const i = inner.get(y);
        if (!i) spans.push([y, L, Rr]);
        else { if (i[0] > L) spans.push([y, L, i[0]]); if (Rr > i[1]) spans.push([y, i[1], Rr]); }
      }
      spans.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      g.save(); clipSpans(g, spans); terrain(g, a.x, a.y, a.w, a.h, 'dirt', a.x + 7); g.restore();
      // a soft edge where the dirt meets the grass: every other edge pixel half grass
      const on = (x, y) => inRows(outer, x, y) && !inRows(inner, x, y);
      for (const [y, L, Rr] of spans) for (let x = L; x < Rr; x++) {
        if (on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1)) continue;
        if ((x + y) % 2 === 0) R(g, '#a49d7b', x, y);
      }
    },
  },

  steppingStones: {
    approved: true,
    draw(g, a, k) {
      const m = (v) => Math.round(v * k), { x, w, y0 } = a.path, h = m(4);
      const rng = seeded(x * 13 + y0 * 3 + 5);
      for (let y = y0; y < a.y + a.h; y += m(5)) {
        // a flat stone within the old one's rectangle: its ends a little uneven, its corners cut
        const l = Math.floor(rng() * 2), r = Math.floor(rng() * 2), tint = rng();
        const base = tint < 0.33 ? '#c4bdab' : tint < 0.66 ? '#c9c2b0' : '#cec7b5';
        const x0 = x + l, x1 = x + w - r, cut = 1 + Math.floor(rng() * 2);
        R(g, base, x0 + cut, y, x1 - x0 - cut * 2, h);                    // the middle
        R(g, base, x0 + 1, y + 1, x1 - x0 - 2, h - 2);                     // the corners rounded
        R(g, base, x0, y + 2, x1 - x0, h - 4);
        R(g, '#ddd7c6', x0 + cut, y, x1 - x0 - cut * 2, 1);               // the top edge, in the light
        R(g, '#ddd7c6', x0 + 1, y + 1, 1, 1);
        R(g, '#b2ab99', x0 + cut, y + h - 1, x1 - x0 - cut * 2, 1);         // the lower edge
        R(g, '#b2ab99', x1 - 2, y + h - 2, 1, 1);
        const d = x0 + 4 + Math.floor(rng() * (x1 - x0 - 10));            // a small dimple in the stone
        R(g, '#bfb8a6', d, y + 2 + Math.floor(rng() * 2), 2, 1);
      }
    },
  },
};
