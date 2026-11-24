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
import { drawCharacter } from './tinyCharacters.js';
import { drawCat, drawDog } from './tinyAnimals.js';
import { drawMonster } from './tinyMonsters.js';
import { BUSHES, TREES, drawBush, drawTerrain, drawTree } from './tinyNature.js';
import { seeded as seededRng } from './tinyCharacters.js';

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
    areas: (layout.areas ?? []).map((a) => ({ ...a, x: X(a.x), y: X(a.y), w: m(a.w), h: m(a.h), path: a.path && { x: X(a.path.x), w: m(a.path.w), y0: X(a.path.y0) } })),
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
  W: 560, H: 448,
  streets: [108, 200, 284, 416],
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
  ],
  areas: [
    { name: 'Shrine grounds', ground: 'gravel', x: 0, y: 316, w: 180, h: 100, path: { x: 82, w: 16, y0: 350 } },
    { name: 'Schoolyard', ground: 'sand', x: 210, y: 316, w: 160, h: 100 },
    { name: 'Old-town square', ground: 'paving', x: 400, y: 316, w: 160, h: 100 },
    { name: 'Pond', ground: 'water', x: 88, y: 234, w: 44, h: 11, solid: true },
  ],
  // trees and bushes: in the back gardens, round the shrine, the school and the square
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
  ],
};


/** Build a town from a layout: its buildings, ground picture, walkable ground and paths. */
export function makeTown(layout0 = DEFAULT_TOWN) {
  const layout = scaled(layout0), { W, H, streets, crossStreets, k } = layout;
  const { STREET, VSTREET } = streetDims(k);
  const buildings = layout.buildings.map((b, i) => ({ seed: i + 1, ...b }));
  // each row's buildings get seeds that fit: no taller than the room up to the
  // street above, and together no wider than the room up to the next cross
  // street (seeds change a building's width, floors and roof, so try a few)
  const townSeed = layout.seed ?? 7, gap = Math.round(2 * k);
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
  }
  const areas = layout.areas;
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
  // trees block at the trunk, bushes at their base, a pond everywhere
  let plants = layout.plants.map((p) => ({ ...p, type: p.tree ?? p.bush, kind: p.tree ? 'tree' : 'bush' }));
  const rng = seededRng(layout.seed ?? 7);
  // greenery in the back gardens: bushes and small trees where there is room, leaving paths between them
  const roomFor = (x, y, r) => !buildings.some((b) => { const { w, h } = buildingSize(b); return x > b.x - w / 2 - r && x < b.x + w / 2 + r && y > b.y - h - r && y < b.y + r + 4; })
    && !plants.some((p) => Math.hypot(p.x - x, p.y - y) < r * 2.2) && !areas.some((a) => x > a.x - r && x < a.x + a.w + r && y > a.y - r && y < a.y + a.h + r)
    && !crossStreets.some((sx) => x > sx - r && x < sx + VSTREET + r);
  for (let i = 0; i < streets.length - 1; i++) {
    const y0 = streets[i] + STREET, y1 = streets[i + 1], step = Math.round(13 * k);
    for (let y = y0 + Math.round(6 * k); y < y1; y += step) for (let x = pad + 6; x < W - pad - 6; x += step) {
      const px = Math.round(x + (rng() - 0.5) * step * 0.7), py = Math.round(y + (rng() - 0.5) * step * 0.4);
      if (rng() < 0.4 || !roomFor(px, py, Math.round(5 * k))) continue;
      const tree = py - y0 > 18 * k && rng() < 0.45;
      plants.push({ tree: tree ? GARDEN_TREES[Math.floor(rng() * GARDEN_TREES.length)] : undefined, bush: tree ? undefined : GARDEN_BUSHES[Math.floor(rng() * GARDEN_BUSHES.length)],
        x: px, y: py, seed: 1 + Math.floor(rng() * 999), scale: k, type: tree ? undefined : null });
    }
  }
  plants = plants.map((p) => ({ ...p, type: p.tree ?? p.bush, kind: p.tree ? 'tree' : 'bush' }));
  const solids = [...buildings.flatMap(buildingSolids),
    ...plants.map((p) => {
      const w = p.kind === 'tree' ? 4 : Math.round((BUSHES[p.type]?.w ?? 8) * k * 0.8);
      return { x: Math.round(p.x - w / 2), y: p.y - 3, w, h: 5 };
    }),
    ...areas.filter((a) => a.solid).map((a) => ({ x: a.x, y: a.y, w: a.w, h: a.h }))];
  // the forest: behind the skyline, at the sides (gaps for the streets) and below the last street
  const lastBottom = streets[streets.length - 1] + STREET;
  const forest = [
    ...forestIn(rng, k, 0, -Math.round(6 * k), W, streets[0] - Math.round(4 * k)),
    ...forestIn(rng, k, 0, streets[0], pad - Math.round(4 * k), lastBottom - streets[0], (x, y) => streets.some((sy) => y > sy - 4 * k && y < sy + STREET + 20 * k)),   // crowns stay off the road
    ...forestIn(rng, k, W - pad + Math.round(4 * k), streets[0], pad, lastBottom - streets[0], (x, y) => streets.some((sy) => y > sy - 4 * k && y < sy + STREET + 20 * k)),   // crowns stay off the road
    ...forestIn(rng, k, 0, lastBottom + Math.round(16 * k), W, H - lastBottom),
  ].map((p) => ({ ...p, type: p.tree, kind: 'tree' }));
  plants = [...plants, ...forest];

  /** Is (x, y) somewhere a person cannot stand? (A person is 5 px wide.) */
  function blocked(x, y) {
    if (x < 4 || x > W - 4 || y < top || y > bottom) return true;
    if ((x < pad + 3 || x > W - pad - 3) && !onStreet(y)) return true;   // the forest at the sides (the streets run out through it)
    for (const s of solids) if (x > s.x - 3 && x < s.x + s.w + 2 && y >= s.y && y < s.y + s.h) return true;
    return false;
  }

  // the path-finding grid: a cell is free if its centre is
  const gw = Math.ceil(W / CELL), gh = Math.ceil(H / CELL);
  const free = new Uint8Array(gw * gh);
  for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) free[cy * gw + cx] = blocked(cx * CELL + 2, cy * CELL + 2) ? 0 : 1;
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

  return { W, H, pad, scale: k, buildings, plants, areas, solids, blocked, findPath, randomSpot, placeAt, doorOf, ground: drawGround(layout) };
}

/** The town's ground (grass, grounds, streets, cross streets, crossings) on a canvas of its own. */
// the areas' grounds are the terrains of tinyNature
const TERRAIN_OF = { gravel: 'gravel', sand: 'sand', paving: 'cobble', water: 'water', grass: 'grass' };
function drawGround(layout) {
  const { W, H, streets, crossStreets, areas = [], k } = layout;
  const { SIDE, ROAD, STREET, VSIDE, VSTREET } = streetDims(k), m = (v) => Math.round(v * k);
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
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
    drawTerrain(g, { type: TERRAIN_OF[a.ground] ?? a.ground, x: a.x, y: a.y, w: a.w, h: a.h, scale: k, seed: a.x + a.y });
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
  return c;
}

/**
 * Draw the part of `town` in `view` ({ x, y, w, h }) into `g`: the ground,
 * then the buildings and `sprites` (people; cats `cat: true`; dogs `dog: true`;
 * monsters `monster: type`)
 * further back first, so whoever stands lower on the screen is in front.
 * dpx: device pixels per canvas pixel, when the canvas is drawn bigger
 * underneath (g scaled by dpx) so the signs' names can be written.
 */
export function drawTownView(g, town, view, sprites, t = 0, { dpx = 1 } = {}) {
  g.imageSmoothingEnabled = false;
  g.drawImage(town.ground, view.x, view.y, view.w, view.h, 0, 0, view.w, view.h);
  g.save(); g.translate(-view.x, -view.y);
  const items = [];
  for (const b of town.buildings) {
    const { w, h } = buildingSize(b);
    if (b.x + w / 2 > view.x && b.x - w / 2 < view.x + view.w && b.y > view.y && b.y - h < view.y + view.h) items.push({ y: b.y, b });
  }
  // water ripples, drawn again each frame
  for (const a of town.areas) if (a.ground === 'water' && a.x < view.x + view.w && a.x + a.w > view.x && a.y < view.y + view.h && a.y + a.h > view.y) drawTerrain(g, { type: 'water', x: a.x, y: a.y, w: a.w, h: a.h, scale: town.scale, seed: a.x + a.y, t });
  for (const p of town.plants) if (p.x > view.x - 30 && p.x < view.x + view.w + 30 && p.y > view.y && p.y < view.y + view.h + 60) items.push({ y: p.y, p });
  for (const s of sprites) if (s.x > view.x - 8 && s.x < view.x + view.w + 8 && s.y > view.y - 2 && s.y < view.y + view.h + 24) items.push({ y: s.y, s });
  items.sort((a, b) => a.y - b.y || (a.b ? -1 : 1));
  for (const it of items) {
    if (it.b) drawBuilding(g, dpx === 1 ? it.b : { ...it.b, dpx });
    else if (it.p) (it.p.kind === 'tree' ? drawTree : drawBush)(g, it.p);
    else if (it.s.monster) drawMonster(g, { ...it.s, type: it.s.monster }, t);   // monsters: { monster: 'zombie', variant, ... }
    else (it.s.dog ? drawDog : it.s.cat ? drawCat : drawCharacter)(g, it.s, t);
  }
  g.restore();
}
