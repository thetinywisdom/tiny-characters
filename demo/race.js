// Tiny Race (the owner chose B, a circuit in the fields, Nov 2026): you and four cars, three laps,
// full screen. Arrow keys / WASD (touch: the buttons), R: race again, P: pause.
// Test hooks: window.tinyRace = { track, cars, you, state }; ?auto: you drive yourself (for checks).

import { CIRCUIT, makeTrack, drawThing } from '../src/tinyRace.js';
import { drawVehicle } from '../src/tinyTraffic.js';
import { KY } from '../src/tinyVoxel.js';

const canvas = document.getElementById('race'), g = canvas.getContext('2d');
const track = makeTrack(CIRCUIT), LAPS = 3, AUTO = new URLSearchParams(location.search).has('auto');

// --- driving: one model for everyone ------------------------------------------------------------
const VMAX = 172, ACC = 92, BRAKE = 230, GRIP = 330, WMAX = 3.2, GRASS_MAX = 64;
const RACERS = [
  { name: 'YOU', color: '#f2c230', you: true },
  { name: 'KAI', color: '#d8402f', power: 0.97, nerve: 0.87 },
  { name: 'MIO', color: '#2f6fd6', power: 0.965, nerve: 0.86 },
  { name: 'REN', color: '#2f9a5a', power: 0.96, nerve: 0.85 },
  { name: 'SORA', color: '#f2f2ee', power: 0.95, nerve: 0.84 },
];
let cars = [], state = null;
// your best lap on this track, kept in this browser (a nicety: without storage it is just this visit's)
const RECORD_KEY = `tinyRace.best.${CIRCUIT.name}`;
let record = null;
try { record = Number(localStorage.getItem(RECORD_KEY)) || null; } catch { record = null; }
const keys = { up: false, down: false, left: false, right: false };

function newRace() {
  // the grid: you start third, in the middle of the field
  const order = [1, 2, 0, 3, 4], spots = track.grid(5);
  cars = order.map((ri, j) => {
    const r = RACERS[ri], sp = spots[j], q = track.near(sp.x, sp.y).q;
    return { ...r, power: r.power ?? 1, nerve: r.nerve ?? 1, x: sp.x, y: sp.y, a: sp.a, v: 0, steer: 0, idx: q.i, s: q.s,
      sector: sectorOf(q.s), next: 0, lap: 0, lapStart: 0, laps: [], best: null, finished: null, lane: (j % 2 ? 8 : -8), laneT: 0,
      brake: false, wrong: 0, dust: [] };
  });
  state = { phase: 'count', t: 0, raceT: 0, paused: false, results: [], go: 0, oldRecord: record };
  track.lights.lit = 0; track.lights.go = false;
  window.tinyRace = { track, cars, you: cars.find((c) => c.you), state, keys, ms: () => frameMs };
}
const rel = (s) => (((s - track.start) % track.len) + track.len) % track.len;     // how far past the line
const SECTORS = 16;                                  // checkpoints along a lap, passed in order (a cut across the grass skips one)
const sectorOf = (s) => Math.floor(rel(s) / (track.len / SECTORS));
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/** How far along the race a car is (laps and how far into this one), for the places. */
/** How far along the race a car is (laps and how far into this one, no further than its last checkpoint), for the places. */
const score = (c) => (c.finished !== null ? 1e7 - c.finished : (c.lap - 1) * track.len + Math.min(rel(c.s), (c.lap === 0 ? SECTORS : c.next || SECTORS) * (track.len / SECTORS)));

/** The fastest a car may take the road ahead (from its bends) with room to brake. */
function safeSpeed(c) {
  const reach = (c.v * c.v) / (2 * BRAKE * 0.75) + 24;
  let v = VMAX * c.power * (c.boost ?? 1);
  for (let d = 0; d < reach; d += 3) {
    const q = track.at(c.s + d), k = Math.abs(q.k);
    if (k < 1e-4) continue;
    const corner = Math.min(Math.sqrt((GRIP * c.nerve) / k), (WMAX * c.nerve) / k);
    // braking from here to there: v^2 = corner^2 + 2 * BRAKE * d
    v = Math.min(v, Math.sqrt(corner * corner + 2 * BRAKE * 0.75 * d));
  }
  return v;
}

/** What a computer car (or you on ?auto) does: aim along the road a bit ahead, in its lane; brake for bends. */
function think(c, dt) {
  // its lane: kept, moved over when someone is just ahead in it
  c.laneT -= dt;
  // (only for a slower car right ahead in its own lane, and only if the other lane is clear)
  const rel2 = (o) => { const dx = o.x - c.x, dy = o.y - c.y; return { fwd: dx * Math.cos(c.a) + dy * Math.sin(c.a), lat: -dx * Math.sin(c.a) + dy * Math.cos(c.a) }; };
  const blocked = cars.some((o) => { if (o === c) return false; const { fwd, lat } = rel2(o); return fwd > 0 && fwd < 46 && Math.abs(lat) < 8 && o.v < c.v + 4; });
  if (blocked && c.laneT <= 0) {
    const to = c.lane > 0 ? -8 : 8, shift = to - c.lane;
    const free = !cars.some((o) => { if (o === c) return false; const { fwd, lat } = rel2(o); return fwd > -34 && fwd < 40 && Math.abs(lat - shift) < 9; });
    if (free) { c.lane = to; c.laneT = 1.5; }
  }
  // (after a cut, it drives back to the checkpoint it missed)
  const look = 22 + c.v * 0.3, q = c.cut > 30 ? track.at(track.start + (c.next + 0.5) * (track.len / SECTORS)) : track.at(c.s + look), tx = q.x - q.ty * c.lane, ty = q.y + q.tx * c.lane;
  const diff = wrapA(Math.atan2(ty - c.y, tx - c.x) - c.a);
  // close racing: a car well ahead of you eases off a little, one well behind pushes a little
  const you = cars.find((o) => o.you), gap = c.you ? 0 : (score(c) - score(you)) / track.len;
  c.boost = c.you ? 1 : gap > 0.03 ? Math.max(0.93, 1 - (gap - 0.03) * 0.8) : gap < -0.06 ? Math.min(1.04, 1 + (-gap - 0.06) * 0.5) : 1;
  const want = safeSpeed(c);
  return { up: c.v < want - 2, down: c.v > want + 6, turn: Math.max(-1, Math.min(1, diff * 3.2)) };
}

function drive(c, dt, input) {
  const surf = track.surface(c.x, c.y);
  // the slipstream: right behind another car you go a little faster
  c.slip = cars.some((o) => o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 60 && Math.cos(Math.atan2(o.y - c.y, o.x - c.x) - c.a) > 0.95 && Math.cos(o.a - c.a) > 0.9);
  const top = surf === 'grass' ? GRASS_MAX : VMAX * c.power * (c.boost ?? 1) * (c.slip ? 1.04 : 1);
  const turnIn = input.turn ?? (input.right ? 1 : 0) - (input.left ? 1 : 0);
  c.steer += (turnIn - c.steer) * Math.min(1, dt * 10);
  if (input.up && c.v >= 0) c.v += ACC * Math.max(0.08, 1 - c.v / top) * dt * 1.6;
  else if (input.down) c.v = c.v > 0 ? Math.max(0, c.v - BRAKE * dt) : Math.max(-46, c.v - 70 * dt);
  else if (input.up && c.v < 0) c.v = Math.min(0, c.v + BRAKE * dt);
  else c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), 34 * dt);                // rolling to a stop
  if (c.v > top) c.v = Math.max(top, c.v - (surf === 'grass' ? 190 : 60) * dt);   // the grass holds you back
  c.brake = !!input.down && c.v > 1;
  // turning: no tighter than the tyres hold (slow down for a hairpin), not at all standing still
  // (pressing the pedals, a stuck car can still turn a little, so it never sits nosed into a tree)
  const sp = Math.abs(c.v), pedal = input.up || input.down ? 9 : 0;
  const w = c.steer * Math.min(WMAX, GRIP / Math.max(30, sp)) * Math.min(1, Math.max(sp, pedal) / 12) * (input.down && c.v <= 0 ? -1 : Math.sign(c.v || 1));
  c.a = wrapA(c.a + w * dt);
  c.x += Math.cos(c.a) * c.v * dt; c.y += Math.sin(c.a) * c.v * dt;
  // dust off the grass
  if (surf === 'grass' && sp > 20 && Math.random() < dt * 30) c.dust.push({ x: c.x - Math.cos(c.a) * 10, y: c.y - Math.sin(c.a) * 6 + 2, t: 0, c: Math.random() < 0.5 ? '#a89a70' : '#8aa070' });
}

// the car's footprint on the screen: two circles along it (a car is 30 long, foreshortened going up and down)
function circles(c) {
  const h = Math.atan2(Math.sin(c.a) / KY, Math.cos(c.a)), f = Math.hypot(Math.cos(h), KY * Math.sin(h)), L = 8.5 * f;
  return [[c.x + Math.cos(c.a) * L, c.y + Math.sin(c.a) * L], [c.x - Math.cos(c.a) * L, c.y - Math.sin(c.a) * L]];
}
const R = 5.5;
/** Bumping into something (n: out of it, towards the car): the speed into it is lost, the car slides along it. */
function hit(c, nx, ny, cx, cy) {
  const dir = Math.sign(c.v || 1), into = (Math.cos(c.a) * nx + Math.sin(c.a) * ny) * dir;    // -1: head on
  if (into >= 0) return;
  // which end hit: the front glances the car round to slide along; the speed left is how glancing it was
  const front = (cx - c.x) * Math.cos(c.a) + (cy - c.y) * Math.sin(c.a) > 0 === dir > 0;
  c.v *= Math.max(0.15, 1 + into * 0.9);
  if (front) { const along = Math.cos(c.a) * -ny + Math.sin(c.a) * nx; c.a = wrapA(c.a + Math.sign(along || 1) * 0.04 * (1 + into)); }
  if (into < -0.5 && Math.abs(c.v) > 5) c.bump = 0.3;
}
function collide() {
  // into the trees, the tyres, the stands, off the map
  for (const c of cars) {
    for (const [cx, cy] of circles(c)) {
      for (const o of track.solids) {
        if (o.box) {
          const nx = Math.max(o.box.x, Math.min(cx, o.box.x + o.box.w)), ny = Math.max(o.box.y, Math.min(cy, o.box.y + o.box.h)), d = Math.hypot(cx - nx, cy - ny);
          if (d < R) { const ux = d ? (cx - nx) / d : 0, uy = d ? (cy - ny) / d : 1; c.x += ux * (R - d); c.y += uy * (R - d); hit(c, ux, uy, cx, cy); }
        } else {
          const d = Math.hypot(cx - o.x, cy - o.y), m = R + o.r;
          if (d < m && d > 0) { const ux = (cx - o.x) / d, uy = (cy - o.y) / d; c.x += ux * (m - d); c.y += uy * (m - d); hit(c, ux, uy, cx, cy); }
        }
      }
    }
    if (c.x < 12 || c.x > track.W - 12 || c.y < 12 || c.y > track.H - 6) { c.x = Math.max(12, Math.min(track.W - 12, c.x)); c.y = Math.max(12, Math.min(track.H - 6, c.y)); c.v *= 0.5; }
  }
  // into each other: pushed apart, the one behind slowed
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
    const A = cars[i], B = cars[j];
    if (Math.abs(A.x - B.x) > 40 || Math.abs(A.y - B.y) > 30) continue;
    for (const [ax, ay] of circles(A)) for (const [bx, by] of circles(B)) {
      const d = Math.hypot(ax - bx, ay - by);
      if (d >= R * 2 || d === 0) continue;
      const push = (R * 2 - d) / 2, ux = (ax - bx) / d, uy = (ay - by) / d;
      A.x += ux * push; A.y += uy * push; B.x -= ux * push; B.y -= uy * push;
      const back = score(A) < score(B) ? A : B;
      back.v *= 0.96;
    }
  }
}

/** Where a car is along the road: its sectors (in order, so cutting across does not count), laps, finish. */
function progress(c) {
  const { q } = track.near(c.x, c.y, c.idx);
  c.idx = q.i; c.s = q.s;
  const sec = sectorOf(q.s);
  if (sec === c.next) {
    c.next = (c.next + 1) % SECTORS;
    if (sec === 0) {                                     // over the line
      if (c.lap > 0) {
        const t = state.raceT - c.lapStart; c.laps.push(t); if (c.best === null || t < c.best) c.best = t;
        if (c.you && !AUTO && (record === null || t < record)) { record = t; try { localStorage.setItem(RECORD_KEY, String(t)); } catch { /* no storage */ } }
      }
      c.lap++; c.lapStart = state.raceT;
      if (c.lap > LAPS && c.finished === null) { c.finished = state.results.length; c.time = state.raceT; state.results.push(c); c.lap = LAPS; c.v *= 1; }
    }
  }
  // a cut: ahead of the next checkpoint without passing it (it does not count; drive back to it)
  const ahead = (sec - c.next + SECTORS) % SECTORS;
  c.cut = c.lap > 0 && ahead >= 1 && ahead < SECTORS / 2 ? (c.cut ?? 0) + 1 : 0;
  // going the wrong way: facing back along the road
  const facing = Math.cos(c.a - Math.atan2(q.ty, q.tx));
  c.wrong = facing < -0.3 && Math.abs(c.v) > 15 ? c.wrong + 1 : 0;
}

function step(dt) {
  if (state.paused) return;
  state.t += dt;
  if (state.phase === 'count') {
    track.lights.lit = Math.min(4, Math.floor(state.t / 0.75) + 1);
    if (state.t >= 3) { state.phase = 'race'; track.lights.go = true; state.go = state.t; }
  }
  const racing = state.phase !== 'count';
  if (racing) state.raceT += dt;
  for (const c of cars) {
    let input = { up: false, down: false };
    if (racing) {
      if (c.finished !== null) input = { ...think(c, dt), up: c.v < 50, down: c.v > 60 };   // a slow lap after the line
      else if (!c.you || AUTO) input = think(c, dt);
      else input = keys;
    } else if (c.you) input = { left: keys.left, right: keys.right };
    drive(c, dt, input);
  }
  collide();
  if (racing) for (const c of cars) progress(c);
  for (const c of cars) { c.dust = c.dust.filter((d) => (d.t += dt) < 0.5); c.bump = Math.max(0, (c.bump ?? 0) - dt); }
  const you = cars.find((c) => c.you);
  if (state.phase === 'race' && you.finished !== null) { state.phase = 'done'; state.doneT = state.t; }
}

// --- the screen -------------------------------------------------------------------------------
let dpx = 4, VW = 320, VH = 180;
const cam = { x: 0, y: 0, set: false };
function resize() {
  const dpr = window.devicePixelRatio || 1, cw = Math.round(innerWidth * dpr), ch = Math.round(innerHeight * dpr);
  canvas.width = cw; canvas.height = ch;
  dpx = Math.max(2, Math.round(Math.min(cw, ch) / 190));
  VW = Math.ceil(cw / dpx); VH = Math.ceil(ch / dpx);
}
addEventListener('resize', resize);
resize();

// a 3 x 5 pixel font for the race's signs
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
  H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101',
  O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111',
  V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111',
  7: '111001001001001', 8: '111101111101111', 9: '111101111001111', ':': '000010000010000', '.': '000000000000010', '/': '001001010100100', '!': '010010010000010',
  '+': '000010111010000', '-': '000000111000000', "'": '010010000000000', ' ': '000000000000000',
};
function text(s, x, y, sc = 1, col = '#f2f2ee') {
  let X = Math.round(x);
  for (const ch of String(s)) {
    const f = FONT[ch] ?? FONT[' '];
    g.fillStyle = col;
    for (let i = 0; i < 15; i++) if (f[i] === '1') g.fillRect(X + (i % 3) * sc, Math.round(y) + Math.floor(i / 3) * sc, sc, sc);
    X += 4 * sc;
  }
  return X;
}
const textW = (s, sc = 1) => String(s).length * 4 * sc - sc;
const panel = (x, y, w, h) => { g.fillStyle = 'rgba(24, 28, 36, 0.8)'; g.fillRect(Math.round(x), Math.round(y), w, h); };
const clock = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`; };
const ORD = (n) => (n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH');

function draw(t) {
  const you = cars.find((c) => c.you);
  // the view follows you, a little ahead of where you are going
  const tx = you.x + Math.cos(you.a) * you.v * 0.45 - VW / 2, ty = you.y + Math.sin(you.a) * you.v * 0.45 - VH * 0.52;
  if (!cam.set) { cam.x = tx; cam.y = ty; cam.set = true; }
  const k = 1 - Math.exp(-Math.min(0.1, t - (cam.t ?? t)) * 7.5); cam.t = t;   // (by time, the same on any screen's refresh rate)
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  const vx = Math.round(Math.max(0, Math.min(track.W - VW, cam.x))), vy = Math.round(Math.max(0, Math.min(track.H - VH, cam.y)));
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#20242c'; g.fillRect(0, 0, canvas.width, canvas.height);
  g.setTransform(dpx, 0, 0, dpx, 0, 0);
  g.drawImage(track.ground, vx, vy, Math.min(VW, track.W), Math.min(VH, track.H), 0, 0, Math.min(VW, track.W), Math.min(VH, track.H));
  g.save(); g.translate(-vx, -vy);
  const items = [];
  const cheer = state.phase === 'done' || (state.phase === 'race' && state.t - state.go < 2.5);
  for (const o of track.things) {
    const w = o.kind === 'stand' ? o.w : 30;
    if (o.x + w < vx - 4 || o.x - 30 > vx + VW || o.y < vy - 4 || o.y - 60 > vy + VH) continue;
    items.push({ y: o.y, draw: () => drawThing(g, o, t, cheer && o.kind === 'stand') });
  }
  for (const c of cars) {
    for (const d of c.dust) { g.fillStyle = d.c; g.fillRect(Math.round(d.x), Math.round(d.y - d.t * 8), 1, 1); }
    const heading = (Math.atan2(Math.sin(c.a) / KY, Math.cos(c.a)) * 180) / Math.PI;
    items.push({ y: c.y, draw: () => drawVehicle(g, { type: 'car', x: c.x, y: c.y, heading: (heading + 360) % 360, color: c.color, color2: '#2a2d32', seed: 1, brake: c.brake, you: c.you }) });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();
  g.restore();
  hud(you);
}

function hud(you) {
  const order = [...cars].sort((a, b) => score(b) - score(a)), pos = order.indexOf(you) + 1;
  const lap = Math.max(1, Math.min(LAPS, you.lap));
  // lap and time (top left), place (top right), speed (bottom right; above the buttons on a phone)
  panel(4, 4, 62, 27); text(`LAP ${lap}/${LAPS}`, 8, 8); text(clock(you.finished !== null ? you.time : state.raceT), 8, 18, 2, '#f2c230');
  panel(VW - 52, 4, 48, 27); const X = text(pos, VW - 47, 8, 4); text(ORD(pos), X - 2, 8); text(`/${cars.length}`, X - 2, 18, 2, '#b8bcc4');
  const touch = document.body.classList.contains('touch'), sy = touch ? 36 : VH - 22;
  panel(VW - 60, sy, 56, 18); const kmh = Math.round(Math.abs(you.v) * 1.1); text(kmh, VW - 56, sy + 4, 2); text('KM/H', VW - 21, sy + 10, 1, '#b8bcc4');
  if (you.best !== null) { panel(4, 33, 62, 11); text(`BEST ${clock(you.best)}`, 7, 36, 1, '#b8bcc4'); }
  // the start: 3, 2, 1, GO!
  const mid = (s, y, sc, col) => text(s, Math.round(VW / 2 - textW(s, sc) / 2), y, sc, col);
  if (state.phase === 'count') { const n = 3 - Math.floor(state.t); panel(VW / 2 - 16, VH * 0.22, 32, 34); mid(n, VH * 0.22 + 5, 5, '#ff4030'); }
  else if (state.t - state.go < 1) { panel(VW / 2 - 34, VH * 0.22, 68, 34); mid('GO!', VH * 0.22 + 5, 5, '#3fbf5a'); }
  // the last lap, the wrong way
  if (state.phase === 'race' && you.lap === LAPS && state.raceT - you.lapStart < 2 && Math.floor(state.t * 4) % 2) { panel(VW / 2 - 44, VH * 0.22, 88, 15); mid('FINAL LAP', VH * 0.22 + 4, 2, '#f2c230'); }
  if (you.wrong > 40 && Math.floor(state.t * 3) % 2) { panel(VW / 2 - 46, VH * 0.36, 92, 15); mid('WRONG WAY', VH * 0.36 + 4, 2, '#ff4030'); }
  if (you.cut > 60 && Math.floor(state.t * 3) % 2) { const m = 'MISSED A TURN: GO BACK'; panel(VW / 2 - textW(m) / 2 - 5, VH * 0.46, textW(m) + 10, 11); mid(m, VH * 0.46 + 3, 1, '#ff4030'); }
  if (state.paused) { panel(VW / 2 - 34, VH / 2 - 12, 68, 22); mid('PAUSED', VH / 2 - 7, 2); }
  if (state.phase === 'done') results();
}

function results() {
  const W = 140, rows = cars.length, H = 34 + rows * 10 + 24, x = Math.round(VW / 2 - W / 2), y = Math.round(Math.max(36, VH / 2 - H / 2));
  panel(x, y, W, H);
  const you = cars.find((c) => c.you), mine = you.finished + 1;
  const title = mine === 1 ? 'YOU WIN!' : `${mine}${ORD(mine)} PLACE`;
  text(title, x + Math.round(W / 2 - textW(title, 2) / 2), y + 6, 2, mine === 1 ? '#f2c230' : '#f2f2ee');
  const order = [...cars].sort((a, b) => score(b) - score(a));
  order.forEach((c, i) => {
    const Y = y + 32 + i * 10, col = c.you ? '#f2c230' : '#f2f2ee';
    text(`${i + 1}`, x + 8, Y, 1, col); g.fillStyle = c.color; g.fillRect(x + 16, Y, 5, 5);
    text(c.name, x + 25, Y, 1, col);
    const lapsBehind = LAPS - c.lap;
    text(c.finished !== null ? clock(c.time) : lapsBehind > 0 ? `+${lapsBehind} LAP` : 'RACING', x + 56, Y, 1, col);
    if (c.best !== null) text(clock(c.best), x + 96, Y, 1, '#8a9098');
  });
  text('TIME', x + 56, y + 23, 1, '#8a9098'); text('BEST LAP', x + 96, y + 23, 1, '#8a9098');
  const beat = state.oldRecord !== null && you.best !== null && you.best < state.oldRecord;
  if (record !== null) { const s = `${beat ? 'NEW ' : ''}TRACK RECORD ${clock(record)}`; text(s, x + Math.round(W / 2 - textW(s) / 2), y + H - 20, 1, beat ? '#3fbf5a' : '#8a9098'); }
  const again = document.body.classList.contains('touch') ? 'TAP TO RACE AGAIN' : 'R: RACE AGAIN';
  if (state.t - state.doneT > 1.5) text(again, x + Math.round(W / 2 - textW(again) / 2), y + H - 9, 1, '#f2c230');
}

// --- the controls ---------------------------------------------------------------------------
const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
addEventListener('keydown', (e) => {
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  else if (e.code === 'KeyR') { newRace(); cam.set = false; }
  else if (e.code === 'KeyP' && state.phase !== 'done') state.paused = !state.paused;
});
addEventListener('keyup', (e) => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.phase !== 'done') state.paused = true; });   // away from the tab: paused
if ('ontouchstart' in window || matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
for (const b of document.querySelectorAll('.pad button')) {
  const k = b.dataset.key, on = (v) => (e) => { e.preventDefault(); keys[k] = v; b.classList.toggle('on', v); if (v) b.setPointerCapture?.(e.pointerId); };
  b.addEventListener('pointerdown', on(true)); b.addEventListener('pointerup', on(false)); b.addEventListener('pointercancel', on(false)); b.addEventListener('lostpointercapture', on(false));
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
canvas.addEventListener('pointerdown', () => { if (state.phase === 'done' && state.t - state.doneT > 1.5) { newRace(); cam.set = false; } });
document.getElementById('full').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {});
});
document.addEventListener('fullscreenchange', () => { document.querySelector('#full .wide').textContent = document.fullscreenElement ? 'Exit full screen (Esc)' : 'Full screen'; });

// --- the loop -------------------------------------------------------------------------------
newRace();
let last = performance.now(), acc = 0, frameMs = 0;
const DT = 1 / 120;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  const t0 = performance.now();
  while (acc >= DT) { step(DT); acc -= DT; }
  draw(now / 1000);
  frameMs = frameMs * 0.95 + (performance.now() - t0) * 0.05;       // (for checks: window.tinyRace.ms())
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
