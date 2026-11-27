// Full-size buildings, part D (merged into tinyBuildingsFull.js when reviewed):
// the koban (police station), the post office, the bank, the clinic.
// Each makes the same rng calls in the same order as its old drawing in
// tinyBuildings.js (window counts come from the old sizes, so the rooftop's
// choices after them stay the same).
import { shade } from '../tinyCharacters.js';
import {
  V, floorAt, DOORS, WINDOWS, oneWindow, sign, icon, CROSS, flatRoof, rooftop, flatTop,
  INK, WHITE, RED, GLASS, FRAME, METAL, CONCRETE, LANTERN, HI, PAPER,
} from '../tinyBuildingsFull.js';

const GF = 24, SHOP_GF = 28, SILL = 6;
const GREEN = '#2fa36b';

/** The same painter moved ox pixels to the right (text, force and icons too). */
function shifted(r0, ox) {
  const r = (c, dx, up, w, h) => r0(c, dx + ox, up, w, h);
  r.k = r0.k;
  if (r0.px) r.px = (c, dx, up, w, h) => r0.px(c, dx + ox, up, w, h);
  if (r0.text) r.text = (str, c, dx, up, w, h, v) => r0.text(str, c, dx + ox, up, w, h, v);
  if (r0.force) r.force = shifted(r0.force, ox);
  return r;
}
/** The old (scale 1) width a full-size width came from. */
const oldW = (w) => Math.round(w / 1.5);
/** How many windows the old drawing put in a row (its window widths and gap 3), so the rng is used the same. */
const OLD_WW = { alu: 5, aluPair: 9, tall: 5 };
const oldHowMany = (kind, x0, x1) => Math.max(1, Math.floor((x1 - x0 - 3) / (OLD_WW[kind] + 3)));
/** n things ww wide between x0 and x1 on an even step, the row centred. */
function evenRow(x0, x1, n, ww) {
  const gap = Math.max(1, Math.floor((x1 - x0 - n * ww) / (n + 1))), used = n * ww + (n - 1) * gap;
  const start = x0 + Math.floor((x1 - x0 - used) / 2);
  return Array.from({ length: n }, (_, i) => start + i * (ww + gap));
}
const FULL_WW = { alu: 7, aluPair: 13, tall: 7 };
/** A row of windows on an even step, a concrete sill under each (the old rng: one pane each). */
function windows(r, rng, kind, wall, x0, x1, up, n) {
  for (const x of evenRow(x0, x1, n, FULL_WW[kind])) {
    oneWindow(r, rng, kind, x, up);
    if (kind !== 'tall') { r(shade(wall, 0.72), x - 1, up - 1, FULL_WW[kind] + 2, 1); r(shade(wall, 0.9), x, up - 2, FULL_WW[kind], 1); }
  }
}
/** A concrete building's edges: a plinth, the left edge lit, the right in shade. */
function walls(r, wall, x, w, h) {
  r(wall, x, 0, w, h);
  r(shade(wall, 1.08), x, 0, 1, h); r(shade(wall, 0.86), x + w - 1, 0, 1, h);
  r(shade(wall, 0.74), x, 0, w, 2); r(shade(wall, 0.9), x, 2, w, 1);
}

// --- the koban ----------------------------------------------------------------------
const BIKE = [
  '..kkk....kk..',
  '...b.....b...',
  '...bbbbbbb...',
  '.kkkb...bkkk.',
  'k...bb.bbb..k',
  'k.gbbbkb.bg.k',
  'k...k.k.k...k',
  '.kkk.....kkk.',
];
const LAMP = ['.lll.', 'lhlll', 'lllll', 'lllll', '.lll.'];

// --- the post office: 〒 ---------------------------------------------------------
const POST_MARK = ['wwwwwww', '.......', 'wwwwwww', '...w...', '...w...', '...w...', '...w...'];

export const PART = {
  koban: {
    approved: false,
    draw(r0, rng, b, wall0, roof, w) {
      icon(r0, 0, 0, BIKE, { k: INK, b: '#3f7fd6', g: '#d8d0c0' });      // a bicycle out front
      const r = shifted(r0, 16), v = V(rng), bw = 45;
      const wall = v.pick(['#9a7c60', '#c8b8a0', '#e8e0d0']);
      walls(r, wall, 0, bw, GF);
      WINDOWS.shop(r, 3, 0, 22, 18);
      DOORS.glass(r, 28);
      r(shade(wall, 0.7), 27, 18, 11, 1);                                // the door's lintel
      sign(r, '#2c3652', WHITE, 2, 18, 26, 6, 'POLICE STATION');
      r(shade(wall, 0.72), 31, 18, 3, 1);                                // the red lamp over the door, on a bracket
      icon(r, 30, 19, LAMP, { l: LANTERN, h: WHITE });
      r(shade(wall, 0.62), 38, 6, 6, 10); r(PAPER, 39, 7, 2, 8); r(PAPER, 42, 7, 1, 8);   // a notice board: wanted posters
      r(RED, 39, 13, 2, 1); r('#8a8a88', 39, 9, 2, 1); r('#8a8a88', 39, 11, 2, 1); r('#8a8a88', 42, 10, 1, 3);
      flatRoof(r, wall, -1, GF, bw + 2, 18);
      r('#e8dcc0', -1, GF, bw + 2, 2); r(shade('#e8dcc0', 0.8), -1, GF, bw + 2, 1);   // the cream fascia
    },
  },

  postOffice: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), wall = '#e8e0d0', bw = w - 9, ow = oldW(w), obw = ow - 6;
      walls(r, wall, 0, bw, SHOP_GF);
      r(RED, 0, 19, bw, 9); r(shade(RED, 0.75), 0, 18, bw, 1); r(shade(RED, 1.12), 0, 27, bw, 1);   // the red band
      icon(r, 4, 20, POST_MARK, { w: WHITE });
      sign(r, RED, WHITE, 14, 20, Math.min(52, bw - 18), 7, 'POST OFFICE', false);
      const n = Math.floor((obw - 14) / 10), doorLeft = v.chance(0.35);
      const xs = evenRow(doorLeft ? 20 : 3, doorLeft ? bw - 3 : bw - 20, n, 13);
      for (const x of xs) {
        WINDOWS.alu(r, rng, x, SILL, 13);
        const c = rng() < 0.5 ? '#f2c230' : '#3f7fd6';                  // a poster in the window
        r(c, x + 3, SILL + 2, 3, 5); r(WHITE, x + 3, SILL + 5, 3, 1);
        r(shade(wall, 0.72), x - 1, SILL - 1, 15, 1);
      }
      const dx = doorLeft ? 2 : bw - 18;
      DOORS.auto(r, dx); r(shade(wall, 0.7), dx - 1, 18, 18, 1);
      flatRoof(r, wall, 0, SHOP_GF, bw, 18);
      r(RED, 0, SHOP_GF, bw, 3); r(shade(RED, 0.75), 0, SHOP_GF, bw, 1);  // the red rim
      rooftop(r, v, 0, SHOP_GF, bw);
      const px = bw + 2;                                                  // the post box
      r(shade(RED, 0.6), px, 0, 6, 1); r(RED, px, 1, 6, 8); r(shade(RED, 0.8), px + 5, 1, 1, 8); r(shade(RED, 1.15), px, 1, 1, 8);
      r(shade(RED, 0.85), px, 9, 6, 1); r(RED, px + 1, 10, 4, 1);
      r(INK, px + 1, 7, 4, 1); r(WHITE, px + 2, 3, 2, 2);
    },
  },

  bank: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), floors = v.int(2, 4), top = floorAt(floors), wall = v.pick(['#6a5848', '#8a8a88', '#c8b8a0', '#4a4e54']);
      const signC = v.pick(['#c8302a', '#2c4a8a', '#2f7a4a']), ow = oldW(w);
      walls(r, wall, 0, w, top);
      r(shade(wall, 1.1), 0, GF, 2, top - GF); r(shade(wall, 0.82), w - 2, GF, 2, top - GF);   // corner pilasters
      const kind = v.pick(['alu', 'tall', 'aluPair']), n = oldHowMany(kind, 2, ow - 2);
      for (let f = 1; f < floors; f++) {
        r(shade(wall, 0.84), 0, floorAt(f), w, 1); r(shade(wall, 1.06), 0, floorAt(f) + 1, w, 1);   // a band at each floor
        windows(r, rng, kind, wall, 4, w - 4, floorAt(f) + SILL, n);
      }
      sign(r, signC, WHITE, 2, 18, w - 4, 6, 'BANK');
      WINDOWS.shop(r, 3, 0, w - 31, 18); DOORS.auto(r, w - 26);
      r(CONCRETE, w - 8, 0, 6, 15); r(shade(CONCRETE, 0.75), w - 8, 14, 6, 1); r(shade(CONCRETE, 0.85), w - 3, 0, 1, 14);   // the ATM
      r(INK, w - 7, 8, 4, 4); r(HI, w - 7, 11, 1, 1); r(METAL, w - 7, 5, 4, 2); r(INK, w - 6, 3, 2, 1);
      flatTop(r, v, wall, top, w);
    },
  },

  clinic: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), floors = v.int(1, 3), top = floorAt(floors), wall = v.pick(['#b9b8b0', '#e8e4dc', '#d8e0e4']), ow = oldW(w);
      walls(r, wall, 0, w, top);
      sign(r, WHITE, GREEN, 2, 18, w - 4, 6, 'CLINIC');
      WINDOWS.shop(r, 3, 0, w - 18, 18, FRAME, '#dfe8ec'); DOORS.glass(r, w - 12);
      const cross = { g: GREEN, w: WHITE };
      if (floors === 1) {                                                 // a cross on a board on the roof
        const x = w - 13;
        r(shade(FRAME, 1.2), x + 2, GF, 1, 3); r(shade(FRAME, 1.2), x + 8, GF, 1, 3);
      }
      for (let f = 1; f < floors; f++) {
        r(shade(wall, 0.84), 0, floorAt(f), w, 1);
        if (f === 1) { r(shade(wall, 0.8), 7, floorAt(1) + SILL - 1, 9, 9); icon(r, 8, floorAt(1) + SILL, CROSS, cross); }
        const x0 = f === 1 ? 18 : 3, n = oldHowMany('aluPair', f === 1 ? 12 : 2, ow - 2);
        windows(r, rng, 'aluPair', wall, x0, w - 3, floorAt(f) + SILL, n);
      }
      flatTop(r, v, wall, top, w);
      if (floors === 1) { const x = w - 13; r(shade(WHITE, 0.7), x, GF + 3, 11, 9); r(WHITE, x + 1, GF + 4, 9, 7); icon(r, x + 2, GF + 4, CROSS, cross); }
    },
  },
};
