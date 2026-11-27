// Full-size buildings, part H: the European old town:
// the Tudor cottage, the Mediterranean villa, the Dutch canal house, the
// French country house and the Scandinavian house. Each makes the same choices
// with the rng, in the same order, as its old drawing in tinyBuildings.js, so a
// seed gives the same building (window counts come from the old sizes); new
// detail (lamps, pots) comes from a stream of its own.
// (This file and tinyBuildingsFull.js import each other: the kit's bindings are
// read only inside functions, never at the top level.)
import { shade, seeded } from '../tinyCharacters.js';
import {
  V, floorAt, DOORS, WINDOWS, pane, pitched, gable,
  INK, WHITE, NAVY, WIN, GLASS, DARKWOOD, CONCRETE, DOOR_COLOURS,
} from '../tinyBuildingsFull.js';
import { old, edges, band, plinth, chimney, wallLamp } from './a.js';
import { dark } from './b.js';
import { evenRow } from './d.js';

const GF = 24, SILL = 6;                                                  // the kit's ground floor and sill

// The old drawings' window widths and how they counted windows (gap 3 unless given).
const OLD_WW = { sash: 5, tall: 5, shuttered: 7, leaded: 5 };
const oldHow = (kind, x0, x1, gap = 3) => Math.max(1, Math.floor((x1 - x0 - gap) / (OLD_WW[kind] + gap)));
/** Whether the old windowRow drew anything (it skipped a row with no room, using no rng). */
const oldFits = (kind, x0, x1) => x1 - x0 >= OLD_WW[kind] + 2;
/** A new-detail stream from the building's seed (never the building's rng). */
const extra = (b, k) => seeded((b.seed ?? 1) * 97 + k);

// --- pieces ----------------------------------------------------------------------
/** Louvred shutters (3 wide) either side of a window gap ww wide at dx, h tall. */
function louvres(r, c, dx, up, ww, h) {
  for (const sx of [dx - 3, dx + ww]) {
    r(c, sx, up, 3, h); r(shade(c, 1.15), sx, up, 1, h);
    for (let y = up + 1; y < up + h - 1; y += 2) r(shade(c, 0.7), sx + 1, y, 2, 1);
    r(shade(c, 0.6), sx, up, 3, 1);
  }
}
/** A wall lamp at the first of the spots xs that is clear of the things in busy ([x0, x1] ranges). */
function lampBy(r, busy, xs, up, w) {
  for (const x of xs) if (x >= 3 && x + 5 <= w - 2 && !busy.some(([a, z]) => x - 2 < z && x + 5 > a)) return wallLamp(r, x, up);
}
/** A brick chimney's pot on top (terracotta), 2 wide. */
function pot(r, dx, up) { r('#b0643a', dx, up, 2, 3); r(shade('#b0643a', 1.2), dx, up, 1, 3); r(shade('#b0643a', 0.7), dx - 1, up + 2, 4, 1); }
/** A stone chimney (rough courses, a slab cap). */
function stoneChimney(r, dx, up, w, h, c) {
  r(c, dx, up, w, h);
  for (let y = up + 2, k = 0; y < up + h - 1; y += 3, k++) { r(shade(c, 0.84), dx, y, w, 1); r(shade(c, 0.84), dx + (k % 2 ? 2 : 4), y + 1, 1, 2); }
  r(shade(c, 1.15), dx, up, 1, h); r(shade(c, 0.75), dx + w - 1, up, 1, h);
  r(shade(c, 0.6), dx - 1, up + h, w + 2, 1); r(shade(c, 0.85), dx - 1, up + h + 1, w + 2, 1);
}

export const PART = {
  // --- the Tudor cottage: a timber frame (posts, rails, braces) filled with
  // plaster, the upper floor jettied out over the ground floor, leaded windows,
  // a steep gable with its king post and collar, a tall brick chimney.
  tudorCottage: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), wall = v.pick(['#ece0c4', '#f2ead8', '#e0d0b0']), beam = v.pick(['#3a2a22', '#2a2a2e']), top = floorAt(2);
      const ow = old(w), g = extra(b, 1), lit = shade(beam, 1.45), stone = '#9a9080';
      const P = [2, 13, w - 15, w - 4];                                   // the ground floor's posts (2 wide)
      // the ground floor, set back 2 px under the jetty
      r(wall, 2, 0, w - 4, GF); r(shade(wall, 0.7), 4, GF - 1, w - 8, 1);   // the jetty's shadow
      r(stone, 2, 0, w - 4, 3); r(shade(stone, 1.12), 2, 2, w - 4, 1);    // a stone plinth
      for (let x = 5; x < w - 4; x += 6) r(shade(stone, 0.8), x, 0, 1, 2);
      r(beam, 2, 3, w - 4, 2); r(lit, 2, 4, w - 4, 1);                    // the sill beam
      for (const x of P) { r(beam, x, 5, 2, GF - 5); r(lit, x, 5, 1, GF - 5); }
      for (const x of [4, w - 13]) { r(beam, x, 5, 9, 1); r(beam, x, 15, 9, 1); }   // rails under and over the windows
      const odx = v.pick([Math.round(ow / 2) - 3, 11]), dx = odx === 11 ? 17 : Math.round(w / 2) - 4;
      const doorC = v.pick(['#6b4a2a', '#5a3a2a', '#3f5a3a']);
      r(beam, dx - 2, 3, 2, 18); r(beam, dx + 9, 3, 2, 18); r(lit, dx - 2, 3, 1, 18);   // the door's frame and lintel
      r(beam, dx - 2, 19, 13, 2); r(lit, dx - 2, 20, 13, 1);
      r(shade(CONCRETE, 1.05), dx - 3, 0, 15, 1);                         // the step
      DOORS.plank(r, dx, 1, doorC);
      WINDOWS.leaded(r, rng, 5, SILL); WINDOWS.leaded(r, rng, w - 12, SILL);
      if (g() < 0.6) wallLamp(r, dx < w / 2 ? dx + 12 : dx - 6, 11);       // a lamp by the door
      // the upper floor, jettied out over the ground floor
      r(wall, 0, GF, w, top - GF);
      r(beam, 0, GF, w, 2); r(lit, 0, GF + 1, w, 1);                       // the bressumer
      r(shade(beam, 0.7), 0, GF, w, 1);
      for (const x of [1, w - 2]) r(beam, x, GF - 2, 1, 2);               // brackets under the jetty
      r(beam, 0, top - 2, w, 2); r(lit, 0, top - 1, w, 1);                // the wall plate
      const Q = [0, 13, w - 15, w - 2];
      for (const x of Q) { r(beam, x, GF + 2, 2, top - GF - 4); r(lit, x, GF + 2, 1, top - GF - 4); }
      for (let k = 0; k < 8; k++) { r(beam, 2 + k, GF + 2 + k * 2, 2, 2); r(beam, w - 4 - k, GF + 2 + k * 2, 2, 2); }   // the braces
      const n = v.int(1, oldHow('leaded', 9, ow - 9));
      for (const x of evenRow(15, w - 15, n, 7)) {
        r(beam, x - 1, GF + SILL - 1, 9, 1);                               // the window's sill rail
        WINDOWS.leaded(r, rng, x, GF + SILL);
        r(beam, x - 1, GF + SILL + 9, 9, 1);
      }
      // the gable: the roof running back behind it, the face timbered
      const roofC = v.pick(['#4a3a32', '#5a5a4a', '#6a5a3a']);
      gable(r, roofC, wall, -3, top, w + 6, 21, 39);
      const half = Math.floor((w + 6) / 2);
      for (let k = 0; k < 39; k++) {                                       // the roof running back, its tile joints staggered
        if (k % 3 === 2) continue;
        const inset = k < 21 ? 1 + Math.round(k * (half - 1) / 21) : half + 1;   // clear of the gable's face
        for (let x = 1 + (Math.floor(k / 3) % 2) * 2; x < w + 5; x += 4) {
          if ((x >= inset - 2 && x <= w + 6 - inset + 1) || (x >= half - 2 && x <= half + 1)) continue;
          r(x < half ? shade(roofC, 0.68) : shade(roofC, 0.88), x - 3, top + k, 1, 1);
        }
      }
      const mid = Math.round(w / 2);
      r(beam, mid - 1, top, 2, 16); r(lit, mid - 1, top, 1, 16);         // the king post
      r(beam, mid - 12, top + 7, 24, 2); r(lit, mid - 12, top + 8, 24, 1);   // the collar
      const cx = v.pick([4, ow - 8]) === 4 ? 6 : w - 12;
      chimney(r, cx, top + 21, 6, 16, '#9a4a3a');
      pot(r, cx + 2, top + 37);
    },
  },

  // --- the Mediterranean villa: stucco, tall windows between louvred shutters,
  // little iron balconies upstairs, blind arches over the ground windows, an
  // arched door in a stone surround, a hipped roof of round (barrel) tiles.
  mediterraneanVilla: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), floors = v.chance(0.75) ? 2 : 1, top = floorAt(floors), wall = v.pick(['#f0e8d8', '#f2e0c0', '#e8d8d0']);
      const shut = v.pick(['#3f5f9a', '#3f7a5a', '#7a3a32', '#2f6a8a']), ow = old(w), g = extra(b, 2);
      r(wall, 0, 0, w, top); edges(r, wall, 0, w, 0, top);
      plinth(r, wall, 0, w, shade(wall, 0.8));
      const dx = Math.round(w / 2) - 4, iron = dark(r, '#1e1e22');
      const win = (x, up) => { WINDOWS.shuttered(r, rng, x + 2, up, shut, NAVY); r(shade(wall, 0.78), x + 1, up + 12, 9, 1); };
      for (let f = 1; f < floors; f++) {
        const up = floorAt(f) + SILL - 2;
        band(r, wall, 0, w, floorAt(f));
        for (const x of evenRow(3, w - 3, oldHow('shuttered', 2, ow - 2, 2), 11)) {
          win(x, up);
          r(shade(wall, 0.7), x, up - 1, 11, 1);                          // a little balcony: its slab, an iron rail
          iron(INK, x, up + 4, 11, 1); for (let i = x; i < x + 11; i += 2) iron(INK, i, up, 1, 4);
          iron(INK, x + 10, up, 1, 4);
        }
      }
      const arch = (x) => {                                                // a blind arch over a ground window
        const c = shade(wall, 0.9), e = shade(wall, 0.78);
        r(e, x, 16, 11, 1); r(c, x + 1, 17, 9, 1); r(e, x, 17, 1, 1); r(e, x + 10, 17, 1, 1);
        r(c, x + 2, 18, 7, 1); r(e, x + 1, 18, 1, 1); r(e, x + 9, 18, 1, 1); r(e, x + 2, 19, 7, 1);
      };
      const gx = [evenRow(3, dx - 3, 1, 11)[0], evenRow(dx + 12, w - 3, 1, 11)[0]];
      for (const x of gx) { win(x, SILL - 2); arch(x); }
      // the door: a stone surround with an arched head and a keystone
      const st = shade(wall, 1.06), se = shade(wall, 0.8);
      r(se, dx - 3, 0, 15, 17); r(st, dx - 2, 0, 13, 17);
      for (const [y, o, sw] of [[17, -1, 11], [18, 0, 9], [19, 1, 7]]) { r(se, dx + o - 1, y, sw + 2, 1); r(st, dx + o, y, sw, 1); }
      r(se, dx + 2, 20, 5, 1);
      r(se, dx + 2, 19, 5, 4); r(st, dx + 3, 19, 3, 3);                   // the keystone
      r(shade(CONCRETE, 1.05), dx - 3, 0, 15, 1);                         // the step
      DOORS.arched(r, dx, 1, '#6a4a3a');
      if (g() < 0.6) lampBy(r, gx.map((x) => [x, x + 11]), g() < 0.5 ? [dx - 7, dx + 13] : [dx + 13, dx - 7], 12, w);
      if (v.chance(0.6)) for (const x of gx) {                            // window boxes of geraniums
        r('#a8664a', x + 1, 1, 9, 3); r(shade('#a8664a', 1.15), x + 1, 3, 9, 1); r(shade('#a8664a', 0.75), x + 1, 1, 9, 1);
        r('#5f8f5a', x + 1, 4, 9, 2); r(shade('#5f8f5a', 1.25), x + 2, 5, 2, 1);
        for (let i = x + 2; i < x + 10; i += 3) r('#e05a6a', i, 5, 2, 2);
      }
      // the eaves: a cornice, then the barrel-tiled hipped roof
      r(shade(wall, 1.06), 0, top - 3, w, 1); r(shade(wall, 0.88), 0, top - 2, w, 1); r(shade(wall, 0.7), 0, top - 1, w, 1);
      const roofC = v.pick(['#c0603a', '#d0783a', '#a85030']), d = Math.round(v.int(13, 16) * 1.5);
      pitched(r, roofC, -3, top, w + 6, d, 3);
      const f = Math.round(d * 0.7);
      for (let k = 1; k < f; k++) {                                       // rows of barrel tiles: a lit crest, a shaded channel
        const x0 = -3 + k, x1 = w + 3 - k, course = k % 4 === 0;
        r(course ? shade(roofC, 0.9) : roofC, x0, top + k, x1 - x0, 1);
        for (let x = 0; x < x1; x += 3) { if (x >= x0) r(shade(roofC, course ? 0.68 : 0.76), x, top + k, 1, 1); if (x + 1 >= x0 && x + 1 < x1) r(shade(roofC, course ? 1.0 : 1.14), x + 1, top + k, 1, 1); }
        for (let x = -3; x < 0; x += 3) { if (x >= x0) r(shade(roofC, 0.76), x, top + k, 1, 1); }
      }
      for (let x = -3; x < w + 3; x += 3) { r(shade(roofC, 0.45), x, top, 1, 1); r(shade(roofC, 0.95), x + 1, top, 2, 1); }   // the tiles' round ends at the eaves
    },
  },

  // --- the Dutch canal house: tall and narrow, brick, big white sash windows,
  // a door with a fanlight, and a stepped, bell or plain gable with a round
  // window and the hoisting beam at its top.
  dutchCanalHouse: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), floors = v.int(3, 5), top = floorAt(floors), trim = '#f2efe8';
      const wall = v.pick(['#6a5a8a', '#8a3a32', '#3f5a4a', '#2c3a5a', '#b8863a']), gableKind = v.pick(['stepped', 'stepped', 'bell', 'triangle']);
      const ow = old(w), n = ow >= 24 ? 2 : 1;
      const bricks = (x0, y0, ww, h) => {                                 // faint brick courses, the joints staggered
        const j = shade(wall, 0.93);
        for (let y = y0 + 2, k = 0; y < y0 + h; y += 3, k++) {
          r(j, x0, y, ww, 1);
          for (let x = x0 + 2 + (k % 2) * 3; x < x0 + ww - 1; x += 6) if (y + 1 < y0 + h) r(j, x, y + 1, 1, Math.min(2, y0 + h - y - 1));
        }
      };
      r(wall, 0, 0, w, top); bricks(0, 0, w, top); edges(r, wall, 0, w, 0, top);
      plinth(r, wall, 0, w, '#5a5650');
      const sash = (x, up) => {                                            // a big sash window, 9 x 13, four panes
        const c = pane(rng);
        r(shade(wall, 0.65), x - 1, up + 13, 11, 1); r(trim, x - 1, up + 14, 11, 2); r(shade(trim, 0.8), x - 1, up + 14, 11, 1);   // the lintel
        r(trim, x, up, 9, 13); r(c, x + 1, up + 1, 7, 11); r(trim, x + 1, up + 6, 7, 1); r(trim, x + 4, up + 1, 1, 11);
        if (c === WIN) { r(shade(WIN, 1.25), x + 1, up + 9, 1, 2); r(shade(WIN, 1.25), x + 5, up + 9, 1, 2); }
        r(shade(trim, 0.7), x - 1, up - 1, 11, 1);                         // the sill
      };
      const cols = evenRow(1, w - 1, n, 9);                               // the window columns, every floor
      for (let f = 1; f < floors; f++) {
        r(shade(wall, 0.8), 0, floorAt(f), w, 1);
        for (const x of cols) sash(x, floorAt(f) + 3);
      }
      // the ground floor lines up with the floors above (the owner): with two columns the door
      // and the window stand under them; a narrow house (one column) has its door under it
      const doorRight = v.chance(0.5);
      let dx;
      if (n === 2) { dx = doorRight ? cols[1] : cols[0]; sash(doorRight ? cols[0] : cols[1], 4); }
      else { dx = cols[0]; pane(rng); }                                     // (the window it no longer has still takes its rng call)
      const doorC = v.pick(['#2a4a3a', '#3a2a4a', '#5a2a2a']);
      r(trim, dx - 1, 0, 11, 23); r(shade(trim, 0.75), dx + 9, 0, 1, 22);  // the door's case, a fanlight over it
      r(GLASS, dx, 19, 9, 3); r(trim, dx + 3, 19, 1, 3); r(trim, dx + 5, 19, 1, 3);
      DOORS.wood(r, dx, 0, doorC);
      // the gable, the roof behind it
      const half = Math.round(w / 2), rc = '#5a5450';
      r(shade(rc, 0.8), 3, top, half - 3, 16); r(rc, half, top, w - 3 - half, 16);
      for (let y = top + 2; y < top + 16; y += 3) r(shade(rc, 0.7), 3, y, w - 6, 1);
      const edge = (k, inset, next) => {                                   // the gable's face, its white edge (the coping)
        const iw = w - inset * 2;
        if (iw > 0) r(wall, inset, top + k, iw, 1);
        const a = Math.min(inset, next), z = Math.max(inset, next);
        r(trim, a, top + k, z - a + 1, 1); r(trim, w - z - 1, top + k, z - a + 1, 1);
      };
      let peak = 16;
      if (gableKind === 'stepped') {
        const s = Math.floor(w / 7);
        for (let i = 0; i < 4; i++) {
          const inset = i * s, gw = w - inset * 2;
          r(wall, inset, top + i * 4, gw, 4); bricks(inset, top + i * 4, gw, 4);
          r(trim, inset - 1, top + i * 4 + 3, gw + 2, 1); r(shade(trim, 0.75), inset, top + i * 4 + 2, gw, 1);   // each step's coping
        }
      } else if (gableKind === 'bell') {
        const nw = Math.round(w / 3), I = Math.floor((w - nw) / 2);
        const at = (k) => (k < 3 ? 0 : k < 11 ? Math.round(I * (1 - (1 - (k - 3) / 8) ** 2)) : k < 16 ? I : I + 1);
        for (let k = 0; k < 17; k++) edge(k, at(k), at(Math.min(16, k + 1)));
        r(trim, I, top + 16, w - I * 2, 1); r(trim, half - 1, top + 17, 2, 1);   // its crown
      } else {
        const at = (k) => Math.round(k * (half - 1) / 15);
        for (let k = 0; k < 16; k++) edge(k, at(k), at(Math.min(15, k + 1)));
        peak = 15;
      }
      if (gableKind !== 'stepped') r(trim, 0, top, w, 1);
      const ox = half - 3, oy = top + 4;                                   // the round window
      r(trim, ox + 2, oy, 3, 7); r(trim, ox + 1, oy + 1, 5, 5); r(trim, ox, oy + 2, 7, 3);
      r(GLASS, ox + 2, oy + 1, 3, 5); r(GLASS, ox + 1, oy + 2, 5, 3); r(trim, ox + 3, oy + 1, 1, 5); r(trim, ox + 1, oy + 3, 5, 1);
      r(DARKWOOD, half - 1, top + peak - 3, 2, 2); r(shade(DARKWOOD, 1.3), half - 1, top + peak - 2, 1, 1);   // the hoisting beam, its hook
      r(INK, half, top + peak - 4, 1, 1); if (peak > 15) r(INK, half - 1, top + peak - 5, 2, 1);
    },
  },

  // --- the French country house: stone with quoins at the corners, tall
  // casements between louvred shutters, a door in a stone surround, a steep
  // hipped slate roof with dormers, stone chimneys.
  frenchCountryHouse: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), wall = v.pick(['#c8b08c', '#d8c8a8', '#b89870']), shut = v.pick(['#3c4a5a', '#5a7a8a', '#7a8a5a', '#8a5a4a']), top = floorAt(2);
      const ow = old(w), g = extra(b, 4), frame = '#ece6da', stone = shade(wall, 1.1);
      r(wall, 0, 0, w, top);
      for (let y = 4, k = 0; y < top - 2; y += 4, k++) {                   // quoins: long and short stones up the corners
        const qw = k % 2 ? 3 : 5;
        r(stone, 0, y, qw, 3); r(stone, w - qw, y, qw, 3); r(shade(wall, 0.82), 0, y - 1, qw, 1); r(shade(wall, 0.82), w - qw, y - 1, qw, 1);
      }
      edges(r, wall, 0, w, 0, top); plinth(r, wall, 0, w);
      const casement = (x, up) => {                                        // 13 wide: shutters, a casement of six panes, a stone lintel
        const c = pane(rng);
        r(shade(wall, 0.72), x + 2, up - 1, 9, 1);                         // the sill
        r(frame, x + 3, up, 7, 12); r(c, x + 4, up + 1, 5, 10);
        r(frame, x + 6, up + 1, 1, 10); r(frame, x + 4, up + 4, 5, 1); r(frame, x + 4, up + 8, 5, 1);
        if (c === WIN) { r(shade(WIN, 1.25), x + 4, up + 9, 1, 2); r(shade(WIN, 1.25), x + 7, up + 5, 1, 2); }
        louvres(r, shut, x + 3, up, 7, 12);
        r(stone, x + 2, up + 12, 9, 2); r(shade(wall, 0.8), x + 2, up + 12, 9, 1);
      };
      for (const x of evenRow(3, w - 3, oldHow('shuttered', 2, ow - 2, 3), 13)) casement(x, floorAt(1) + SILL - 2);
      const doorAt = v.pick(['left', 'right', 'middle']);
      const odx = doorAt === 'left' ? 4 : doorAt === 'right' ? ow - 10 : Math.round(ow / 2) - 3;
      const dx = doorAt === 'left' ? 6 : doorAt === 'right' ? w - 15 : Math.round(w / 2) - 4;
      r(shade(wall, 0.8), dx - 3, 0, 15, 22); r(stone, dx - 2, 0, 13, 21);   // the door's stone surround and lintel
      r(shade(wall, 0.85), dx - 2, 19, 13, 1); r(shade(stone, 1.05), dx + 3, 19, 3, 3);
      r(shade(CONCRETE, 1.05), dx - 3, 0, 15, 1);
      DOORS.wood(r, dx, 1, v.pick(DOOR_COLOURS));
      const busy = [];
      if (doorAt !== 'left' && oldFits('shuttered', 2, odx - 2)) for (const x of evenRow(3, dx - 3, oldHow('shuttered', 2, odx - 2, 3), 13)) { casement(x, SILL - 2); busy.push([x, x + 13]); }
      if (doorAt !== 'right' && oldFits('shuttered', odx + 8, ow - 2)) for (const x of evenRow(dx + 12, w - 3, oldHow('shuttered', odx + 8, ow - 2, 3), 13)) { casement(x, SILL - 2); busy.push([x, x + 13]); }
      if (g() < 0.5) lampBy(r, busy, [dx + 13, dx - 7], 13, w);
      // the roof: a cornice, slates, dormers, chimneys
      r(shade(wall, 1.08), 0, top - 2, w, 1); r(shade(wall, 0.72), 0, top - 1, w, 1);
      const roofC = v.pick(['#3a3f44', '#4a5560', '#5a4a48']), d = Math.round(v.int(16, 19) * 1.5);
      pitched(r, roofC, -3, top, w + 6, d, 3);
      const dormers = v.int(1, 3);
      for (let i = 0; i < dormers; i++) {
        const x = Math.round(((i + 1) / (dormers + 1)) * w) - 5;
        r(shade(roofC, 0.6), x - 1, top + 2, 13, 1);                       // its shadow on the slates
        r(wall, x, top + 3, 11, 10); r(shade(wall, 1.08), x, top + 3, 1, 10); r(shade(wall, 0.85), x + 10, top + 3, 1, 10);
        WINDOWS.sash(r, rng, x + 2, top + 3, 7, frame);
        pitched(r, roofC, x - 2, top + 13, 15, 6, 3);
      }
      for (const cx of v.chance(0.5) ? [6, ow - 10] : [v.pick([6, ow - 10])]) stoneChimney(r, cx === 6 ? 9 : w - 15, top + 18, 6, 11, '#9a7c60');
    },
  },

  // --- the Scandinavian house: painted vertical boards, white corner boards and
  // eaves, cross-barred windows under little crowns, a hood over the door.
  scandinavianHouse: {
    approved: true,
    draw(r, rng, b, wall0, roof, w) {
      const v = V(rng), floors = v.chance(0.7) ? 2 : 1, top = floorAt(floors), wall = v.pick(['#a83a32', '#d8a840', '#3f6a8a', '#e8e4dc', '#5a7a4a']);
      const trim = wall === '#e8e4dc' ? '#4a5560' : WHITE, ow = old(w), g = extra(b, 5), stone = '#8a8a84';
      r(wall, 0, 0, w, top);
      for (let x = 4; x < w - 2; x += 3) r(shade(wall, 0.82), x, 3, 1, top - 3);   // the boards
      r(stone, 0, 0, w, 3); r(shade(stone, 1.15), 0, 2, w, 1); for (let x = 4; x < w; x += 7) r(shade(stone, 0.8), x, 0, 1, 2);
      r(trim, 0, 3, 2, top - 3); r(trim, w - 2, 3, 2, top - 3); r(shade(trim, 0.85), w - 1, 3, 1, top - 3);   // the corner boards
      if (floors === 2) { r(shade(wall, 0.65), 2, GF - 1, w - 4, 1); r(shade(wall, 1.1), 2, GF, w - 4, 1); }   // the upper boards' skirt
      const odx = v.pick([Math.round(ow / 2) - 4, 4, ow - 12]);
      const dx = odx === 4 ? 6 : odx === ow - 12 ? w - 17 : Math.floor((w - 9) / 2);
      r(trim, dx - 2, 0, 13, 21); r(shade(trim, 0.8), dx + 10, 0, 1, 20);  // the door's case
      r(shade(CONCRETE, 1.05), dx - 3, 0, 15, 1);
      DOORS.wood(r, dx, 1, v.pick(['#2f4a5a', '#3a2a22', '#6a2a2a']));
      const win = (x, up) => {                                             // 9 wide with its crown: a window with a cross of bars
        WINDOWS.sash(r, rng, x + 1, up, 7, trim); r(trim, x + 4, up + 1, 1, 7);
        r(shade(trim, 0.8), x, up + 9, 9, 1); r(trim, x, up + 10, 9, 1); r(trim, x + 3, up + 11, 3, 1);
      };
      const busy = [];
      if (oldFits('sash', 2, odx - 2)) for (const x of evenRow(3, dx - 4, oldHow('sash', 2, odx - 2, 4), 9)) { win(x, SILL); busy.push([x, x + 9]); }
      if (oldFits('sash', odx + 8, ow - 2)) for (const x of evenRow(dx + 13, w - 3, oldHow('sash', odx + 8, ow - 2, 4), 9)) { win(x, SILL); busy.push([x, x + 9]); }
      if (floors === 2) { const n = v.int(2, oldHow('sash', 2, ow - 2, 4)); for (const x of evenRow(3, w - 3, n, 9)) win(x, GF + SILL); }
      const roofC = v.pick(['#3a3f44', '#4a3a32', '#2f4a3a']), d = Math.round(v.int(14, 17) * 1.5);
      r(shade(roofC, 1.0), dx - 3, 21, 15, 1); r(shade(roofC, 0.6), dx - 3, 21, 15, 1); r(roofC, dx - 3, 22, 15, 1); r(shade(roofC, 1.25), dx - 2, 23, 13, 1);   // the hood over the door
      r(trim, dx - 2, 20, 1, 1); r(trim, dx + 10, 20, 1, 1);
      if (g() < 0.6) lampBy(r, busy, [dx + 13, dx - 7], 12, w);
      r(trim, -1, top - 2, w + 2, 2); r(shade(trim, 0.75), -1, top - 2, w + 2, 1);   // the white eaves board
      pitched(r, roofC, -3, top, w + 6, d);
      const cx = v.pick([5, ow - 9]) === 5 ? 8 : w - 14, cc = shade(wall, 0.7);
      r(cc, cx, top + 13, 6, 10); r(shade(cc, 1.15), cx, top + 13, 1, 10); r(shade(cc, 0.8), cx + 5, top + 13, 1, 10);
      r(INK, cx - 1, top + 23, 8, 2); r(shade(INK, 1.5), cx - 1, top + 24, 8, 1);
    },
  },
};
