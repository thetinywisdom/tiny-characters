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

const win = (r, rng, dx, up, w = 5, h = 6) => r(rng() < 0.2 ? LIT : rng() < 0.2 ? CURTAIN : WIN, dx, up, w, h);
/** n windows spread evenly between dx0 and dx1. */
function windows(r, rng, dx0, dx1, up, n, w = 5, h = 6) {
  const gap = (dx1 - dx0 - n * w) / (n + 1);
  for (let i = 0; i < n; i++) win(r, rng, Math.round(dx0 + gap + i * (w + gap)), up, w, h);
}
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
    r(k < f ? (k % 3 === 2 ? shade(c, 0.86) : c) : k === f ? shade(c, 1.3) : shade(c, 0.8), dx, up + k, w, 1);
    const end = Math.min(Math.floor(w / 2), Math.floor((k < f ? k : f - (k - f)) * hip / 3));
    if (end > 0) { r(side, dx, up + k, end, 1); r(side, dx + w - end, up + k, end, 1); }   // the hipped ends
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
  for (let y = up + 2; y < up + gh + d; y += 3) { r(shade(c, 0.65), dx, y, half, 1); r(shade(c, 0.86), dx + half, y, w - half, 1); }
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
function sign(r, bg, fg, dx, up, w, h = 4) {
  r(bg, dx, up, w, h);
  for (let i = 2; i < w - 2; i++) if (i % 3 !== 1) r(fg, dx + i, up + (h > 3 ? 1 : 1), 1, h - 2);
}
/** Shop glass with a frame line every 6 px. */
function glass(r, dx, up, w, h, c = GLASS) { r(c, dx, up, w, h); for (let i = 6; i < w; i += 6) r(shade(c, 0.7), dx + i, up, 1, h); }
const door = (r, c, dx, w = 6, h = 13) => r(c, dx, 0, w, h);
const lantern = (r, dx, up) => { r(RED, dx, up, 2, 3); r(INK, dx, up + 3, 2, 1); };
/** A noren: a short curtain over a doorway, cut into strips. */
function noren(r, c, dx, up, w) { r(c, dx, up, w, 4); for (let i = 2; i < w; i += 3) r(shade(c, 0.6), dx + i, up, 1, 3); }
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

// --- shop fronts (the catalogue's shop types) ------------------------------------
export const SHOP_TYPES = ['konbini', 'ramen', 'cafe', 'bookshop', 'bakery', 'izakaya'];
const SHOPS = {
  konbini: { bg: WHITE, fg: '#1f4fa8', stripes: ['#2fa36b', '#f08a2c', '#1f4fa8'] },
  ramen: { bg: '#d8302a', fg: WHITE, noren: NAVY, lantern: true },
  cafe: { bg: '#5a3a28', fg: '#f4e6c8', awning: ['#2fa36b', WHITE] },
  bookshop: { bg: '#1f4fa8', fg: WHITE, books: true },
  bakery: { bg: '#f2c230', fg: '#5a3a28', awning: [RED, WHITE] },
  izakaya: { bg: '#2a2a30', fg: '#f2c230', noren: '#5a3a28', lantern: true },
};
/** A shop's ground floor, h tall: sign, then glass or a wooden front. */
function shopFront(r, rng, dx, w, kind, h = 20) {
  const s = SHOPS[kind] ?? SHOPS.konbini;
  sign(r, s.bg, s.fg, dx, h - 5, w, 5);
  let top = h - 5;
  if (s.stripes) { s.stripes.forEach((c, i) => r(c, dx, top - 1 - i, w, 1)); top -= 3; }
  if (s.awning) { awning(r, s.awning[0], s.awning[1], dx - 1, top - 3, w + 2); top -= 3; }
  const dw = 6, ddx = dx + w - dw - 3;
  if (s.noren) {
    r(DARKWOOD, dx, 0, w, top);
    r(LIGHTWOOD, dx + 3, 4, ddx - dx - 6, top - 7);                // lattice window
    for (let i = dx + 5; i < ddx - 3; i += 3) r(DARKWOOD, i, 4, 1, top - 7);
    door(r, INK, ddx, dw, top);
    noren(r, s.noren, ddx - 1, top - 5, dw + 2);
    if (s.lantern) lantern(r, ddx - 4, top - 7);
  } else {
    glass(r, dx + 1, 0, w - 2, top);
    if (s.books) for (let row = 2; row < top - 2; row += 3) dots(r, rng, dx + 2, row, ddx - dx - 3, [RED, '#3f7fd6', '#f2c230', '#5f8f5a', WHITE, '#7a6aa8']);
    door(r, GLASS2, ddx, dw, top);
    r(shade(GLASS, 0.6), ddx, top - 1, dw, 1);
  }
}

// --- the buildings ---------------------------------------------------------------
// Each: [label, width, draw(r, rng, b, wall, roof)]. The height is measured from the drawing.

const DEFS = {
  house: ['House', 44, (r, rng, b, wall, roof) => {
    r(wall, 2, 0, 40, 18);
    pitched(r, b.roof ?? '#c8603e', 0, 18, 44, 18);
    door(r, WOOD, 7); r(GOLD, 11, 6);
    win(r, rng, 19, 6, 7, 6); win(r, rng, 31, 6, 7, 6);
    r(shade(wall, 0.85), 2, 0, 40, 1);
  }],
  apartment: ['Apartment block', 34, (r, rng, b, wall) => {
    r(wall, 0, 0, 34, 83);
    for (let f = 0; f < 5; f++) {
      const up = 18 + f * 13;
      windows(r, rng, 0, 34, up + 4, 3, 6, 6);
      r('#d8d4ca', 1, up + 1, 32, 1); r('#d8d4ca', 1, up + 4, 32, 1);   // balcony rail
      for (let i = 1; i < 33; i += 4) r('#d8d4ca', i, up + 1, 1, 3);
    }
    door(r, GLASS2, 14, 6, 13); r(shade(wall, 0.8), 13, 13, 8, 1);
    r(CONCRETE, 4, 3, 4, 5); r(INK, 5, 6, 2, 1);                         // post boxes
    flatRoof(r, wall, 0, 83, 34, 12); r(CONCRETE, 21, 87, 7, 5); r(shade(CONCRETE, 0.8), 21, 87, 7, 1); r('#918f8a', 4, 86, 5, 3);  // water tank, AC
  }],
  mixedUse: ['Shop with flats above', 38, (r, rng, b, wall) => {
    r(wall, 0, 20, 38, 39);
    shopFront(r, rng, 0, 38, b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)]);
    for (let f = 0; f < 3; f++) windows(r, rng, 0, 34, 24 + f * 13, 2, 6, 6);
    r('#2fa36b', 33, 26, 4, 28); for (let i = 29; i < 52; i += 3) r(WHITE, 34, i, 2, 2);  // vertical sign
    flatRoof(r, wall, 0, 59, 38, 12); r('#918f8a', 24, 62, 7, 3);
  }],
  shop: ['Shop', 40, (r, rng, b, wall) => {
    r(wall, 0, 20, 40, 2);
    shopFront(r, rng, 0, 40, b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)]);
    flatRoof(r, wall, 0, 22, 40, 14); r('#918f8a', 27, 26, 7, 4); r(shade('#918f8a', 0.8), 27, 26, 7, 1);
  }],
  office: ['Office building', 32, (r, rng, b) => {
    const wall = b.wall ?? '#cfd2d4';
    r(wall, 0, 0, 32, 88);
    for (let f = 0; f < 6; f++) { const up = 18 + f * 12; r('#6f8aa6', 2, up + 3, 28, 6); for (let i = 2; i < 30; i += 4) r('#8fa8c0', i, up + 3, 1, 6); }
    glass(r, 4, 0, 24, 14); door(r, GLASS2, 13, 6, 14); r(shade(wall, 0.7), 2, 15, 28, 1);
    flatRoof(r, wall, 0, 88, 32, 14); r('#918f8a', 4, 92, 9, 6); r(shade('#918f8a', 0.8), 4, 92, 9, 1); r(INK, 25, 92, 1, 9); r(RED, 25, 100, 1, 1);  // plant room, antenna
  }],
  shrine: ['Shrine', 72, (r) => {                                  // a torii and the hall, side by side
    DEFS.torii[2]((c, dx, up, w, h) => r(c, dx + 2, up, w, h));
    DEFS.shrineHall[2]((c, dx, up, w, h) => r(c, dx + 32, up, w, h));
  }],
  torii: ['Torii', 26, (r) => {
    const red = '#c8402c';
    r(red, 5, 0, 2, 20); r(red, 19, 0, 2, 20); r(red, 3, 15, 20, 2);
    r(INK, 1, 20, 24, 2); r(INK, 0, 22, 1, 1); r(INK, 25, 22, 1, 1);
    r(red, 12, 17, 2, 3);
  }],
  shrineHall: ['Shrine hall', 40, (r) => {
    const hall = '#9a6a48';
    r('#c9c2b0', 4, 0, 32, 3);                                           // stone base
    r(hall, 6, 3, 28, 12); r(WHITE, 9, 5, 6, 8); r(WHITE, 25, 5, 6, 8); r(DARKWOOD, 17, 3, 6, 10);
    pitched(r, '#3a3f44', 1, 15, 38, 16, 2); r('#2a2e33', 0, 15, 1, 2); r('#2a2e33', 39, 15, 1, 2); r(GOLD, 17, 26, 6, 1);  // flared eaves, ridge ornament
  }],
  school: ['School', 110, (r, rng, b) => {
    const wall = b.wall ?? '#e4e0d6';
    r(wall, 0, 0, 110, 42);
    for (let f = 0; f < 3; f++) windows(r, rng, 0, 110, 4 + f * 14, 12, 6, 7);
    r(wall, 47, 0, 16, 14); glass(r, 49, 0, 12, 12); r(shade(wall, 0.8), 0, 13, 110, 1); r(shade(wall, 0.8), 0, 27, 110, 1);
    flatRoof(r, wall, 0, 42, 110, 16);
    r(wall, 48, 42, 14, 11); flatRoof(r, wall, 47, 53, 16, 5); r(WHITE, 52, 44, 6, 6); r(INK, 54, 47, 1, 2); r(INK, 55, 47, 2, 1);  // clock tower
  }],
  laundromat: ['Coin laundromat', 36, (r, rng, b, wall) => {
    r(wall, 0, 0, 36, 23);
    sign(r, '#e8e0d0', '#3f7fd6', 1, 17, 34, 5);
    r(GLASS, 1, 0, 34, 16);
    for (let i = 3; i < 28; i += 6) { r(INK, i, 3, 4, 4); r('#7f9ab4', i + 1, 4, 2, 2); }   // washers
    door(r, GLASS2, 28, 6, 14);
    flatRoof(r, wall, 0, 23, 36, 12); r('#918f8a', 25, 26, 7, 4); r(shade('#918f8a', 0.8), 25, 26, 7, 1);
  }],
  kissaten: ['Café (kissaten)', 34, (r, rng, b, wall) => {
    r(wall, 0, 0, 34, 34);
    r(DARKWOOD, 0, 0, 34, 15); glass(r, 3, 2, 16, 10, '#c9a46a'); door(r, WOOD, 23, 6, 13);
    awning(r, RED, WHITE, -1, 15, 36, 3);
    windows(r, rng, 0, 34, 22, 2, 6, 7);
    pitched(r, b.roof ?? '#5a4a48', -1, 34, 36, 14);
  }],
  pharmacy: ['Pharmacy', 44, (r, rng, b, wall) => {
    r(wall, 0, 0, 44, 22);
    sign(r, '#eef2e8', '#2fa36b', 8, 16, 35, 5);
    r('#2fa36b', 1, 15, 6, 6); r(WHITE, 3, 16, 2, 4); r(WHITE, 2, 17, 4, 2);    // green cross
    glass(r, 1, 0, 42, 15, '#dfe8ec');
    for (let row = 2; row < 13; row += 3) dots(r, rng, 2, row, 30, [RED, '#3f7fd6', '#f2c230', '#2fa36b', WHITE, '#d46a8e']);
    door(r, GLASS2, 34, 6, 14);
    flatRoof(r, wall, 0, 22, 44, 12); r('#918f8a', 30, 25, 7, 4); r(shade('#918f8a', 0.8), 30, 25, 7, 1);
  }],
  sushi: ['Sushi restaurant', 36, (r, rng, b, wall) => {
    r(wall, 0, 15, 36, 19);
    r(DARKWOOD, 0, 0, 36, 15);
    r(LIGHTWOOD, 20, 0, 10, 13); for (let i = 22; i < 30; i += 2) r(WOOD, i, 0, 1, 13);   // sliding door
    noren(r, NAVY, 19, 9, 12);
    r(LIGHTWOOD, 4, 7, 12, 4); r(INK, 6, 8, 1, 2); r(INK, 9, 8, 1, 2); r(INK, 12, 8, 1, 2);  // name board
    windows(r, rng, 0, 36, 22, 3, 6, 7);
    pitched(r, b.roof ?? '#4a4442', -1, 34, 38, 14); r('#4a4442', -1, 15, 38, 1);
  }],
  florist: ['Flower shop', 32, (r, rng, b, wall) => {
    r(wall, 0, 0, 32, 47);
    glass(r, 1, 0, 30, 14); door(r, GLASS2, 22, 6, 13);
    awning(r, RED, WHITE, -1, 14, 34, 3); sign(r, WHITE, '#d46a8e', 4, 17, 24, 3);
    for (let f = 0; f < 2; f++) windows(r, rng, 0, 32, 24 + f * 12, 2, 6, 6);
    for (const dx of [1, 6, 11, 16]) { r('#8a6440', dx, 0, 4, 2); dots(r, rng, dx, 2, 4, [RED, '#f2c230', '#d46a8e', WHITE, '#7a6aa8']); r('#5f8f5a', dx + 1, 3, 2, 1); }
    flatRoof(r, wall, 0, 47, 32, 10); for (const dx of [3, 9, 15]) { r('#8a6440', dx, 49, 5, 3); r('#5f8f5a', dx + 1, 51, 3, 2); }  // roof garden
  }],
  fishmonger: ['Fishmonger', 40, (r, rng, b, wall) => {
    r(wall, 0, 0, 40, 23);
    sign(r, WHITE, NAVY, 1, 18, 38, 4);
    awning(r, NAVY, WHITE, -1, 15, 42, 3);
    r('#3a3f44', 0, 0, 40, 15);
    r('#dfe8ec', 2, 0, 36, 5); r(WHITE, 1, 5, 38, 1);                      // ice counter
    for (let i = 3; i < 37; i += 3) r(rng() < 0.5 ? '#b3b0a8' : '#d8b0a0', i, 3, 2, 1);
    flatRoof(r, wall, 0, 23, 40, 12);
  }],
  udonSoba: ['Udon / soba shop', 36, (r, rng, b, wall) => {
    r(wall, 0, 15, 36, 19);
    r(WOOD, 0, 0, 36, 15);
    r(LIGHTWOOD, 3, 3, 14, 9); for (let i = 5; i < 17; i += 3) r(WOOD, i, 3, 1, 9); r(WOOD, 3, 7, 14, 1);  // lattice window
    door(r, INK, 23, 7, 13); noren(r, '#3a5a7a', 22, 9, 9); lantern(r, 19, 8);
    r(LIGHTWOOD, 10, 15, 16, 3); r(INK, 13, 16, 10, 1);                     // name board
    windows(r, rng, 0, 36, 22, 2, 7, 7);
    pitched(r, b.roof ?? '#3a3f44', -1, 34, 38, 14); r('#3a3f44', -1, 18, 38, 1);
  }],
  familyRestaurant: ['Family restaurant', 72, (r0, rng, b) => {
    r0(INK, 3, 0, 1, 22); r0('#2fa36b', 0, 22, 7, 5); r0(WHITE, 1, 24, 5, 1);   // pole sign
    const r = (c, dx, up, w, h) => r0(c, dx + 8, up, w, h);
    const wall = b.wall ?? '#b89e80';
    r(wall, 0, 0, 64, 18);
    for (let i = 3; i < 50; i += 9) { r('#a03a2c', i, 3, 8, 9); r(GLASS, i + 1, 4, 6, 7); }
    door(r, INK, 54, 6, 13);
    pitched(r, '#d0603e', -1, 18, 66, 14, 2); r('#2fa36b', -1, 18, 66, 1);   // red hipped roof, green trim
  }],
  takoyaki: ['Takoyaki stand', 20, (r) => {
    r('#e8e0d0', 0, 0, 20, 18);
    flatRoof(r, '#e8e0d0', 0, 18, 20, 8);
    r('#3a3f44', 1, 7, 18, 6);
    r(DARKWOOD, 0, 0, 20, 7); r(LIGHTWOOD, 0, 6, 20, 1);
    awning(r, '#f08a2c', '#f4e6c8', -1, 13, 22, 3);
    sign(r, '#e0d2b0', '#7a3a32', 0, 19, 20, 6);
    lantern(r, 1, 9);
    for (let i = 4; i < 17; i += 3) r('#c09060', i, 7, 2, 1);               // takoyaki balls
  }],
  koban: ['Koban (police box)', 42, (r0, rng) => {
    // a bicycle out front
    r0(INK, 0, 0, 3, 3); r0(INK, 5, 0, 3, 3); r0('#d8d0c0', 1, 1, 1, 1); r0('#d8d0c0', 6, 1, 1, 1); r0('#3f7fd6', 2, 3, 5, 1); r0(INK, 4, 4, 1, 1);
    const r = (c, dx, up, w, h) => r0(c, dx + 11, up, w, h);
    const wall = '#9a7c60';
    r(wall, 0, 0, 30, 18);
    sign(r, NAVY, WHITE, 2, 13, 26, 4);
    glass(r, 2, 2, 12, 9); door(r, '#3f5f9a', 19, 7, 12);
    r(RED, 21, 12, 3, 2);                                                   // red lamp
    flatRoof(r, wall, -1, 18, 32, 12); r('#e8dcc0', -1, 18, 32, 1);
  }],
  postOffice: ['Post office', 62, (r, rng) => {
    const wall = '#e8e0d0';
    r(wall, 0, 0, 56, 18);
    r(RED, 0, 15, 56, 3); dots(r, rng, 10, 16, 36, [WHITE, RED], 1);
    for (let i = 3; i < 38; i += 9) { r(GLASS, i, 3, 7, 9); r(rng() < 0.5 ? '#f2c230' : '#3f7fd6', i + 2, 5, 3, 4); }
    door(r, '#7a3a32', 45, 7, 13);
    flatRoof(r, wall, 0, 18, 56, 14); r(RED, 0, 18, 56, 2); r('#918f8a', 40, 22, 8, 4);
    r(RED, 59, 0, 3, 6); r(INK, 59, 4, 3, 1);                               // post box
  }],
  bank: ['Bank', 46, (r, rng) => {
    const wall = '#6a5848';
    r(wall, 0, 0, 46, 49);
    for (let f = 0; f < 2; f++) windows(r, rng, 0, 46, 24 + f * 13, 5, 5, 7);
    r('#c8302a', 2, 15, 42, 4); for (let i = 5; i < 41; i += 3) r(WHITE, i, 16, 2, 2);
    glass(r, 3, 0, 22, 13); door(r, GLASS2, 31, 7, 13);
    r(CONCRETE, 42, 0, 4, 9); r(INK, 43, 4, 2, 3);                          // ATM
    flatRoof(r, wall, 0, 49, 46, 12); r('#918f8a', 6, 52, 8, 4); r(shade('#918f8a', 0.8), 6, 52, 8, 1);
  }],
  clinic: ['Clinic', 40, (r, rng) => {
    const wall = '#b9b8b0';
    r(wall, 0, 0, 40, 35);
    r('#2fa36b', 4, 23, 7, 7); r(WHITE, 6, 24, 3, 5); r(WHITE, 5, 25, 5, 3);
    windows(r, rng, 14, 40, 22, 2, 7, 8);
    sign(r, WHITE, '#2fa36b', 2, 15, 36, 4);
    glass(r, 2, 0, 22, 13, '#dfe8ec'); door(r, '#3f5f9a', 29, 7, 14);
    flatRoof(r, wall, 0, 35, 40, 12);
  }],
  fireStation: ['Fire station', 56, (r, rng) => {
    const wall = '#d8d0c4';
    r(wall, 0, 0, 46, 34);
    for (const dx of [3, 23]) { r(RED, dx, 0, 18, 17); for (let i = 3; i < 17; i += 3) r('#a83028', dx, i, 18, 1); }
    r('#a83028', 0, 17, 46, 2);
    windows(r, rng, 0, 46, 23, 4, 6, 7);
    flatRoof(r, wall, 0, 34, 46, 14);
    r('#b9b0a4', 46, 0, 10, 54); for (let i = 20; i < 50; i += 8) r(WIN, 49, i, 4, 4);   // hose tower
    flatRoof(r, '#b9b0a4', 46, 54, 10, 6); r(RED, 50, 56, 2, 3);
  }],
  karaoke: ['Karaoke', 34, (r, rng) => {
    const wall = '#2a2a30';
    r(wall, 0, 0, 34, 62);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 3; i++) r(rng() < 0.5 ? '#e8603a' : '#f2a040', 3 + i * 9, 24 + f * 13, 6, 6);
    r(WHITE, 29, 18, 4, 40); for (let i = 21; i < 56; i += 4) r([RED, '#3f7fd6', '#d46a8e', '#f2c230'][(i / 4) & 3], 30, i, 2, 2);  // vertical sign
    glass(r, 2, 0, 20, 14, '#7a6aa8'); door(r, '#d46a8e', 22, 6, 13); r('#f2a040', 2, 15, 26, 2);
    flatRoof(r, wall, 0, 62, 34, 12); r('#918f8a', 5, 65, 7, 4);
  }],
  woodApartment: ['Wooden apartment', 48, (r, rng) => {
    const wall = '#b8ae9c';
    r(wall, 0, 0, 42, 32);
    for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) { r(WOOD, 3 + i * 13, f * 16, 5, 11); win(r, rng, 9 + i * 13, f * 16 + 5, 4, 4); }
    r('#7a6a5a', 0, 16, 42, 1); r('#7a6a5a', 0, 20, 42, 1); for (let i = 0; i < 42; i += 4) r('#7a6a5a', i, 16, 1, 4);  // corridor rail
    for (let k = 0; k < 8; k++) r('#7a6a5a', 42 + k * 0.75 | 0, 16 - k * 2, 2, 1);                                      // outside stairs
    r('#7a6a5a', 46, 0, 1, 17);
    flatRoof(r, wall, 0, 32, 42, 12);
  }],
  parkingGarage: ['Parking garage', 56, (r, rng) => {
    const slab = '#c9c4ba';
    for (let l = 0; l < 3; l++) {
      const up = l * 13;
      r('#3a3f44', 0, up, 56, 13); r(slab, 0, up + 11, 56, 2);
      for (let i = 4; i < 48; i += 10) if (rng() < 0.7) { const c = ['#e8402f', WHITE, '#3f7fd6', INK, '#b3b0a8'][Math.floor(rng() * 5)]; r(c, i, up + 2, 7, 3); r(c, i + 1, up + 5, 5, 2); r(GLASS, i + 2, up + 5, 3, 1); }
    }
    r(slab, 0, 0, 2, 39); r(slab, 27, 0, 2, 39); r(slab, 54, 0, 2, 39);
    flatRoof(r, slab, 0, 39, 56, 14);                                      // the top deck, cars parked on it
    for (let i = 5; i < 44; i += 9) if (rng() < 0.6) { const c = ['#e8402f', WHITE, '#3f7fd6', INK][Math.floor(rng() * 4)]; r(c, i, 43, 5, 7); r(GLASS, i + 1, 47, 3, 2); }
    r('#3f7fd6', 47, 39, 7, 7); r(WHITE, 49, 40, 1, 5); r(WHITE, 50, 44, 2, 1); r(WHITE, 51, 42, 1, 2); r(WHITE, 50, 42, 1, 1);  // P
  }],
  gasStation: ['Gas station', 68, (r0) => {
    const r = (c, dx, up, w, h) => r0(c, dx + 4, up, w, h);
    r(CONCRETE, 10, 0, 2, 20); r(CONCRETE, 46, 0, 2, 20);
    r('#e4e2dc', 4, 24, 52, 12); r('#d4d2cc', 4, 24, 52, 1); r(WHITE, 4, 20, 52, 4); r(RED, 4, 21, 52, 1);  // canopy, its top
    for (const dx of [20, 34]) { r(RED, dx, 0, 4, 8); r(WHITE, dx + 1, 4, 2, 2); r(INK, dx + 1, 1, 2, 1); }  // pumps
    r('#e8e0d0', 52, 0, 12, 14); r(GLASS, 54, 0, 6, 10); flatRoof(r, '#e8e0d0', 52, 14, 12, 6);  // kiosk
    r(INK, 0, 0, 1, 22); r(WHITE, -3, 22, 7, 8); r(RED, -2, 27, 5, 2); r(INK, -2, 23, 5, 1); r(INK, -2, 25, 5, 1);  // price sign
  }],
  tudorCottage: ['Tudor cottage', 36, (r, rng) => {
    const wall = '#ece0c4', beam = '#3a2a22';
    r(wall, 0, 0, 36, 30);
    r(beam, 0, 0, 1, 30); r(beam, 35, 0, 1, 30); r(beam, 0, 15, 36, 1); r(beam, 0, 29, 36, 1);
    for (const dx of [8, 27]) r(beam, dx, 0, 1, 30);
    for (let k = 0; k < 5; k++) { r(beam, 1 + k, 16 + k * 2, 1, 2); r(beam, 34 - k, 16 + k * 2, 1, 2); }   // braces
    door(r, WOOD, 15, 6, 12); r(beam, 14, 12, 8, 1);
    for (const dx of [2, 28]) { r(WIN, dx + 1, 5, 4, 6); r(beam, dx + 2, 5, 1, 6); r(beam, dx + 1, 8, 4, 1); }
    windows(r, rng, 9, 27, 19, 2, 4, 6);
    gable(r, '#4a3a32', wall, -2, 30, 40, 14, 12);
    r(beam, 17, 30, 2, 10); r(beam, 10, 34, 16, 1);                          // beams in the gable
    r('#9a4a3a', 28, 46, 4, 9); r(INK, 28, 54, 4, 1);                       // chimney
  }],
  mediterraneanVilla: ['Mediterranean villa', 44, (r) => {
    const wall = '#f0e8d8', shut = '#3f5f9a';
    r(wall, 0, 0, 44, 33);
    const arch = (dx, up, w, h) => { r(NAVY, dx, up, w, h - 1); r(NAVY, dx + 1, up + h - 1, w - 2, 1); };
    for (const dx of [5, 14, 25, 34]) { arch(dx, 20, 5, 8); r(shut, dx - 1, 20, 1, 7); r(shut, dx + 5, 20, 1, 7); }
    for (const dx of [5, 34]) { arch(dx, 4, 5, 8); r(shut, dx - 1, 4, 1, 7); r(shut, dx + 5, 4, 1, 7); r('#a8664a', dx, 2, 5, 2); r('#5f8f5a', dx + 1, 4, 3, 1); }
    arch(19, 0, 7, 14);
    pitched(r, '#c0603a', -2, 33, 48, 15, 3);
  }],
  dutchCanalHouse: ['Dutch canal house', 24, (r) => {
    const wall = '#6a5a8a', trim = '#f2efe8';
    r(wall, 0, 0, 24, 50);
    for (let f = 0; f < 3; f++) for (const dx of [4, 14]) { r(trim, dx, 16 + f * 12, 6, 9); r(WIN, dx + 1, 17 + f * 12, 4, 7); r(trim, dx + 1, 21 + f * 12, 4, 1); }
    r(trim, 3, 3, 6, 9); r(WIN, 4, 4, 4, 7); door(r, '#2a4a3a', 14, 6, 13); r(trim, 13, 13, 8, 1);
    const half = 12;                                                       // the roof behind the gable
    r(shade('#5a5450', 0.8), 2, 50, half - 2, 16); r('#5a5450', half, 50, half - 2, 16); r(shade('#5a5450', 1.3), half - 1, 62, 2, 4);
    const steps = [[0, 24], [3, 18], [6, 12], [9, 6]];                    // stepped gable
    steps.forEach(([inset, w], i) => { r(wall, inset, 50 + i * 3, w, 3); r(trim, inset, 52 + i * 3, w, 1); });
    r(trim, 11, 62, 2, 2); r(WIN, 10, 53, 4, 4);
  }],
  frenchCountryHouse: ['French country house', 42, (r, rng) => {
    const wall = '#c8b08c', shut = '#3c4a5a';
    r(wall, 0, 0, 42, 33);
    for (const up of [3, 19]) for (const dx of [5, 18, 31]) {
      if (up === 3 && dx === 31) continue;
      win(r, rng, dx, up, 6, 9); r(shut, dx - 2, up, 2, 9); r(shut, dx + 6, up, 2, 9);
    }
    door(r, WOOD, 31, 7, 14);
    pitched(r, '#3a3f44', -2, 33, 46, 18, 3);
    for (const dx of [10, 27]) { r(wall, dx, 35, 6, 6); r(WIN, dx + 1, 35, 4, 4); pitched(r, '#3a3f44', dx - 1, 41, 8, 3, 3); }  // dormers
    r('#9a7c60', 6, 45, 4, 8); r('#9a7c60', 32, 45, 4, 8); r(INK, 6, 52, 4, 1); r(INK, 32, 52, 4, 1);  // chimneys
  }],
  scandinavianHouse: ['Scandinavian house', 40, (r, rng) => {
    const wall = '#a83a32';
    r(wall, 0, 0, 40, 29);
    for (let i = 2; i < 40; i += 3) r(shade(wall, 0.82), i, 0, 1, 29);     // planks
    r(WHITE, 0, 0, 1, 29); r(WHITE, 39, 0, 1, 29);
    for (const [dx, up] of [[4, 4], [27, 4], [6, 17], [17, 17], [28, 17]]) { r(WHITE, dx - 1, up - 1, 8, 9); win(r, rng, dx, up, 6, 7); r(WHITE, dx + 2, up, 1, 7); }
    door(r, '#2f4a5a', 16, 7, 13); r(WHITE, 15, 13, 9, 1);
    pitched(r, '#3a3f44', -2, 29, 44, 16);
    r(shade(wall, 0.7), 29, 38, 4, 8); r(INK, 29, 45, 4, 1);                // chimney
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
    // the prayer hall: walls, a trim band, arched windows, the tall entrance
    r(wall, 6, 0, 44, wallH); r(shade(wall, 0.85), 6, 0, 44, 1);
    r(trim, 6, wallH - 3, 44, 1);
    const gap = 16 / (perSide + 1);
    for (let i = 0; i < perSide; i++) for (const base of [6, 34]) pointedArch(r, NAVY, Math.round(base + gap * (i + 1) - 1.5), 5, 3, 8);
    flatRoof(r, wall, 6, wallH, 44, 12);
    if (sideDomes) for (const cx of [14, 41]) { r(wall, cx - 3, wallH + 3, 7, 2); dome(r, domeC, cx, wallH + 5, 3); }
    r(wall, 28 - rad - 1, wallH + 4, rad * 2 + 3, 3);                           // the drum under the dome
    dome(r, domeC, 28, wallH + 7, rad);
    r(GOLD, 28, wallH + 8 + rad, 1, 3); r(GOLD, 27, wallH + 11 + rad, 1, 1); r(GOLD, 29, wallH + 12 + rad, 1, 1);  // finial and crescent
    r(wall, 19, 0, 18, wallH + 6); r(shade(wall, 0.85), 19, wallH + 5, 18, 1);  // the entrance front (iwan), taller than the hall
    pointedArch(r, trim, 21, 0, 14, wallH + 3); pointedArch(r, shade(trim, 0.6), 23, 0, 10, wallH);
    r(DARKWOOD, 25, 0, 6, 11); r(GOLD, 27, 13, 2, 2);
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
    const wall = '#8f8a80';
    r(wall, 0, 0, 34, 24);
    for (let up = 2; up < 24; up += 3) for (let i = (up % 2) * 2; i < 34; i += 5) r(shade(wall, 0.85), i, up, 2, 1);  // stones
    r(DARKWOOD, 13, 0, 8, 11); r(DARKWOOD, 14, 11, 6, 1); r(DARKWOOD, 15, 12, 4, 1);   // arched door
    r(GLASS, 15, 16, 4, 4); r('#c8402c', 16, 17, 2, 2);                      // round window
    for (const dx of [4, 26]) { r(WIN, dx, 7, 4, 9); r(WIN, dx + 1, 16, 2, 1); }
    gable(r, '#2f2a2a', wall, -2, 24, 38, 16, 16);
    r(wall, 14, 38, 6, 12); r(INK, 16, 43, 2, 4);                            // bell tower on the front of the roof
    for (let k = 0; k < 4; k++) r('#2f2a2a', 13 + k, 50 + k, 8 - k * 2, 1);
    r(GOLD, 16, 54, 1, 6); r(GOLD, 15, 57, 3, 1);                            // cross
  }],
};

// Ground a person cannot stand on, as [dx, w, top, bottom] (rows above the
// ground line), for buildings you can partly walk into: between the torii's
// posts, under the gas station's canopy (8 px deep). Everything else is
// solid over its whole picture.
const OPEN = {
  torii: [[5, 2, 3, 0], [19, 2, 3, 0]],
  gasStation: [[4, 1, 3, 0], [14, 2, 3, 0], [24, 4, 3, 0], [38, 4, 3, 0], [50, 2, 3, 0], [56, 12, 20, 0], [0, 68, 40, 9]],
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
  // at a scale, each rectangle's edges are scaled and rounded, so the
  // pixels stay as crisp as the people's (a 1 px line becomes 1 or 2 px)
  const r = k === 1
    ? (c, dx, up, rw, rh) => { g.fillStyle = c; g.fillRect(L + dx, y - up - rh, rw, rh); }
    : (c, dx, up, rw, rh) => {
      const x0 = Math.round(dx * k), x1 = Math.round((dx + rw) * k), y0 = Math.round(up * k), y1 = Math.round((up + rh) * k);
      if (x1 > x0 && y1 > y0) { g.fillStyle = c; g.fillRect(L + x0, y - y1, x1 - x0, y1 - y0); }
    };
  draw(r, rng, b, wall, roof);
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
