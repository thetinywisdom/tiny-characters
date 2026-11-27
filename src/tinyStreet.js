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
// Full-size drawings (tinyStreetFull.js, the parts in src/full/p*.js) replace the old ones
// once approved (setRedraw in tinyBuildings.js); sizes, feet, lights and wire ends stay in
// scale-1 pixels, and a full drawing puts them at the same spots times 1.5.
// Plain ES module, no dependencies (it borrows the buildings' painter).

import { makePainter, usesFull } from './tinyBuildings.js';
import { FULL_PROPS } from './tinyStreetFull.js';
import { seeded, shade } from './tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', RED = '#d8443c', METAL = '#6a6f76', DARK = '#4a4e54';
const LAMP = '#fff2c0', WOOD = '#8a6440', LIGHTWOOD = '#b88a58', STONE = '#a8a49a', CONCRETE = '#b0aca2';
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
  // --- the park, the playground, the court, the station area (Nov 2026) ---
  swings: ['Swings', 30, 22, 3, (r) => {
    r('#c8402c', 0, 0, 2, 21); r('#c8402c', 28, 0, 2, 21); r('#c8402c', 0, 20, 30, 2); r(shade('#c8402c', 0.8), 0, 20, 30, 1);
    for (const dx of [6, 18]) { r(INK, dx, 5, 1, 15); r(INK, dx + 5, 5, 1, 15); r('#3f7fd6', dx, 3, 6, 2); }   // chains, seats
  }],
  slide: ['Slide', 22, 18, 6, (r) => {
    r('#8a9096', 0, 0, 1, 14); r('#8a9096', 5, 0, 1, 14); for (let k = 2; k < 14; k += 3) r('#8a9096', 0, k, 6, 1);   // the ladder
    r('#f2c230', 0, 14, 8, 4); r(shade('#f2c230', 0.85), 0, 14, 8, 1);                                         // the top
    for (let k = 0; k < 14; k++) r(k % 4 === 3 ? '#e8b830' : '#e8c040', 8 + k, 13 - k, 2, 2);                   // the chute
  }],
  sandbox: ['Sandbox', 26, 10, 10, (r, rng) => {
    r('#8a6440', 0, 0, 26, 10); r('#e8d8a8', 2, 1, 22, 8);
    r('#c8b888', 6, 3, 5, 2); r('#c8b888', 15, 5, 4, 2); r(rng() < 0.5 ? '#c8402c' : '#3f7fd6', 18, 2, 3, 3); r(INK, 19, 5, 1, 1);   // a castle, a bucket
  }],
  drinkingFountain: ['Drinking fountain', 6, 11, 2, (r) => {
    r('#b0aca2', 1, 0, 4, 8); r(shade('#b0aca2', 0.85), 4, 0, 1, 8); r('#c8c4ba', 0, 8, 6, 2); r('#8a9096', 2, 10, 2, 1); r('#9fd0f0', 3, 9, 1, 1);
  }],
  hoop: ['Basketball hoop', 10, 24, 2, (r) => {
    r('#8a9096', 4, 0, 2, 17); r(shade('#8a9096', 0.8), 5, 0, 1, 17);
    r(WHITE, 0, 16, 10, 7); r(INK, 0, 22, 10, 1); r(INK, 0, 16, 1, 7); r(INK, 9, 16, 1, 7); r('#e8402f', 3, 17, 4, 3); r(WHITE, 4, 18, 2, 1);   // the backboard
    r('#e8402f', 3, 15, 5, 1); r(WHITE, 3, 13, 1, 2); r(WHITE, 5, 12, 1, 3); r(WHITE, 7, 13, 1, 2);                                    // the rim and net
  }],
  floodlight: ['Floodlight', 6, 36, 2, (r) => {
    r('#6a6f76', 2, 0, 2, 32); r(DARK, 0, 32, 6, 3); r(LAMP, 1, 32, 4, 1);
  }, [[3, 32.5, 22]]],
  plazaClock: ['Plaza clock', 8, 28, 2, (r) => {
    r(METAL, 3, 0, 2, 20); r(DARK, 2, 0, 4, 1);
    r('#e8e0d0', 0, 20, 8, 8); r(INK, 1, 21, 6, 6); r(WHITE, 2, 22, 4, 4); r(INK, 4, 24, 1, 2); r(INK, 4, 24, 2, 1);
  }],
  redLantern: ['Red lantern', 4, 15, 1, (r, rng, p) => {
    const s = p?.sway ?? 0;                                                  // p.sway: -1, 0 or 1, how it swings in the breeze
    r(DARK, 1, 0, 1, 9); r(DARK, 0 + s, 9, 4, 1); r('#d8402f', 0 + s, 10, 4, 4); r('#f06a50', 1 + s, 11, 1, 2); r(INK, 0 + s, 14, 4, 1); r(INK, 0 + s, 10, 4, 1);
  }, [[2, 12, 9]]],
  blockWall: ['Block wall', 24, 7, 2, (r) => {                            // a garden's concrete block wall (a cat naps on it)
    r('#b8b4aa', 0, 0, 24, 6); r('#d0ccc2', 0, 6, 24, 1);
    for (let up = 2; up < 6; up += 2) r('#a29e94', 0, up, 24, 1);
    for (let i = 0; i < 24; i += 6) { r('#a29e94', i + (i % 12 ? 3 : 0), 0, 1, 2); r('#a29e94', i + (i % 12 ? 0 : 3), 2, 1, 2); r('#a29e94', i + (i % 12 ? 3 : 0), 4, 1, 2); }
  }],
  crates: ['Crates', 10, 9, 4, (r) => {
    for (const [dx, up] of [[0, 0], [5, 0], [2, 4]]) { r('#a87a4a', dx, up, 5, 4); r('#8a6440', dx, up + 2, 5, 1); r(shade('#a87a4a', 1.15), dx, up + 3, 5, 1); }
  }],
  acUnit: ['AC unit', 10, 8, 4, (r) => {
    r('#d8dce0', 0, 0, 10, 8); r('#b8bcc0', 0, 0, 10, 1); r('#8a9096', 1, 1, 6, 6); r('#5a5f66', 2, 2, 4, 4); r('#8a9096', 3, 3, 2, 2); r('#b8bcc0', 8, 2, 1, 4);
  }],
  // p.down: the boom is down across the road (a train is coming); p.flash: which lamp is lit
  crossingGate: ['Level crossing gate', 24, 16, 2, (r, rng, p) => {
    r(WHITE, 1, 0, 2, 14); r(INK, 1, 2, 2, 1); r(INK, 1, 6, 2, 1); r(INK, 1, 10, 2, 1);                       // the post
    r(INK, 0, 12, 4, 2); r(p.down && p.flash ? '#ff4a3a' : '#6a3434', 0, 12, 1, 2); r(p.down && !p.flash ? '#ff4a3a' : '#6a3434', 3, 12, 1, 2);   // its two lamps
    r(INK, 1, 14, 2, 2); r('#f2c230', 0, 15, 4, 1);                                                          // the X sign
    if (p.down) for (let i = 4; i < 24; i += 2) r(i % 4 ? INK : '#f2c230', i, 7, 2, 1);                       // the boom, across
    else for (let k = 0; k < 9; k++) r(k % 2 ? INK : '#f2c230', 3, 7 + k, 1, 1);                              // the boom, up
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
  const k = p.scale ?? 1, f = FULL_PROPS[p.type];
  // drawn at full size (made for the town's scale 1.5: one pixel = one person pixel) once approved
  if (usesFull(f)) f.draw(makePainter(g, left(p, k), Math.round(p.y), k / 1.5), seeded((p.seed ?? 1) * 131 + 17), p);
  else def[4](makePainter(g, left(p, k), Math.round(p.y), k), seeded((p.seed ?? 1) * 131 + 17), p);
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
  return (DEFS[p.type]?.[5] ?? []).map(([dx, up, rad]) => ({ x: L + dx * k, y: p.y - up * k, r: rad * k, c: p.type === 'vendingMachine' ? '#e8f4ff' : '#ffe8a8' }));
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
