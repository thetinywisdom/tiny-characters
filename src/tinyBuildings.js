// Tiny Buildings: tiny-catalogue's buildings, drawn as small pixel facades
// in the same style as the tiny people. Each one faces you (front wall, a
// little roof on top), built from a handful of rectangles plus one or two
// details that make it that building (a torii, a noren, a striped awning).
//
//   drawBuilding(g, b)    one building, ground line at b.y, centred on b.x
//   BUILDINGS             type -> { label, w, h } (width and height in pixels)
//   SHOP_TYPES            the shop's kinds (konbini, ramen, cafe ...)
//   drawStreet(g, W, H)   a street to stand them along
//
// A building: { type, x, y, seed, shopType, wall, roof }. Colours are CSS
// strings; seed picks the wall and roof colours and which windows are lit.
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

// --- the buildings ---------------------------------------------------------------
// Each: [label, width, draw(r, rng, b, wall, roof)]. The height is measured from the drawing.

const DEFS = {
  house: ['House', 44, (r, rng, b, wall) => {
    r(wall, 2, 0, 40, GF);
    pitched(r, b.roof ?? '#c8603e', 0, GF, 44, 18);
    DOORS.wood(r, 8); r(shade(wall, 0.8), 7, 12, 8, 1);                    // door and its lintel
    WINDOWS.sash(r, rng, 19, SILL, 9);
    WINDOWS.sash(r, rng, 32, SILL);
    r(shade(wall, 0.85), 2, 0, 40, 1);
  }],
  apartment: ['Apartment block', 34, (r, rng, b, wall) => {
    const top = floorAt(6);
    r(wall, 0, 0, 34, top);
    for (let n = 1; n < 6; n++) {
      const up = floorAt(n);
      for (const dx of [4, 15, 25]) WINDOWS.alu(r, rng, dx, up + SILL);
      r('#d8d4ca', 1, up + 1, 32, 1); r('#d8d4ca', 1, up + 3, 32, 1);     // balcony rail
      for (let i = 1; i < 33; i += 4) r('#d8d4ca', i, up + 1, 1, 3);
    }
    DOORS.auto(r, 12); r(shade(wall, 0.7), 11, 12, 12, 1);               // entrance and its canopy
    r(CONCRETE, 3, 3, 6, 7); for (const y of [5, 8]) r(INK, 4, y, 4, 1);  // post boxes
    WINDOWS.alu(r, rng, 26, SILL);
    flatRoof(r, wall, 0, top, 34, 12); r(CONCRETE, 21, top + 4, 7, 5); r(shade(CONCRETE, 0.8), 21, top + 4, 7, 1); r('#918f8a', 4, top + 3, 5, 3);  // water tank, AC
  }],
  mixedUse: ['Shop with flats above', 38, (r, rng, b, wall) => {
    const top = floorAt(4, SHOP_GF);
    r(wall, 0, SHOP_GF, 38, top - SHOP_GF);
    const kind = b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)];
    shopFront(r, rng, 0, 38, kind, wall);
    for (let n = 1; n < 4; n++) { WINDOWS.alu(r, rng, 5, floorAt(n, SHOP_GF) + SILL, 9); WINDOWS.alu(r, rng, 19, floorAt(n, SHOP_GF) + SILL, 9); }
    upright(r, '#2fa36b', WHITE, 32, SHOP_GF + 3, 5, top - SHOP_GF - 6, (SHOPS[kind] ?? SHOPS.konbini).name);  // vertical sign
    flatRoof(r, wall, 0, top, 38, 12); r('#918f8a', 24, top + 3, 7, 3);
  }],
  shop: ['Shop', 40, (r, rng, b, wall) => {
    shopFront(r, rng, 0, 40, b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)], wall);
    flatRoof(r, wall, 0, SHOP_GF, 40, 14); r('#918f8a', 27, SHOP_GF + 4, 7, 4); r(shade('#918f8a', 0.8), 27, SHOP_GF + 4, 7, 1);
  }],
  office: ['Office building', 32, (r, rng, b) => {
    const wall = b.wall ?? '#cfd2d4', top = floorAt(7);
    r(wall, 0, 0, 32, top);
    for (let n = 1; n < 7; n++) {                                          // a ribbon of windows on every floor
      const up = floorAt(n) + SILL;
      r(METAL, 2, up, 28, 6); r('#6f8aa6', 2, up + 1, 28, 4); for (let i = 2; i < 30; i += 4) r('#8fa8c0', i, up + 1, 1, 4);
    }
    WINDOWS.shop(r, 2, 0, 28, 12); DOORS.auto(r, 11); r(shade(wall, 0.7), 2, 13, 28, 1);
    flatRoof(r, wall, 0, top, 32, 14); r('#918f8a', 4, top + 4, 9, 6); r(shade('#918f8a', 0.8), 4, top + 4, 9, 1); r(INK, 25, top + 4, 1, 9); r(RED, 25, top + 12, 1, 1);  // plant room, antenna
  }],
  shrine: ['Shrine', 72, (r) => {                                        // a torii and the hall, side by side
    DEFS.torii[2](shifted(r, 2));
    DEFS.shrineHall[2](shifted(r, 32));
  }],
  torii: ['Torii', 26, (r) => {
    const red = '#c8402c';
    r(red, 5, 0, 2, 20); r(red, 19, 0, 2, 20); r(red, 3, 15, 20, 2);
    r(INK, 1, 20, 24, 2); r(INK, 0, 22, 1, 1); r(INK, 25, 22, 1, 1);
    r(red, 12, 17, 2, 3);
  }],
  shrineHall: ['Shrine hall', 40, (r) => {
    const hall = '#9a6a48';
    r('#c9c2b0', 4, 0, 32, 3);                                             // stone base
    r(hall, 6, 3, 28, 13);
    DOORS.shoji(r, 15, 3);
    WINDOWS.shoji(r, 8, 3 + SILL); WINDOWS.shoji(r, 27, 3 + SILL);
    pitched(r, '#3a3f44', 1, 16, 38, 16, 2); r('#2a2e33', 0, 16, 1, 2); r('#2a2e33', 39, 16, 1, 2); r(GOLD, 17, 27, 6, 1);  // flared eaves, ridge ornament
  }],
  school: ['School', 110, (r, rng, b) => {
    const wall = b.wall ?? '#e4e0d6', top = floorAt(3);
    r(wall, 0, 0, 110, top);
    for (let n = 0; n < 3; n++) for (let i = 0; i < 11; i++) {
      if (n === 0 && i === 5) continue;                                     // the entrance
      WINDOWS.alu(r, rng, 4 + i * 10, floorAt(n) + SILL, 5);
    }
    r(shade(wall, 0.8), 0, floorAt(1), 110, 1); r(shade(wall, 0.8), 0, floorAt(2), 110, 1);
    r(shade(wall, 0.9), 46, 0, 18, 14); DOORS.auto(r, 50); r(shade(wall, 0.7), 46, 13, 18, 1);
    flatRoof(r, wall, 0, top, 110, 16);
    r(wall, 48, top, 14, 11); flatRoof(r, wall, 47, top + 11, 16, 5); icon(r, 53, top + 3, ['.www.', 'wwiww', 'wwiiw', 'wwwww', '.www.'], { w: WHITE, i: INK });  // clock tower
  }],
  laundromat: ['Coin laundromat', 36, (r, rng, b, wall) => {
    r(shade(wall, 0.9), 0, 12, 36, SHOP_GF - 12);
    sign(r, '#e8e0d0', '#3f7fd6', 1, 15, 34, 4, 'LAUNDROMAT');
    WINDOWS.shop(r, 1, 0, 26, 12);
    for (let i = 3; i < 22; i += 6) { r(INK, i, 2, 4, 4); r('#7f9ab4', i + 1, 3, 2, 2); }   // washers
    DOORS.glass(r, 28);
    flatRoof(r, wall, 0, SHOP_GF, 36, 12); r('#918f8a', 25, SHOP_GF + 3, 7, 4); r(shade('#918f8a', 0.8), 25, SHOP_GF + 3, 7, 1);
  }],
  kissaten: ['Café (kissaten)', 34, (r, rng, b, wall) => {
    const top = floorAt(2);
    r(wall, 0, GF, 34, top - GF);
    r(DARKWOOD, 0, 0, 34, GF);
    WINDOWS.shop(r, 2, 0, 18, 12, WOOD, '#c9a46a');
    DOORS.glazed(r, 24);
    awning(r, RED, WHITE, -1, 12, 36, 3);
    WINDOWS.sash(r, rng, 6, floorAt(1) + SILL); WINDOWS.sash(r, rng, 23, floorAt(1) + SILL);
    pitched(r, b.roof ?? '#5a4a48', -1, top, 36, 14);
  }],
  pharmacy: ['Pharmacy', 44, (r, rng, b, wall) => {
    r(shade(wall, 0.9), 0, 12, 44, SHOP_GF - 12);
    sign(r, '#eef2e8', '#2fa36b', 8, 15, 35, 4, 'PHARMACY');
    icon(r, 1, 14, CROSS, { g: '#2fa36b', w: WHITE });                        // green cross
    WINDOWS.shop(r, 1, 0, 31, 12, FRAME, '#dfe8ec');
    shelves(r, rng, 2, 1, 29, 3, [RED, '#3f7fd6', '#f2c230', '#2fa36b', WHITE, '#d46a8e']);
    DOORS.auto(r, 33);
    flatRoof(r, wall, 0, SHOP_GF, 44, 12); r('#918f8a', 30, SHOP_GF + 3, 7, 4); r(shade('#918f8a', 0.8), 30, SHOP_GF + 3, 7, 1);
  }],
  sushi: ['Sushi restaurant', 36, (r, rng, b, wall) => {
    const top = floorAt(2);
    r(wall, 0, GF, 36, top - GF);
    r(DARKWOOD, 0, 0, 36, GF);
    WINDOWS.lattice(r, 3, SILL, 14, 6);
    sign(r, LIGHTWOOD, INK, 3, 12, 14, 3, 'SUSHI');                         // name board
    DOORS.sliding(r, 22); noren(r, NAVY, 21, 8, 12);
    for (const dx of [5, 15, 26]) WINDOWS.alu(r, rng, dx, floorAt(1) + SILL);
    r('#4a4442', -1, GF - 1, 38, 1);
    pitched(r, b.roof ?? '#4a4442', -1, top, 38, 14);
  }],
  florist: ['Flower shop', 32, (r, rng, b, wall) => {
    const top = floorAt(3, SHOP_GF);
    r(wall, 0, 0, 32, top);
    WINDOWS.shop(r, 1, 0, 22, 12); DOORS.glass(r, 24);
    awning(r, RED, WHITE, -1, 12, 34, 3); sign(r, WHITE, '#d46a8e', 3, 15, 26, 4, 'FLOWERS');
    for (let n = 1; n < 3; n++) { WINDOWS.alu(r, rng, 5, floorAt(n, SHOP_GF) + SILL); WINDOWS.alu(r, rng, 21, floorAt(n, SHOP_GF) + SILL); }
    for (const dx of [1, 6, 11, 16]) { r('#8a6440', dx, 0, 4, 2); dots(r, rng, dx, 2, 4, [RED, '#f2c230', '#d46a8e', WHITE, '#7a6aa8']); r('#5f8f5a', dx + 1, 3, 2, 1); }
    flatRoof(r, wall, 0, top, 32, 10); for (const dx of [3, 9, 15]) { r('#8a6440', dx, top + 2, 5, 3); r('#5f8f5a', dx + 1, top + 4, 3, 2); }  // roof garden
  }],
  fishmonger: ['Fishmonger', 40, (r, rng, b, wall) => {
    r(shade(wall, 0.9), 0, 12, 40, SHOP_GF - 12);
    r('#3a3f44', 0, 0, 40, 12);                                             // open to the street
    r('#dfe8ec', 2, 0, 36, 5); r(WHITE, 1, 5, 38, 1);                      // ice counter
    for (let i = 4; i < 36; i += 4) r(rng() < 0.5 ? '#b3b0a8' : '#d8b0a0', i, 3, 2, 1);   // fish on the ice
    awning(r, NAVY, WHITE, -1, 12, 42, 3); sign(r, WHITE, NAVY, 1, 15, 38, 4, 'FISH');
    flatRoof(r, wall, 0, SHOP_GF, 40, 12);
  }],
  udonSoba: ['Udon / soba shop', 36, (r, rng, b, wall) => {
    const top = floorAt(2);
    r(wall, 0, GF, 36, top - GF);
    r(WOOD, 0, 0, 36, GF);
    WINDOWS.lattice(r, 3, SILL, 14, 6);
    sign(r, LIGHTWOOD, INK, 3, 12, 14, 3, 'UDON');                          // name board
    DOORS.sliding(r, 22); noren(r, '#3a5a7a', 21, 8, 12); lantern(r, 18, 6);
    WINDOWS.alu(r, rng, 6, floorAt(1) + SILL, 9); WINDOWS.alu(r, rng, 22, floorAt(1) + SILL, 9);
    r('#3a3f44', -1, GF - 1, 38, 1);
    pitched(r, b.roof ?? '#3a3f44', -1, top, 38, 14);
  }],
  familyRestaurant: ['Family restaurant', 72, (r0, rng, b) => {
    r0(INK, 3, 0, 1, 22); sign(r0, '#2fa36b', WHITE, 0, 22, 7, 5, 'DINER');   // pole sign
    const r = shifted(r0, 8);
    const wall = b.wall ?? '#b89e80';
    r(wall, 0, 0, 64, GF);
    for (const dx of [2, 12, 22, 32, 42]) WINDOWS.shop(r, dx, 2, 9, 10, '#a03a2c');   // big windows to the booths
    DOORS.glass(r, 54);
    pitched(r, '#d0603e', -1, GF, 66, 14, 2); r('#2fa36b', -1, GF, 66, 1);  // red hipped roof, green trim
  }],
  takoyaki: ['Takoyaki stand', 20, (r) => {
    r('#e8e0d0', 0, 0, 20, SHOP_GF);
    flatRoof(r, '#e8e0d0', 0, SHOP_GF, 20, 8);
    r('#3a3f44', 1, 6, 18, 6);                                              // the opening
    r(DARKWOOD, 0, 0, 20, 6); r(LIGHTWOOD, 0, 5, 20, 1);
    for (let i = 3; i < 17; i += 4) r('#c09060', i, 6, 2, 1);               // takoyaki balls
    awning(r, '#f08a2c', '#f4e6c8', -1, 12, 22, 3);
    sign(r, '#e0d2b0', '#7a3a32', 0, 15, 20, 6, 'TAKOYAKI');
    lantern(r, 1, 8);
  }],
  koban: ['Koban (police box)', 42, (r0) => {
    // a bicycle out front
    r0(INK, 0, 0, 3, 3); r0(INK, 5, 0, 3, 3); r0('#d8d0c0', 1, 1, 1, 1); r0('#d8d0c0', 6, 1, 1, 1); r0('#3f7fd6', 2, 3, 5, 1); r0(INK, 4, 4, 1, 1);
    const r = shifted(r0, 11);
    const wall = '#9a7c60';
    r(wall, 0, 0, 30, GF);
    WINDOWS.shop(r, 2, 0, 14, 12); DOORS.glass(r, 19);
    sign(r, NAVY, WHITE, 1, 12, 16, 4, 'KOBAN');
    r(shade(wall, 0.8), 20, 12, 4, 1); r(RED, 21, 13, 2, 2); r(WHITE, 21, 14, 1, 1);   // the red lamp over the door
    flatRoof(r, wall, -1, GF, 32, 12); r('#e8dcc0', -1, GF, 32, 1);
  }],
  postOffice: ['Post office', 62, (r, rng) => {
    const wall = '#e8e0d0';
    r(wall, 0, 0, 56, GF);
    r(RED, 0, 12, 56, 4); sign(r, RED, WHITE, 9, 12, 34, 4, 'POST OFFICE'); icon(r, 3, 12, ['wwwww', '.....', 'wwwww', '..w..'], { w: WHITE });  // 〒 and the name
    for (const dx of [2, 12, 22, 32]) { WINDOWS.alu(r, rng, dx, SILL, 9); r(rng() < 0.5 ? '#f2c230' : '#3f7fd6', dx + 2, SILL + 1, 2, 3); }  // posters
    DOORS.auto(r, 43);
    flatRoof(r, wall, 0, GF, 56, 14); r(RED, 0, GF, 56, 2); r('#918f8a', 40, GF + 4, 8, 4);
    r(RED, 58, 0, 3, 6); r(INK, 58, 4, 3, 1);                               // post box
  }],
  bank: ['Bank', 46, (r, rng) => {
    const wall = '#6a5848', top = floorAt(3);
    r(wall, 0, 0, 46, top);
    for (let n = 1; n < 3; n++) for (const dx of [4, 12, 20, 28, 36]) WINDOWS.alu(r, rng, dx, floorAt(n) + SILL);
    sign(r, '#c8302a', WHITE, 2, 12, 42, 4, 'BANK');
    WINDOWS.shop(r, 2, 0, 25, 12); DOORS.auto(r, 29);
    r(CONCRETE, 41, 0, 4, 10); r(INK, 42, 5, 2, 3);                         // ATM
    flatRoof(r, wall, 0, top, 46, 12); r('#918f8a', 6, top + 3, 8, 4); r(shade('#918f8a', 0.8), 6, top + 3, 8, 1);
  }],
  clinic: ['Clinic', 40, (r, rng) => {
    const wall = '#b9b8b0', top = floorAt(2);
    r(wall, 0, 0, 40, top);
    sign(r, WHITE, '#2fa36b', 2, 12, 36, 4, 'CLINIC');
    WINDOWS.shop(r, 2, 0, 23, 12, FRAME, '#dfe8ec'); DOORS.glass(r, 29);
    icon(r, 5, floorAt(1) + SILL, CROSS, { g: '#2fa36b', w: WHITE });       // green cross
    WINDOWS.alu(r, rng, 15, floorAt(1) + SILL, 9); WINDOWS.alu(r, rng, 28, floorAt(1) + SILL, 9);
    flatRoof(r, wall, 0, top, 40, 12);
  }],
  fireStation: ['Fire station', 56, (r, rng) => {
    const wall = '#d8d0c4', top = floorAt(2, SHOP_GF);
    r(wall, 0, 0, 46, top);
    DOORS.garage(r, 3); DOORS.garage(r, 25);
    r('#a83028', 0, 15, 46, 2);
    for (const dx of [4, 15, 26, 37]) WINDOWS.alu(r, rng, dx, floorAt(1, SHOP_GF) + SILL);
    flatRoof(r, wall, 0, top, 46, 14);
    r('#b9b0a4', 46, 0, 10, 55); for (const up of [SHOP_GF + SILL, 32 + SILL, 45]) WINDOWS.alu(r, rng, 49, up, 4);   // hose tower
    flatRoof(r, '#b9b0a4', 46, 55, 10, 6); r(RED, 50, 57, 2, 3);
  }],
  karaoke: ['Karaoke', 34, (r, rng) => {
    const wall = '#2a2a30', top = floorAt(4);
    r(wall, 0, 0, 34, top);
    for (let n = 1; n < 4; n++) for (const dx of [3, 12, 21]) WINDOWS.neon(r, rng, dx, floorAt(n) + SILL);
    upright(r, WHITE, '#d8302a', 29, GF + 1, 4, top - GF - 3, 'KARAOKE', [RED, '#3f7fd6', '#d46a8e', '#f2c230']);  // vertical sign
    WINDOWS.shop(r, 2, 0, 18, 12, FRAME, '#7a6aa8'); DOORS.glass(r, 22); r('#f2a040', 2, 13, 26, 2);
    flatRoof(r, wall, 0, top, 34, 12); r('#918f8a', 5, top + 3, 7, 4);
  }],
  woodApartment: ['Wooden apartment', 48, (r, rng) => {
    const wall = '#b8ae9c', top = floorAt(2);
    r(wall, 0, 0, 42, top);
    for (let n = 0; n < 2; n++) for (const ux of [2, 16, 30]) { DOORS.steel(r, ux, floorAt(n), '#8a6a4a'); WINDOWS.alu(r, rng, ux + 7, floorAt(n) + SILL); }
    r('#7a6a5a', 0, GF, 42, 1); r('#7a6a5a', 0, GF + 3, 42, 1); for (let i = 0; i < 42; i += 4) r('#7a6a5a', i, GF, 1, 3);  // corridor rail
    for (let k = 0; k < 8; k++) r('#7a6a5a', 42 + k * 0.75 | 0, GF - k * 2, 2, 1);                                         // outside stairs
    r('#7a6a5a', 46, 0, 1, GF + 1);
    flatRoof(r, wall, 0, top, 42, 12);
  }],
  parkingGarage: ['Parking garage', 56, (r, rng) => {
    const slab = '#c9c4ba';
    for (let l = 0; l < 3; l++) {
      const up = l * FL;
      r('#3a3f44', 0, up, 56, FL); r(slab, 0, up + 11, 56, 2);
      for (let i = 4; i < 48; i += 10) if (rng() < 0.7) { const c = ['#e8402f', WHITE, '#3f7fd6', INK, '#b3b0a8'][Math.floor(rng() * 5)]; r(c, i, up + 2, 7, 3); r(c, i + 1, up + 5, 5, 2); r(GLASS, i + 2, up + 5, 3, 1); }
    }
    r(slab, 0, 0, 2, 39); r(slab, 27, 0, 2, 39); r(slab, 54, 0, 2, 39);
    flatRoof(r, slab, 0, 39, 56, 14);                                      // the top deck, cars parked on it
    for (let i = 5; i < 44; i += 9) if (rng() < 0.6) { const c = ['#e8402f', WHITE, '#3f7fd6', INK][Math.floor(rng() * 4)]; r(c, i, 43, 5, 7); r(GLASS, i + 1, 47, 3, 2); }
    icon(r, 48, 40, ['bbbbb', 'bwwwb', 'bwbwb', 'bwwwb', 'bwbbb', 'bwbbb', 'bbbbb'], { b: '#3f7fd6', w: WHITE });  // P
  }],
  gasStation: ['Gas station', 68, (r0, rng) => {
    const r = shifted(r0, 4);
    r(CONCRETE, 10, 0, 2, 20); r(CONCRETE, 46, 0, 2, 20);
    r('#e4e2dc', 4, 24, 52, 12); r('#d4d2cc', 4, 24, 52, 1); r(WHITE, 4, 20, 52, 4); r(RED, 4, 21, 52, 1);  // canopy, its top
    for (const dx of [20, 34]) { r(RED, dx, 0, 4, 8); r(WHITE, dx + 1, 4, 2, 2); r(INK, dx + 1, 1, 2, 1); }  // pumps
    r('#e8e0d0', 51, 0, 13, GF); DOORS.glass(r, 52); WINDOWS.alu(r, rng, 59, SILL, 4); flatRoof(r, '#e8e0d0', 51, GF, 13, 6);  // kiosk
    r(INK, 0, 0, 1, 22); r(WHITE, -3, 22, 7, 8); r(RED, -2, 27, 5, 2); r(INK, -2, 23, 5, 1); r(INK, -2, 25, 5, 1);  // price sign
  }],
  tudorCottage: ['Tudor cottage', 36, (r, rng) => {
    const wall = '#ece0c4', beam = '#3a2a22', top = floorAt(2);
    r(wall, 0, 0, 36, top);
    r(beam, 0, 0, 1, top); r(beam, 35, 0, 1, top); r(beam, 0, GF, 36, 1); r(beam, 0, top - 1, 36, 1);
    for (const dx of [8, 27]) r(beam, dx, 0, 1, top);
    for (let k = 0; k < 5; k++) { r(beam, 1 + k, GF + 1 + k * 2, 1, 2); r(beam, 34 - k, GF + 1 + k * 2, 1, 2); }   // braces
    DOORS.plank(r, 15); r(beam, 14, 12, 8, 1);
    WINDOWS.leaded(r, rng, 2, SILL); WINDOWS.leaded(r, rng, 29, SILL);
    WINDOWS.leaded(r, rng, 11, floorAt(1) + SILL); WINDOWS.leaded(r, rng, 20, floorAt(1) + SILL);
    gable(r, '#4a3a32', wall, -2, top, 40, 14, 12);
    r(beam, 17, top, 2, 10); r(beam, 10, top + 4, 16, 1);                 // beams in the gable
    r('#9a4a3a', 28, top + 16, 4, 9); r(INK, 28, top + 24, 4, 1);         // chimney
  }],
  mediterraneanVilla: ['Mediterranean villa', 44, (r, rng) => {
    const wall = '#f0e8d8', shut = '#3f5f9a', top = floorAt(2);
    r(wall, 0, 0, 44, top);
    for (const dx of [5, 14, 25, 34]) WINDOWS.shuttered(r, rng, dx, floorAt(1) + 3, shut, NAVY);
    for (const dx of [5, 34]) { WINDOWS.shuttered(r, rng, dx, 3, shut, NAVY); r('#a8664a', dx, 1, 5, 2); r('#5f8f5a', dx + 1, 3, 3, 1); }  // flower boxes
    DOORS.arched(r, 19, 0, '#6a4a3a'); r(shade(wall, 0.85), 18, 0, 1, 12); r(shade(wall, 0.85), 25, 0, 1, 12);
    pitched(r, '#c0603a', -2, top, 48, 15, 3);
  }],
  dutchCanalHouse: ['Dutch canal house', 24, (r, rng) => {
    const wall = '#6a5a8a', trim = '#f2efe8', top = floorAt(4);
    r(wall, 0, 0, 24, top);
    for (let n = 1; n < 4; n++) for (const dx of [4, 15]) WINDOWS.tall(r, rng, dx, floorAt(n) + 3, trim);
    WINDOWS.tall(r, rng, 4, 3, trim);
    DOORS.wood(r, 15, 0, '#2a4a3a'); r(trim, 14, 12, 8, 1); r(GLASS, 15, 13, 6, 2);   // door and its transom light
    const half = 12;                                                       // the roof behind the gable
    r(shade('#5a5450', 0.8), 2, top, half - 2, 11); r('#5a5450', half, top, half - 2, 11);
    [[0, 24], [3, 18], [6, 12], [9, 6]].forEach(([inset, w], i) => { r(wall, inset, top + i * 3, w, 3); r(trim, inset, top + 2 + i * 3, w, 1); });  // stepped gable
    r(trim, 11, top + 12, 2, 2); WINDOWS.round(r, 10, top + 3);
  }],
  frenchCountryHouse: ['French country house', 42, (r, rng) => {
    const wall = '#c8b08c', shut = '#3c4a5a', top = floorAt(2);
    r(wall, 0, 0, 42, top);
    for (const dx of [5, 18, 31]) WINDOWS.shuttered(r, rng, dx, floorAt(1) + 3, shut);
    for (const dx of [5, 18]) WINDOWS.shuttered(r, rng, dx, 3, shut);
    DOORS.wood(r, 31); r(shade(wall, 0.8), 30, 12, 8, 1);
    pitched(r, '#3a3f44', -2, top, 46, 18, 3);
    for (const dx of [10, 27]) { r(wall, dx, top + 2, 6, 6); WINDOWS.sash(r, rng, dx + 1, top + 2, 4); pitched(r, '#3a3f44', dx - 1, top + 8, 8, 3, 3); }  // dormers
    r('#9a7c60', 6, top + 12, 4, 8); r('#9a7c60', 32, top + 12, 4, 8); r(INK, 6, top + 19, 4, 1); r(INK, 32, top + 19, 4, 1);  // chimneys
  }],
  scandinavianHouse: ['Scandinavian house', 40, (r, rng) => {
    const wall = '#a83a32', top = floorAt(2);
    r(wall, 0, 0, 40, top);
    for (let i = 2; i < 40; i += 4) r(shade(wall, 0.82), i, 0, 1, top);   // planks
    r(WHITE, 0, 0, 1, top); r(WHITE, 39, 0, 1, top);
    for (const dx of [5, 30]) WINDOWS.sash(r, rng, dx, SILL);
    for (const dx of [6, 17, 28]) WINDOWS.sash(r, rng, dx, floorAt(1) + SILL);
    r(WHITE, 16, 0, 8, 13); DOORS.wood(r, 17, 0, '#2f4a5a');
    pitched(r, '#3a3f44', -2, top, 44, 16);
    r(shade(wall, 0.7), 29, top + 9, 4, 8); r(INK, 29, top + 16, 4, 1);   // chimney
  }],
  // Not in tiny-catalogue: the owner asked for it. The seed picks the wall,
  // the dome (colour, size), one or two minarets (height, which side), small
  // side domes, how many arched windows and the trim colour.
  mosque: ['Mosque', 56, (r, rng) => {
    const pick = (a) => a[Math.floor(rng() * a.length)];
    const wall = pick(['#f2efe8', '#e8dcc0', '#dcc49c', '#e6d6c4']);
    const domeC = pick(['#3f8f6a', '#d8a840', '#3f6fa8', '#e8e8e0', '#3fa8a0']);
    const trim = pick(['#3f8f6a', '#3f6fa8', '#3fa8a0', '#b8603a']);
    const wallH = 18 + Math.floor(rng() * 4), rad = 7 + Math.floor(rng() * 4);
    const minarets = rng() < 0.55 ? 2 : 1, leftOnly = rng() < 0.5, tall = 50 + Math.floor(rng() * 14);
    const sideDomes = rng() < 0.5, perSide = 1 + Math.floor(rng() * 2);
    // the prayer hall: walls, a trim band, pointed windows, the tall entrance
    r(wall, 6, 0, 44, wallH); r(shade(wall, 0.85), 6, 0, 44, 1);
    r(trim, 6, wallH - 3, 44, 1);
    for (const base of [6, 35]) for (let i = 0; i < perSide; i++) WINDOWS.pointed(r, base + (perSide === 1 ? 5 : 1 + i * 8), 3, trim);
    flatRoof(r, wall, 6, wallH, 44, 12);
    if (sideDomes) for (const cx of [14, 41]) { r(wall, cx - 3, wallH + 3, 7, 2); dome(r, domeC, cx, wallH + 5, 3); }
    r(wall, 28 - rad - 1, wallH + 4, rad * 2 + 3, 3);                           // the drum under the dome
    dome(r, domeC, 28, wallH + 7, rad);
    r(GOLD, 28, wallH + 8 + rad, 1, 3); r(GOLD, 27, wallH + 11 + rad, 1, 1); r(GOLD, 29, wallH + 12 + rad, 1, 1);  // finial and crescent
    r(wall, 19, 0, 18, wallH + 6); r(shade(wall, 0.85), 19, wallH + 5, 18, 1);  // the entrance front (iwan), taller than the hall
    pointedArch(r, trim, 21, 0, 14, wallH + 3); pointedArch(r, shade(trim, 0.6), 23, 0, 10, wallH);
    DOORS.arched(r, 25); r(GOLD, 27, 14, 2, 2);
    // minarets: a shaft, a balcony, a small dome and a finial
    for (const dx of minarets === 2 ? [0, 51] : [leftOnly ? 0 : 51]) {
      r(wall, dx, 0, 5, tall); r(shade(wall, 0.85), dx + 3, 0, 2, tall);
      r(trim, dx, Math.round(tall * 0.45), 5, 1);
      r(shade(wall, 0.75), dx - 1, Math.round(tall * 0.75), 7, 2); r(trim, dx - 1, Math.round(tall * 0.75) + 2, 7, 1);  // balcony
      pointedArch(r, NAVY, dx + 2, Math.round(tall * 0.55), 1, 4);
      dome(r, domeC, dx + 2, tall, 2); r(GOLD, dx + 2, tall + 3, 1, 3);
    }
  }],
  stoneChapel: ['Stone chapel', 34, (r) => {
    const wall = '#8f8a80', top = 24;
    r(wall, 0, 0, 34, top);
    for (let up = 2; up < top; up += 3) for (let i = (up % 2) * 2; i < 34; i += 5) r(shade(wall, 0.85), i, up, 2, 1);  // stones
    r(shade(wall, 0.7), 13, 0, 8, 13); DOORS.arched(r, 14, 0, DARKWOOD);       // the door in its stone arch
    WINDOWS.round(r, 15, 15);
    WINDOWS.stained(r, 4, SILL); WINDOWS.stained(r, 25, SILL);
    gable(r, '#2f2a2a', wall, -2, top, 38, 16, 16);
    r(wall, 14, 38, 6, 12); r(INK, 16, 43, 2, 4);                            // bell tower on the front of the roof
    for (let k = 0; k < 4; k++) r('#2f2a2a', 13 + k, 50 + k, 8 - k * 2, 1);
    icon(r, 15, 54, ['.g.', 'ggg', '.g.', '.g.', '.g.'], { g: GOLD });     // cross
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

/** How tall a drawing is: the top of its highest rectangle, the tallest of its seeds. */
function measure(draw) {
  let top = 0;
  for (let seed = 1; seed <= 40; seed++) draw((c, dx, up, w, h) => { if (w > 0 && h > 0) top = Math.max(top, up + h); }, seeded(seed * 97), {}, WALL_COLORS[0], ROOF_COLORS[0]);
  return top;
}

/** Every building: type -> { label, w, h } (pixels; h measured from its drawing, roof and all). */
export const BUILDINGS = Object.fromEntries(Object.entries(DEFS).map(([k, [label, w, draw]]) => [k, { label, w, h: measure(draw) }]));

/**
 * Draw one building into a 2D context `g`, centred on b.x with its ground
 * line (the bottom of the front wall) at b.y. Draw people standing in front
 * of it after it, and people behind it (smaller y) before it.
 */
export function drawBuilding(g, b) {
  const def = DEFS[b.type];
  if (!def) return;
  const [, w, draw] = def;
  const k = b.scale ?? 1;
  const L = Math.round(b.x - Math.round(w * k) / 2), y = Math.round(b.y);
  const rng = seeded((b.seed ?? 1) * 97 + Object.keys(DEFS).indexOf(b.type));
  const wall = b.wall ?? WALL_COLORS[Math.floor(rng() * WALL_COLORS.length)];
  const roof = b.roof ?? ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)];
  draw(painter(g, L, y, k, b.dpx ?? 1), rng, b, wall, roof);
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

/** A building's size in pixels at its scale (b.scale, 1 by default): { w, h }. */
export function buildingSize(b) {
  const { w, h } = BUILDINGS[b.type], k = b.scale ?? 1;
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
