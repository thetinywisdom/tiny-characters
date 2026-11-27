// Tiny Nature: trees, bushes and terrains in the same small pixel style as
// the people and buildings.
//
//   drawTree(g, { type, x, y, seed, scale, t })  centred on x, its foot at y; t: it sways in the breeze
//   drawBush(g, { type, x, y, seed, scale })
//   drawTerrain(g, { type, x, y, w, h, seed, scale, t })   fills a rectangle
//   TREES, BUSHES: type -> { label, w, h }   TERRAINS: type -> { label }
//   plantScale(type)  1.5 once the tree or bush is drawn at full size (tinyNatureFull.js)
//
// The seed picks one of 8 looks of a tree or bush (where its flowers, fruit
// and blossom fall) and mirrors it; a terrain's seed moves its pattern.
// Like the buildings, everything scales with crisp pixels (scale 1.5 in the
// town): patterns repeat on even steps.

import { makePainter, usesFull } from './tinyBuildings.js';
import { FULL_TREES, FULL_BUSHES } from './tinyNatureFull.js';
import { canvasOf, seeded, shade } from './tinyCharacters.js';

const BARK = '#6b4a2a', DARK_BARK = '#4a3424';

// --- pieces (r: the buildings' painter, (dx, up) from the bottom left) ---------
/** A rounded clump of leaves: an ellipse lit from the top left, darker below and on the right. */
function blob(r, cx, cy, rx, ry, c) {
  const light = shade(c, 1.18), dark = shade(c, 0.78);
  for (let j = -ry; j <= ry; j++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.6))));
    const col = j <= -Math.ceil(ry * 0.45) ? dark : c;
    r(col, cx - hw, cy + j, hw * 2 + 1, 1);
    if (hw > 1) r(dark, cx + hw, cy + j, 1, 1);
    if (j >= Math.floor(ry * 0.3) && hw > 1) r(light, cx - hw + 1, cy + j, Math.max(1, Math.round(hw * 0.7)), 1);
  }
}
/** Dots scattered over an ellipse (fruit, flowers, blossom), on even steps. */
function sprinkle(r, rng, cx, cy, rx, ry, colours, n) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * 0.85;
    const dx = Math.round(Math.cos(a) * rx * d / 2) * 2, dy = Math.round(Math.sin(a) * ry * d / 2) * 2;
    r(colours[Math.floor(rng() * colours.length)], cx + dx, cy + dy, 1, 1);
  }
}
const trunk = (r, cx, h, c = BARK, w = 2) => { r(c, cx - Math.floor(w / 2), 0, w, h); r(shade(c, 0.75), cx - Math.floor(w / 2) + w - 1, 0, 1, h); };

// --- trees: [label, width, height, draw(r, rng, cx)] --------------------------
const TREE_DEFS = {
  oak: ['Oak', 19, 22, (r, rng, cx) => {
    trunk(r, cx, 9, BARK, 3);
    blob(r, cx - 3, 12, 6, 5, '#5f8f4a'); blob(r, cx + 3, 13, 6, 5, '#5f8f4a'); blob(r, cx, 16, 7, 5, '#6a9a52');
  }],
  maple: ['Japanese maple', 17, 19, (r, rng, cx) => {
    trunk(r, cx, 7, DARK_BARK);
    blob(r, cx - 3, 10, 5, 4, '#c8402c'); blob(r, cx + 3, 11, 5, 4, '#d85a34'); blob(r, cx, 14, 6, 4, '#e8703a');
    sprinkle(r, rng, cx, 12, 7, 5, ['#f2a040', '#a8301f'], 8);
  }],
  sakura: ['Cherry blossom', 19, 20, (r, rng, cx) => {
    trunk(r, cx, 8, '#4a3434', 2);
    r('#4a3434', cx - 4, 8, 4, 1); r('#4a3434', cx + 2, 9, 4, 1);           // branches
    blob(r, cx - 4, 12, 5, 4, '#f2b8c8'); blob(r, cx + 4, 12, 5, 4, '#f2b8c8'); blob(r, cx, 15, 6, 4, '#f6c8d4');
    sprinkle(r, rng, cx, 13, 8, 5, ['#ffffff', '#e898b0'], 10);
    for (let i = 0; i < 5; i++) r('#f2b8c8', cx - 8 + Math.floor(rng() * 8) * 2, 0, 1, 1);   // petals on the ground
  }],
  pine: ['Japanese pine', 21, 21, (r, rng, cx) => {
    
    r(DARK_BARK, cx - 1, 0, 2, 6); r(DARK_BARK, cx, 6, 2, 5); r(DARK_BARK, cx + 1, 11, 2, 5); r(DARK_BARK, cx - 4, 9, 4, 1);  // a crooked trunk
    blob(r, cx - 5, 10, 5, 2, '#3f6a44'); blob(r, cx + 4, 14, 6, 2, '#3f6a44'); blob(r, cx + 1, 18, 4, 2, '#4a7a4e');
  }],
  cedar: ['Cedar', 11, 32, (r, rng, cx) => {
    trunk(r, cx, 4, BARK);
    for (let k = 0; k < 28; k++) {                                         // a tall narrow cone
      const hw = Math.max(0, Math.round(5 - k * 5 / 28));
      r(k % 4 === 1 ? '#2f5a3c' : '#3a6a48', cx - hw, 4 + k, hw * 2 + 1, 1);
      if (hw > 0) r('#2a4a34', cx + hw, 4 + k, 1, 1);
    }
  }],
  fir: ['Fir', 15, 24, (r, rng, cx) => {
    trunk(r, cx, 4, BARK);
    for (const [base, w, h] of [[3, 7, 8], [9, 6, 7], [15, 4, 7]]) {      // three tiers
      for (let k = 0; k < h; k++) { const hw = Math.round(w - k * w / h); r(k === 0 ? '#2f5a3c' : '#3f7048', cx - hw, base + k, hw * 2 + 1, 1); r('#2a4a34', cx + hw, base + k, 1, 1); }
    }
  }],
  birch: ['Birch', 15, 22, (r, rng, cx) => {
    
    r('#eeeae0', cx - 1, 0, 2, 14); r('#d8d4ca', cx, 0, 1, 14); for (const y of [2, 6, 10]) r(INKISH, cx - 1, y, 2, 1);   // white bark with dark bands
    blob(r, cx, 16, 5, 6, '#8ab45a');
    sprinkle(r, rng, cx, 16, 5, 6, ['#a8c870'], 6);
  }],
  palm: ['Palm', 19, 24, (r, rng, cx) => {
    
    for (let k = 0; k < 18; k += 2) { const x = cx - 1 + Math.round(k / 6); r('#b89a6a', x, k, 2, 2); r('#8a7048', x, k + 1, 2, 1); }   // ringed, leaning trunk
    const top = cx + 2;
    for (const [dx, dy] of [[-1, 0], [-2, -1], [-3, -1], [-4, -2], [-5, -3], [1, 0], [2, -1], [3, -1], [4, -2], [5, -3], [0, 1], [-1, 2], [1, 2]]) { r('#4a8a4e', top + dx, 19 + dy, 1, 1); r('#3a7040', top + dx, 18 + dy, 1, 1); }   // fronds, 2 thick
    for (const [dx, dy] of [[-6, -4], [6, -4], [-2, 2], [2, 2], [-7, -5], [7, -5]]) r('#3a7040', top + dx, 19 + dy, 1, 1);
    r('#6a4a2a', top - 1, 17, 1, 1); r('#6a4a2a', top + 1, 17, 1, 1);      // coconuts
  }],
  willow: ['Weeping willow', 21, 20, (r, rng, cx) => {
    trunk(r, cx, 9, BARK);
    blob(r, cx, 14, 9, 5, '#8aa85a');
    for (let i = -8; i <= 8; i += 2) r(i % 4 ? '#7a9a4e' : '#9ab86a', cx + i, 3 + Math.abs(i) % 3, 1, 9);   // hanging strands
  }],
  ginkgo: ['Ginkgo', 15, 22, (r, rng, cx) => {
    trunk(r, cx, 8, BARK);
    blob(r, cx, 14, 6, 7, '#e8c040');
    sprinkle(r, rng, cx, 14, 6, 7, ['#f2d860', '#c8a030'], 8);
    for (let i = 0; i < 4; i++) r('#e8c040', cx - 6 + Math.floor(rng() * 6) * 2, 0, 1, 1);
  }],
  bamboo: ['Bamboo', 15, 26, (r, rng, cx) => {
    
    for (const [dx, h] of [[-5, 20], [-2, 24], [1, 22], [4, 19]]) {
      r('#6aa04a', cx + dx, 0, 1, h); for (let y = 3; y < h; y += 4) r('#4a7a34', cx + dx, y, 1, 1);   // stalks and joints
      r('#5a9a44', cx + dx - 2, h - 2, 2, 1); r('#7ab45a', cx + dx + 1, h - 1, 2, 1); r('#5a9a44', cx + dx - 1, h, 3, 1);  // leaves at the top
    }
  }],
  apple: ['Apple tree', 17, 18, (r, rng, cx) => {
    trunk(r, cx, 7, BARK, 2);
    blob(r, cx, 12, 7, 5, '#5f9a4a');
    sprinkle(r, rng, cx, 12, 7, 5, ['#d8443c', '#e8603a'], 9);
  }],
  poplar: ['Poplar', 9, 28, (r, rng, cx) => {
    trunk(r, cx, 5, BARK);
    blob(r, cx, 16, 3, 11, '#5f9a4e');
  }],
  cypress: ['Cypress', 9, 25, (r, rng, cx) => {
    trunk(r, cx, 3, DARK_BARK);
    for (let k = 0; k < 21; k++) {                                         // a dark flame
      const hw = k < 6 ? Math.min(3, 1 + Math.floor(k / 2)) : Math.max(0, Math.round(3 - (k - 6) * 3 / 15));
      r(k % 4 === 2 ? '#2a4a34' : '#355a40', cx - hw, 3 + k, hw * 2 + 1, 1);
    }
  }],
  bare: ['Bare tree (winter)', 17, 20, (r, rng, cx) => {
    trunk(r, cx, 10, '#5a4a3a', 2);
    const B = '#5a4a3a';
    for (const [x, y, dx] of [[cx, 10, -1], [cx + 1, 10, 1], [cx - 3, 13, -1], [cx + 4, 13, 1], [cx, 13, 0]]) for (let k = 0; k < 5; k++) r(B, x + dx * k, y + k, 1, 1);
    for (const [x, y] of [[cx - 6, 17], [cx - 4, 18], [cx + 6, 17], [cx + 3, 18], [cx, 18], [cx - 2, 16], [cx + 2, 16]]) r(shade(B, 0.85), x, y, 1, 1);
  }],
};
const INKISH = '#3a3a3a';

// --- bushes ---------------------------------------------------------------------
const BUSH_DEFS = {
  round: ['Round shrub', 11, 8, (r, rng, cx) => { blob(r, cx, 4, 5, 3, '#5f8f4a'); }],
  hedge: ['Boxwood hedge', 15, 7, (r, rng, cx) => {
    r('#4a7a3e', cx - 7, 0, 15, 6); r('#5f8f4a', cx - 7, 4, 15, 2); r('#6f9f58', cx - 6, 5, 13, 1);
    for (let i = -6; i < 7; i += 4) r('#3f6a36', cx + i, 1, 1, 1);
  }],
  azalea: ['Azalea', 11, 8, (r, rng, cx) => { blob(r, cx, 4, 5, 3, '#4f7f42'); sprinkle(r, rng, cx, 4, 5, 3, ['#e870a0', '#f2a0c0'], 10); }],
  hydrangea: ['Hydrangea', 11, 8, (r, rng, cx) => {
    blob(r, cx, 4, 5, 3, '#4f7f42');
    for (const [dx, dy] of [[-3, 4], [1, 5], [3, 3], [-1, 2]]) { const c = rng() < 0.5 ? '#7a8ad8' : '#a080c8'; r(c, cx + dx, dy, 2, 2); r(shade(c, 1.2), cx + dx, dy + 1, 1, 1); }
  }],
  rose: ['Rose bush', 11, 8, (r, rng, cx) => { blob(r, cx, 4, 5, 3, '#3f6a3a'); sprinkle(r, rng, cx, 4, 5, 3, ['#d8303a', '#e85060'], 7); }],
  lavender: ['Lavender', 11, 8, (r, rng, cx) => {
    r('#7a9a6a', cx - 4, 0, 9, 2);
    for (let i = -4; i <= 4; i += 2) { const h = 4 + Math.floor(rng() * 3); r('#7a9a6a', cx + i, 2, 1, h - 2); r('#9a7ac8', cx + i, h, 1, 2); }
  }],
  fern: ['Fern', 13, 7, (r, rng, cx) => {
    
    for (const [dir, len] of [[-1, 5], [1, 5], [-1, 3], [1, 3], [0, 5]]) for (let k = 0; k < len; k++) r(k % 2 ? '#4a8a44' : '#5f9f52', cx + dir * k, Math.min(6, 1 + k + (dir ? 0 : 1)) - (dir && k > 2 ? 1 : 0), 1, 1);
  }],
  pampas: ['Pampas grass', 11, 14, (r, rng, cx) => {
    r('#8a9a6a', cx - 3, 0, 7, 3);
    for (const [dx, h] of [[-3, 10], [-1, 13], [1, 12], [3, 9]]) { r('#9aa878', cx + dx, 2, 1, h - 5); r('#eee4c8', cx + dx, h - 3, 1, 3); r('#e0d4b0', cx + dx, h - 4, 1, 1); }
  }],
  holly: ['Holly (berries)', 11, 8, (r, rng, cx) => { blob(r, cx, 4, 5, 3, '#2f5a36'); sprinkle(r, rng, cx, 4, 5, 3, ['#d8303a'], 6); }],
  cactus: ['Cactus', 9, 12, (r, rng, cx) => {
    r('#5a9a54', cx - 1, 0, 3, 11); r('#4a8044', cx + 1, 0, 1, 11);
    r('#5a9a54', cx - 3, 4, 2, 1); r('#5a9a54', cx - 3, 5, 1, 3); r('#5a9a54', cx + 2, 6, 2, 1); r('#5a9a54', cx + 3, 7, 1, 2);   // arms
    r('#e870a0', cx, 11, 1, 1);                                            // a flower
  }],
};

/** Trees: type -> { label, w, h }. */
export const TREES = Object.fromEntries(Object.entries(TREE_DEFS).map(([k, [label, w, h]]) => [k, { label, w, h }]));
/** Bushes: type -> { label, w, h }. */
export const BUSHES = Object.fromEntries(Object.entries(BUSH_DEFS).map(([k, [label, w, h]]) => [k, { label, w, h }]));

// Plants are drawn once at their real size into a small image, then placed
// at the scale asked for (nearest pixel, no smoothing). Drawing them
// straight at 1.5 made their rows of leaves overlap or miss: stripes. In the
// town the canvas is drawn 4 times bigger underneath, so 1.5 comes out as
// exactly 6 screen pixels per plant pixel.
const VARIANTS = 8;                 // looks per plant type (the seed picks one, and mirrors it)
const cache = new Map();
const MX = 10, MY = 8;              // room round a plant for what sticks out (fronds, strands, shadow)
// A plant redrawn at full size (tinyNatureFull.js, once approved) is made for the town's
// scale 1.5: its image is 1.5 times bigger (margins too) and placed at scale / 1.5.
function plantImage(defs, fulls, type, variant, salt) {
  const f = usesFull(fulls[type]) ? fulls[type] : null;
  const key = `${salt}:${type}:${variant}${f ? ':f' : ''}`;
  if (cache.has(key)) return cache.get(key);
  const [, w1, h1, draw1] = defs[type];
  const K = f ? 1.5 : 1, w = Math.round(w1 * K), h = Math.round(h1 * K), mx = Math.round(MX * K), my = Math.round(MY * K);
  const cw = w + mx * 2, ch = h + my * 2;
  const c = canvasOf(cw, ch);
  (f ? f.draw : draw1)(makePainter(c.getContext('2d'), mx, h + my, 1), seeded(variant * 131 + salt), Math.floor(w / 2));
  const img = { c, cw, ch, w, h, mx, my, K };
  cache.set(key, img);
  return img;
}
function drawPlant(defs, fulls, g, p, salt) {
  if (!defs[p.type]) return;
  const seed = p.seed ?? 0;
  const { c, cw, ch, w, h, mx, my, K } = plantImage(defs, fulls, p.type, seed % VARIANTS, salt), k = (p.scale ?? 1) / K;
  const flip = seed % 2 === 1;                                           // the seed mirrors it too
  const x0 = p.x - (mx + w / 2) * k, y0 = p.y - (h + my) * k;
  const smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  if (p.t !== undefined && defs === TREE_DEFS) { breeze(g, c, cw, ch, h, my, k, x0, y0, flip, p); g.imageSmoothingEnabled = smooth; return; }
  if (flip) { g.save(); g.translate(x0 + cw * k, y0); g.scale(-1, 1); g.drawImage(c, 0, 0, cw * k, ch * k); g.restore(); }
  else g.drawImage(c, x0, y0, cw * k, ch * k);
  g.imageSmoothingEnabled = smooth;
}
// The breeze (the owner chose B, gusts, Nov 2026; trees only): waves of wind roll across the
// town from the left; each tree's crown leans up to 2 of its pixels and settles, the trunk
// (the lowest 30%) stays still. Every row of the image is shifted by a whole number of
// pixels, more towards the top, so it stays pixel art. Each tree is a little out of step
// (its place and seed).
function breeze(g, c, cw, ch, h, my, k, x0, y0, flip, p) {
  const t = p.t, ph = p.x * 0.02 + p.y * 0.013 + (p.seed ?? 0) * 0.7;
  const gust = 0.5 + 0.5 * Math.sin(t * 0.55 - p.x * 0.012);             // the gust's wave across the town
  const s = Math.sin(t * 1.6 - ph) * (0.35 + 0.65 * gust) + 0.45 * gust;
  const foot = my + h, AMP = 2, FROM = 0.3;
  const shift = (y) => { const rel = (foot - y) / h; return rel <= FROM ? 0 : Math.round(AMP * s * Math.pow(Math.min(1, (rel - FROM) / (1 - FROM)), 1.3)); };
  for (let y = 0; y < ch;) {
    const d = shift(y); let e = y + 1; while (e < ch && shift(e) === d) e++;   // rows that move together, drawn as one slice
    if (flip) { g.save(); g.translate(x0 + cw * k + d * k, y0); g.scale(-1, 1); g.drawImage(c, 0, y, cw, e - y, 0, y * k, cw * k, (e - y) * k); g.restore(); }
    else g.drawImage(c, 0, y, cw, e - y, x0 + d * k, y0 + y * k, cw * k, (e - y) * k);
    y = e;
  }
}
/** Draw a tree { type, x, y, seed, scale, t }: centred on x, its foot at y; with t (seconds) it sways in the breeze. */
export function drawTree(g, p) { drawPlant(TREE_DEFS, FULL_TREES, g, p, 17); }
/** Draw a bush { type, x, y, seed, scale }: centred on x, its foot at y. */
export function drawBush(g, p) { drawPlant(BUSH_DEFS, FULL_BUSHES, g, p, 23); }
/** The scale a tree or bush is best shown at: 1.5 (the town's) once it is drawn at full size, else 1. */
export const plantScale = (type) => (usesFull(FULL_TREES[type] ?? FULL_BUSHES[type]) ? 1.5 : 1);

// --- terrains -------------------------------------------------------------------
/** Terrains: type -> { label }. */
export const TERRAINS = {
  grass: { label: 'Grass' }, meadow: { label: 'Meadow (flowers)' }, tallGrass: { label: 'Tall grass' },
  dirt: { label: 'Dirt' }, sand: { label: 'Sand' }, gravel: { label: 'Gravel' }, cobble: { label: 'Cobblestones' },
  water: { label: 'Water' }, snow: { label: 'Snow' }, paddy: { label: 'Rice paddy' },
};
/**
 * Fill the rectangle (x, y, w, h) with a terrain { type, seed, scale, t }.
 * t (seconds) moves the water's ripples. Patterns sit on a grid of whole
 * pixels (2 per pixel at scale 1.5), so they stay even.
 */
export function drawTerrain(g, { type, x, y, w, h, seed = 1, scale = 1, t = 0 }) {
  const rng = seeded(seed * 977 + 5), c = Math.max(1, Math.round(scale));   // c: the size of one pattern pixel
  const R = (col, px, py, pw = c, ph = c) => { g.fillStyle = col; g.fillRect(x + px, y + py, pw, ph); };
  const each = (step, fn) => { for (let py = 0; py < h; py += step * c) for (let px = 0; px < w; px += step * c) fn(px, py); };
  const dots = (n, colours, pw = c, ph = c) => { for (let i = 0; i < n; i++) R(colours[Math.floor(rng() * colours.length)], Math.floor(rng() * w / c) * c, Math.floor(rng() * h / c) * c, pw, ph); };
  const area = (w * h) / (c * c);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();                   // patterns stay inside
  switch (type) {
    case 'grass': R('#9fb08d', 0, 0, w, h); dots(area / 30, ['#93a582', '#aabb98'], 2 * c, c); break;
    case 'meadow': R('#a4b48e', 0, 0, w, h); dots(area / 40, ['#93a582']); dots(area / 50, ['#f2efe8', '#f2c230', '#e870a0', '#9a7ac8']); break;
    case 'tallGrass':
      R('#8fa47a', 0, 0, w, h);
      each(4, (px, py) => { const o = Math.floor(rng() * 3) * c; R('#7a9466', px + o, py, c, 2 * c); R('#a8bc90', px + o + c, py + c, c, c); });
      break;
    case 'dirt': R('#a88a68', 0, 0, w, h); dots(area / 25, ['#967858', '#b89a78']); dots(area / 120, ['#8a7a6a', '#c8b498'], 2 * c, c); break;
    case 'sand': R('#e6d2a0', 0, 0, w, h); for (let py = 3 * c; py < h; py += 6 * c) for (let px = Math.floor(rng() * 6) * c; px < w; px += 12 * c) R('#d8c290', px, py, 4 * c, c); dots(area / 60, ['#f0e0b8']); break;
    case 'gravel': R('#c8c2b4', 0, 0, w, h); dots(area / 6, ['#b0aa9c', '#dcd6c8', '#a09a8c']); break;
    case 'cobble':
      R('#8f8a80', 0, 0, w, h);
      for (let row = 0, py = 0; py < h; row++, py += 4 * c) for (let px = (row % 2) * 3 * c; px < w; px += 6 * c) {
        const v = rng(); R(v < 0.33 ? '#b8b2a6' : v < 0.66 ? '#aaa498' : '#c4beb2', px, py, 5 * c, 3 * c); R('#d4cec2', px, py, 5 * c, c);
      }
      break;
    case 'water': {
      R('#6a9ac0', 0, 0, w, h);
      const shift = Math.floor(t * 2) % 2;
      for (let py = 2 * c, row = 0; py < h; py += 6 * c, row++) for (let px = ((row + shift) % 2) * 6 * c; px < w; px += 12 * c) R('#8ab8d8', px, py, 4 * c, c);
      dots(area / 200, ['#c8e0f0']);
      break;
    }
    case 'snow': R('#eef2f4', 0, 0, w, h); dots(area / 30, ['#dce4ec', '#ffffff']); dots(area / 300, ['#c8d4e0'], 2 * c, c); break;
    case 'paddy':
      R('#7a8a6a', 0, 0, w, h);                                           // muddy water
      for (let py = 2 * c; py < h; py += 4 * c) for (let px = 2 * c; px < w; px += 4 * c) { R('#6aa04a', px, py - c, c, 2 * c); R('#8ac060', px, py - c, c, c); }   // rows of rice
      break;
    default: R('#9fb08d', 0, 0, w, h);
  }
  g.restore();
}
