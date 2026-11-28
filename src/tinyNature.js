// Tiny Nature: trees, bushes and terrains in the same small pixel style as
// the people and buildings.
//
//   drawTree(g, { type, x, y, seed, scale, t, season })  centred on x, its foot at y; t: it sways in the breeze
//   drawBush(g, { type, x, y, seed, scale, season })     season: 'spring' | 'summer' | 'autumn' | 'winter' (none: as drawn)
//   SEASONS, groundInSeason(canvas, season)   the seasons; a town's ground canvas put in a season
//   drawTerrain(g, { type, x, y, w, h, seed, scale, t })   fills a rectangle
//   TREES, BUSHES: type -> { label, w, h }   TERRAINS: type -> { label }
//   plantScale(type)  the scale a plant is drawn pixel for pixel at (1.5)
//
// The seed picks one of 8 looks of a tree or bush (where its flowers, fruit
// and blossom fall) and mirrors it; a terrain's seed moves its pattern.
// Everything is drawn at full size (tinyNatureFull.js, src/full/n*.js, t1.js):
// one pixel = one person pixel at the town's scale, 1.5.

import { makePainter, usesFull } from './tinyBuildings.js';
import { FULL_TREES, FULL_BUSHES, FULL_TERRAINS } from './tinyNatureFull.js';
import { canvasOf, seeded } from './tinyCharacters.js';

// --- trees and bushes: [label, width, height] at scale 1 (the drawings, in tinyNatureFull.js,
// are made for the town's scale 1.5 and fill about width x height times 1.5) ----------
const TREE_DEFS = {
  oak: ['Oak', 19, 22],
  maple: ['Japanese maple', 17, 19],
  sakura: ['Cherry blossom', 19, 20],
  pine: ['Japanese pine', 21, 21],
  cedar: ['Cedar', 11, 32],
  fir: ['Fir', 15, 24],
  birch: ['Birch', 15, 22],
  palm: ['Palm', 19, 24],
  willow: ['Weeping willow', 21, 20],
  ginkgo: ['Ginkgo', 15, 22],
  bamboo: ['Bamboo', 15, 26],
  apple: ['Apple tree', 17, 18],
  poplar: ['Poplar', 9, 28],
  cypress: ['Cypress', 9, 25],
  bare: ['Bare tree (winter)', 17, 20],
};

// --- bushes ---------------------------------------------------------------------
const BUSH_DEFS = {
  round: ['Round shrub', 11, 8],
  hedge: ['Boxwood hedge', 15, 7],
  azalea: ['Azalea', 11, 8],
  hydrangea: ['Hydrangea', 11, 8],
  rose: ['Rose bush', 11, 8],
  lavender: ['Lavender', 11, 8],
  fern: ['Fern', 13, 7],
  pampas: ['Pampas grass', 11, 14],
  holly: ['Holly (berries)', 11, 8],
  cactus: ['Cactus', 9, 12],
};

/** Trees: type -> { label, w, h }. */
export const TREES = Object.fromEntries(Object.entries(TREE_DEFS).map(([k, [label, w, h]]) => [k, { label, w, h }]));
/** Bushes: type -> { label, w, h }. */
export const BUSHES = Object.fromEntries(Object.entries(BUSH_DEFS).map(([k, [label, w, h]]) => [k, { label, w, h }]));

// Plants are drawn once into a small image (one of 8 looks per type, made for the town's
// scale 1.5: tinyNatureFull.js), then placed at the scale asked for (nearest pixel).
const VARIANTS = 8;                 // looks per plant type (the seed picks one, and mirrors it)
const cache = new Map();
const MX = 15, MY = 12;             // room round a plant for what sticks out (fronds, strands, petals)
function plantImage(defs, fulls, type, variant, salt, season = null) {
  const f = usesFull(fulls[type]) ? fulls[type] : null;
  if (!f) return null;
  const key = `${salt}:${type}:${variant}:${season ?? ''}`;
  if (cache.has(key)) return cache.get(key);
  const [, w1, h1] = defs[type];
  const K = 1.5, w = Math.round(w1 * K), h = Math.round(h1 * K), mx = MX, my = MY;
  const cw = w + mx * 2, ch = h + my * 2;
  const c = canvasOf(cw, ch);
  f.draw(makePainter(c.getContext('2d'), mx, h + my, 1), seeded(variant * 131 + salt), Math.floor(w / 2));
  inSeason(c, type, variant, season);
  const img = { c, cw, ch, w, h, mx, my, K };
  cache.set(key, img);
  return img;
}
function drawPlant(defs, fulls, g, p, salt) {
  if (!defs[p.type]) return;
  const season = SEASONS.includes(p.season) ? p.season : null;           // no season: as drawn
  // in winter leafy trees stand bare (the bare tree's drawing), with snow on them
  const type = season === 'winter' && defs === TREE_DEFS && !EVERGREEN.includes(p.type) ? 'bare' : p.type;
  const seed = p.seed ?? 0, img = plantImage(defs, fulls, type, seed % VARIANTS, salt, season);
  if (!img) return;
  const { c, cw, ch, w, h, mx, my, K } = img, k = (p.scale ?? 1) / K;
  const flip = seed % 2 === 1;                                           // the seed mirrors it too
  const x0 = p.x - (mx + w / 2) * k, y0 = p.y - (h + my) * k;
  const smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  if (p.t !== undefined && defs === TREE_DEFS) { breeze(g, c, cw, ch, h, my, k, x0, y0, flip, p); g.imageSmoothingEnabled = smooth; return; }
  if (flip) { g.save(); g.translate(x0 + cw * k, y0); g.scale(-1, 1); g.drawImage(c, 0, 0, cw * k, ch * k); g.restore(); }
  else g.drawImage(c, x0, y0, cw * k, ch * k);
  g.imageSmoothingEnabled = smooth;
}
// --- seasons (the owner chose all four from mock-ups, Nov 2026) ---------------------------
// A plant's image is drawn as in summer, then put in its season: its leaf greens (and the
// cherry's blossom) are mapped, darkest to lightest, onto a ramp of the season's colours, so
// it keeps its shading and stays on a few clean colours. Spring: fresh light greens on leafy
// plants, the cherry in blossom. Summer: as drawn, the cherry in leaf. Autumn: leafy trees red,
// orange or gold (by look), the cherry orange, bushes a little browner; evergreens stay. Winter:
// leafy trees bare (see drawPlant), snow on every top edge of a tree or bush.
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const EVERGREEN = ['pine', 'cedar', 'fir', 'cypress', 'bamboo', 'palm', 'round', 'hedge', 'holly', 'fern'];
const RAMPS = {
  spring: ['#3f6a2a', '#5a8a34', '#78a844', '#98c458', '#b8dc78'],
  summerCherry: ['#2f5a2e', '#3f7038', '#548a44', '#6aa052', '#86b864'],
  autumn: [['#5a1e14', '#82281a', '#a83a24', '#cc5a2c', '#e8844a'], ['#6a3412', '#94501c', '#bc7026', '#dc9634', '#f0bc5a'], ['#5e4a12', '#86701c', '#ae9426', '#d0b634', '#ecd65a']],
  autumnBush: ['#4a4a24', '#62602c', '#7a7434', '#948a40', '#ae9e52'],
};
const SNOW_LIT = '#f2f5f8', SNOW_SHADE = '#d6dee8';
const rgbOf = (d, i) => [d[i], d[i + 1], d[i + 2]];
function hueSat([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return [0, 0, (mx + mn) / 510];
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4, l = (mx + mn) / 510;
  return [h / 6, d / 255 / (1 - Math.abs(2 * l - 1) || 1), l];
}
const isLeaf = (c) => { const [h, s] = hueSat(c); return h > 0.17 && h < 0.45 && s > 0.12; };
const isBlossom = (c) => { const [h, s, l] = hueSat(c); return (h > 0.85 || h < 0.04) && l > 0.55 && s > 0.15; };
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Map the colours `pick` chooses in the image onto a ramp, darkest to lightest. */
function toRamp(d, pick, ramp) {
  const seen = new Map();
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 10) { const c = rgbOf(d, i); if (pick(c)) seen.set(hex(c), c); }
  const list = [...seen.values()].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  const to = new Map(list.map((c, i) => [hex(c), parse(ramp[list.length < 2 ? 2 : Math.round(i * (ramp.length - 1) / (list.length - 1))])]));
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 10) { const n = to.get(hex(rgbOf(d, i))); if (n) { d[i] = n[0]; d[i + 1] = n[1]; d[i + 2] = n[2]; } }
}
function inSeason(c, type, variant, season) {
  if (!season || (season === 'summer' && type !== 'sakura')) return;
  const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, ever = EVERGREEN.includes(type), tree = !!TREE_DEFS[type];
  if (season === 'summer') toRamp(d, isBlossom, RAMPS.summerCherry);
  else if (season === 'spring' && !ever) toRamp(d, isLeaf, RAMPS.spring);
  else if (season === 'autumn' && !ever) {
    if (type === 'sakura') toRamp(d, (c) => isBlossom(c) || isLeaf(c), RAMPS.autumn[1]);
    else toRamp(d, isLeaf, tree ? RAMPS.autumn[variant % 3] : RAMPS.autumnBush);
  } else if (season === 'winter') {                                     // snow on every edge that faces up: 2 rows, lit then shade
    const W = c.width, H = c.height, solid = (x, y) => y >= 0 && d[(y * W + x) * 4 + 3] > 10, top = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid(x, y) && !solid(x, y - 1)) top.push([x, y]);
    for (const [x, y] of top) for (const [k, col] of [[0, SNOW_LIT], [1, SNOW_SHADE]]) { if (!solid(x, y + k)) break; const i = ((y + k) * W + x) * 4, n = parse(col); d[i] = n[0]; d[i + 1] = n[1]; d[i + 2] = n[2]; }
  }
  g.putImageData(im, 0, 0);
}

/**
 * A copy of a town's ground canvas in a season: the lawns' greens mapped onto the season's
 * (spring fresher with blossom petals and small flowers, autumn yellowed with fallen leaves);
 * in winter the lawns, sand and dirt under snow and the gravel and paving dusted with it.
 * Roads, sidewalks and water stay. Marks fall by a hash of their place (nothing random).
 */
export function groundInSeason(src, season) {
  const c = canvasOf(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  if (!SEASONS.includes(season) || season === 'summer') return c;
  const W = c.width, im = g.getImageData(0, 0, W, c.height), d = im.data;
  const hash = (x, y) => (Math.imul(x * 73856093 ^ y * 19349663, 2654435761) >>> 0) % 1000;
  const lawn = (col) => { const [h, sat] = hueSat(col); return h > 0.17 && h < 0.45 && sat > 0.08; };
  const bare = (col) => { const [h, sat] = hueSat(col); return h > 0.03 && h < 0.17 && sat > 0.18; };
  if (season === 'winter') {
    const SN = [parse('#eef2f6'), parse('#e2e8f0'), parse('#ffffff'), parse('#d4dce6')];
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const x = p % W, y = (p / W) | 0, col = rgbOf(d, i), [, sat, l] = hueSat(col), n = hash(x, y);
      let to = null;
      if (lawn(col) || bare(col)) to = n < 40 ? SN[1] : n < 55 ? SN[2] : n < 62 ? SN[3] : SN[0];
      else if (sat < 0.16 && l > 0.55 && l < 0.79 && n < 70 && hash(x >> 1, y) % 3 === 0) to = SN[0];   // a dusting on gravel and paving (not the roads or sidewalks)
      if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; }
    }
  } else {
    const marks = season === 'spring' ? ['#f6c8d8', '#f2efe8', '#f2c230', '#f0b0c8'] : ['#d8602a', '#e8a030', '#b8402a', '#c88a3a'];
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const x = p % W, y = (p / W) | 0;
      if (hash(x, y) >= 9 || !lawn(rgbOf(d, i))) continue;              // about 1 lawn pixel in 110
      const to = parse(marks[hash(y, x) % marks.length]); d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2];
    }
    toRamp(d, lawn, season === 'spring' ? ['#6e8c56', '#7f9c62', '#90ac70', '#a2bc80', '#b4cc92'] : ['#7c7e4e', '#8e8e58', '#a09e64', '#b2ae72', '#c4be84']);   // (after the marks, which are not green)
  }
  g.putImageData(im, 0, 0);
  return c;
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
 * Fill the rectangle (x, y, w, h) with a terrain { type, seed, t } (tinyNatureFull.js):
 * one pattern pixel per canvas pixel, its marks on a grid fixed to the canvas, so patches
 * meet without seams. t (seconds) moves the water's ripples. (scale is not needed.)
 */
export function drawTerrain(g, { type, x, y, w, h, seed = 1, scale = 1, t = 0 }) {
  const f = FULL_TERRAINS[type];
  if (!usesFull(f)) return;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  f.draw(g, { x, y, w, h, seed, t, rng: seeded(seed * 977 + 5) });
  g.restore();
}
