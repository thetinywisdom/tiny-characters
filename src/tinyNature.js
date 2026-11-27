// Tiny Nature: trees, bushes and terrains in the same small pixel style as
// the people and buildings.
//
//   drawTree(g, { type, x, y, seed, scale, t })  centred on x, its foot at y; t: it sways in the breeze
//   drawBush(g, { type, x, y, seed, scale })
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
function plantImage(defs, fulls, type, variant, salt) {
  const f = usesFull(fulls[type]) ? fulls[type] : null;
  if (!f) return null;
  const key = `${salt}:${type}:${variant}`;
  if (cache.has(key)) return cache.get(key);
  const [, w1, h1] = defs[type];
  const K = 1.5, w = Math.round(w1 * K), h = Math.round(h1 * K), mx = MX, my = MY;
  const cw = w + mx * 2, ch = h + my * 2;
  const c = canvasOf(cw, ch);
  f.draw(makePainter(c.getContext('2d'), mx, h + my, 1), seeded(variant * 131 + salt), Math.floor(w / 2));
  const img = { c, cw, ch, w, h, mx, my, K };
  cache.set(key, img);
  return img;
}
function drawPlant(defs, fulls, g, p, salt) {
  if (!defs[p.type]) return;
  const seed = p.seed ?? 0, img = plantImage(defs, fulls, p.type, seed % VARIANTS, salt);
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
