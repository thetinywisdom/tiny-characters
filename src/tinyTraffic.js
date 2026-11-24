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
//   vehicleLights(v)            its head and tail lights, for the night
//   makeTraffic(town, opts)     { vehicles, update(dt, t, walkers), mayCross(x, y, nx, ny, t),
//                               lightAt(junction, axis, t) }
//
// Plain ES module, no dependencies (seeded from tinyCharacters).

import { seeded } from './tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', METAL = '#a8aeb4', DARK = '#3a3f44';
const LAMP = '#fff2c0', TAIL = '#e8403a', GLASS = '#5d7590', TYRE = '#26282c', ORANGE = '#f2a040';
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');

/** Body colours: white and silver most, then black, red, blue, a few bright ones. */
export const CAR_COLORS = ['#f2f2ee', '#f2f2ee', '#c8ccd0', '#c8ccd0', '#3a3d42', '#c8402c', '#2f5f9a', '#3f7a5a', '#e8c840', '#8a5a7a', '#d87a3a'];
const TAXI_COLORS = [['#f2c230', '#3a3d42'], ['#3a3d42', '#f2c230'], ['#3f8a5a', '#f2f2ee'], ['#f2f2ee', '#2f5f9a']];
const KY = 0.6;                                  // how much of a top shows: depth x 0.6 (the buildings' roofs too)

// --- the shapes ---------------------------------------------------------------------
// A shape is a function (u, v, z, c, c2) -> colour or null for the block at u
// along the vehicle (+ is its front), v across it (+ is its left), z up.
// Blocks are 1 x 1 x 1; the colours are the paint, the renderer shades them.

/** A car-like body: wheels in arches, a lower body with lamps, bumpers, grille, plates and a side skirt, a cabin with a sloped windscreen and rear window, pillars and mirrors. */
function carShape(o) {
  const hl = o.L / 2, hw = o.W / 2, R = o.r ?? 2.6, base = R * 0.75;
  return (u, v, z, c, c2) => {
    const au = Math.abs(u), av = Math.abs(v);
    if (au > hl || av > hw || z < 0) return null;
    // wheels (a tyre and a hub), in dark arches
    for (const uc of o.wheels) {
      const d = (u - uc) ** 2 + (z - R) ** 2;
      if (d <= R * R && av >= hw - 2.2) return d < 1.3 && av > hw - 0.7 ? METAL : TYRE;
      if (d <= (R + 0.9) ** 2 && av > hw - 0.7 && z >= base) return shade(c, 0.45);
    }
    if (z < base) return null;
    if (au > hl - 1 && av > hw - 1) return null;                         // rounded corners
    if (z < o.body) {
      const frontFace = u > hl - 1, backFace = u < -hl + 1, low = z < base + 1.2;
      if (low && (frontFace || backFace)) return av < 1.3 ? WHITE : DARK;   // bumpers, plates
      if (frontFace && z >= o.body - 2.5 && z < o.body - 0.8 && av >= hw - 3.2) return av > hw - 1.6 ? LAMP : shade(LAMP, 0.85);   // twin headlamps
      if (frontFace && av < 2.6) return DARK;                             // grille
      if (backFace && z >= o.body - 2.5 && z < o.body - 0.8 && av >= hw - 3) return TAIL;
      if (low && av > hw - 0.7) return shade(c, 0.62);                    // the side skirt
      if (o.stripe && z >= o.body - 2 && z < o.body - 1) return c2;
      if (av > hw - 0.7 && Math.abs(u - o.door) < 0.6 && z > base + 1) return shade(c, 0.72);   // the doors' line
      return c;
    }
    if (z >= o.H) return o.extra ? o.extra(u, v, z, c, c2) : null;
    // the cabin: narrower than the body, its front and back sloping in
    const k = z - o.body, front = o.cabF - k * o.slopeF, back = o.cabB + k * o.slopeB;
    if (u > front || u < back || av > hw - 1 - k * 0.15) {
      if (z < o.body + 1.2 && av > hw - 0.9 && Math.abs(u - (o.cabF - 0.8)) < 0.8) return shade(c, 0.55);   // mirrors
      return null;
    }
    if (z >= o.H - 1) return c;                                          // the roof
    if (o.panel && u < o.panel) return c;                                 // a van's panel sides
    if (av > hw - 2.6 && Math.abs(u - o.door) < 0.7) return c;            // the pillar between the windows
    return GLASS;
  };
}

const wheel = (u, v, z, uc, R, hw) => { const d = (u - uc) ** 2 + (z - R) ** 2; return d <= R * R && Math.abs(v) >= hw - 2.2 ? (d < 1.3 && Math.abs(v) > hw - 0.7 ? METAL : TYRE) : null; };
const CAR = { L: 30, W: 13, H: 11.5, body: 6.5, cabF: 5.5, slopeF: 0.9, cabB: -8.5, slopeB: 0.6, door: -1.5, wheels: [9, -9] };
const SHAPES = {
  car: { label: 'Car', L: 30, W: 13, H: 11.5, shape: carShape(CAR) },
  kei: { label: 'Kei car', L: 24, W: 12, H: 13, shape: carShape({ L: 24, W: 12, H: 13, body: 6.5, cabF: 7, slopeF: 0.7, cabB: -11.5, slopeB: 0.15, door: -1, wheels: [7.5, -7.5], r: 2.4 }) },
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
};

// --- the renderer -------------------------------------------------------------------
// Each screen pixel looks into the scene along the view (from above and in
// front); the first block it meets gives its colour, shaded by which face it
// is: tops light, faces towards the light brighter, faces away darker.
const LIGHT = [-0.45, 0.89];
const SPRITES = new Map();
const canvasOf = (w, h) => (typeof document !== 'undefined' ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : new OffscreenCanvas(w, h));
const DIRS = 16;
/** The sprite of a vehicle at one of 16 headings: { canvas, ox, oy } (where its ground middle is). */
function sprite(type, c, c2, dir) {
  const key = `${type}|${c}|${c2}|${dir}`;
  if (SPRITES.has(key)) return SPRITES.get(key);
  const S = SHAPES[type], th = (dir / DIRS) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
  const hl = S.L / 2, hw = S.W / 2, top = S.H + 1;
  // the screen box: the corners of the shape
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const u of [-hl, hl]) for (const v of [-hw, hw]) for (const z of [0, top]) {
    const X = u * cs - v * sn, Y = (u * sn + v * cs) * KY - z;
    x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
  }
  x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 1; y1 = Math.ceil(y1) + 1;
  const w = x1 - x0, h = y1 - y0, cv = canvasOf(w, h), g = cv.getContext('2d');
  const cell = (q) => Math.floor(q);
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const X = x0 + px + 0.5, sy = y0 + py + 0.5;
    let prev = null;
    for (let z = top; z >= 0; z -= 0.2) {
      // the line of sight: Y * KY - z = sy, nearer to you as z rises
      const Y = (sy + z) / KY, u = X * cs + Y * sn, v = -X * sn + Y * cs;
      const bu = cell(u), bv = cell(v), bz = cell(z);
      const col = S.shape(bu + 0.5, bv + 0.5, bz + 0.5, c, c2);
      if (col) {
        let f = 1.1, face = 'top';                                      // a top
        if (prev && prev[2] === bz) {
          let n;
          if (prev[0] !== bu) { const s = prev[0] > bu ? 1 : -1; n = [s * cs, s * sn]; face = 'end'; }
          else { const s = prev[1] > bv ? 1 : -1; n = [-s * sn, s * cs]; face = 'side'; }
          f = 0.74 + 0.3 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1]);
        }
        // glass: the sloped windscreen and rear window one tone (no steps), the side windows darker
        if (col === GLASS) f = face === 'side' ? 0.8 : 1.04;
        if (col === LAMP || col === TAIL || col === ORANGE) f = 1;
        g.fillStyle = shade(col, f); g.fillRect(px, py, 1, 1);
        break;
      }
      prev = [bu, bv, bz];
    }
  }
  const out = { canvas: cv, ox: -x0, oy: -y0 };
  SPRITES.set(key, out);
  return out;
}

const HEADING = { right: 0, down: 90, left: 180, up: 270 };
/** Every vehicle: type -> { label, length, width, height, box } (box: the largest sprite, { w, h, below } pixels). */
export const VEHICLES = Object.fromEntries(Object.entries(SHAPES).map(([k, S]) => {
  const hl = S.L / 2, hw = S.W / 2, rad = Math.hypot(hl, hw);
  return [k, { label: S.label, length: S.L, width: S.W, height: S.H, box: { w: Math.ceil(rad * 2) + 2, h: Math.ceil(rad * KY * 2 + S.H + 2) + 2, below: Math.ceil(rad * KY) + 1 } }];
}));

/** A vehicle's colours from its seed (or its own color / color2). */
function coloursOf(v) {
  const rng = seeded((v.seed ?? 1) * 53 + 5);
  const [tc, tc2] = TAXI_COLORS[Math.floor(rng() * TAXI_COLORS.length)];
  const c = v.color ?? (v.type === 'taxi' ? tc : v.type === 'bus' ? ['#f2f2ee', '#e8c840', '#3f7a5a'][Math.floor(rng() * 3)] : CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)]);
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
  const type = SHAPES[v.type] ? v.type : 'car', [c, c2] = coloursOf(v);
  const heading = v.heading ?? HEADING[v.facing ?? 'right'];
  const dir = ((Math.round(heading / (360 / DIRS)) % DIRS) + DIRS) % DIRS;
  const s = sprite(type, c, c2, dir);
  g.drawImage(s.canvas, Math.round(v.x) - s.ox, Math.round(v.y) - s.oy);
}

/** A vehicle's lights at night: headlights ahead of it, tail lights behind: [{ x, y, r, c }]. */
export function vehicleLights(v) {
  const S = SHAPES[v.type] ?? SHAPES.car, th = ((v.heading ?? HEADING[v.facing ?? 'right']) * Math.PI) / 180;
  const at = (u, z) => ({ x: v.x + u * Math.cos(th), y: v.y + u * Math.sin(th) * KY - z });
  return [{ ...at(S.L / 2 + 4, 2), r: 11, c: '#fff2c0' }, { ...at(-S.L / 2, 3.5), r: 4, c: '#e8403a' }];
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
export function makeTraffic(town, { cars = 16, buses = 2, seed = 5 } = {}) {
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
  const make = (type, lane, s) => {
    const v = { vehicle: true, type, seed: 1 + Math.floor(rng() * 9999), lane, speed: CRUISE, wait: 0, served: new Set(), from: lane.i ?? -1 };
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

  const lightAt = (jn, axis, t) => signal(jn, axis, t);
  /** How far v may go before it must stop: the vehicle ahead, a red light, someone in the way. */
  function room(v, t, walkers) {
    const d = v.lane.dir, f = front(v);
    let free = Infinity;
    for (const o of vehicles) if (o !== v && o.lane === v.lane && (along(o) - along(v)) * d > 0) free = Math.min(free, (back(o) - f) * d - 3);
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
    // anyone in front (people, animals, monsters, you)
    for (const p of walkers) {
      if (p.vehicle) continue;
      if (v.lane.kind === 'h') { const a = (p.x - f) * d; if (a > -2 && a < 12 && Math.abs(p.y - v.y) < 7) free = Math.min(free, a - 3); }
      else { const a = (p.y - f) * d; if (a > -2 && a < 10 && Math.abs(p.x - v.x) < 7) free = Math.min(free, a - 3); }
    }
    return free;
  }

  /** Is there room on `lane` for v to turn into it where it is? */
  function roomOn(v, lane) {
    const at = lane.kind === 'h' ? v.x : v.y, mine = (VEHICLES[v.type].length / 2) * (lane.kind === 'h' ? 1 : 0.6);
    return !vehicles.some((o) => o !== v && o.lane === lane && Math.abs(along(o) - at) < half(o) + mine + 4);
  }
  /** Turn v onto another lane at its current spot. */
  function turn(v, lane) {
    if (lane.kind === 'h') { v.y = lane.y; v.from = lane.i; } else { v.x = lane.x; v.from = v.lane.i; }
    v.lane = lane; v.target = headingOf(lane); v.speed = Math.min(v.speed, 14);   // it swings round to its new heading
  }

  function update(dt, t, walkers = []) {
    for (const v of vehicles) {
      // swing round towards its heading (a quarter turn in about a third of a second)
      if (v.heading !== v.target) { const diff = ((v.target - v.heading + 540) % 360) - 180, turnBy = 280 * dt; v.heading = Math.abs(diff) <= turnBy ? v.target : (v.heading + Math.sign(diff) * turnBy + 360) % 360; }
      if (v.wait > 0) { v.wait -= dt; v.walking = false; continue; }
      const free = room(v, t, walkers);
      const target = free <= 0 ? 0 : Math.min(v.type === 'bus' ? CRUISE * 0.8 : CRUISE, free * 3);
      v.speed += Math.max(-90 * dt, Math.min(40 * dt, target - v.speed));
      const step = Math.max(0, Math.min(v.speed * dt, Math.max(0, free)));
      const d = v.lane.dir, before = along(v);
      if (v.lane.kind === 'h') v.x += d * step; else v.y += d * step;
      const now = along(v);
      // a bus waits at its stops
      if (v.type === 'bus') for (const s of stops) if (s.lane === v.lane && !v.served.has(s) && (before - s.x) * (now - s.x) <= 0) { v.served.add(s); v.wait = 2.5; }
      // turns
      if (v.type !== 'bus') {
        if (v.lane.kind === 'h') {
          for (const l of vLanes) if ((before - l.x) * (now - l.x) < 0 || before === l.x) {
            const can = l.dir > 0 ? v.lane.i < last : v.lane.i > 0;
            if (can && rng() < 0.3 && roomOn(v, l)) { turn(v, l); break; }
          }
        } else {
          for (const l of hLanes) if ((before - l.y) * (now - l.y) < 0) {
            const forced = (d > 0 && l.i === last && l.dir > 0) || (d < 0 && l.i === 0 && l.dir < 0);
            if (forced && !roomOn(v, l)) { v.y = before; v.speed = 0; break; }   // it must turn here: wait for a gap
            if (forced || (l.i !== v.from && rng() < 0.3 && roomOn(v, l))) { turn(v, l); break; }
          }
        }
      }
      // out of town: come back in somewhere else
      if (v.lane.kind === 'h' && (v.x < -40 || v.x > W + 40)) {
        const lanes = v.type === 'bus' ? busLanes : hLanes, lane = lanes[Math.floor(rng() * lanes.length)], s = lane.dir > 0 ? -30 : W + 30;
        if (clear(lane, s, 40)) {
          Object.assign(v, make(v.type === 'bus' ? 'bus' : TYPES[Math.floor(rng() * TYPES.length)], lane, s));
        }
      }
    }
    // the traffic lights' colours
    for (const p of town.props) if (p.type === 'trafficLight') { const jn = junctions.find((j) => `${j.i},${j.j}` === p.junction); p.lit = signal(jn, p.axis, t); }
  }

  /**
   * May someone at (x, y) step to (nx, ny)? Not onto a crossing while its
   * cars have green or yellow (anywhere else on foot is up to them).
   */
  function mayCross(x, y, nx, ny, t) {
    if (!town.roadAt(nx, ny) || town.roadAt(x, y)) return true;
    const c = town.crossingAt(nx, ny);
    return !c || signal(c.junction, c.axis, t) === 'red';
  }

  return { vehicles, update, mayCross, lightAt };
}
