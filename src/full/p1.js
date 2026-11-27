// Full-size street things, part 1: poles, lamps and signals (the utility pole, the street
// lamps, the stone lantern, the traffic light, the floodlight, the plaza clock, the red
// lantern, the level crossing gate, the stop sign). Each makes the same rng calls as its old
// drawing in tinyStreet.js and keeps every spot other code relies on at the old place times
// 1.5: lamp heads under their night glows (propLights), the crossarm's ends where the wires
// hang (poleTops: dx 0 and 14, the crossarm's bottom row 39 up), the signal lamps, the
// crossing gate's lamps and boom.
import { shade } from '../tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2f2ee', RED = '#d8443c', METAL = '#6a6f76', DARK = '#4a4e54';
const LAMP = '#fff2c0', STONE = '#a8a49a', CONCRETE = '#b0aca2';
const YELLOW = '#f2c230';

/** A little picture from rows of letters (the top row first), its bottom-left at dx, up; pal: letter -> colour. */
function pix(r, dx, up, rows, pal) {
  rows.forEach((row, i) => {
    const y = up + rows.length - 1 - i;
    for (let j = 0; j < row.length;) {                                  // runs of one letter in one rectangle
      let k = j; while (k < row.length && row[k] === row[j]) k++;
      if (pal[row[j]]) r(pal[row[j]], dx + j, y, k - j, 1);
      j = k;
    }
  });
}

export const PART = {
  // 15 x 45: the concrete pole (lit left, shaded right) with step bolts, the yellow and
  // black guard at its foot, the blue address plate, the crossarm (wires from its ends) with
  // four insulators, maybe a transformer, a lamp on an arm (its face under the glow)
  utilityPole: { approved: true, draw(r, rng) {
    const C = CONCRETE, ARM = '#8a867c', TR = '#9aa0a6';
    r(C, 6, 0, 3, 44); r(shade(C, 1.1), 6, 0, 1, 44); r(shade(C, 0.82), 8, 0, 1, 44);
    r(shade(C, 1.16), 6, 44, 3, 1);                                         // the cap
    r(shade(C, 0.7), 6, 0, 3, 1);                                           // where it meets the ground
    // the guard: yellow, black stripes running up to the right
    r(YELLOW, 6, 2, 3, 6);
    for (let up = 2; up < 8; up++) for (let i = 0; i < 3; i++) if ((up + 3 - i) % 3 === 0) r(INK, 6 + i, up, 1, 1);
    // the address plate: a white number in two lines
    r('#2c4a8a', 6, 16, 3, 5); r(WHITE, 6, 19, 2, 1); r(WHITE, 6, 17, 3, 1); r(shade('#2c4a8a', 0.75), 8, 16, 1, 5);
    // step bolts, one side then the other
    for (const [dx, up] of [[5, 23], [9, 26], [5, 29], [9, 37]]) r(DARK, dx, up, 1, 1);
    // the crossarm and its insulators (the wires hang from the ends, dx 0 and 14)
    r(ARM, 0, 39, 15, 2); r(shade(ARM, 0.78), 0, 39, 15, 1); r(shade(ARM, 1.15), 0, 40, 15, 1);
    for (const dx of [0, 4, 9, 13]) { r('#c8c8c0', dx, 41, 2, 1); r(WHITE, dx, 42, 2, 1); r(shade(WHITE, 0.85), dx + 1, 42, 1, 1); }
    if (rng() < 0.4) {                                                      // a transformer
      r(TR, 9, 27, 5, 8); r(shade(TR, 1.12), 9, 27, 1, 8); r(shade(TR, 0.8), 13, 27, 1, 8);
      r(shade(TR, 0.86), 10, 29, 3, 1); r(shade(TR, 0.86), 10, 32, 3, 1);   // its ribs
      r(DARK, 9, 35, 5, 1); r(WHITE, 10, 36, 1, 1); r(WHITE, 12, 36, 1, 1);   // the lid, two bushings
      r(DARK, 9, 30, 1, 1);                                                 // the band to the pole
    }
    // the lamp on its arm: the lit face at the bottom, under the glow (2.25, 29.25)
    r(METAL, 1, 33, 5, 1); r(shade(METAL, 1.25), 1, 33, 5, 1); r(METAL, 5, 34, 1, 1);
    r(DARK, 0, 30, 5, 3); r(shade(DARK, 1.3), 0, 32, 5, 1); r(LAMP, 0, 30, 5, 1);
  } },

  // 9 x 29: a plate at the foot, the pole, the arm, the head (its lit face under the glow at 6.75, 21.75)
  streetLamp: { approved: true, draw(r) {
    r(DARK, 0, 0, 4, 1); r(METAL, 0, 1, 4, 1); r(shade(METAL, 1.25), 0, 1, 1, 1);   // the foot
    r(METAL, 1, 2, 2, 25); r(shade(METAL, 1.25), 1, 2, 1, 25);              // the pole
    r(METAL, 1, 26, 7, 1); r(shade(METAL, 1.25), 2, 27, 5, 1); r(METAL, 1, 27, 1, 1);   // the arm, rounded at the top
    r(DARK, 4, 23, 5, 2); r(shade(DARK, 1.3), 5, 25, 3, 1); r(DARK, 4, 25, 1, 1);    // the head, its top sloping
    r(LAMP, 4, 23, 5, 1); r(LAMP, 5, 22, 3, 1); r(shade(LAMP, 0.92), 4, 23, 1, 1); r(shade(LAMP, 0.92), 8, 23, 1, 1);   // the glass, bulging
  } },

  // 8 x 26: the old black lamp: a foot, a post, the lantern box with two panes (the glow at
  // 3.75, 20.25), its roof and knob
  oldLamp: { approved: true, draw(r) {
    const HI = shade(INK, 1.45);
    r(INK, 1, 0, 6, 1); r(INK, 2, 1, 4, 1); r(HI, 2, 1, 1, 1);             // the foot
    r(INK, 3, 2, 2, 14); r(HI, 3, 2, 1, 14);                               // the post
    r(INK, 2, 15, 4, 1); r(INK, 1, 16, 6, 2); r(HI, 1, 17, 6, 1);          // the collar
    r(INK, 0, 18, 8, 5); r(LAMP, 1, 18, 2, 4); r(LAMP, 5, 18, 2, 4);       // the box, two panes
    r(shade(LAMP, 0.9), 1, 18, 2, 1); r(shade(LAMP, 0.9), 5, 18, 2, 1);
    r(INK, 0, 23, 8, 1); r(HI, 0, 23, 8, 1); r(INK, 1, 24, 6, 1); r(INK, 3, 25, 2, 1);   // the roof, the knob
  } },

  // 8 x 15: a stone lantern: the foot, the post, the platform, the fire box (the glow at 3.75, 9),
  // the roof with its turned-up eaves, the knob
  stoneLantern: { approved: true, draw(r) {
    const S = STONE, D = shade(S, 0.76), L = shade(S, 1.12);
    r(D, 0, 0, 8, 1); r(S, 0, 1, 8, 1); r(L, 0, 1, 1, 1); r(S, 1, 2, 6, 1); r(L, 1, 2, 6, 1);   // the foot
    r(S, 3, 3, 2, 3); r(L, 3, 3, 1, 3);                                     // the post
    r(D, 1, 6, 6, 1);                                                       // the platform
    r(S, 1, 7, 6, 4); r(L, 1, 7, 1, 4); r(D, 6, 7, 1, 4); r('#f2c070', 3, 7, 2, 4); r(shade('#f2c070', 1.1), 3, 9, 2, 2);   // the fire box
    r(D, 0, 11, 8, 1); r(S, 1, 12, 6, 1); r(L, 1, 12, 2, 1); r(S, 2, 13, 4, 1); r(L, 0, 12, 1, 1); r(L, 7, 12, 1, 1);   // the roof
    r(S, 3, 14, 2, 1); r(L, 3, 14, 1, 1);                                   // the knob
  } },

  // 12 x 29, Japanese: three lamps side by side in a flat box under a hood (green, yellow,
  // red: 3 x 3 at dx 2, 5, 8, where the old ones fell when stretched, so the glows at 3, 6, 9
  // and 25.5 sit on them), the walk signal on the pole (red above, green under, centred on
  // dx 9). p.lit: 'green' | 'yellow' | 'red'
  trafficLight: { approved: true, draw(r, rng, p) {
    const lit = p.lit ?? 'green', walk = lit === 'red';
    const lamp = (on, onC, offC, dx, up, w, h) => {
      r(on ? onC : offC, dx, up, w, h);
      if (on) r(shade(onC, 1.25), dx, up + h - 1, 1, 1);                  // a glint, top left
    };
    r(DARK, 4, 0, 4, 1); r(METAL, 4, 1, 4, 1);                              // the foot
    r(METAL, 5, 2, 2, 21); r(shade(METAL, 1.25), 5, 2, 1, 21);              // the pole
    r(DARK, 1, 23, 11, 5); r(shade(DARK, 0.8), 1, 23, 11, 1); r(INK, 1, 27, 11, 2); r(shade(INK, 1.4), 1, 28, 11, 1);   // the box, its hood
    lamp(lit === 'green', '#3fd0a0', '#34463f', 2, 24, 3, 3);               // three lamps (the glows at 3, 6, 9)
    lamp(lit === 'yellow', YELLOW, '#4a4636', 5, 24, 3, 3);
    lamp(lit === 'red', '#e8403a', '#4a3434', 8, 24, 3, 3);
    r(DARK, 6, 9, 6, 9); r(INK, 6, 17, 6, 1); r(shade(DARK, 0.8), 6, 9, 6, 1);   // the walk signal
    lamp(!walk, '#e8403a', '#4a3434', 7, 14, 4, 3);
    lamp(walk, '#3fd0a0', '#34463f', 7, 10, 4, 3);
  } },

  // 9 x 54: a tall pole on a concrete foot with a hatch, the head of two lamps facing down
  // (under the glow at 4.5, 48.75)
  floodlight: { approved: true, draw(r) {
    const P = '#6a6f76';
    r(CONCRETE, 2, 0, 5, 2); r(shade(CONCRETE, 1.1), 2, 1, 5, 1);          // the foot
    r(P, 3, 2, 3, 46); r(shade(P, 1.25), 3, 2, 1, 46); r(shade(P, 0.8), 5, 2, 1, 46);   // the pole
    r(DARK, 4, 5, 1, 3);                                                    // the hatch
    r(DARK, 0, 48, 9, 5); r(shade(DARK, 1.3), 0, 52, 9, 1); r(INK, 4, 48, 1, 4);   // the head
    r(LAMP, 1, 48, 3, 2); r(LAMP, 5, 48, 3, 2);
  } },

  // 12 x 42: a post on a plinth, a collar, the square clock: a cream case, a dark rim, the
  // white face with four marks and two hands
  plazaClock: { approved: true, draw(r) {
    const CASE = '#e8e0d0';
    r(DARK, 3, 0, 6, 2); r(shade(DARK, 1.3), 3, 1, 6, 1);                  // the plinth
    r(METAL, 5, 2, 2, 28); r(shade(METAL, 1.25), 5, 2, 1, 28);              // the post
    r(DARK, 4, 27, 4, 3); r(shade(DARK, 1.3), 4, 29, 4, 1);                 // the collar
    pix(r, 0, 30, [
      'llllllllllll',
      'lKKKKKKKKKKd',
      'lKKWWTTWWKKd',
      'lKWWWWWWWWKd',
      'lKWWWHWWWWKd',
      'lKWWWHWWWWKd',
      'lKTWWHHHWTKd',
      'lKWWWWWWWWKd',
      'lKWWWWWWWWKd',
      'lKKWWTTWWKKd',
      'lKKKKKKKKKKd',
      'cddddddddddd',
    ], { l: shade(CASE, 1.06), c: CASE, d: shade(CASE, 0.8), K: INK, W: WHITE, T: '#8a8e94', H: INK });
  } },

  // 6 x 23: a red paper lantern on a post, its ribs, a highlight, black caps; it swings with
  // p.sway (-1, 0, 1); the glow at 3, 18
  redLantern: { approved: true, draw(r, rng, p) {
    const s = p?.sway ?? 0, R = '#d8402f';
    r(DARK, 2, 0, 2, 14); r(shade(DARK, 1.3), 2, 0, 1, 14);                 // the post
    r(INK, 1 + s, 14, 4, 1);                                                // the bottom cap
    pix(r, s, 15, [
      '.rRRR.',
      'rhRRRd',
      'rhRRRd',
      'rmmmmd',
      'rhRRRd',
      '.rRRd.',
    ], { R, r: shade(R, 0.86), d: shade(R, 0.72), m: shade(R, 0.8), h: '#f06a50' });
    r(INK, 1 + s, 21, 4, 1); r(INK, 2 + s, 22, 2, 1);                        // the top cap, the hook
  } },

  // 36 x 24: the striped post, its two lamps under the X sign (the glows at 0.75 and 5.25,
  // 19.5), the boom on its pivot: across the road when p.down, else up; p.flash: which lamp
  crossingGate: { approved: true, draw(r, rng, p) {
    const ON = '#ff4a3a', OFF = '#6a3434';
    r(WHITE, 2, 0, 3, 18); r(shade(WHITE, 0.9), 4, 0, 1, 18);               // the post, black bands
    for (const up of [3, 8, 13]) { r(INK, 2, up, 3, 2); r(shade(INK, 1.3), 2, up + 1, 3, 1); }
    r(INK, 1, 0, 5, 1);                                                     // its foot
    r(INK, 0, 18, 6, 3);                                                    // the lamps
    r(p.down && p.flash ? ON : OFF, 0, 18, 2, 3); r(p.down && !p.flash ? ON : OFF, 4, 18, 2, 3);
    pix(r, 0, 21, ['YY..YY', '..YY..', 'YY..YY'], { Y: YELLOW, K: INK });  // the X sign
    r(DARK, 4, 9, 2, 4); r(INK, 5, 10, 1, 2);                               // the pivot
    if (p.down) for (let i = 6; i < 36; i += 3) { r((i / 3) % 2 ? INK : YELLOW, i, 10, 3, 2); }   // the boom, across
    else for (let up = 10; up < 24; up += 3) r(((up - 10) / 3) % 2 ? INK : YELLOW, 6, up, 2, Math.min(3, 24 - up));   // the boom, up
  } },

  // 8 x 21: the post, the red upside-down triangle with a white rim and the white letters
  stopSign: { approved: true, draw(r) {
    r(METAL, 3, 0, 2, 14); r(shade(METAL, 1.25), 3, 0, 1, 14);
    pix(r, 0, 13, [
      'WWWWWWWW',
      'WRRRRRRW',
      'WRWWWWRW',
      '.WRRRRW.',
      '.WRRRRW.',
      '..WRRW..',
      '..WRRW..',
      '...WW...',
    ], { W: WHITE, R: RED });
  } },
};
