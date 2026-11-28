// Full-size street things, part 2: the vending machine, the bench, the bus stop, the bins,
// the bike rack, bike parking, the post box, the pot plant, the drinking fountain.
// Each makes the same rng calls in the same order as the old drawing in tinyStreet.js and
// keeps the spots other code relies on at the old place times 1.5 (the vending machine's
// lit window under its glow at old [3.5, 7]; the bench's seat at old up 3, so people
// sitting on it (sitBench, at the bench's x +- 5) sit on the planks).
import { shade, seeded } from '../tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', RED = '#d8443c', METAL = '#6a6f76', DARK = '#4a4e54';
const WOOD = '#8a6440', LIGHTWOOD = '#b88a58', CONCRETE = '#b0aca2';
const pick = (rng, a) => a[Math.floor(rng() * a.length)];

export const PART = {
  // 11 x 17: the body, a lit window of drinks (two shelves of three, a row of buttons
  // under each), the coin slot and its little display, the flap where the can comes out
  vendingMachine: { approved: true, draw(r, rng) {
    const c = pick(rng, ['#d8443c', '#2f6fb8', '#e8e8e4', '#2f8a5a', '#f08a2c']), E = shade(c, 0.72);
    r(c, 0, 0, 11, 17); r(shade(c, 0.8), 10, 0, 1, 17); r(shade(c, 1.12), 0, 1, 1, 15);   // the body, its side, a lit edge
    r(DARK, 0, 0, 11, 1);                                                               // its foot
    r(shade(c, 0.85), 0, 15, 11, 2); r(shade(c, 1.1), 1, 16, 9, 1);                     // the top band
    r(E, 0, 5, 10, 1);                                                                  // the window's sill
    r('#e4eef2', 1, 6, 9, 9);                                                           // the lit window of drinks
    for (const up of [6, 10]) {                                                         // two shelves, a row of buttons under each
      r('#c4ced6', 1, up, 9, 1);
      for (let i = 0; i < 3; i++) r('#7fc8a8', 2 + i * 3, up, 2, 1);
    }
    for (const up of [7, 11]) for (let i = 0; i < 3; i++) {
      const d = pick(rng, ['#d8443c', '#3f7fd6', '#f2c230', '#2fa36b', '#a85a3a', WHITE]);
      r(d, 2 + i * 3, up, 2, 3); r(shade(d, d === WHITE ? 0.85 : 1.2), 2 + i * 3, up + 2, 2, 1);   // a can, its lid
      r(shade(d, 0.8), 3 + i * 3, up, 1, 2);
    }
    r(INK, 7, 3, 2, 2); r('#3fd0a0', 7, 4, 2, 1);                                       // the price display
    r(INK, 9, 3, 1, 2);                                                                 // the coin slot
    r(INK, 1, 1, 5, 2); r(shade(c, 0.6), 1, 3, 5, 1); r(shade(c, 1.15), 1, 4, 5, 1);    // where the can comes out, its flap
  } },

  // 18 x 8: dark iron legs, the front edge, the seat (old up 3 times 1.5: up 4 and 5,
  // where the sitters' thighs go), the backrest of two slats
  bench: { approved: true, draw(r) {
    for (const dx of [1, 15]) { r(DARK, dx, 0, 2, 4); r(shade(DARK, 1.25), dx, 0, 1, 4); r(shade(DARK, 0.8), dx, 0, 2, 1); }   // the legs
    r(shade(WOOD, 0.8), 0, 3, 18, 1);                                                   // the front edge
    r(LIGHTWOOD, 0, 4, 18, 2); r(shade(LIGHTWOOD, 1.1), 0, 5, 18, 1);                   // the seat
    r(WOOD, 0, 6, 18, 2); r(shade(WOOD, 1.15), 0, 7, 18, 1);                            // the backrest
    for (const dx of [2, 15]) r(shade(WOOD, 0.7), dx, 6, 1, 2);                         // its bolts
  } },

  // 30 x 24: two posts, the glass back with an advert, a bench, the blue roof; beside it
  // the sign post: the timetable and the round bus sign with its white band
  busStop: { approved: true, draw(r) {
    const G = '#c8dcea';
    r(G, 2, 6, 20, 13); r(shade(G, 0.9), 2, 6, 20, 1); r(shade(G, 0.94), 2, 12, 20, 1);   // the glass, its frame bar
    r(WHITE, 4, 14, 1, 3); r(WHITE, 6, 16, 1, 1);                                       // glints
    r('#f2c230', 15, 7, 6, 10); r(shade('#f2c230', 0.85), 15, 7, 6, 1);                 // the advert
    r(WHITE, 16, 9, 4, 6); r('#3f7fd6', 17, 10, 2, 4); r(WHITE, 17, 12, 2, 1); r(shade('#3f7fd6', 1.25), 17, 13, 2, 1);   // a can on it
    r(RED, 16, 15, 4, 1);
    for (const dx of [0, 22]) { r(METAL, dx, 0, 2, 19); r(shade(METAL, 1.25), dx, 0, 1, 19); }   // the posts
    for (const dx of [4, 18]) r(DARK, dx, 0, 2, 4);                                     // the bench
    r(WOOD, 3, 4, 18, 2); r(shade(WOOD, 1.2), 3, 5, 18, 1);
    r(shade('#3a6a9a', 0.75), 0, 19, 24, 1); r('#3a6a9a', 0, 20, 24, 1); r('#5a8aba', 0, 21, 24, 1);   // the roof
    r(METAL, 27, 0, 1, 18); r(shade(METAL, 0.8), 26, 0, 3, 1);                          // the sign post
    r(WHITE, 25, 10, 5, 5); r(shade(WHITE, 0.82), 25, 10, 5, 1);                        // the timetable
    for (const up of [11, 13]) r(INK, 26, up, 3, 1);
    r('#2c6fd0', 26, 16, 3, 5); r('#2c6fd0', 25, 17, 5, 3);                             // the round bus sign
    r(WHITE, 25, 18, 5, 1);                                                             // its white band
  } },

  // 13 x 9: a blue and a green bin, lids, an opening and a white label each
  bins: { approved: true, draw(r) {
    for (const [dx, c] of [[0, '#3f7fd6'], [7, '#2fa36b']]) {
      r(c, dx, 0, 6, 7); r(shade(c, 0.85), dx + 5, 0, 1, 7); r(shade(c, 1.15), dx, 0, 1, 7); r(shade(c, 0.7), dx, 0, 6, 1);   // the body
      r(shade(c, 0.75), dx, 7, 6, 2); r(shade(c, 0.9), dx, 8, 6, 1);                    // the lid
      r(INK, dx + 1, 7, 4, 1); r(shade(c, 0.6), dx, 6, 6, 1);                           // the opening under the lid, its shadow
      r(WHITE, dx + 1, 3, 4, 2);                                                        // the label
    }
  } },

  // 24 x 9: two bikes in a ground rack, wheels with hubs, frame, saddle, handlebar, maybe a basket
  bikeRack: { approved: true, draw(r, rng) {
    r(METAL, 0, 0, 24, 1);
    for (const bx of [0, 12]) {
      const c = pick(rng, ['#d8443c', '#3f7fd6', WHITE, '#2fa36b', '#f2c230', INK]), hi = c === WHITE ? shade(c, 0.9) : shade(c, c === INK ? 1.6 : 1.15);
      for (const wx of [bx, bx + 6]) {                                                  // the wheels: tyres round a hub
        r(INK, wx + 1, 0, 3, 1); r(INK, wx + 1, 4, 3, 1); r(INK, wx, 1, 1, 3); r(INK, wx + 4, 1, 1, 3);
        r('#9aa0a6', wx + 2, 2, 1, 1);
      }
      r(c, bx + 3, 5, 6, 1); r(hi, bx + 4, 5, 4, 1);                                    // the top tube
      r(c, bx + 2, 3, 1, 1); r(c, bx + 3, 2, 1, 1);                                     // the stays
      r(c, bx + 5, 3, 1, 2); r(INK, bx + 5, 2, 1, 1); r(DARK, bx + 5, 1, 2, 1);         // the down tube, the crank, a pedal
      r(c, bx + 8, 3, 1, 1); r(c, bx + 8, 6, 1, 1); r(INK, bx + 8, 7, 3, 1);            // the fork, the stem, the handlebar
      r(c, bx + 3, 6, 1, 1); r(INK, bx + 2, 7, 3, 1);                                   // the seat post, the saddle
      if (rng() < 0.5) { r(METAL, bx + 9, 5, 3, 2); r(shade(METAL, 1.3), bx + 9, 6, 3, 1); r(shade(METAL, 0.8), bx + 10, 5, 1, 1); }   // a basket
    }
  } },

  // 54 x 18: bike parking (the owner chose B, Nov 2026): ten city bikes side by side, seen end on
  // from behind, every other one pushed in further; a coloured mudguard with a red reflector, the
  // rack over the back wheel, the saddle, and beyond them the handlebar and (most) a wire basket; a rail
  bikeParking: { approved: true, draw(r, rng) {
    const COLS = ['#3f7fd6', '#e8402f', WHITE, '#2f8a5a', '#c8ccd0', '#3a3d42', '#d46a8e', '#e8c840', '#8a5a2a'];
    for (let i = 0; i < 10; i++) {
      const c = pick(rng, COLS), bx = 3 + i * 5, st = (i % 2) * 2, basket = rng() < 0.8;
      r(INK, bx - 1, 13 + st, 5, 1);                                                    // the handlebar beyond
      if (basket) { r('#9aa0a6', bx - 1, 14 + st, 3, 2); r('#7a8088', bx, 14 + st, 1, 1); }   // its basket
      r(c, bx, 9 + st, 1, 3);                                                           // the frame
      r('#2a2c30', bx - 1, 10 + st, 3, 1);                                              // the saddle
      r('#a8aeb4', bx - 1, 8 + st, 3, 1);                                               // the rack over the back wheel
      r(c, bx - 1, 5 + st, 3, 3); r(shade(c, 0.78), bx + 1, 5 + st, 1, 3);              // the mudguard
      r('#e8403a', bx, 6 + st, 1, 1);                                                   // the reflector
      r(INK, bx, st, 1, 5);                                                             // the tyre
    }
    r('#8a9096', 0, 2, 54, 1); r('#6a7076', 0, 1, 54, 1);                               // the rail
  } },

  // 9 x 28: a coin-parking sign: a yellow board with a black P on a grey pole
  parkingSign: { approved: true, draw(r) {
    r('#8a9096', 4, 0, 1, 20); r('#a8aeb4', 4, 0, 1, 1);
    r('#f2c230', 0, 19, 9, 9); r(shade('#f2c230', 0.85), 8, 19, 1, 9);
    r(INK, 2, 20, 1, 6); r(INK, 3, 25, 2, 1); r(INK, 5, 23, 1, 2); r(INK, 3, 22, 2, 1);   // the P
  } },
  // 6 x 12: the lot's pay machine: white, a yellow top, its screen and slot
  payMachine: { approved: true, draw(r) {
    r('#e8e8e4', 0, 0, 6, 12); r('#c8ccd0', 5, 0, 1, 12); r('#f2c230', 0, 10, 6, 2);
    r('#3a3f44', 1, 6, 4, 2); r('#7fc8a8', 2, 7, 2, 1); r(INK, 2, 3, 2, 1);
  } },

  // 6 x 12: the red Japanese post box, a rounded top, the slot, a white 〒
  postBox: { approved: true, draw(r) {
    const S = shade(RED, 0.8);
    r(RED, 0, 0, 6, 10); r(S, 5, 0, 1, 10); r(shade(RED, 1.15), 0, 1, 1, 9);            // the body
    r(RED, 1, 10, 4, 1); r(S, 4, 10, 1, 1); r(RED, 2, 11, 2, 1);                        // the rounded top
    r(shade(RED, 0.6), 0, 0, 6, 1);                                                     // its foot
    r(shade(RED, 0.7), 1, 9, 4, 1); r(INK, 1, 8, 4, 1);                                 // the slot under its lip
    r(WHITE, 1, 6, 3, 1); r(WHITE, 1, 4, 3, 1); r(WHITE, 2, 2, 1, 2);                   // 〒
  } },

  // 8 x 9: a terracotta pot with a rim, a bushy plant in two clumps, maybe flowers
  plantPot: { approved: true, draw(r, rng, p) {
    const T = '#a8664a';
    r(T, 1, 0, 6, 2); r(shade(T, 0.8), 5, 0, 2, 2); r(shade(T, 0.7), 1, 0, 6, 1);        // the pot
    r(shade(T, 1.12), 0, 2, 8, 1); r(shade(T, 0.85), 6, 2, 2, 1);                       // its rim
    const c = pick(rng, ['#5f8f5a', '#4a7a4a', '#6a9a5a']), D = shade(c, 0.8), L = shade(c, 1.2);
    r(c, 0, 3, 8, 3); r(D, 0, 3, 8, 1); r(D, 6, 3, 2, 2);                               // the lower clump
    r(c, 1, 6, 6, 2); r(c, 2, 8, 3, 1); r(D, 6, 6, 1, 1);                               // the upper clump
    r(L, 1, 6, 1, 2); r(L, 2, 8, 1, 1); r(L, 0, 4, 2, 1);                               // the light side
    const v = seeded((p?.seed ?? 1) * 7 + 3);
    r(L, 3 + Math.floor(v() * 2), 7, 1, 1); r(D, 3 + Math.floor(v() * 2), 4, 1, 1);    // a leaf or two
    if (rng() < 0.5) { const f = pick(rng, [RED, '#f2c230', '#d46a8e', WHITE]); r(f, 1, 4, 2, 1); r(f, 2, 5, 1, 1); r(f, 4, 7, 2, 1); r(f, 5, 8, 1, 1); }
  } },

  // 9 x 17: a concrete column on a foot, a push button, the basin with water in it, the spout
  drinkingFountain: { approved: true, draw(r) {
    const C = CONCRETE, B = '#c8c4ba';
    r(shade(C, 0.8), 1, 0, 7, 1);                                                       // the foot
    r(C, 2, 1, 6, 11); r(shade(C, 0.85), 6, 1, 2, 11); r(shade(C, 1.1), 2, 1, 1, 11);   // the column
    r(shade(C, 0.9), 2, 11, 6, 1);                                                      // the basin's shadow on it
    r(shade(B, 0.8), 0, 12, 9, 1); r(B, 0, 13, 9, 2); r(shade(B, 0.88), 7, 13, 2, 2);   // the basin
    r(shade(B, 1.1), 0, 14, 9, 1); r('#9fd0f0', 2, 14, 5, 1); r('#c8e8f8', 3, 14, 2, 1);   // its rim, the water in it
    r('#8a9096', 3, 15, 3, 1); r('#8a9096', 4, 16, 1, 1); r('#9fd0f0', 5, 16, 1, 1);    // the spout, a drop
  } },
};
