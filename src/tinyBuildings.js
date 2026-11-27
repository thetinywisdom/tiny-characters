// Tiny Buildings: tiny-catalogue's buildings (and a mosque), drawn as pixel facades in
// the same style as the tiny people, at full size: one building pixel is one person
// pixel (the drawings are in tinyBuildingsFull.js and src/full/*.js). Each faces you
// (a front wall, its roof seen from above) with the details that make it that building.
//
//   drawBuilding(g, b)    one building, ground line at b.y, centred on b.x
//   BUILDINGS             type -> { label, w, h, widths, scale } (the largest size any seed makes, at scale 1.5)
//   buildingSize(b)       one building's size for its seed (at b.scale)
//   buildingSolids(b)     the ground it takes (you walk between a torii's posts, under a canopy)
//   SHOP_TYPES            the shop's kinds (konbini, ramen, cafe ...)
//   PARTS, drawPart(g, p) the doors and windows on their own
//   closes(b), cooks(b)   whether its shop shuts at night / something steams there
//   setRedraw(mode)       'approved' (default): only drawings the owner approved are used;
//                         'all' (?redraw=all): also those still in review; usesFull(def) asks
//   makePainter, SIGN_FONT  the painter (shared with street things and plants), the signs' font
//
// A building: { type, x, y, seed, shopType, wall, roof, scale }. The drawings are made for
// the town's scale, 1.5 (b.scale 1.5 draws them pixel for pixel; other scales stretch them).
// The seed picks the width, floors, windows, door, roof, colours and details.

import { seeded } from './tinyCharacters.js';
import { FULL, DOORS, WINDOWS, LIT, CURTAIN, GLASS, GLASS2, LANTERN, WIN } from './tinyBuildingsFull.js';

// the shop kind each building drew (its own, or the one its seed picked), for shutters and steam
let lastShop = null;
const SHOP_OF = new Map();
// Which drawings are used: 'approved' (the owner's approved ones) or 'all' (also those in review; ?redraw=all).
let REDRAW = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('redraw') === 'all') ? 'all' : 'approved';
/** Whether a drawing { approved } is used now (the redraw setting); shared by street things, plants and the ground. */
export const usesFull = (f) => !!f && (REDRAW === 'all' || f.approved);
/** A building's drawing, if it is used. */
const fullOf = (b) => { const f = FULL[b.type]; return usesFull(f) ? f : null; };
/** The drawings are made for the town's scale: widths below are at scale 1, times FULL_K. */
const FULL_K = 1.5;

/** Wall and roof colours, as in tiny-catalogue (city/buildings.js, variety.js). */
export const WALL_COLORS = ['#f2efe8', '#e4e0d6', '#cfccc4', '#b3b0a8', '#918f8a', '#9e6c60', '#b89e80'];
export const ROOF_COLORS = ['#4a5560', '#6a4a3a', '#3c4a5a', '#7a3a32', '#3a3f44', '#5a6a5a'];
export const SHOP_TYPES = ['konbini', 'ramen', 'cafe', 'bookshop', 'bakery', 'izakaya'];

// Every building: [label, widths (at scale 1; the seed picks one; drawn at round(w * 1.5))].
// The order matters: it mixes into each building's random stream (keep it; add new ones at the end).
const TYPES = {
  house: ['House', [36, 44, 52]],
  apartment: ['Apartment block', [30, 34, 42]],
  mixedUse: ['Shop with flats above', [34, 38, 44]],
  shop: ['Shop', [32, 40, 48]],
  office: ['Office building', [28, 32, 40]],
  shrine: ['Shrine', [72]],
  torii: ['Torii', [26]],
  shrineHall: ['Shrine hall', [36, 40, 48]],
  school: ['School', [100, 110]],
  laundromat: ['Coin laundromat', [32, 36, 42]],
  kissaten: ['Café (kissaten)', [30, 34, 40]],
  pharmacy: ['Pharmacy', [40, 44, 50]],
  sushi: ['Sushi restaurant', [32, 36, 42]],
  florist: ['Flower shop', [28, 32, 36]],
  fishmonger: ['Fishmonger', [36, 40, 46]],
  udonSoba: ['Udon / soba shop', [32, 36, 42]],
  familyRestaurant: ['Family restaurant', [64, 72]],
  takoyaki: ['Takoyaki stand', [18, 20, 24]],
  koban: ['Police station (koban)', [42]],
  postOffice: ['Post office', [54, 62]],
  bank: ['Bank', [40, 46, 52]],
  clinic: ['Clinic', [36, 40, 46]],
  fireStation: ['Fire station', [50, 56, 66]],
  karaoke: ['Karaoke', [30, 34, 40]],
  woodApartment: ['Wooden apartment', [40, 48, 56]],
  parkingGarage: ['Parking garage', [48, 56, 64]],
  gasStation: ['Gas station', [68]],
  tudorCottage: ['Tudor cottage', [32, 36, 44]],
  mediterraneanVilla: ['Mediterranean villa', [38, 44, 52]],
  dutchCanalHouse: ['Dutch canal house', [20, 24, 28]],
  frenchCountryHouse: ['French country house', [38, 42, 50]],
  scandinavianHouse: ['Scandinavian house', [34, 40, 46]],
  mosque: ['Mosque', [56]],
  stoneChapel: ['Stone chapel', [30, 34, 40]],
  station: ['Small station', [52, 60]],
  stationModern: ['Station: modern glass', [104]],
  stationBrick: ['Station: classic brick', [112]],
  stationWooden: ['Station: Japanese wooden', [104]],
  kiosk: ['Kiosk', [24]],
  toilets: ['Public toilets', [44]],
  alleyStall: ['Alley stall (yakitori)', [24, 28]],
};

// The rng a building's seed gives, its wall and roof colours and width, in that order.
function choices(b) {
  const [, widths] = TYPES[b.type];
  // mix the seed first: neighbouring seeds would otherwise make similar choices
  const rng = seeded(Math.floor(seeded((b.seed ?? 1) * 97 + Object.keys(TYPES).indexOf(b.type))() * 4294967296));
  const wall = b.wall ?? WALL_COLORS[Math.floor(rng() * WALL_COLORS.length)];
  const roof = b.roof ?? ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)];
  const w = Math.round(widths[Math.floor(rng() * widths.length)] * FULL_K);
  return { rng, wall, roof, w };
}
const SIZES = new Map();
/** A building's size at its own scale (1.5) for its seed and shop type: { w, h }, h measured from its drawing. */
function ownSize(b) {
  const f = fullOf(b);
  if (!f) return { w: 0, h: 0 };
  const key = `${b.type}|${b.seed ?? 1}|${b.shopType ?? ''}|${b.wall ?? ''}|${b.roof ?? ''}`;
  if (SIZES.has(key)) return SIZES.get(key);
  const { rng, wall, roof, w } = choices(b);
  let h = 0;
  f.draw((c, dx, up, rw, rh) => { if (rw > 0 && rh > 0) h = Math.max(h, up + rh); }, rng, b, wall, roof, w);
  const size = { w, h };
  SIZES.set(key, size);
  return size;
}
/** Which drawings are used: 'approved' (the default) or 'all' (also those in review). */
export function setRedraw(mode = 'approved') { REDRAW = mode; SIZES.clear(); }

/**
 * Every building: type -> { label, w, h, widths, scale }: w and h are the largest any seed
 * makes it (roof and all) at its own scale (1.5, given as `scale`), so a card sized from them
 * fits every seed; widths are the widths a seed picks from.
 */
export const BUILDINGS = Object.fromEntries(Object.entries(TYPES).map(([type, [label, widths]]) => {
  let w = 0, h = 0;
  for (let seed = 1; seed <= 40; seed++) { const s = ownSize({ type, seed }); w = Math.max(w, s.w); h = Math.max(h, s.h); }
  return [type, { label, w, h, widths: widths.map((x) => Math.round(x * FULL_K)), scale: FULL_K }];
}));

/**
 * Draw one building into a 2D context `g`, centred on b.x with its ground
 * line (the bottom of the front wall) at b.y, at b.scale (1.5 is pixel for pixel).
 * Draw people standing in front of it after it, and people behind it (smaller y) before it.
 */
export function drawBuilding(g, b) {
  const f = fullOf(b);
  if (!f) return;
  const { rng, wall, roof, w } = choices(b), k = (b.scale ?? 1) / FULL_K;
  const L = Math.round(b.x - Math.round(w * k) / 2), y = Math.round(b.y);
  const r = painter(g, L, y, k, b.dpx ?? 1);
  lastShop = f.draw(b.lights ? nightLights(r, b.seed ?? 1, b.time ?? 0) : r, rng, b, wall, roof, w) ?? null;
  SHOP_OF.set(`${b.type}|${b.seed ?? 1}|${b.shopType ?? ''}`, lastShop);
  if (b.shut && SHUTTERED(b.type, lastShop)) {                                            // closed: a roller shutter down over the shop front
    g.save(); if (b.lights) g.globalCompositeOperation = 'destination-out';   // (at night: nothing shines through it)
    r('#8a9096', 2, 0, w - 4, 18); for (let up = 1; up < 17; up += 3) r('#a8aeb4', 2, up, w - 4, 1); r('#6a7076', 2, 17, w - 4, 1); r('#5a5f66', Math.round(w / 2) - 3, 2, 6, 1);
    g.restore();
  }
}

// --- at night ----------------------------------------------------------------------
// drawBuilding with b.lights draws only what shines (over the darkened town):
// lit rooms, shop glass, neon, lanterns, signs; about half the dark windows
// light up too (which ones is fixed by the seed and the window's place).
const NIGHT = new Map([[LIT, LIT], [CURTAIN, '#f2dcae'], [GLASS, '#e4cf98'], [GLASS2, '#c8b07c'], ['#dfe8ec', '#e8e0c4'],
  ['#e8603a', '#ff7a4a'], ['#f2a040', '#ffb860'], ['#e870a0', '#ff88b8'], ['#6ac8f2', '#88dcff'], [LANTERN, '#ff6a40'],
  ['#7a6aa8', '#a890e0'], ['#a85a8a', '#e080b8'], ['#5a7aa8', '#80a8e0']]);
/** The buildings whose shops close for the night (b.shut): not the konbini, the ramen shop, the izakaya. */
const SHUTTERED = (type, shop) => ['pharmacy', 'florist', 'fishmonger', 'kissaten', 'bank', 'postOffice', 'clinic'].includes(type)
  || (shop != null && !['konbini', 'ramen', 'izakaya'].includes(shop));
const FOOD = ['alleyStall', 'takoyaki', 'udonSoba', 'kiosk'];
/** Whether a building's shop pulls a shutter down at night (b.shut); known once it has been drawn. */
export const closes = (b) => SHUTTERED(b.type, SHOP_OF.get(`${b.type}|${b.seed ?? 1}|${b.shopType ?? ''}`));
/** Whether a building cooks something you can see steaming (a ramen shop, a yakitori stall...); known once it has been drawn. */
export const cooks = (b) => FOOD.includes(b.type) || SHOP_OF.get(`${b.type}|${b.seed ?? 1}|${b.shopType ?? ''}`) === 'ramen';
function nightLights(r0, seed, time = 0) {
  const r = (c, dx, up, w, h) => {
    let lc = NIGHT.get(c);
    if (!lc && c === WIN) {
      // each window has its own rhythm: now and then it goes dark, or lights up
      const hsh = Math.imul(Math.round(dx) * 73856093 ^ Math.round(up) * 19349663 ^ seed * 83492791, 2654435761) >>> 0;
      const phase = Math.floor((time + (hsh % 37)) / (25 + (hsh % 20)));
      if ((((hsh + phase * 7919) >>> 0) % 100) < 45) lc = LIT;
    }
    if (lc) r0(lc, dx, up, w, h);
  };
  r.force = r0; r.k = r0.k; r.text = r0.text; r.px = () => {};
  return r;
}

/** The signs' typeface (Google Fonts; the page loads it). */
export const SIGN_FONT = '"DotGothic16", monospace';
/** The painter the buildings draw with (shared with tinyNature). */
export function makePainter(g, L, y, k = 1, dpx = 1) { return painter(g, L, y, k, dpx); }
function painter(g, L, y, k = 1, dpx = 1) {
  // every rectangle keeps the same size wherever it is (a 1 px line is always
  // 2 px at 1.5, a 2 px stripe always 3), so stripes and rows stay even
  const r = k === 1
    ? (c, dx, up, rw, rh) => { g.fillStyle = c; g.fillRect(L + dx, y - up - rh, rw, rh); }
    : (c, dx, up, rw, rh) => {
      if (rw <= 0 || rh <= 0) return;
      const w = Math.max(1, Math.round(rw * k)), h = Math.max(1, Math.round(rh * k));
      g.fillStyle = c; g.fillRect(L + Math.round(dx * k), y - Math.round(up * k) - h, w, h);
    };
  r.k = k;
  // whole canvas pixels, for icons: (dx, up) already scaled
  r.px = (c, dx, up, w, h) => { g.fillStyle = c; g.fillRect(L + dx, y - up - h, w, h); };
  // text in the box (dx, up, w, h), in DotGothic16, if it fits: the canvas has
  // dpx device pixels per canvas pixel, and the font is crisp at 8, 12, 16 ...
  r.text = (str, c, dx, up, w, h, vertical = false) => {
    const W = Math.round(w * k), H = Math.round(h * k), X = L + Math.round(dx * k), Y = y - Math.round(up * k) - H;
    const boxW = W * dpx - 2, boxH = H * dpx - 2;
    for (const size of [32, 24, 16, 12, 10]) {
      g.font = `${size / dpx}px ${SIGN_FONT}`;
      const fits = vertical ? size * str.length <= boxH && size <= boxW + 2 : g.measureText(str).width * dpx <= boxW && size <= boxH + 2;
      if (!fits) continue;
      g.fillStyle = c; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (vertical) [...str].forEach((ch, i) => g.fillText(ch, X + W / 2, Y + H / 2 + (i - (str.length - 1) / 2) * (size / dpx)));
      else g.fillText(str, X + W / 2, Y + H / 2 + 0.5 / dpx);
      return true;
    }
    return false;
  };
  return r;
}

/**
 * Every door and window on its own (the kit the buildings are made from, in
 * tinyBuildingsFull.js): id -> [label, w, h, draw(r, rng)], at full size: doors 18
 * tall, windows 9 (tall ones 12); a window's sill sticks out a pixel each side.
 */
const PART_DEFS = {
  'door.wood': ['Wooden door', 9, 18, (r) => DOORS.wood(r, 0)],
  'door.plank': ['Plank door', 9, 18, (r) => DOORS.plank(r, 0)],
  'door.glazed': ['Café door', 9, 18, (r) => DOORS.glazed(r, 0)],
  'door.glass': ['Glass door', 9, 18, (r) => DOORS.glass(r, 0)],
  'door.steel': ['Flat door (steel)', 9, 18, (r) => DOORS.steel(r, 0)],
  'door.arched': ['Arched door', 9, 18, (r) => DOORS.arched(r, 0)],
  'door.auto': ['Automatic doors', 16, 18, (r) => DOORS.auto(r, 0)],
  'door.sliding': ['Sliding lattice doors', 16, 18, (r) => DOORS.sliding(r, 0)],
  'door.shoji': ['Shoji doors', 16, 18, (r) => DOORS.shoji(r, 0)],
  'door.garage': ['Roller shutter', 27, 21, (r) => DOORS.garage(r, 0)],
  'window.sash': ['Window', 9, 9, (r, rng) => WINDOWS.sash(r, rng, 1, 0)],
  'window.pair': ['Pair of windows', 15, 9, (r, rng) => WINDOWS.sash(r, rng, 1, 0, 13)],
  'window.alu': ['Aluminium window', 7, 9, (r, rng) => WINDOWS.alu(r, rng, 0, 0)],
  'window.aluPair': ['Sliding aluminium window', 13, 9, (r, rng) => WINDOWS.alu(r, rng, 0, 0, 13)],
  'window.tall': ['Tall window', 9, 12, (r, rng) => WINDOWS.tall(r, rng, 1, 0)],
  'window.shuttered': ['Shuttered window', 11, 12, (r, rng) => WINDOWS.shuttered(r, rng, 2, 0, '#3c4a5a')],
  'window.arched': ['Arched window', 7, 12, (r, rng) => WINDOWS.arched(r, rng, 0, 0)],
  'window.pointed': ['Pointed window', 7, 12, (r) => WINDOWS.pointed(r, 0, 0, '#3f8f6a')],
  'window.stained': ['Stained glass', 7, 12, (r) => WINDOWS.stained(r, 0, 0)],
  'window.round': ['Round window', 6, 6, (r) => WINDOWS.round(r, 0, 0)],
  'window.lattice': ['Lattice window', 17, 11, (r) => WINDOWS.lattice(r, 1, 1, 15)],
  'window.shoji': ['Shoji window', 7, 9, (r) => WINDOWS.shoji(r, 0, 0)],
  'window.leaded': ['Leaded window', 7, 9, (r, rng) => WINDOWS.leaded(r, rng, 0, 0)],
  'window.neon': ['Neon-lit window', 7, 9, (r, rng) => WINDOWS.neon(r, rng, 0, 0)],
  'window.shop': ['Shop glass', 27, 18, (r) => WINDOWS.shop(r, 0, 0, 27)],
};
/** The doors and windows: id -> { label, w, h } (at full size). */
export const PARTS = Object.fromEntries(Object.entries(PART_DEFS).map(([id, [label, w, h]]) => [id, { label, w, h }]));
/** Draw one door or window { part, x, y, seed, scale }: centred on x, its bottom at y (scale 1.5, the default, is pixel for pixel). */
export function drawPart(g, p) {
  const def = PART_DEFS[p.part];
  if (!def) return;
  const k = (p.scale ?? FULL_K) / FULL_K;
  def[3](painter(g, Math.round(p.x - Math.round(def[1] * k) / 2), Math.round(p.y), k), seeded((p.seed ?? 1) * 131 + 7));
}

/** A building's size in pixels for its seed, at its scale (b.scale, 1 by default): { w, h }. */
export function buildingSize(b) {
  const { w, h } = ownSize(b), k = (b.scale ?? 1) / FULL_K;
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/**
 * The ground a building takes, as rectangles { x, y, w, h } in the canvas:
 * its whole picture (nobody walks behind a building), or for a torii and a
 * gas station only the posts, pumps and kiosk (`open` in its drawing: you walk through and under).
 */
export function buildingSolids(b) {
  const { w, h } = buildingSize(b), f = fullOf(b), k = (b.scale ?? 1) / FULL_K;
  const L = Math.round(b.x - w / 2), y = Math.round(b.y), open = f?.open;
  if (open) return open.map(([dx, sw, top, bottom]) => {
    const x0 = Math.round(dx * k), x1 = Math.max(x0 + 1, Math.round((dx + sw) * k));
    return { x: L + x0, y: y - Math.round(top * k), w: x1 - x0, h: Math.round(top * k) - Math.round(bottom * k) + 1 };
  });
  return [{ x: L, y: y - h, w, h: h + 1 }];
}
