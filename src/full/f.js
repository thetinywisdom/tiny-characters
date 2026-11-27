// Full-size buildings, part F:
// the shrine (a torii and a hall side by side), the torii, the shrine hall, the
// mosque, the stone chapel and the station kiosk. Each makes the same rng calls
// in the same order as its old drawing in tinyBuildings.js, so a seed gives the
// same building; new detail comes from a stream of its own (seeded).
// (This file and tinyBuildingsFull.js import each other: the kit's bindings are
// read only inside functions, never at the top level.)
import { shade, seeded } from '../tinyCharacters.js';
import {
  V, DOORS, WINDOWS, sign, awning, dome, pointedArch, pitched, flatRoof, icon,
  INK, WHITE, NAVY, GOLD, LIT, CURTAIN, WOOD, DARKWOOD, LIGHTWOOD, METAL,
} from '../tinyBuildingsFull.js';
import { old } from './a.js';
import { lit } from './b.js';
import { shifted } from './c.js';

const RED_ROPE = '#d8443c';

// --- the torii (39 wide): two posts with black feet, the tie beam (nuki), the strut,
// the red beam under the black top beam (kasagi) with its ends turned up
function torii(r, rng) {
  const red = rng() < 0.75 ? '#c8402c' : '#9a958a', stone = red === '#9a958a';     // vermilion, or stone
  const lite = shade(red, 1.15), dim = shade(red, 0.78);
  for (const x of [8, 28]) {
    r(red, x, 0, 3, 28); r(lite, x, 0, 1, 28); r(dim, x + 2, 0, 1, 28);
    if (stone) { r(shade(red, 0.72), x - 1, 0, 5, 3); r(shade(red, 0.9), x - 1, 2, 5, 1); }   // a stone foot
    else { r(INK, x, 0, 3, 4); r(shade(INK, 1.45), x, 0, 1, 4); r(shade(INK, 1.3), x, 3, 3, 1); }   // the black foot (nemaki)
  }
  r(red, 4, 21, 31, 3); r(lite, 4, 23, 31, 1); r(dim, 4, 21, 31, 1);                // the nuki, through the posts
  r(red, 18, 24, 3, 4); r(lite, 18, 24, 1, 4); r(dim, 20, 24, 1, 4);                // the strut (gakuzuka)
  r(red, 3, 28, 33, 2); r(dim, 3, 28, 33, 1);                                       // the shimaki
  r(INK, 1, 30, 37, 3); r(shade(INK, 1.55), 2, 32, 35, 1);                          // the kasagi, its top lit
  r(INK, 0, 31, 1, 3); r(INK, 38, 31, 1, 3); r(INK, 1, 33, 1, 1); r(INK, 37, 33, 1, 1);   // its ends turned up
}

/** A stone lantern (toro), 5 wide (its roof 7), 14 tall; the fire box lit (it glows at night). */
function toro(r, x) {
  const S = '#a8a498', D = shade(S, 0.76), L = shade(S, 1.12);
  r(D, x, 0, 5, 2); r(L, x, 1, 5, 1);                                               // the foot
  r(S, x + 1, 2, 3, 4); r(L, x + 1, 2, 1, 4); r(D, x + 3, 2, 1, 4);                 // the post
  r(D, x, 6, 5, 1);                                                                  // the platform
  r(S, x, 7, 5, 3); r(LIT, x + 1, 7, 3, 2); r(L, x, 7, 1, 3);                       // the fire box
  r(D, x - 1, 10, 7, 1); r(S, x, 11, 5, 1); r(L, x + 1, 12, 3, 1); r(D, x + 2, 13, 1, 1);   // the roof, the knob
}

// --- the shrine hall (54, 60 or 72 wide): a stone base with steps, the wooden hall,
// shoji doors with a straw rope (shimenawa), a bell on a red and white rope over the
// offering box, shoji windows, a stone lantern either side, the hipped roof
function shrineHall(r, rng, b, w) {
  const v = V(rng), hallC = v.pick(['#9a6a48', '#8a5a3a', '#b07a50']), roofC = v.pick(['#3a3f44', '#3a3f44', '#4a7a6a']);   // dark tiles or green copper
  const STONE = '#c9c2b0', dx = w / 2 - 8, POST = shade(hallC, 0.66);
  // the stone base, the steps up to the door
  r(STONE, 6, 0, w - 12, 4); r(shade(STONE, 0.82), 6, 0, w - 12, 1); r(shade(STONE, 1.08), 6, 3, w - 12, 1);
  for (let x = 13; x < dx - 3; x += 9) { r(shade(STONE, 0.86), x, 1, 1, 2); r(shade(STONE, 0.86), w - 1 - x, 1, 1, 2); }
  r(shade(STONE, 0.9), dx - 2, 0, 20, 1); r(shade(STONE, 1.14), dx - 2, 1, 20, 1);
  r(shade(STONE, 0.9), dx - 1, 2, 18, 1); r(shade(STONE, 1.14), dx - 1, 3, 18, 1);
  // the hall
  r(hallC, 9, 4, w - 18, 20); r(shade(hallC, 0.6), 9, 4, w - 18, 1);              // the floor's edge
  for (const x of [9, w - 11]) { r(POST, x, 4, 2, 18); r(shade(POST, 1.2), x, 4, 1, 18); }   // corner posts
  DOORS.shoji(r, dx, 4);
  r(shade(hallC, 0.7), 9, 22, w - 18, 1); r(shade(hallC, 0.48), 9, 23, w - 18, 1);   // the head beam, the eaves' shadow
  const sides = v.int(1, old(w) > 40 ? 2 : 1), span = dx - 11;
  const xs = sides === 1 ? [11 + Math.floor((span - 7) / 2)] : [12, 20];
  for (const x of xs) { WINDOWS.shoji(r, x, 10); WINDOWS.shoji(r, w - x - 7, 10); }
  // the straw rope over the door, a bell on a red and white rope, the offering box
  const ROPE = '#d8c890';
  r(ROPE, dx - 1, 19, 18, 2); r(ROPE, dx + 4, 18, 8, 1); r(shade(ROPE, 1.1), dx - 1, 20, 18, 1);
  for (let x = dx; x < dx + 16; x += 3) r(shade(ROPE, 0.72), x, 19, 1, 1);
  r(GOLD, dx + 6, 16, 4, 2); r(shade(GOLD, 1.2), dx + 6, 17, 1, 1); r(shade(GOLD, 0.7), dx + 7, 16, 2, 1);
  for (let y = 10; y < 16; y++) { r(RED_ROPE, dx + 7, y, 2, 1); r(shade(RED_ROPE, 0.7), dx + 7 + (y % 2), y, 1, 1); }   // twisted
  r(WOOD, dx + 2, 4, 12, 4); r(shade(WOOD, 0.7), dx + 2, 4, 12, 1); r(shade(WOOD, 1.15), dx + 2, 4, 1, 4);
  for (const x of [dx + 5, dx + 10]) r(shade(WOOD, 0.75), x, 5, 1, 3);
  r(DARKWOOD, dx + 1, 8, 14, 2); for (let x = dx + 2; x < dx + 14; x += 2) r(LIGHTWOOD, x, 9, 1, 1);   // its slatted top
  toro(r, 1); toro(r, w - 6);
  // the roof: hipped, its corners turned up, a gold ornament on the ridge
  const d = Math.round(v.int(14, 17) * 1.5), ridge = 24 + Math.round(d * 0.7);
  pitched(r, roofC, 1, 24, w - 2, d, 2);
  for (const [x, t] of [[0, -1], [w - 1, w]]) { r(shade(roofC, 0.8), x, 24, 1, 3); r(shade(roofC, 0.66), t, 26, 1, 2); }
  r(GOLD, w / 2 - 4, ridge, 8, 1); r(shade(GOLD, 0.72), w / 2 - 4, ridge - 1, 8, 1); r(shade(GOLD, 1.2), w / 2 - 4, ridge, 2, 1);
}

// --- the stone chapel: a gable facing the street, its face edged with the roof
/** The roof rows from up to up + d, the face a triangle gh tall; symmetric about the middle pixel (W odd). */
function chapelGable(r, c, face, X0, up, W, gh, d, texture) {
  const cx = X0 + (W - 1) / 2, L = shade(c, 0.78);
  for (let k = 0; k < d; k++) {
    const y = up + k, dk = k % 3 === 2;
    r(dk ? shade(L, 0.86) : L, X0, y, cx - X0, 1); r(dk ? shade(c, 0.86) : c, cx + 1, y, X0 + W - cx - 1, 1);
    if (!dk && k > 0) {                                                  // slate joints, staggered, mirrored
      const off = Math.floor(k / 3) % 2 ? 2 : 0;
      for (let j = 3 + off; cx - j > X0; j += 4) { r(shade(L, 0.88), cx - j, y, 1, 1); r(shade(c, 0.88), cx + j, y, 1, 1); }
    }
    r(shade(c, 1.3), cx, y, 1, 1);                                       // the ridge
  }
  r(shade(c, 0.58), X0, up, W, 1);                                       // the eaves
  const half = (W - 1) / 2;
  for (let k = 0; k < gh; k++) {
    const inset = 3 + Math.round(k * (half - 3) / gh), a = X0 + inset, z = X0 + W - 1 - inset, y = up + k;
    r(shade(c, 0.52), a - 2, y, 2, 1); r(shade(c, 0.52), z + 1, y, 2, 1);  // the verges
    if (z >= a) { r(face, a, y, z - a + 1, 1); texture(y, a, z + 1); }
  }
}

// --- the kiosk's shelf goods (the old ones' colours, in its order)
const KIOSK_GOODS = ['#3f7fd6', '#f2c230', '#2fa36b', '#f2f2ee', '#d46a8e'];

export const PART = {
  shrine: {
    approved: true,
    draw(r, rng, b) {                                                    // a torii and the hall, side by side
      torii(shifted(r, 3), rng);
      shrineHall(shifted(r, 48), rng, b, 60);
    },
  },

  torii: {
    approved: true,
    open: [[7, 5, 4, 0], [27, 5, 4, 0]],                                 // the posts' feet: walk between them
    draw(r, rng) { torii(r, rng); },
  },

  shrineHall: {
    approved: true,
    draw(r, rng, b, wall, roof, w) { shrineHall(r, rng, b, w); },
  },

  mosque: {
    approved: true,
    draw(r, rng) {
      const pick = (a) => a[Math.floor(rng() * a.length)];
      const wall = pick(['#f2efe8', '#e8dcc0', '#dcc49c', '#e6d6c4']);
      const domeC = pick(['#3f8f6a', '#d8a840', '#3f6fa8', '#e8e8e0', '#3fa8a0']);
      const trim = pick(['#3f8f6a', '#3f6fa8', '#3fa8a0', '#b8603a']);
      const wallH = 18 + Math.floor(rng() * 4), rad = 7 + Math.floor(rng() * 4);
      const minarets = rng() < 0.55 ? 2 : 1, leftOnly = rng() < 0.5, tall = 50 + Math.floor(rng() * 14);
      const sideDomes = rng() < 0.5, perSide = 1 + Math.floor(rng() * 2);
      // 84 wide, symmetric about pixel 42: the hall 9..75, the portal 29..55, minarets 1..7 and 77..83
      const H = Math.round(wallH * 1.5), R = Math.round(rad * 1.5), T = Math.round(tall * 1.5), C = 42;
      const mir = (x, ww) => 85 - x - ww;
      // the prayer hall: its wings, a frieze under the roof, pointed windows
      r(wall, 9, 0, 67, H); r(shade(wall, 1.05), 9, 0, 1, H); r(shade(wall, 0.86), 75, 0, 1, H);
      r(shade(wall, 0.8), 9, 0, 67, 2); r(shade(wall, 0.92), 9, 2, 67, 1);
      r(trim, 9, H - 5, 67, 1); r(trim, 9, H - 3, 67, 1);
      for (let x = C - 30; x <= C + 30; x += 3) r(trim, x, H - 4, 1, 1);
      for (const x of perSide === 1 ? [15] : [11, 20]) for (const wx of [x, mir(x, 7)]) {
        r(shade(wall, 0.74), wx - 1, 4, 9, 1); WINDOWS.pointed(r, wx, 5, trim);
      }
      flatRoof(r, wall, 9, H, 67, 18);
      if (sideDomes) for (const cx of [21, 63]) {
        r(wall, cx - 5, H + 4, 11, 3); r(shade(wall, 0.82), cx - 5, H + 4, 11, 1); r(shade(wall, 0.86), cx + 4, H + 4, 2, 3);
        dome(r, domeC, cx, H + 7, 5); r(GOLD, cx, H + 13, 1, 2);
      }
      // the main dome on its drum, a gold finial and crescent
      r(wall, C - R - 2, H + 6, 2 * R + 5, 4); r(shade(wall, 0.82), C - R - 2, H + 6, 2 * R + 5, 1);
      r(shade(wall, 0.86), C + R, H + 6, 3, 4); r(trim, C - R - 2, H + 9, 2 * R + 5, 1);
      dome(r, domeC, C, H + 10, R);
      r(GOLD, C, H + 11 + R, 1, 3); r(shade(GOLD, 0.75), C - 1, H + 11 + R, 3, 1);
      icon(r, C - 2, H + 14 + R, ['g...g', 'gg.gg', '.ggg.'], { g: GOLD });  // the crescent, horns up
      // the portal (pishtaq): a band of writing, a pointed arch round a recess, the door, a lamp
      r(wall, 29, 0, 27, H + 9); r(shade(wall, 1.06), 29, 0, 1, H + 9); r(shade(wall, 0.84), 55, 0, 1, H + 9);
      r(shade(wall, 0.8), 29, 0, 27, 2); r(shade(wall, 0.85), 29, H + 8, 27, 1);
      r(trim, 31, H + 5, 23, 3); for (let x = C - 10; x <= C + 10; x += 2) r(shade(trim, 1.5), x, H + 6, 1, 1);
      pointedArch(r, shade(trim, 1.2), 33, 0, 19, H + 4); pointedArch(r, trim, 34, 0, 17, H + 3);
      pointedArch(r, shade(trim, 0.6), 36, 0, 13, H);
      DOORS.arched(r, 38);
      r(shade(trim, 0.4), C, 23, 1, H - 26); r(GOLD, C - 1, 22, 3, 1); r(LIT, C - 1, 20, 3, 2); r(GOLD, C, 19, 1, 1);   // the lamp (it glows at night)
      // the minarets: a band, a slit window, the balcony, a small dome and finial
      for (const x of minarets === 2 ? [1, 77] : [leftOnly ? 1 : 77]) {
        const a = Math.round(T * 0.45), bb = Math.round(T * 0.75), s = Math.round(T * 0.55);
        r(wall, x, 0, 7, T); r(shade(wall, 1.06), x, 0, 1, T); r(shade(wall, 0.85), x + 5, 0, 2, T);
        r(shade(wall, 0.8), x, 0, 7, 2);
        r(trim, x, a, 7, 1); r(shade(wall, 0.8), x, a - 1, 7, 1);
        pointedArch(r, NAVY, x + 2, s, 3, 6);
        r(shade(wall, 0.6), x, bb - 1, 7, 1); r(shade(wall, 0.75), x - 1, bb, 9, 3); r(shade(wall, 0.9), x - 1, bb + 2, 9, 1);
        for (const i of [0, 2, 4, 6]) r(shade(wall, 0.52), x + i, bb + 1, 1, 1);
        r(trim, x - 1, bb + 3, 9, 1);
        dome(r, domeC, x + 3, T, 3); r(GOLD, x + 3, T + 4, 1, 2); icon(r, x + 2, T + 6, ['g.g', 'ggg'], { g: GOLD });
      }
    },
  },

  stoneChapel: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), wall = v.pick(['#8f8a80', '#a89a88', '#7a7a78']), top = v.int(22, 26), T = Math.round(top * 1.5);
      const W = w % 2 ? w : w - 1, c = (W - 1) / 2, g = seeded((b.seed ?? 1) * 61 + 29);   // drawn odd-wide, so it is symmetric
      const F = shade(wall, 0.7), dash = shade(wall, 0.84), light = shade(wall, 1.08);
      // rough stone: dashes of mortar, a few lighter stones (texture(y, from, to) for any row)
      const texture = (y, a, z) => {
        if (y % 4 === 1) for (let x = a + (((y >> 2) % 2) * 4 - a % 8 + 16) % 8; x + 3 <= z; x += 8) r(dash, x, y, 3, 1);
        if (y % 4 === 3 && g() < 0.5) { const x = a + Math.floor(g() * Math.max(1, z - a - 3)); if (x + 3 <= z) r(light, x, y, 3, 1); }
      };
      r(wall, 0, 0, W, T);
      for (let y = 3; y < T; y++) texture(y, 0, W);
      r(shade(wall, 0.74), 0, 0, W, 2); r(shade(wall, 0.9), 0, 2, W, 1);  // the plinth
      for (let y = 3, k = 0; y + 3 <= T; y += 4, k++) {                  // quoins at the corners
        const q = k % 2 ? 3 : 5; r(shade(wall, 1.12), 0, y, q, 3); r(shade(wall, 0.95), W - q, y, q, 3);
      }
      r(shade(wall, 0.82), W - 1, 0, 1, T);
      // the door under a stone arch, a step
      r(F, c - 6, 0, 13, 16); r(F, c - 5, 16, 11, 1); r(F, c - 4, 17, 9, 1); r(F, c - 3, 18, 7, 1); r(F, c - 1, 19, 3, 1);
      DOORS.arched(r, c - 4, 0, DARKWOOD); r(INK, c - 3, 4, 7, 1); r(INK, c - 3, 12, 7, 1);
      r(shade(wall, 1.05), c - 7, 0, 15, 1);
      // the rose window in a stone ring
      r(F, c - 3, 21, 7, 9); r(F, c - 4, 22, 9, 7);
      icon(r, c - 3, 22, ['..kkk..', '.kgbgk.', 'kbbrbbk', 'kgrrrgk', 'kbbrbbk', '.kgbgk.', '..kkk..'],
        { k: INK, b: '#3f6fa8', r: '#c8402c', g: '#f2c230' });
      // stained glass either side
      const n = w >= 57 ? 2 : 1, span = c - 6 - 5;
      const xs = n === 1 ? [5 + Math.floor((span - 7) / 2)] : (() => { const s = Math.floor((span - 14) / 3); return [5 + s, 12 + 2 * s]; })();
      for (const x of xs) for (const wx of [x, W - 7 - x]) { r(shade(wall, 0.7), wx - 1, 5, 9, 1); WINDOWS.stained(r, wx, 6); }
      r(shade(wall, 0.78), 0, T - 1, W, 1);                              // the eaves' shadow
      const rc = v.pick(['#2f2a2a', '#3a3f44', '#4a3a32']), D = Math.round((16 + v.int(14, 18)) * 1.5);
      chapelGable(r, rc, wall, -3, T, W + 6, 24, D, texture);
      const CROSS5 = ['..g..', '..g..', 'ggggg', '..g..', '..g..', '..g..', '..g..', '..g..'], gold = { g: GOLD };
      if (v.chance(0.75)) {                                              // a bell tower on the front of the roof
        const tx = c - 4, base = T + 21;
        r(wall, tx, base, 9, 17); r(shade(wall, 1.1), tx, base, 1, 17); r(shade(wall, 0.82), tx + 7, base, 2, 17);
        for (const y of [base + 2, base + 15]) r(dash, tx + 2, y, 3, 1);
        r(shade(wall, 0.72), c - 3, base + 4, 7, 1);                     // the belfry's sill
        r(INK, c - 2, base + 5, 5, 8); r(INK, c - 1, base + 13, 3, 1);   // the opening, the bell in it
        r(GOLD, c - 1, base + 7, 3, 3); r(shade(GOLD, 0.72), c + 1, base + 7, 1, 3); r(shade(GOLD, 1.2), c - 1, base + 8, 1, 2); r(GOLD, c, base + 10, 1, 1);
        r(shade(wall, 0.7), tx - 1, base + 17, 11, 1);                   // the cornice
        for (let k = 0; k < 6; k++) { r(shade(rc, 1.45), tx - 1 + k, base + 18 + k, 5 - k, 1); r(shade(rc, 1.15), c, base + 18 + k, 5 - k + 1, 1); }   // the spire, lighter than the roof behind
        icon(r, c - 2, base + 24, CROSS5, gold);
      } else icon(r, c - 2, T + 23, CROSS5, gold);
    },
  },

  kiosk: {
    approved: true,
    draw(r, rng, b) {
      const RED = '#c8402c', f = lit(r), g = seeded((b.seed ?? 1) * 67 + 31);
      const cols = [0, 1, 2, 3].map(() => KIOSK_GOODS[Math.floor(rng() * KIOSK_GOODS.length)]);   // the old shelf's four (its rng)
      r(RED, 0, 0, 36, 21); r(shade(RED, 1.12), 0, 0, 1, 21); r(shade(RED, 0.78), 35, 0, 1, 21); r(shade(RED, 0.62), 0, 0, 36, 1);
      // the window: the lit inside, two shelves of goods, a steamer of buns on the counter
      r(shade(RED, 0.66), 2, 6, 32, 12); r(CURTAIN, 3, 7, 30, 10);
      f('#c8ccd0', 3, 12, 30, 1);
      for (let i = 0, x = 4; x + 2 <= 33; x += 3, i++) { const c = KIOSK_GOODS[Math.floor(g() * KIOSK_GOODS.length)]; f(c, x, 13, 2, 3); f(shade(c, 1.18), x, 15, 1, 1); }
      f('#c8ccd0', 3, 7, 20, 1);
      for (let i = 0, x = 4; x + 2 <= 23; x += 3, i++) { const c = cols[Math.floor(i * 4 / 7)]; f(c, x, 8, 2, 2); f(shade(c, 1.18), x, 9, 1, 1); }
      f(METAL, 24, 7, 8, 6); f(shade(METAL, 0.75), 24, 7, 8, 1); r('#dfe8ec', 25, 8, 6, 3);   // the steamer, glass in front
      f(WHITE, 25, 8, 2, 1); f(WHITE, 28, 8, 2, 1); f(WHITE, 26, 9, 2, 1); f(WHITE, 29, 9, 2, 1);
      f(shade(METAL, 1.1), 24, 12, 8, 1);
      // the counter, newspapers and magazines in a rack under it
      r(METAL, 2, 6, 32, 1); r(shade(METAL, 1.1), 2, 6, 32, 1); r(shade(RED, 0.5), 2, 5, 32, 1);
      r('#3a3f44', 3, 0, 30, 5);
      for (let x = 4; x + 3 <= 32; x += 4) {
        const c = ['#3f7fd6', '#f2c230', '#d46a8e', WHITE, '#2fa36b', '#e8e0d0', '#d8443c'][Math.floor(g() * 7)];
        r(c, x, 1, 3, 3); r(shade(c, 1.15), x, 3, 3, 1); r(shade(c, 0.8), x + 2, 1, 1, 2);
      }
      // the awning, the sign, the flat roof
      awning(r, '#f2c230', WHITE, -1, 21, 38, 5);
      sign(r, WHITE, RED, 1, 26, 34, 7, 'KIOSK');
      flatRoof(r, RED, 0, 33, 36, 9);
    },
  },
};
