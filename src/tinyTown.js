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

import { BUILDINGS, buildingSolids, drawBuilding } from './tinyBuildings.js';
import { drawCat, drawCharacter } from './tinyCharacters.js';

const SIDE = 7, ROAD = 18, STREET = SIDE * 2 + ROAD;     // a street, top to bottom: 32 px
const VSIDE = 6, VSTREET = VSIDE * 2 + ROAD;             // a cross street, left to right: 30 px
const CELL = 4;                                          // path-finding grid

/**
 * The demo's town: four streets, two cross streets, tall buildings along the
 * back, two rows of low blocks, and the shrine, the school and the old town.
 * `streets`: the top of each street; `crossStreets`: the left edge of each
 * cross street (they run from the first street to the last); `rows`: a
 * ground line and buildings packed left to right from x (2 px apart);
 * `areas`: open grounds with their own ground and name.
 */
export const DEFAULT_TOWN = {
  W: 560, H: 462,
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
  ],
};

const GROUNDS = { grass: '#9fb08d', gravel: '#d8cfb8', sand: '#e0cc9e', paving: '#d8cfc0' };

/** Build a town from a layout: its buildings, ground picture, walkable ground and paths. */
export function makeTown(layout = DEFAULT_TOWN) {
  const { W, H, streets, crossStreets } = layout;
  const buildings = [...(layout.buildings ?? [])].map((b, i) => ({ seed: i + 1, ...b }));
  for (const row of layout.rows ?? []) {
    let x = row.x;
    for (const item of row.list) {
      const [type, shopType] = item.split(':');
      const { w } = BUILDINGS[type];
      buildings.push({ type, shopType, x: x + w / 2, y: row.y, seed: buildings.length + 1 });
      x += w + 2;
    }
  }
  const areas = layout.areas ?? [];
  // a building must not reach into the street above it, nor past the next cross street
  for (const b of buildings) {
    const { w, h } = BUILDINGS[b.type], L = b.x - w / 2, top = b.y - h;
    const above = streets.filter((sy) => sy < b.y).pop();
    if (above !== undefined && above !== b.y && top < above + STREET) console.warn(`tinyTown: ${b.type} at (${b.x}, ${b.y}) reaches into the street above`);
    if (b.y > streets[0] && crossStreets.some((sx) => L < sx + VSTREET && L + w > sx)) console.warn(`tinyTown: ${b.type} at (${b.x}, ${b.y}) stands on a cross street`);
  }
  const top = streets[0] + 2, bottom = H - 3;            // above the first street is the backdrop
  const solids = buildings.flatMap(buildingSolids);

  /** Is (x, y) somewhere a person cannot stand? (A person is 5 px wide.) */
  function blocked(x, y) {
    if (x < 4 || x > W - 4 || y < top || y > bottom) return true;
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
    const b = buildings.find((b) => Math.abs(x - b.x) <= BUILDINGS[b.type].w / 2 && y > b.y && y < b.y + 12);
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

  return { W, H, buildings, areas, solids, blocked, findPath, randomSpot, placeAt, doorOf, ground: drawGround(layout) };
}

/** The town's ground (grass, grounds, streets, cross streets, crossings) on a canvas of its own. */
function drawGround({ W, H, streets, crossStreets, areas = [] }) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const g = c.getContext('2d');
  const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  R(GROUNDS.grass, 0, 0, W, H);
  for (let i = 0; i < 400; i++) R('#93a582', (i * 97) % W, (i * 61) % H, 2, 1);        // grass tufts
  for (const a of areas) {
    R(GROUNDS[a.ground] ?? GROUNDS.grass, a.x, a.y, a.w, a.h);
    if (a.ground === 'gravel') for (let i = 0; i < a.w * a.h / 40; i++) R('#c9c0a8', a.x + (i * 37) % a.w, a.y + (i * 23) % a.h, 1, 1);
    if (a.ground === 'paving') { for (let y = a.y + 3; y < a.y + a.h; y += 6) R('#c8bfae', a.x, y, a.w, 1); for (let x = a.x + 5; x < a.x + a.w; x += 10) R('#c8bfae', x, a.y, 1, a.h); }
    if (a.ground === 'sand') for (let i = 0; i < a.w * a.h / 60; i++) R('#d4bf90', a.x + (i * 53) % a.w, a.y + (i * 29) % a.h, 1, 1);
    if (a.path) for (let y = a.path.y0; y < a.y + a.h; y += 5) R('#c9c2b0', a.path.x, y, a.path.w, 4);  // stepping stones
  }
  const y0 = streets[0], y1 = streets[streets.length - 1] + STREET;
  // cross streets' sidewalks, then the streets across them, then the cross streets' roads
  for (const x of crossStreets) R('#d8d2c4', x, y0, VSTREET, y1 - y0);
  for (const y of streets) {
    R('#d8d2c4', 0, y, W, SIDE); R('#d8d2c4', 0, y + SIDE + ROAD, W, SIDE);
    for (let x = 0; x < W; x += 8) { R('#c4bdae', x, y, 1, SIDE); R('#c4bdae', x, y + SIDE + ROAD, 1, SIDE); }
    R('#9a9890', 0, y + SIDE - 1, W, 1); R('#9a9890', 0, y + SIDE + ROAD, W, 1);
    R('#6f7378', 0, y + SIDE, W, ROAD);
    for (let x = 0; x < W; x += 16) R('#e8e4d8', x, y + SIDE + ROAD / 2, 8, 1);
  }
  for (const x of crossStreets) {
    R('#6f7378', x + VSIDE, y0 + SIDE, ROAD, y1 - y0 - SIDE * 2);
    for (let k = 0; k < streets.length - 1; k++) {                                     // kerbs between the streets
      const a = streets[k] + STREET, b = streets[k + 1];
      R('#9a9890', x + VSIDE - 1, a, 1, b - a); R('#9a9890', x + VSIDE + ROAD, a, 1, b - a);
    }
    for (let y = y0 + SIDE + 4; y < y1 - SIDE; y += 14) if (!streets.some((sy) => y + 7 > sy && y < sy + STREET)) R('#e8e4d8', x + VSIDE + ROAD / 2, y, 1, 7);
    // crossings: over each street next to the cross street, and over the cross street next to each street
    for (const y of streets) {
      for (let k = 0; k < ROAD; k += 3) R('#e8e4d8', x - 9, y + SIDE + k, 7, 2);
      for (let k = 0; k < ROAD; k += 3) {
        if (y !== streets[0]) R('#e8e4d8', x + VSIDE + k, y - 6, 2, 5);
        if (y !== streets[streets.length - 1]) R('#e8e4d8', x + VSIDE + k, y + STREET + 1, 2, 5);
      }
    }
  }
  return c;
}

/**
 * Draw the part of `town` in `view` ({ x, y, w, h }) into `g`: the ground,
 * then the buildings and `sprites` (people, and cats with `cat: true`)
 * further back first, so whoever stands lower on the screen is in front.
 */
export function drawTownView(g, town, view, sprites, t = 0) {
  g.imageSmoothingEnabled = false;
  g.drawImage(town.ground, view.x, view.y, view.w, view.h, 0, 0, view.w, view.h);
  g.save(); g.translate(-view.x, -view.y);
  const items = [];
  for (const b of town.buildings) {
    const { w, h } = BUILDINGS[b.type];
    if (b.x + w / 2 > view.x && b.x - w / 2 < view.x + view.w && b.y > view.y && b.y - h < view.y + view.h) items.push({ y: b.y, b });
  }
  for (const s of sprites) if (s.x > view.x - 8 && s.x < view.x + view.w + 8 && s.y > view.y - 2 && s.y < view.y + view.h + 24) items.push({ y: s.y, s });
  items.sort((a, b) => a.y - b.y || (a.b ? -1 : 1));
  for (const it of items) it.b ? drawBuilding(g, it.b) : (it.s.cat ? drawCat : drawCharacter)(g, it.s, t);
  g.restore();
}
