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
// buildings are squashed (an office has 6 floors, not 13).

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
/** A flat roof seen a little from above: a parapet line and the roof's top. */
function flatRoof(r, wall, dx, up, w) { r(TOP, dx, up + 1, w, 2); r(shade(wall, 0.8), dx, up, w, 1); }
/** A pitched roof: rows narrowing from w at the eaves to `top` at the ridge. */
function pitched(r, c, dx, up, w, h, top) {
  for (let k = 0; k < h; k++) {
    const rw = Math.round(w - (w - top) * k / Math.max(1, h - 1));
    r(c, dx + Math.round((w - rw) / 2), up + k, rw, 1);
  }
  r(shade(c, 0.75), dx, up, w, 1);
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
// Each: [label, width, height, draw(r, rng, b, wall, roof)]. Height includes the roof.

const DEFS = {
  house: ['House', 44, 30, (r, rng, b, wall, roof) => {
    r(wall, 2, 0, 40, 18);
    pitched(r, b.roof ?? '#c8603e', 0, 18, 44, 11, 18);
    door(r, WOOD, 7); r(GOLD, 11, 6);
    win(r, rng, 19, 6, 7, 6); win(r, rng, 31, 6, 7, 6);
    r(shade(wall, 0.85), 2, 0, 40, 1);
  }],
  apartment: ['Apartment block', 34, 86, (r, rng, b, wall) => {
    r(wall, 0, 0, 34, 83);
    for (let f = 0; f < 5; f++) {
      const up = 18 + f * 13;
      windows(r, rng, 0, 34, up + 4, 3, 6, 6);
      r('#d8d4ca', 1, up + 1, 32, 1); r('#d8d4ca', 1, up + 4, 32, 1);   // balcony rail
      for (let i = 1; i < 33; i += 4) r('#d8d4ca', i, up + 1, 1, 3);
    }
    door(r, GLASS2, 14, 6, 13); r(shade(wall, 0.8), 13, 13, 8, 1);
    r(CONCRETE, 4, 3, 4, 5); r(INK, 5, 6, 2, 1);                         // post boxes
    flatRoof(r, wall, 0, 83, 34); r(CONCRETE, 22, 84, 6, 4); r('#918f8a', 4, 84, 4, 2);
  }],
  mixedUse: ['Shop with flats above', 38, 62, (r, rng, b, wall) => {
    r(wall, 0, 20, 38, 39);
    shopFront(r, rng, 0, 38, b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)]);
    for (let f = 0; f < 3; f++) windows(r, rng, 0, 34, 24 + f * 13, 2, 6, 6);
    r('#2fa36b', 33, 26, 4, 28); for (let i = 29; i < 52; i += 3) r(WHITE, 34, i, 2, 2);  // vertical sign
    flatRoof(r, wall, 0, 59, 38);
  }],
  shop: ['Shop', 40, 25, (r, rng, b, wall) => {
    r(wall, 0, 20, 40, 2);
    shopFront(r, rng, 0, 40, b.shopType ?? SHOP_TYPES[Math.floor(rng() * SHOP_TYPES.length)]);
    flatRoof(r, wall, 0, 22, 40); r(CONCRETE, 28, 23, 6, 3);
  }],
  office: ['Office building', 32, 92, (r, rng, b) => {
    const wall = b.wall ?? '#cfd2d4';
    r(wall, 0, 0, 32, 88);
    for (let f = 0; f < 6; f++) { const up = 18 + f * 12; r('#6f8aa6', 2, up + 3, 28, 6); for (let i = 2; i < 30; i += 4) r('#8fa8c0', i, up + 3, 1, 6); }
    glass(r, 4, 0, 24, 14); door(r, GLASS2, 13, 6, 14); r(shade(wall, 0.7), 2, 15, 28, 1);
    flatRoof(r, wall, 0, 88, 32); r(INK, 24, 89, 1, 3); r('#918f8a', 4, 89, 8, 2);
  }],
  shrine: ['Shrine', 72, 30, (r) => {                                  // a torii and the hall, side by side
    DEFS.torii[3]((c, dx, up, w, h) => r(c, dx + 2, up, w, h));
    DEFS.shrineHall[3]((c, dx, up, w, h) => r(c, dx + 32, up, w, h));
  }],
  torii: ['Torii', 26, 24, (r) => {
    const red = '#c8402c';
    r(red, 5, 0, 2, 20); r(red, 19, 0, 2, 20); r(red, 3, 15, 20, 2);
    r(INK, 1, 20, 24, 2); r(INK, 0, 22, 1, 1); r(INK, 25, 22, 1, 1);
    r(red, 12, 17, 2, 3);
  }],
  shrineHall: ['Shrine hall', 40, 26, (r) => {
    const hall = '#9a6a48';
    r('#c9c2b0', 4, 0, 32, 3);                                           // stone base
    r(hall, 6, 3, 28, 12); r(WHITE, 9, 5, 6, 8); r(WHITE, 25, 5, 6, 8); r(DARKWOOD, 17, 3, 6, 10);
    pitched(r, '#3a3f44', 1, 15, 38, 10, 20); r('#3a3f44', 0, 16, 1, 1); r('#3a3f44', 39, 16, 1, 1); r(GOLD, 18, 24, 4, 1);
  }],
  school: ['School', 110, 54, (r, rng, b) => {
    const wall = b.wall ?? '#e4e0d6';
    r(wall, 0, 0, 110, 42);
    for (let f = 0; f < 3; f++) windows(r, rng, 0, 110, 4 + f * 14, 12, 6, 7);
    r(wall, 47, 0, 16, 14); glass(r, 49, 0, 12, 12); r(shade(wall, 0.8), 0, 13, 110, 1); r(shade(wall, 0.8), 0, 27, 110, 1);
    flatRoof(r, wall, 0, 42, 110);
    r(wall, 48, 42, 14, 10); r(shade(wall, 0.8), 48, 52, 14, 1); r(WHITE, 52, 44, 6, 6); r(INK, 54, 47, 1, 2); r(INK, 55, 47, 2, 1);  // clock
  }],
  laundromat: ['Coin laundromat', 36, 26, (r, rng, b, wall) => {
    r(wall, 0, 0, 36, 23);
    sign(r, '#e8e0d0', '#3f7fd6', 1, 17, 34, 5);
    r(GLASS, 1, 0, 34, 16);
    for (let i = 3; i < 28; i += 6) { r(INK, i, 3, 4, 4); r('#7f9ab4', i + 1, 4, 2, 2); }   // washers
    door(r, GLASS2, 28, 6, 14);
    flatRoof(r, wall, 0, 23, 36); r(CONCRETE, 26, 24, 6, 3);
  }],
  kissaten: ['Café (kissaten)', 34, 42, (r, rng, b, wall) => {
    r(wall, 0, 0, 34, 34);
    r(DARKWOOD, 0, 0, 34, 15); glass(r, 3, 2, 16, 10, '#c9a46a'); door(r, WOOD, 23, 6, 13);
    awning(r, RED, WHITE, -1, 15, 36, 3);
    windows(r, rng, 0, 34, 22, 2, 6, 7);
    pitched(r, b.roof ?? '#5a4a48', -1, 34, 36, 8, 22);
  }],
  pharmacy: ['Pharmacy', 44, 25, (r, rng, b, wall) => {
    r(wall, 0, 0, 44, 22);
    sign(r, '#eef2e8', '#2fa36b', 8, 16, 35, 5);
    r('#2fa36b', 1, 15, 6, 6); r(WHITE, 3, 16, 2, 4); r(WHITE, 2, 17, 4, 2);    // green cross
    glass(r, 1, 0, 42, 15, '#dfe8ec');
    for (let row = 2; row < 13; row += 3) dots(r, rng, 2, row, 30, [RED, '#3f7fd6', '#f2c230', '#2fa36b', WHITE, '#d46a8e']);
    door(r, GLASS2, 34, 6, 14);
    flatRoof(r, wall, 0, 22, 44); r(CONCRETE, 30, 23, 6, 3);
  }],
  sushi: ['Sushi restaurant', 36, 42, (r, rng, b, wall) => {
    r(wall, 0, 15, 36, 19);
    r(DARKWOOD, 0, 0, 36, 15);
    r(LIGHTWOOD, 20, 0, 10, 13); for (let i = 22; i < 30; i += 2) r(WOOD, i, 0, 1, 13);   // sliding door
    noren(r, NAVY, 19, 9, 12);
    r(LIGHTWOOD, 4, 7, 12, 4); r(INK, 6, 8, 1, 2); r(INK, 9, 8, 1, 2); r(INK, 12, 8, 1, 2);  // name board
    windows(r, rng, 0, 36, 22, 3, 6, 7);
    pitched(r, b.roof ?? '#4a4442', -1, 34, 38, 8, 24); r('#4a4442', -1, 15, 38, 1);
  }],
  florist: ['Flower shop', 32, 50, (r, rng, b, wall) => {
    r(wall, 0, 0, 32, 47);
    glass(r, 1, 0, 30, 14); door(r, GLASS2, 22, 6, 13);
    awning(r, RED, WHITE, -1, 14, 34, 3); sign(r, WHITE, '#d46a8e', 4, 17, 24, 3);
    for (let f = 0; f < 2; f++) windows(r, rng, 0, 32, 24 + f * 12, 2, 6, 6);
    for (const dx of [1, 6, 11, 16]) { r('#8a6440', dx, 0, 4, 2); dots(r, rng, dx, 2, 4, [RED, '#f2c230', '#d46a8e', WHITE, '#7a6aa8']); r('#5f8f5a', dx + 1, 3, 2, 1); }
    flatRoof(r, wall, 0, 47, 32); r(CONCRETE, 22, 48, 5, 2);
  }],
  fishmonger: ['Fishmonger', 40, 26, (r, rng, b, wall) => {
    r(wall, 0, 0, 40, 23);
    sign(r, WHITE, NAVY, 1, 18, 38, 4);
    awning(r, NAVY, WHITE, -1, 15, 42, 3);
    r('#3a3f44', 0, 0, 40, 15);
    r('#dfe8ec', 2, 0, 36, 5); r(WHITE, 1, 5, 38, 1);                      // ice counter
    for (let i = 3; i < 37; i += 3) r(rng() < 0.5 ? '#b3b0a8' : '#d8b0a0', i, 3, 2, 1);
    flatRoof(r, wall, 0, 23, 40);
  }],
  udonSoba: ['Udon / soba shop', 36, 42, (r, rng, b, wall) => {
    r(wall, 0, 15, 36, 19);
    r(WOOD, 0, 0, 36, 15);
    r(LIGHTWOOD, 3, 3, 14, 9); for (let i = 5; i < 17; i += 3) r(WOOD, i, 3, 1, 9); r(WOOD, 3, 7, 14, 1);  // lattice window
    door(r, INK, 23, 7, 13); noren(r, '#3a5a7a', 22, 9, 9); lantern(r, 19, 8);
    r(LIGHTWOOD, 10, 15, 16, 3); r(INK, 13, 16, 10, 1);                     // name board
    windows(r, rng, 0, 36, 22, 2, 7, 7);
    pitched(r, b.roof ?? '#3a3f44', -1, 34, 38, 8, 24); r('#3a3f44', -1, 18, 38, 1);
  }],
  familyRestaurant: ['Family restaurant', 72, 27, (r0, rng, b) => {
    r0(INK, 3, 0, 1, 22); r0('#2fa36b', 0, 22, 7, 5); r0(WHITE, 1, 24, 5, 1);   // pole sign
    const r = (c, dx, up, w, h) => r0(c, dx + 8, up, w, h);
    const wall = b.wall ?? '#b89e80';
    r(wall, 0, 0, 64, 18);
    for (let i = 3; i < 50; i += 9) { r('#a03a2c', i, 3, 8, 9); r(GLASS, i + 1, 4, 6, 7); }
    door(r, INK, 54, 6, 13);
    r('#d0603e', -1, 18, 65, 4); r('#2fa36b', -1, 18, 65, 1);               // red roof band, green trim
  }],
  takoyaki: ['Takoyaki stand', 20, 26, (r) => {
    r('#e8e0d0', 0, 0, 20, 18);
    r('#3a3f44', 1, 7, 18, 6);
    r(DARKWOOD, 0, 0, 20, 7); r(LIGHTWOOD, 0, 6, 20, 1);
    awning(r, '#f08a2c', '#f4e6c8', -1, 13, 22, 3);
    sign(r, '#e0d2b0', '#7a3a32', 0, 19, 20, 6);
    lantern(r, 1, 9);
    for (let i = 4; i < 17; i += 3) r('#c09060', i, 7, 2, 1);               // takoyaki balls
  }],
  koban: ['Koban (police box)', 42, 24, (r0, rng) => {
    // a bicycle out front
    r0(INK, 0, 0, 3, 3); r0(INK, 5, 0, 3, 3); r0('#d8d0c0', 1, 1, 1, 1); r0('#d8d0c0', 6, 1, 1, 1); r0('#3f7fd6', 2, 3, 5, 1); r0(INK, 4, 4, 1, 1);
    const r = (c, dx, up, w, h) => r0(c, dx + 11, up, w, h);
    const wall = '#9a7c60';
    r(wall, 0, 0, 30, 18);
    sign(r, NAVY, WHITE, 2, 13, 26, 4);
    glass(r, 2, 2, 12, 9); door(r, '#3f5f9a', 19, 7, 12);
    r(RED, 21, 12, 3, 2);                                                   // red lamp
    flatRoof(r, wall, -1, 18, 32); r('#e8dcc0', -1, 18, 32, 1);
  }],
  postOffice: ['Post office', 62, 24, (r, rng) => {
    const wall = '#e8e0d0';
    r(wall, 0, 0, 56, 18);
    r(RED, 0, 15, 56, 3); dots(r, rng, 10, 16, 36, [WHITE, RED], 1);
    for (let i = 3; i < 38; i += 9) { r(GLASS, i, 3, 7, 9); r(rng() < 0.5 ? '#f2c230' : '#3f7fd6', i + 2, 5, 3, 4); }
    door(r, '#7a3a32', 45, 7, 13);
    flatRoof(r, wall, 0, 18, 56); r(RED, 0, 20, 56, 1);
    r(RED, 59, 0, 3, 6); r(INK, 59, 4, 3, 1);                               // post box
  }],
  bank: ['Bank', 46, 52, (r, rng) => {
    const wall = '#6a5848';
    r(wall, 0, 0, 46, 49);
    for (let f = 0; f < 2; f++) windows(r, rng, 0, 46, 24 + f * 13, 5, 5, 7);
    r('#c8302a', 2, 15, 42, 4); for (let i = 5; i < 41; i += 3) r(WHITE, i, 16, 2, 2);
    glass(r, 3, 0, 22, 13); door(r, GLASS2, 31, 7, 13);
    r(CONCRETE, 42, 0, 4, 9); r(INK, 43, 4, 2, 3);                          // ATM
    flatRoof(r, wall, 0, 49, 46); r(CONCRETE, 6, 50, 7, 3);
  }],
  clinic: ['Clinic', 40, 38, (r, rng) => {
    const wall = '#b9b8b0';
    r(wall, 0, 0, 40, 35);
    r('#2fa36b', 4, 23, 7, 7); r(WHITE, 6, 24, 3, 5); r(WHITE, 5, 25, 5, 3);
    windows(r, rng, 14, 40, 22, 2, 7, 8);
    sign(r, WHITE, '#2fa36b', 2, 15, 36, 4);
    glass(r, 2, 0, 22, 13, '#dfe8ec'); door(r, '#3f5f9a', 29, 7, 14);
    flatRoof(r, wall, 0, 35, 40);
  }],
  fireStation: ['Fire station', 56, 58, (r, rng) => {
    const wall = '#d8d0c4';
    r(wall, 0, 0, 46, 34);
    for (const dx of [3, 23]) { r(RED, dx, 0, 18, 17); for (let i = 3; i < 17; i += 3) r('#a83028', dx, i, 18, 1); }
    r('#a83028', 0, 17, 46, 2);
    windows(r, rng, 0, 46, 23, 4, 6, 7);
    flatRoof(r, wall, 0, 34, 46);
    r('#b9b0a4', 46, 0, 10, 54); for (let i = 20; i < 50; i += 8) r(WIN, 49, i, 4, 4);   // hose tower
    r(INK, 46, 54, 10, 1); r(RED, 50, 55, 2, 3);
  }],
  karaoke: ['Karaoke', 34, 66, (r, rng) => {
    const wall = '#2a2a30';
    r(wall, 0, 0, 34, 62);
    for (let f = 0; f < 3; f++) for (let i = 0; i < 3; i++) r(rng() < 0.5 ? '#e8603a' : '#f2a040', 3 + i * 9, 24 + f * 13, 6, 6);
    r(WHITE, 29, 18, 4, 40); for (let i = 21; i < 56; i += 4) r([RED, '#3f7fd6', '#d46a8e', '#f2c230'][(i / 4) & 3], 30, i, 2, 2);  // vertical sign
    glass(r, 2, 0, 20, 14, '#7a6aa8'); door(r, '#d46a8e', 22, 6, 13); r('#f2a040', 2, 15, 26, 2);
    flatRoof(r, wall, 0, 62, 34);
  }],
  woodApartment: ['Wooden apartment', 48, 36, (r, rng) => {
    const wall = '#b8ae9c';
    r(wall, 0, 0, 42, 32);
    for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) { r(WOOD, 3 + i * 13, f * 16, 5, 11); win(r, rng, 9 + i * 13, f * 16 + 5, 4, 4); }
    r('#7a6a5a', 0, 16, 42, 1); r('#7a6a5a', 0, 20, 42, 1); for (let i = 0; i < 42; i += 4) r('#7a6a5a', i, 16, 1, 4);  // corridor rail
    for (let k = 0; k < 8; k++) r('#7a6a5a', 42 + k * 0.75 | 0, 16 - k * 2, 2, 1);                                      // outside stairs
    r('#7a6a5a', 46, 0, 1, 17);
    flatRoof(r, wall, 0, 32, 42); r('#6a5a4a', 0, 33, 42, 1);
  }],
  parkingGarage: ['Parking garage', 56, 46, (r, rng) => {
    const slab = '#c9c4ba';
    for (let l = 0; l < 3; l++) {
      const up = l * 13;
      r('#3a3f44', 0, up, 56, 13); r(slab, 0, up + 11, 56, 2);
      for (let i = 4; i < 48; i += 10) if (rng() < 0.7) { const c = ['#e8402f', WHITE, '#3f7fd6', INK, '#b3b0a8'][Math.floor(rng() * 5)]; r(c, i, up + 2, 7, 3); r(c, i + 1, up + 5, 5, 2); r(GLASS, i + 2, up + 5, 3, 1); }
    }
    r(slab, 0, 0, 2, 39); r(slab, 27, 0, 2, 39); r(slab, 54, 0, 2, 39);
    r('#3f7fd6', 47, 39, 7, 7); r(WHITE, 49, 40, 1, 5); r(WHITE, 50, 44, 2, 1); r(WHITE, 51, 42, 1, 2); r(WHITE, 50, 42, 1, 1);  // P
  }],
  gasStation: ['Gas station', 68, 30, (r0) => {
    const r = (c, dx, up, w, h) => r0(c, dx + 4, up, w, h);
    r(CONCRETE, 10, 0, 2, 20); r(CONCRETE, 46, 0, 2, 20);
    r(WHITE, 4, 20, 52, 4); r(RED, 4, 21, 52, 1);                           // canopy
    for (const dx of [20, 34]) { r(RED, dx, 0, 4, 8); r(WHITE, dx + 1, 4, 2, 2); r(INK, dx + 1, 1, 2, 1); }  // pumps
    r('#e8e0d0', 52, 0, 12, 14); r(GLASS, 54, 0, 6, 10);                     // kiosk
    r(INK, 0, 0, 1, 22); r(WHITE, -3, 22, 7, 8); r(RED, -2, 27, 5, 2); r(INK, -2, 23, 5, 1); r(INK, -2, 25, 5, 1);  // price sign
  }],
  tudorCottage: ['Tudor cottage', 36, 50, (r, rng) => {
    const wall = '#ece0c4', beam = '#3a2a22';
    r(wall, 0, 0, 36, 30);
    r(beam, 0, 0, 1, 30); r(beam, 35, 0, 1, 30); r(beam, 0, 15, 36, 1); r(beam, 0, 29, 36, 1);
    for (const dx of [8, 27]) r(beam, dx, 0, 1, 30);
    for (let k = 0; k < 5; k++) { r(beam, 1 + k, 16 + k * 2, 1, 2); r(beam, 34 - k, 16 + k * 2, 1, 2); }   // braces
    door(r, WOOD, 15, 6, 12); r(beam, 14, 12, 8, 1);
    for (const dx of [2, 28]) { r(WIN, dx + 1, 5, 4, 6); r(beam, dx + 2, 5, 1, 6); r(beam, dx + 1, 8, 4, 1); }
    windows(r, rng, 9, 27, 19, 2, 4, 6);
    pitched(r, '#4a3a32', -2, 30, 40, 18, 2);
    r('#9a4a3a', 27, 36, 4, 12); r(INK, 27, 47, 4, 1);                      // chimney
  }],
  mediterraneanVilla: ['Mediterranean villa', 44, 42, (r) => {
    const wall = '#f0e8d8', shut = '#3f5f9a';
    r(wall, 0, 0, 44, 33);
    const arch = (dx, up, w, h) => { r(NAVY, dx, up, w, h - 1); r(NAVY, dx + 1, up + h - 1, w - 2, 1); };
    for (const dx of [5, 14, 25, 34]) { arch(dx, 20, 5, 8); r(shut, dx - 1, 20, 1, 7); r(shut, dx + 5, 20, 1, 7); }
    for (const dx of [5, 34]) { arch(dx, 4, 5, 8); r(shut, dx - 1, 4, 1, 7); r(shut, dx + 5, 4, 1, 7); r('#a8664a', dx, 2, 5, 2); r('#5f8f5a', dx + 1, 4, 3, 1); }
    arch(19, 0, 7, 14);
    pitched(r, '#c0603a', -2, 33, 48, 9, 24);
  }],
  dutchCanalHouse: ['Dutch canal house', 24, 64, (r) => {
    const wall = '#6a5a8a', trim = '#f2efe8';
    r(wall, 0, 0, 24, 50);
    for (let f = 0; f < 3; f++) for (const dx of [4, 14]) { r(trim, dx, 16 + f * 12, 6, 9); r(WIN, dx + 1, 17 + f * 12, 4, 7); r(trim, dx + 1, 21 + f * 12, 4, 1); }
    r(trim, 3, 3, 6, 9); r(WIN, 4, 4, 4, 7); door(r, '#2a4a3a', 14, 6, 13); r(trim, 13, 13, 8, 1);
    const steps = [[0, 24], [3, 18], [6, 12], [9, 6]];                    // stepped gable
    steps.forEach(([inset, w], i) => { r(wall, inset, 50 + i * 3, w, 3); r(trim, inset, 52 + i * 3, w, 1); });
    r(trim, 11, 62, 2, 2); r(WIN, 10, 53, 4, 4);
  }],
  frenchCountryHouse: ['French country house', 42, 50, (r, rng) => {
    const wall = '#c8b08c', shut = '#3c4a5a';
    r(wall, 0, 0, 42, 33);
    for (const up of [3, 19]) for (const dx of [5, 18, 31]) {
      if (up === 3 && dx === 31) continue;
      win(r, rng, dx, up, 6, 9); r(shut, dx - 2, up, 2, 9); r(shut, dx + 6, up, 2, 9);
    }
    door(r, WOOD, 31, 7, 14);
    pitched(r, '#3a3f44', -2, 33, 46, 12, 26);
    for (const dx of [10, 27]) { r(wall, dx, 37, 6, 6); r(WIN, dx + 1, 37, 4, 4); pitched(r, '#3a3f44', dx - 1, 43, 8, 3, 2); }  // dormers
    r('#9a7c60', 3, 40, 4, 10); r('#9a7c60', 35, 40, 4, 10);                // chimneys
  }],
  scandinavianHouse: ['Scandinavian house', 40, 44, (r, rng) => {
    const wall = '#a83a32';
    r(wall, 0, 0, 40, 29);
    for (let i = 2; i < 40; i += 3) r(shade(wall, 0.82), i, 0, 1, 29);     // planks
    r(WHITE, 0, 0, 1, 29); r(WHITE, 39, 0, 1, 29);
    for (const [dx, up] of [[4, 4], [27, 4], [6, 17], [17, 17], [28, 17]]) { r(WHITE, dx - 1, up - 1, 8, 9); win(r, rng, dx, up, 6, 7); r(WHITE, dx + 2, up, 1, 7); }
    door(r, '#2f4a5a', 16, 7, 13); r(WHITE, 15, 13, 9, 1);
    pitched(r, '#3a3f44', -2, 29, 44, 13, 4);
    r(shade(wall, 0.7), 29, 35, 4, 9);
  }],
  stoneChapel: ['Stone chapel', 34, 64, (r) => {
    const wall = '#8f8a80';
    r(wall, 0, 0, 34, 24);
    for (let up = 2; up < 24; up += 3) for (let i = (up % 2) * 2; i < 34; i += 5) r(shade(wall, 0.85), i, up, 2, 1);  // stones
    r(DARKWOOD, 13, 0, 8, 11); r(DARKWOOD, 14, 11, 6, 1); r(DARKWOOD, 15, 12, 4, 1);   // arched door
    r(GLASS, 15, 16, 4, 4); r('#c8402c', 16, 17, 2, 2);                      // round window
    for (const dx of [4, 26]) { r(WIN, dx, 7, 4, 9); r(WIN, dx + 1, 16, 2, 1); }
    pitched(r, '#2f2a2a', -2, 24, 38, 20, 2);
    r(wall, 14, 40, 6, 12); r(INK, 16, 45, 2, 4);                            // bell tower
    pitched(r, '#2f2a2a', 13, 52, 8, 6, 1);
    r(GOLD, 16, 58, 1, 6); r(GOLD, 15, 61, 3, 1);                            // cross
  }],
};

// Ground a person cannot stand on, as [dx, w, top, bottom] (rows above the
// ground line), for buildings you can partly walk into: between the torii's
// posts, under the gas station's canopy (8 px deep). Everything else is
// solid over its whole picture.
const OPEN = {
  torii: [[5, 2, 3, 0], [19, 2, 3, 0]],
  gasStation: [[4, 1, 3, 0], [14, 2, 3, 0], [24, 4, 3, 0], [38, 4, 3, 0], [50, 2, 3, 0], [56, 12, 14, 0], [0, 68, 30, 9]],
};

/** Every building: type -> { label, w, h } (pixels). */
export const BUILDINGS = Object.fromEntries(Object.entries(DEFS).map(([k, [label, w, h]]) => [k, { label, w, h }]));

/**
 * Draw one building into a 2D context `g`, centred on b.x with its ground
 * line (the bottom of the front wall) at b.y. Draw people standing in front
 * of it after it, and people behind it (smaller y) before it.
 */
export function drawBuilding(g, b) {
  const def = DEFS[b.type];
  if (!def) return;
  const [, w, , draw] = def;
  const L = Math.round(b.x - w / 2), y = Math.round(b.y);
  const rng = seeded((b.seed ?? 1) * 97 + Object.keys(DEFS).indexOf(b.type));
  const wall = b.wall ?? WALL_COLORS[Math.floor(rng() * WALL_COLORS.length)];
  const roof = b.roof ?? ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)];
  const r = (c, dx, up, rw, rh) => { g.fillStyle = c; g.fillRect(L + dx, y - up - rh, rw, rh); };
  draw(r, rng, b, wall, roof);
}

/**
 * The ground a building takes, as rectangles { x, y, w, h } in the canvas:
 * its whole picture (nobody walks behind a building), or for a torii and a
 * gas station only the posts, pumps and kiosk (you walk through and under).
 */
export function buildingSolids(b) {
  const { w, h } = BUILDINGS[b.type];
  const L = Math.round(b.x - w / 2), y = Math.round(b.y);
  if (OPEN[b.type]) return OPEN[b.type].map(([dx, sw, top, bottom]) => ({ x: L + dx, y: y - top, w: sw, h: top - bottom + 1 }));
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
