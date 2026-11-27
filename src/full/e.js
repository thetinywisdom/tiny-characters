// Full-size buildings, part E:
// the fire station, the parking garage, the gas station, the school and the
// public toilets. Each makes the same rng calls in the same order as its old
// drawing in tinyBuildings.js (counts of windows and cars come from the old
// sizes), so a seed gives the same building; new detail has its own stream.
// (This file and tinyBuildingsFull.js import each other: the kit's bindings are
// read only inside functions, never at the top level.)
import { shade } from '../tinyCharacters.js';
import {
  V, floorAt, DOORS, WINDOWS, sign, icon, flatRoof, flatTop,
  INK, WHITE, RED, GLASS, CONCRETE, METAL, LANTERN, FRAME, HI,
} from '../tinyBuildingsFull.js';
import { old, edges, band } from './a.js';
import { walls, evenRow } from './d.js';
import { bigSign } from './c.js';

const GF = 24, SHOP_GF = 28, FL = 20, SILL = 6;                          // the kit's storeys (FULL_STOREY)
const TUBE = '#dfe8ec';                                                   // a strip light: it glows at night

/** A concrete sill under a window ww wide (its shadow on the wall below). */
function sill(r, wall, x, ww, up) { r(shade(wall, 0.72), x - 1, up - 1, ww + 2, 1); r(shade(wall, 0.9), x, up - 2, ww, 1); }

// --- the gas station: a car seen from the front, from above -------------------------
/** A car parked facing out, seen from the front (10 wide, 9 tall), its tyres at up. */
function carFront(r, c, x, up) {
  r(INK, x + 1, up, 2, 2); r(INK, x + 7, up, 2, 2);                        // the tyres
  r(shade(c, 0.7), x, up + 1, 10, 1);                                     // the bumper's shadow
  r(c, x, up + 2, 10, 3); r(shade(c, 1.15), x, up + 4, 10, 1); r(shade(c, 0.82), x + 9, up + 2, 1, 2);
  r('#e8e4d0', x + 1, up + 3, 2, 1); r('#e8e4d0', x + 7, up + 3, 2, 1);      // the headlamps (off)
  r(shade(c, 0.55), x + 4, up + 2, 2, 1);                                 // the grille
  r(c, x + 1, up + 5, 8, 3); r('#7f93a8', x + 2, up + 5, 6, 2); r('#a8bccc', x + 2, up + 6, 1, 1);   // the cabin, the windscreen
  r(shade(c, 1.1), x + 2, up + 7, 6, 1);                                  // the roof
}

// The parking sign's P, the school's clock, the toilets' people.
const P = ['bbbbbbbb', 'bwwwwwbb', 'bwwbbwwb', 'bwwbbwwb', 'bwwwwwbb', 'bwwbbbbb', 'bwwbbbbb', 'bwwbbbbb', 'bbbbbbbb'];
const CLOCK = ['..kkkkk..', '.kwwwwwk.', 'kwwwiwwwk', 'kwwwiwwwk', 'kwwwiiiwk', 'kwwwwwwwk', 'kwwwwwwwk', '.kwwwwwk.', '..kkkkk..'];
const MAN = ['.www.', '.www.', '.....', 'wwwww', 'wwwww', '.www.', '.w.w.', '.w.w.'];
const WOMAN = ['.www.', '.www.', '.....', '.www.', '.www.', 'wwwww', '.w.w.', '.w.w.'];

export const PART = {
  fireStation: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), ow = old(w), obw = ow - 10, bw = w - 15, top = floorAt(2, SHOP_GF);
      const wall = v.pick(['#d8d0c4', '#c8b8a8', '#e8e4dc']), BAND = '#a83028';
      walls(r, wall, 0, bw, top);
      // the bays: roller shutters in deep frames
      const n = Math.max(1, Math.floor((obw - 2) / 21));
      for (const x of evenRow(0, bw, n, 27)) {
        r(shade(wall, 0.8), x - 1, 0, 29, 22); r(shade(wall, 0.68), x - 1, 21, 29, 1);   // the bay's frame, its lintel
        DOORS.garage(r, x, 0, 27, RED);
        r(shade(RED, 0.5), x, 0, 27, 1);                                  // the shutter's foot
      }
      // the red band (the station's sign: lit at night)
      sign(r, BAND, WHITE, 0, 22, bw, 6, 'FIRE STATION', false);
      r(shade(wall, 0.7), 0, SHOP_GF, bw, 1);
      // the upper floor
      const nw = Math.max(1, Math.floor((obw - 4 - 6) / 11));
      for (const x of evenRow(3, bw - 3, nw, 7)) { WINDOWS.alu(r, rng, x, SHOP_GF + SILL); sill(r, wall, x, 7, SHOP_GF + SILL); }
      r(shade(wall, 0.8), 0, top - 2, bw, 1); r(shade(wall, 1.06), 0, top - 1, bw, 1);   // the cornice
      flatRoof(r, wall, 0, top, bw, 21);
      // the hose tower: a lookout's windows, a ledge, the red lamp on top
      const tallO = v.int(48, 58), tall = Math.round(tallO * 1.5), TW = '#b9b0a4', tx = bw;
      r(TW, tx, 0, 15, tall); r(shade(TW, 1.08), tx, 0, 1, tall); r(shade(TW, 0.84), tx + 13, 0, 2, tall);
      r(shade(TW, 0.74), tx, 0, 15, 2); r(shade(wall, 0.6), tx, 0, 1, top);   // its foot, the corner where it meets the station
      for (let j = 0, up = 19 + 4; up < tallO - 8; up += 13, j++) {
        const y = 34 + j * 20;
        WINDOWS.alu(r, rng, tx + 4, y); sill(r, TW, tx + 4, 7, y);
      }
      r(shade(TW, 0.7), tx - 1, tall - 4, 17, 1); r(shade(TW, 1.12), tx - 1, tall - 3, 17, 1);   // the ledge under the lookout
      flatRoof(r, TW, tx - 1, tall, 17, 9);
      r(LANTERN, tx + 6, tall + 3, 3, 5); r(shade(LANTERN, 1.3), tx + 6, tall + 5, 1, 2);   // the red lamp (it glows at night)
      r(shade(LANTERN, 0.75), tx + 8, tall + 3, 1, 5); r(shade(LANTERN, 0.6), tx + 6, tall + 3, 3, 1);
    },
  },

  parkingGarage: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), levels = v.int(2, 4), slab = '#c9c4ba', DARK = '#3a3f44', ow = old(w);
      for (let l = 0; l < levels; l++) {
        const up = l * FL;
        r(DARK, 0, up, w, FL);
        r(shade(DARK, 1.18), 0, up, w, 1); r(shade(DARK, 0.8), 0, up + 13, w, 3);   // the deck, the ceiling in shade
        for (let x = 8; x + 4 < w - 4; x += 14) r(TUBE, x, up + 14, 4, 1); // strip lights under the ceiling
        for (let i = 4; i < ow - 8; i += 10) if (rng() < 0.7) {
          const c = ['#e8402f', WHITE, '#3f7fd6', INK, '#b3b0a8'][Math.floor(rng() * 5)];
          carFront(r, c === INK ? '#33363c' : c, Math.round(i * 1.5), up + 1);
        }
        r(slab, 0, up + 16, w, 4); r(shade(slab, 1.1), 0, up + 19, w, 1); r(shade(slab, 0.72), 0, up + 16, w, 1);   // the slab's edge
      }
      for (const x of [0, Math.round(w / 2) - 1, w - 3]) {                 // the columns
        r(slab, x, 0, 3, levels * FL); r(shade(slab, 1.1), x, 0, 1, levels * FL); r(shade(slab, 0.8), x + 2, 0, 1, levels * FL);
      }
      const ru = levels * FL;
      flatRoof(r, slab, 0, ru, w, 21);
      for (let x = 4; x < w - 14; x += 13) r(shade('#d9d2c0', 1.06), x, ru + 3, 1, 14);   // the bays' lines
      // no cars on the roof (the owner), just the empty bays; the old drawing's choices for them
      // are still taken from the rng so the count of rng calls stays the same
      for (let i = 5; i < ow - 12; i += 9) if (rng() < 0.6) rng();
      const f = r.force ?? r;                                             // the P sign: lit at night
      r(INK, w - 9, ru + 2, 1, 3);
      icon(f, w - 13, ru + 5, P, { b: '#3f7fd6', w: WHITE });
    },
  },

  gasStation: {
    approved: true,
    // the walk-in ground (full-size pixels): the price sign's pole, the canopy's posts, the
    // pumps, the kiosk, and the ground behind the canopy's front (you walk under its first 14 rows)
    open: [[6, 2, 5, 0], [21, 3, 5, 0], [36, 6, 5, 0], [57, 6, 5, 0], [75, 3, 5, 0], [83, 19, 33, 0], [0, 102, 60, 14]],
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), [brand, brand2] = v.pick([[RED, WHITE], ['#2f7a4a', '#f2c230'], ['#2c4a8a', WHITE]]);
      const f = r.force ?? r, TOPC = '#e4e2dc';
      // the canopy's posts
      for (const x of [21, 75]) { r(CONCRETE, x, 0, 3, 30); r(shade(CONCRETE, 1.12), x, 0, 1, 30); r(shade(CONCRETE, 0.8), x + 2, 0, 1, 30); r(shade(CONCRETE, 0.7), x, 0, 3, 1); }
      // the canopy: its top seen from above, the fascia in the brand's colours, lights under it
      r(TOPC, 12, 36, 78, 18); r(shade(TOPC, 0.92), 12, 36, 78, 1); r(shade(TOPC, 1.04), 12, 53, 78, 1);
      for (let y = 41; y < 52; y += 5) r(shade(TOPC, 0.96), 13, y, 76, 1);
      r(shade(TOPC, 0.86), 12, 37, 78, 1);
      f(brand2, 12, 30, 78, 6); f(brand, 12, 32, 78, 2); f(shade(brand2, 0.8), 12, 30, 78, 1); f(shade(brand2, 1.08), 12, 35, 78, 1);
      for (const x of [26, 48, 66]) r(TUBE, x, 29, 6, 1);                 // lights under the canopy (they glow at night)
      // the pumps, on their islands
      for (const x of [36, 57]) {
        r(shade(CONCRETE, 0.8), x - 1, 0, 8, 1); r(CONCRETE, x - 1, 1, 8, 1); r(shade(CONCRETE, 1.12), x - 1, 2, 8, 1);   // the island
        r(shade(brand, 0.7), x, 2, 6, 10); r(brand, x, 3, 5, 9); r(shade(brand, 1.2), x, 3, 1, 9);
        r(brand2, x, 12, 6, 2); r(shade(brand2, 0.85), x, 12, 6, 1);       // its lit top
        r(INK, x + 1, 8, 4, 3); r(TUBE, x + 2, 9, 2, 1);                   // the meter
        r(INK, x + 1, 4, 2, 3); r(METAL, x + 3, 5, 1, 2);                  // the nozzle in its holster
      }
      // the kiosk
      const K = '#e8e0d0', kx = 83;
      r(K, kx, 0, 19, GF); r(shade(K, 1.04), kx, 0, 1, GF); r(shade(K, 0.88), kx + 18, 0, 1, GF);
      r(shade(K, 0.74), kx, 0, 19, 2);
      sign(r, brand, brand2, kx + 1, 19, 17, 5, 'SHOP');
      DOORS.glass(r, kx + 1); r(shade(K, 0.7), kx, 18, 11, 1);
      WINDOWS.alu(r, rng, kx + 12, SILL, 5); r(shade(K, 0.72), kx + 11, SILL - 1, 7, 1);
      flatRoof(r, K, kx, GF, 19, 9);
      // the price sign on its pole: the brand at the top, two prices in lit digits
      r(INK, 6, 0, 2, 33); r(shade(INK, 1.4), 6, 0, 1, 33);
      f(shade(WHITE, 0.72), 1, 33, 13, 12); f(WHITE, 2, 34, 11, 10);
      f(brand, 2, 40, 11, 4); f(brand2, 6, 41, 3, 2);
      const DIG = '#f2a040';
      for (const y of [35, 37]) { f(INK, 3, y, 9, 2); f(DIG, 4, y + 1, 2, 1); f(DIG, 7, y + 1, 1, 1); f(DIG, 9, y + 1, 2, 1); }
    },
  },

  school: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), floors = v.int(2, 3), top = floorAt(floors), wall = b.wall ?? v.pick(['#e4e0d6', '#f2efe8', '#d8d0c4']);
      walls(r, wall, 0, w, top);
      const ow = old(w), n = Math.floor((ow - 8) / 10), mid = Math.floor(n / 2);
      const start = Math.floor((w - (n * 15 - 8)) / 2), xs = Array.from({ length: n }, (_, i) => start + i * 15);
      for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
        if (f === 0 && i === mid) continue;
        const up = floorAt(f) + SILL;
        WINDOWS.alu(r, rng, xs[i], up); sill(r, wall, xs[i], 7, up);
      }
      for (let f = 1; f < floors; f++) band(r, wall, 0, w, floorAt(f));
      // the entrance: automatic doors in a recess, a canopy over them
      const ex = xs[mid] - 4;
      r(shade(wall, 0.7), ex - 2, 0, 20, 20); r(shade(wall, 0.84), ex - 2, 18, 20, 2);
      DOORS.auto(r, ex);
      r(shade(CONCRETE, 0.62), ex - 4, 20, 24, 1); r(CONCRETE, ex - 4, 21, 24, 1); r(shade(CONCRETE, 1.12), ex - 4, 22, 24, 1);
      r(shade(CONCRETE, 1.08), ex - 3, 0, 22, 1);                         // the step
      r(shade(wall, 0.8), 0, top - 2, w, 1); r(shade(wall, 1.06), 0, top - 1, w, 1);   // the cornice
      flatRoof(r, wall, 0, top, w, 24);
      if (v.chance(0.75)) {                                               // the clock tower
        const cx = Math.round(w / 2) - 10;
        r(wall, cx, top, 21, 16); edges(r, wall, cx, 21, top, 16); r(shade(wall, 0.8), cx, top, 21, 1);
        flatRoof(r, wall, cx - 1, top + 16, 23, 8);
        icon(r, cx + 6, top + 4, CLOCK, { k: INK, w: WHITE, i: INK });
      }
    },
  },

  toilets: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const wall = '#e8e0d0', TILE = '#b8b4a8';
      r(wall, 0, 0, 66, GF); edges(r, wall, 0, 66, 0, GF);
      r(TILE, 0, 0, 66, 7); r(shade(TILE, 1.12), 0, 6, 66, 1); r(shade(TILE, 0.8), 0, 0, 66, 1);   // a tiled skirting
      for (let x = 2; x < 66; x += 4) r(shade(TILE, 0.9), x, 1, 1, 5);
      r(shade(TILE, 0.9), 0, 3, 66, 1);
      for (const [dx, c, fig] of [[6, '#3f6fa8', MAN], [51, '#c8402c', WOMAN]]) {
        r(shade(wall, 0.7), dx - 1, 0, 11, 19);                           // the door's frame
        DOORS.steel(r, dx, 0, shade(c, 0.8));
        r(shade(WHITE, 0.8), dx + 1, 8, 7, 10); r(WHITE, dx + 1, 9, 7, 9);  // a man and a woman on white plates
        icon(r, dx + 2, 9, fig, { w: c });
        r(METAL, dx + 6, 5, 2, 1); r(shade(METAL, 0.7), dx + 6, 4, 1, 1); // the lever
      }
      for (const x of [18, 42]) { r(shade(wall, 0.7), x, 19, 6, 3); r('#c8ccc4', x + 1, 20, 4, 1); }   // frosted vents up high
      bigSign(r, '#2f8a5a', WHITE, 21, 11, 24, 8, 'WC');
      flatTop(r, V(rng), wall, GF, 66);
    },
  },
};
