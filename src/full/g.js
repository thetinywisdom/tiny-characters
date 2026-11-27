// Full-size buildings, part G:
// the stations (the small one, the modern glass one, the classic brick one, the
// Japanese wooden one) and the yakitori alley stall. Each makes the same rng
// calls in the same order as its old drawing in tinyBuildings.js (the modern
// and the wooden station use none), so a seed gives the same building.
// (This file and tinyBuildingsFull.js import each other: the kit's bindings are
// read only inside functions, never at the top level.)
import { shade, seeded } from '../tinyCharacters.js';
import {
  V, DOORS, WINDOWS, sign, noren, lantern, pitched, flatRoof, flatTop, dome,
  INK, WHITE, GOLD, CONCRETE, WOOD, DARKWOOD, LIGHTWOOD, FRAME, METAL, PAPER,
} from '../tinyBuildingsFull.js';
import { old, oldMany, oldFits, edges } from './a.js';
import { dark, glowLattice } from './b.js';
import { walls, windows } from './d.js';
import { bigSign } from './c.js';

const GF = 24, SILL = 6;                                                  // the kit's storeys (FULL_STOREY)

export const PART = {
  station: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), wall = v.pick(['#e8e0d0', '#f2efe8', '#d8d0c4']), line = v.pick(['#2f8a5a', '#2c6fd0', '#c8402c']), top = 30;
      // the old drawing's window rows (one pane each): counted from its sizes
      const ow = old(w), odx = Math.round(ow / 2) - 5;
      const nL = oldFits('aluPair', 2, odx - 4) ? oldMany('aluPair', 2, odx - 4) : 0;
      const nR = oldFits('aluPair', odx + 14, ow - 2) ? oldMany('aluPair', odx + 14, ow - 2) : 0;
      walls(r, wall, 0, w, top);
      r(line, 0, top - 2, w, 1); r(shade(wall, 0.84), 0, top - 1, w, 1);    // a stripe in the line's colour under the eaves
      const dx = Math.round(w / 2) - 8;
      r(shade(wall, 0.72), dx - 2, 0, 20, 19); r(shade(wall, 0.84), dx - 2, 0, 1, 19);   // the doorway, set back
      DOORS.auto(r, dx);
      r(shade(CONCRETE, 0.9), dx - 3, 0, 22, 1);                           // the step
      // a concrete canopy over the doors: its underside in shade, its edge lit
      r(shade(wall, 0.6), dx - 5, 18, 26, 1); r(shade(wall, 1.06), dx - 5, 19, 26, 1);
      sign(r, line, WHITE, 3, 20, w - 6, 8, 'STATION');
      if (nL) windows(r, rng, 'aluPair', wall, 3, dx - 4, SILL, nL);
      if (nR) windows(r, rng, 'aluPair', wall, dx + 20, w - 3, SILL, nR);
      // a timetable by the door, the line's map on the other side
      r(shade(wall, 0.6), dx - 9, 5, 6, 9); r(PAPER, dx - 8, 6, 4, 7);
      for (let y = 7; y < 13; y += 2) r('#8a8a88', dx - 8, y, 3, 1);
      r(line, dx - 8, 12, 4, 1);
      r(shade(wall, 0.6), dx + 19, 7, 6, 7); r(PAPER, dx + 20, 8, 4, 5); r(line, dx + 20, 10, 4, 1); r(INK, dx + 21, 10, 1, 1); r(INK, dx + 23, 10, 1, 1);
      flatTop(r, v, wall, top, w);
    },
  },

  stationModern: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const base = '#b8bcc0', frame = '#9aa0a8', top = 48, mid = Math.round(w / 2);
      const UP = '#6f8aa6', UPHI = '#8fb0cc', bar = r;
      r(base, 0, 0, w, top); edges(r, base, 0, w, 0, top);
      // the ground floor: a wall of glass (dark at night, as before: only the doors shine), mullions every 9 px
      r(frame, 0, 0, w, 2); r(shade(frame, 0.8), 0, 0, w, 1);
      r(UP, 2, 2, w - 4, 19); r(UPHI, 2, 16, w - 4, 5);
      // ticket gates inside, either side of the doors
      for (const gx of [mid - 46, mid - 40, mid - 34, mid + 31, mid + 37, mid + 43]) {
        bar('#c8ccd0', gx, 2, 4, 7); bar(shade('#c8ccd0', 0.72), gx + 3, 2, 1, 7); bar(INK, gx, 8, 4, 1); bar('#2f8a5a', gx + 1, 7, 2, 1);
      }
      for (let x = 2; x <= w - 3; x += 9) bar(frame, x, 2, 1, 19);
      bar(frame, w - 3, 2, 1, 19);
      // the band between the floors
      r(frame, 0, 21, w, 3); r(shade(frame, 1.15), 0, 23, w, 1); r(shade(frame, 0.8), 0, 21, w, 1);
      // the upper floor: the hall, an escalator going up, the departure board
      r(UP, 2, 24, w - 4, 20); r(UPHI, 2, 31, w - 4, 4);
      for (let k = 0; k < 5; k++) {                                       // the escalator: treads, its side below them
        r('#4a4e54', 15 + k * 6, 24 + k * 2, 6, 2); r('#c8d4dc', 15 + k * 6, 26 + k * 2, 6, 1);
      }
      r('#4a4e54', 12, 24, 1, 11); r(shade('#4a4e54', 1.3), 12, 34, 2, 1);
      const bx = w - 42;                                                  // the board: amber times (they glow at night)
      r('#3a3f44', bx, 26, 26, 8); r('#1f2226', bx + 1, 27, 24, 6);
      for (const y of [28, 30, 32]) { r('#f2a040', bx + 2, y, 4, 1); r('#f2a040', bx + 8, y, 12, 1); r('#e8603a', bx + 21, y, 3, 1); }
      for (let x = 2; x <= w - 3; x += 9) r(frame, x, 24, 1, 11);
      r(frame, w - 3, 24, 1, 11);
      // three pairs of sliding doors under a steel canopy
      r(FRAME, mid - 26, 0, 52, 19);
      for (const dx of [mid - 25, mid - 8, mid + 9]) DOORS.auto(r, dx);
      r(shade('#4a4e54', 0.8), mid - 30, 19, 60, 1); r('#4a4e54', mid - 30, 20, 60, 2); r('#c8ccd0', mid - 30, 21, 60, 1);
      for (const x of [mid - 28, mid + 27]) r(METAL, x, 22, 1, 3);        // its tie rods
      sign(r, '#2f8a5a', WHITE, 9, 35, w - 18, 9, 'TINY TOWN STATION');
      r(shade(base, 0.86), 0, 44, w, 1);
      flatRoof(r, base, 0, top, w, 21);
      for (let i = 9; i + 12 <= w - 9; i += 21) {                         // skylights
        r(shade('#9fc8e8', 0.78), i, top + 5, 12, 1); r('#9fc8e8', i, top + 6, 12, 8); r('#c8e0f0', i, top + 12, 12, 1); r(shade('#9fc8e8', 0.85), i + 6, top + 6, 1, 8);
      }
      // the clock on top: a cream box, a round face (lit at night), the hands
      const cx = mid - 7, cy = top + 21, CREAM = '#e8e0d0', FACE = '#dfe8ec', hand = dark(r, INK);
      r(CREAM, cx, cy, 15, 14); r(shade(CREAM, 0.78), cx, cy, 15, 1); r(shade(CREAM, 1.05), cx, cy + 13, 15, 1); r(shade(CREAM, 0.88), cx + 14, cy + 1, 1, 12);
      r(INK, cx + 2, cy + 2, 11, 11);
      r(FACE, cx + 4, cy + 3, 7, 9); r(FACE, cx + 3, cy + 4, 9, 7);
      for (const [tx, ty] of [[7, 11], [11, 7], [7, 3], [3, 7]]) hand('#8a8a88', cx + tx, cy + ty, 1, 1);
      hand(INK, cx + 7, cy + 7, 1, 4); hand(INK, cx + 7, cy + 7, 3, 1);
    },
  },

  stationBrick: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const brick = '#b8503a', stone = '#ece4d4', top = 42, mid = Math.round(w / 2), pw = 44, p0 = mid - pw / 2, SLATE = '#4a5560';
      r(brick, 0, 0, w, top);
      for (let up = 4, k = 0; up < top; up += 3, k++) {                   // courses of brick, the joints staggered
        r(shade(brick, 0.86), 0, up, w, 1);
        for (let x = (k % 2) * 4 + 2; x < w; x += 8) r(shade(brick, 0.93), x, up + 1, 1, 2);
      }
      const band = (up, h) => { r(stone, 0, up, w, h); r(shade(stone, 0.8), 0, up, w, 1); r(shade(stone, 1.04), 0, up + h - 1, w, 1); };
      band(0, 3); band(21, 3); band(39, 3);                               // stone bands
      // four arched windows a floor in each wing, in the old order (left to right, the lower one first)
      const cols = [5, 20, 35, 50, 111, 126, 141, 156];
      for (const x of cols) for (const up of [6, 26]) {
        r(stone, x - 1, up - 1, 9, 1); r(shade(stone, 0.8), x - 1, up - 2, 9, 1);   // the stone sill
        WINDOWS.arched(r, rng, x, up, '#3a3f44');
        r(stone, x + 2, up + 11, 3, 2); r(shade(stone, 0.85), x + 2, up + 11, 3, 1);   // the keystone
      }
      // the stone pavilion in the middle: pilasters, two arched doors, a round window, the name
      const PH = 48;
      r(stone, p0, 0, pw, PH);
      for (const x of [p0, p0 + pw - 4]) { r(shade(stone, 0.9), x, 0, 4, PH); r(shade(stone, 1.04), x, 0, 1, PH); r(shade(stone, 0.8), x + 3, 0, 1, PH); }
      r(shade(stone, 0.8), p0, 0, pw, 1);
      for (const dx of [mid - 11, mid + 2]) {
        const S = shade(stone, 0.78);                                     // the doorway's dark surround, round topped
        r(S, dx - 1, 0, 11, 15); r(S, dx, 15, 9, 1); r(S, dx + 1, 16, 7, 1); r(S, dx + 2, 17, 5, 1); r(S, dx + 3, 18, 3, 1);
        DOORS.arched(r, dx, 0, DARKWOOD);
      }
      r(shade(stone, 0.85), mid - 13, 0, 26, 1);                          // the step
      r(shade(stone, 0.8), mid - 4, 22, 8, 8); WINDOWS.round(r, mid - 3, 23);
      sign(r, '#2f8a5a', WHITE, p0 + 5, 34, pw - 10, 8, 'STATION');
      // the wings' slate roofs
      pitched(r, SLATE, -3, top, p0 + 3, 18, 2); pitched(r, SLATE, p0 + pw, top, w - p0 - pw + 3, 18, 2);
      // the cornice, the drum and the copper dome with its finial
      r(shade(stone, 0.7), p0 - 1, PH, pw + 2, 1); r(stone, p0 - 1, PH + 1, pw + 2, 2); r(shade(stone, 1.05), p0 - 1, PH + 2, pw + 2, 1);
      r(shade(stone, 0.9), p0 + 4, PH + 3, pw - 8, 2); r(shade(stone, 0.75), p0 + 4, PH + 3, pw - 8, 1);
      const COPPER = '#4f7a6a', rad = 16, dy = PH + 5;
      dome(r, COPPER, mid, dy, rad);
      for (let k = 1; k < rad - 2; k++) {                                 // ribs curving to the top
        const hw = Math.round(Math.sqrt(rad * rad - k * k)), o = Math.round(hw * 0.5);
        r(shade(COPPER, 0.86), mid - o, dy + k, 1, 1); r(shade(COPPER, 0.86), mid + o, dy + k, 1, 1);
      }
      r(shade(GOLD, 0.8), mid - 1, dy + rad, 3, 2); r(shade(GOLD, 1.15), mid - 1, dy + rad + 1, 1, 1); r(GOLD, mid, dy + rad + 2, 1, 5);   // a ball and a spike
    },
  },

  stationWooden: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const wood = '#8a5a3a', plaster = '#f2ead8', top = 27, mid = Math.round(w / 2), TILE = '#4a4442';
      r(plaster, 0, 0, w, top);
      // the bays either side (three each), the wide one in the middle for the doors
      const posts = [0, 19, 38, mid - 21, mid + 18, w - 41, w - 22, w - 3];
      for (let i = 0; i < posts.length - 1; i++) {
        const x0 = posts[i] + 3, x1 = posts[i + 1];
        if (x0 > mid - 20 && x1 < mid + 20) continue;
        r(wood, x0, 0, x1 - x0, 5); r(shade(wood, 1.12), x0, 5, x1 - x0, 1);  // the boarded skirt, its rail lit
        for (let x = x0 + 3; x < x1; x += 4) r(shade(wood, 0.84), x, 0, 1, 5);
        glowLattice(r, x0 + 3, 8, x1 - x0 - 6, 8);
      }
      for (const p of posts) { r(wood, p, 0, 3, top); r(shade(wood, 1.15), p, 0, 1, top); r(shade(wood, 0.8), p + 2, 0, 1, top); }
      r(shade(wood, 0.7), 0, 0, w, 1);
      // two sets of lattice doors that slide, a lintel over them
      for (const dx of [mid - 17, mid + 1]) DOORS.sliding(r, dx);
      r(wood, mid - 1, 0, 2, 18); r(wood, mid - 18, 0, 1, 18); r(wood, mid + 17, 0, 1, 18);
      r(DARKWOOD, mid - 18, 18, 36, 2); r(shade(DARKWOOD, 1.25), mid - 18, 19, 36, 1);
      r(shade(plaster, 0.92), mid - 18, 20, 36, 1);
      // the head beam, in the shade of the eaves
      r(wood, 0, top - 3, w, 3); r(shade(wood, 0.75), 0, top - 3, w, 1);
      for (const dx of [mid - 22, mid + 19]) { r(INK, dx + 1, 19, 1, 4); lantern(r, dx, 11); }   // red lanterns either side
      // the big tiled hipped roof, its ends turned up
      pitched(r, TILE, -6, top, w + 12, 30, 3);
      r(TILE, -9, top, 3, 2); r(TILE, -10, top + 1, 2, 2); r(shade(TILE, 1.3), -10, top + 2, 1, 1);
      r(TILE, w + 6, top, 3, 2); r(TILE, w + 8, top + 1, 2, 2); r(shade(TILE, 1.3), w + 9, top + 2, 1, 1);
      sign(r, '#e8dcc0', '#4a3424', mid - 24, top + 6, 48, 9, 'STATION');
    },
  },

  alleyStall: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), front = v.pick([DARKWOOD, '#5a3a28', '#3a2a22']), g = seeded((b.seed ?? 1) * 59 + 7);
      r(front, 0, 0, w, GF);
      for (let x = 4; x < w - 2; x += 4) r(shade(front, 0.86), x, 2, 1, GF - 2);   // the boards
      r(shade(front, 1.25), 0, 0, 1, GF); r(shade(front, 0.75), w - 1, 0, 1, GF);
      r(shade(front, 0.65), 0, 0, w, 2);
      const lw = w - 26;
      glowLattice(r, 5, SILL, lw, 8);
      r(shade(front, 0.7), 4, SILL - 2, lw + 2, 1);
      DOORS.sliding(r, w - 18);
      noren(r, v.pick(['#8a3a2a', '#2c3652', '#2f4a3a']), w - 20, 10, 20, 8);
      r(INK, 3, 23, 1, 1); r(INK, w - 22, 23, 1, 1);                       // the sign's hooks
      bigSign(r, LIGHTWOOD, INK, 1, 16, w - 20, 7, 'YAKITORI');
      lantern(r, 0, 8); lantern(r, w - 4, 16);
      if (g() < 0.6) {                                                    // a beer crate by the wall, bottles in it
        const c = g() < 0.5 ? '#d8443c' : '#e8b830', x = 6;
        r(shade(c, 0.75), x, 0, 8, 5); r(c, x, 1, 8, 3); r(shade(c, 1.15), x, 4, 8, 1); r(shade(c, 0.7), x + 2, 2, 4, 1);
        for (let i = 0; i < 4; i++) r('#4a3a2a', x + 1 + i * 2, 5, 1, 2);
      }
      pitched(r, '#4a4442', -2, GF, w + 4, 18, 2);
    },
  },
};
