// Tiny Town: a 2D map of streets and blocks built from the tiny buildings,
// for the tiny people to walk around in.
//
//   makeTown(layout)            a town: { W, H, buildings, areas, ground (a canvas),
//                               blocked(x, y), findPath(from, to), placeAt(x, y) }
//   drawTownView(g, town, view, sprites, t)
//                               the part of the town in view, people and cats in it
//   DEFAULT_TOWN                the town the demo walks around in
//
// The rules (agreed with the owner):
//  - every building faces you, and its whole picture is solid ground, so
//    nobody is ever hidden behind one; you walk around it (only between the
//    torii's posts and under the gas station's canopy can you step in)
//  - tall buildings stand only along the back, with nothing behind them;
//    the blocks between streets have low buildings
//  - the shrine, the school and the old town have their own grounds in
//    front of them that you can walk into
// Units are canvas pixels. Plain ES module, no dependencies.

import { BUILDINGS, buildingSize, buildingSolids, drawBuilding, cooks, usesFull } from './tinyBuildings.js';
import { FULL_GROUND } from './tinyGroundFull.js';
import { drawCat, drawDog } from './tinyAnimals.js';
import { drawMonster } from './tinyMonsters.js';
import { BUSHES, SEASONS, drawBush, drawTerrain, drawTree, groundInSeason } from './tinyNature.js';
import { PROPS, drawProp, drawWire, poleTops, propLights, propSolid } from './tinyStreet.js';
import { drawPose, drawSwings, drawSteam, drawPetals } from './tinyLife.js';
import { VEHICLES, drawVehicle, drawVehicleBeams, vehicleLights } from './tinyTraffic.js';
import { KY } from './tinyVoxel.js';
import { canvasOf, drawCharacter, drawRing, seeded as seededRng } from './tinyCharacters.js';

const CELL = 4;                                          // path-finding grid
/** Street sizes at a scale: a street is 7 + 18 + 7 px top to bottom, a cross street 6 + 18 + 6 across. */
function streetDims(k) {
  const SIDE = Math.round(7 * k), ROAD = Math.round(18 * k), VSIDE = Math.round(6 * k);
  return { SIDE, ROAD, STREET: SIDE * 2 + ROAD, VSIDE, VSTREET: VSIDE * 2 + ROAD, k };
}
/** The layout with every position and size multiplied by its scale (people stay the same size). */
function scaled(layout) {
  // the town sits inside a border of forest (layout.forest px on every side)
  const k = layout.scale ?? 1, m = (v) => Math.round(v * k), pad = m(layout.forest ?? 0);
  const X = (v) => m(v) + pad;
  return {
    ...layout, k, pad, W: m(layout.W) + pad * 2, H: m(layout.H) + pad * 2,
    streets: layout.streets.map(X), crossStreets: layout.crossStreets.map(X),
    rows: (layout.rows ?? []).map((r) => ({ ...r, x: X(r.x), y: X(r.y) })),
    buildings: (layout.buildings ?? []).map((b) => ({ ...b, x: X(b.x), y: X(b.y), scale: k })),
    plants: (layout.plants ?? []).map((p, i) => ({ seed: i + 1, ...p, x: X(p.x), y: X(p.y), scale: k })),
    props: (layout.props ?? []).map((p, i) => ({ seed: i + 1, ...p, x: X(p.x), y: X(p.y), scale: k })),
    areas: (layout.areas ?? []).map((a) => ({ ...a, x: X(a.x), y: X(a.y), w: m(a.w), h: m(a.h), path: a.path && { x: X(a.path.x), w: m(a.path.w), y0: X(a.path.y0) }, gate: a.gate && m(a.gate) })),
    railway: layout.railway && { y: X(layout.railway.y), h: m(layout.railway.h) },
    parked: (layout.parked ?? []).map((v, i) => ({ seed: i + 3, ...v, x: X(v.x), y: X(v.y), vehicle: true, parked: true })),
    wires: (layout.wires ?? []).map(([a, b, sag = 3]) => [{ x: X(a[0]), y: X(a[1]) }, { x: X(b[0]), y: X(b[1]) }, sag]),
  };
}

const FOREST_TREES = ['cedar', 'cedar', 'pine', 'fir', 'fir', 'oak', 'oak', 'cypress', 'birch'];
const GARDEN_TREES = ['apple', 'oak', 'maple', 'sakura', 'birch', 'ginkgo', 'poplar'];
const GARDEN_BUSHES = ['round', 'round', 'azalea', 'hydrangea', 'rose', 'hedge', 'fern', 'lavender'];
/**
 * Trees in a jittered grid over the rectangle (x, y, w, h): a forest. skip(x, y)
 * leaves gaps (the roads out of town).
 */
function forestIn(rng, k, x, y, w, h, skip = () => false) {
  const out = [], sx = Math.round(10 * k), sy = Math.round(8 * k);
  for (let fy = y + sy; fy < y + h + sy; fy += sy) for (let fx = x + ((fy / sy) % 2) * sx / 2; fx < x + w + sx / 2; fx += sx) {
    const px = Math.round(fx + (rng() - 0.5) * sx * 0.6), py = Math.round(fy + (rng() - 0.5) * sy * 0.5);
    if (skip(px, py)) continue;
    out.push({ tree: FOREST_TREES[Math.floor(rng() * FOREST_TREES.length)], x: px, y: py, seed: 1 + Math.floor(rng() * 999), scale: k, forest: true });
  }
  return out;
}

/**
 * The demo's town: four streets, two cross streets, tall buildings along the
 * back, two rows of low blocks, and the shrine, the school and the old town.
 * `streets`: the top of each street; `crossStreets`: the left edge of each
 * cross street (they run from the first street to the last); `rows`: a
 * ground line and buildings packed left to right from x (2 px apart);
 * `areas`: open grounds with their own ground and name.
 */
export const DEFAULT_TOWN = {
  scale: 1.5,                     // the town 1.5 times the size it is drawn at below; the people stay 15 px
  forest: 48,                     // a border of forest round the town, which nobody can walk into
  W: 560, H: 672,
  streets: [108, 200, 284, 416, 640],
  // a railway across the town (trains run along it; the cross streets cross it at level crossings)
  railway: { y: 560, h: 16 },
  crossStreets: [180, 370],
  rows: [
    // the back row: the tall ones, with nothing behind them
    { y: 108, x: 2, list: ['office', 'apartment', 'karaoke', 'bank', 'mixedUse:bookshop', 'fireStation', 'parkingGarage', 'apartment', 'office', 'mosque', 'karaoke', 'bank'] },
    // between the first and second street
    { y: 200, x: 2, list: ['house', 'shop:konbini', 'kissaten', 'koban'] },
    { y: 200, x: 212, list: ['sushi', 'florist', 'laundromat', 'pharmacy'] },
    { y: 200, x: 402, list: ['udonSoba', 'shop:ramen', 'postOffice'] },
    // between the second and third street
    { y: 284, x: 2, list: ['familyRestaurant', 'gasStation'] },
    { y: 284, x: 212, list: ['woodApartment', 'clinic', 'fishmonger', 'takoyaki'] },
    { y: 284, x: 402, list: ['scandinavianHouse', 'mediterraneanVilla', 'shop:izakaya'] },
    // grounds: the old town's houses stand at the back of their square
    { y: 390, x: 404, list: ['tudorCottage', 'dutchCanalHouse', 'stoneChapel', 'frenchCountryHouse'] },
  ],
  buildings: [
    { type: 'shrineHall', x: 90, y: 350 }, { type: 'torii', x: 90, y: 410 },
    { type: 'school', x: 290, y: 376 },
    // the stations face the new street, set back behind their plaza; the alley between the modern one and a yakitori stall
    { type: 'stationWooden', x: 56, y: 624 }, { type: 'station', x: 145, y: 624 }, { type: 'stationModern', x: 264, y: 624 },
    { type: 'alleyStall', x: 353, y: 626 }, { type: 'stationBrick', x: 460, y: 624 }, { type: 'kiosk', x: 536, y: 630 },
    { type: 'toilets', x: 340, y: 552 },
  ],
  // vehicles parked for good (a taxi rank in the plaza)
  parked: [{ type: 'taxi', x: 404, y: 636, heading: 180 }, { type: 'taxi', x: 426, y: 636, heading: 180 }],
  // cables strung across the alley
  wires: [[[316, 590], [340, 596], 3], [[316, 604], [340, 600], 2], [[316, 614], [340, 618], 3]],
  areas: [
    { name: 'Shrine grounds', ground: 'gravel', x: 0, y: 316, w: 180, h: 100, path: { x: 82, w: 16, y0: 350 } },
    { name: 'Schoolyard', ground: 'sand', x: 210, y: 316, w: 160, h: 100 },
    { name: 'Old-town square', ground: 'paving', x: 400, y: 316, w: 160, h: 100 },
    { name: 'Pond', ground: 'water', x: 88, y: 234, w: 44, h: 11, solid: true },
    // the south (Nov 2026): a park with a pond, a playground, a basketball court; the station plaza and alley
    { name: 'Pond park', ground: 'grass', x: 0, y: 452, w: 180, h: 104, ring: true },
    { name: 'Pond', ground: 'water', shape: 'ellipse', x: 52, y: 486, w: 76, h: 36, solid: true, koi: true },
    { name: 'Playground', ground: 'sand', x: 212, y: 456, w: 156, h: 96 },
    { name: 'Basketball court', ground: 'court', x: 402, y: 456, w: 156, h: 96 },   // open: no fence (the owner)
    { name: 'Station plaza', ground: 'paving', x: 0, y: 576, w: 560, h: 64 },
    { name: 'Station alley', ground: 'gravel', x: 316, y: 578, w: 24, h: 62 },
  ],
  // trees and bushes: in the back gardens, round the shrine, the school and the square
  // things on the streets and in the grounds (utility poles, lamps and vending machines are added by makeTown)
  props: [
    { type: 'busStop', x: 60, y: 139 }, { type: 'busStop', x: 300, y: 315 }, { type: 'busStop', x: 470, y: 231 },
    { type: 'postBox', x: 252, y: 139 }, { type: 'bikeRack', x: 226, y: 404 }, { type: 'bench', x: 356, y: 404 },
    { type: 'stoneLantern', x: 72, y: 378 }, { type: 'stoneLantern', x: 108, y: 378 }, { type: 'stoneLantern', x: 72, y: 398 }, { type: 'stoneLantern', x: 108, y: 398 },
    { type: 'bench', x: 30, y: 380 }, { type: 'oldLamp', x: 408, y: 410 }, { type: 'oldLamp', x: 552, y: 410 },
    { type: 'bench', x: 452, y: 410 }, { type: 'bench', x: 508, y: 410 },
    { type: 'plantPot', x: 200, y: 106 }, { type: 'blockWall', x: 106, y: 152 },
    // the park, the playground, the court
    { type: 'bench', x: 70, y: 470 }, { type: 'bench', x: 120, y: 552 }, { type: 'oldLamp', x: 30, y: 504 }, { type: 'oldLamp', x: 150, y: 504 },
    { type: 'swings', x: 240, y: 498 }, { type: 'slide', x: 290, y: 494 }, { type: 'sandbox', x: 246, y: 538 }, { type: 'drinkingFountain', x: 300, y: 540 },
    { type: 'bench', x: 340, y: 476 },
    { type: 'hoop', x: 412, y: 508 }, { type: 'hoop', x: 548, y: 508 },
    { type: 'floodlight', x: 406, y: 462 }, { type: 'floodlight', x: 554, y: 462 }, { type: 'floodlight', x: 406, y: 550 }, { type: 'floodlight', x: 554, y: 550 },
    // the station plaza and the alley
    { type: 'plazaClock', x: 228, y: 636 }, { type: 'bikeRack', x: 110, y: 638 }, { type: 'bench', x: 512, y: 636 }, { type: 'busStop', x: 300, y: 671 },
    { type: 'redLantern', x: 318, y: 590 }, { type: 'redLantern', x: 338, y: 598 }, { type: 'redLantern', x: 318, y: 610 }, { type: 'redLantern', x: 338, y: 618 },
    { type: 'crates', x: 324, y: 602 }, { type: 'acUnit', x: 334, y: 588 }, { type: 'bins', x: 332, y: 630 }, { type: 'vendingMachine', x: 322, y: 624 },
  ],
  plants: [
    { tree: 'apple', x: 30, y: 152 }, { bush: 'round', x: 62, y: 148 }, { tree: 'oak', x: 150, y: 154 },
    { tree: 'sakura', x: 236, y: 152 }, { tree: 'maple', x: 300, y: 150 }, { bush: 'hedge', x: 340, y: 147 },
    { tree: 'pine', x: 430, y: 152 }, { bush: 'hydrangea', x: 470, y: 147 }, { tree: 'ginkgo', x: 530, y: 154 },
    { tree: 'willow', x: 50, y: 246 }, { bush: 'azalea', x: 150, y: 240 }, { bush: 'rose', x: 164, y: 241 },
    { tree: 'bamboo', x: 226, y: 244 }, { bush: 'lavender', x: 334, y: 239 }, { bush: 'fern', x: 352, y: 241 },
    { tree: 'birch', x: 418, y: 238 }, { bush: 'holly', x: 460, y: 238 }, { tree: 'cypress', x: 548, y: 248 },
    { tree: 'cedar', x: 26, y: 340 }, { tree: 'cedar', x: 156, y: 342 }, { tree: 'sakura', x: 36, y: 398 }, { tree: 'pine', x: 146, y: 400 },
    { bush: 'azalea', x: 60, y: 362 }, { bush: 'azalea', x: 122, y: 362 }, { bush: 'pampas', x: 168, y: 380 },
    { tree: 'sakura', x: 222, y: 372 }, { tree: 'sakura', x: 358, y: 372 }, { bush: 'round', x: 224, y: 408 }, { bush: 'round', x: 356, y: 408 },
    { tree: 'poplar', x: 552, y: 384 }, { tree: 'fir', x: 480, y: 410 }, { bush: 'rose', x: 430, y: 404 }, { bush: 'lavender', x: 526, y: 404 },
    // cherry trees round the pond; a few trees by the playground and the plaza
    { tree: 'sakura', x: 14, y: 476 }, { tree: 'sakura', x: 166, y: 482 }, { tree: 'sakura', x: 24, y: 548 }, { tree: 'sakura', x: 158, y: 546 }, { tree: 'willow', x: 100, y: 470 },
    { tree: 'maple', x: 360, y: 466 }, { bush: 'hydrangea', x: 220, y: 466 }, { tree: 'ginkgo', x: 186, y: 630 }, { tree: 'ginkgo', x: 392, y: 630 },
  ],
};


/**
 * Where the streets meet the cross streets: for each, the box where the
 * roads cross, the zebra crossings next to it (`axis` 'h' over the street,
 * 'v' over the cross street) and where its two traffic lights stand (one for
 * the street's traffic at the near corner, one for the cross street's).
 */
function junctionsOf(layout) {
  const { streets, crossStreets, k } = layout, { SIDE, ROAD, STREET, VSIDE, VSTREET } = streetDims(k), m = (v) => Math.round(v * k);
  const out = [];
  streets.forEach((sy, i) => crossStreets.forEach((sx, j) => {
    const crossings = [{ axis: 'h', x: sx - m(9), y: sy + SIDE, w: m(7), h: ROAD }];
    if (i > 0) crossings.push({ axis: 'v', x: sx + VSIDE, y: sy - m(6), w: ROAD, h: m(5) });
    if (i < streets.length - 1) crossings.push({ axis: 'v', x: sx + VSIDE, y: sy + STREET + 1, w: ROAD, h: m(5) });
    out.push({ i, j, sx, sy, box: { x: sx + VSIDE, y: sy + SIDE, w: ROAD, h: ROAD }, crossings,
      signals: [{ axis: 'h', x: sx - m(13), y: sy + SIDE - 2 }, { axis: 'v', x: sx + VSTREET + m(4), y: sy + STREET - 2 }] });
  }));
  return out;
}

/**
 * The things along the streets: utility poles (with lamps) on the far
 * sidewalk of every street, wired together; street lamps at the edges of the
 * cross streets; vending machines (and bins) where a row of buildings ends
 * short of the cross street; and the layout's own `props` (bus stops,
 * benches, lanterns ...). Nothing goes where it would cover a building.
 */
function placeProps(layout, buildings, rowEnds) {
  const { W, streets, crossStreets, k, pad } = layout, { STREET, VSTREET } = streetDims(k), m = (v) => Math.round(v * k);
  const props = [...layout.props];
  const rail = layout.railway, onRail = (y, r = 0) => rail && y > rail.y - r && y < rail.y + rail.h + r;
  const { VSIDE } = streetDims(k);
  // a traffic light at two corners of every junction (tinyTraffic sets their colours)
  for (const jn of junctionsOf(layout)) for (const sg of jn.signals) props.push({ type: 'trafficLight', x: sg.x, y: sg.y, axis: sg.axis, junction: `${jn.i},${jn.j}`, lit: sg.axis === 'h' ? 'green' : 'red', seed: 1, scale: k });
  const box = (p) => { const { w, h } = PROPS[p.type]; return { x: p.x - (w * k) / 2, y: p.y - h * k, w: w * k, h: h * k }; };
  const hit = (a, b, pad = 1) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  const pictures = buildings.map((b) => { const { w, h } = buildingSize(b); return { x: b.x - w / 2, y: b.y - h, w, h }; });
  const fits = (p) => { const r = box(p); return !pictures.some((q) => hit(r, q)) && !props.some((q) => hit(r, box(q), m(3))); };
  // each placed thing's seed comes from where it stands, so adding things elsewhere never changes it
  const add = (p) => { const q = { seed: 1 + ((Math.round(p.x) * 73 + Math.round(p.y) * 151) % 997), scale: k, ...p }; if (fits(q)) { props.push(q); return true; } return false; };
  // vending machines (two if there is room, a bin beside them) where a row ends
  for (const { x, end, y } of rowEnds) {
    let at = x + m(1);
    for (const type of ['vendingMachine', 'vendingMachine', 'bins']) {
      const w = m(PROPS[type].w);
      if (at + w > end - m(2)) break;
      if (add({ type, x: Math.round(at + w / 2), y: y - 1 })) at += w + m(1);
    }
  }
  // utility poles on the far side of every street, between the crossings
  for (const sy of streets) for (let x = pad + m(20); x < W - pad - m(6); x += m(58)) {
    if (crossStreets.some((sx) => sy > streets[0] - 1 && x > sx - m(16) && x < sx + VSTREET + m(8))) continue;
    add({ type: 'utilityPole', x: Math.round(x), y: sy + STREET - 2 });
  }
  // street lamps in the gardens along the cross streets, shining over the sidewalk
  for (const sx of crossStreets) for (let i = 0; i < streets.length - 1; i++) {
    const a = streets[i] + STREET, b = streets[i + 1];
    for (let y = a + m(16); y < b - m(4); y += m(40)) if (!onRail(y, m(20))) add({ type: 'streetLamp', x: sx - m(1), y: Math.round(y) });
  }
  // a level crossing where each cross street crosses the railway: a gate on each side, its boom across the road
  // (placed last, so the props before keep their seeds when a railway is added)
  if (rail) for (const [j, sx] of crossStreets.entries()) for (const [side, y] of [['north', rail.y - 2], ['south', rail.y + rail.h + m(8)]]) {
    props.push({ type: 'crossingGate', x: Math.round(sx + VSIDE - m(2) + m(12)), y, crossing: j, side, down: false, scale: k, seed: 1 });
  }
  return props;
}

/** Build a town from a layout: its buildings, ground picture, walkable ground and paths. */
export function makeTown(layout0 = DEFAULT_TOWN) {
  const layout = scaled(layout0), { W, H, streets, crossStreets, k } = layout;
  const { STREET, VSTREET } = streetDims(k);
  const buildings = layout.buildings.map((b, i) => ({ seed: i + 1, ...b }));
  // each row's buildings get seeds that fit: no taller than the room up to the
  // street above, and together no wider than the room up to the next cross
  // street (seeds change a building's width, floors and roof, so try a few)
  const townSeed = layout.seed ?? 7, gap = Math.round(2 * k), rowEnds = [];
  for (const row of layout.rows) {
    const above = streets.filter((sy) => sy < row.y).pop();
    const maxH = above === undefined ? Infinity : row.y - above - STREET;
    const end = row.y > streets[0] ? (crossStreets.find((sx) => sx > row.x) ?? W - layout.pad) : W - layout.pad;
    const picks = row.list.map((item, i) => {
      const [type, shopType] = item.split(':'), fits = [];
      for (let t = 0; t < 40 && fits.length < 8; t++) {
        const seed = 1 + ((townSeed * 7919 + (row.y * 31 + row.x) * 131 + i * 977 + t * 7) % 9973);
        const size = buildingSize({ type, shopType, seed, scale: k });
        if (size.h <= maxH) fits.push({ seed, w: size.w });
      }
      if (!fits.length) { console.warn(`tinyTown: no seed of ${type} fits under the street above`); fits.push({ seed: 1, w: buildingSize({ type, shopType, seed: 1, scale: k }).w }); }
      return { type, shopType, fits, pick: fits[0] };
    });
    const total = () => picks.reduce((n, p) => n + p.pick.w + gap, 0);
    // too wide: swap the pick that would save the most for its narrowest fit, until it fits
    while (row.x + total() > end) {
      let best = null, save = 0;
      for (const p of picks) { const narrow = p.fits.reduce((a, f) => (f.w < a.w ? f : a)); if (p.pick.w - narrow.w > save) { save = p.pick.w - narrow.w; best = [p, narrow]; } }
      if (!best) { console.warn(`tinyTown: the row at (${row.x}, ${row.y}) is too wide`); break; }
      best[0].pick = best[1];
    }
    let x = row.x;
    for (const p of picks) {
      buildings.push({ type: p.type, shopType: p.shopType, x: x + p.pick.w / 2, y: row.y, seed: p.pick.seed, scale: k });
      x += p.pick.w + gap;
    }
    rowEnds.push({ x, end, y: row.y });
  }
  const areas = layout.areas;
  const props = placeProps(layout, buildings, rowEnds);
  const railway = layout.railway, parked = layout.parked ?? [];
  /** Is (x, y) on the railway (anywhere but a level crossing)? */
  const railAt = (x, y, r = 0) => !!railway && y > railway.y - r && y < railway.y + railway.h + r && !crossStreets.some((sx) => x >= sx && x < sx + VSTREET);
  // a building must not reach into the street above it, nor past the next cross street
  for (const b of buildings) {
    const { w, h } = buildingSize(b), L = b.x - w / 2, top = b.y - h;
    const above = streets.filter((sy) => sy < b.y).pop();
    if (above !== undefined && above !== b.y && top < above + STREET) console.warn(`tinyTown: ${b.type} at (${b.x}, ${b.y}) reaches into the street above`);
    if (b.y > streets[0] && crossStreets.some((sx) => L < sx + VSTREET && L + w > sx)) console.warn(`tinyTown: ${b.type} at (${b.x}, ${b.y}) stands on a cross street`);
  }
  const { pad } = layout;
  const top = streets[0] + 2, bottom = streets[streets.length - 1] + STREET - 3;   // above the first street and below the last: forest
  const onStreet = (y) => streets.some((sy) => y >= sy + 2 && y <= sy + STREET - 2);
  // the roads, and the crossings people cross them at
  const { SIDE, ROAD, VSIDE } = streetDims(k), lastStreet = streets[streets.length - 1];
  const junctions = junctionsOf(layout), crossings = junctions.flatMap((jn) => jn.crossings.map((c) => ({ ...c, junction: jn })));
  const roadAt = (x, y) => streets.some((sy) => y >= sy + SIDE && y < sy + SIDE + ROAD)
    || (y >= streets[0] + SIDE && y < lastStreet + SIDE + ROAD && crossStreets.some((sx) => x >= sx + VSIDE && x < sx + VSIDE + ROAD));
  const crossingAt = (x, y) => crossings.find((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
  // a map maker's check: nothing of the layout's own on a road, or on a cross street's narrow sidewalk (it would block it)
  for (const q of layout.props) if (q.type !== 'crossingGate' && (roadAt(q.x, q.y)
    || (q.y > streets[0] && q.y < lastStreet && !onStreet(q.y) && crossStreets.some((sx) => q.x >= sx && q.x < sx + VSTREET)))) {
    console.warn(`tinyTown: the ${q.type} at (${q.x}, ${q.y}) stands on a road or a cross street's sidewalk`);
  }
  // trees block at the trunk, bushes at their base, a pond everywhere
  let plants = layout.plants.map((p) => ({ ...p, type: p.tree ?? p.bush, kind: p.tree ? 'tree' : 'bush' }));
  // each region has its own random sequence, so adding to a map never reshuffles the rest
  const rngFor = (n) => seededRng((layout.seed ?? 7) * 7919 + n * 104729);
  // greenery in the back gardens: bushes and small trees where there is room, leaving paths between them
  const roomFor = (x, y, r) => !buildings.some((b) => { const { w, h } = buildingSize(b); return x > b.x - w / 2 - r && x < b.x + w / 2 + r && y > b.y - h - r && y < b.y + r + 4; })
    && !plants.some((p) => Math.hypot(p.x - x, p.y - y) < r * 2.2) && !areas.some((a) => x > a.x - r && x < a.x + a.w + r && y > a.y - r && y < a.y + a.h + r)
    && !crossStreets.some((sx) => x > sx - r && x < sx + VSTREET + r) && !railAt(x, y, r + 6)
    && !parked.some((v) => Math.abs(v.x - x) < 18 + r && Math.abs(v.y - y) < 8 + r)
    && !props.some((q) => x > q.x - PROPS[q.type].w * k / 2 - r && x < q.x + PROPS[q.type].w * k / 2 + r && y > q.y - PROPS[q.type].h * k - r && y < q.y + r + 4);
  for (let i = 0; i < streets.length - 1; i++) {
    const y0 = streets[i] + STREET, y1 = streets[i + 1], step = Math.round(13 * k), rng = rngFor(i + 1);   // this block's gardens
    for (let y = y0 + Math.round(6 * k); y < y1; y += step) for (let x = pad + 6; x < W - pad - 6; x += step) {
      const px = Math.round(x + (rng() - 0.5) * step * 0.7), py = Math.round(y + (rng() - 0.5) * step * 0.4);
      if (rng() < 0.4 || !roomFor(px, py, Math.round(5 * k))) continue;
      const tree = py - y0 > 18 * k && rng() < 0.45;
      plants.push({ tree: tree ? GARDEN_TREES[Math.floor(rng() * GARDEN_TREES.length)] : undefined, bush: tree ? undefined : GARDEN_BUSHES[Math.floor(rng() * GARDEN_BUSHES.length)],
        x: px, y: py, seed: 1 + Math.floor(rng() * 999), scale: k, type: tree ? undefined : null });
    }
  }
  plants = plants.map((p) => ({ ...p, type: p.tree ?? p.bush, kind: p.tree ? 'tree' : 'bush' }));
  const solids = [...buildings.flatMap(buildingSolids), ...props.map(propSolid),
    ...plants.map((p) => {
      const w = p.kind === 'tree' ? 4 : Math.round((BUSHES[p.type]?.w ?? 8) * k * 0.8);
      return { x: Math.round(p.x - w / 2), y: p.y - 3, w, h: 5 };
    }),
    ...areas.filter((a) => a.solid).map((a) => ({ x: a.x, y: a.y, w: a.w, h: a.h })),
    ...parked.map((v) => ({ x: Math.round(v.x - 15), y: v.y - 7, w: 30, h: 9 })),
    // a fenced area (the court): its four sides, a gate in the middle of the top
    ...areas.filter((a) => a.fence).flatMap((a) => fenceOf(a).map(({ x, y, w, h }) => ({ x, y, w, h })))];
  // the forest: behind the skyline, at the sides (gaps for the streets) and below the last street
  const lastBottom = streets[streets.length - 1] + STREET;
  const forest = [
    ...forestIn(rngFor(100), k, 0, -Math.round(6 * k), W, streets[0] - Math.round(4 * k)),
    ...forestIn(rngFor(101), k, 0, streets[0], pad - Math.round(4 * k), lastBottom - streets[0], (x, y) => streets.some((sy) => y > sy - 4 * k && y < sy + STREET + 20 * k) || (railway && y > railway.y - 4 * k && y < railway.y + railway.h + 20 * k)),   // crowns stay off the road and the railway
    ...forestIn(rngFor(102), k, W - pad + Math.round(4 * k), streets[0], pad, lastBottom - streets[0], (x, y) => streets.some((sy) => y > sy - 4 * k && y < sy + STREET + 20 * k) || (railway && y > railway.y - 4 * k && y < railway.y + railway.h + 20 * k)),
    ...forestIn(rngFor(103), k, 0, lastBottom + Math.round(16 * k), W, H - lastBottom),
  ].map((p) => ({ ...p, type: p.tree, kind: 'tree' }));
  plants = [...plants, ...forest];

  /** Is (x, y) somewhere a person cannot stand? (A person is 5 px wide.) */
  function blocked(x, y) {
    if (x < 4 || x > W - 4 || y < top || y > bottom) return true;
    if ((x < pad + 3 || x > W - pad - 3) && !onStreet(y)) return true;   // the forest at the sides (the streets run out through it)
    if (railAt(x, y)) return true;                                       // the railway, but for the level crossings
    for (const s of solids) if (x > s.x - 3 && x < s.x + s.w + 2 && y >= s.y && y < s.y + s.h) return true;
    return false;
  }

  // the path-finding grid: a cell is free if its centre is
  const gw = Math.ceil(W / CELL), gh = Math.ceil(H / CELL);
  const free = new Uint8Array(gw * gh);
  for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
    // people on foot go round buildings and things, and over the roads only at the crossings
    const x = cx * CELL + 2, y = cy * CELL + 2;
    free[cy * gw + cx] = blocked(x, y) || (roadAt(x, y) && !crossingAt(x, y)) ? 0 : 1;
  }
  const freeCells = [];
  for (let i = 0; i < free.length; i++) if (free[i]) freeCells.push(i);
  const cellOf = (x, y) => Math.max(0, Math.min(gh - 1, Math.floor(y / CELL))) * gw + Math.max(0, Math.min(gw - 1, Math.floor(x / CELL)));
  const centre = (i) => ({ x: (i % gw) * CELL + 2, y: Math.floor(i / gw) * CELL + 2 });

  /**
   * The shortest way on foot from `a` to `b` ({ x, y }), round buildings:
   * a list of points to walk to in turn (the last is `b`), or null.
   */
  function findPath(a, b) {
    const start = cellOf(a.x, a.y), goal = cellOf(b.x, b.y);
    if (!free[goal]) return null;
    const prev = new Int32Array(gw * gh).fill(-1);
    prev[start] = start;
    const queue = new Int32Array(gw * gh);
    let head = 0, tail = 0;
    queue[tail++] = start;
    while (head < tail) {
      const i = queue[head++];
      if (i === goal) break;
      const cx = i % gw;
      for (const n of [cx > 0 ? i - 1 : -1, cx < gw - 1 ? i + 1 : -1, i - gw, i + gw]) {
        if (n < 0 || n >= free.length || !free[n] || prev[n] !== -1) continue;
        prev[n] = i; queue[tail++] = n;
      }
    }
    if (prev[goal] === -1) return null;
    const cells = [];
    for (let i = goal; i !== start; i = prev[i]) cells.push(i);
    cells.reverse();
    // keep only the corners
    const pts = [];
    for (let k = 0; k < cells.length; k++) {
      const p = centre(cells[k]), n = cells[k + 1], q = cells[k - 1];
      if (n === undefined || q === undefined || (n - cells[k]) !== (cells[k] - q)) pts.push(p);
    }
    pts.push({ x: b.x, y: b.y });
    return pts;
  }

  /** A random spot someone can stand on, within `within` ({ x, y, w, h }) if given. */
  function randomSpot(rng = Math.random, within) {
    for (let k = 0; k < 40; k++) {
      const p = centre(freeCells[Math.floor(rng() * freeCells.length)]);
      if (!within || (p.x >= within.x && p.x < within.x + within.w && p.y >= within.y && p.y < within.y + within.h)) return p;
    }
    return within ? { x: within.x + within.w / 2, y: within.y + within.h - 6 } : centre(freeCells[0]);
  }

  /** Where (x, y) is: the building it is in front of, an area, or a street. */
  function placeAt(x, y) {
    const b = buildings.find((b) => Math.abs(x - b.x) <= buildingSize(b).w / 2 && y > b.y && y < b.y + 12);
    if (b) return BUILDINGS[b.type].label + (b.shopType ? ` (${b.shopType})` : '');
    const a = areas.find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h);
    if (a) return a.name;
    const s = streets.findIndex((sy) => y >= sy && y < sy + STREET);
    if (s >= 0) return `${['First', 'Second', 'Third', 'Fourth', 'Fifth'][s] ?? 'A'} street`;
    if (crossStreets.some((sx) => x >= sx && x < sx + VSTREET)) return 'Cross street';
    return 'Back gardens';
  }

  /** Where in front of a building to stand (its door): for "tap a building to go there". */
  function doorOf(b) { return { x: b.x, y: b.y + 4 }; }

  // wires from pole to pole along each street
  const wires = [...(layout.wires ?? [])];
  const poles = props.filter((p) => p.type === 'utilityPole').sort((a, b) => a.y - b.y || a.x - b.x);
  for (let i = 1; i < poles.length; i++) if (poles[i].y === poles[i - 1].y) {
    const [a1, a2] = poleTops(poles[i - 1]), [b1, b2] = poleTops(poles[i]);
    wires.push([a1, b1, Math.round((b1.x - a1.x) / 22)], [a2, b2, Math.round((b2.x - a2.x) / 18)]);
  }
  return { W, H, pad, scale: k, streets, crossStreets, dims: streetDims(k), junctions, roadAt, crossingAt, railway, railAt, parked, buildings, plants, props, wires, areas, solids, blocked, findPath, randomSpot, placeAt, doorOf, ground: drawGround(layout) };
}

/** Koi circling slowly in a pond and two ducks paddling across it. */
function drawPondLife(g, a, t) {
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2, px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  [['#f08a2c', 0.32, 0.55, 0], ['#f2efe8', 0.22, 0.4, 2], ['#e8402f', 0.27, 0.65, 4], ['#f08a2c', 0.18, 0.3, 5]].forEach(([c, speed, r, off]) => {
    const ang = t * speed + off, x = cx + Math.cos(ang) * a.w * r / 2, y = cy + Math.sin(ang) * a.h * r / 2, d = Math.sign(-Math.sin(ang)) || 1;
    px(c, x - 1, y, 3, 1); px(c, x - d, y - 1);                              // a koi, its tail behind
  });
  // a.feedAt { x, y }: someone is throwing bread, and the ducks paddle over (a.pull eases from 0 to 1 and back)
  const dt = Math.min(0.2, Math.max(0, t - (a.lastT ?? t))); a.lastT = t;
  a.pull = Math.max(0, Math.min(1, (a.pull ?? 0) + (a.feedAt ? dt * 0.25 : -dt * 0.25)));
  if (a.feedAt) a.food = { x: Math.max(a.x + 6, Math.min(a.x + a.w - 6, a.feedAt.x)), y: Math.max(a.y + 5, Math.min(a.y + a.h - 5, a.feedAt.y)) };
  const ease = a.pull * a.pull * (3 - 2 * a.pull);
  for (const [k, off] of [[0, 0], [1, 1.5]]) {
    let x = cx + Math.sin(t * 0.12 + off) * a.w * 0.3, y = cy + (k ? -2 : 3), d = Math.cos(t * 0.12 + off) > 0 ? 1 : -1;
    if (ease > 0 && a.food) { const fx = a.food.x + (k ? 5 : -5), fy = a.food.y + (k ? -1 : 1); d = ease > 0.5 ? (k ? -1 : 1) : (fx > x ? 1 : -1); x += (fx - x) * ease; y += (fy - y) * ease; }
    px('#f2efe8', x - 1, y, 4, 2); px('#3f7a4a', x + (d > 0 ? 2 : -1), y - 1, 2, 1); px('#f2c230', x + (d > 0 ? 4 : -2), y - 1);   // a duck: body, green head, bill
    if (k === 0) for (let i = 1; i <= 3; i++) {                                // her ducklings in a line behind her, bobbing
      const lx = x - d * (2 + i * 3), ly = y + 1 + ((Math.floor(t * 2) + i) % 2 ? 0 : -0.4);
      px('#e8c84a', lx, ly, 2, 1); px('#f2d860', lx + (d > 0 ? 1 : 0), ly - 1);
    }
  }
  if (a.feedAt) for (let i = 0; i < 3; i++) px('#f2e8c8', a.food.x - 3 + ((i * 5 + Math.floor(t)) % 7), a.food.y + (i % 2) * 2 - 1);   // bread on the water
}
/** A basketball, bouncing: h is how high it is off the ground. */
function drawBall(g, b) {
  const x = Math.round(b.x), y = Math.round(b.y - (b.h ?? 0));
  g.fillStyle = '#e8743a'; g.fillRect(x - 1, y - 3, 3, 3); g.fillStyle = '#2f3236'; g.fillRect(x, y - 2, 1, 1);
}

/** Mix two #rrggbb colours: u = 0 is a, 1 is b. */
const mix = (a, b, u) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - u) + parseInt(b.slice(i, i + 2), 16) * u).toString(16).padStart(2, '0')).join('');
/**
 * Evening and night over a drawn view: the town tinted (warm at dusk, deep
 * blue at night), then what shines drawn again over it (lit windows, shop
 * glass, signs, neon, lanterns), then soft light round lamps, vending
 * machines, traffic lights and cars' lights. night: 0 (day) to 1.
 */
let beamLayer = null, glowLayer = null;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/**
 * Anyone (and any animal, monster or vehicle) inside a light takes on its colour (the owner's choice,
 * C, Nov 2026): drawn again in day colours tinted by the light, over the dark, in the light's own
 * steps, judged by where they are in the glow as it is drawn (its inner step full, its outer step
 * half), so what stands in the glow is lit and what stands outside it is not; people right in front
 * of a car's headlights too.
 */
let litCanvas = null, litShape = null, ringCanvas = null;
const RING_W = 24, RING_H = 24;
const WARM = { '#ffe8a8': '#ffd890' };                                   // a lamp's light, a little warmer on people
const LIT_W = 80, LIT_H = 64;
function litUp(g, items, vehicles, drawItem, dpx, on) {
  const lamps = [];
  for (const it of items) if (it.prop) for (const l of propLights(it.prop)) lamps.push({ ...l, gy: it.prop.y });
  items.forEach((it, index) => {
    const q = it.s;
    if (!q || q.ball || q.away || q.type === 'train') return;
    let best = 0, colour = null;
    // where they are: their feet, middle and head (a vehicle: its body), against each glow's steps
    const points = q.vehicle ? [[q.x, q.y - 4], [q.x - 8, q.y - 4], [q.x + 8, q.y - 4]] : [[q.x, q.y - 1], [q.x, q.y - 7], [q.x, q.y - 13]];
    for (const l of lamps) for (const [px, py] of points) {
      const u = Math.hypot(px - l.x, py - l.y) / l.r, st = u < 0.33 ? 1 : u < 0.74 ? 0.5 : 0;
      if (st > best) { best = st; colour = l.c; }
    }
    if (!q.vehicle) for (const v of vehicles) {                            // in front of a car's headlights
      if (v.type === 'train' || !VEHICLES[v.type]) continue;
      const th = ((v.heading ?? 0) * Math.PI) / 180, dx = q.x - v.x, dy = (q.y - v.y) / KY;
      const ahead = dx * Math.cos(th) + dy * Math.sin(th) - VEHICLES[v.type].length / 2, side = Math.abs(-dx * Math.sin(th) + dy * Math.cos(th));
      const st = ahead > 0 && side < VEHICLES[v.type].width / 2 + 4 ? (ahead < 12 ? 1 : ahead < 24 ? 0.5 : 0) : 0;
      if (st > best) { best = st; colour = '#fff4c8'; }
    }
    if (!best) return;
    // them alone, in day colours, on a small canvas of their own; tinted by the light; then over the dark
    if (!litCanvas || litCanvas.width !== LIT_W * dpx) { litCanvas = canvasOf(LIT_W * dpx, LIT_H * dpx); litShape = canvasOf(LIT_W * dpx, LIT_H * dpx); }
    const c = litCanvas.getContext('2d'), m = litShape.getContext('2d'), ox = Math.round(q.x) - LIT_W / 2, oy = Math.round(q.y) - LIT_H + 12;
    m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, litShape.width, litShape.height);
    m.setTransform(dpx, 0, 0, dpx, -ox * dpx, -oy * dpx); m.imageSmoothingEnabled = false;
    drawItem(m, { ...it, s: { ...q, ring: undefined, you: false } });
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, litCanvas.width, litCanvas.height);
    c.drawImage(litShape, 0, 0);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = WARM[colour] ?? (colour.length === 7 ? colour : '#ffd890'); c.fillRect(0, 0, litCanvas.width, litCanvas.height);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(litShape, 0, 0);   // (one shape: a mask drawn rectangle by rectangle would keep only the last)
    c.setTransform(dpx, 0, 0, dpx, -ox * dpx, -oy * dpx); c.imageSmoothingEnabled = false;
    // whatever stands in front of them (drawn after them) hides that part of them
    c.globalCompositeOperation = 'destination-out';
    for (let j = index + 1; j < items.length; j++) {
      const o = items[j], ob = o.b ? { x: o.b.x, y: o.b.y } : o.prop ?? o.p ?? o.s;
      if (ob && Math.abs(ob.x - q.x) < 100 && ob.y - q.y < 120) drawItem(c, o);
    }
    g.save(); g.globalAlpha = best * 0.8 * on; g.imageSmoothingEnabled = false;
    g.drawImage(litCanvas, ox, oy, LIT_W, LIT_H); g.restore();
  });
}

/**
 * Turn the soft light in a layer (added up on black) into pixel light: 'bands', a few flat steps;
 * 'dither', one strength in a 4 x 4 dot pattern that thins out where the light is weaker;
 * 'mixed', two flat steps with a dotted edge.
 */
function pixelLight(G, w, h, style) {
  const im = G.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = Math.max(d[i], d[i + 1], d[i + 2]);
    if (v < 6) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
    let q;
    const x = p % w, y = (p / w) | 0, b = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
    if (style === 'bands') q = v > 150 ? 150 : v > 70 ? 80 : v > 22 ? 34 : 0;
    else if (style === 'mixed') q = v > 120 ? 140 : v > 50 ? 70 : v > 12 && (v - 12) / 38 > b ? 40 : 0;   // two flat steps, a dotted edge
    else q = v / 160 > b ? Math.min(150, Math.max(60, v)) : 0;
    const f = q / v; d[i] = Math.min(255, d[i] * f); d[i + 1] = Math.min(255, d[i + 1] * f); d[i + 2] = Math.min(255, d[i + 2] * f);
  }
  G.setTransform(1, 0, 0, 1, 0, 0); G.putImageData(im, 0, 0);
}
let lightLayer = null;
let plantLayer = null;                                    // forests drawn at half the canvas's pixels (drawTownView)
const PLANT_RUN = 12;                                     // how many plants in a row make it worth it
function drawNight(g, view, items, night, dpx, drawItem, t = 0, lights = 'bands') {
  const dusk = Math.max(0, 1 - Math.abs(night - 0.35) / 0.35);              // the warm light of dusk, early in the evening
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = mix(mix('#ffffff', '#f4a870', dusk * 0.7), '#4c5494', Math.min(1, night ** 1.6 * 1.1));
  g.fillRect(view.x, view.y, view.w, view.h);
  g.globalCompositeOperation = 'source-over';
  const on = Math.max(0, Math.min(1, (night - 0.25) / 0.45));               // lights come on as it gets dark
  if (on > 0) {
    g.globalAlpha = on;
    // what shines on the buildings, drawn into a layer of its own in the scene's order, back to front:
    // each building first wipes out the lights behind it, then adds its own; anyone or anything in
    // front of a building wipes its shape out of them (so lit doors and windows never cover people)
    if (!lightLayer || lightLayer.width !== view.w * dpx || lightLayer.height !== view.h * dpx) lightLayer = canvasOf(view.w * dpx, view.h * dpx);
    {
      const lg = lightLayer.getContext('2d');
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, lightLayer.width, lightLayer.height);
      lg.setTransform(dpx, 0, 0, dpx, -view.x * dpx, -view.y * dpx); lg.imageSmoothingEnabled = false;
      // (a tree or bush that overlaps no building drawn so far has no light to wipe: skipped, which
      // saves drawing every tree of a forest a second time; the picture is the same)
      const lit = [];
      for (const it of items) {
        if (it.p && !lit.some((r) => it.p.x + 40 > r.x0 && it.p.x - 40 < r.x1 && it.p.y + 4 > r.y0 && it.p.y - 90 < r.y1)) continue;
        lg.globalCompositeOperation = 'destination-out'; drawItem(lg, it);
        if (it.b) {
          lg.globalCompositeOperation = 'source-over'; drawBuilding(lg, { ...it.b, lights: true, dpx, time: t });
          const { w, h } = buildingSize(it.b); lit.push({ x0: it.b.x - w / 2 - 4, x1: it.b.x + w / 2 + 4, y0: it.b.y - h - 4, y1: it.b.y + 4 });
        }
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(lightLayer, view.x, view.y, view.w, view.h);
    }
    // what glows (headlights' pools on the road, the glow round lamps, signals, vending machines,
    // cars' lamps): added up in a layer of the view's own pixels; `lights` says how it is drawn:
    // 'soft' smooth gradients, 'bands' a few flat steps, 'dither' a dot pattern thinning outwards
    const vehicles = items.filter((it) => it.s?.vehicle).map((it) => it.s);
    const k = lights === 'soft' ? dpx : 1;                                  // soft: at the device's pixels; else the town's
    if (!glowLayer || glowLayer.width !== view.w * k || glowLayer.height !== view.h * k) { glowLayer = canvasOf(view.w * k, view.h * k); beamLayer = canvasOf(view.w * k, view.h * k); }
    const G = glowLayer.getContext('2d', { willReadFrequently: true });
    G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'source-over'; G.fillStyle = '#000'; G.fillRect(0, 0, glowLayer.width, glowLayer.height);
    G.setTransform(k, 0, 0, k, -view.x * k, -view.y * k);
    // the light that falls on the ground (the headlights' pools, the glow round lamps, lanterns,
    // signals and vending machines), with every vehicle and everyone on foot painted out of it, so it
    // lights the street round them, never washes over them
    const lg = beamLayer.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, beamLayer.width, beamLayer.height);
    lg.setTransform(k, 0, 0, k, -view.x * k, -view.y * k);
    lg.globalCompositeOperation = 'lighter';
    const glow = (ctx, x, y, r, c) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, c + '99'); grad.addColorStop(0.4, c + '33'); grad.addColorStop(1, c + '00');
      ctx.fillStyle = grad; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (const v of vehicles) drawVehicleBeams(lg, v);
    for (const it of items) if (it.prop) for (const l of propLights(it.prop)) glow(lg, l.x, l.y, l.r, l.c);
    lg.globalCompositeOperation = 'destination-out';
    for (const it of items) if (it.s) drawItem(lg, it);
    G.globalCompositeOperation = 'lighter'; G.drawImage(beamLayer, view.x, view.y, view.w, view.h);
    // then the vehicles' own lamps, on them
    for (const v of vehicles) for (const l of vehicleLights(v)) glow(G, l.x, l.y, l.r, l.c);
    if (lights !== 'soft') pixelLight(G, glowLayer.width, glowLayer.height, lights);
    g.globalCompositeOperation = 'source-over';
    litUp(g, items, vehicles, drawItem, dpx, on);                              // what stands in the light, lit (under the cars' own lamps)
    g.globalCompositeOperation = 'lighter';
    g.imageSmoothingEnabled = false;
    g.drawImage(glowLayer, view.x, view.y, view.w, view.h);
  }
  g.restore();
}

/** The town's ground (grass, grounds, streets, cross streets, crossings) on a canvas of its own. */
// the areas' grounds are the terrains of tinyNature
const TERRAIN_OF = { gravel: 'gravel', sand: 'sand', paving: 'cobble', water: 'water', grass: 'grass' };
function drawGround(layout) {
  const { W, H, streets, crossStreets, areas = [], k } = layout;
  const { SIDE, ROAD, STREET, VSIDE, VSTREET } = streetDims(k), m = (v) => Math.round(v * k);
  const c = canvasOf(W, H);
  const g = c.getContext('2d');
  drawTerrain(g, { type: 'grass', x: 0, y: 0, w: W, h: H, scale: k, seed: 3 });
  // the forest floor: under the trees round the town
  const pad = Math.round((layout.forest ?? 0) * k), last = streets[streets.length - 1] + STREET;
  for (const [x, y, w, h] of [[0, 0, W, streets[0]], [0, 0, pad, H], [W - pad, 0, pad, H], [0, last, W, H - last]]) drawTerrain(g, { type: 'tallGrass', x, y, w, h, scale: k, seed: x + y + 11 });
  // meadow and long grass in patches in the gardens (under the buildings it does not show)
  for (let i = 0; i < streets.length - 1; i++) {
    const y0 = streets[i] + STREET, y1 = streets[i + 1];
    for (let x = pad, j = 0; x < W - pad; x += m(48), j++) drawTerrain(g, { type: j % 2 ? 'meadow' : 'tallGrass', x: x + m(6), y: y0 + m(3), w: m(30), h: Math.min(m(14), y1 - y0 - m(6)), scale: k, seed: x + i });
  }
  const use = (name) => (usesFull(FULL_GROUND[name]) ? FULL_GROUND[name] : null);   // the ground's pieces (tinyGroundFull.js)
  const terrain = (a) => (ctx, x = a.x, y = a.y, w = a.w, h = a.h, type = TERRAIN_OF[a.ground] ?? a.ground, seed = a.x + a.y) => drawTerrain(ctx, { type, x, y, w, h, scale: k, seed });
  for (const a of areas) {
    if (a.ground === 'court') { use('court')?.draw(g, a, k); continue; }            // the court, its lines and a pixel centre circle
    if (a.shape === 'ellipse') { use('pond')?.draw(g, a, k, terrain(a)); continue; } // a pond with a pixel bank of stones
    terrain(a)(g);
    if (a.ring) use('ringPath')?.draw(g, a, k, terrain(a));                          // a dirt path looping round inside it
    if (a.path) use('steppingStones')?.draw(g, a, k);                                // stepping stones along its path
  }
  const dims = { W, H, streets, crossStreets, k, SIDE, ROAD, STREET, VSIDE, VSTREET, pad, m };
  use('streets')?.draw(g, dims);                                                     // sidewalks, kerbs, roads, crossings, manholes
  if (layout.railway) use('railway')?.draw(g, layout.railway, dims);                  // ballast, sleepers, rails, level crossings
  return c;
}

// --- weather (the owner chose C from animated mock-ups, Nov 2026: heavy rain, splashes,
// puddles on the roads and sidewalks, umbrellas up; in winter it snows instead) ----------
/** The ground in a season (none: as drawn), with puddles when it is wet; made once and kept. */
function groundOf(town, season, wet) {
  if (!season && !wet) return town.ground;
  town.grounds ??= new Map();
  const key = `${season ?? ''}|${wet ? 'wet' : ''}`;
  if (town.grounds.has(key)) return town.grounds.get(key);
  const c = season ? groundInSeason(town.ground, season) : groundInSeason(town.ground, 'summer');
  if (wet) puddles(c, town);
  town.grounds.set(key, c);
  return c;
}
/** Puddles on the roads and sidewalks: flat pixel ovals of dark water with a lit edge, by place (nothing random). */
function puddles(c, town) {
  const g = c.getContext('2d'), { STREET } = town.dims;
  const spots = [];
  for (const y0 of town.streets) for (let x = 10 + (y0 % 37); x < town.W - 20; x += 23 + ((x * 7 + y0) % 29)) spots.push([x, y0 + 3 + ((x * 13 + y0) % (STREET - 8))]);
  for (const x0 of town.crossStreets) for (let y = town.streets[0] + 10; y < town.streets[town.streets.length - 1]; y += 27 + ((y * 5 + x0) % 31)) spots.push([x0 + 3 + ((y * 11 + x0) % (town.dims.VSTREET - 12)), y]);
  for (const [x, y] of spots) {
    const w = 6 + ((x + y) % 7), h = 2 + ((x * 3 + y) % 2);
    for (let j = 0; j < h; j++) { const inset = j === 0 || j === h - 1 ? 2 : 0; g.fillStyle = '#56626e'; g.fillRect(x + inset, y + j, w - inset * 2, 1); }
    g.fillStyle = '#8c9caa'; g.fillRect(x + 2, y, Math.max(1, (w >> 1) - 2), 1);   // the sky in it
  }
}
/** Rain over the view (or snow falling): a darker sky, streaks falling at a slant, splashes; pixels, by time. */
function drawRain(g, view, t, night, snow) {
  const { x: X, y: Y, w: W, h: H } = view, dark = Math.min(1, night);
  // (the owner: the first rain was too harsh, the town hard to see: now a light grey, fewer and
  // see-through streaks, few splashes)
  g.globalCompositeOperation = 'multiply';                                 // the grey of a rainy day, light
  g.fillStyle = snow ? '#eef0f4' : `rgb(${Math.round(240 + 12 * dark)},${Math.round(242 + 10 * dark)},${Math.round(246 + 6 * dark)})`;
  g.fillRect(X, Y, W, H);
  g.globalCompositeOperation = 'source-over';
  const streak = dark > 0.5 ? '#8a98b0' : '#d8e2ec';
  const cols = Math.ceil(W * H / (snow ? 300 : 600));                      // about one drop per 600 pixels of view
  for (let k = 0; k < cols; k++) {
    const sx = ((k * 7919) % 997) / 997, sy = ((k * 104729) % 991) / 991, sp = 0.8 + (k % 5) * 0.08;
    if (snow) {                                                            // flakes: drifting down slowly, swaying
      const py = ((sy + t * 0.12 * sp) % 1) * (H + 10) - 5, px = Math.round(((sx * (W + 10) + Math.sin(t * 1.3 + k) * 3) % (W + 10) + W + 10) % (W + 10)) - 5;
      g.fillStyle = '#ffffff'; g.fillRect(X + px, Math.round(Y + py), 1, 1);
      continue;
    }
    const py = ((sy + t * 2.2 * sp) % 1) * (H + 20) - 10, px = Math.round(sx * (W + 20) - 10 - py * 0.25);
    g.globalAlpha = 0.45 + (k % 3) * 0.1;                                   // see-through streaks (some fainter, further off)
    g.fillStyle = streak;
    for (let j = 0; j < 4; j++) g.fillRect(X + px + Math.floor((py + j) * 0.25) - Math.floor(py * 0.25), Y + Math.round(py) + j, 1, 1);
  }
  g.globalAlpha = 1;
  if (snow) return;
  g.fillStyle = dark > 0.5 ? '#7a88a0' : '#e8f0f6';                        // a few splashes where drops land
  const splashes = Math.ceil(W * H / 3000);
  for (let k = 0; k < splashes; k++) {
    const ph = (k * 0.37 + t * 3) % 1; if (ph > 0.25) continue;
    const sx = X + Math.round(((k * 4447) % 983) / 983 * W), sy = Y + Math.round(((k * 2711 + Math.floor(t * 3 + k * 0.37) * 131) % 977) / 977 * H);
    g.fillRect(sx - 1, sy, 1, 1); g.fillRect(sx + 1, sy, 1, 1);
  }
}

/**
 * A fenced area's fence: its four sides as pieces { x, y, w, h, side }, with a gap (a gate)
 * in the middle of a side: `gates: { top, bottom, left, right }` (their widths), or `gate`
 * (one in the top).
 */
function fenceOf(a) {
  const gates = a.gates ?? { top: a.gate ?? 0 }, out = [];
  const run = (side, x, y, len, across) => {
    const gw = gates[side] ?? 0, g0 = Math.round((len - gw) / 2), g1 = g0 + gw;
    const piece = (from, to) => { if (to > from) out.push(across ? { side, x: x + from, y, w: to - from, h: side === 'top' ? 3 : 3 } : { side, x, y: y + from, w: 2, h: to - from }); };
    if (gw) { piece(0, g0); piece(g1, len); } else piece(0, len);
  };
  run('top', a.x, a.y, a.w, true); run('bottom', a.x, a.y + a.h - 3, a.w, true);
  run('left', a.x, a.y, a.h, false); run('right', a.x + a.w - 2, a.y, a.h, false);
  return out;
}
/**
 * Draw the part of `town` in `view` ({ x, y, w, h }) into `g`: the ground,
 * then the buildings, street things and `sprites` (people; cats `cat: true`;
 * dogs `dog: true`; monsters `monster: type`; vehicles `vehicle: true`)
 * further back first, so whoever stands lower on the screen is in front.
 * dpx: device pixels per canvas pixel, when the canvas is drawn bigger
 * underneath (g scaled by dpx) so the signs' names can be written.
 */
export function drawTownView(g, town, view, sprites, t = 0, { dpx = 1, night = 0, above = [], petals = true, steam = drawSteam, lights = 'bands', season = null, weather = null, prints = [] } = {}) {
  if (!SEASONS.includes(season)) season = null;                             // no season: as drawn
  const rain = weather === 'rain';
  g.imageSmoothingEnabled = false;
  g.drawImage(groundOf(town, season, rain && season !== 'winter'), view.x, view.y, view.w, view.h, 0, 0, view.w, view.h);
  g.save(); g.translate(-view.x, -view.y);
  // footprints pressed into the ground (snow): { x, y, age } pixel pairs, paler as they age, under everyone
  for (const f of prints) if (f.x > view.x - 2 && f.x < view.x + view.w + 2 && f.y > view.y - 2 && f.y < view.y + view.h + 2) {
    g.fillStyle = f.age < 0.5 ? '#b4c0d0' : '#cbd4e0'; g.fillRect(Math.round(f.x), Math.round(f.y), 2, 1);
  }
  const items = [];
  for (const b of town.buildings) {
    const { w, h } = buildingSize(b);
    if (b.x + w / 2 > view.x && b.x - w / 2 < view.x + view.w && b.y > view.y && b.y - h < view.y + view.h) items.push({ y: b.y, b });
  }
  // water ripples, drawn again each frame
  for (const a of town.areas) if (a.ground === 'water' && a.x < view.x + view.w && a.x + a.w > view.x && a.y < view.y + view.h && a.y + a.h > view.y) {
    const water = (ctx) => drawTerrain(ctx, { type: 'water', x: a.x, y: a.y, w: a.w, h: a.h, scale: town.scale, seed: a.x + a.y, t });
    if (a.shape === 'ellipse') { if (usesFull(FULL_GROUND.pond)) FULL_GROUND.pond.water(g, a, town.scale, water); }   // inside the pond's pixel edge
    else water(g);
    if (a.koi) drawPondLife(g, a, t);
  }
  for (const v of town.parked ?? []) if (v.x > view.x - 30 && v.x < view.x + view.w + 30 && v.y > view.y && v.y < view.y + view.h + 30) items.push({ y: v.y, s: v });
  for (const p of town.props) if (p.x > view.x - 20 && p.x < view.x + view.w + 20 && p.y > view.y && p.y < view.y + view.h + 50) items.push({ y: p.y, prop: p });
  for (const p of town.plants) if (p.x > view.x - 30 && p.x < view.x + view.w + 30 && p.y > view.y && p.y < view.y + view.h + 60) items.push({ y: p.y, p });
  for (const s of sprites) if (s.x > view.x - 24 && s.x < view.x + view.w + 24 && s.y > view.y - 2 && s.y < view.y + view.h + 24) items.push({ y: s.y, s });
  items.sort((a, b) => a.y - b.y || (a.b ? -1 : 1));
  /** Draw one thing of the view (a building, a prop, a plant, someone or something moving). */
  const drawItem = (ctx, it) => {
    if (it.b) drawBuilding(ctx, dpx === 1 && season !== 'winter' ? it.b : { ...it.b, dpx, snow: season === 'winter' });
    else if (it.prop) {
      if (it.prop.riders) drawSwings(ctx, it.prop, t);                           // swings with people on them: { riders: [{ angle, kid }, null] }
      else { if (it.prop.type === 'redLantern') it.prop.sway = Math.round(Math.sin(t * 1.3 + it.prop.x * 0.7) * 0.7); drawProp(ctx, it.prop); }
    }
    else if (it.p) { if (it.p.kind === 'tree') drawTree(ctx, { ...it.p, t, season }); else drawBush(ctx, season ? { ...it.p, season } : it.p); }   // trees sway in the breeze
    else if (it.s.vehicle) drawVehicle(ctx, it.s);                               // cars, buses, the train: { vehicle: true, type, ... }
    else if (it.s.ball) drawBall(ctx, it.s);                                     // a ball { ball: true, x, y, h (its height off the ground) }
    else if (it.s.draw) it.s.draw(ctx, it.s, t);                                // anything with its own drawing: { draw(g, s, t), x, y } (pigeons, rubbish...)
    else if (it.s.pose) drawPose(ctx, it.s, t);                                  // someone sitting, riding, sweeping... (tinyLife POSES)
    else if (it.s.ring && (it.s.monster || it.s.cat || it.s.dog)) { drawRing(ctx, it.s.x, it.s.y, it.s.ring); drawItem(ctx, { s: { ...it.s, ring: null } }); }   // pointed at: a ring under them
    else if (it.s.monster) drawMonster(ctx, { ...it.s, type: it.s.monster }, t); // monsters: { monster: 'zombie', variant, ... }
    else (it.s.dog ? drawDog : it.s.cat ? drawCat : drawCharacter)(ctx, it.s, t);
  };
  // runs of plants one after another (a forest) are drawn into a layer at half the canvas's
  // pixels, then copied up in one go: the same picture (every plant sits on half-pixels at
  // most) for a quarter of the filling. Short runs are drawn straight.
  const half = dpx % 2 === 0 && dpx > 2 ? dpx / 2 : 0;
  for (let i = 0; i < items.length;) {
    let j = i; while (j < items.length && items[j].p) j++;
    if (half && j - i >= PLANT_RUN) {
      if (!plantLayer || plantLayer.width !== view.w * half || plantLayer.height !== view.h * half) plantLayer = canvasOf(view.w * half, view.h * half);
      const pg = plantLayer.getContext('2d');
      pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, plantLayer.width, plantLayer.height);
      pg.setTransform(half, 0, 0, half, -view.x * half, -view.y * half); pg.imageSmoothingEnabled = false;
      for (let q = i; q < j; q++) drawItem(pg, items[q]);
      g.imageSmoothingEnabled = false; g.drawImage(plantLayer, view.x, view.y, view.w, view.h);
      i = j;
    } else if (j > i) { for (let q = i; q < j; q++) drawItem(g, items[q]); i = j; }
    else drawItem(g, items[i++]);
  }
  // the wires, over everything
  for (const [a, b, sag] of town.wires) if (Math.max(a.x, b.x) > view.x && Math.min(a.x, b.x) < view.x + view.w && a.y > view.y - 10 && a.y < view.y + view.h + 10) drawWire(g, a, b, sag);
  // above everything: steam from the food stalls, cherry petals drifting, and what sits up high (crows on the wires: `above`)
  for (const it of items) {
    if (it.b && cooks(it.b)) { const { w, h } = buildingSize(it.b); steam(g, it.b.x + w * 0.22, it.b.y - h * 0.55, t, it.b.x); }
    else if (it.p && it.p.kind === 'tree' && it.p.type === 'sakura' && petals && (!season || season === 'spring')) drawPetals(g, { ...it.p, seed: it.p.x }, t, Math.round(30 * town.scale));
  }
  for (const s of above) if (s.x > view.x - 10 && s.x < view.x + view.w + 10 && s.y > view.y - 4 && s.y < view.y + view.h + 10) (s.draw ?? drawCharacter)(g, s, t);
  if (night > 0.01) {
    drawNight(g, view, items, night, dpx, drawItem, t, lights);
    // the rings (yours gold, whoever is pointed at white) keep their colour at night: drawn again over
    // the dark, the one wearing it (and whatever stands in front) painted out of it
    items.forEach((it, index) => {
      const q = it.s;
      if (!q || q.vehicle || !(q.you || q.ring)) return;
      if (!ringCanvas || ringCanvas.width !== RING_W * dpx) ringCanvas = canvasOf(RING_W * dpx, RING_H * dpx);
      const c = ringCanvas.getContext('2d'), ox = Math.round(q.x) - RING_W / 2, oy = Math.round(q.y) - RING_H + 6;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, ringCanvas.width, ringCanvas.height);
      c.setTransform(dpx, 0, 0, dpx, -ox * dpx, -oy * dpx); c.imageSmoothingEnabled = false;
      drawRing(c, q.x, q.y, q.ring ?? undefined);                          // (yours: the gold of drawRing)
      c.globalCompositeOperation = 'destination-out';
      drawItem(c, { ...it, s: { ...q, ring: undefined, you: false } });
      for (let j = index + 1; j < items.length; j++) { const o = items[j], ob = o.b ? o.b : o.prop ?? o.p ?? o.s; if (ob && Math.abs(ob.x - q.x) < 60 && ob.y - q.y < 120) drawItem(c, o); }
      g.drawImage(ringCanvas, ox, oy, RING_W, RING_H);
    });
  }
  if (rain) drawRain(g, view, t, night, season === 'winter');                   // over everything: rain (snow falling in winter)
  g.restore();
}
