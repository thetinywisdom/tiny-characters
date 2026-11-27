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

import { BUILDINGS, buildingSize, buildingSolids, drawBuilding } from './tinyBuildings.js';
import { drawCat, drawDog } from './tinyAnimals.js';
import { drawMonster } from './tinyMonsters.js';
import { BUSHES, drawBush, drawTerrain, drawTree } from './tinyNature.js';
import { PROPS, drawProp, drawWire, poleTops, propLights, propSolid } from './tinyStreet.js';
import { drawVehicle, drawVehicleBeams, vehicleLights } from './tinyTraffic.js';
import { canvasOf, drawCharacter, seeded as seededRng } from './tinyCharacters.js';

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
    { name: 'Basketball court', ground: 'court', x: 402, y: 456, w: 156, h: 96, fence: true, gate: 20 },
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
    { type: 'plantPot', x: 200, y: 106 },
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
    ...areas.filter((a) => a.fence).flatMap((a) => { const g0 = a.x + Math.round((a.w - (a.gate ?? 0)) / 2), g1 = g0 + (a.gate ?? 0);
      return [{ x: a.x, y: a.y, w: g0 - a.x, h: 3 }, { x: g1, y: a.y, w: a.x + a.w - g1, h: 3 }, { x: a.x, y: a.y + a.h - 3, w: a.w, h: 3 }, { x: a.x, y: a.y, w: 2, h: a.h }, { x: a.x + a.w - 2, y: a.y, w: 2, h: a.h }]; })];
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
  for (const [k, off] of [[0, 0], [1, 1.5]]) {
    const x = cx + Math.sin(t * 0.12 + off) * a.w * 0.3, y = cy + (k ? -2 : 3), d = Math.cos(t * 0.12 + off) > 0 ? 1 : -1;
    px('#f2efe8', x - 1, y, 4, 2); px('#3f7a4a', x + (d > 0 ? 2 : -1), y - 1, 2, 1); px('#f2c230', x + (d > 0 ? 4 : -2), y - 1);   // a duck: body, green head, bill
  }
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
let beamLayer = null;
let lightLayer = null;
function drawNight(g, view, items, night, dpx, drawItem) {
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
      for (const it of items) {
        lg.globalCompositeOperation = 'destination-out'; drawItem(lg, it);
        if (it.b) { lg.globalCompositeOperation = 'source-over'; drawBuilding(lg, { ...it.b, lights: true, dpx }); }
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(lightLayer, view.x, view.y, view.w, view.h);
    }
    // headlights on the road: drawn into a layer of their own, the vehicles painted out of it
    // (so the light falls on the road, not over the cars), then added to the picture
    const vehicles = items.filter((it) => it.s?.vehicle).map((it) => it.s);
    if (vehicles.length) {
      // one layer, kept and cleared each frame (made again only when the view's size changes)
      if (!beamLayer || beamLayer.width !== view.w * dpx || beamLayer.height !== view.h * dpx) beamLayer = canvasOf(view.w * dpx, view.h * dpx);
      const L = beamLayer, lg = L.getContext('2d');
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, L.width, L.height);
      lg.setTransform(dpx, 0, 0, dpx, -view.x * dpx, -view.y * dpx);
      lg.globalCompositeOperation = 'lighter';
      for (const v of vehicles) drawVehicleBeams(lg, v);
      lg.globalCompositeOperation = 'destination-out';
      for (const v of vehicles) drawVehicle(lg, v);
      g.globalCompositeOperation = 'lighter';
      g.imageSmoothingEnabled = false;
      g.drawImage(L, view.x, view.y, view.w, view.h);
    }
    g.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, c) => {
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, c + '99'); grad.addColorStop(0.4, c + '33'); grad.addColorStop(1, c + '00');
      g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (const it of items) {
      const lights = it.prop ? propLights(it.prop) : it.s?.vehicle ? vehicleLights(it.s) : [];
      for (const l of lights) glow(l.x, l.y, l.r, l.c);
    }
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
  const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  drawTerrain(g, { type: 'grass', x: 0, y: 0, w: W, h: H, scale: k, seed: 3 });
  // the forest floor: under the trees round the town
  const pad = Math.round((layout.forest ?? 0) * k), last = streets[streets.length - 1] + STREET;
  for (const [x, y, w, h] of [[0, 0, W, streets[0]], [0, 0, pad, H], [W - pad, 0, pad, H], [0, last, W, H - last]]) drawTerrain(g, { type: 'tallGrass', x, y, w, h, scale: k, seed: x + y + 11 });
  // meadow and long grass in patches in the gardens (under the buildings it does not show)
  for (let i = 0; i < streets.length - 1; i++) {
    const y0 = streets[i] + STREET, y1 = streets[i + 1];
    for (let x = pad, j = 0; x < W - pad; x += m(48), j++) drawTerrain(g, { type: j % 2 ? 'meadow' : 'tallGrass', x: x + m(6), y: y0 + m(3), w: m(30), h: Math.min(m(14), y1 - y0 - m(6)), scale: k, seed: x + i });
  }
  for (const a of areas) {
    if (a.ground === 'court') { drawCourt(g, a, k); continue; }
    if (a.shape === 'ellipse') { g.save(); g.beginPath(); g.ellipse(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, a.h / 2, 0, 0, Math.PI * 2); g.clip(); }
    drawTerrain(g, { type: TERRAIN_OF[a.ground] ?? a.ground, x: a.x, y: a.y, w: a.w, h: a.h, scale: k, seed: a.x + a.y });
    if (a.shape === 'ellipse') { g.restore(); g.strokeStyle = '#8a8a80'; g.lineWidth = 1; g.beginPath(); g.ellipse(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, a.h / 2, 0, 0, Math.PI * 2); g.stroke(); }
    if (a.ring) {                                                           // a dirt path looping round inside it
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2, rx = a.w / 2 - m(8), ry = a.h / 2 - m(8), wd = m(6);
      g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.ellipse(cx, cy, rx - wd, ry - wd, 0, 0, Math.PI * 2); g.clip('evenodd');
      drawTerrain(g, { type: 'dirt', x: a.x, y: a.y, w: a.w, h: a.h, scale: k, seed: a.x + 7 }); g.restore();
    }
    if (a.path) for (let y = a.path.y0; y < a.y + a.h; y += m(5)) R('#c9c2b0', a.path.x, y, a.path.w, m(4));  // stepping stones
  }
  const y0 = streets[0], y1 = streets[streets.length - 1] + STREET;
  // cross streets' sidewalks, then the streets across them, then the cross streets' roads
  for (const x of crossStreets) R('#d8d2c4', x, y0, VSTREET, y1 - y0);
  for (const y of streets) {
    R('#d8d2c4', 0, y, W, SIDE); R('#d8d2c4', 0, y + SIDE + ROAD, W, SIDE);
    for (let x = 0; x < W; x += m(8)) { R('#c4bdae', x, y, 1, SIDE); R('#c4bdae', x, y + SIDE + ROAD, 1, SIDE); }
    R('#9a9890', 0, y + SIDE - 1, W, 1); R('#9a9890', 0, y + SIDE + ROAD, W, 1);
    R('#6f7378', 0, y + SIDE, W, ROAD);
    for (let x = 0; x < W; x += m(16)) R('#e8e4d8', x, y + SIDE + Math.floor(ROAD / 2), m(8), 1);
    // manholes, here and there in the lanes
    for (let x = pad + m(40) + (y % m(50)); x < W - pad - m(10); x += m(130)) {
      const mx = Math.round(x), my = y + SIDE + (Math.round(x / m(130)) % 2 ? m(4) : ROAD - m(7)), w = m(6), h = m(3);
      R('#55595e', mx + 1, my, w - 2, h); R('#55595e', mx, my + 1, w, h - 2); R('#7a7e84', mx + 2, my + 1, w - 4, Math.max(1, h - 2));
    }
  }
  for (const x of crossStreets) {
    R('#6f7378', x + VSIDE, y0 + SIDE, ROAD, y1 - y0 - SIDE * 2);
    for (let j = 0; j < streets.length - 1; j++) {                                     // kerbs between the streets
      const a = streets[j] + STREET, b = streets[j + 1];
      R('#9a9890', x + VSIDE - 1, a, 1, b - a); R('#9a9890', x + VSIDE + ROAD, a, 1, b - a);
    }
    for (let y = y0 + SIDE + 4; y < y1 - SIDE; y += m(14)) if (!streets.some((sy) => y + m(7) > sy && y < sy + STREET)) R('#e8e4d8', x + VSIDE + Math.floor(ROAD / 2), y, 1, m(7));
    // crossings: over each street next to the cross street, and over the cross street next to each street
    for (const y of streets) {
      for (let j = 0; j < ROAD; j += 3) R('#e8e4d8', x - m(9), y + SIDE + j, m(7), 2);
      for (let j = 0; j < ROAD; j += 3) {
        if (y !== streets[0]) R('#e8e4d8', x + VSIDE + j, y - m(6), 2, m(5));
        if (y !== streets[streets.length - 1]) R('#e8e4d8', x + VSIDE + j, y + STREET + 1, 2, m(5));
      }
    }
  }
  // the railway: gravel, sleepers and two rails right across; at a level crossing the road goes over it
  const rail = layout.railway;
  if (rail) {
    R('#9a958a', 0, rail.y, W, rail.h); R('#8a857a', 0, rail.y, W, 1);
    const top = rail.y + Math.round(rail.h * 0.2), bot = rail.y + Math.round(rail.h * 0.72);
    for (let x = 0; x < W; x += m(4)) R('#6a5040', x, rail.y + m(2), m(2), rail.h - m(4));
    for (const sx of crossStreets) { R('#d8d2c4', sx, rail.y, VSTREET, rail.h); R('#5a5e62', sx + VSIDE, rail.y, ROAD, rail.h); }   // the crossing's boards
    for (const y of [top, bot]) { R('#c8ccd0', 0, y, W, 1); R('#7a7e84', 0, y + 1, W, 1); }
    for (const sx of crossStreets) for (const y of [rail.y - 1, rail.y + rail.h]) for (let x = sx; x < sx + VSTREET; x += m(4)) R(x % m(8) < m(4) ? '#f2c230' : '#2f3236', x, y, m(4), 1);   // striped edges
  }
  return c;
}

/** A sports court on the ground: a blue run-off, an orange court, white lines, a chain-link fence round it with a gate in the top. */
function drawCourt(g, a, k) {
  const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }, m = (v) => Math.round(v * k);
  R('#3f6f9a', a.x, a.y, a.w, a.h);
  const cx = a.x + m(10), cy = a.y + m(8), cw = a.w - m(20), ch = a.h - m(16), line = '#f2f2ee';
  R('#c8743a', cx, cy, cw, ch);
  R(line, cx, cy, cw, 1); R(line, cx, cy + ch - 1, cw, 1); R(line, cx, cy, 1, ch); R(line, cx + cw - 1, cy, 1, ch); R(line, cx + Math.round(cw / 2), cy, 1, ch);
  for (const kx of [cx, cx + cw - m(22)]) { R(line, kx, cy + Math.round(ch / 2) - m(10), m(22), 1); R(line, kx, cy + Math.round(ch / 2) + m(10), m(22), 1); R(line, kx === cx ? kx + m(22) : kx, cy + Math.round(ch / 2) - m(10), 1, m(20)); }   // the keys
  g.strokeStyle = line; g.lineWidth = 1; g.beginPath(); g.ellipse(cx + cw / 2, cy + ch / 2, m(10), m(7), 0, 0, Math.PI * 2); g.stroke();
  // the fence: posts and wire mesh round the edge, a gap for the gate at the top
  const g0 = a.x + Math.round((a.w - (a.gate ?? 0)) / 2), g1 = g0 + (a.gate ?? 0);
  for (let x = a.x; x < a.x + a.w; x += m(4)) { if (x >= g0 && x < g1) continue; R('#9aa0a8', x, a.y, 1, 3); R('#9aa0a8', x, a.y + a.h - 3, 1, 3); }
  R('#8a9096', a.x, a.y, g0 - a.x, 1); R('#8a9096', g1, a.y, a.x + a.w - g1, 1); R('#8a9096', a.x, a.y + a.h - 1, a.w, 1);
  for (let y = a.y; y < a.y + a.h; y += m(3)) { R('#9aa0a8', a.x, y, 2, 2); R('#9aa0a8', a.x + a.w - 2, y, 2, 2); }
}

/**
 * Draw the part of `town` in `view` ({ x, y, w, h }) into `g`: the ground,
 * then the buildings, street things and `sprites` (people; cats `cat: true`;
 * dogs `dog: true`; monsters `monster: type`; vehicles `vehicle: true`)
 * further back first, so whoever stands lower on the screen is in front.
 * dpx: device pixels per canvas pixel, when the canvas is drawn bigger
 * underneath (g scaled by dpx) so the signs' names can be written.
 */
export function drawTownView(g, town, view, sprites, t = 0, { dpx = 1, night = 0 } = {}) {
  g.imageSmoothingEnabled = false;
  g.drawImage(town.ground, view.x, view.y, view.w, view.h, 0, 0, view.w, view.h);
  g.save(); g.translate(-view.x, -view.y);
  const items = [];
  for (const b of town.buildings) {
    const { w, h } = buildingSize(b);
    if (b.x + w / 2 > view.x && b.x - w / 2 < view.x + view.w && b.y > view.y && b.y - h < view.y + view.h) items.push({ y: b.y, b });
  }
  // water ripples, drawn again each frame
  for (const a of town.areas) if (a.ground === 'water' && a.x < view.x + view.w && a.x + a.w > view.x && a.y < view.y + view.h && a.y + a.h > view.y) {
    if (a.shape === 'ellipse') { g.save(); g.beginPath(); g.ellipse(a.x + a.w / 2, a.y + a.h / 2, a.w / 2 - 0.5, a.h / 2 - 0.5, 0, 0, Math.PI * 2); g.clip(); }
    drawTerrain(g, { type: 'water', x: a.x, y: a.y, w: a.w, h: a.h, scale: town.scale, seed: a.x + a.y, t });
    if (a.koi) drawPondLife(g, a, t);
    if (a.shape === 'ellipse') g.restore();
  }
  for (const v of town.parked ?? []) if (v.x > view.x - 30 && v.x < view.x + view.w + 30 && v.y > view.y && v.y < view.y + view.h + 30) items.push({ y: v.y, s: v });
  for (const p of town.props) if (p.x > view.x - 20 && p.x < view.x + view.w + 20 && p.y > view.y && p.y < view.y + view.h + 50) items.push({ y: p.y, prop: p });
  for (const p of town.plants) if (p.x > view.x - 30 && p.x < view.x + view.w + 30 && p.y > view.y && p.y < view.y + view.h + 60) items.push({ y: p.y, p });
  for (const s of sprites) if (s.x > view.x - 24 && s.x < view.x + view.w + 24 && s.y > view.y - 2 && s.y < view.y + view.h + 24) items.push({ y: s.y, s });
  items.sort((a, b) => a.y - b.y || (a.b ? -1 : 1));
  /** Draw one thing of the view (a building, a prop, a plant, someone or something moving). */
  const drawItem = (ctx, it) => {
    if (it.b) drawBuilding(ctx, dpx === 1 ? it.b : { ...it.b, dpx });
    else if (it.prop) drawProp(ctx, it.prop);
    else if (it.p) (it.p.kind === 'tree' ? drawTree : drawBush)(ctx, it.p);
    else if (it.s.vehicle) drawVehicle(ctx, it.s);                               // cars, buses, the train: { vehicle: true, type, ... }
    else if (it.s.ball) drawBall(ctx, it.s);                                     // a ball { ball: true, x, y, h (its height off the ground) }
    else if (it.s.monster) drawMonster(ctx, { ...it.s, type: it.s.monster }, t); // monsters: { monster: 'zombie', variant, ... }
    else (it.s.dog ? drawDog : it.s.cat ? drawCat : drawCharacter)(ctx, it.s, t);
  };
  for (const it of items) drawItem(g, it);
  // the wires, over everything
  for (const [a, b, sag] of town.wires) if (Math.max(a.x, b.x) > view.x && Math.min(a.x, b.x) < view.x + view.w && a.y > view.y - 10 && a.y < view.y + view.h + 10) drawWire(g, a, b, sag);
  if (night > 0.01) drawNight(g, view, items, night, dpx, drawItem);
  g.restore();
}
