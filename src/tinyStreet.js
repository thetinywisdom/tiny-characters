// Tiny Street: the things on a street that make a town feel lived in:
// utility poles with their wires and lamps, street lamps, stone lanterns,
// vending machines, a bus stop, benches, bins, bikes in a rack, a red post
// box, pot plants, a stop sign; drawn in the buildings' pixel style.
//
//   drawProp(g, p)      one thing { type, x, y, seed, scale }: centred on x, standing on y
//                       (a traffic light also takes lit: 'green' | 'yellow' | 'red')
//   PROPS               type -> { label, w, h, depth } (pixels at scale 1)
//   propSolid(p)        the ground it takes, { x, y, w, h }, so people walk round it
//   propLights(p)       where it gives light at night: [{ x, y, r }]
//   poleTops(p)         where a utility pole's wires hang from: [{ x, y }]
//   drawWire(g, a, b)   a sagging wire between two points
//
// Plain ES module, no dependencies (it borrows the buildings' painter).

import { makePainter } from './tinyBuildings.js';
import { seeded } from './tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', RED = '#d8443c', METAL = '#6a6f76', DARK = '#4a4e54';
const LAMP = '#fff2c0', WOOD = '#8a6440', LIGHTWOOD = '#b88a58', STONE = '#a8a49a', CONCRETE = '#b0aca2';
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');
const pick = (rng, a) => a[Math.floor(rng() * a.length)];

/**
 * Each: [label, w, h, depth, draw(r, rng), lights]. r(colour, dx, up, w, h)
 * draws from the bottom-left; depth is how many rows of ground it stands on
 * (its solid part); lights are [dx, up, radius] (pixels at scale 1).
 */
const DEFS = {
  utilityPole: ['Utility pole', 10, 30, 2, (r, rng) => {
    r(CONCRETE, 4, 0, 2, 29); r(shade(CONCRETE, 0.82), 5, 0, 1, 29); r(shade(CONCRETE, 1.1), 4, 29, 2, 1);
    r('#f2c230', 4, 1, 2, 4); r(INK, 4, 2, 2, 1); r(INK, 4, 4, 2, 1);          // the yellow and black guard
    r('#2c4a8a', 4, 11, 2, 3); r(WHITE, 4, 12, 1, 1);                          // the address plate
    r('#8a867c', 0, 26, 10, 1); r(WHITE, 0, 27, 1, 1); r(WHITE, 9, 27, 1, 1); r(WHITE, 3, 27, 1, 1); r(WHITE, 6, 27, 1, 1);   // crossarm, insulators
    if (rng() < 0.4) { r('#9aa0a6', 6, 18, 3, 5); r(shade('#9aa0a6', 0.8), 8, 18, 1, 5); r(DARK, 6, 23, 3, 1); }          // a transformer
    r(METAL, 1, 22, 4, 1); r(DARK, 0, 20, 3, 2); r(LAMP, 0, 20, 3, 1);       // a lamp on an arm
  }, [[1.5, 19.5, 14]]],
  streetLamp: ['Street lamp', 6, 19, 2, (r) => {
    r(METAL, 0, 0, 3, 1); r(METAL, 1, 1, 1, 17); r(METAL, 1, 17, 4, 1);
    r(DARK, 3, 15, 3, 2); r(LAMP, 3, 15, 3, 1);
  }, [[4.5, 14.5, 14]]],
  oldLamp: ['Old street lamp', 5, 17, 2, (r) => {
    r(INK, 1, 0, 3, 1); r(INK, 2, 1, 1, 11); r(INK, 1, 11, 3, 1);
    r(INK, 0, 12, 5, 4); r(LAMP, 1, 12, 3, 3); r(INK, 2, 12, 1, 3); r(INK, 1, 16, 3, 1);
  }, [[2.5, 13.5, 12]]],
  stoneLantern: ['Stone lantern (tōrō)', 5, 10, 2, (r) => {
    r(STONE, 0, 0, 5, 1); r(STONE, 2, 1, 1, 3); r(STONE, 1, 4, 3, 1);
    r(STONE, 1, 5, 1, 2); r(STONE, 3, 5, 1, 2); r('#f2c070', 2, 5, 1, 2);
    r(shade(STONE, 0.75), 0, 7, 5, 1); r(shade(STONE, 0.85), 1, 8, 3, 1); r(STONE, 2, 9, 1, 1);
  }, [[2.5, 6, 8]]],
  vendingMachine: ['Vending machine', 7, 11, 3, (r, rng) => {
    const c = pick(rng, ['#d8443c', '#2f6fb8', '#e8e8e4', '#2f8a5a', '#f08a2c']);
    r(c, 0, 0, 7, 11); r(shade(c, 0.8), 6, 0, 1, 11); r(shade(c, 0.85), 0, 10, 7, 1);
    r('#e4eef2', 1, 5, 5, 4);                                                  // the lit window of drinks
    for (const up of [5, 7]) for (let i = 0; i < 3; i++) r(pick(rng, ['#d8443c', '#3f7fd6', '#f2c230', '#2fa36b', '#a85a3a', WHITE]), 1 + i * 2, up, 1, 2);
    r(INK, 5, 4, 1, 1);                                                        // coins
    r(INK, 1, 1, 4, 2); r(shade(c, 0.7), 1, 3, 5, 1);                          // where the can comes out
  }, [[3.5, 7, 10]]],
  bench: ['Bench', 12, 5, 2, (r) => {
    r(DARK, 1, 0, 1, 3); r(DARK, 10, 0, 1, 3);
    r(WOOD, 0, 2, 12, 1); r(LIGHTWOOD, 0, 3, 12, 1); r(WOOD, 0, 4, 12, 1);
  }],
  busStop: ['Bus stop', 20, 16, 3, (r) => {
    r(METAL, 0, 0, 1, 13); r(METAL, 15, 0, 1, 13);
    r('#c8dcea', 1, 4, 14, 8); r(shade('#c8dcea', 0.9), 1, 4, 14, 1); r('#f2c230', 10, 5, 4, 6); r(WHITE, 11, 6, 2, 4);   // glass and an advert
    r(DARK, 3, 0, 1, 3); r(DARK, 12, 0, 1, 3); r(WOOD, 2, 3, 12, 1);         // the bench
    r('#3a6a9a', 0, 13, 16, 2); r('#5a8aba', 0, 14, 16, 1);                  // the roof
    r(METAL, 18, 0, 1, 12); r(WHITE, 17, 7, 3, 3); r(INK, 18, 8, 1, 1);       // the sign: timetable,
    r('#2c6fd0', 17, 11, 3, 3); r(WHITE, 18, 12, 1, 1);                       // and the round bus sign
  }],
  bins: ['Bins', 9, 6, 2, (r) => {
    for (const [dx, c] of [[0, '#3f7fd6'], [5, '#2fa36b']]) { r(c, dx, 0, 4, 5); r(shade(c, 0.75), dx, 5, 4, 1); r(shade(c, 0.85), dx + 3, 0, 1, 5); r(WHITE, dx + 1, 3, 2, 1); }
  }],
  bikeRack: ['Bikes in a rack', 16, 6, 3, (r, rng) => {
    r(METAL, 0, 0, 16, 1);
    for (const bx of [0, 8]) {
      const c = pick(rng, ['#d8443c', '#3f7fd6', WHITE, '#2fa36b', '#f2c230', INK]);
      for (const wx of [bx, bx + 4]) { r(INK, wx + 1, 0, 1, 1); r(INK, wx, 1, 1, 1); r(INK, wx + 2, 1, 1, 1); r(INK, wx + 1, 2, 1, 1); }
      r(c, bx + 1, 2, 5, 1); r(c, bx + 2, 3, 1, 1); r(INK, bx + 1, 4, 2, 1); r(c, bx + 5, 3, 1, 1); r(INK, bx + 5, 4, 2, 1);   // frame, saddle, handlebar
      if (rng() < 0.5) r(METAL, bx + 6, 2, 1, 2);                                // a basket
    }
  }],
  postBox: ['Post box', 4, 8, 2, (r) => {
    r(RED, 0, 0, 4, 7); r(RED, 1, 7, 2, 1); r(shade(RED, 0.8), 3, 0, 1, 7);
    r(INK, 1, 5, 2, 1); r(WHITE, 1, 2, 2, 1);
  }],
  plantPot: ['Pot plant', 5, 6, 2, (r, rng) => {
    r('#a8664a', 0, 0, 5, 2); r(shade('#a8664a', 0.8), 4, 0, 1, 2);
    const c = pick(rng, ['#5f8f5a', '#4a7a4a', '#6a9a5a']);
    r(c, 0, 2, 5, 2); r(c, 1, 4, 3, 2); r(shade(c, 1.2), 1, 4, 1, 1);
    if (rng() < 0.5) { const f = pick(rng, [RED, '#f2c230', '#d46a8e', WHITE]); r(f, 1, 3, 1, 1); r(f, 3, 5, 1, 1); }
  }],
  // Japanese signals: lamps side by side, green (a blue green), yellow, red;
  // a walk signal below (red above, green under). p.lit: 'green' | 'yellow' | 'red'
  trafficLight: ['Traffic light', 8, 19, 2, (r, rng, p) => {
    const lit = p.lit ?? 'green', walk = lit === 'red';
    r(METAL, 3, 0, 1, 16); r(METAL, 2, 0, 3, 1);
    r(DARK, 0, 16, 8, 3); r(INK, 0, 18, 8, 1);
    r(lit === 'green' ? '#3fd0a0' : '#34463f', 1, 16, 2, 2); r(lit === 'yellow' ? '#f2c230' : '#4a4636', 3, 16, 2, 2); r(lit === 'red' ? '#e8403a' : '#4a3434', 5, 16, 2, 2);
    r(DARK, 4, 6, 4, 6); r(walk ? '#4a3434' : '#e8403a', 5, 9, 2, 2); r(walk ? '#3fd0a0' : '#34463f', 5, 7, 2, 2);
  }],
  stopSign: ['Stop sign (tomare)', 5, 14, 1, (r) => {
    r(METAL, 2, 0, 1, 10);
    r(RED, 0, 12, 5, 2); r(RED, 1, 11, 3, 1); r(RED, 2, 10, 1, 1); r(WHITE, 1, 13, 3, 1);
  }],
};

/** Every thing: type -> { label, w, h, depth } (pixels at scale 1). */
export const PROPS = Object.fromEntries(Object.entries(DEFS).map(([k, [label, w, h, depth]]) => [k, { label, w, h, depth }]));

const left = (p, k) => Math.round(p.x - Math.round(PROPS[p.type].w * k) / 2);

/** Draw one thing { type, x, y, seed, scale }: centred on x, standing on y. */
export function drawProp(g, p) {
  const def = DEFS[p.type];
  if (!def) return;
  const k = p.scale ?? 1;
  def[4](makePainter(g, left(p, k), Math.round(p.y), k), seeded((p.seed ?? 1) * 131 + 17), p);
}

// poles and lamps take only the ground under their pole: [dx, w]
const FOOT = { trafficLight: [3, 1], utilityPole: [4, 2], streetLamp: [0, 3], oldLamp: [1, 3], stopSign: [2, 1] };
/** The ground it stands on, which nobody walks through: { x, y, w, h }. */
export function propSolid(p) {
  const { w, depth } = PROPS[p.type], k = p.scale ?? 1, [fx, fw] = FOOT[p.type] ?? [0, w];
  return { x: left(p, k) + Math.round(fx * k), y: Math.round(p.y - depth * k), w: Math.max(1, Math.round(fw * k)), h: Math.round(depth * k) + 1 };
}

/** Where it lights up at night (in the canvas): [{ x, y, r }]. */
export function propLights(p) {
  const k = p.scale ?? 1, L = left(p, k);
  return (DEFS[p.type]?.[5] ?? []).map(([dx, up, rad]) => ({ x: L + dx * k, y: p.y - up * k, r: rad * k }));
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
