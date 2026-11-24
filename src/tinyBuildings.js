// Tiny Buildings: tiny-catalogue's buildings, drawn as small pixel facades
// in the same style as the tiny people. Each one faces you (front wall, a
// little roof on top), built from a handful of rectangles plus one or two
// details that make it that building (a torii, a noren, a striped awning).
//
//   drawBuilding(g, b)    one building, ground line at b.y, centred on b.x
//   BUILDINGS             type -> { label, w, h, widths } (the largest size any seed makes)
//   buildingSize(b)       one building's size for its seed
//   SHOP_TYPES            the shop's kinds (konbini, ramen, cafe ...)
//   drawStreet(g, W, H)   a street to stand them along
//
// A building: { type, x, y, seed, shopType, wall, roof }. Colours are CSS
// strings; the seed picks the width, floors, windows (kind, number), door
// (kind, side, colour), roof (flat, pitched, hipped; colour; what is on it),
// awnings, signs' sides and colours, and which windows are lit.
// Sizes: a person is 15 px; a storey is 13-20 px, a door 6 x 13. Tall
// buildings are squashed (an office has 6 floors, not 13). Roofs are seen
// from above (8-18 rows), which gives each building its depth on a map.

import { seeded } from './tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', RED = '#d8443c', NAVY = '#2c3652', GOLD = '#f2b64a';
const WIN = '#5f7487', LIT = '#f0dca0', CURTAIN = '#e4d6bc', GLASS = '#9fb6cc', GLASS2 = '#7f9ab4';
const WOOD = '#6b4a2a', DARKWOOD = '#4a3424', LIGHTWOOD = '#c9a46a', TOP = '#d9d2c0', CONCRETE = '#b3b0a8';

/** Wall and roof colours, as in tiny-catalogue (city/buildings.js, variety.js). */
export const WALL_COLORS = ['#f2efe8', '#e4e0d6', '#cfccc4', '#b3b0a8', '#918f8a', '#9e6c60', '#b89e80'];
export const ROOF_COLORS = ['#4a5560', '#6a4a3a', '#3c4a5a', '#7a3a32', '#3a3f44', '#5a6a5a'];

/** A colour darker (f < 1) or lighter (f > 1). */
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');

// --- the pieces ----------------------------------------------------------------
// r(colour, dx, up, w, h): a rectangle dx from the building's left edge whose
// bottom is `up` pixels above the ground.

// Roofs are seen from above, as in a top-down town map: d rows of roof over
// the front wall give a building its depth.

/** A flat roof: d rows of roof top inside a rim, with seams. */
function flatRoof(r, wall, dx, up, w, d = 12) {
  r(shade(wall, 0.86), dx, up, w, d);                                     // the rim (parapet)
  r(TOP, dx + 1, up + 1, w - 2, d - 2);
  for (let y = up + 4; y < up + d - 1; y += 4) r(shade(TOP, 0.94), dx + 1, y, w - 2, 1);
  r(shade(wall, 0.7), dx, up, w, 1);                                      // its front edge
}
/**
 * A pitched roof, ridge along the street, filling its whole rectangle like
 * every roof: the front slope (a darker row of tiles every third row), the
 * ridge in light, a little of the back slope. hip: on a hipped roof the two
 * ends slope too; they show as darker triangles at the sides (how fast they
 * widen toward the ridge); 0 for straight gable ends.
 */
function pitched(r, c, dx, up, w, d, hip = 0) {
  const f = Math.round(d * 0.7), side = shade(c, 0.7);
  for (let k = 0; k < d; k++) {
    const col = k < f ? (k % 4 === 3 ? shade(c, 0.86) : c) : k === f ? shade(c, 1.3) : shade(c, 0.8);
    const end = Math.min(Math.floor(w / 2), Math.floor((k < f ? k : f - (k - f)) * hip / 3));
    if (end > 0) { r(side, dx, up + k, w, 1); r(col, dx + end, up + k, w - end * 2, 1); }   // the hipped ends either side
    else r(col, dx, up + k, w, 1);
  }
  r(shade(c, 0.6), dx, up, w, 1);                                         // eaves
}
/**
 * A gable facing the street: a triangle of wall (`face`, gh rows) edged with
 * roof, and the roof running back behind it, d rows: the left slope in shade,
 * the right in light, the ridge between.
 */
function gable(r, c, face, dx, up, w, gh, d) {
  const half = Math.floor(w / 2);
  r(shade(c, 0.75), dx, up, half, gh + d); r(c, dx + half, up, w - half, gh + d);
  for (let y = up + 3; y < up + gh + d; y += 4) { r(shade(c, 0.65), dx, y, half, 1); r(shade(c, 0.86), dx + half, y, w - half, 1); }
  r(shade(c, 1.3), dx + half - 1, up + gh - 1, 2, d + 1);                 // the ridge, running back
  for (let k = 0; k < gh; k++) {
    const inset = 1 + Math.round(k * (half - 1) / gh), rw = w - inset * 2;
    if (rw <= 0) break;
    r(shade(c, 0.55), dx + inset - 1, up + k, rw + 2, 1);                 // the roof's edge
    if (face && rw > 2) r(face, dx + inset, up + k, rw, 1);
  }
}
/** A striped awning, h rows, stripes 2 px wide. */
function awning(r, c1, c2, dx, up, w, h = 3) { for (let i = 0; i < w; i += 2) r(i % 4 ? c2 : c1, dx + i, up, Math.min(2, w - i), h); }
/** A sign: a band with a row of "letters" (the text is too small to read). */
function sign(r, bg, fg, dx, up, w, h = 4, text = '') {
  r(bg, dx, up, w, h);
  // the name in DotGothic16 when the canvas has the pixels for it (see drawBuilding's dpx);
  // otherwise a word-shaped row of letters, on even steps so it stays even when scaled
  if (text && r.text && r.text(text, fg, dx, up, w, h)) return;
  const n = Math.max(2, Math.floor((w * 0.55) / 4)), start = dx + Math.floor((w - (n * 4 - 2)) / 4) * 2;
  for (let i = 0; i < n; i++) r(fg, start + i * 4, up + 1, 2, h - 2);
}
/** The same painter moved ox pixels to the right (text and icons too). */
function shifted(r0, ox) {
  const r = (c, dx, up, w, h) => r0(c, dx + ox, up, w, h);
  r.k = r0.k;
  if (r0.px) r.px = (c, dx, up, w, h) => r0.px(c, dx + Math.round(ox * (r0.k ?? 1)), up, w, h);
  if (r0.text) r.text = (str, c, dx, up, w, h, v) => r0.text(str, c, dx + ox, up, w, h, v);
  return r;
}
/** A sign that reads top to bottom (a narrow upright sign): its name letter under letter. */
function upright(r, bg, fg, dx, up, w, h, text, dots) {
  r(bg, dx, up, w, h);
  if (text && r.text && r.text(text, fg, dx, up, w, h, true)) return;
  for (let i = up + 2; i < up + h - 2; i += 4) r(dots ? dots[(i / 4) & 3] : fg, dx + Math.floor((w - 2) / 2), i, 2, 2);
}
const lantern = (r, dx, up) => { r(RED, dx, up, 2, 3); r(INK, dx, up + 3, 2, 1); };
/** A noren: a short curtain over a doorway, cut into strips. */
function noren(r, c, dx, up, w) { r(c, dx, up, w, 4); for (let i = 3; i < w - 1; i += 4) r(shade(c, 0.6), dx + i, up, 1, 3); }
/** A row of coloured dots (books, flowers, goods). */
function dots(r, rng, dx, up, w, colors, step = 1) { for (let i = 0; i < w; i += step) r(colors[Math.floor(rng() * colors.length)], dx + i, up, 1, 1); }

/** A dome seen from the front and a little above: a half disc, lit on the left, with a finial. */
function dome(r, c, cx, up, rad) {
  for (let k = 0; k <= rad; k++) {
    const hw = Math.round(Math.sqrt(rad * rad - k * k));
    r(c, cx - hw, up + k, hw * 2 + 1, 1);
    if (hw > 1) { r(shade(c, 1.18), cx - hw + 1, up + k, Math.max(1, Math.round(hw * 0.6)), 1); r(shade(c, 0.8), cx + hw, up + k, 1, 1); }
  }
  r(shade(c, 0.7), cx - rad, up, rad * 2 + 1, 1);
}
/** A pointed arch (a window or a doorway): w wide, h tall, the top stepping in to a point. */
function pointedArch(r, c, dx, up, w, h) {
  const steps = Math.floor((w - 1) / 2);
  r(c, dx, up, w, h - steps);
  for (let k = 1; k <= steps; k++) r(c, dx + k, up + h - steps + k - 1, w - k * 2, 1);
}

/**
 * A small picture (a cross, a letter, a clock) as rows of characters, top
 * row first, each character a colour from `colours` ('.' is clear). It is
 * drawn on whole pixels (2 per character at scale 1.5) and centred where it
 * would be at scale 1, so it stays sharp and symmetric at any scale.
 */
function icon(r, dx, up, rows, colours) {
  const k = r.k ?? 1, cell = Math.max(1, Math.round(k)), h = rows.length, w = rows[0].length;
  const cx = Math.round((dx + w / 2) * k - (w * cell) / 2), cy = Math.round((up + h / 2) * k - (h * cell) / 2);
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (colours[ch] && r.px) r.px(colours[ch], cx + i * cell, cy + (h - 1 - j) * cell, cell, cell); else if (colours[ch]) r(colours[ch], dx + i, up + h - 1 - j, 1, 1); }));
}
const CROSS = ['ggggg', 'ggwgg', 'gwwwg', 'ggwgg', 'ggggg'];
/** Shelves of goods behind shop glass: a shelf line, then products in 2 px blocks. */
function shelves(r, rng, dx, up, w, rows, colours) {
  for (let j = 0; j < rows; j++) {
    const y = up + j * 3;
    r('#c8ccd0', dx, y, w, 1);
    for (let i = 0; i + 3 <= w; i += 4) r(colours[Math.floor(rng() * colours.length)], dx + i, y + 1, 3, 1);
  }
}

// --- one set of sizes for every building ----------------------------------------
// A ground floor is 16 px (a shop's 19: its awning and sign sit above the
// door), every upper floor 13. A door is 6 x 12 (double and sliding doors
// 10 x 12, a garage 18 x 14); a window 5 x 6 (a pair 9 x 6, a tall window
// 5 x 8) with its sill 4 px above its floor (3 for a tall one); shop glass
// is as tall as the door. Every building uses these, so they all match.
export const STOREY = { ground: 16, shop: 19, upper: 13, sill: 4 };
const GF = STOREY.ground, SHOP_GF = STOREY.shop, FL = STOREY.upper, SILL = STOREY.sill;
/** The bottom of floor n (0 is the ground floor) above a ground floor gf tall. */
const floorAt = (n, gf = GF) => (n === 0 ? 0 : gf + (n - 1) * FL);

const FRAME = '#4a4e54', METAL = '#b8bcc0', PAPER = '#f4efe0', HI = '#c8dceb';
/** What shows in a window: dark glass, a lit room, or curtains. */
const pane = (rng) => { const v = rng(); return v < 0.18 ? LIT : v < 0.34 ? CURTAIN : WIN; };

// --- doors (12 tall; their bottom at `up`) -----------------------------------------
const DOORS = {
  /** Panelled wood, a brass knob. 6 wide. */
  wood(r, dx, up = 0, c = WOOD) {
    r(shade(c, 0.62), dx, up, 6, 12); r(c, dx + 1, up, 4, 11);
    r(shade(c, 0.82), dx + 2, up + 1, 2, 4); r(shade(c, 0.82), dx + 2, up + 6, 2, 4); r(GOLD, dx + 4, up + 5, 1, 1);
  },
  /** Boards with iron straps (a cottage, a chapel). 6 wide. */
  plank(r, dx, up = 0, c = WOOD) {
    r(c, dx, up, 6, 12); for (let i = 1; i < 6; i += 2) r(shade(c, 0.78), dx + i, up, 1, 12);
    r(INK, dx, up + 3, 5, 1); r(INK, dx, up + 8, 5, 1); r(INK, dx + 4, up + 5, 1, 1);
  },
  /** Wood with glass in its top half (a café). 6 wide. */
  glazed(r, dx, up = 0, c = WOOD) {
    r(shade(c, 0.62), dx, up, 6, 12); r(c, dx + 1, up, 4, 11);
    r(GLASS, dx + 2, up + 6, 2, 4); r(HI, dx + 2, up + 9, 1, 1); r(shade(c, 0.82), dx + 2, up + 1, 2, 3); r(GOLD, dx + 4, up + 4, 1, 1);
  },
  /** Glass in an aluminium frame, a push bar. 6 wide. */
  glass(r, dx, up = 0) {
    r(FRAME, dx, up, 6, 12); r(GLASS, dx + 1, up + 1, 4, 10); r(HI, dx + 1, up + 8, 1, 2); r(HI, dx + 2, up + 9, 1, 1); r(METAL, dx + 1, up + 5, 4, 1);
  },
  /** A flat's steel door: painted, a peephole, a lever. 6 wide. */
  steel(r, dx, up = 0, c = '#6a7f94') {
    r(shade(c, 0.7), dx, up, 6, 12); r(c, dx + 1, up, 4, 11); r(shade(c, 1.12), dx + 1, up + 10, 4, 1);
    r(INK, dx + 2, up + 8, 1, 1); r(METAL, dx + 3, up + 5, 2, 1);
  },
  /** Planks under a round top (a villa, a chapel, a mosque). 6 wide. */
  arched(r, dx, up = 0, c = DARKWOOD) {
    r(c, dx, up, 6, 10); r(c, dx + 1, up + 10, 4, 1); r(c, dx + 2, up + 11, 2, 1);
    r(shade(c, 0.72), dx + 2, up, 1, 10); r(shade(c, 0.72), dx + 4, up, 1, 9); r(GOLD, dx + 3, up + 5, 1, 1);
  },
  /** Automatic sliding glass doors, two leaves. 10 wide. */
  auto(r, dx, up = 0) {
    r(FRAME, dx, up, 10, 12); r(GLASS, dx + 1, up + 1, 3, 10); r(GLASS, dx + 6, up + 1, 3, 10);
    r(HI, dx + 1, up + 8, 1, 2); r(HI, dx + 6, up + 8, 1, 2); r(METAL, dx + 1, up + 11, 8, 1);
  },
  /** Japanese wooden lattice doors (koshi-do) that slide, two leaves. 10 wide. */
  sliding(r, dx, up = 0, c = LIGHTWOOD) {
    r(DARKWOOD, dx, up, 10, 12); r(c, dx + 1, up, 8, 11);
    for (let i = dx + 2; i < dx + 9; i += 2) r(shade(c, 0.66), i, up, 1, 11);
    r(shade(c, 0.66), dx + 1, up + 4, 8, 1); r(DARKWOOD, dx + 5, up, 1, 11);
  },
  /** Shoji: paper on a wooden grid (a shrine). 10 wide. */
  shoji(r, dx, up = 0) {
    r(DARKWOOD, dx, up, 10, 12); r(PAPER, dx + 1, up, 8, 11);
    for (const i of [3, 5, 7]) r(LIGHTWOOD, dx + i, up, 1, 11);
    for (const j of [4, 8]) r(LIGHTWOOD, dx + 1, up + j, 8, 1);
    r(DARKWOOD, dx + 5, up, 1, 11);
  },
  /** A roller shutter (a fire station). w wide, 14 tall. */
  garage(r, dx, up = 0, w = 18, c = RED) {
    r(shade(c, 0.6), dx, up, w, 14); r(c, dx + 1, up, w - 2, 13);
    for (let y = up + 1; y < up + 13; y += 2) r(shade(c, 0.82), dx + 1, y, w - 2, 1);
    r(METAL, dx + Math.floor(w / 2) - 1, up + 1, 2, 1);
  },
};

// --- windows (their bottom, the sill, at `up`) -----------------------------------
const WINDOWS = {
  /** A framed window, 5 x 6; 9 wide it is a pair. */
  sash(r, rng, dx, up, w = 5, frame = WHITE) {
    r(frame, dx, up, w, 6); r(pane(rng), dx + 1, up + 1, w - 2, 4);
    if (w >= 9) r(frame, dx + Math.floor(w / 2), up + 1, 1, 4);
    r(shade(frame, 0.78), dx - 1, up, w + 2, 1);                       // the sill
  },
  /** An aluminium window (Japanese flats and shops), 5 x 6; 9 wide it slides in two. */
  alu(r, rng, dx, up, w = 5) {
    r(METAL, dx, up, w, 6); const c = pane(rng); r(c, dx + 1, up + 1, w - 2, 4);
    if (w >= 7) r(METAL, dx + Math.floor(w / 2), up + 1, 1, 4);
    if (c === WIN) r(HI, dx + 1, up + 4, 1, 1);
  },
  /** A tall window with a transom, 5 x 8. */
  tall(r, rng, dx, up, frame = WHITE) {
    r(frame, dx, up, 5, 8); r(pane(rng), dx + 1, up + 1, 3, 6); r(frame, dx + 1, up + 5, 3, 1);
  },
  /** A tall window between louvred shutters (7 wide in all). */
  shuttered(r, rng, dx, up, shutter, frame = WHITE) {
    WINDOWS.tall(r, rng, dx, up, frame);
    for (const sx of [dx - 1, dx + 5]) { r(shutter, sx, up, 1, 8); for (let y = up + 1; y < up + 8; y += 2) r(shade(shutter, 0.75), sx, y, 1, 1); }
  },
  /** A tall window with a round top, 5 x 8. */
  arched(r, rng, dx, up, frame = NAVY) {
    r(frame, dx, up, 5, 7); r(frame, dx + 1, up + 7, 3, 1); r(pane(rng), dx + 1, up + 1, 3, 6);
  },
  /** A tall pointed window, 5 x 8 (a mosque). */
  pointed(r, dx, up, frame) {
    pointedArch(r, frame, dx, up, 5, 8); pointedArch(r, NAVY, dx + 1, up + 1, 3, 6);
  },
  /** Stained glass under a round top, 5 x 8 (a chapel). */
  stained(r, dx, up) {
    r(INK, dx, up, 5, 7); r(INK, dx + 1, up + 7, 3, 1);
    [['#3f6fa8', '#c8402c', '#f2c230'], ['#2fa36b', '#3f6fa8', '#c8402c']].forEach((row, j) => row.forEach((c, i) => r(c, dx + 1 + i, up + 1 + j * 3, 1, 3)));
  },
  /** A round window, 4 x 4 (a rose window). */
  round(r, dx, up) { r(INK, dx + 1, up, 2, 4); r(INK, dx, up + 1, 4, 2); r(GLASS, dx + 1, up + 1, 2, 2); r('#c8402c', dx + 1, up + 1, 1, 1); },
  /** Wooden lattice over paper (a Japanese shop), any width. */
  lattice(r, dx, up, w, h = 6) {
    r(DARKWOOD, dx, up, w, h); r(LIGHTWOOD, dx + 1, up + 1, w - 2, h - 2);
    for (let i = dx + 2; i < dx + w - 1; i += 2) r(WOOD, i, up + 1, 1, h - 2);
  },
  /** Shoji: paper on a wooden grid, 5 x 6. */
  shoji(r, dx, up) { r(DARKWOOD, dx, up, 5, 6); r(PAPER, dx + 1, up + 1, 3, 4); r(LIGHTWOOD, dx + 2, up + 1, 1, 4); r(LIGHTWOOD, dx + 1, up + 3, 3, 1); },
  /** Small panes of old glass in lead (a Tudor cottage), 5 x 6. */
  leaded(r, rng, dx, up) {
    r('#3a2a22', dx, up, 5, 6); r(pane(rng) === LIT ? LIT : '#7f9488', dx + 1, up + 1, 3, 4);
    r('#3a2a22', dx + 2, up + 1, 1, 4); r('#3a2a22', dx + 1, up + 3, 3, 1);   // lead between the small panes
  },
  /** A glowing window (karaoke), 5 x 6. */
  neon(r, rng, dx, up) { const c = rng() < 0.5 ? '#e8603a' : '#f2a040'; r(INK, dx, up, 5, 6); r(c, dx + 1, up + 1, 3, 4); r(shade(c, 1.2), dx + 1, up + 4, 3, 1); },
  /** A shop's glass front, w wide and as tall as a door (12): a frame, a bar every 6 px. */
  shop(r, dx, up, w, h = 12, frame = FRAME, c = GLASS) {
    r(frame, dx, up, w, h); r(c, dx + 1, up + 1, w - 2, h - 2);
    const panes = Math.max(1, Math.round((w - 2) / 6));                // bars spread evenly, about 6 px apart
    for (let i = 1; i < panes; i++) r(frame, dx + Math.round(i * (w - 1) / panes), up + 1, 1, h - 2);
    r(shade(c, 1.12), dx + 1, up + h - 4, 1, 2); r(shade(c, 1.12), dx + 2, up + h - 3, 1, 1);
  },
};

// --- shop fronts (the catalogue's shop types) ------------------------------------
export const SHOP_TYPES = ['konbini', 'ramen', 'cafe', 'bookshop', 'bakery', 'izakaya'];
const SHOPS = {
  konbini: { name: 'KONBINI', bg: WHITE, fg: '#1f4fa8', stripes: ['#2fa36b', '#f08a2c', '#1f4fa8'], auto: true },
  ramen: { name: 'RAMEN', bg: '#d8302a', fg: WHITE, noren: NAVY, lantern: true },
  cafe: { name: 'CAFE', bg: '#5a3a28', fg: '#f4e6c8', awning: ['#2fa36b', WHITE] },
  bookshop: { name: 'BOOKS', bg: '#1f4fa8', fg: WHITE, books: true },
  bakery: { name: 'BAKERY', bg: '#f2c230', fg: '#5a3a28', awning: [RED, WHITE] },
  izakaya: { name: 'IZAKAYA', bg: '#2a2a30', fg: '#f2c230', noren: '#8a3a2a', lantern: true },
};
/**
 * A shop's ground floor (19 tall): glass or a wooden front and its door
 * (0-12), stripes or an awning (12-15), the sign (15-19).
 */
function shopFront(r, rng, dx, w, kind, wall) {
  const s = SHOPS[kind] ?? SHOPS.konbini;
  r(shade(wall, 0.9), dx, 12, w, SHOP_GF - 12);
  sign(r, s.bg, s.fg, dx + 1, 15, w - 2, 4, s.name);
  if (s.stripes) s.stripes.forEach((c, i) => r(c, dx, 14 - i, w, 1));
  if (s.noren) {
    r(DARKWOOD, dx, 0, w, 12);
    WINDOWS.lattice(r, dx + 2, SILL, w - 17, 6);
    DOORS.sliding(r, dx + w - 12);
    noren(r, s.noren, dx + w - 13, 8, 12);
    if (s.lantern) lantern(r, dx + w - 16, 6);
  } else if (s.auto) {
    WINDOWS.shop(r, dx + 1, 0, w - 13, 12); DOORS.auto(r, dx + w - 11);
  } else {
    WINDOWS.shop(r, dx + 1, 0, w - 10, 12); DOORS.glass(r, dx + w - 8);
    if (s.books) shelves(r, rng, dx + 2, 1, w - 13, 3, [RED, '#3f7fd6', '#f2c230', '#5f8f5a', WHITE, '#7a6aa8']);
  }
  if (s.awning) awning(r, s.awning[0], s.awning[1], dx - 1, 12, w + 2, 3);
}

// --- what a seed chooses ---------------------------------------------------------
// A building's seed picks its width (from the type's widths), its floors,
// its windows (style, how many, how spaced), its door (kind, side, colour),
// its roof (flat, pitched or hipped, depth, colour, what stands on it) and
// details (balconies, awnings, signs' side). Every size stays on the shared
// grid (STOREY): floors 16 / 19 / 13, doors 6 x 12, windows 5 x 6 ...

/** Choices made with the building's rng. */
const V = (rng) => ({
  pick: (a) => a[Math.floor(rng() * a.length)],
  chance: (p) => rng() < p,
  int: (a, b) => a + Math.floor(rng() * (b - a + 1)),
});
const WW = { sash: 5, pair: 9, alu: 5, aluPair: 9, tall: 5, shuttered: 7, arched: 5, leaded: 5, shoji: 5, neon: 5 };
function oneWindow(r, rng, kind, dx, up, o = {}) {
  switch (kind) {
    case 'sash': return WINDOWS.sash(r, rng, dx, up, 5, o.frame);
    case 'pair': return WINDOWS.sash(r, rng, dx, up, 9, o.frame);
    case 'alu': return WINDOWS.alu(r, rng, dx, up);
    case 'aluPair': return WINDOWS.alu(r, rng, dx, up, 9);
    case 'tall': return WINDOWS.tall(r, rng, dx, up - 1, o.frame);
    case 'shuttered': return WINDOWS.shuttered(r, rng, dx + 1, up - 1, o.shutter ?? '#3c4a5a', o.frame);
    case 'arched': return WINDOWS.arched(r, rng, dx, up - 1, o.frame);
    case 'leaded': return WINDOWS.leaded(r, rng, dx, up);
    case 'shoji': return WINDOWS.shoji(r, dx, up);
    case 'neon': return WINDOWS.neon(r, rng, dx, up);
  }
}
/** How many windows of a kind fit between x0 and x1, at least `gap` apart. */
const howMany = (kind, x0, x1, gap = 3) => Math.max(1, Math.floor((x1 - x0 - gap) / (WW[kind] + gap)));
/** n windows of a kind spread evenly between x0 and x1, their sills at `up`. */
function windowRow(r, rng, kind, x0, x1, up, n, o) {
  if (x1 - x0 < WW[kind] + 2) return;                                    // no room
  const ww = WW[kind], gap = (x1 - x0 - n * ww) / (n + 1);
  for (let i = 0; i < n; i++) oneWindow(r, rng, kind, Math.round(x0 + gap + i * (ww + gap)), up, o);
}
/** A door of a kind (6 wide, or 10 for auto / sliding / shoji) at dx. */
function aDoor(r, kind, dx, up = 0, c) {
  if (kind === 'auto' || kind === 'sliding' || kind === 'shoji') return DOORS[kind](r, dx, up, c);
  return DOORS[kind](r, dx, up, c);
}
const DW = (kind) => (kind === 'auto' || kind === 'sliding' || kind === 'shoji' ? 10 : 6);
/** A roof over a wall from dx, w wide, at `up`: flat, pitched or hipped. */
function aRoof(r, kind, wall, roofC, dx, up, w, d) {
  if (kind === 'flat') return flatRoof(r, wall, dx, up, w, Math.min(d, 14));
  pitched(r, roofC, dx - 2, up, w + 4, d, kind === 'hipped' ? 3 : 0);
}
const HOUSE_ROOFS = ['#c8603e', '#4a5560', '#6a4a3a', '#3c4a5a', '#7a3a32', '#5a6a5a'];
const DOOR_COLOURS = [WOOD, '#7a3a32', '#2f4a5a', '#3f6a4a', '#5a4a6a', DARKWOOD];
const AWNINGS = [[RED, WHITE], ['#2fa36b', WHITE], [NAVY, WHITE], ['#f08a2c', '#f4e6c8'], ['#7a3a6a', WHITE]];
/** Things on a flat roof: AC units, a water tank, a plant room. */
function rooftop(r, v, dx, up, w) {
  const n = v.int(0, Math.max(1, Math.floor(w / 14)));
  for (let i = 0; i < n; i++) { const x = dx + 3 + Math.floor(((i + 0.5) / n) * (w - 12)); r('#918f8a', x, up + 3, 6, 4); r(shade('#918f8a', 0.8), x, up + 3, 6, 1); }
  if (v.chance(0.35) && w > 24) { const x = dx + w - 11; r(CONCRETE, x, up + 4, 7, 5); r(shade(CONCRETE, 0.8), x, up + 4, 7, 1); }
}

// --- the buildings ---------------------------------------------------------------
// Each: [label, widths (the seed picks one), draw(r, rng, b, wall, roof, w)].
// The height comes from the drawing.

const DEFS = {
  house: ['House', [36, 44, 52], (r, rng, b, wall, roof, w) => {
    const v = V(rng), floors = v.chance(0.35) ? 2 : 1, top = floorAt(floors);
    const roofKind = v.pick(['pitched', 'pitched', 'hipped', 'flat']), roofC = b.roof ?? v.pick(HOUSE_ROOFS);
    const doorLeft = v.chance(0.5), doorKind = v.pick(['wood', 'wood', 'glazed', 'steel']), doorC = v.pick(DOOR_COLOURS);
    const kind = v.pick(['sash', 'pair', 'alu', 'aluPair']), frame = v.pick([WHITE, WHITE, '#e8dcc0', '#6a4a3a']);
    r(wall, 2, 0, w - 4, top);
    const dx = doorLeft ? 6 : w - 12;
    aDoor(r, doorKind, dx, 0, doorC); r(shade(wall, 0.8), dx - 1, 12, 8, 1);
    if (v.chance(0.5)) r(GOLD, doorLeft ? dx + 7 : dx - 2, 8, 1, 2);        // a lamp by the door
    const x0 = doorLeft ? dx + 8 : 3, x1 = doorLeft ? w - 3 : dx - 2;
    windowRow(r, rng, kind, x0, x1, SILL, v.int(1, howMany(kind, x0, x1)), { frame });
    if (floors === 2) { r(shade(wall, 0.85), 2, GF, w - 4, 1); windowRow(r, rng, kind, 3, w - 3, GF + SILL, v.int(2, howMany(kind, 3, w - 3)), { frame }); }
    r(shade(wall, 0.85), 2, 0, w - 4, 1);
    aRoof(r, roofKind, wall, roofC, 2, top, w - 4, v.int(14, 18));
    if (roofKind !== 'flat' && v.chance(0.5)) { const cx = v.pick([6, w - 10]); r('#9a4a3a', cx, top + 10, 4, 7); r(INK, cx, top + 16, 4, 1); }   // a chimney
    if (v.chance(0.4)) { r('#a8664a', doorLeft ? dx - 4 : dx + 8, 0, 3, 3); r('#5f8f5a', doorLeft ? dx - 4 : dx + 8, 3, 3, 2); }   // a pot plant
  }],
  apartment: ['Apartment block', [30, 34, 42], (r, rng, b, wall, roof, w) => {
    const v = V(rng), floors = v.int(4, 6), top = floorAt(floors), balcony = v.chance(0.7);
    const kind = v.pick(['alu', 'alu', 'aluPair', 'sash']), n = v.int(Math.max(2, howMany(kind, 2, w - 2) - 1), howMany(kind, 2, w - 2));
    r(wall, 0, 0, w, top);
    for (let f = 1; f < floors; f++) {
      const up = floorAt(f);
      windowRow(r, rng, kind, 2, w - 2, up + SILL, n);
      if (balcony) { r('#d8d4ca', 1, up + 1, w - 2, 1); r('#d8d4ca', 1, up + 3, w - 2, 1); for (let i = 1; i < w - 1; i += 4) r('#d8d4ca', i, up + 1, 1, 3); }
      else r(shade(wall, 0.85), 0, up, w, 1);
    }
    const dx = v.pick([Math.round(w / 2) - 5, 3, w - 13]);
    DOORS.auto(r, dx); r(shade(wall, 0.7), dx - 1, 12, 12, 1);
    const free = dx > w / 2 ? [2, dx - 3] : [dx + 12, w - 2];
    if (free[1] - free[0] > 8) { r(CONCRETE, free[0] + 1, 3, 6, 7); for (const y of [5, 8]) r(INK, free[0] + 2, y, 4, 1); }   // post boxes
    if (free[1] - free[0] > 16) WINDOWS.alu(r, rng, free[1] - 6, SILL);
    flatRoof(r, wall, 0, top, w, 12); rooftop(r, v, 0, top, w);
  }],
  mixedUse: ['Shop with flats above', [34, 38, 44], (r, rng, b, wall, roof, w) => {
    const v = V(rng), floors = v.int(2, 4), top = floorAt(floors, SHOP_GF);
    const kind = b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)];
    const signLeft = v.chance(0.5), win = v.pick(['alu', 'aluPair', 'sash']);
    r(wall, 0, SHOP_GF, w, top - SHOP_GF);
    shopFront(r, rng, 0, w, kind, wall);
    const x0 = signLeft ? 7 : 2, x1 = signLeft ? w - 2 : w - 7;
    for (let f = 1; f < floors; f++) windowRow(r, rng, win, x0, x1, floorAt(f, SHOP_GF) + SILL, howMany(win, x0, x1));
    upright(r, (SHOPS[kind] ?? SHOPS.konbini).bg === WHITE ? '#2fa36b' : (SHOPS[kind] ?? SHOPS.konbini).bg, WHITE, signLeft ? 1 : w - 6, SHOP_GF + 3, 5, top - SHOP_GF - 6, (SHOPS[kind] ?? SHOPS.konbini).name);
    flatRoof(r, wall, 0, top, w, 12); rooftop(r, v, 0, top, w);
  }],
  shop: ['Shop', [32, 40, 48], (r, rng, b, wall, roof, w) => {
    const v = V(rng);
    shopFront(r, rng, 0, w, b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)], wall);
    flatRoof(r, wall, 0, SHOP_GF, w, v.int(12, 14)); rooftop(r, v, 0, SHOP_GF, w);
  }],
  office: ['Office building', [28, 32, 40], (r, rng, b, roof, roofC, w) => {
    const v = V(rng), floors = v.int(5, 7), top = floorAt(floors);
    const wall = b.wall ?? v.pick(['#cfd2d4', '#b8bcc0', '#d8d2c4', '#9aa0a8']);
    const [glassC, mull] = v.pick([['#6f8aa6', '#8fa8c0'], ['#5f8a86', '#7fa8a2'], ['#7a6a5a', '#9a8a78'], ['#4a5a6a', '#6a7a8a']]);
    const ribbon = v.chance(0.6);
    r(wall, 0, 0, w, top);
    for (let f = 1; f < floors; f++) {
      const up = floorAt(f) + SILL;
      if (ribbon) { r(METAL, 2, up, w - 4, 6); r(glassC, 2, up + 1, w - 4, 4); for (let i = 2; i < w - 2; i += 4) r(mull, i, up + 1, 1, 4); }
      else for (let i = 3; i + 5 <= w - 2; i += 7) { r(METAL, i, up, 5, 6); r(glassC, i + 1, up + 1, 3, 4); }
    }
    WINDOWS.shop(r, 2, 0, w - 4, 12); DOORS.auto(r, Math.round(w / 2) - 5); r(shade(wall, 0.7), 2, 13, w - 4, 1);
    flatRoof(r, wall, 0, top, w, 14); r('#918f8a', 4, top + 4, 9, 6); r(shade('#918f8a', 0.8), 4, top + 4, 9, 1);
    if (v.chance(0.7)) { r(INK, w - 7, top + 4, 1, 9); r(RED, w - 7, top + 12, 1, 1); }   // an antenna
  }],
  shrine: ['Shrine', [72], (r, rng) => {                                        // a torii and the hall, side by side
    DEFS.torii[2](shifted(r, 2), rng, {}, '', '', 26);
    DEFS.shrineHall[2](shifted(r, 32), rng, {}, '', '', 40);
  }],
  torii: ['Torii', [26], (r, rng) => {
    const red = rng() < 0.75 ? '#c8402c' : '#9a958a';                       // vermilion, or stone
    r(red, 5, 0, 2, 20); r(red, 19, 0, 2, 20); r(red, 3, 15, 20, 2);
    r(INK, 1, 20, 24, 2); r(INK, 0, 22, 1, 1); r(INK, 25, 22, 1, 1);
    r(red, 12, 17, 2, 3);
  }],
  shrineHall: ['Shrine hall', [36, 40, 48], (r, rng, b, wall, roof, w) => {
    const v = V(rng), hall = v.pick(['#9a6a48', '#8a5a3a', '#b07a50']), roofC = v.pick(['#3a3f44', '#3a3f44', '#4a7a6a']);   // dark tiles or green copper
    r('#c9c2b0', 4, 0, w - 8, 3);
    r(hall, 6, 3, w - 12, 13);
    DOORS.shoji(r, Math.round(w / 2) - 5, 3);
    const sides = v.int(1, w > 40 ? 2 : 1);
    for (let i = 0; i < sides; i++) { WINDOWS.shoji(r, 8 + i * 7, 3 + SILL); WINDOWS.shoji(r, w - 13 - i * 7, 3 + SILL); }
    pitched(r, roofC, 1, 16, w - 2, v.int(14, 17), 2); r(shade(roofC, 0.8), 0, 16, 1, 2); r(shade(roofC, 0.8), w - 1, 16, 1, 2);
    r(GOLD, Math.round(w / 2) - 3, 27, 6, 1);
  }],
  school: ['School', [100, 110], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), floors = v.int(2, 3), top = floorAt(floors), wall = b.wall ?? v.pick(['#e4e0d6', '#f2efe8', '#d8d0c4']);
    r(wall, 0, 0, w, top);
    const n = Math.floor((w - 8) / 10), mid = Math.floor(n / 2);
    for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) { if (f === 0 && i === mid) continue; WINDOWS.alu(r, rng, 4 + i * 10, floorAt(f) + SILL, 5); }
    for (let f = 1; f < floors; f++) r(shade(wall, 0.8), 0, floorAt(f), w, 1);
    const ex = 4 + mid * 10 - 3;
    r(shade(wall, 0.9), ex - 2, 0, 15, 14); DOORS.auto(r, ex); r(shade(wall, 0.7), ex - 2, 13, 15, 1);
    flatRoof(r, wall, 0, top, w, 16);
    if (v.chance(0.75)) { const cx = Math.round(w / 2) - 7; r(wall, cx, top, 14, 11); flatRoof(r, wall, cx - 1, top + 11, 16, 5); icon(r, cx + 4, top + 3, ['.www.', 'wwiww', 'wwiiw', 'wwwww', '.www.'], { w: WHITE, i: INK }); }   // clock tower
  }],
  laundromat: ['Coin laundromat', [32, 36, 42], (r, rng, b, wall, roof, w) => {
    const v = V(rng);
    r(shade(wall, 0.9), 0, 12, w, SHOP_GF - 12);
    sign(r, v.pick(['#e8e0d0', WHITE, '#d8e8f0']), '#3f7fd6', 1, 15, w - 2, 4, 'LAUNDROMAT');
    const doorRight = v.chance(0.6), gx = doorRight ? 1 : 9, gw = w - 10;
    WINDOWS.shop(r, gx, 0, gw, 12);
    for (let i = gx + 2; i + 4 <= gx + gw - 2; i += 6) { r(INK, i, 2, 4, 4); r('#7f9ab4', i + 1, 3, 2, 2); }   // washers
    DOORS.glass(r, doorRight ? w - 8 : 2);
    flatRoof(r, wall, 0, SHOP_GF, w, 12); rooftop(r, v, 0, SHOP_GF, w);
  }],
  kissaten: ['Café (kissaten)', [30, 34, 40], (r, rng, b, wall, roof, w) => {
    const v = V(rng), top = floorAt(2), front = v.pick([DARKWOOD, '#5a3a28', '#2f4a3a']), aw = v.pick(AWNINGS);
    const doorRight = v.chance(0.65);
    r(wall, 0, GF, w, top - GF);
    r(front, 0, 0, w, GF);
    WINDOWS.shop(r, doorRight ? 2 : 10, 0, w - 12, 12, WOOD, '#c9a46a');
    DOORS.glazed(r, doorRight ? w - 8 : 2);
    awning(r, aw[0], aw[1], -1, 12, w + 2, 3);
    windowRow(r, rng, v.pick(['sash', 'pair']), 2, w - 2, floorAt(1) + SILL, v.int(1, 2));
    aRoof(r, v.pick(['pitched', 'hipped']), wall, b.roof ?? v.pick(['#5a4a48', '#4a5560', '#7a3a32']), 1, top, w - 2, 14);
  }],
  pharmacy: ['Pharmacy', [40, 44, 50], (r, rng, b, wall, roof, w) => {
    const v = V(rng);
    r(shade(wall, 0.9), 0, 12, w, SHOP_GF - 12);
    sign(r, '#eef2e8', '#2fa36b', 8, 15, w - 9, 4, 'PHARMACY');
    icon(r, 1, 14, CROSS, { g: '#2fa36b', w: WHITE });
    const doorRight = v.chance(0.7);
    WINDOWS.shop(r, doorRight ? 1 : 12, 0, w - 13, 12, FRAME, '#dfe8ec');
    shelves(r, rng, doorRight ? 2 : 13, 1, w - 15, 3, [RED, '#3f7fd6', '#f2c230', '#2fa36b', WHITE, '#d46a8e']);
    DOORS.auto(r, doorRight ? w - 11 : 1);
    flatRoof(r, wall, 0, SHOP_GF, w, 12); rooftop(r, v, 0, SHOP_GF, w);
  }],
  sushi: ['Sushi restaurant', [32, 36, 42], (r, rng, b, wall, roof, w) => {
    const v = V(rng), floors = v.chance(0.75) ? 2 : 1, top = floorAt(floors), norenC = v.pick([NAVY, '#7a2a22', '#2f4a3a']);
    const doorRight = v.chance(0.6), dx = doorRight ? w - 14 : 3;
    if (floors === 2) r(wall, 0, GF, w, top - GF);
    r(DARKWOOD, 0, 0, w, GF);
    const lx = doorRight ? 3 : 16, lw = w - 19;
    WINDOWS.lattice(r, lx, SILL, lw, 6);
    sign(r, LIGHTWOOD, INK, lx, 12, Math.min(lw, 16), 3, 'SUSHI');
    DOORS.sliding(r, dx); noren(r, norenC, dx - 1, 8, 12);
    if (floors === 2) windowRow(r, rng, v.pick(['alu', 'shoji']), 2, w - 2, floorAt(1) + SILL, howMany('alu', 2, w - 2, 5));
    r('#4a4442', -1, GF - 1, w + 2, 1);
    aRoof(r, v.pick(['pitched', 'hipped']), wall, b.roof ?? v.pick(['#4a4442', '#3a3f44', '#5a5450']), 1, top, w - 2, v.int(12, 15));
  }],
  florist: ['Flower shop', [28, 32, 36], (r, rng, b, wall, roof, w) => {
    const v = V(rng), floors = v.int(1, 3), top = floorAt(floors, SHOP_GF), aw = v.pick(AWNINGS);
    r(wall, 0, 0, w, top);
    WINDOWS.shop(r, 1, 0, w - 10, 12); DOORS.glass(r, w - 8);
    awning(r, aw[0], aw[1], -1, 12, w + 2, 3); sign(r, WHITE, '#d46a8e', 3, 15, w - 6, 4, 'FLOWERS');
    for (let f = 1; f < floors; f++) windowRow(r, rng, 'alu', 2, w - 2, floorAt(f, SHOP_GF) + SILL, howMany('alu', 2, w - 2, 6));
    for (let dx = 1; dx + 4 <= w - 10; dx += 5) { r('#8a6440', dx, 0, 4, 2); dots(r, rng, dx, 2, 4, [RED, '#f2c230', '#d46a8e', WHITE, '#7a6aa8']); r('#5f8f5a', dx + 1, 3, 2, 1); }
    flatRoof(r, wall, 0, top, w, 10);
    if (v.chance(0.6)) for (let dx = 3; dx + 5 <= w - 3; dx += 6) { r('#8a6440', dx, top + 2, 5, 3); r('#5f8f5a', dx + 1, top + 4, 3, 2); }   // a roof garden
  }],
  fishmonger: ['Fishmonger', [36, 40, 46], (r, rng, b, wall, roof, w) => {
    const v = V(rng), aw = v.pick([[NAVY, WHITE], ['#3f7fd6', WHITE], [RED, WHITE]]);
    r(shade(wall, 0.9), 0, 12, w, SHOP_GF - 12);
    r('#3a3f44', 0, 0, w, 12);
    r('#dfe8ec', 2, 0, w - 4, 5); r(WHITE, 1, 5, w - 2, 1);
    for (let i = 4; i < w - 4; i += 4) r(rng() < 0.5 ? '#b3b0a8' : '#d8b0a0', i, 3, 2, 1);
    awning(r, aw[0], aw[1], -1, 12, w + 2, 3); sign(r, WHITE, aw[0], 1, 15, w - 2, 4, 'FISH');
    flatRoof(r, wall, 0, SHOP_GF, w, 12); rooftop(r, v, 0, SHOP_GF, w);
  }],
  udonSoba: ['Udon / soba shop', [32, 36, 42], (r, rng, b, wall, roof, w) => {
    const v = V(rng), floors = v.chance(0.7) ? 2 : 1, top = floorAt(floors), front = v.pick([WOOD, DARKWOOD, '#7a5a3a']);
    const doorRight = v.chance(0.6), dx = doorRight ? w - 14 : 3;
    if (floors === 2) r(wall, 0, GF, w, top - GF);
    r(front, 0, 0, w, GF);
    const lx = doorRight ? 3 : 16, lw = w - 19;
    WINDOWS.lattice(r, lx, SILL, lw, 6);
    sign(r, LIGHTWOOD, INK, lx, 12, Math.min(lw, 16), 3, 'UDON');
    DOORS.sliding(r, dx); noren(r, v.pick(['#3a5a7a', NAVY, '#7a2a22']), dx - 1, 8, 12); lantern(r, doorRight ? dx - 3 : dx + 11, 6);
    if (floors === 2) windowRow(r, rng, v.pick(['aluPair', 'alu']), 2, w - 2, floorAt(1) + SILL, 2);
    r('#3a3f44', -1, GF - 1, w + 2, 1);
    aRoof(r, v.pick(['pitched', 'hipped']), wall, b.roof ?? v.pick(['#3a3f44', '#4a4442']), 1, top, w - 2, v.int(12, 15));
  }],
  familyRestaurant: ['Family restaurant', [64, 72], (r0, rng, b, wall0, roof, w) => {
    const v = V(rng), signC = v.pick(['#2fa36b', '#d8443c', '#3f7fd6']);
    r0(INK, 3, 0, 1, 22); sign(r0, signC, WHITE, 0, 22, 7, 5, 'DINER');    // pole sign
    const r = shifted(r0, 8), bw = w - 8;
    const wall = b.wall ?? v.pick(['#b89e80', '#d8c8a8', '#c8a088']), frameC = v.pick(['#a03a2c', '#3a6a4a', '#4a4e54']);
    r(wall, 0, 0, bw, GF);
    const n = Math.floor((bw - 12) / 10);
    for (let i = 0; i < n; i++) WINDOWS.shop(r, 2 + i * 10, 2, 9, 10, frameC);
    DOORS.glass(r, bw - 9);
    pitched(r, v.pick(['#d0603e', '#7a3a32', '#4a5560']), -1, GF, bw + 2, 14, 2); r(signC, -1, GF, bw + 2, 1);
  }],
  takoyaki: ['Takoyaki stand', [18, 20, 24], (r, rng, b, wall, roof, w) => {
    const v = V(rng), aw = v.pick([['#f08a2c', '#f4e6c8'], [RED, WHITE], ['#2fa36b', '#f4e6c8']]);
    r('#e8e0d0', 0, 0, w, SHOP_GF);
    flatRoof(r, '#e8e0d0', 0, SHOP_GF, w, 8);
    r('#3a3f44', 1, 6, w - 2, 6);
    r(DARKWOOD, 0, 0, w, 6); r(LIGHTWOOD, 0, 5, w, 1);
    for (let i = 3; i < w - 2; i += 4) r('#c09060', i, 6, 2, 1);
    awning(r, aw[0], aw[1], -1, 12, w + 2, 3);
    sign(r, '#e0d2b0', '#7a3a32', 0, 15, w, 6, 'TAKOYAKI');
    lantern(r, v.chance(0.5) ? 1 : w - 3, 8);
  }],
  koban: ['Police station (koban)', [42], (r0, rng) => {
    // a bicycle out front
    r0(INK, 0, 0, 3, 3); r0(INK, 5, 0, 3, 3); r0('#d8d0c0', 1, 1, 1, 1); r0('#d8d0c0', 6, 1, 1, 1); r0('#3f7fd6', 2, 3, 5, 1); r0(INK, 4, 4, 1, 1);
    const r = shifted(r0, 11), v = V(rng);
    const wall = v.pick(['#9a7c60', '#c8b8a0', '#e8e0d0']);
    r(wall, 0, 0, 30, GF);
    WINDOWS.shop(r, 2, 0, 14, 12); DOORS.glass(r, 19);
    sign(r, NAVY, WHITE, 1, 12, 18, 4, 'POLICE STATION');
    r(shade(wall, 0.8), 20, 12, 4, 1); r(RED, 21, 13, 2, 2); r(WHITE, 21, 14, 1, 1);   // the red lamp over the door
    flatRoof(r, wall, -1, GF, 32, 12); r('#e8dcc0', -1, GF, 32, 1);
  }],
  postOffice: ['Post office', [54, 62], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), wall = '#e8e0d0', bw = w - 6;
    r(wall, 0, 0, bw, GF);
    r(RED, 0, 12, bw, 4); sign(r, RED, WHITE, 9, 12, 34, 4, 'POST OFFICE'); icon(r, 3, 12, ['wwwww', '.....', 'wwwww', '..w..'], { w: WHITE });
    const n = Math.floor((bw - 14) / 10), doorLeft = v.chance(0.35);
    for (let i = 0; i < n; i++) { const dx = (doorLeft ? 13 : 2) + i * 10; WINDOWS.alu(r, rng, dx, SILL, 9); r(rng() < 0.5 ? '#f2c230' : '#3f7fd6', dx + 2, SILL + 1, 2, 3); }
    DOORS.auto(r, doorLeft ? 1 : bw - 11);
    flatRoof(r, wall, 0, GF, bw, 14); r(RED, 0, GF, bw, 2); rooftop(r, v, 0, GF, bw);
    r(RED, bw + 2, 0, 3, 6); r(INK, bw + 2, 4, 3, 1);                       // post box
  }],
  bank: ['Bank', [40, 46, 52], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), floors = v.int(2, 4), top = floorAt(floors), wall = v.pick(['#6a5848', '#8a8a88', '#c8b8a0', '#4a4e54']);
    const signC = v.pick(['#c8302a', '#2c4a8a', '#2f7a4a']);
    r(wall, 0, 0, w, top);
    const kind = v.pick(['alu', 'tall', 'aluPair']);
    for (let f = 1; f < floors; f++) windowRow(r, rng, kind, 2, w - 2, floorAt(f) + SILL, howMany(kind, 2, w - 2));
    sign(r, signC, WHITE, 2, 12, w - 4, 4, 'BANK');
    WINDOWS.shop(r, 2, 0, w - 21, 12); DOORS.auto(r, w - 17);
    r(CONCRETE, w - 5, 0, 4, 10); r(INK, w - 4, 5, 2, 3);                   // ATM
    flatRoof(r, wall, 0, top, w, 12); rooftop(r, v, 0, top, w);
  }],
  clinic: ['Clinic', [36, 40, 46], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), floors = v.int(1, 3), top = floorAt(floors), wall = v.pick(['#b9b8b0', '#e8e4dc', '#d8e0e4']);
    r(wall, 0, 0, w, top);
    sign(r, WHITE, '#2fa36b', 2, 12, w - 4, 4, 'CLINIC');
    WINDOWS.shop(r, 2, 0, w - 13, 12, FRAME, '#dfe8ec'); DOORS.glass(r, w - 9);
    if (floors === 1) icon(r, w - 8, GF + 1, CROSS, { g: '#2fa36b', w: WHITE });
    for (let f = 1; f < floors; f++) {
      if (f === 1) icon(r, 5, floorAt(1) + SILL, CROSS, { g: '#2fa36b', w: WHITE });
      windowRow(r, rng, 'aluPair', f === 1 ? 12 : 2, w - 2, floorAt(f) + SILL, f === 1 ? howMany('aluPair', 12, w - 2) : howMany('aluPair', 2, w - 2));
    }
    flatRoof(r, wall, 0, top, w, 12); rooftop(r, v, 0, top, w);
  }],
  fireStation: ['Fire station', [50, 56, 66], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), bw = w - 10, top = floorAt(2, SHOP_GF), wall = v.pick(['#d8d0c4', '#c8b8a8', '#e8e4dc']);
    r(wall, 0, 0, bw, top);
    const n = Math.max(1, Math.floor((bw - 2) / 21));
    for (let i = 0; i < n; i++) DOORS.garage(r, 2 + i * 21 + Math.floor((bw - 2 - n * 21) / 2));
    r('#a83028', 0, 15, bw, 2);
    windowRow(r, rng, 'alu', 2, bw - 2, floorAt(1, SHOP_GF) + SILL, howMany('alu', 2, bw - 2, 6));
    flatRoof(r, wall, 0, top, bw, 14);
    const tall = v.int(48, 58);
    r('#b9b0a4', bw, 0, 10, tall); for (let up = SHOP_GF + SILL; up < tall - 8; up += 13) WINDOWS.alu(r, rng, bw + 3, up, 4);   // hose tower
    flatRoof(r, '#b9b0a4', bw, tall, 10, 6); r(RED, bw + 4, tall + 2, 2, 3);
  }],
  karaoke: ['Karaoke', [30, 34, 40], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), floors = v.int(3, 5), top = floorAt(floors), wall = v.pick(['#2a2a30', '#3a2a40', '#2a3040']);
    const signLeft = v.chance(0.4);
    r(wall, 0, 0, w, top);
    const x0 = signLeft ? 7 : 2, x1 = signLeft ? w - 2 : w - 7;
    for (let f = 1; f < floors; f++) windowRow(r, rng, 'neon', x0, x1, floorAt(f) + SILL, howMany('neon', x0, x1, 3));
    upright(r, WHITE, '#d8302a', signLeft ? 1 : w - 5, GF + 1, 4, top - GF - 3, 'KARAOKE', [RED, '#3f7fd6', '#d46a8e', '#f2c230']);
    WINDOWS.shop(r, 2, 0, w - 14, 12, FRAME, v.pick(['#7a6aa8', '#a85a8a', '#5a7aa8'])); DOORS.glass(r, w - 10); r(v.pick(['#f2a040', '#e870a0', '#6ac8f2']), 2, 13, w - 8, 2);
    flatRoof(r, wall, 0, top, w, 12); rooftop(r, v, 0, top, w);
  }],
  woodApartment: ['Wooden apartment', [40, 48, 56], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), bw = w - 6, top = floorAt(2), wall = v.pick(['#b8ae9c', '#c8b898', '#a8a8a0']), doorC = v.pick(['#8a6a4a', '#6a7f94', '#7a5a4a']);
    r(wall, 0, 0, bw, top);
    const units = Math.floor((bw - 2) / 14);
    for (let n = 0; n < 2; n++) for (let i = 0; i < units; i++) { const ux = 2 + i * 14; DOORS.steel(r, ux, floorAt(n), doorC); WINDOWS.alu(r, rng, ux + 7, floorAt(n) + SILL); }
    r('#7a6a5a', 0, GF, bw, 1); r('#7a6a5a', 0, GF + 3, bw, 1); for (let i = 0; i < bw; i += 4) r('#7a6a5a', i, GF, 1, 3);   // corridor rail
    for (let k = 0; k < 8; k++) r('#7a6a5a', bw + k * 0.75 | 0, GF - k * 2, 2, 1);   // outside stairs
    r('#7a6a5a', bw + 4, 0, 1, GF + 1);
    if (v.chance(0.5)) flatRoof(r, wall, 0, top, bw, 12); else pitched(r, v.pick(['#4a5560', '#6a4a3a']), -2, top, bw + 4, 12);
  }],
  parkingGarage: ['Parking garage', [48, 56, 64], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), levels = v.int(2, 4), slab = '#c9c4ba';
    for (let l = 0; l < levels; l++) {
      const up = l * FL;
      r('#3a3f44', 0, up, w, FL); r(slab, 0, up + 11, w, 2);
      for (let i = 4; i < w - 8; i += 10) if (rng() < 0.7) { const c = ['#e8402f', WHITE, '#3f7fd6', INK, '#b3b0a8'][Math.floor(rng() * 5)]; r(c, i, up + 2, 7, 3); r(c, i + 1, up + 5, 5, 2); r(GLASS, i + 2, up + 5, 3, 1); }
    }
    for (const x of [0, Math.round(w / 2) - 1, w - 2]) r(slab, x, 0, 2, levels * FL);
    flatRoof(r, slab, 0, levels * FL, w, 14);
    for (let i = 5; i < w - 12; i += 9) if (rng() < 0.6) { const c = ['#e8402f', WHITE, '#3f7fd6', INK][Math.floor(rng() * 4)]; r(c, i, levels * FL + 4, 5, 7); r(GLASS, i + 1, levels * FL + 8, 3, 2); }
    icon(r, w - 8, levels * FL + 1, ['bbbbb', 'bwwwb', 'bwbwb', 'bwwwb', 'bwbbb', 'bwbbb', 'bbbbb'], { b: '#3f7fd6', w: WHITE });  // P
  }],
  gasStation: ['Gas station', [68], (r0, rng) => {
    const r = shifted(r0, 4), v = V(rng), [brand, brand2] = v.pick([[RED, WHITE], ['#2f7a4a', '#f2c230'], ['#2c4a8a', WHITE]]);
    r(CONCRETE, 10, 0, 2, 20); r(CONCRETE, 46, 0, 2, 20);
    r('#e4e2dc', 4, 24, 52, 12); r('#d4d2cc', 4, 24, 52, 1); r(brand2, 4, 20, 52, 4); r(brand, 4, 21, 52, 1);  // canopy, its top
    for (const dx of [20, 34]) { r(brand, dx, 0, 4, 8); r(WHITE, dx + 1, 4, 2, 2); r(INK, dx + 1, 1, 2, 1); }  // pumps
    r('#e8e0d0', 51, 0, 13, GF); DOORS.glass(r, 52); WINDOWS.alu(r, rng, 59, SILL, 4); flatRoof(r, '#e8e0d0', 51, GF, 13, 6);  // kiosk
    r(INK, 0, 0, 1, 22); r(WHITE, -3, 22, 7, 8); r(brand, -2, 27, 5, 2); r(INK, -2, 23, 5, 1); r(INK, -2, 25, 5, 1);  // price sign
  }],
  tudorCottage: ['Tudor cottage', [32, 36, 44], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), wall = v.pick(['#ece0c4', '#f2ead8', '#e0d0b0']), beam = v.pick(['#3a2a22', '#2a2a2e']), top = floorAt(2);
    r(wall, 0, 0, w, top);
    r(beam, 0, 0, 1, top); r(beam, w - 1, 0, 1, top); r(beam, 0, GF, w, 1); r(beam, 0, top - 1, w, 1);
    for (const dx of [8, w - 9]) r(beam, dx, 0, 1, top);
    for (let k = 0; k < 5; k++) { r(beam, 1 + k, GF + 1 + k * 2, 1, 2); r(beam, w - 2 - k, GF + 1 + k * 2, 1, 2); }   // braces
    const dx = v.pick([Math.round(w / 2) - 3, 11]);
    DOORS.plank(r, dx, 0, v.pick([WOOD, '#5a3a2a', '#3f5a3a'])); r(beam, dx - 1, 12, 8, 1);
    WINDOWS.leaded(r, rng, 2, SILL); WINDOWS.leaded(r, rng, w - 7, SILL);
    windowRow(r, rng, 'leaded', 9, w - 9, floorAt(1) + SILL, v.int(1, howMany('leaded', 9, w - 9)));
    const roofC = v.pick(['#4a3a32', '#5a5a4a', '#6a5a3a']);
    gable(r, roofC, wall, -2, top, w + 4, 14, 12);
    r(beam, Math.round(w / 2) - 1, top, 2, 10); r(beam, Math.round(w / 2) - 8, top + 4, 16, 1);
    const cx = v.pick([4, w - 8]); r('#9a4a3a', cx, top + 16, 4, 9); r(INK, cx, top + 24, 4, 1);   // chimney
  }],
  mediterraneanVilla: ['Mediterranean villa', [38, 44, 52], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), floors = v.chance(0.75) ? 2 : 1, top = floorAt(floors), wall = v.pick(['#f0e8d8', '#f2e0c0', '#e8d8d0']);
    const shut = v.pick(['#3f5f9a', '#3f7a5a', '#7a3a32', '#2f6a8a']);
    r(wall, 0, 0, w, top);
    const dx = Math.round(w / 2) - 3;
    for (let f = 1; f < floors; f++) windowRow(r, rng, 'shuttered', 2, w - 2, floorAt(f) + SILL, howMany('shuttered', 2, w - 2, 2), { shutter: shut, frame: NAVY });
    windowRow(r, rng, 'shuttered', 2, dx - 2, SILL, 1, { shutter: shut, frame: NAVY }); windowRow(r, rng, 'shuttered', dx + 8, w - 2, SILL, 1, { shutter: shut, frame: NAVY });
    DOORS.arched(r, dx, 0, '#6a4a3a'); r(shade(wall, 0.85), dx - 1, 0, 1, 12); r(shade(wall, 0.85), dx + 6, 0, 1, 12);
    if (v.chance(0.6)) for (const fx of [3, w - 8]) { r('#a8664a', fx, 1, 5, 2); r('#5f8f5a', fx + 1, 3, 3, 1); }   // flower boxes
    pitched(r, v.pick(['#c0603a', '#d0783a', '#a85030']), -2, top, w + 4, v.int(13, 16), 3);
  }],
  dutchCanalHouse: ['Dutch canal house', [20, 24, 28], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), floors = v.int(3, 5), top = floorAt(floors), trim = '#f2efe8';
    const wall = v.pick(['#6a5a8a', '#8a3a32', '#3f5a4a', '#2c3a5a', '#b8863a']), gableKind = v.pick(['stepped', 'stepped', 'bell', 'triangle']);
    r(wall, 0, 0, w, top);
    const n = w >= 24 ? 2 : 1;
    for (let f = 1; f < floors; f++) windowRow(r, rng, 'tall', 2, w - 2, floorAt(f) + 3 + 1, n, { frame: trim });
    const dx = v.chance(0.5) ? w - 9 : 3;
    WINDOWS.tall(r, rng, dx === 3 ? w - 8 : 3, 3, trim);
    DOORS.wood(r, dx, 0, v.pick(['#2a4a3a', '#3a2a4a', '#5a2a2a'])); r(trim, dx - 1, 12, 8, 1); r(GLASS, dx, 13, 6, 2);
    const half = Math.round(w / 2);
    r(shade('#5a5450', 0.8), 2, top, half - 2, 11); r('#5a5450', half, top, half - 2, 11);   // the roof behind the gable
    if (gableKind === 'stepped') {
      const step = Math.round(w / 8);
      [0, 1, 2, 3].forEach((i) => { const inset = i * step, gw = w - inset * 2; if (gw > 2) { r(wall, inset, top + i * 3, gw, 3); r(trim, inset, top + 2 + i * 3, gw, 1); } });
    } else if (gableKind === 'bell') {
      for (let k = 0; k < 12; k++) { const inset = Math.round((k < 4 ? k * 0.5 : 2 + (k - 4) * (half - 4) / 8)); if (w - inset * 2 > 1) r(wall, inset, top + k, w - inset * 2, 1); }
      r(trim, Math.max(0, half - 2), top + 11, 4, 1);
    } else for (let k = 0; k < 11; k++) { const inset = Math.round(k * half / 11); r(k === 0 ? trim : wall, inset, top + k, w - inset * 2, 1); r(trim, inset, top + k, 1, 1); r(trim, w - inset - 1, top + k, 1, 1); }
    WINDOWS.round(r, half - 2, top + 3);
  }],
  frenchCountryHouse: ['French country house', [38, 42, 50], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), wall = v.pick(['#c8b08c', '#d8c8a8', '#b89870']), shut = v.pick(['#3c4a5a', '#5a7a8a', '#7a8a5a', '#8a5a4a']), top = floorAt(2);
    r(wall, 0, 0, w, top);
    const n = howMany('shuttered', 2, w - 2, 3);
    windowRow(r, rng, 'shuttered', 2, w - 2, floorAt(1) + SILL, n, { shutter: shut });
    const doorAt = v.pick(['left', 'right', 'middle']), dx = doorAt === 'left' ? 4 : doorAt === 'right' ? w - 10 : Math.round(w / 2) - 3;
    DOORS.wood(r, dx, 0, v.pick(DOOR_COLOURS)); r(shade(wall, 0.8), dx - 1, 12, 8, 1);
    if (doorAt !== 'left') windowRow(r, rng, 'shuttered', 2, dx - 2, SILL, Math.max(1, howMany('shuttered', 2, dx - 2, 3)), { shutter: shut });
    if (doorAt !== 'right') windowRow(r, rng, 'shuttered', dx + 8, w - 2, SILL, Math.max(1, howMany('shuttered', dx + 8, w - 2, 3)), { shutter: shut });
    const roofC = v.pick(['#3a3f44', '#4a5560', '#5a4a48']);
    pitched(r, roofC, -2, top, w + 4, v.int(16, 19), 3);
    const dormers = v.int(1, 3);
    for (let i = 0; i < dormers; i++) { const ddx = Math.round(((i + 1) / (dormers + 1)) * w) - 3; r(wall, ddx, top + 2, 6, 6); WINDOWS.sash(r, rng, ddx + 1, top + 2, 4); pitched(r, roofC, ddx - 1, top + 8, 8, 3, 3); }
    for (const cx of v.chance(0.5) ? [6, w - 10] : [v.pick([6, w - 10])]) { r('#9a7c60', cx, top + 12, 4, 8); r(INK, cx, top + 19, 4, 1); }   // chimneys
  }],
  scandinavianHouse: ['Scandinavian house', [34, 40, 46], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), floors = v.chance(0.7) ? 2 : 1, top = floorAt(floors), wall = v.pick(['#a83a32', '#d8a840', '#3f6a8a', '#e8e4dc', '#5a7a4a']);
    const trim = wall === '#e8e4dc' ? '#4a5560' : WHITE;
    r(wall, 0, 0, w, top);
    for (let i = 2; i < w; i += 4) r(shade(wall, 0.82), i, 0, 1, top);      // planks
    r(trim, 0, 0, 1, top); r(trim, w - 1, 0, 1, top);
    const dx = v.pick([Math.round(w / 2) - 4, 4, w - 12]);
    r(trim, dx - 1, 0, 8, 13); DOORS.wood(r, dx, 0, v.pick(['#2f4a5a', '#3a2a22', '#6a2a2a']));
    windowRow(r, rng, 'sash', 2, dx - 2, SILL, Math.max(1, howMany('sash', 2, dx - 2, 4)), { frame: trim });
    windowRow(r, rng, 'sash', dx + 8, w - 2, SILL, Math.max(1, howMany('sash', dx + 8, w - 2, 4)), { frame: trim });
    if (floors === 2) windowRow(r, rng, 'sash', 2, w - 2, floorAt(1) + SILL, v.int(2, howMany('sash', 2, w - 2, 4)), { frame: trim });
    pitched(r, v.pick(['#3a3f44', '#4a3a32', '#2f4a3a']), -2, top, w + 4, v.int(14, 17));
    const cx = v.pick([5, w - 9]); r(shade(wall, 0.7), cx, top + 9, 4, 8); r(INK, cx, top + 16, 4, 1);   // chimney
  }],
  // Not in tiny-catalogue: the owner asked for it. The seed picks the wall,
  // the dome (colour, size), one or two minarets (height, which side), small
  // side domes, how many arched windows and the trim colour.
  mosque: ['Mosque', [56], (r, rng) => {
    const pick = (a) => a[Math.floor(rng() * a.length)];
    const wall = pick(['#f2efe8', '#e8dcc0', '#dcc49c', '#e6d6c4']);
    const domeC = pick(['#3f8f6a', '#d8a840', '#3f6fa8', '#e8e8e0', '#3fa8a0']);
    const trim = pick(['#3f8f6a', '#3f6fa8', '#3fa8a0', '#b8603a']);
    const wallH = 18 + Math.floor(rng() * 4), rad = 7 + Math.floor(rng() * 4);
    const minarets = rng() < 0.55 ? 2 : 1, leftOnly = rng() < 0.5, tall = 50 + Math.floor(rng() * 14);
    const sideDomes = rng() < 0.5, perSide = 1 + Math.floor(rng() * 2);
    r(wall, 6, 0, 44, wallH); r(shade(wall, 0.85), 6, 0, 44, 1);
    r(trim, 6, wallH - 3, 44, 1);
    for (const base of [6, 35]) for (let i = 0; i < perSide; i++) WINDOWS.pointed(r, base + (perSide === 1 ? 5 : 1 + i * 8), 3, trim);
    flatRoof(r, wall, 6, wallH, 44, 12);
    if (sideDomes) for (const cx of [14, 41]) { r(wall, cx - 3, wallH + 3, 7, 2); dome(r, domeC, cx, wallH + 5, 3); }
    r(wall, 28 - rad - 1, wallH + 4, rad * 2 + 3, 3);
    dome(r, domeC, 28, wallH + 7, rad);
    r(GOLD, 28, wallH + 8 + rad, 1, 3); r(GOLD, 27, wallH + 11 + rad, 1, 1); r(GOLD, 29, wallH + 12 + rad, 1, 1);
    r(wall, 19, 0, 18, wallH + 6); r(shade(wall, 0.85), 19, wallH + 5, 18, 1);
    pointedArch(r, trim, 21, 0, 14, wallH + 3); pointedArch(r, shade(trim, 0.6), 23, 0, 10, wallH);
    DOORS.arched(r, 25); r(GOLD, 27, 14, 2, 2);
    for (const dx of minarets === 2 ? [0, 51] : [leftOnly ? 0 : 51]) {
      r(wall, dx, 0, 5, tall); r(shade(wall, 0.85), dx + 3, 0, 2, tall);
      r(trim, dx, Math.round(tall * 0.45), 5, 1);
      r(shade(wall, 0.75), dx - 1, Math.round(tall * 0.75), 7, 2); r(trim, dx - 1, Math.round(tall * 0.75) + 2, 7, 1);
      pointedArch(r, NAVY, dx + 2, Math.round(tall * 0.55), 1, 4);
      dome(r, domeC, dx + 2, tall, 2); r(GOLD, dx + 2, tall + 3, 1, 3);
    }
  }],
  stoneChapel: ['Stone chapel', [30, 34, 40], (r, rng, b, wall0, roof, w) => {
    const v = V(rng), wall = v.pick(['#8f8a80', '#a89a88', '#7a7a78']), top = v.int(22, 26), half = Math.round(w / 2);
    r(wall, 0, 0, w, top);
    for (let up = 2; up < top; up += 3) for (let i = (up % 2) * 2; i < w; i += 5) r(shade(wall, 0.85), i, up, 2, 1);
    r(shade(wall, 0.7), half - 4, 0, 8, 13); DOORS.arched(r, half - 3, 0, DARKWOOD);
    WINDOWS.round(r, half - 2, 15);
    const n = w >= 38 ? 2 : 1;
    for (let i = 0; i < n; i++) { WINDOWS.stained(r, 3 + i * 7, SILL); WINDOWS.stained(r, w - 8 - i * 7, SILL); }
    const roofC = v.pick(['#2f2a2a', '#3a3f44', '#4a3a32']);
    gable(r, roofC, wall, -2, top, w + 4, 16, v.int(14, 18));
    if (v.chance(0.75)) {                                                     // a bell tower on the front of the roof
      r(wall, half - 3, top + 14, 6, 12); r(INK, half - 1, top + 19, 2, 4);
      for (let k = 0; k < 4; k++) r(roofC, half - 4 + k, top + 26 + k, 8 - k * 2, 1);
      icon(r, half - 2, top + 30, ['.g.', 'ggg', '.g.', '.g.', '.g.'], { g: GOLD });
    } else icon(r, half - 2, top + 16, ['.g.', 'ggg', '.g.', '.g.', '.g.'], { g: GOLD });
  }],
};

// Ground a person cannot stand on, as [dx, w, top, bottom] (rows above the
// ground line), for buildings you can partly walk into: between the torii's
// posts, under the gas station's canopy (8 px deep). Everything else is
// solid over its whole picture.
const OPEN = {
  torii: [[5, 2, 3, 0], [19, 2, 3, 0]],
  gasStation: [[4, 1, 3, 0], [14, 2, 3, 0], [24, 4, 3, 0], [38, 4, 3, 0], [50, 2, 3, 0], [55, 13, 22, 0], [0, 68, 40, 9]],
};

/** The colours, width and rng a building's seed gives, in the order drawBuilding takes them. */
function choices(b) {
  const [, widths] = DEFS[b.type];
  // mix the seed first: neighbouring seeds would otherwise make similar choices
  const rng = seeded(Math.floor(seeded((b.seed ?? 1) * 97 + Object.keys(DEFS).indexOf(b.type))() * 4294967296));
  const wall = b.wall ?? WALL_COLORS[Math.floor(rng() * WALL_COLORS.length)];
  const roof = b.roof ?? ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)];
  const w = widths[Math.floor(rng() * widths.length)];
  return { rng, wall, roof, w };
}
const SIZES = new Map();
/** A building's size at scale 1 for its seed (and shop type): { w, h }, h measured from its drawing. */
function sizeAt1(b) {
  const key = `${b.type}|${b.seed ?? 1}|${b.shopType ?? ''}|${b.wall ?? ''}|${b.roof ?? ''}`;
  if (SIZES.has(key)) return SIZES.get(key);
  const { rng, wall, roof, w } = choices(b);
  let h = 0;
  DEFS[b.type][2]((c, dx, up, rw, rh) => { if (rw > 0 && rh > 0) h = Math.max(h, up + rh); }, rng, b, wall, roof, w);
  const size = { w, h };
  SIZES.set(key, size);
  return size;
}

/**
 * Every building: type -> { label, w, h, widths } (pixels): w and h are the
 * largest any seed makes it (roof and all), so a card sized from them fits
 * every seed; widths are the widths a seed picks from.
 */
export const BUILDINGS = Object.fromEntries(Object.entries(DEFS).map(([type, [label, widths]]) => {
  let w = 0, h = 0;
  for (let seed = 1; seed <= 40; seed++) { const s = sizeAt1({ type, seed }); w = Math.max(w, s.w); h = Math.max(h, s.h); }
  return [type, { label, w, h, widths }];
}));

/**
 * Draw one building into a 2D context `g`, centred on b.x with its ground
 * line (the bottom of the front wall) at b.y. Its seed (b.seed) picks its
 * width, floors, windows, doors, roof and colours. Draw people standing in
 * front of it after it, and people behind it (smaller y) before it.
 */
export function drawBuilding(g, b) {
  if (!DEFS[b.type]) return;
  const k = b.scale ?? 1, { rng, wall, roof, w } = choices(b);
  const L = Math.round(b.x - Math.round(w * k) / 2), y = Math.round(b.y);
  DEFS[b.type][2](painter(g, L, y, k, b.dpx ?? 1), rng, b, wall, roof, w);
}

/**
 * r(colour, dx, up, w, h) drawing from (L, y) upward. At a scale, each
 * rectangle's edges are scaled and rounded, so the pixels stay as crisp as
 * the people's (a 1 px line becomes 1 or 2 px).
 */
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
 * Every door and window on its own (the kit the buildings are made from):
 * id -> [label, w, h, draw(r, rng)]. Doors are 12 tall, windows 6 (tall
 * ones 8); a window's sill sticks out a pixel each side.
 */
const PART_DEFS = {
  'door.wood': ['Wooden door', 6, 12, (r) => DOORS.wood(r, 0)],
  'door.plank': ['Plank door', 6, 12, (r) => DOORS.plank(r, 0)],
  'door.glazed': ['Café door', 6, 12, (r) => DOORS.glazed(r, 0)],
  'door.glass': ['Glass door', 6, 12, (r) => DOORS.glass(r, 0)],
  'door.steel': ['Flat door (steel)', 6, 12, (r) => DOORS.steel(r, 0)],
  'door.arched': ['Arched door', 6, 12, (r) => DOORS.arched(r, 0)],
  'door.auto': ['Automatic doors', 10, 12, (r) => DOORS.auto(r, 0)],
  'door.sliding': ['Sliding lattice doors', 10, 12, (r) => DOORS.sliding(r, 0)],
  'door.shoji': ['Shoji doors', 10, 12, (r) => DOORS.shoji(r, 0)],
  'door.garage': ['Roller shutter', 18, 14, (r) => DOORS.garage(r, 0)],
  'window.sash': ['Window', 7, 6, (r, rng) => WINDOWS.sash(r, rng, 1, 0)],
  'window.pair': ['Pair of windows', 11, 6, (r, rng) => WINDOWS.sash(r, rng, 1, 0, 9)],
  'window.alu': ['Aluminium window', 5, 6, (r, rng) => WINDOWS.alu(r, rng, 0, 0)],
  'window.aluPair': ['Sliding aluminium window', 9, 6, (r, rng) => WINDOWS.alu(r, rng, 0, 0, 9)],
  'window.tall': ['Tall window', 5, 8, (r, rng) => WINDOWS.tall(r, rng, 0, 0)],
  'window.shuttered': ['Shuttered window', 7, 8, (r, rng) => WINDOWS.shuttered(r, rng, 1, 0, '#3c4a5a')],
  'window.arched': ['Arched window', 5, 8, (r, rng) => WINDOWS.arched(r, rng, 0, 0)],
  'window.pointed': ['Pointed window', 5, 8, (r) => WINDOWS.pointed(r, 0, 0, '#3f8f6a')],
  'window.stained': ['Stained glass', 5, 8, (r) => WINDOWS.stained(r, 0, 0)],
  'window.round': ['Round window', 4, 4, (r) => WINDOWS.round(r, 0, 0)],
  'window.lattice': ['Lattice window', 11, 6, (r) => WINDOWS.lattice(r, 0, 0, 11)],
  'window.shoji': ['Shoji window', 5, 6, (r) => WINDOWS.shoji(r, 0, 0)],
  'window.leaded': ['Leaded window', 5, 6, (r, rng) => WINDOWS.leaded(r, rng, 0, 0)],
  'window.neon': ['Neon-lit window', 5, 6, (r, rng) => WINDOWS.neon(r, rng, 0, 0)],
  'window.shop': ['Shop glass', 18, 12, (r) => WINDOWS.shop(r, 0, 0, 18)],
};
/** The doors and windows: id -> { label, w, h }. */
export const PARTS = Object.fromEntries(Object.entries(PART_DEFS).map(([id, [label, w, h]]) => [id, { label, w, h }]));
/** Draw one door or window { part, x, y, seed, scale }: centred on x, its bottom at y. */
export function drawPart(g, p) {
  const def = PART_DEFS[p.part];
  if (!def) return;
  const k = p.scale ?? 1;
  def[3](painter(g, Math.round(p.x - Math.round(def[1] * k) / 2), Math.round(p.y), k), seeded((p.seed ?? 1) * 131 + 7));
}

/** A building's size in pixels for its seed, at its scale (b.scale, 1 by default): { w, h }. */
export function buildingSize(b) {
  const { w, h } = sizeAt1(b), k = b.scale ?? 1;
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/**
 * The ground a building takes, as rectangles { x, y, w, h } in the canvas:
 * its whole picture (nobody walks behind a building), or for a torii and a
 * gas station only the posts, pumps and kiosk (you walk through and under).
 */
export function buildingSolids(b) {
  const { w, h } = buildingSize(b), k = b.scale ?? 1;
  const L = Math.round(b.x - w / 2), y = Math.round(b.y);
  if (OPEN[b.type]) return OPEN[b.type].map(([dx, sw, top, bottom]) => {
    const x0 = Math.round(dx * k), x1 = Math.max(x0 + 1, Math.round((dx + sw) * k));
    return { x: L + x0, y: y - Math.round(top * k), w: x1 - x0, h: Math.round(top * k) - Math.round(bottom * k) + 1 };
  });
  return [{ x: L, y: y - h, w, h: h + 1 }];
}

/**
 * A street to stand buildings along: the sidewalk from `baseY` (the
 * buildings' ground line), the road, the far sidewalk, then grass.
 */
export function drawStreet(g, W, H, { baseY = Math.round(H * 0.7), x0 = 0 } = {}) {
  const side = 8, road = 20;
  g.fillStyle = '#9fb08d'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#d8d2c4'; g.fillRect(0, baseY, W, side);
  g.fillStyle = '#c4bdae'; for (let x = -((x0) % 8); x < W; x += 8) g.fillRect(x, baseY, 1, side);
  g.fillStyle = '#9a9890'; g.fillRect(0, baseY + side, W, 1);
  g.fillStyle = '#6f7378'; g.fillRect(0, baseY + side + 1, W, road);
  g.fillStyle = '#e8e4d8'; for (let x = -((x0) % 16); x < W; x += 16) g.fillRect(x, baseY + side + 1 + road / 2 - 1, 8, 1);
  g.fillStyle = '#9a9890'; g.fillRect(0, baseY + side + road + 1, W, 1);
  g.fillStyle = '#d8d2c4'; g.fillRect(0, baseY + side + road + 2, W, side);
}
