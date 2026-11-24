// Tiny Traffic: cars, kei cars, taxis, vans, kei trucks and buses, drawn in
// the people's pixel style (one canvas pixel = one pixel, like the people),
// and the traffic of a town: lanes (driving on the left, as in Japan),
// traffic lights at the junctions, turns, buses stopping at the bus stops,
// cars stopping for anyone in front of them.
//
//   drawVehicle(g, v, t)        one vehicle { type, x, y, facing, color, seed }:
//                               centred on x, its wheels on y
//   VEHICLES                    type -> { label, side: [len, h], front: [w, h] }
//   vehicleLights(v)            its head and tail lights, for the night
//   makeTraffic(town, opts)     { vehicles, update(dt, t, walkers), mayCross(x, y, nx, ny),
//                               lightAt(junction, axis) }
//
// Plain ES module, no dependencies (seeded from tinyCharacters).

import { seeded } from './tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', RED = '#d8443c', METAL = '#9aa0a6', DARK = '#3a3f44';
const LAMP = '#fff2c0', TAIL = '#e8403a', GLASS = '#7f9ab4', GLASS2 = '#55687a';
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');

/** Body colours: white and silver most, then black, red, blue, a few bright ones. */
export const CAR_COLORS = ['#f2f2ee', '#f2f2ee', '#c8ccd0', '#c8ccd0', '#3a3d42', '#c8402c', '#2f5f9a', '#3f7a5a', '#e8c840', '#8a5a7a', '#d87a3a'];
const TAXI_COLORS = [['#f2c230', '#3a3d42'], ['#3a3d42', '#f2c230'], ['#3f8a5a', '#f2f2ee'], ['#f2f2ee', '#2f5f9a']];

/**
 * Each: label, its size ([[length, height] side on, [width, height] head on]), and its drawings: side(R, c) facing right, front(R, c) and
 * back(R, c). R(colour, dx, up, w, h) draws from the bottom-left.
 * The roof shows from above, as on the buildings.
 */
const DEFS = {
  car: { label: 'Car', size: [[22, 12], [12, 14]],
    side: (R, c) => {
      wheels(R, [3, 15]);
      R(c, 0, 2, 22, 4); R(shade(c, 0.72), 0, 2, 22, 1); R(shade(c, 0.85), 11, 3, 1, 3);   // the side, the door
      R(LAMP, 21, 4, 1, 1); R(TAIL, 0, 4, 1, 1);
      const top = shade(c, 1.12), edge = shade(c, 0.86);
      R(top, 16, 6, 6, 4); R(top, 0, 6, 4, 4); R(edge, 16, 9, 6, 1); R(edge, 0, 9, 4, 1);    // bonnet and boot, from above
      R(c, 4, 6, 12, 2); R(GLASS2, 5, 6, 4, 2); R(GLASS2, 10, 6, 5, 2);                    // the cabin's side windows
      R(GLASS, 4, 8, 2, 4); R(top, 6, 8, 7, 4); R(GLASS, 13, 8, 3, 4); R(edge, 4, 11, 12, 1); // rear window, roof, windscreen
    },
    front: (R, c) => headOn(R, c, { w: 12, face: 4, bonnet: 2, screen: 2, roof: 3, rear: 1, boot: 1 }),
    back: (R, c) => tailOn(R, c, { w: 12, face: 4, bonnet: 1, screen: 1, roof: 3, rear: 2, boot: 2 }) },
  kei: { label: 'Kei car', size: [[18, 13], [11, 12]],
    side: (R, c) => {
      wheels(R, [2, 12]);
      R(c, 0, 2, 18, 4); R(shade(c, 0.72), 0, 2, 18, 1); R(shade(c, 0.85), 8, 3, 1, 3); R(LAMP, 17, 4, 1, 1); R(TAIL, 0, 4, 1, 1);
      const top = shade(c, 1.12), edge = shade(c, 0.86);
      R(top, 15, 6, 3, 4); R(edge, 15, 9, 3, 1);                                            // a short bonnet
      R(c, 0, 6, 15, 3); R(GLASS2, 1, 6, 6, 3); R(GLASS2, 8, 6, 6, 3);                     // tall side windows
      R(top, 0, 9, 12, 4); R(GLASS, 12, 9, 3, 4); R(edge, 0, 12, 15, 1);                   // the boxy roof, windscreen
    },
    front: (R, c) => headOn(R, c, { w: 11, face: 4, bonnet: 1, screen: 2, roof: 4, rear: 0, boot: 0 }),
    back: (R, c) => tailOn(R, c, { w: 11, face: 3, bonnet: 0, screen: 1, roof: 4, rear: 2, boot: 0 }) },
  taxi: { label: 'Taxi', size: [[22, 12], [12, 14]],
    side: (R, c, c2) => { DEFS.car.side(R, c); R(c2, 0, 4, 22, 1); R(WHITE, 8, 9, 4, 2); R(c2, 9, 10, 2, 1); R(shade(c2, 0.8), 8, 9, 4, 1); },
    front: (R, c, c2) => { headOn(R, c, { w: 12, face: 4, bonnet: 2, screen: 2, roof: 3, rear: 1, boot: 1 }, c2); R(WHITE, 4, 10, 4, 2); R(c2, 5, 11, 2, 1); },
    back: (R, c, c2) => { tailOn(R, c, { w: 12, face: 4, bonnet: 1, screen: 1, roof: 3, rear: 2, boot: 2 }, c2); R(WHITE, 4, 9, 4, 2); R(c2, 5, 10, 2, 1); } },
  van: { label: 'Delivery van', size: [[22, 13], [12, 14]],
    side: (R, c, c2) => {
      wheels(R, [3, 15]);
      R(c, 0, 2, 22, 7); R(shade(c, 0.72), 0, 2, 22, 1); R(c2, 0, 5, 17, 2); R(shade(c, 0.85), 16, 3, 1, 6);
      R(GLASS2, 17, 6, 4, 2); R(LAMP, 21, 4, 1, 1); R(TAIL, 0, 4, 1, 1);
      const top = shade(c, 1.1), edge = shade(c, 0.86);
      R(top, 0, 9, 19, 4); R(GLASS, 19, 9, 3, 4); R(edge, 0, 12, 22, 1); R(shade(top, 0.94), 0, 10, 19, 1);   // the long roof from above
    },
    front: (R, c, c2) => headOn(R, c, { w: 12, face: 7, faceGlass: 3, bonnet: 0, screen: 0, roof: 6, rear: 0, boot: 0 }, c2),
    back: (R, c, c2) => { tailOn(R, c, { w: 12, face: 7, backGlass: 2, bonnet: 0, screen: 0, roof: 6, rear: 0, boot: 0 }, c2); R(shade(c, 0.7), 6, 2, 1, 6); } },
  keiTruck: { label: 'Kei truck', size: [[20, 12], [11, 14]],
    side: (R, c, c2) => {
      wheels(R, [2, 13]);
      const top = shade(c, 1.12), edge = shade(c, 0.86);
      R(c, 13, 2, 7, 4); R(c, 13, 6, 7, 2); R(GLASS2, 14, 6, 4, 2); R(LAMP, 19, 3, 1, 1);  // the cab, its side window
      R(top, 13, 8, 4, 4); R(GLASS, 17, 8, 3, 4); R(edge, 13, 11, 7, 1);                   // its roof and windscreen from above
      R(c, 0, 2, 13, 3); R(shade(c, 0.72), 0, 2, 20, 1); R(TAIL, 0, 3, 1, 1);              // the bed's side
      R('#8a8a84', 1, 5, 12, 4); R(c, 0, 5, 1, 5); R(shade(c, 0.86), 0, 9, 13, 1);           // its floor, tailgate, far rail
      R(c2, 4, 5, 5, 3); R(shade(c2, 1.15), 4, 7, 5, 1);                                   // a load
    },
    front: (R, c, c2) => {
      wheels(R, [0, 9], 2);
      const top = shade(c, 1.12);
      R(c, 0, 1, 11, 4); R(shade(c, 0.72), 0, 1, 11, 1); R(LAMP, 1, 3, 2, 1); R(LAMP, 8, 3, 2, 1); R(DARK, 4, 2, 3, 1);   // the cab's flat front
      R(c, 0, 5, 11, 2); R(GLASS, 1, 5, 9, 2);                                               // its windscreen
      R(top, 0, 7, 11, 2);                                                                   // its roof
      R(shade(c, 0.8), 0, 9, 11, 5); R('#8a8a84', 1, 9, 9, 4); R(c2, 3, 10, 5, 2); R(shade(c2, 1.15), 3, 11, 5, 1);   // the open bed behind, a load
    },
    back: (R, c, c2) => {
      wheels(R, [0, 9], 2);
      const top = shade(c, 1.12);
      R(c, 0, 1, 11, 3); R(shade(c, 0.72), 0, 1, 11, 1); R(TAIL, 1, 2, 2, 1); R(TAIL, 8, 2, 2, 1); R(WHITE, 4, 2, 3, 1);   // the tailgate
      R(shade(c, 0.8), 0, 4, 11, 5); R('#8a8a84', 1, 4, 9, 5); R(c2, 3, 5, 5, 2); R(shade(c2, 1.15), 3, 6, 5, 1);     // the bed, a load
      R(c, 0, 9, 11, 2); R(GLASS2, 2, 9, 7, 1);                                              // the cab's back, its little window
      R(top, 0, 11, 11, 3);                                                                  // its roof
    } },
  bus: { label: 'Bus', size: [[40, 18], [14, 20]],
    side: (R, c, c2) => {
      wheels(R, [5, 30]);
      R(c, 0, 2, 40, 11); R(shade(c, 0.72), 0, 2, 40, 1); R(c2, 0, 4, 40, 2);
      for (let x = 2; x < 30; x += 5) R(GLASS2, x, 8, 4, 3);
      R(GLASS2, 32, 3, 4, 9); R(INK, 34, 3, 1, 9);                            // the door
      R(GLASS, 37, 6, 3, 6); R(INK, 37, 11, 3, 1); R('#f2a040', 37, 11, 2, 1); // windscreen, destination
      R(LAMP, 39, 4, 1, 1); R(TAIL, 0, 5, 1, 2);
      const top = shade(c, 1.1), edge = shade(c, 0.86);
      R(top, 0, 13, 40, 5); R(edge, 0, 17, 40, 1); R(shade(top, 0.94), 0, 15, 40, 1);   // the roof from above
      R(METAL, 12, 14, 10, 3); R(shade(METAL, 0.8), 12, 14, 10, 1); R(METAL, 30, 14, 4, 2);   // air conditioning, a hatch
    },
    front: (R, c, c2) => {
      wheels(R, [0, 12], 2);
      const top = shade(c, 1.1);
      R(c, 0, 1, 14, 11); R(shade(c, 0.72), 0, 1, 14, 1); R(c2, 0, 3, 14, 1); R(LAMP, 1, 2, 2, 1); R(LAMP, 11, 2, 2, 1);   // the tall front
      R(GLASS, 1, 5, 12, 5); R(INK, 6, 5, 1, 5); R(INK, 1, 10, 12, 2); R('#f2a040', 3, 11, 8, 1);                  // windscreen, destination
      R(top, 0, 12, 14, 8); R(shade(top, 0.94), 0, 15, 14, 1); R(METAL, 4, 14, 6, 3); R(shade(METAL, 0.8), 4, 14, 6, 1); R(shade(c, 0.86), 0, 19, 14, 1);   // the roof running back
    },
    back: (R, c, c2) => {
      wheels(R, [0, 12], 2);
      const top = shade(c, 1.1);
      R(c, 0, 1, 14, 11); R(shade(c, 0.72), 0, 1, 14, 1); R(c2, 0, 3, 14, 1); R(TAIL, 1, 4, 2, 2); R(TAIL, 11, 4, 2, 2); R(WHITE, 6, 2, 2, 1);
      R(GLASS2, 2, 7, 10, 3); R(DARK, 2, 6, 10, 1);                                          // rear window, engine grille
      R(top, 0, 12, 14, 8); R(shade(top, 0.94), 0, 16, 14, 1); R(METAL, 4, 15, 6, 3); R(shade(METAL, 0.8), 4, 15, 6, 1); R(shade(c, 0.86), 0, 19, 14, 1);
    } },
};

function wheels(R, xs, w = 4) { for (const x of xs) { R(INK, x, 0, w, w === 4 ? 3 : 2); if (w === 4) R(METAL, x + 1, 1, 2, 1); } }
/**
 * Head on, with depth like the side views: the front face (bumper, lamps,
 * grille; a van's and a bus's tall front has its windscreen in it), then
 * the top seen from above, running back a third of the length: bonnet,
 * windscreen, roof (the cabin a pixel narrower each side), rear window,
 * boot, the far edge a shade darker.
 */
function headOn(R, c, o, stripe) {
  const { w } = o, face = shade(c, 0.9), top = shade(c, 1.14), edge = shade(c, 0.8);
  wheels(R, [0, w - 2], 2);
  let y = 1;
  R(face, 0, y, w, o.face); R(shade(c, 0.66), 0, y, w, 1); R(LAMP, 1, y + 1, 2, 1); R(LAMP, w - 3, y + 1, 2, 1); R(DARK, 4, y + 1, w - 8, 1); R(WHITE, Math.floor(w / 2) - 1, y, 2, 1);
  if (stripe && o.face > 4) R(stripe, 0, y + 2, w, 1);
  if (o.faceGlass) { R(GLASS, 1, y + o.face - o.faceGlass, w - 2, o.faceGlass); R(face, Math.floor(w / 2), y + o.face - o.faceGlass, 1, o.faceGlass); }
  y += o.face;
  if (o.bonnet) { R(top, 0, y, w, o.bonnet); R(shade(top, 1.08), 0, y, w, 1); y += o.bonnet; }
  // the cabin, a pixel narrower each side: windscreen (with mirrors), roof, rear window
  if (o.screen) { R(c, 1, y, w - 2, o.screen); R(GLASS, 2, y, w - 4, o.screen); R(face, 0, y, 1, 1); R(face, w - 1, y, 1, 1); y += o.screen; }
  const inset = o.screen || o.rear ? 1 : 0;
  R(top, inset, y, w - inset * 2, o.roof); y += o.roof;
  if (o.rear) { R(c, 1, y, w - 2, o.rear); R(GLASS2, 2, y, w - 4, o.rear); y += o.rear; }
  if (o.boot) { R(top, 0, y, w, o.boot); y += o.boot; }
  R(edge, o.boot ? 0 : inset, y - 1, o.boot ? w : w - inset * 2, 1);
}
/** From behind: the back (bumper, tail lamps, plate), then from above the boot, rear window, roof, windscreen, bonnet. */
function tailOn(R, c, o, stripe) {
  const { w } = o, face = shade(c, 0.9), top = shade(c, 1.14), edge = shade(c, 0.8);
  wheels(R, [0, w - 2], 2);
  let y = 1;
  R(face, 0, y, w, o.face); R(shade(c, 0.66), 0, y, w, 1); R(TAIL, 1, y + 2, 2, 1); R(TAIL, w - 3, y + 2, 2, 1); R(WHITE, Math.floor(w / 2) - 1, y + 1, 2, 1);
  if (stripe && o.face > 4) R(stripe, 0, y + 3, w, 1);
  if (o.backGlass) { R(GLASS2, 1, y + o.face - o.backGlass - 1, Math.floor(w / 2) - 2, o.backGlass); R(GLASS2, Math.ceil(w / 2) + 1, y + o.face - o.backGlass - 1, Math.floor(w / 2) - 2, o.backGlass); }
  y += o.face;
  if (o.boot) { R(top, 0, y, w, o.boot); y += o.boot; }
  if (o.rear) { R(c, 1, y, w - 2, o.rear); R(GLASS2, 2, y, w - 4, o.rear); y += o.rear; }
  const inset = o.screen || o.rear ? 1 : 0;
  R(top, inset, y, w - inset * 2, o.roof); y += o.roof;
  if (o.screen) { R(c, 1, y, w - 2, o.screen); R(GLASS, 2, y, w - 4, o.screen); y += o.screen; }
  if (o.bonnet) { R(top, 0, y, w, o.bonnet); y += o.bonnet; }
  R(edge, o.bonnet ? 0 : inset, y - 1, o.bonnet ? w : w - inset * 2, 1);
}

const SIZE = Object.fromEntries(Object.entries(DEFS).map(([k, d]) => [k, { side: d.size[0], front: d.size[1] }]));
/** Every vehicle: type -> { label, side: [length, height], front: [width, height] }. */
export const VEHICLES = Object.fromEntries(Object.entries(DEFS).map(([k, d]) => [k, { label: d.label, side: d.size[0], front: d.size[1] }]));

/**
 * Draw one vehicle { type, x, y, facing, color, color2, seed }: centred on x,
 * its wheels on y. facing: 'left' | 'right' (side on), 'down' (its front),
 * 'up' (its back). Without a colour the seed picks one.
 */
export function drawVehicle(g, v) {
  const d = DEFS[v.type] ?? DEFS.car, s = SIZE[v.type] ?? SIZE.car;
  const rng = seeded((v.seed ?? 1) * 53 + 5);
  const [tc, tc2] = TAXI_COLORS[Math.floor(rng() * TAXI_COLORS.length)];
  const c = v.color ?? (v.type === 'taxi' ? tc : v.type === 'bus' ? ['#f2f2ee', '#e8c840', '#3f7a5a'][Math.floor(rng() * 3)] : CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)]);
  const c2 = v.color2 ?? (v.type === 'taxi' ? tc2 : v.type === 'bus' ? '#2f7ac8' : v.type === 'keiTruck' ? '#b88a58' : '#3f7fd6');
  const facing = v.facing ?? 'right', side = facing === 'left' || facing === 'right';
  const [w] = side ? s.side : s.front, L = Math.round(v.x - w / 2), Y = Math.round(v.y);
  const flip = facing === 'left';
  const R = (col, dx, up, rw, rh) => { g.fillStyle = col; g.fillRect(L + (flip ? w - dx - rw : dx), Y - up - rh, rw, rh); };
  if (side) d.side(R, c, c2); else if (facing === 'down') d.front(R, c, c2); else d.back(R, c, c2);
}

/** A vehicle's lights at night: headlights ahead of it, tail lights behind: [{ x, y, r, c }]. */
export function vehicleLights(v) {
  const s = SIZE[v.type] ?? SIZE.car, f = v.facing ?? 'right';
  if (f === 'left' || f === 'right') {
    const d = f === 'right' ? 1 : -1, half = s.side[0] / 2;
    return [{ x: v.x + d * (half + 3), y: v.y - 4, r: 11, c: '#fff2c0' }, { x: v.x - d * half, y: v.y - 4, r: 4, c: '#e8403a' }];
  }
  return f === 'down' ? [{ x: v.x, y: v.y + 2, r: 12, c: '#fff2c0' }] : [{ x: v.x - 4, y: v.y - 3, r: 4, c: '#e8403a' }, { x: v.x + 4, y: v.y - 3, r: 4, c: '#e8403a' }];
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
  const hLanes = streets.flatMap((sy, i) => [
    { kind: 'h', i, dir: 1, y: sy + SIDE + ROAD - 2 },                       // on the left: east-bound in the lower lane
    { kind: 'h', i, dir: -1, y: sy + SIDE + Math.floor(ROAD / 2) - 1 }]);
  const vLanes = crossStreets.flatMap((sx, j) => [
    { kind: 'v', j, dir: 1, x: sx + VSIDE + Math.round(ROAD * 0.73) },        // south-bound on the east side
    { kind: 'v', j, dir: -1, x: sx + VSIDE + Math.round(ROAD * 0.27) }]);
  // bus stops: those on a street's far sidewalk, served by its east-bound lane
  const stops = town.props.filter((p) => p.type === 'busStop').map((p) => ({ x: p.x, lane: hLanes.find((l) => l.dir === 1 && Math.abs(streets[l.i] + town.dims.STREET - p.y) < 6) })).filter((s) => s.lane);
  const busLanes = [...new Set(stops.map((s) => s.lane))];

  const TYPES = ['car', 'car', 'car', 'car', 'kei', 'kei', 'taxi', 'taxi', 'van', 'keiTruck'];
  const size = (v) => (v.lane.kind === 'h' ? SIZE[v.type].side : SIZE[v.type].front);
  const along = (v) => (v.lane.kind === 'h' ? v.x : v.y);
  // the front and back of a vehicle along its lane
  const front = (v) => { const [l, h] = size(v); return v.lane.kind === 'h' ? v.x + v.lane.dir * l / 2 : v.lane.dir > 0 ? v.y : v.y - h; };
  const back = (v) => { const [l, h] = size(v); return v.lane.kind === 'h' ? v.x - v.lane.dir * l / 2 : v.lane.dir > 0 ? v.y - h : v.y; };
  const facingOf = (lane) => (lane.kind === 'h' ? (lane.dir > 0 ? 'right' : 'left') : lane.dir > 0 ? 'down' : 'up');
  const vehicles = [];
  const make = (type, lane, s) => {
    const v = { vehicle: true, type, seed: 1 + Math.floor(rng() * 9999), lane, speed: CRUISE, wait: 0, served: new Set(), from: lane.i ?? -1 };
    if (lane.kind === 'h') { v.x = s; v.y = lane.y; } else { v.x = lane.x; v.y = s; }
    v.facing = facingOf(lane);
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
      if (v.lane.kind === 'h') { const a = (p.x - f) * d; if (a > -2 && a < 12 && p.y > v.y - 13 && p.y < v.y + 4) free = Math.min(free, a - 3); }
      else { const a = (p.y - f) * d; if (a > -2 && a < 12 && Math.abs(p.x - v.x) < 8) free = Math.min(free, a - 3); }
    }
    return free;
  }

  /** Turn v onto another lane at its current spot. */
  function turn(v, lane) {
    if (lane.kind === 'h') { v.y = lane.y; v.from = lane.i; } else { v.x = lane.x; v.from = v.lane.i; }
    v.lane = lane; v.facing = facingOf(lane); v.speed = Math.min(v.speed, 14);
  }

  function update(dt, t, walkers = []) {
    for (const v of vehicles) {
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
            if (can && rng() < 0.3) { turn(v, l); break; }
          }
        } else {
          for (const l of hLanes) if ((before - l.y) * (now - l.y) < 0) {
            const forced = (d > 0 && l.i === last && l.dir > 0) || (d < 0 && l.i === 0 && l.dir < 0);
            if (forced || (l.i !== v.from && rng() < 0.3)) { turn(v, l); break; }
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
