// Full-size street things, part 3: the playground and the court (swings, slide,
// sandbox, basketball hoop), a garden's block wall, crates and an AC unit.
// Each makes the same rng calls in the same order as its old drawing in
// tinyStreet.js; new detail comes from its own seeded stream (from p.seed).
// Spots other code relies on stay at the old place times 1.5: the swing bar
// (drawSwings in tinyLife.js hangs the seats from it: SWING_SEATS), the slide's
// ladder and chute (demo/life.js playSlide), the hoop's rim, the wall's top (a cat
// naps on it at 10 up).
import { shade, seeded } from '../tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', DARK = '#4a4e54';
const RED = '#c8402c', BLUE = '#3f7fd6', GREY = '#8a9096';

/**
 * The swings' seats (drawSwings in tinyLife.js hangs them the same way): their centres (dx),
 * the hooks under the bar (up), how long the chains are (the seat's top row is len below the
 * hook), the seat's half width and height, its colours (seatTop: its lit top row).
 */
export const SWING_SEATS = { centres: [13, 31], top: 29, len: 23, half: 4, seatH: 2, hook: GREY, seat: BLUE, seatTop: '#4a96fd' };
/** A chain's pixel d below its hook (links alternate dark and darker). */
export const chainColour = (d) => (d % 2 ? '#3e4247' : INK);

const newStream = (p, n) => seeded(((p?.seed ?? 1) * 7919 + n) >>> 0);

export const PART = {
  // --- swings: two red posts and a bar (45 x 33), two blue seats on chains ---
  swings: {
    approved: true,
    draw(r, rng, p) {
      const lite = shade(RED, 1.16), dim = shade(RED, 0.8), CLAMP = '#8a9096';
      for (const x of [0, 42]) {
        r('#9a968c', x, 0, 3, 1);                                                    // the footing
        r(RED, x, 1, 3, 30); r(lite, x, 1, 1, 30); r(dim, x + 2, 1, 1, 30);         // the posts
        r(CLAMP, x, 26, 3, 2); r(shade(CLAMP, 1.2), x, 27, 3, 1);                    // a clamp under the bar
      }
      r(RED, 0, 30, 45, 3); r(dim, 0, 30, 45, 1); r(lite, 0, 32, 45, 1);            // the bar
      r(dim, 0, 32, 1, 1); r(dim, 44, 32, 1, 1);                                     // its ends, capped
      if (p?.frameOnly) return;                                                      // drawSwings hangs the seats itself
      const S = SWING_SEATS;
      for (const c of S.centres) {
        for (const dx of [c - S.half, c + S.half]) {
          r(S.hook, dx, S.top, 1, 1);                                                  // the hook
          for (let d = 1; d < S.len; d++) r(chainColour(d), dx, S.top - d, 1, 1);    // the chain
        }
        const up = S.top - S.len - S.seatH + 1;                                      // the seat (5 up)
        r(S.seat, c - S.half, up, S.half * 2 + 1, S.seatH); r(S.seatTop, c - S.half, up + S.seatH - 1, S.half * 2 + 1, 1);
      }
    },
  },

  // --- slide: a ladder up to a yellow top (33 x 27), the chute down to the right ---
  slide: {
    approved: true,
    draw(r) {
      const L = GREY, LL = shade(GREY, 1.2), LD = shade(GREY, 0.78);
      for (const x of [0, 7]) { r(L, x, 0, 2, 21); r(LL, x, 0, 1, 21); }           // the ladder's rails
      for (const up of [3, 8, 12, 17]) { r(L, 2, up, 5, 1); r(LD, 2, up - 1, 5, 1); }   // its rungs (a shadow under each)
      // the chute: a band three high falling one to one, the old joints every sixth pixel
      const C = '#e8c040', J = '#e8b830';
      r(L, 25, 0, 2, 8); r(LL, 25, 0, 1, 8);                                         // a leg under it
      for (let i = 0; i <= 20; i++) {
        const c = i % 6 === 5 ? J : C, lo = 19 - i;                                  // its underside, side wall, lip
        r(shade(c, 0.8), 12 + i, lo, 1, 1); r(c, 12 + i, lo + 1, 1, 2); r(shade(c, 1.14), 12 + i, lo + 3, 1, 1);
      }
      r(shade(C, 0.8), 30, 0, 3, 1); r(C, 31, 1, 2, 1); r(shade(C, 1.14), 32, 2, 1, 1);   // its end, flattened out
      // the top
      const Y = '#f2c230';
      r(Y, 0, 21, 12, 6); r(shade(Y, 0.85), 0, 21, 12, 1); r(shade(Y, 1.12), 0, 26, 12, 1);
      r(shade(Y, 0.78), 11, 22, 1, 4);                                               // its corner
    },
  },

  // --- sandbox: a wooden frame round the sand (39 x 15), a castle, a heap, a bucket ---
  sandbox: {
    approved: true,
    draw(r, rng, p) {
      const W = '#8a6440', WL = shade(W, 1.22), WD = shade(W, 0.78), SAND = '#e8d8a8', HEAP = '#c8b888';
      const s = newStream(p, 3);
      r(W, 0, 0, 39, 15);                                                            // the frame
      r(SAND, 3, 3, 33, 10);                                                         // the sand
      r(shade(SAND, 0.9), 3, 12, 33, 1); r(shade(SAND, 0.94), 3, 11, 33, 1);         // in the back board's shade
      for (let i = 0; i < 8; i++) r(shade(SAND, 0.93), 4 + Math.floor(s() * 31), 4 + Math.floor(s() * 6), 1 + Math.floor(s() * 2), 1);   // footprints, dug spots
      // the boards: the back edge, the sides, the front (lit on top)
      r(WL, 0, 14, 39, 1); r(WD, 3, 12, 33, 1);
      r(WD, 2, 3, 1, 10); r(WL, 0, 3, 1, 11); r(WD, 36, 3, 1, 10); r(shade(W, 0.9), 38, 3, 1, 11);
      r(WL, 0, 2, 39, 1); r(WD, 0, 0, 39, 1);
      for (const x of [13, 26]) r(WD, x, 0, 1, 2);                                   // the front board's joints
      // a castle with two towers, a heap
      r(HEAP, 8, 4, 9, 3); r(HEAP, 8, 7, 2, 2); r(HEAP, 15, 7, 2, 2); r(HEAP, 11, 7, 3, 1); r(HEAP, 12, 8, 1, 1);
      r(shade(HEAP, 0.85), 8, 4, 9, 1); r(shade(HEAP, 1.08), 8, 8, 2, 1); r(shade(HEAP, 1.08), 15, 8, 2, 1); r(shade(HEAP, 0.8), 12, 5, 1, 2);
      r(HEAP, 22, 7, 6, 2); r(HEAP, 23, 9, 4, 1); r(shade(HEAP, 1.08), 23, 9, 3, 1); r(shade(HEAP, 0.85), 22, 7, 6, 1);
      // the bucket (the old one's choice of colour), its handle, and a spade
      const b = rng() < 0.5 ? '#c8402c' : '#3f7fd6';
      r(b, 28, 3, 4, 1); r(b, 27, 4, 6, 3); r(shade(b, 1.2), 27, 6, 6, 1); r(shade(b, 0.75), 28, 7, 4, 1); r(shade(b, 0.8), 32, 3, 1, 4);
      r(INK, 27, 7, 1, 1); r(INK, 32, 7, 1, 1); r(INK, 28, 8, 1, 1); r(INK, 31, 8, 1, 1); r(INK, 29, 9, 2, 1);
      if (s() < 0.7) { const c = s() < 0.5 ? '#f2c230' : '#2fa36b'; r(c, 19, 4, 2, 2); r(shade(c, 0.8), 21, 5, 4, 1); }
    },
  },

  // --- basketball hoop: a pole (15 x 36), the backboard, the rim and net ---
  hoop: {
    approved: true,
    draw(r) {
      r(DARK, 5, 0, 5, 1); r(GREY, 6, 1, 3, 23); r(shade(GREY, 1.2), 6, 1, 1, 23); r(shade(GREY, 0.78), 8, 1, 1, 23);   // the base, the pole
      r(shade(GREY, 0.78), 6, 23, 3, 1);
      // the backboard: white, a dark edge on top and sides, its red square
      r(WHITE, 0, 24, 15, 11); r(shade(WHITE, 0.84), 1, 24, 13, 1);
      r(INK, 0, 33, 15, 2); r(INK, 0, 24, 1, 10); r(INK, 14, 24, 1, 10);
      r('#e8402f', 4, 26, 7, 5); r(WHITE, 5, 27, 5, 3);
      // the rim (seen a little from above) and the net
      const RIM = '#e8402f';
      r(shade(RIM, 0.7), 5, 23, 5, 1); r(RIM, 4, 23, 1, 1); r(RIM, 10, 23, 1, 1); r(RIM, 4, 22, 7, 1);
      r(DARK, 7, 24, 1, 1);                                                          // its bracket
      for (const x of [4, 6, 8, 10]) r(WHITE, x, 21, 1, 1);
      for (const x of [5, 7, 9]) r(WHITE, x, 20, 1, 1);
      for (const x of [5, 9]) r(shade(WHITE, 0.86), x, 19, 1, 1);
      for (const x of [6, 8]) r(WHITE, x, 19, 1, 1);
      r(WHITE, 7, 18, 1, 1); r(shade(WHITE, 0.86), 6, 18, 1, 1); r(shade(WHITE, 0.86), 8, 18, 1, 1);
    },
  },

  // --- block wall: concrete blocks, three courses (36 x 11), a cap on top (the cat naps on it) ---
  blockWall: {
    approved: true,
    draw(r, rng, p) {
      const B = '#b8b4aa', M = '#a29e94', CAP = '#d0ccc2', s = newStream(p, 5);
      r(B, 0, 0, 36, 9);
      for (let c = 0; c < 3; c++) {
        const up = c * 3, off = c % 2 ? 0 : 5;                                       // courses three high, the joints staggered
        for (let x = off - 9; x < 36; x += 9) {
          const x0 = Math.max(0, x), x1 = Math.min(36, x + 9), t = s();
          if (t < 0.25) r(shade(B, 0.96), x0, up, x1 - x0, 2); else if (t > 0.85) r(shade(B, 1.03), x0, up, x1 - x0, 2);
          if (x + 8 < 36 && x + 8 >= 0) r(M, x + 8, up, 1, 3);                      // the joint
        }
        r(M, 0, up + 2, 36, 1);                                                      // the bed joint
      }
      r(shade(B, 0.9), 0, 0, 36, 1);                                                 // damp at the foot
      r(CAP, 0, 9, 36, 2); r(shade(CAP, 0.84), 0, 9, 36, 1); r(shade(CAP, 1.05), 0, 10, 36, 1);   // the cap: its front, its top
    },
  },

  // --- crates: two side by side and one on top (15 x 12), slats and a hand hole ---
  crates: {
    approved: true,
    draw(r, rng, p) {
      const s = newStream(p, 7);
      r(shade('#8a6440', 0.7), 7, 0, 1, 6);                                          // the gap between the two below
      for (const [dx, up] of [[0, 0], [8, 0], [4, 6]]) {
        const c = shade('#a87a4a', 0.94 + s() * 0.1), cl = shade(c, 1.15), cd = shade(c, 0.82);
        r(c, dx, up, 7, 6);
        r(cd, dx, up, 7, 1);                                                         // the bottom slat's shade
        r('#6a4a2c', dx + 1, up + 2, 5, 1); r('#7a5634', dx + 1, up + 4, 5, 1);     // the gaps between the slats
        r(cl, dx, up + 5, 7, 1);                                                     // the top, lit
        r(shade(c, 1.06), dx, up + 1, 1, 4); r(shade(c, 0.86), dx + 6, up + 1, 1, 4);   // the corner posts
      }
    },
  },

  // --- AC unit (outdoor): a pale box (15 x 12), the round fan behind its grille, a side grille ---
  acUnit: {
    approved: true,
    draw(r) {
      const BODY = '#d8dce0', EDGE = '#b8bcc0', RIM = '#8a9096', FAN = '#5a5f66';
      r(BODY, 0, 1, 15, 11); r(shade(BODY, 1.05), 0, 11, 15, 1); r(EDGE, 0, 1, 15, 1);   // the box, its lit top, its foot
      r(DARK, 1, 0, 3, 1); r(DARK, 11, 0, 3, 1);                                     // the feet
      r(shade(BODY, 0.88), 14, 1, 1, 10);                                            // its side in shade
      // the fan, round, behind a grille of bars
      r(RIM, 2, 2, 9, 9); r(BODY, 2, 2, 1, 1); r(BODY, 10, 2, 1, 1); r(BODY, 2, 10, 1, 1); r(BODY, 10, 10, 1, 1);
      r(FAN, 3, 3, 7, 7); r(RIM, 3, 3, 1, 1); r(RIM, 9, 3, 1, 1); r(RIM, 3, 9, 1, 1); r(RIM, 9, 9, 1, 1);
      r(shade(FAN, 0.8), 4, 5, 5, 3);                                                // the blades, dark
      r(RIM, 6, 6, 1, 1);                                                            // the hub
      for (const up of [4, 6, 8]) r(shade(RIM, 0.9), 3, up, 7, 1);                   // the grille's bars
      r(RIM, 6, 6, 1, 1);
      for (const x of [12, 13]) r(EDGE, x, 3, 1, 7);                                 // the side grille's slats
      r(BODY, 12, 4, 2, 1); r(BODY, 12, 6, 2, 1); r(BODY, 12, 8, 2, 1);
    },
  },
};
