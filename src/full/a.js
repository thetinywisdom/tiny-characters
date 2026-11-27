// Full-size buildings, part A:
// the house, the apartment block, the wooden apartment, the shop with flats
// above and the office building. Each makes the same choices with the rng, in
// the same order, as its old drawing in tinyBuildings.js, so a seed gives the
// same building (floors, door side, roof, colours, how many windows, which lit).
// (This file and tinyBuildingsFull.js import each other: the kit's bindings are
// read only inside functions, never at the top level.)
import { shade, seeded } from '../tinyCharacters.js';
import { shopFront as shopFrontB } from './b.js';
import {
  V, floorAt, DOORS, WINDOWS, WW, oneWindow, SHOPS, shopFront, upright, laundry, flatRoof, flatTop, aRoof, pitched,
  INK, WHITE, LIT, CONCRETE, METAL, LANTERN, HOUSE_ROOFS, DOOR_COLOURS,
} from '../tinyBuildingsFull.js';

const GF = 24, SG = 28, FL = 20, SILL = 6;                               // the kit's storeys (FULL_STOREY)
const KINDS = ['konbini', 'ramen', 'cafe', 'bookshop', 'bakery', 'izakaya'];   // tinyBuildings' SHOP_TYPES, in its order
/** The old width (the drawing's w is the old one times 1.5; the old widths are even, so this is exact). */
const old = (w) => Math.round(w / 1.5);
/** Use up n of the building's rng (what the old drawing used it for), so later choices stay the same. */
const burn = (rng, n) => { for (let i = 0; i < n; i++) rng(); };

// The old drawings' window sizes and how they counted windows: the count is a
// choice (it uses the rng: one pane per window), so it is made as the old one made it.
const OLD_WW = { sash: 5, pair: 9, alu: 5, aluPair: 9 };
const oldMany = (kind, x0, x1, gap = 3) => Math.max(1, Math.floor((x1 - x0 - gap) / (OLD_WW[kind] + gap)));
const oldFits = (kind, x0, x1) => x1 - x0 >= OLD_WW[kind] + 2;
/** n windows of a kind between x0 and x1, on a regular step (whole-pixel gaps), the row centred; their sills at up. */
function row(r, rng, kind, x0, x1, up, n, o) {
  const ww = WW[kind], gap = Math.max(2, Math.floor((x1 - x0 - n * ww) / (n + 1))), span = n * ww + (n - 1) * gap;
  const start = x0 + Math.floor((x1 - x0 - span) / 2);
  for (let i = 0; i < n; i++) oneWindow(r, rng, kind, start + i * (ww + gap), up, o);
}

// --- pieces ----------------------------------------------------------------------
/** A wall's edges: the left a little lit, the right in shade (light from the upper left). */
function edges(r, wall, dx, w, up, h) { r(shade(wall, 1.05), dx, up, 1, h); r(shade(wall, 0.88), dx + w - 1, up, 1, h); }
/** A band where a floor meets the next (a string course): its top lit, its underside in shade. */
function band(r, wall, dx, w, up) { r(shade(wall, 0.8), dx, up - 1, w, 1); r(shade(wall, 1.06), dx, up, w, 1); }
/** A plinth along the ground, 2 rows, its top edge lit. */
function plinth(r, wall, dx, w, c = shade(wall, 0.78)) { r(c, dx, 0, w, 2); r(shade(c, 1.12), dx, 2, w, 1); }
/** A brick chimney w wide, h tall, its bottom at up: courses of brick, a lit side, a cap. */
function chimney(r, dx, up, w = 6, h = 10, c = '#9a4a3a') {
  r(c, dx, up, w, h - 2);
  for (let y = up + 1, k = 0; y < up + h - 2; y += 2, k++) {             // mortar courses, the joints staggered
    r(shade(c, 0.82), dx, y, w, 1);
    r(shade(c, 0.82), dx + (k % 2 ? 1 : 3), y + 1, 1, 1);
  }
  r(shade(c, 1.15), dx, up, 1, h - 2); r(shade(c, 0.75), dx + w - 1, up, 1, h - 2);
  r(INK, dx - 1, up + h - 2, w + 2, 2); r(shade(INK, 1.5), dx - 1, up + h - 1, w + 2, 1);   // the cap
}
/** A potted plant, 5 wide, 9 tall. */
function potPlant(r, dx) {
  const pot = '#a8664a', leaf = '#5f8f5a';
  r(shade(pot, 0.8), dx, 0, 5, 1); r(pot, dx, 1, 5, 3); r(shade(pot, 1.15), dx - 1, 4, 7, 1); r(shade(pot, 1.15), dx, 1, 1, 3);
  r(leaf, dx - 1, 5, 7, 2); r(leaf, dx, 7, 5, 1); r(leaf, dx + 1, 8, 3, 1);
  r(shade(leaf, 1.25), dx, 6, 2, 1); r(shade(leaf, 1.25), dx + 1, 7, 1, 1); r(shade(leaf, 0.75), dx + 4, 5, 2, 1);
}
/** A wall lamp by a door: a bracket, a lamp with a lit pane (it shines at night). */
function wallLamp(r, dx, up) {
  r(INK, dx, up, 3, 1); r(LIT, dx, up + 1, 3, 3); r(shade(LIT, 1.06), dx, up + 3, 1, 1); r(INK, dx - 1, up + 4, 5, 1); r(INK, dx + 1, up + 5, 1, 1);
}
/** A railing: a top rail at `up` (lit on top), balusters every `step` below it down to `from`. */
function railing(r, c, dx, w, from, up, step = 3, bar = shade(c, 0.86)) {
  for (let x = dx; x < dx + w; x += step) r(bar, x, from, 1, up - from);
  r(bar, dx + w - 1, from, 1, up - from);
  r(c, dx, up, w, 1); r(shade(c, 1.08), dx, up, w, 1);
}

export const PART = {
  house: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), floors = v.chance(0.35) ? 2 : 1, top = floorAt(floors);
      const roofKind = v.pick(['pitched', 'pitched', 'hipped', 'flat']), roofC = b.roof ?? v.pick(HOUSE_ROOFS);
      const doorLeft = v.chance(0.5), doorKind = v.pick(['wood', 'wood', 'glazed', 'steel']), doorC = v.pick(DOOR_COLOURS);
      const kind = v.pick(['sash', 'pair', 'alu', 'aluPair']), frame = v.pick([WHITE, WHITE, '#e8dcc0', '#6a4a3a']);
      const ow = old(w), odx = doorLeft ? 6 : ow - 12;
      r(wall, 3, 0, w - 6, top); edges(r, wall, 3, w - 6, 0, top);
      plinth(r, wall, 3, w - 6);
      const dx = doorLeft ? 9 : w - 18;
      r(shade(wall, 0.72), dx - 1, 0, 11, 20);                           // the door's frame
      r(shade(CONCRETE, 1.08), dx - 2, 0, 13, 1);                        // the step
      DOORS[doorKind](r, dx, 1, doorC);
      const hood = roofKind === 'flat' ? CONCRETE : roofC;               // a little roof over the door
      r(shade(wall, 0.7), dx - 1, 19, 1, 1); r(shade(wall, 0.7), dx + 9, 19, 1, 1);   // its brackets
      r(shade(hood, 0.6), dx - 2, 20, 13, 1); r(hood, dx - 2, 21, 13, 1); r(shade(hood, 1.2), dx - 2, 22, 13, 1);
      if (v.chance(0.5)) wallLamp(r, doorLeft ? dx + 11 : dx - 5, 12);  // a lamp by the door
      const ox0 = doorLeft ? odx + 8 : 3, ox1 = doorLeft ? ow - 3 : odx - 2;
      const x0 = doorLeft ? dx + 14 : 4, x1 = doorLeft ? w - 4 : dx - 5;
      const n0 = v.int(1, oldMany(kind, ox0, ox1));
      if (oldFits(kind, ox0, ox1)) row(r, rng, kind, x0, x1, SILL, n0, { frame });
      if (floors === 2) {
        band(r, wall, 3, w - 6, GF);
        const n1 = v.int(2, oldMany(kind, 3, ow - 3));
        row(r, rng, kind, 4, w - 4, GF + SILL, n1, { frame });
      }
      const d = Math.round(v.int(14, 18) * 1.5);
      if (roofKind === 'flat') r(shade(wall, 0.82), 3, top - 1, w - 6, 1);   // under the parapet
      else {                                                              // the eaves' shadow, a gutter, a downpipe
        r(shade(wall, 0.8), 3, top - 2, w - 6, 2);
        r(shade(METAL, 0.72), 1, top - 1, w - 2, 1);
        const px = doorLeft ? w - 5 : 4;
        r(shade(METAL, 0.72), px, 0, 1, top - 1); r(shade(METAL, 0.6), px - 1, 0, 2, 1);
      }
      aRoof(r, roofKind, wall, roofC, 3, top, w - 6, d);
      if (roofKind !== 'flat' && v.chance(0.5)) chimney(r, v.pick([9, w - 15]), top + 15, 6, 10);
      if (v.chance(0.4)) potPlant(r, doorLeft ? dx - 7 : dx + 13);       // a pot plant
    },
  },

  apartment: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), floors = v.int(4, 6), top = floorAt(floors), balcony = v.chance(0.7);
      const ow = old(w), kind = v.pick(['alu', 'alu', 'aluPair', 'sash']), hm = oldMany(kind, 2, ow - 2), n = v.int(Math.max(2, hm - 1), hm);
      const BAL = '#d8d4ca';
      r(wall, 0, 0, w, top); edges(r, wall, 0, w, 0, top);
      for (let f = 1; f < floors; f++) {
        const up = floorAt(f);
        if (balcony) r(shade(wall, 0.7), 1, up + 2, w - 2, 4);           // the balcony's back wall, in its shade
        row(r, rng, kind, 3, w - 3, up + SILL + (balcony ? 1 : 0), n);
        if (balcony) {
          r(shade(BAL, 0.62), 1, up, w - 2, 1); r(shade(BAL, 0.9), 1, up + 1, w - 2, 1);   // the slab: its underside, its face
          railing(r, BAL, 1, w - 2, up + 2, up + 6, 3, shade(BAL, 0.96));
          if (b.laundry) laundry(r, b, f, 3, w - 3, up + 6, f === floors - 1);
        } else band(r, wall, 0, w, up);
      }
      plinth(r, wall, 0, w);
      const which = v.pick([0, 1, 2]), odx = [Math.round(ow / 2) - 5, 3, ow - 13][which], dx = [Math.round(w / 2) - 8, 4, w - 20][which];
      r(shade(wall, 0.62), dx - 1, 0, 18, 19);                           // the entrance's recess
      DOORS.auto(r, dx);
      r(shade(CONCRETE, 0.62), dx - 3, 19, 22, 1); r(CONCRETE, dx - 3, 20, 22, 1); r(shade(CONCRETE, 1.12), dx - 3, 21, 22, 1);   // a canopy over it
      const ofree = odx > ow / 2 ? [2, odx - 3] : [odx + 12, ow - 2], free = dx > w / 2 ? [3, dx - 4] : [dx + 19, w - 3];
      if (ofree[1] - ofree[0] > 8) {                                      // post boxes: four little doors with slots
        const x = free[0] + 2;
        r(shade(CONCRETE, 0.7), x, 4, 10, 11); r(shade(CONCRETE, 0.55), x, 4, 10, 1);
        for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          r(CONCRETE, x + 1 + i * 4, 5 + j * 5, 4, 4); r(shade(CONCRETE, 1.12), x + 1 + i * 4, 8 + j * 5, 4, 1); r(INK, x + 2 + i * 4, 7 + j * 5, 2, 1);
        }
      }
      if (ofree[1] - ofree[0] > 16) WINDOWS.alu(r, rng, free[1] - 9, SILL);
      if (!balcony) band(r, wall, 0, w, GF);
      flatTop(r, v, wall, top, w);
    },
  },

  woodApartment: {
    approved: false,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), bw = w - 9, top = floorAt(2), wall = v.pick(['#b8ae9c', '#c8b898', '#a8a8a0']), doorC = v.pick(['#8a6a4a', '#6a7f94', '#7a5a4a']);
      const RAIL = '#7a6a5a';
      r(wall, 0, 0, bw, top);
      for (let y = 4; y < top - 1; y += 3) r(shade(wall, 0.93), 0, y, bw, 1);   // the siding, a board every 3 rows
      edges(r, wall, 0, bw, 0, top);
      r(shade(CONCRETE, 0.9), 0, 0, bw, 2); r(shade(CONCRETE, 1.05), 0, 2, bw, 1);   // the concrete footing
      const units = Math.floor((old(w) - 6 - 2) / 14);
      for (let n = 0; n < 2; n++) for (let i = 0; i < units; i++) {
        const ux = 3 + i * 21, up = floorAt(n);
        r(shade(wall, 0.7), ux - 1, up, 11, 19);                         // the door's frame
        DOORS.steel(r, ux, up, doorC);
        r(shade(wall, 0.72), ux + 10, up + SILL + 9, 9, 1);               // a little hood over the window
        WINDOWS.alu(r, rng, ux + 11, up + SILL);
      }
      // the corridor along the upper floor: its slab, the railing (it hides the doors' feet)
      r(shade(wall, 0.6), 0, GF - 1, bw, 1); r(shade(RAIL, 1.0), 0, GF, bw, 2); r(shade(RAIL, 1.2), 0, GF + 1, bw, 1);
      railing(r, RAIL, 0, bw, GF + 2, GF + 6, 3);
      if (b.laundry) laundry(r, b, 1, 3, bw - 3, GF + 6, true);
      // the outside stairs: a landing at the corridor, steps down to the right, a post
      r(RAIL, bw, GF, 6, 2); r(shade(RAIL, 1.2), bw, GF + 1, 6, 1);
      for (let k = 1; k <= 12; k++) {                                     // the steps: a lit tread, a riser, the stringer at their end
        const x = bw + Math.floor((k + 1) / 2), up = GF - k * 2;
        r(shade(RAIL, 1.2), x, up + 1, 3, 1); r(shade(RAIL, 0.8), x, up, 3, 1); r(shade(RAIL, 0.6), x + 3, up, 1, 2);
      }
      r(shade(RAIL, 0.6), bw + 3, 0, 1, 10);                              // a post under the flight
      if (v.chance(0.5)) { r(shade(wall, 0.8), 0, top - 1, bw, 1); flatRoof(r, wall, 0, top, bw, 18); }
      else { r(shade(wall, 0.75), 0, top - 2, bw, 2); pitched(r, v.pick(['#4a5560', '#6a4a3a']), -3, top, bw + 6, 18); }
    },
  },

  mixedUse: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), floors = v.int(2, 4), top = floorAt(floors, SG);
      const kind = b.shopType ?? KINDS[Math.floor(rng() * KINDS.length)];
      const signLeft = v.chance(0.5), win = v.pick(['alu', 'aluPair', 'sash']);
      const ow = old(w), s = SHOPS[kind] ?? SHOPS.konbini;
      r(wall, 0, SG, w, top - SG); edges(r, wall, 0, w, SG, top - SG);
      shopFrontB(r, rng, w, kind, wall, b.seed ?? 1);                     // the shops' own front (part B): rng as the old one
      const ox0 = signLeft ? 7 : 2, ox1 = signLeft ? ow - 2 : ow - 7, x0 = signLeft ? 12 : 3, x1 = signLeft ? w - 3 : w - 12;
      for (let f = 1; f < floors; f++) {
        const up = floorAt(f, SG);
        if (f > 1) band(r, wall, 0, w, up);
        if (oldFits(win, ox0, ox1)) row(r, rng, win, x0, x1, up + SILL, oldMany(win, ox0, ox1));
      }
      r(shade(wall, 0.8), 0, SG, w, 1);                                   // the shadow over the sign
      const sx = signLeft ? 2 : w - 9, sh = top - SG - 9;
      r(INK, signLeft ? sx + 7 : sx - 1, SG + 5, 1, 1); r(INK, signLeft ? sx + 7 : sx - 1, SG + 3 + sh, 1, 1);   // its brackets
      upright(r, s.bg === WHITE ? '#2fa36b' : s.bg, WHITE, sx, SG + 4, 7, sh, s.name);
      r(shade(wall, 0.8), 0, top - 2, w, 1); r(shade(wall, 1.08), 0, top - 1, w, 1);   // the cornice
      flatTop(r, v, wall, top, w);
      return kind;
    },
  },

  office: {
    approved: true,
    draw(r, rng, b, roof, roofC, w) {
      const v = V(rng), floors = v.int(5, 7), top = floorAt(floors);
      const wall = b.wall ?? v.pick(['#cfd2d4', '#b8bcc0', '#d8d2c4', '#9aa0a8']);
      const [glassC, mull] = v.pick([['#6f8aa6', '#8fa8c0'], ['#5f8a86', '#7fa8a2'], ['#7a6a5a', '#9a8a78'], ['#4a5a6a', '#6a7a8a']]);
      const ribbon = v.chance(0.6);
      r(wall, 0, 0, w, top);
      r(shade(wall, 1.06), 0, 0, 2, top); r(shade(wall, 0.86), w - 2, 0, 2, top);   // the corner piers, lit and in shade
      const pn = Math.floor((w - 7) / 6), bwid = pn * 6 + 1, bx = Math.floor((w - bwid) / 2);   // ribbon panes, 5 wide
      const wn = Math.floor((w - 4) / 10), wx = Math.floor((w - (wn * 10 - 3)) / 2);        // punched windows, 7 wide
      for (let f = 1; f < floors; f++) {
        const fl = floorAt(f), up = fl + SILL;
        r(shade(wall, 0.9), 2, fl, w - 4, 1);                             // the floor's line
        if (ribbon) {
          r(shade(wall, 0.74), bx - 1, up, bwid + 2, 10);                // the opening's reveal
          r(METAL, bx, up, bwid, 9); r(glassC, bx + 1, up + 1, bwid - 2, 7);
          r(shade(glassC, 0.85), bx + 1, up + 7, bwid - 2, 1);           // the top of the glass in shade
          for (let i = 0; i < pn; i++) { const x = bx + i * 6; r(mull, x, up + 1, 1, 7); r(shade(glassC, 1.2), x + 1, up + 4, 1, 2); r(shade(glassC, 1.2), x + 2, up + 5, 1, 1); }
          r(mull, bx + bwid - 1, up + 1, 1, 7);
          r(shade(METAL, 0.75), bx, up, bwid, 1);                         // the sill
        } else for (let i = 0; i < wn; i++) {
          const x = wx + i * 10;
          r(shade(wall, 0.74), x - 1, up, 9, 10);                        // the opening's reveal
          r(METAL, x, up, 7, 9); r(glassC, x + 1, up + 1, 5, 7); r(METAL, x + 1, up + 5, 5, 1);   // a transom
          r(shade(glassC, 1.2), x + 1, up + 2, 1, 2); r(shade(METAL, 0.75), x - 1, up, 9, 1);
        }
      }
      // the lobby: glass across the ground floor, automatic doors in the middle, a canopy
      r(shade(wall, 0.7), 0, 0, w, 1);
      WINDOWS.shop(r, 3, 0, w - 6, 18); DOORS.auto(r, Math.round(w / 2) - 8);
      r(shade(wall, 0.55), 2, 19, w - 4, 1); r(shade(wall, 0.85), 2, 20, w - 4, 1); r(shade(wall, 1.1), 2, 21, w - 4, 1);
      flatRoof(r, wall, 0, top, w, 20);
      const box = '#918f8a';                                              // a plant room on the roof
      r(box, 6, top + 5, 13, 9); r(shade(box, 0.78), 6, top + 5, 13, 1); r(shade(box, 1.15), 6, top + 13, 13, 1);
      r(shade(box, 0.7), 8, top + 7, 4, 4); for (let y = top + 8; y < top + 11; y += 2) r(shade(box, 0.9), 8, y, 4, 1);   // a louvre
      if (v.chance(0.7)) {                                                // an antenna, its warning light
        const x = w - 10;
        r(shade(METAL, 0.6), x - 1, top + 5, 3, 1); r(INK, x, top + 6, 1, 12); r(INK, x - 1, top + 14, 3, 1);
        r(LANTERN, x, top + 18, 1, 2);
      }
    },
  },
};
