// Tiny Traffic: cars, kei cars, taxis, vans, kei trucks and buses, and the
// traffic of a town: lanes (driving on the left, as in Japan), traffic
// lights at the junctions, turns, buses stopping at the bus stops, cars
// stopping for anyone in front of them.
//
// Each vehicle is a small 3D shape made of pixel-sized blocks, drawn from
// any heading the way the town is seen: walls at their full height, tops
// from above at 0.6 of their depth (like the buildings' roofs). So every
// view is the same vehicle (front, back, both sides and everything between)
// and a car can swing round a corner. One block is one pixel, as the people.
//
//   drawVehicle(g, v)           one vehicle { type, x, y, heading | facing, color, seed }:
//                               its middle on the ground at (x, y); heading in degrees
//                               (0 right, 90 down / towards you, 180 left, 270 up)
//   VEHICLES                    type -> { label, length, width, height, box }
//   vehicleLights(v)            its lamps' glows at night
//   drawVehicleBeams(g, v)      the pool of light its headlamps throw on the road
//   makeTraffic(town, opts)     { vehicles, update(dt, t, walkers), mayCross(x, y, nx, ny, t),
//                               lightAt(junction, axis, t) }
//
// Plain ES module, no dependencies (seeded from tinyCharacters).

import { seeded, shade } from './tinyCharacters.js';
import { KY, voxelSprite } from './tinyVoxel.js';
import { drawScooter, drawMotorbike } from './tinyLife.js';

const INK = '#2f3236', WHITE = '#f2f2ee', METAL = '#a8aeb4', DARK = '#3a3f44';
const GLINT = '#8ea6c0', RUBBER = '#2a2e34', BUMPER = '#4a4e54', HUB = '#5a5f66', LIGHT_ON = '#ff3a2a', LIGHT_OFF = '#a8302a';
const LAMP = '#fff2c0', TAIL = '#e8403a', GLASS = '#5d7590', TYRE = '#26282c', ORANGE = '#f2a040';

/** Body colours: white and silver most, then black, red, blue, a few bright ones. */
export const CAR_COLORS = ['#f2f2ee', '#f2f2ee', '#c8ccd0', '#c8ccd0', '#3a3d42', '#c8402c', '#2f5f9a', '#3f7a5a', '#e8c840', '#8a5a7a', '#d87a3a'];
const TAXI_COLORS = [['#f2c230', '#3a3d42'], ['#3a3d42', '#f2c230'], ['#3f8a5a', '#f2f2ee'], ['#f2f2ee', '#2f5f9a']];

// --- the shapes ---------------------------------------------------------------------
// A shape is a function (u, v, z, c, c2) -> colour or null for the block at u
// along the vehicle (+ is its front), v across it (+ is its left), z up.
// Blocks are 1 x 1 x 1; the colours are the paint, the renderer shades them.

/**
 * A car-like body (the owner chose A, more detail, Nov 2026): wheels (tyre, rim, hub) in arches, a
 * lower body with lamps in dark surrounds, a slatted grille, bumpers, plates, a side skirt, the doors'
 * line, door handles, a crease catching the light; a cabin with a sloped windscreen (a glint on it)
 * and rear window, dark window rubber, pillars, mirrors, a roof with a darker rim.
 */
function carShape(o) {
  const hl = o.L / 2, hw = o.W / 2, R = o.r ?? 2.6, base = R * 0.75;
  return (u, v, z, c, c2, flash) => {
    const au = Math.abs(u), av = Math.abs(v);
    if (au > hl || av > hw || z < 0) return null;
    for (const uc of o.wheels) {                                       // tyres, rims round a dark hub, in dark arches
      const d = (u - uc) ** 2 + (z - R) ** 2;
      if (d <= R * R && av >= hw - 2.2) return av > hw - 0.7 ? (d < 0.7 ? HUB : d < 2.4 ? METAL : TYRE) : TYRE;
      if (d <= (R + 0.9) ** 2 && av > hw - 0.7 && z >= base) return shade(c, 0.45);
    }
    if (z < base) return null;
    if (au > hl - 1 && av > hw - 1) return null;
    if (z < o.body) {
      const frontFace = u > hl - 1, backFace = u < -hl + 1, low = z < base + 1.2, lampRow = z >= o.body - 2.5 && z < o.body - 0.8;
      if (low && (frontFace || backFace)) return av < 1.3 ? WHITE : BUMPER;                       // bumpers, plates
      if (frontFace && lampRow && av >= hw - 3.2) return av > hw - 1.6 ? LAMP : shade(LAMP, 0.85);
      if (frontFace && lampRow && av >= hw - 3.9) return RUBBER;                                   // the lamps' dark surround
      if (frontFace && av < 2.6) return Math.floor(z * 2) % 2 ? DARK : '#5a5f66';                   // the grille's slats
      if (backFace && lampRow && av >= hw - 3) return av > hw - 1.2 ? TAIL : '#c8302c';
      if (backFace && lampRow && av >= hw - 3.7) return RUBBER;
      if (low && av > hw - 0.7) return shade(c, 0.62);
      if (o.stripe && z >= o.body - 2 && z < o.body - 1) return c2;
      if (o.twoTone) return c2;                                           // a patrol car: all the body below the windows black
      if (av > hw - 0.7 && Math.abs(u - o.door) < 0.6 && z > base + 1) return shade(c, 0.72);
      if (av > hw - 0.7 && z >= o.body - 2 && z < o.body - 1.3 && (Math.abs(u - o.door - 2) < 0.7 || (o.door2 !== undefined && Math.abs(u - o.door2 - 2) < 0.7))) return RUBBER;   // door handles
      if (av > hw - 0.7 && z >= o.body - 1 && z < o.body - 0.4) return shade(c, 1.12);            // a crease catching the light
      return c;
    }
    if (z >= o.H) return o.extra ? o.extra(u, v, z, c, c2, flash) : null;
    const k = z - o.body, front = o.cabF - k * o.slopeF, back = o.cabB + k * o.slopeB, side = hw - 1 - k * 0.15;
    if (u > front || u < back || av > side) {
      if (z < o.body + 1.2 && av > hw - 0.9 && Math.abs(u - (o.cabF - 0.8)) < 0.8) return shade(c, 0.55);
      return null;
    }
    if (z >= o.H - 1) return u > front - 0.9 || u < back + 0.9 || av > side - 0.9 ? shade(c, 0.86) : c;   // the roof, its rim
    if (o.panel && u < o.panel) return c;
    if (av > hw - 2.6 && Math.abs(u - o.door) < 0.7) return c;
    if (z < o.body + 0.8) return RUBBER;                                                         // the window rubber along the bottom
    if (u > front - 1 && (Math.floor(av + z * 1.3) % 6 === 0)) return GLINT;                     // a glint on the windscreen
    return GLASS;
  };
}
const wheel = (u, v, z, uc, R, hw) => { const d = (u - uc) ** 2 + (z - R) ** 2; return d <= R * R && Math.abs(v) >= hw - 2.2 ? (d < 1.3 && Math.abs(v) > hw - 0.7 ? METAL : TYRE) : null; };
const CAR = { L: 30, W: 13, H: 11.5, body: 6.5, cabF: 5.5, slopeF: 0.9, cabB: -8.5, slopeB: 0.6, door: -1.5, door2: -7.5, wheels: [9, -9] };
const SHAPES = {
  car: { label: 'Car', L: 30, W: 13, H: 11.5, shape: carShape(CAR) },
  kei: { label: 'Kei car', L: 24, W: 12, H: 13, shape: carShape({ L: 24, W: 12, H: 13, body: 6.5, cabF: 7, slopeF: 0.7, cabB: -11.5, slopeB: 0.15, door: -1, door2: -7, wheels: [7.5, -7.5], r: 2.4 }) },
  taxi: { label: 'Taxi', L: 30, W: 13, H: 14, shape: carShape({ ...CAR, stripe: true,
    extra: (u, v, z, c, c2) => (z < CAR.H + 2 && Math.abs(u + 2) < 2 && Math.abs(v) < 2.2 ? (z < CAR.H + 1.2 ? WHITE : c2) : null) }) },   // the roof sign
  van: { label: 'Delivery van', L: 30, W: 13, H: 14, shape: carShape({ L: 30, W: 13, H: 14, body: 6.5, cabF: 11, slopeF: 0.9, cabB: -15, slopeB: 0, door: 6, panel: 5.5, stripe: true, wheels: [10, -10] }) },
  keiTruck: { label: 'Kei truck', L: 26, W: 12, H: 12.5, shape: (() => {
    const cab = carShape({ L: 26, W: 12, H: 12.5, body: 6.5, cabF: 12.5, slopeF: 0.3, cabB: 4.5, slopeB: 0, door: 99, wheels: [8.5, -8], r: 2.4 });
    return (u, v, z, c, c2) => {
      if (u >= 4) return cab(u, v, z, c, c2);
      const au = Math.abs(u), av = Math.abs(v);
      if (au > 13 || av > 6 || z < 0) return null;
      const w = wheel(u, v, z, -8, 2.4, 6); if (w) return w;
      if (z < 1.8) return null;
      if (z < 3.2) return u < -12 ? DARK : shade(c, 0.8);                  // under the bed, the rear bumper
      if (z < 6.5 && (av > 5 || u < -12 || u > 3)) return u < -12 && z > 4 && z < 5.2 && av > 3.5 ? TAIL : c;   // the bed's sides, tailgate, front wall
      if (z < 4.2) return '#8a8a84';                                       // its floor
      if (z < 8 && u > -10 && u < -2 && av < 3.5) return z >= 7 ? shade(c2, 1.1) : c2;   // a load
      return null;
    };
  })() },
  bus: { label: 'Bus', L: 54, W: 16, H: 19, shape: (u, v, z, c, c2) => {
    const au = Math.abs(u), av = Math.abs(v);
    if (au > 27 || av > 8 || z < 0) return null;
    for (const uc of [18, -16]) { const w = wheel(u, v, z, uc, 3, 8); if (w) return w; }
    if (z < 2) return null;
    if (au > 26 && av > 7) return null;
    if (z >= 17) return z < 19 && u > -10 && u < 6 && av < 4.5 ? (z >= 18.5 ? shade(METAL, 1.05) : METAL) : null;   // air conditioning on the roof
    const frontFace = u > 26, backFace = u < -26;
    if (z < 3.2) return frontFace || backFace ? DARK : shade(c, 0.6);
    if (frontFace) return z >= 15 ? (av < 5 ? ORANGE : INK) : z >= 6.5 ? (av < 0.6 ? DARK : GLASS) : z >= 4 && z < 5.5 && av > 5 ? LAMP : c;   // windscreen, destination
    if (backFace) return z >= 10 && z < 14 && av < 6.5 ? GLASS : z >= 4 && z < 6 && av > 5.5 ? TAIL : c;
    if (z >= 4 && z < 5.5) return c2;
    if (z >= 6 && z < 15 && av > 7 && v < 0 && u > 18 && u < 22) return Math.abs(u - 20) < 0.5 ? DARK : GLASS;   // the door, on its left (the kerb side)
    if (z >= 9.5 && z < 14.5 && av > 7) return Math.abs(((u + 54) % 6) - 3) > 2.4 ? c : GLASS;   // windows and pillars
    return c;
  } },
  // the police car (the owner, Nov 2026): a Japanese patrol car, black below and white above, a red
  // light bar across the roof that flashes side by side on a call (flash 0 | 1; null: off)
  police: { label: 'Police car', L: 30, W: 13, H: 13, shape: carShape({ ...CAR, twoTone: true,
    extra: (u, v, z, c, c2, flash) => (z < CAR.H + 1.5 && Math.abs(u + 1.5) < 1.6 && Math.abs(v) < 4.6
      ? (Math.abs(v) < 1 ? '#c8ccd0' : flash !== null && flash !== undefined && (v > 0) === (flash === 1) ? LIGHT_ON : LIGHT_OFF) : null) }) },
  // the fire engine (the owner, Nov 2026): long and red, a cab with big windows and a white band, silver
  // lockers down its sides, a ladder along the top, red lights on the cab's roof that flash on a call
  fireEngine: { label: 'Fire engine', L: 42, W: 15, H: 17, shape: (u, v, z, c, c2, flash) => {
    const au = Math.abs(u), av = Math.abs(v), hw = 7, RED = '#d8302a';
    if (au > 21 || av > hw || z < 0) return null;
    for (const uc of [13, -8, -13]) { const w = wheel(u, v, z, uc, 2.9, hw); if (w) return w; }
    if (z < 2) return null;
    if (z < 3.4) return au > 20.3 ? '#c8ccd0' : DARK;                                 // bumpers, the chassis
    if (u >= 10) {                                                                    // the cab
      if (au > 20.3 && av > hw - 1) return null;
      if (z >= 13.5) return z < 14.6 && u > 12 && u < 17 && av > 1.5 && av < 5.5 ? (flash !== null && flash !== undefined && (v > 0) === (flash === 1) ? LIGHT_ON : LIGHT_OFF) : null;
      if (z >= 12.5) return RED;
      if (u > 20.3) return z >= 8 ? (av < 0.6 ? DARK : GLASS) : z >= 4.5 && z < 6 && av > 4.5 ? LAMP : z >= 6.5 && z < 7.5 ? WHITE : z < 5 && av < 3 ? '#c8ccd0' : RED;
      if (z >= 8 && z < 12 && av > hw - 0.8 && u > 11 && u < 19.5) return Math.abs(u - 15) < 0.5 ? RED : GLASS;
      if (z >= 6.5 && z < 7.5) return WHITE;                                         // the white band
      return RED;
    }
    if (u >= 9) return z < 12.5 ? DARK : null;
    if (z >= 13.5) {                                                                  // the ladder along the top, its rungs
      if (z >= 15) return null;
      if (av > 2.2 && av < 3.5 && u > -20 && u < 8) return z >= 14 ? '#d8dcdf' : METAL;
      if (av <= 2.2 && Math.abs(((u + 40) % 3) - 1.5) < 0.5 && u > -20 && u < 8) return METAL;
      return null;
    }
    if (z >= 12.5) return RED;
    if (av > hw - 0.8 && z >= 4 && z < 12) {                                          // lockers: silver shutters
      if (z >= 6.5 && z < 7.5) return WHITE;
      if (Math.abs(((u + 40) % 7) - 3.5) > 3) return RED;
      return Math.floor(z) % 2 ? '#c8ccd0' : '#b0b6bc';
    }
    if (u < -20.3 && z >= 4 && z < 5.5 && av > hw - 2) return TAIL;
    return RED;
  } },
  // the rubbish truck (the owner chose B, Nov 2026): a green cab, a tall white box with a green stripe
  // and rounded top edges, the grey steel hopper at the back sloping out, its dark mouth, ribs, tail lamps
  rubbishTruck: { label: 'Rubbish truck', L: 39, W: 15, H: 16, shape: (u, v, z) => {
    const au = Math.abs(u), av = Math.abs(v), hw = 7, CAB = '#3f8a5a', BODY = '#e8efe4', STRIPE = '#3f8a5a';
    if (au > 19 || av > hw || z < 0) return null;
    for (const uc of [12, -9]) { const w = wheel(u, v, z, uc, 2.8, hw); if (w) return w; }
    if (z < 2) return null;
    if (z < 3.4) return u > 18 || u < -18.5 ? DARK : '#4a4e54';                       // the chassis, bumpers
    if (u >= 9) {                                                                      // the cab
      if (au > 18.3 && av > hw - 1) return null;
      if (z >= 13) return null;
      if (z >= 12) return CAB;
      if (u > 18.3) return z >= 8 ? (av < 0.6 ? DARK : GLASS) : z >= 4.5 && z < 6 && av > 4.5 ? LAMP : z < 5 && av < 2 ? WHITE : CAB;
      if (z >= 8 && z < 11.5 && av > hw - 0.8 && u > 10.5 && u < 17.5) return Math.abs(u - 14) < 0.5 ? CAB : GLASS;   // its side windows
      if (z >= 5 && z < 6 && u > 16) return ORANGE;                                    // a lamp on its corner
      return CAB;
    }
    if (u >= 8) return z < 13 ? DARK : null;                                           // the gap behind the cab
    if (u > -11) {                                                                     // the box
      if (z >= 15) return z < 15.6 && av < hw - 0.8 ? BODY : null;
      if (z >= 14 && av > hw - 0.8) return null;
      if (z >= 7 && z < 9 && av > hw - 0.8) return STRIPE;
      if (z >= 3.4 && z < 4.6 && av > hw - 0.8) return '#9aa0a6';                      // the side rail
      return BODY;
    }
    const back = -18.6 + Math.max(0, z - 4) * 0.35;                                    // the hopper
    if (u < back || z >= 14.5) return null;
    if (u < back + 1 && z >= 6 && z < 11 && av < hw - 1.4) return '#1e2024';           // its mouth
    if (u < back + 1 && z >= 3.4 && z < 5 && av > hw - 2) return TAIL;
    if (Math.abs(u + 13.5) < 0.5 && av > hw - 0.8) return '#6a7076';                   // a rib down its side
    return z >= 13.5 ? '#b8bec4' : '#8a9096';
  } },
};

// --- drawing them (tinyVoxel) ----------------------------------------------------------
const SPRITES = new Map();
const DIRS = 16;
// glass: the sloped windscreen and rear window one tone (no steps), the side windows darker; lamps unshaded
const tone = (col, f, face) => (col === GLASS || col === GLINT ? (face === 'side' ? 0.8 : 1.04) : col === LAMP || col === TAIL || col === ORANGE || col === BRAKE || col === AMBER || col === LIGHT_ON ? 1 : f);
// the lamps as they change (the owner, Nov 2026): the tail lamps brighter while braking or standing,
// the corner lamps of one side blinking amber before and through a turn; snow on the tops in winter
const BRAKE = '#ff2a1c', AMBER = '#ffb428', SNOWTOP = '#eef2f6';
/**
 * The sprite of a vehicle at one of 16 headings: { canvas, ox, oy } (where its ground middle is).
 * lamps: { brake, blink: 'l' | 'r' (that side's corner lamps lit amber), snow }.
 */
function sprite(type, c, c2, dir, { brake = false, blink = null, snow = false, flash = null } = {}) {
  const key = `${type}|${c}|${c2}|${dir}|${brake ? 'b' : ''}${blink ?? ''}${snow ? 's' : ''}${flash ?? ''}`;
  if (!SPRITES.has(key)) {
    const S = SHAPES[type], lampLow = shade(LAMP, 0.85), hw = S.W / 2;
    const get = (u, v, z) => {
      const col = S.shape(u, v, z, c, c2, flash);
      if (!col) return null;
      if (col === TAIL || col === LAMP || col === lampLow) {
        if (blink && (blink === 'h' || (blink === 'r' ? v > 0 : v < 0)) && Math.abs(v) > hw - 2) return AMBER;   // ('h': hazards, both sides)   // (+v is its right)
        return col === TAIL && brake ? BRAKE : col;
      }
      if (brake && col === GLASS && type !== 'bus' && u < 0 && Math.abs(v) < 1.6 && z < 8.2) return BRAKE;   // the high brake lamp, at the bottom of the rear window
      if (snow && z >= S.H - 3 && col !== GLASS && col !== TYRE && !S.shape(u, v, z + 1, c, c2, flash)) return SNOWTOP;
      return col;
    };
    SPRITES.set(key, voxelSprite((bu, bv, bz) => get(bu + 0.5, bv + 0.5, bz + 0.5), S, (dir / DIRS) * 360, tone));
  }
  return SPRITES.get(key);
}

const HEADING = { right: 0, down: 90, left: 180, up: 270 };
/** Every vehicle: type -> { label, length, width, height, box } (box: the largest sprite, { w, h, below } pixels). */
export const VEHICLES = Object.fromEntries(Object.entries(SHAPES).map(([k, S]) => {
  const hl = S.L / 2, hw = S.W / 2, rad = Math.hypot(hl, hw);
  return [k, { label: S.label, length: S.L, width: S.W, height: S.H, box: { w: Math.ceil(rad * 2) + 2, h: Math.ceil(rad * KY * 2 + S.H + 2) + 2, below: Math.ceil(rad * KY) + 1 } }];
}));
// the delivery scooter: drawn flat like the people (tinyLife), not in blocks
const SCOOTER = { L: 16, W: 5, H: 15 };
VEHICLES.scooter = { label: 'Delivery scooter', length: SCOOTER.L, width: SCOOTER.W, height: SCOOTER.H, box: { w: 26, h: 22, below: 4 } };
// scooters and motorbikes in the traffic (the owner chose A, flat like the people): tinyLife's drawMotorbike
const MOPED = { L: 17, W: 5, H: 15 }, MOTORBIKE = { L: 21, W: 6, H: 15 };
VEHICLES.moped = { label: 'Scooter', length: MOPED.L, width: MOPED.W, height: MOPED.H, box: { w: 24, h: 22, below: 4 } };
VEHICLES.motorbike = { label: 'Motorbike', length: MOTORBIKE.L, width: MOTORBIKE.W, height: MOTORBIKE.H, box: { w: 28, h: 22, below: 4 } };
/** Two wheels: drawn flat, one headlamp. */
export const TWO_WHEELS = ['scooter', 'moped', 'motorbike'];
const shapeOf = (v) => (v.type === 'scooter' ? SCOOTER : v.type === 'moped' ? MOPED : v.type === 'motorbike' ? MOTORBIKE : SHAPES[v.type] ?? SHAPES.car);

/** A vehicle's colours from its seed (or its own color / color2). */
function coloursOf(v) {
  const rng = seeded((v.seed ?? 1) * 53 + 5);
  const [tc, tc2] = TAXI_COLORS[Math.floor(rng() * TAXI_COLORS.length)];
  const c = v.color ?? (v.type === 'taxi' ? tc : v.type === 'bus' ? ['#f2f2ee', '#e8c840', '#3f7a5a'][Math.floor(rng() * 3)] : CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)]);
  if (v.type === 'police') return [v.color ?? WHITE, v.color2 ?? '#262a30'];
  const c2 = v.color2 ?? (v.type === 'taxi' ? tc2 : v.type === 'bus' ? '#2f7ac8' : v.type === 'keiTruck' ? '#b88a58' : '#3f7fd6');
  return [c, c2];
}

/**
 * Draw one vehicle { type, x, y, heading, facing, color, color2, seed }: the
 * middle of it on the ground at (x, y). heading in degrees (0 right, 90 down
 * towards you, 180 left, 270 up), or facing 'right' | 'down' | 'left' | 'up'.
 * Without a colour the seed picks one.
 */
export function drawVehicle(g, v) {
  if (v.type === 'train') { drawTrain(g, v); return; }
  if (v.type === 'scooter') { drawScooter(g, v); return; }
  if (v.type === 'moped' || v.type === 'motorbike') { drawMotorbike(g, v); return; }
  const type = SHAPES[v.type] ? v.type : 'car', [c, c2] = coloursOf(v);
  const heading = v.heading ?? HEADING[v.facing ?? 'right'];
  const dir = ((Math.round(heading / (360 / DIRS)) % DIRS) + DIRS) % DIRS;
  const s = sprite(type, c, c2, dir, { brake: v.brake, blink: v.signal && v.blinkOn ? v.signal : null, snow: v.snow, flash: v.siren ? v.flash ?? 0 : null });
  g.drawImage(s.canvas, Math.round(v.x) - s.ox, Math.round(v.y) - s.oy);
}

/** Where a point on a vehicle (u along, w across, z up) is on the screen. */
function onScreen(v, S, u, w, z) {
  const th = ((v.heading ?? HEADING[v.facing ?? 'right']) * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th);
  return { x: v.x + u * cs - w * sn, y: v.y + (u * sn + w * cs) * KY - z };
}
const sinOf = (v) => Math.sin(((v.heading ?? HEADING[v.facing ?? 'right']) * Math.PI) / 180);

/**
 * A vehicle's lamps at night: small glows on its two headlamps and two tail
 * lights, each only when its end faces you: [{ x, y, r, c }]. The light they
 * throw on the road is drawVehicleBeams.
 */
// --- trains ---------------------------------------------------------------------------------
const CARRIAGE = 62;                                    // a carriage's length (pixels, with the gap)
/**
 * A train { x, y, dir, cars, line }: x its middle, y the ground under it, dir 1 (going right) or -1.
 * Seen side on, its roof from above like the buildings'; drawn at the people's size.
 */
export function drawTrain(g, v) {
  const cars = v.cars ?? 4, line = v.line ?? ['#2f8a5a', '#f08a2c'], len = cars * CARRIAGE - 2, x0 = Math.round(v.x - len / 2), y = Math.round(v.y);
  const R = (c, dx, up, w, h) => { g.fillStyle = c; g.fillRect(v.dir < 0 ? x0 + len - dx - w : x0 + dx, y - up - h, w, h); };   // mirrored going left
  for (let i = 0; i < cars; i++) {
    const cx = i * CARRIAGE, front = i === cars - 1;
    R('#3a3d42', cx + 6, 0, 10, 2); R('#3a3d42', cx + 44, 0, 10, 2);                         // the bogies
    R('#e8ecef', cx, 2, 60, 15); R(shade('#e8ecef', 0.86), cx, 2, 60, 1);                     // the body
    R(line[0], cx, 4, 60, 2); R(line[1], cx, 6, 60, 1);                                      // the line's colours
    for (let k = 0; k < 5; k++) R('#5f7487', cx + 4 + k * 11, 10, 7, 4);                     // windows
    for (const d of [14, 44]) { R('#8a9096', cx + d, 2, 4, 12); R('#5f7487', cx + d + 1, 9, 2, 4); }   // doors
    R('#c8ccd0', cx, 17, 60, 9); R('#b0b4b8', cx + 2, 19, 56, 1); R('#9aa0a6', cx + 20, 21, 18, 3);   // the roof from above, an air-con unit
    if (i < cars - 1) R('#3a3d42', cx + 60, 6, 2, 8);                                        // the coupling
    if (front) { R('#3a3f44', cx + 54, 9, 6, 6); R('#5f7487', cx + 55, 10, 4, 4); R('#fff2c0', cx + 58, 4, 2, 1); }   // the cab
  }
}

export function vehicleLights(v) {
  if (v.type === 'train') { const L = (v.cars ?? 4) * CARRIAGE - 2; return [{ x: v.x + v.dir * (L / 2 + 4), y: v.y - 4, r: 12, c: '#fff2c0' }]; }
  const two = TWO_WHEELS.includes(v.type), S = shapeOf(v), sn = sinOf(v), hl = S.L / 2, side = two ? 0 : S.W / 2 - 1.6, out = [];
  for (const w of two ? [0] : [-side, side]) {   // (two wheels: one lamp)
    if (sn > -0.35) out.push({ ...onScreen(v, S, hl + 0.5, w, 4.8), r: 2.5, c: '#fff8d8' });
    if (sn < 0.35) out.push({ ...onScreen(v, S, -hl - 0.5, w, 4.8), r: v.brake ? 3.5 : 2.5, c: v.brake ? '#ff3a28' : '#ff5040' });
    if (v.signal && v.blinkOn && (two || v.signal === 'h' || (v.signal === 'r' ? w > 0 : w < 0))) out.push({ ...onScreen(v, S, sn > -0.35 ? hl + 0.5 : -hl - 0.5, w, 4.8), r: 2.5, c: '#ffb428' });
  }
  if (v.siren && (v.type === 'police' || v.type === 'fireEngine')) out.push({ ...onScreen(v, S, v.type === 'police' ? -1.5 : 14.5, (v.flash ?? 0) ? 3 : -3, S.H), r: 6, c: '#ff3a2a' });   // the flashing light on its roof
  return out;
}

/**
 * The light a vehicle's headlamps throw on the road (the owner chose a pool
 * of light): one smooth oval on the road ahead, brightest by the lamps (and a
 * little red behind), drawn into a light layer `g` ('lighter' adds it).
 * Paint the vehicles out of the layer afterwards so the light falls on the
 * road, not on them.
 */
export function drawVehicleBeams(g, v) {
  const S = shapeOf(v), hl = S.L / 2, side = S.W / 2 - 1.6;
  const P = (u, w, z = 0) => onScreen(v, S, u, w, z);
  // further out when the car drives away, so it shows beyond it
  const th = ((v.heading ?? HEADING[v.facing ?? 'right']) * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th);
  const c = P(hl + (sn > -0.35 ? 10 : 18), 0), a = 13, b = side + 5;
  g.save(); g.translate(c.x, c.y); g.transform(cs * a, sn * KY * a, -sn * b, cs * KY * b, 0, 0);   // the unit circle laid on the road
  const pool = g.createRadialGradient(-0.55, 0, 0, 0, 0, 1);
  pool.addColorStop(0, 'rgba(255,244,200,0.5)'); pool.addColorStop(0.5, 'rgba(255,240,190,0.22)'); pool.addColorStop(1, 'rgba(255,240,190,0)');
  g.fillStyle = pool; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
  // a little red on the road behind
  const back = P(-hl - 3, 0), grad = g.createRadialGradient(back.x, back.y, 0, back.x, back.y, 7);
  grad.addColorStop(0, 'rgba(232,64,58,0.35)'); grad.addColorStop(1, 'rgba(232,64,58,0)');
  g.fillStyle = grad; g.fillRect(back.x - 7, back.y - 7, 14, 14);
}

// --- the traffic -------------------------------------------------------------------

/** A traffic light's colour for one direction ('h' along the streets, 'v' along the cross streets) at time t. */
function signal(jn, axis, t) {
  const u = (t + jn.j * 5 + jn.i * 1.7) % 16;
  const h = u < 6 ? 'green' : u < 7.5 ? 'yellow' : u < 8.5 ? 'red' : 'red';
  const v = u < 8.5 ? 'red' : u < 14.5 ? 'green' : u < 15.5 ? 'yellow' : 'red';
  return axis === 'h' ? h : v;
}

/**
 * The traffic of a town made by makeTown: `cars` cars, kei cars, taxis,
 * vans and kei trucks, and `buses` buses. Cars drive on the left, wait at
 * red lights, turn at junctions, keep their distance and stop for anyone in
 * front of them; buses keep to the streets with bus stops and wait at each.
 * Hand `vehicles` to drawTownView with the people (they sort with them).
 */
export function makeTraffic(town, { cars = 16, buses = 2, scooters = 1, motorbikes = 4, police = 1, seed = 5 } = {}) {
  const rng = seeded(seed);
  const { streets, crossStreets, junctions, W } = town, { SIDE, ROAD, VSIDE } = town.dims;
  const last = streets.length - 1, CRUISE = 30;
  // lanes: a vehicle's middle runs along them; driving on the left, east-bound keeps to the north half
  const hLanes = streets.flatMap((sy, i) => [
    { kind: 'h', i, dir: 1, y: sy + SIDE + Math.round(ROAD * 0.3) },
    { kind: 'h', i, dir: -1, y: sy + SIDE + Math.round(ROAD * 0.78) }]);
  const vLanes = crossStreets.flatMap((sx, j) => [
    { kind: 'v', j, dir: 1, x: sx + VSIDE + Math.round(ROAD * 0.73) },        // south-bound on the east side
    { kind: 'v', j, dir: -1, x: sx + VSIDE + Math.round(ROAD * 0.27) }]);
  // bus stops: those on a street's far (south) sidewalk, served by its west-bound lane, the kerb on the bus's left
  const stops = town.props.filter((p) => p.type === 'busStop').map((p) => ({ x: p.x, lane: hLanes.find((l) => l.dir === -1 && Math.abs(streets[l.i] + town.dims.STREET - p.y) < 6) })).filter((s) => s.lane);
  const busLanes = [...new Set(stops.map((s) => s.lane))];

  const TYPES = ['car', 'car', 'car', 'car', 'kei', 'kei', 'taxi', 'taxi', 'van', 'keiTruck'];
  const along = (v) => (v.lane.kind === 'h' ? v.x : v.y);
  // half its length on the ground along its lane (seen from above, a cross street's length is 0.6 of it)
  const half = (v) => (VEHICLES[v.type].length / 2) * (v.lane.kind === 'h' ? 1 : 0.6);
  const front = (v) => along(v) + v.lane.dir * half(v);
  const back = (v) => along(v) - v.lane.dir * half(v);
  const headingOf = (lane) => (lane.kind === 'h' ? (lane.dir > 0 ? 0 : 180) : lane.dir > 0 ? 90 : 270);
  const vehicles = [];
  let made = 0;
  const make = (type, lane, s) => {
    const v = { vehicle: true, id: ++made, type, seed: 1 + Math.floor(rng() * 9999), lane, speed: CRUISE, wait: 0, served: new Set(), from: lane.i ?? -1 };
    if (lane.kind === 'h') { v.x = s; v.y = lane.y; } else { v.x = lane.x; v.y = s; }
    v.heading = v.target = headingOf(lane);
    return v;
  };
  const clear = (lane, s, room) => !vehicles.some((o) => o.lane === lane && Math.abs(along(o) - s) < room);
  for (let n = 0; n < buses && busLanes.length; n++) { const lane = busLanes[n % busLanes.length], s = 40 + rng() * (W - 80); if (clear(lane, s, 50)) vehicles.push(make('bus', lane, s)); }
  for (let tries = 0; vehicles.length < cars + buses && tries < 400; tries++) {
    const lane = hLanes[Math.floor(rng() * hLanes.length)], s = 20 + rng() * (W - 40);
    if (clear(lane, s, 34)) vehicles.push(make(TYPES[Math.floor(rng() * TYPES.length)], lane, s));
  }
  for (let n = 0, tries = 0; n < scooters && tries < 100; tries++) {          // the delivery scooter(s)
    const lane = hLanes[Math.floor(rng() * hLanes.length)], s = 20 + rng() * (W - 40);
    if (clear(lane, s, 30)) { vehicles.push(make('scooter', lane, s)); n++; }
  }
  for (let n = 0, tries = 0; n < motorbikes && tries < 100; tries++) {        // scooters and motorbikes (one in four a motorbike)
    const lane = hLanes[Math.floor(rng() * hLanes.length)], s = 20 + rng() * (W - 40);
    if (clear(lane, s, 30)) { vehicles.push(make(n % 4 === 3 ? 'motorbike' : 'moped', lane, s)); n++; }
  }
  for (let n = 0, tries = 0; n < police && tries < 100; tries++) {            // the police car on patrol
    const lane = hLanes[Math.floor(rng() * hLanes.length)], s = 20 + rng() * (W - 40);
    if (clear(lane, s, 34)) { vehicles.push(make('police', lane, s)); n++; }
  }

  const lightAt = (jn, axis, t) => signal(jn, axis, t);
  /** Where a point on the ground is from a vehicle's middle: `ahead` along its heading, `side` across it (ground units). */
  function local(v, x, y) {
    const th = ((v.heading ?? 0) * Math.PI) / 180, dx = x - v.x, dy = (y - v.y) / KY;
    return { ahead: dx * Math.cos(th) + dy * Math.sin(th), side: -dx * Math.sin(th) + dy * Math.cos(th) };
  }
  /**
   * How far vehicle v can go before it touches vehicle o ahead of it (ground units), or null when o is not in
   * its way: o's body, turned with its own heading, measured along v's heading and across it.
   */
  function gapTo(v, o) {
    const { ahead, side } = local(v, o.x, o.y), V = VEHICLES[v.type], O = VEHICLES[o.type];
    const turn = (((o.heading ?? 0) - (v.heading ?? 0)) * Math.PI) / 180, c = Math.abs(Math.cos(turn)), sn = Math.abs(Math.sin(turn));
    const along = (c * O.length + sn * O.width) / 2, across = (sn * O.length + c * O.width) / 2;
    if (Math.abs(side) >= V.width / 2 + across - 1 || ahead <= 0) return null;     // (side by side in the next lane is fine)
    const gap = ahead - along - V.length / 2;
    return gap < 26 ? gap : null;                                        // only what is close ahead
  }
  /**
   * The vehicle (or the train) whose body stands on (x, y), with `margin`
   * pixels round it, or null: so nobody walks into one.
   */
  function hits(x, y, margin = 2) {
    for (const v of vehicles) {
      if (v.type === 'train') { if (Math.abs(x - v.x) < trainLen / 2 + margin && y > v.y - 6 - margin && y < v.y + 3 + margin) return v; continue; }
      const { ahead, side } = local(v, x, y), V = VEHICLES[v.type];
      if (Math.abs(ahead) < V.length / 2 + margin && Math.abs(side) < V.width / 2 + margin) return v;
    }
    return null;
  }
  /** How far v may go before it must stop: the vehicle ahead, a red light, someone in the way. */
  /** Is the next traffic light ahead of v (within 140 px) red or yellow for it? */
  function redAhead(v, t) {
    const d = v.lane.dir, f = front(v);
    for (const jn of junctions) {
      let stop;
      if (v.lane.kind === 'h' && jn.i === v.lane.i) stop = d > 0 ? jn.crossings[0].x - 2 : jn.box.x + jn.box.w + 2;
      else if (v.lane.kind === 'v' && jn.j === v.lane.j) {
        if (d > 0 && jn.i > 0) stop = jn.crossings.find((c) => c.axis === 'v' && c.y < jn.sy).y - 2;
        else if (d < 0 && jn.i < last) { const c = jn.crossings.find((c) => c.axis === 'v' && c.y > jn.sy); stop = c.y + c.h + 2; }
      }
      if (stop === undefined) continue;
      const dd = (stop - f) * d;
      if (dd >= -1 && dd < 140) return signal(jn, v.lane.kind, t) !== 'green';
    }
    return false;
  }
  function room(v, t, walkers) {
    const d = v.lane.dir, f = front(v);
    let free = Infinity;
    const filtering = TWO_WHEELS.includes(v.type) && redAhead(v, t);
    v.squeezing = false;
    for (const o of vehicles) if (o !== v && o.lane === v.lane && (along(o) - along(v)) * d > 0) {
      // two wheels at a red light: past the cars standing in the queue, by the kerb, to the front
      if (filtering && !TWO_WHEELS.includes(o.type) && o.speed < 0.5) { if ((back(o) - f) * d < 20) v.squeezing = true; continue; }
      free = Math.min(free, (back(o) - f) * d - 3);
    }
    // any other vehicle in its way, whichever way it faces (crossing a junction, turning): by their footprints;
    // when two are in each other's way, the one made first goes
    for (const o of vehicles) if (o !== v && o.type !== 'train' && o.lane !== v.lane) {
      const gap = gapTo(v, o);
      if (gap === null || (gapTo(o, v) !== null && v.id < o.id)) continue;
      free = Math.min(free, (gap - 3) * (v.lane.kind === 'h' ? 1 : KY));
    }
    // traffic lights
    for (const jn of junctions) {
      let stop;
      if (v.lane.kind === 'h' && jn.i === v.lane.i) stop = d > 0 ? jn.crossings[0].x - 2 : jn.box.x + jn.box.w + 2;
      else if (v.lane.kind === 'v' && jn.j === v.lane.j) {
        if (d > 0 && jn.i > 0) stop = jn.crossings.find((c) => c.axis === 'v' && c.y < jn.sy).y - 2;
        else if (d < 0 && jn.i < last) { const c = jn.crossings.find((c) => c.axis === 'v' && c.y > jn.sy); stop = c.y + c.h + 2; }
      }
      if (stop === undefined) continue;
      const dd = (stop - f) * d;
      if (dd < -1 || dd > 40) continue;
      const light = signal(jn, v.lane.kind, t);
      if (light === 'red' || (light === 'yellow' && dd > 4)) free = Math.min(free, dd);
    }
    // a closed level crossing ahead (on a cross street)
    if (rail && v.lane.kind === 'v' && closed(v.lane.j)) {
      const stop = d > 0 ? rail.y - 6 : rail.y + rail.h + 6, dd = (stop - f) * d;
      if (dd >= -1 && dd < 60) free = Math.min(free, dd);
    }
    // anyone in its way (people, animals, monsters, you): within its width, from inside it to a little ahead
    const byCars = free;
    v.blocker = null;
    for (const p of walkers) {
      if (p.vehicle || p.ball || !town.roadAt(p.x, p.y)) continue;           // (on the sidewalk, waiting to cross, is not in the way)
      const { ahead, side } = local(v, p.x, p.y);
      if (Math.abs(side) < VEHICLES[v.type].width / 2 + 3 && ahead > -VEHICLES[v.type].length / 2 - 2 && ahead < VEHICLES[v.type].length / 2 + 12) {
        const f = (ahead - VEHICLES[v.type].length / 2 - 3) * (v.lane.kind === 'h' ? 1 : KY);
        if (f < free) { free = f; if (f < byCars) v.blocker = p; }          // held up by someone on foot (not by a car)
      }
    }
    return free;
  }

  /** The lane beside v's own, the other way along the same street (where it pulls out to go round someone). */
  const otherLane = (v) => (v.lane.kind === 'h' ? hLanes.find((l) => l.i === v.lane.i && l.dir !== v.lane.dir) : vLanes.find((l) => l.j === v.lane.j && l.dir !== v.lane.dir));
  const sideOf = (v) => (v.lane.kind === 'h' ? 'y' : 'x');
  const laneAt = (lane) => (lane.kind === 'h' ? lane.y : lane.x);
  /** Pull v out into the other lane to go round whoever holds it up, if that lane is clear ahead and they are not in it. */
  function dodge(v) {
    const o = otherLane(v), who = v.blocker;
    if (!o || !who || v.type === 'bus' && !o) return;
    const k = sideOf(v), to = laneAt(o), V = VEHICLES[v.type];
    const across = Math.abs((k === 'y' ? who.y : who.x) - to) / (k === 'y' ? KY : 1);
    if (across < V.width / 2 + 3) return;                                   // they stand in the other lane too
    const s = along(v), d = v.lane.dir, reach = half(v) * 2 + 70;
    if (vehicles.some((c) => c !== v && c.type !== 'train' && (c.lane === o || c.dodge?.to === laneAt(v.lane) && c.lane.kind === v.lane.kind) && (along(c) - s) * d > -half(v) - half(c) - 6 && (along(c) - s) * d < reach)) return;   // oncoming traffic
    v.dodge = { k, home: laneAt(v.lane), to, who, since: 0 };
  }
  /** Turn v round into the other lane (a U-turn) when it is clear there; true if it did. */
  function uTurn(v) {
    const o = otherLane(v);
    if (!o || v.type === 'bus' || v.driftY !== undefined || v.toRank) return false;
    const s = along(v), room0 = half(v) * 2 + 40;
    if (vehicles.some((c) => c !== v && c.type !== 'train' && c.lane === o && Math.abs(along(c) - s) < room0)) return false;
    if (o.kind === 'h') v.y = o.y; else v.x = o.x;
    v.lane = o; v.dodge = null; v.target = headingOf(o); v.speed = 0;      // it swings round (about half a second)
    return true;
  }
  /** Ease v across to its dodge lane, and back home once past whoever held it up (or after a while). */
  function steer(v, dt) {
    const D = v.dodge, V = VEHICLES[v.type];
    D.since += dt;
    const past = local(v, D.who.x, D.who.y).ahead < -V.length / 2 - 4 || !town.roadAt(D.who.x, D.who.y);
    if (past || D.since > 8) D.back = true;
    const goal = D.back ? D.home : D.to, at = v[D.k], step = 12 * dt;
    v[D.k] = Math.abs(goal - at) <= step ? goal : at + Math.sign(goal - at) * step;
    v.target = (headingOf(v.lane) + (v[D.k] === goal ? 0 : (D.k === 'y' ? (goal > at ? 1 : -1) * v.lane.dir * 18 : (goal > at ? -1 : 1) * v.lane.dir * 18)) + 360) % 360;   // turned a little while it moves across
    if (D.back && v[D.k] === D.home) { v.dodge = null; v.target = headingOf(v.lane); }
  }
  /** Is there room on `lane` for v to turn into it where it is? */
  function roomOn(v, lane) {
    const at = lane.kind === 'h' ? v.x : v.y, mine = (VEHICLES[v.type].length / 2) * (lane.kind === 'h' ? 1 : 0.6);
    return !vehicles.some((o) => o !== v && o.lane === lane && Math.abs(along(o) - at) < half(o) + mine + 4);
  }
  /** Turn v onto another lane at its current spot. */
  /** Which way a turn into `lane` goes: 'l' or 'r' (on the screen, turning clockwise is to the right). */
  const turnSide = (v, lane) => (((headingOf(lane) - headingOf(v.lane) + 540) % 360) - 180 > 0 ? 'r' : 'l');
  function turn(v, lane) {
    v.signal = turnSide(v, lane); v.plan = false;
    v.dodge = null;
    if (lane.kind === 'h') { v.y = lane.y; v.from = lane.i; } else { v.x = lane.x; v.from = v.lane.i; }
    v.lane = lane; v.target = headingOf(lane); v.speed = Math.min(v.speed, 14);   // it swings round to its new heading
  }

  // the railway: one train running along it, stopping at each station; the level crossings close as it comes
  const rail = town.railway, train = rail && { vehicle: true, type: 'train', cars: 4, dir: 1, x: -400, y: rail.y + rail.h - 3, speed: 0, wait: 0, served: new Set() };
  if (train) vehicles.push(train);
  const trainLen = train ? train.cars * CARRIAGE - 2 : 0;
  const stations = town.buildings.filter((b) => b.type.startsWith('station')).map((b) => b.x);
  /** Is the level crossing of cross street j closed (the train within reach of it)? */
  const closed = (j) => !!train && train.wait <= 0 && Math.abs(train.x - (crossStreets[j] + town.dims.VSTREET / 2)) < trainLen / 2 + 70;
  function moveTrain(dt) {
    if (train.wait > 0) { train.wait -= dt; return; }
    const far = W + trainLen;
    if ((train.dir > 0 && train.x > far) || (train.dir < 0 && train.x < -trainLen)) {   // gone: back the other way in a while
      train.dir *= -1; train.wait = 5 + rng() * 5; train.served.clear(); train.speed = 0; return;
    }
    // slow for the next station, stop there, then go on
    const next = stations.filter((s) => !train.served.has(s) && (s - train.x) * train.dir > -2).sort((a, b) => (a - b) * train.dir)[0];
    const toStop = next === undefined ? Infinity : (next - train.x) * train.dir;
    const target = toStop < 2 ? 0 : Math.min(55, Math.sqrt(2 * 40 * Math.max(0, toStop)) + 3);
    train.speed += Math.max(-60 * dt, Math.min(25 * dt, target - train.speed));
    if (toStop < 2 && train.speed < 1) { train.served.add(next); train.speed = 0; train.dwell = 3; }
    if (train.dwell > 0) { train.dwell -= dt; return; }
    train.x += train.dir * train.speed * dt;
  }

  // the taxi rank: someone gets in (pickUp), the taxi pulls out into the street; a while later another comes and pulls in
  const ranks = [];
  let now = 0;
  /** Someone has got into a parked taxi (one of town.parked): it pulls out and drives off. */
  function pickUp(p) {
    const i = (town.parked ?? []).indexOf(p);
    if (i < 0) return null;
    const lane = hLanes.filter((l) => l.dir === -1).sort((a, b) => Math.abs(a.y - p.y) - Math.abs(b.y - p.y))[0];
    town.parked.splice(i, 1);
    const v = make('taxi', lane, p.x);
    Object.assign(v, { y: p.y, seed: p.seed, speed: 4, extra: true, driftY: lane.y, heading: 180, target: 155 });
    vehicles.push(v);
    ranks.push({ spot: { ...p }, lane, at: now + 20 + rng() * 15 });
    return v;
  }
  /** Ease v sideways to v.driftY (pulling out of the rank or into it), turned a little while it does. */
  function drift(v, dt) {
    const dy = v.driftY - v.y;
    if (Math.abs(dy) <= 10 * dt) { v.y = v.driftY; delete v.driftY; v.target = headingOf(v.lane); return; }
    v.y += Math.sign(dy) * 10 * dt;
  }

  function update(dt, t, walkers = []) {
    now = t;
    if (train) moveTrain(dt);
    for (const r of ranks) if (!r.coming && t >= r.at && clear(r.lane, W + 30, 40)) {   // a taxi comes back to the rank
      const v = make('taxi', r.lane, W + 30); v.toRank = r.spot; v.extra = true; vehicles.push(v); r.coming = true;
    }
    for (const p of town.props) if (p.type === 'crossingGate') { p.down = closed(p.crossing); p.flash = Math.floor(t * 3) % 2; }
    for (const v of vehicles) {
      if (v.type === 'train') continue;
      // swing round towards its heading (a quarter turn in about a third of a second)
      if (v.heading !== v.target) { const diff = ((v.target - v.heading + 540) % 360) - 180, turnBy = 280 * dt; v.heading = Math.abs(diff) <= turnBy ? v.target : (v.heading + Math.sign(diff) * turnBy + 360) % 360; }
      if (v.wait > 0) { v.wait -= dt; v.walking = false; v.brake = true; if (v.signal) v.blinkOn = Math.floor(t * 2.5) % 2 === 0; continue; }   // (standing: hazards blink)
      if (v.driftY !== undefined) {                                           // pulling out or in: not while someone stands against it
        const V = VEHICLES[v.type], patient = (v.driftHeld ?? 0) < 1.5;  // (after a moment only for someone right in its way: who stands beside it may be waiting for it)
        const near = walkers.some((p) => { if (p.vehicle || p.ball || p.monster) return false; const { ahead, side } = local(v, p.x, p.y); return patient ? Math.abs(ahead) < V.length / 2 + 5 && Math.abs(side) < V.width / 2 + 5 : ahead > 0 && ahead < V.length / 2 + 5 && Math.abs(side) < V.width / 2 + 2; });
        if (near) { v.speed = 0; v.walking = false; v.driftHeld = (v.driftHeld ?? 0) + dt; continue; }
        v.driftHeld = 0;
        drift(v, dt);
      }
      if (v.toRank && v.driftY === undefined && v.x - v.toRank.x < 28 && v.y !== v.toRank.y) { v.driftY = v.toRank.y; v.target = 205; }   // pulling in
      if (v.toRank && v.x <= v.toRank.x) {                                     // in its place: parked again
        town.parked.push({ ...v.toRank, seed: v.seed }); ranks.splice(ranks.findIndex((r) => r.spot === v.toRank), 1); v.gone = true; continue;
      }
      // held up for a long while, whatever by: find another way (a taxi gives up the rank and drives
      // on, pulling back into its lane; others turn round when the other lane is clear)
      v.held = v.speed < 0.5 && !(v.wait > 0) ? (v.held ?? 0) + dt : 0;
      if (v.held > 6) {
        if (v.toRank) { delete v.toRank; if (v.driftY !== undefined) v.driftY = v.lane.y; v.held = 0; }
        else if (v.driftY === undefined && uTurn(v)) v.held = 0;
      }
      let free = room(v, t, walkers);
      // held up by someone who stays on the road (you standing on a crossing, someone stuck): after a
      // moment pull out round them into the other lane when it is clear, then back in once past them
      v.stuck = v.blocker && free < 2 ? (v.stuck ?? 0) + dt : 0;
      if (v.stuck > 1.2 && !v.dodge) { dodge(v); if (v.dodge) { v.stuck = 0; free = room(v, t, walkers); } }
      // no way round (they stand across both lanes, in the middle of a junction): turn round and go another way
      if (v.stuck > 3.5 && uTurn(v)) { v.stuck = 0; free = room(v, t, walkers); }
      if (v.dodge) steer(v, dt);
      // the police car: now and then a call (lights flashing, a little faster) for a while
      if (v.type === 'police') {
        v.sirenT = (v.sirenT ?? 25 + rng() * 35) - dt;
        if (v.sirenT <= 0) { v.siren = !v.siren; v.sirenT = v.siren ? 12 + rng() * 10 : 40 + rng() * 50; }
      }
      if (v.siren) v.flash = Math.floor(t * 4) % 2;
      const target = free <= 0 ? 0 : Math.min(v.type === 'bus' ? CRUISE * 0.8 : v.siren ? CRUISE * 1.3 : CRUISE, free * 3);
      v.speed += Math.max(-90 * dt, Math.min(40 * dt, target - v.speed));
      v.brake = v.speed < 0.5 || target < v.speed - 1;                         // the brake lights: slowing down, or standing
      const step = Math.max(0, Math.min(v.speed * dt, Math.max(0, free)));
      const d = v.lane.dir, before = along(v);
      if (v.lane.kind === 'h') v.x += d * step; else v.y += d * step;
      if (TWO_WHEELS.includes(v.type) && !v.dodge && v.driftY === undefined && v.heading === v.target) {   // by the kerb (on its left) while squeezing past
        const want = v.squeezing || (v.kerb && v.speed < 8) ? 6 : 0, k = v.kerb ?? 0;
        v.kerb = Math.abs(want - k) <= 12 * dt ? want : k + Math.sign(want - k) * 12 * dt;
        const kerbSide = v.lane.kind === 'h' ? -d : d;
        if (v.lane.kind === 'h') v.y = v.lane.y + kerbSide * v.kerb; else v.x = v.lane.x + kerbSide * v.kerb;
      }
      const now = along(v);
      // a bus waits at its stops
      if (v.type === 'bus') for (const s of stops) if (s.lane === v.lane && !v.served.has(s) && (before - s.x) * (now - s.x) <= 0) { v.served.add(s); v.wait = 2.5; }
      // a vehicle on a round (the rubbish truck): it stops at each of its stops and waits until it is let go (v.wait = 0)
      if (v.route) for (const s of v.route) if (s.lane === v.lane && !s.done && (before - s.x) * (now - s.x) <= 0) {
        s.done = true;
        if (s.home) { v.gone = true; break; }                                  // back at its station: in it goes
        v.atStop = s; v.wait = 99; v.speed = 0;
      }
      // turns, decided a little before the turn (40 px) so the signal blinks on the way to it
      if (v.type !== 'bus' && !v.route && !v.toRank && v.driftY === undefined) {
        if (v.lane.kind === 'h') {
          if (!v.plan) for (const l of vLanes) { const dist = (l.x - now) * d; if (dist > 0 && dist < 40 && v.planFor !== l) {
            v.planFor = l; v.plan = (l.dir > 0 ? v.lane.i < last : v.lane.i > 0) && rng() < 0.3; v.signal = v.plan ? turnSide(v, l) : v.signal; break; } }
          for (const l of vLanes) if ((before - l.x) * (now - l.x) < 0 || before === l.x) {
            if (v.planFor === l && v.plan && roomOn(v, l)) { turn(v, l); break; }
            if (v.planFor === l && v.plan) { v.plan = false; v.signal = null; }   // no room: on, straight over
          }
        } else {
          const forcedAt = (l) => (d > 0 && l.i === last && l.dir > 0) || (d < 0 && l.i === 0 && l.dir < 0);
          if (!v.plan) for (const l of hLanes) { const dist = (l.y - now) * d; if (dist > 0 && dist < 40 && v.planFor !== l) {
            v.planFor = l; v.plan = forcedAt(l) || (l.i !== v.from && rng() < 0.3); v.signal = v.plan ? turnSide(v, l) : v.signal; break; } }
          for (const l of hLanes) if ((before - l.y) * (now - l.y) < 0) {
            const forced = forcedAt(l);
            if (forced && !roomOn(v, l)) {                                    // it must turn here: wait for a gap,
              const alt = hLanes.find((h) => h.i === l.i && h.dir !== l.dir);      // or after a while turn the other way
              if ((v.held ?? 0) > 2 && alt && roomOn(v, alt)) { turn(v, alt); break; }
              v.y = before; v.speed = 0; v.signal = turnSide(v, l); break;
            }
            if (forced || (v.planFor === l && v.plan && roomOn(v, l))) { turn(v, l); break; }
            if (v.planFor === l && v.plan) { v.plan = false; v.signal = null; }
          }
        }
      }
      if (v.signal && !v.plan && v.heading === v.target) v.signal = null;   // round the corner: the signal off
      v.blinkOn = !!v.signal && Math.floor(t * 2.5) % 2 === 0;
      // out of town: come back in somewhere else
      if (v.lane.kind === 'h' && (v.x < -40 || v.x > W + 40) && v.extra && !v.toRank) { v.gone = true; continue; }   // a taxi from the rank: gone (another comes)
      if (v.home) {                                                            // out on a call: after a while, back to its station
        v.outFor -= dt;
        if (v.outFor <= 0 && !v.route && v.lane.kind === 'h' && (v.x < -40 || v.x > W + 40)) { v.siren = false; v.route = [{ lane: v.homeLane, x: v.home.x, spot: v.home, home: true, done: false }]; }
      }
      if (v.route && v.lane.kind === 'h' && (v.x < -40 || v.x > W + 40)) {   // on a round: in again on the next stop's street, or done
        const next = v.route.find((s) => !s.done);
        if (!next) { v.gone = true; continue; }
        const s = next.lane.dir > 0 ? -30 : W + 30;
        if (clear(next.lane, s, 40)) { v.lane = next.lane; v.x = s; v.y = next.lane.y; v.heading = v.target = headingOf(next.lane); }
        continue;
      }
      if (v.lane.kind === 'h' && (v.x < -40 || v.x > W + 40) && !v.toRank) {
        const lanes = v.type === 'bus' ? busLanes : hLanes, lane = lanes[Math.floor(rng() * lanes.length)], s = lane.dir > 0 ? -30 : W + 30;
        if (clear(lane, s, 40)) {
          Object.assign(v, make(TYPES.includes(v.type) ? TYPES[Math.floor(rng() * TYPES.length)] : v.type, lane, s));   // (the bus, two wheels, the police car, the fire engine stay what they are)
        }
      }
    }
    for (let i = vehicles.length - 1; i >= 0; i--) if (vehicles[i].gone) vehicles.splice(i, 1);
    // the traffic lights' colours
    for (const p of town.props) if (p.type === 'trafficLight') { const jn = junctions.find((j) => `${j.i},${j.j}` === p.junction); p.lit = signal(jn, p.axis, t); }
  }

  /**
   * May someone at (x, y) step to (nx, ny)? Not onto a crossing while its
   * cars have green or yellow (anywhere else on foot is up to them).
   */
  function mayCross(x, y, nx, ny, t) {
    // the railway: wait at the level crossing while it is closed
    if (rail) {
      const onRail = (yy) => yy >= rail.y - 2 && yy < rail.y + rail.h + 2;
      if (onRail(ny) && !onRail(y)) { const j = crossStreets.findIndex((sx) => nx >= sx && nx < sx + town.dims.VSTREET); if (j >= 0 && closed(j)) return false; }
    }
    if (!town.roadAt(nx, ny) || town.roadAt(x, y)) return true;
    const c = town.crossingAt(nx, ny);
    return !c || signal(c.junction, c.axis, t) === 'red';
  }

  /**
   * Send a vehicle of `type` round some stops ({ x, y }: places on a sidewalk): it comes in on the
   * kerb-side lane of each one's street in turn, stops beside it (its back by the spot), waits there
   * (v.atStop is that stop, v.wait 99) until let go (set v.wait to 0), and leaves the town when done.
   */
  function sendRound(type, spots) {
    const route = spots.map((p) => {
      const lane = hLanes.filter((l) => l.dir > 0 && l.y > p.y).sort((a, b) => a.y - b.y)[0];   // the street below it, the lane by its kerb
      return lane && { lane, x: p.x + VEHICLES[type].length * 0.42, spot: p, done: false };
    }).filter(Boolean).sort((a, b) => a.lane.y - b.lane.y || a.x - b.x);
    if (!route.length || !clear(route[0].lane, -30, 40)) return null;
    const v = make(type, route[0].lane, -30);
    v.route = route; vehicles.push(v);
    return v;
  }

  /**
   * A call (the fire engine): a vehicle of `type` pulls out from `spot` (in front of its station, on the
   * sidewalk) into the kerb-side lane of the street below, lights flashing, drives round the town for
   * `minutes` of its own (seconds, really: `secs`), then comes back along that street and goes in.
   */
  function callOut(type, spot, secs = 40) {
    const lane = hLanes.filter((l) => l.dir > 0 && l.y > spot.y).sort((a, b) => a.y - b.y)[0];
    if (!lane || !clear(lane, spot.x, 60)) return null;
    const v = make(type, lane, spot.x);
    v.y = lane.y - 10; v.driftY = lane.y; v.target = 25;                       // pulling out, turned a little
    v.siren = true; v.home = spot; v.homeLane = lane; v.outFor = secs;
    vehicles.push(v);
    return v;
  }

  return { vehicles, update, mayCross, lightAt, train, crossingClosed: closed, hits, pickUp, sendRound, callOut };
}
