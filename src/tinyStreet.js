// Tiny Street: the things on a street that make a town feel lived in:
// utility poles with their wires and lamps, street lamps, stone lanterns,
// vending machines, a bus stop, benches, bins, bikes in a rack, a red post
// box, pot plants, a stop sign; drawn in the buildings' pixel style.
//
//   drawProp(g, p)      one thing { type, x, y, seed, scale }: centred on x, standing on y
//                       (a traffic light also takes lit: 'green' | 'yellow' | 'red')
//   PROPS               type -> { label, w, h, depth } (pixels at scale 1)
//   propScale(type)     1.5 once it is drawn at full size (show it at that scale), else 1
//   propSolid(p)        the ground it takes, { x, y, w, h }, so people walk round it
//   propLights(p)       where it gives light at night: [{ x, y, r }]
//   poleTops(p)         where a utility pole's wires hang from: [{ x, y }]
//   drawWire(g, a, b)   a sagging wire between two points
//
// The drawings are in tinyStreetFull.js (the parts in src/full/p*.js), made for the town's
// scale 1.5 (one pixel = one person pixel); sizes, feet, lights and wire ends below stay in
// scale-1 pixels, and each drawing puts them at the same spots times 1.5.
// Plain ES module, no dependencies (it borrows the buildings' painter).

import { makePainter, usesFull } from './tinyBuildings.js';
import { FULL_PROPS } from './tinyStreetFull.js';
import { seeded } from './tinyCharacters.js';

/**
 * Each: [label, w, h, depth, lights], in pixels at scale 1 (the drawings, in
 * tinyStreetFull.js, are made for the town's scale 1.5 and fill w x h times 1.5):
 * depth is how many rows of ground it stands on (its solid part); lights are
 * [dx, up, radius], where it glows at night.
 */
const DEFS = {
  utilityPole: ['Utility pole', 10, 30, 2, [[1.5, 19.5, 14]]],
  streetLamp: ['Street lamp', 6, 19, 2, [[4.5, 14.5, 14]]],
  oldLamp: ['Old street lamp', 5, 17, 2, [[2.5, 13.5, 12]]],
  stoneLantern: ['Stone lantern (tōrō)', 5, 10, 2, [[2.5, 6, 8]]],
  vendingMachine: ['Vending machine', 7, 11, 3, [[3.5, 7, 10]]],
  bench: ['Bench', 12, 5, 2],
  busStop: ['Bus stop', 20, 16, 3],
  bins: ['Bins', 9, 6, 2],
  bikeRack: ['Bikes in a rack', 16, 6, 3],
  postBox: ['Post box', 4, 8, 2],
  plantPot: ['Pot plant', 5, 6, 2],
  trafficLight: ['Traffic light', 8, 19, 2],
  swings: ['Swings', 30, 22, 3],
  slide: ['Slide', 22, 18, 6],
  sandbox: ['Sandbox', 26, 10, 10],
  drinkingFountain: ['Drinking fountain', 6, 11, 2],
  hoop: ['Basketball hoop', 10, 24, 2],
  floodlight: ['Floodlight', 6, 36, 2, [[3, 32.5, 22]]],
  plazaClock: ['Plaza clock', 8, 28, 2],
  redLantern: ['Red lantern', 4, 15, 1, [[2, 12, 9]]],
  blockWall: ['Block wall', 24, 7, 2],
  crates: ['Crates', 10, 9, 4],
  acUnit: ['AC unit', 10, 8, 4],
  crossingGate: ['Level crossing gate', 24, 16, 2],
  stopSign: ['Stop sign (tomare)', 5, 14, 1],
};

/** The scale a thing is best shown at: 1.5 (the town's) once it is drawn at full size, else 1. */
export const propScale = (type) => (usesFull(FULL_PROPS[type]) ? 1.5 : 1);
/** Every thing: type -> { label, w, h, depth } (pixels at scale 1). */
export const PROPS = Object.fromEntries(Object.entries(DEFS).map(([k, [label, w, h, depth]]) => [k, { label, w, h, depth }]));

const left = (p, k) => Math.round(p.x - Math.round(PROPS[p.type].w * k) / 2);

/** Draw one thing { type, x, y, seed, scale }: centred on x, standing on y. */
export function drawProp(g, p) {
  const def = DEFS[p.type];
  if (!def) return;
  const k = p.scale ?? 1, f = FULL_PROPS[p.type];
  // drawn at full size (made for the town's scale 1.5: one pixel = one person pixel) once approved
  if (usesFull(f)) f.draw(makePainter(g, left(p, k), Math.round(p.y), k / 1.5), seeded((p.seed ?? 1) * 131 + 17), p);
}

// poles and lamps take only the ground under their pole: [dx, w]
const FOOT = { trafficLight: [3, 1], utilityPole: [4, 2], streetLamp: [0, 3], oldLamp: [1, 3], stopSign: [2, 1], hoop: [4, 2], floodlight: [2, 2], plazaClock: [3, 2], redLantern: [1, 1], crossingGate: [1, 2] };
/** The ground it stands on, which nobody walks through: { x, y, w, h }. */
export function propSolid(p) {
  const { w, depth } = PROPS[p.type], k = p.scale ?? 1, [fx, fw] = FOOT[p.type] ?? [0, w];
  return { x: left(p, k) + Math.round(fx * k), y: Math.round(p.y - depth * k), w: Math.max(1, Math.round(fw * k)), h: Math.round(depth * k) + 1 };
}

/** Where it lights up at night (in the canvas): [{ x, y, r, c }] (c: the light's colour). */
export function propLights(p) {
  const k = p.scale ?? 1, L = left(p, k);
  if (p.type === 'crossingGate') return p.down ? [{ x: L + (p.flash ? 0.5 : 3.5) * k, y: p.y - 13 * k, r: 5 * k, c: '#ff4a3a' }] : [];
  if (p.type === 'trafficLight') {
    const [dx, c] = { green: [2, '#3fd0a0'], yellow: [4, '#f2c230'], red: [6, '#e8403a'] }[p.lit ?? 'green'];
    return [{ x: L + dx * k, y: p.y - 17 * k, r: 6 * k, c }, { x: L + 6 * k, y: p.y - (p.lit === 'red' ? 7 : 9) * k, r: 3 * k, c: p.lit === 'red' ? '#3fd0a0' : '#e8403a' }];
  }
  return (DEFS[p.type]?.[4] ?? []).map(([dx, up, rad]) => ({ x: L + dx * k, y: p.y - up * k, r: rad * k, c: p.type === 'vendingMachine' ? '#e8f4ff' : '#ffe8a8' }));
}

/** A utility pole's wires hang from the ends of its crossarm: [{ x, y }]. */
export function poleTops(p) {
  const k = p.scale ?? 1, L = left(p, k), y = Math.round(p.y - 27 * k);
  return [{ x: L, y }, { x: L + Math.round(9 * k), y }];
}

/** A wire from a to b, sagging in the middle, one pixel thick. */
export function drawWire(g, a, b, sag = 3, colour = '#3a3d42') {
  if (a.x > b.x) [a, b] = [b, a];
  g.fillStyle = colour;
  const x0 = Math.round(Math.min(a.x, b.x)), x1 = Math.round(Math.max(a.x, b.x)), n = Math.max(1, x1 - x0);
  for (let x = x0; x <= x1; x++) {
    const u = (x - x0) / n, y = a.y + (b.y - a.y) * u + sag * 4 * u * (1 - u);
    g.fillRect(x, Math.round(y), 1, 1);
  }
}
