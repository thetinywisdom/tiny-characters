// Full-size buildings, part C (merged into tinyBuildingsFull.js when reviewed).
// fishmonger, udonSoba, familyRestaurant, takoyaki, karaoke: each makes the same
// rng choices in the same order as its old drawing in tinyBuildings.js.
import { shade, seeded } from '../tinyCharacters.js';
import {
  V, floorAt, DOORS, WINDOWS, sign, upright, awning, noren, lantern, flatRoof, flatTop, pitched, icon, windowRow,
  INK, WHITE, RED, NAVY, GOLD, GLASS, WOOD, DARKWOOD, LIGHTWOOD, CONCRETE, FRAME, METAL, PAPER, HI,
} from '../tinyBuildingsFull.js';

// the kit's storeys (FULL_STOREY), as plain numbers: nothing imported is read at load time
const GF = 24, SHOP_GF = 28, SILL = 6;
/** The old (scale 1) width a full-size width came from. */
const oldW = (w) => Math.round(w / 1.5);
/** The same painter moved ox pixels to the right (text, icons and the night's force too). */
function shifted(r0, ox) {
  const r = (c, dx, up, w, h) => r0(c, dx + ox, up, w, h);
  r.k = r0.k;
  if (r0.px) r.px = (c, dx, up, w, h) => r0.px(c, dx + Math.round(ox * (r0.k ?? 1)), up, w, h);
  if (r0.text) r.text = (str, c, dx, up, w, h, v) => r0.text(str, c, dx + ox, up, w, h, v);
  if (r0.force) r.force = (c, dx, up, w, h) => r0.force(c, dx + ox, up, w, h);
  return r;
}

/**
 * A sign whose name fills the whole board (as the old one-colour signs did), the
 * board edged like the kit's sign. Falls back to the kit's letter marks.
 */
function bigSign(r, bg, fg, dx, up, w, h, text) {
  const f = r.force ?? r;
  f(shade(bg, 0.7), dx, up, w, h); f(bg, dx + 1, up + 1, w - 2, h - 2);
  if (r.text && r.text(text, fg, dx, up, w, h)) return;
  sign(r, bg, fg, dx, up, w, h, '');
}

export const PART = {
  fishmonger: {
    approved: false,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), aw = v.pick([[NAVY, WHITE], ['#3f7fd6', WHITE], [RED, WHITE]]);
      const DARK = '#3a3f44', ICE = '#dfe8ec', lr = seeded((b.seed ?? 1) * 53 + 11);   // lr: details only, never the building's choices
      const nFish = Math.max(0, Math.ceil((oldW(w) - 8) / 4));                // as many fish as the old one (one rng each)
      r(shade(wall, 0.9), 0, 18, w, SHOP_GF - 18);                            // the band behind the awning and sign
      // the open front: the shop inside in shadow
      r(DARK, 0, 0, w, 18); r(shade(DARK, 0.8), 0, 15, w, 3);
      // at the back: a row of white polystyrene fish boxes, bare bulbs hanging over them
      const nb = Math.floor((w - 6) / 10), bx0 = Math.round((w - (nb * 10 - 2)) / 2);
      for (let x = bx0; x < bx0 + nb * 10; x += 10) { r('#e8e8e2', x, 10, 8, 3); r(shade('#e8e8e2', 1.06), x, 12, 8, 1); r(lr() < 0.5 ? '#3f7fd6' : RED, x + 2, 10, 4, 1); }
      for (let x = bx0 + 18; x < bx0 + nb * 10 - 10; x += 20) { r(INK, x, 15, 1, 1); r(GOLD, x - 1, 13, 3, 2); r(shade(GOLD, 1.2), x - 1, 14, 1, 1); }
      // the posts either side, lit on the left
      r(shade(wall, 0.8), 0, 0, 2, 18); r(shade(wall, 0.95), 0, 0, 1, 18);
      r(shade(wall, 0.7), w - 2, 0, 2, 18);
      // the display: ice behind a low glass front, fish laid on it
      r(shade(ICE, 0.8), 3, 0, w - 6, 2);                                     // its foot
      r(ICE, 3, 2, w - 6, 7);
      for (let x = 5; x < w - 4; x += 4) r(WHITE, x, 3, 1, 1);                 // crushed ice glinting
      const step = 6, x0 = Math.floor((w - (nFish * step - 1)) / 2);
      for (let i = 0; i < nFish; i++) {
        const c = rng() < 0.5 ? '#b3b0a8' : '#d8b0a0', x = x0 + i * step;
        r(c, x, 5, 4, 1); r(shade(c, 0.7), x + 1, 6, 3, 1); r(shade(c, 0.88), x + 1, 4, 3, 1);   // pointed head, dark back, belly
        r(shade(c, 0.6), x + 4, 6, 1, 1); r(shade(c, 0.6), x + 4, 4, 1, 1);    // the forked tail
      }
      r(WHITE, 2, 9, w - 4, 1); r(shade(WHITE, 0.85), 2, 8, w - 4, 1);         // the counter's white edge
      bigSign(r, WHITE, aw[0], 1, 21, w - 2, 7, 'FISH');
      awning(r, aw[0], aw[1], -1, 16, w + 2, 5);                              // a row lower than a shop's: the big FISH sign clear above it
      flatTop(r, v, wall, SHOP_GF, w);
    },
  },

  udonSoba: {
    approved: false,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), floors = v.chance(0.7) ? 2 : 1, top = floorAt(floors), front = v.pick([WOOD, DARKWOOD, '#7a5a3a']);
      const doorRight = v.chance(0.6), dx = doorRight ? w - 21 : 5, norenC = v.pick(['#3a5a7a', NAVY, '#7a2a22']);
      const POST = shade(front, 0.72), EAVE = '#3a3f44';
      if (floors === 2) {
        r(wall, 0, GF, w, top - GF); r(shade(wall, 0.88), 0, GF, w, 2);          // in shade under the little roof
        r(shade(wall, 0.9), w - 1, GF, 1, top - GF);
        windowRow(r, rng, v.pick(['aluPair', 'alu']), 3, w - 3, floorAt(1) + SILL, 2);
      }
      r(front, 0, 0, w, GF); r(POST, 0, 0, 2, GF); r(POST, w - 2, 0, 2, GF); r(shade(front, 1.12), 0, 0, 1, GF);
      r(shade(front, 0.6), 0, 0, w, 2); r(shade(front, 0.82), 0, 2, w, 1);   // the plinth
      const lx = doorRight ? 5 : 29, lw = w - 34;
      WINDOWS.lattice(r, lx, SILL, lw, 9);
      r(shade(front, 0.6), lx - 1, SILL - 2, lw + 2, 1);                       // the sill's shadow
      const sw = Math.min(lw, 24);
      r(INK, lx + 2, 15, 1, 1); r(INK, lx + sw - 3, 15, 1, 1);                 // the sign's hooks
      sign(r, LIGHTWOOD, INK, lx, 16, sw, 7, 'UDON');
      DOORS.sliding(r, dx); noren(r, norenC, dx - 2, 11, 20, 8);
      lantern(r, doorRight ? dx - 6 : dx + 19, 10);
      const kind = v.pick(['pitched', 'hipped']), rc = b.roof ?? v.pick(['#3a3f44', '#4a4442']);
      r(EAVE, -2, GF - 3, w + 4, 3); r(shade(EAVE, 1.3), -2, GF - 1, w + 4, 1); r(shade(EAVE, 0.6), -2, GF - 3, w + 4, 1);   // a little tiled roof over the shop front
      for (let x = 0; x < w + 2; x += 3) r(shade(EAVE, 0.8), x - 1, GF - 2, 1, 1);
      pitched(r, rc, -2, top, w + 4, Math.round(v.int(12, 15) * 1.5), kind === 'hipped' ? 3 : 0);
    },
  },

  familyRestaurant: {
    approved: false,
    draw(r0, rng, b, wall0, roof, w) {
      const v = V(rng), signC = v.pick(['#2fa36b', '#d8443c', '#3f7fd6']);
      // the pole sign
      r0(CONCRETE, 3, 0, 7, 2); r0(shade(CONCRETE, 0.8), 3, 0, 7, 1);
      r0(INK, 5, 2, 2, 30); r0(shade(INK, 1.4), 5, 2, 1, 30);
      const r = shifted(r0, 12), bw = w - 12;
      const wall = b.wall ?? v.pick(['#b89e80', '#d8c8a8', '#c8a088']), frameC = v.pick(['#a03a2c', '#3a6a4a', '#4a4e54']);
      const n = Math.floor((oldW(w) - 8 - 12) / 10);
      r(wall, 0, 0, bw, GF); r(shade(wall, 0.86), bw - 2, 0, 2, GF);           // the right end in shade
      r(shade(wall, 0.72), 0, 0, bw, 3); for (let x = 3; x < bw; x += 6) r(shade(wall, 0.62), x, 1, 1, 2);   // a tiled skirting
      r(shade(wall, 0.62), 0, 3, bw, 1);
      const SEAT = shade(signC, 0.7);
      for (let i = 0; i < n; i++) {                                           // big windows: booths, a table, a lamp
        const x = 3 + i * 15;
        r(frameC, x, 3, 13, 15); r(GLASS, x + 1, 4, 11, 13);
        r(SEAT, x + 1, 4, 2, 5); r(SEAT, x + 10, 4, 2, 5); r(shade(SEAT, 1.2), x + 1, 8, 2, 1); r(shade(SEAT, 1.2), x + 10, 8, 2, 1);
        r(WHITE, x + 3, 7, 7, 1); r(shade(GLASS, 0.75), x + 6, 4, 1, 3);
        r(INK, x + 6, 13, 1, 3); r(GOLD, x + 5, 12, 3, 1);
        r(HI, x + 2, 13, 1, 2); r(HI, x + 3, 15, 1, 1);
        r(shade(frameC, 0.7), x - 1, 2, 15, 1);                                 // the sill
      }
      DOORS.glass(r, bw - 14); r(shade(wall, 0.75), bw - 15, 18, 11, 1);
      r(signC, bw - 16, 19, 13, 2); r(shade(signC, 0.75), bw - 16, 19, 13, 1); // a little canopy over the door
      r(GOLD, bw - 3, 12, 1, 2);                                              // a lamp by the door
      const rc = v.pick(['#d0603e', '#7a3a32', '#4a5560']);
      pitched(r, rc, -1, GF, bw + 2, 21, 2);
      r(signC, -1, GF, bw + 2, 2); r(shade(signC, 1.2), -1, GF + 1, bw + 2, 1);   // the fascia in the chain's colour
      bigSign(r0, signC, WHITE, 0, 33, 12, 8, 'DINER');                          // the pole's sign, in front of the eave
    },
  },

  takoyaki: {
    approved: false,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), aw = v.pick([['#f08a2c', '#f4e6c8'], [RED, WHITE], ['#2fa36b', '#f4e6c8']]);
      const BODY = '#e8e0d0', DARK = '#3a3f44', BALL = '#c09060';
      r(BODY, 0, 0, w, SHOP_GF); r(shade(BODY, 0.86), w - 2, 0, 2, SHOP_GF); r(shade(BODY, 1.04), 0, 0, 1, SHOP_GF);
      flatRoof(r, BODY, 0, SHOP_GF, w, 12);
      // the open window: the stall inside, a shelf of sauce, mayonnaise and aonori at the back
      r(DARK, 2, 9, w - 4, 9); r(shade(DARK, 0.8), 2, 16, w - 4, 2);
      r(shade(DARK, 1.3), 3, 13, w - 6, 1);
      for (let x = 6, k = 0; x + 1 <= w - 6; x += 3, k++) r(['#7a3a32', '#f2efe0', '#5f8f5a'][k % 3], x, 14, 1, 2);
      // the counter: wood, a lit top, a red octopus on its front
      r(DARKWOOD, 0, 0, w, 7);
      for (let x = 4; x < w; x += 4) r(shade(DARKWOOD, 0.82), x, 1, 1, 6);
      r(shade(DARKWOOD, 0.7), 0, 0, w, 1);
      r(LIGHTWOOD, 0, 7, w, 2); r(shade(LIGHTWOOD, 1.15), 0, 8, w, 1);
      const ox = Math.floor(w / 2) - 3;
      r(DARKWOOD, ox - 1, 0, 9, 7);
      icon(r, ox, 1, ['..rrr..', '.rrrrr.', '.wwwww.', '.rrrrr.', 'r.r.r.r'], { r: '#d8443c', w: WHITE });
      // the iron griddle on the counter: two rows of balls in their hollows
      r('#2a2c30', 3, 9, w - 6, 3); r(shade('#2a2c30', 1.4), 3, 11, w - 6, 1);
      for (let x = 6; x + 3 <= w - 4; x += 4) { r(shade(BALL, 0.82), x, 11, 3, 1); }
      for (let x = 4; x + 3 <= w - 4; x += 4) { r(BALL, x, 9, 3, 2); r(shade(BALL, 1.2), x, 10, 2, 1); }
      awning(r, aw[0], aw[1], -1, 17, w + 2, 5);
      bigSign(r, '#e0d2b0', '#7a3a32', 0, 22, w, 9, 'TAKOYAKI');
      lantern(r, v.chance(0.5) ? 2 : w - 5, 10);
    },
  },

  karaoke: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), floors = v.int(3, 5), top = floorAt(floors), wall = v.pick(['#2a2a30', '#3a2a40', '#2a3040']);
      const signLeft = v.chance(0.4);
      r(wall, 0, 0, w, top);
      r(shade(wall, 1.25), 0, 0, 1, top); r(shade(wall, 0.8), w - 1, 0, 1, top);   // lit on the left, in shade on the right
      for (let f = 1; f < floors; f++) r(shade(wall, 1.3), 0, floorAt(f), w, 1);   // a ledge at each floor
      // as many glowing windows a floor as the old one (one rng each)
      const wo = oldW(w), n = Math.max(1, Math.floor(((signLeft ? wo - 2 : wo - 7) - (signLeft ? 7 : 2) - 3) / 8));
      const x0 = signLeft ? 11 : 3, x1 = signLeft ? w - 3 : w - 11;
      for (let f = 1; f < floors; f++) windowRow(r, rng, 'neon', x0, x1, floorAt(f) + SILL, n);
      // the upright sign, a chase of bulbs either side
      const sx = signLeft ? 2 : w - 9, sh = top - GF - 6, BULBS = ['#e8603a', '#f2a040', '#e870a0', '#6ac8f2'];
      for (const bx of [sx - 1, sx + 7]) for (let k = 0, y = GF + 3; y < GF + 3 + sh; y += 2, k++) r(BULBS[k % 4], bx, y, 1, 1);
      r(METAL, sx + 1, GF + 1, 1, 2); r(METAL, sx + 5, GF + 1, 1, 2);       // its brackets
      const f = r.force ?? r;
      f(shade(WHITE, 0.7), sx, GF + 3, 7, sh); f(WHITE, sx + 1, GF + 4, 5, sh - 2);
      if (!(r.text && r.text('KARAOKE', '#d8302a', sx, GF + 3, 7, sh, true))) upright(r, WHITE, '#d8302a', sx, GF + 3, 7, sh, '');
      // the lobby: tinted glass, a glass door, a neon bar over them
      const glassC = v.pick(['#7a6aa8', '#a85a8a', '#5a7aa8']);
      WINDOWS.shop(r, 3, 0, w - 21, 18, FRAME, glassC); DOORS.glass(r, w - 15);
      const neonC = v.pick(['#f2a040', '#e870a0', '#6ac8f2']);
      r('#1f1f24', 3, 19, w - 12, 4); r(neonC, 4, 20, w - 14, 2);
      flatTop(r, v, wall, top, w);
    },
  },
};
