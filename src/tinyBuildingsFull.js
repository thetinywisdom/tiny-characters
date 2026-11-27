// Tiny Buildings at full size: the buildings drawn again at the size the town
// shows them, so one building pixel is one person pixel (the owner chose E:
// no more drawing at 1 and stretching by 1.5, which made uneven lines). The
// pieces here (storeys, doors, windows, roofs, signs) are the old kit's at 1.5
// times the size, with the detail the extra pixels allow.
//
//   FULL                  type -> { draw(r, rng, b, wall, roof, w), approved, open }
//                         (tinyBuildings.js draws these instead of the old ones; the
//                         buildings themselves are in src/full/a.js .. d.js, spread in below)
//   FULL_STOREY           { ground: 24, shop: 28, upper: 20, sill: 6 }
//
// Everything is drawn with tinyBuildings' painter r(colour, dx, up, w, h) at
// scale 1 (a rectangle dx from the left edge, its bottom `up` above the
// ground), r.text for sign names, r.px for icons. A draw returns the shop kind
// it drew (for shutters and steam), or nothing.
// The colours are the same values as in tinyBuildings.js: the night's lights
// recognise them by value (lit windows, shop glass, lanterns, neon).
// Plain ES module, no dependencies but tinyCharacters' shade.

import { shade, seeded } from './tinyCharacters.js';
import { PART as PA } from './full/a.js';
import { PART as PB } from './full/b.js';
import { PART as PC } from './full/c.js';
import { PART as PD } from './full/d.js';

// --- colours (the same as tinyBuildings.js) --------------------------------------
export const INK = '#2f3236', WHITE = '#f2f2ee', RED = '#d8443c', NAVY = '#2c3652', GOLD = '#f2b64a';
export const WIN = '#5f7487', LIT = '#f0dca0', CURTAIN = '#e4d6bc', GLASS = '#9fb6cc', GLASS2 = '#7f9ab4';
export const WOOD = '#6b4a2a', DARKWOOD = '#4a3424', LIGHTWOOD = '#c9a46a', TOP = '#d9d2c0', CONCRETE = '#b3b0a8';
export const FRAME = '#4a4e54', METAL = '#b8bcc0', PAPER = '#f4efe0', HI = '#c8dceb', LANTERN = '#d8402f';

// --- one set of sizes (the old ones times 1.5, on whole pixels) ---------------------
// A ground floor is 24 (a shop's 28: its awning and sign above the door), an
// upper floor 20, a window's sill 6 above its floor. A door is 9 x 18 (double
// and sliding doors 16 x 18); a window 7 x 9 (a pair 13 x 9, a tall one 7 x 12).
export const FULL_STOREY = { ground: 24, shop: 28, upper: 20, sill: 6 };
const GF = 24, SHOP_GF = 28, FL = 20, SILL = 6;
/** The bottom of floor n (0 is the ground floor) above a ground floor gf tall. */
export const floorAt = (n, gf = GF) => (n === 0 ? 0 : gf + (n - 1) * FL);

/** Choices made with the building's rng. */
export const V = (rng) => ({
  pick: (a) => a[Math.floor(rng() * a.length)],
  chance: (p) => rng() < p,
  int: (a, b) => a + Math.floor(rng() * (b - a + 1)),
});
/** What shows in a window: dark glass, a lit room, or curtains. */
export const pane = (rng) => { const v = rng(); return v < 0.18 ? LIT : v < 0.34 ? CURTAIN : WIN; };

// --- small pieces ----------------------------------------------------------------
/** A sign: a board with a darker edge and the name (DotGothic16 through r.text), or letter marks. */
export function sign(r, bg, fg, dx, up, w, h = 6, text = '', edge = true) {
  const f = r.force ?? r;                                                // signs are lit at night too
  if (edge) { f(shade(bg, 0.7), dx, up, w, h); f(bg, dx + 1, up + 1, w - 2, h - 2); } else f(bg, dx, up, w, h);
  // the name may run over the edge rows (the letters' own space keeps them clear), so it is as big as on the old signs
  if (text && r.text && r.text(text, fg, dx + 1, up, w - 2, h)) return;
  const n = Math.max(2, Math.floor((w * 0.55) / 4)), start = dx + Math.floor((w - (n * 4 - 2)) / 2);
  for (let i = 0; i < n; i++) f(fg, start + i * 4, up + 2, 2, h - 4);
}
/** A sign read top to bottom (a narrow upright sign). */
export function upright(r, bg, fg, dx, up, w, h, text) {
  const f = r.force ?? r;
  f(shade(bg, 0.7), dx, up, w, h); f(bg, dx + 1, up + 1, w - 2, h - 2);
  if (text && r.text && r.text(text, fg, dx + 1, up + 1, w - 2, h - 2, true)) return;
  for (let i = up + 3; i < up + h - 3; i += 5) f(fg, dx + Math.floor((w - 3) / 2), i, 3, 3);
}
/** A striped awning, h rows, stripes 3 px wide, a scalloped hem (every other stripe a row longer). */
export function awning(r, c1, c2, dx, up, w, h = 5) {
  for (let i = 0; i < w; i += 3) {
    const c = (i / 3) % 2 ? c2 : c1, sw = Math.min(3, w - i);
    r(c, dx + i, up, sw, h); r(shade(c, 0.85), dx + i, up + h - 1, sw, 1);   // the top row in shade (it folds over)
    if (!((i / 3) % 2)) r(shade(c, 0.9), dx + i, up - 1, sw, 1);           // the hem
  }
}
/** A noren: a short curtain over a doorway, cut into strips, on a rod. */
export function noren(r, c, dx, up, w, h = 8, mark = WHITE) {
  r(DARKWOOD, dx - 1, up + h, w + 2, 1);
  r(c, dx, up, w, h); r(shade(c, 1.2), dx, up + h - 1, w, 1);
  const n = Math.max(2, Math.round(w / 7)), sw = w / n;
  for (let i = 1; i < n; i++) r(shade(c, 0.6), dx + Math.round(i * sw), up, 1, h - 2);
  if (mark) {                                                            // a small round crest on the middle strip
    const cx = dx + Math.round(w / 2) - 2, cy = up + Math.round(h / 2) - 2;
    r(mark, cx + 1, cy, 2, 4); r(mark, cx, cy + 1, 4, 2); r(c, cx + 1, cy + 1, 2, 2);
  }
}
/** A red paper lantern (chochin), 3 wide, hung from up + 7. */
export function lantern(r, dx, up, c = LANTERN) {
  r(INK, dx + 1, up + 7, 1, 1); r(INK, dx, up + 6, 3, 1);
  r(c, dx, up + 1, 3, 5); r(shade(c, 1.3), dx, up + 3, 1, 2); r(shade(c, 0.75), dx + 2, up + 1, 1, 5);
  r(INK, dx, up, 3, 1);
}
/** A row of coloured dots (books, flowers, goods), each `size` wide. */
export function dots(r, rng, dx, up, w, colors, step = 2, size = 1) { for (let i = 0; i + size <= w; i += step) r(colors[Math.floor(rng() * colors.length)], dx + i, up, size, size); }
/** Shelves of goods behind shop glass: a shelf line, then products in 2 x 2 blocks with gaps. */
export function shelves(r, rng, dx, up, w, rows, colours) {
  for (let j = 0; j < rows; j++) {
    const y = up + j * 4;
    r('#c8ccd0', dx, y, w, 1);
    for (let i = 0; i + 2 <= w; i += 3) r(colours[Math.floor(rng() * colours.length)], dx + i, y + 1, 2, 2);
  }
}
/**
 * A small picture (a cross, a letter, a clock) as rows of characters, top row
 * first, each a colour from `colours` ('.' is clear), one pixel each.
 */
export function icon(r, dx, up, rows, colours) {
  const h = rows.length;
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (colours[ch]) r(colours[ch], dx + i, up + h - 1 - j, 1, 1); }));
}
export const CROSS = ['.ggggg.', 'gggwggg', 'gggwggg', 'gwwwwwg', 'gggwggg', 'gggwggg', '.ggggg.'];
/** A dome seen from the front and a little above: a half disc lit on the left. */
export function dome(r, c, cx, up, rad) {
  for (let k = 0; k <= rad; k++) {
    const hw = Math.round(Math.sqrt(rad * rad - k * k));
    r(c, cx - hw, up + k, hw * 2 + 1, 1);
    if (hw > 1) { r(shade(c, 1.18), cx - hw + 1, up + k, Math.max(1, Math.round(hw * 0.6)), 1); r(shade(c, 0.8), cx + hw - 1, up + k, 2, 1); }
  }
  r(shade(c, 0.7), cx - rad, up, rad * 2 + 1, 1);
}
/** A pointed arch: w wide, h tall, the top stepping in to a point. */
export function pointedArch(r, c, dx, up, w, h) {
  const steps = Math.floor((w - 1) / 2);
  r(c, dx, up, w, h - steps);
  for (let k = 1; k <= steps; k++) r(c, dx + k, up + h - steps + k - 1, w - k * 2, 1);
}

// --- roofs (seen from above: d rows over the front wall give the depth) -----------
/** A flat roof: a rim (parapet) round a roof top with seams, the front edge in shade. */
export function flatRoof(r, wall, dx, up, w, d = 18) {
  r(shade(wall, 0.86), dx, up, w, d);
  r(TOP, dx + 2, up + 2, w - 4, d - 4);
  for (let y = up + 6; y < up + d - 2; y += 5) r(shade(TOP, 0.94), dx + 2, y, w - 4, 1);
  r(shade(TOP, 0.88), dx + 2, up + d - 3, w - 4, 1);                     // the rim's shadow on the top
  r(shade(wall, 0.7), dx, up, w, 1);
  r(shade(wall, 1.08), dx, up + d - 1, w, 1);                            // the rim's lit top edge
}
/**
 * A pitched roof, ridge along the street, filling its rectangle: the front
 * slope in rows of tiles (a darker row every 3, tile joints staggered), the
 * ridge lit, a little of the back slope. hip: the ends slope too (darker
 * triangles at the sides, widening `hip`/3 px a row toward the ridge).
 */
export function pitched(r, c, dx, up, w, d, hip = 0) {
  const f = Math.round(d * 0.7), side = shade(c, 0.72);
  for (let k = 0; k < d; k++) {
    const front = k < f, ridge = k === f;
    const col = front ? (k % 3 === 2 ? shade(c, 0.84) : c) : ridge ? shade(c, 1.3) : shade(c, 0.8);
    const end = Math.min(Math.floor(w / 2), Math.floor((front ? k : f - (k - f)) * hip / 3));
    if (end > 0) { r(side, dx, up + k, w, 1); r(shade(side, 1.1), dx + end - 1, up + k, 1, 1); r(shade(side, 0.9), dx + w - end, up + k, 1, 1); r(col, dx + end, up + k, w - end * 2, 1); }
    else r(col, dx, up + k, w, 1);
    if (front && k % 3 !== 2 && k > 0) {                                  // tile joints, staggered row to row
      const off = Math.floor(k / 3) % 2 ? 2 : 0;
      for (let x = dx + end + 2 + off; x < dx + w - end - 1; x += 4) r(shade(c, 0.9), x, up + k, 1, 1);
    }
  }
  r(shade(c, 0.58), dx, up, w, 1);                                       // eaves
}
/**
 * A gable facing the street: a triangle of wall (`face`, gh rows) edged with
 * roof, and the roof running back behind it, d rows: the left slope in
 * shade, the right lit, the ridge between.
 */
export function gable(r, c, face, dx, up, w, gh, d) {
  const half = Math.floor(w / 2);
  for (let k = 0; k < d; k++) {                                          // the roof running back
    r(shade(c, 0.78), dx, up + k, half, 1); r(c, dx + half, up + k, w - half, 1);
    if (k % 3 === 2) { r(shade(c, 0.7), dx, up + k, half, 1); r(shade(c, 0.88), dx + half, up + k, w - half, 1); }
  }
  r(shade(c, 1.25), dx + half - 1, up, 2, d);                            // the ridge
  for (let k = 0; k < gh; k++) {                                         // the gable's face, edged with the roof
    const inset = 1 + Math.round(k * (half - 1) / gh), rw = w - inset * 2;
    r(shade(c, 0.6), dx + inset - 1, up + k, rw + 2, 1);
    if (face && rw > 2) r(face, dx + inset, up + k, rw, 1);
  }
}
/** A roof over a wall from dx, w wide, at `up`: flat, pitched or hipped (eaves 3 px over each side). */
export function aRoof(r, kind, wall, roofC, dx, up, w, d) {
  if (kind === 'flat') return flatRoof(r, wall, dx, up, w, Math.min(d, 21));
  pitched(r, roofC, dx - 3, up, w + 6, d, kind === 'hipped' ? 3 : 0);
}
/** Things on a flat roof: AC units, a water tank. */
export function rooftop(r, v, dx, up, w) {
  const n = v.int(0, Math.max(1, Math.floor(w / 21)));
  for (let i = 0; i < n; i++) {
    const x = dx + 4 + Math.floor(((i + 0.5) / n) * (w - 18));
    r('#918f8a', x, up + 4, 9, 6); r(shade('#918f8a', 0.78), x, up + 4, 9, 1); r(shade('#918f8a', 1.15), x, up + 9, 9, 1);
    r('#6a6864', x + 2, up + 6, 3, 2);                                   // the fan
  }
  if (v.chance(0.35) && w > 36) {
    const x = dx + w - 16;
    r(CONCRETE, x, up + 6, 10, 8); r(shade(CONCRETE, 0.78), x, up + 6, 10, 1); r(shade(CONCRETE, 1.12), x, up + 13, 10, 1); r(shade(CONCRETE, 0.9), x + 7, up + 7, 2, 6);
  }
}
/** A flat roof (18 deep) across the whole width, and things on it. */
export const flatTop = (r, v, wall, up, w) => { flatRoof(r, wall, 0, up, w, 18); rooftop(r, v, 0, up, w); };

// --- doors (18 tall; their bottom at `up`) ------------------------------------------
export const DOORS = {
  /** Panelled wood, two panels, a brass knob. 9 wide. */
  wood(r, dx, up = 0, c = WOOD) {
    r(shade(c, 0.6), dx, up, 9, 18); r(c, dx + 1, up, 7, 17);
    r(shade(c, 0.8), dx + 2, up + 2, 5, 6); r(shade(c, 0.8), dx + 2, up + 10, 5, 5);
    r(shade(c, 1.12), dx + 2, up + 7, 5, 1); r(shade(c, 1.12), dx + 2, up + 14, 5, 1);
    r(GOLD, dx + 6, up + 8, 1, 2);
  },
  /** Boards with iron straps (a cottage, a chapel). 9 wide. */
  plank(r, dx, up = 0, c = WOOD) {
    r(shade(c, 0.6), dx, up, 9, 18); r(c, dx + 1, up, 7, 17);
    for (let i = 2; i < 8; i += 2) r(shade(c, 0.78), dx + i, up, 1, 17);
    r(INK, dx + 1, up + 4, 6, 1); r(INK, dx + 1, up + 12, 6, 1); r(INK, dx + 6, up + 8, 1, 2);
  },
  /** Wood with glass in its top half (a café). 9 wide. */
  glazed(r, dx, up = 0, c = WOOD) {
    r(shade(c, 0.6), dx, up, 9, 18); r(c, dx + 1, up, 7, 17);
    r(GLASS, dx + 2, up + 9, 5, 6); r(c, dx + 4, up + 9, 1, 6); r(HI, dx + 2, up + 13, 1, 2);
    r(shade(c, 0.8), dx + 2, up + 2, 5, 5); r(GOLD, dx + 6, up + 7, 1, 2);
  },
  /** Glass in an aluminium frame, a push bar. 9 wide. */
  glass(r, dx, up = 0) {
    r(FRAME, dx, up, 9, 18); r(GLASS, dx + 1, up + 1, 7, 16);
    r(HI, dx + 2, up + 12, 1, 3); r(HI, dx + 3, up + 14, 1, 2); r(METAL, dx + 1, up + 8, 7, 1); r(shade(GLASS, 0.9), dx + 1, up + 1, 7, 2);
  },
  /** A flat's steel door: painted, a peephole, a lever. 9 wide. */
  steel(r, dx, up = 0, c = '#6a7f94') {
    r(shade(c, 0.7), dx, up, 9, 18); r(c, dx + 1, up, 7, 17); r(shade(c, 1.12), dx + 1, up + 16, 7, 1);
    r(shade(c, 0.88), dx + 1, up, 1, 16); r(INK, dx + 4, up + 13, 1, 1); r(METAL, dx + 5, up + 8, 2, 1); r(shade(METAL, 0.7), dx + 5, up + 7, 1, 1);
  },
  /** Planks under a round top (a villa, a chapel, a mosque). 9 wide. */
  arched(r, dx, up = 0, c = DARKWOOD) {
    r(c, dx, up, 9, 15); r(c, dx + 1, up + 15, 7, 1); r(c, dx + 2, up + 16, 5, 1); r(c, dx + 3, up + 17, 3, 1);
    for (const i of [2, 4, 6]) r(shade(c, 0.72), dx + i, up, 1, 15);
    r(shade(c, 1.2), dx + 1, up, 1, 14); r(GOLD, dx + 5, up + 7, 1, 2);
  },
  /** Automatic sliding glass doors, two leaves. 16 wide. */
  auto(r, dx, up = 0) {
    r(FRAME, dx, up, 16, 18); r(GLASS, dx + 1, up + 1, 6, 15); r(GLASS, dx + 9, up + 1, 6, 15);
    r(HI, dx + 2, up + 11, 1, 3); r(HI, dx + 3, up + 13, 1, 2); r(HI, dx + 10, up + 11, 1, 3); r(HI, dx + 11, up + 13, 1, 2);
    r(METAL, dx + 1, up + 16, 14, 1); r(shade(FRAME, 1.3), dx + 7, up + 1, 2, 15);
  },
  /** Japanese wooden lattice doors (koshi-do) that slide, two leaves, paper behind. 16 wide. */
  sliding(r, dx, up = 0, c = LIGHTWOOD) {
    r(DARKWOOD, dx, up, 16, 18); r(PAPER, dx + 1, up + 3, 14, 14);
    for (let i = dx + 2; i < dx + 15; i += 2) r(c, i, up + 3, 1, 14);
    r(WOOD, dx + 1, up, 14, 3); r(c, dx + 1, up + 10, 14, 1); r(DARKWOOD, dx + 7, up, 2, 17);
  },
  /** Shoji: paper on a wooden grid (a shrine). 16 wide. */
  shoji(r, dx, up = 0) {
    r(DARKWOOD, dx, up, 16, 18); r(PAPER, dx + 1, up, 14, 17);
    for (const i of [3, 5, 10, 12]) r(LIGHTWOOD, dx + i, up, 1, 17);
    for (const j of [4, 8, 12]) r(LIGHTWOOD, dx + 1, up + j, 14, 1);
    r(DARKWOOD, dx + 7, up, 2, 17); r(shade(PAPER, 0.9), dx + 1, up, 14, 2);
  },
  /** A roller shutter (a fire station). w wide, 21 tall. */
  garage(r, dx, up = 0, w = 27, c = RED) {
    r(shade(c, 0.6), dx, up, w, 21); r(c, dx + 1, up, w - 2, 20);
    for (let y = up + 1; y < up + 19; y += 3) r(shade(c, 0.82), dx + 1, y, w - 2, 1);
    r(shade(c, 1.15), dx + 1, up + 19, w - 2, 1); r(METAL, dx + Math.floor(w / 2) - 2, up + 1, 4, 1);
  },
};

// --- windows (their bottom, the sill, at `up`) -------------------------------------
export const WINDOWS = {
  /** A framed window, 7 x 9 (13 wide a pair); a sill under it. */
  sash(r, rng, dx, up, w = 7, frame = WHITE) {
    const c = pane(rng);
    r(frame, dx, up, w, 9); r(c, dx + 1, up + 1, w - 2, 7);
    if (w >= 11) r(frame, dx + Math.floor(w / 2), up + 1, 1, 7); else r(frame, dx + 1, up + 4, w - 2, 1);
    if (c === WIN) { r(shade(WIN, 1.25), dx + 1, up + 6, 1, 2); if (w >= 11) r(shade(WIN, 1.25), dx + Math.floor(w / 2) + 1, up + 6, 1, 2); }
    r(shade(frame, 0.75), dx - 1, up, w + 2, 1);
  },
  /** An aluminium window (Japanese flats and shops), 7 x 9; 13 wide it slides in two. */
  alu(r, rng, dx, up, w = 7) {
    const c = pane(rng);
    r(METAL, dx, up, w, 9); r(c, dx + 1, up + 1, w - 2, 7); r(shade(METAL, 0.8), dx, up + 8, w, 1);
    if (w >= 11) r(METAL, dx + Math.floor(w / 2), up + 1, 1, 7);
    if (c === WIN) { r(HI, dx + 1, up + 5, 1, 2); r(HI, dx + 2, up + 6, 1, 1); }
  },
  /** A tall window with a transom, 7 x 12. */
  tall(r, rng, dx, up, frame = WHITE) {
    const c = pane(rng);
    r(frame, dx, up, 7, 12); r(c, dx + 1, up + 1, 5, 10); r(frame, dx + 1, up + 8, 5, 1); r(frame, dx + 3, up + 1, 1, 7);
    if (c === WIN) r(shade(WIN, 1.25), dx + 1, up + 5, 1, 2);
    r(shade(frame, 0.75), dx - 1, up, 9, 1);
  },
  /** A tall window between louvred shutters (11 wide in all). */
  shuttered(r, rng, dx, up, shutter, frame = WHITE) {
    WINDOWS.tall(r, rng, dx, up, frame);
    for (const sx of [dx - 2, dx + 7]) { r(shutter, sx, up, 2, 12); for (let y = up + 1; y < up + 12; y += 2) r(shade(shutter, 0.72), sx, y, 2, 1); }
  },
  /** A tall window with a round top, 7 x 12. */
  arched(r, rng, dx, up, frame = NAVY) {
    r(frame, dx, up, 7, 10); r(frame, dx + 1, up + 10, 5, 1); r(frame, dx + 2, up + 11, 3, 1);
    const c = pane(rng); r(c, dx + 1, up + 1, 5, 9); r(c, dx + 2, up + 10, 3, 1); r(frame, dx + 3, up + 1, 1, 9);
  },
  /** A tall pointed window, 7 x 12 (a mosque). */
  pointed(r, dx, up, frame) {
    pointedArch(r, frame, dx, up, 7, 12); pointedArch(r, NAVY, dx + 1, up + 1, 5, 9); r(shade(NAVY, 1.4), dx + 2, up + 2, 1, 3);
  },
  /** Stained glass under a round top, 7 x 12 (a chapel). */
  stained(r, dx, up) {
    r(INK, dx, up, 7, 10); r(INK, dx + 1, up + 10, 5, 1); r(INK, dx + 2, up + 11, 3, 1);
    const cols = ['#3f6fa8', '#c8402c', '#f2c230', '#2fa36b'];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) r(cols[(i + j * 2) % 4], dx + 1 + i * 3, up + 1 + j * 3, 2, 2);
    r('#f2c230', dx + 3, up + 10, 1, 1);
  },
  /** A round window, 6 x 6 (a rose window). */
  round(r, dx, up) {
    r(INK, dx + 1, up, 4, 6); r(INK, dx, up + 1, 6, 4); r(GLASS, dx + 1, up + 1, 4, 4); r('#c8402c', dx + 2, up + 2, 2, 2); r('#f2c230', dx + 1, up + 4, 1, 1);
  },
  /** Wooden lattice over paper (a Japanese shop), any width. */
  lattice(r, dx, up, w, h = 9) {
    r(shade(DARKWOOD, 0.72), dx - 1, up - 1, w + 2, h + 2); r(CURTAIN, dx, up, w, h);   // paper lit from inside at night
    for (let i = dx + 1; i < dx + w; i += 2) r(WOOD, i, up, 1, h);
    r(LIGHTWOOD, dx - 1, up - 1, w + 2, 1);
  },
  /** Shoji: paper on a wooden grid, 7 x 9. */
  shoji(r, dx, up) { r(DARKWOOD, dx, up, 7, 9); r(PAPER, dx + 1, up + 1, 5, 7); r(LIGHTWOOD, dx + 3, up + 1, 1, 7); r(LIGHTWOOD, dx + 1, up + 4, 5, 1); },
  /** Small panes of old glass in lead (a Tudor cottage), 7 x 9. */
  leaded(r, rng, dx, up) {
    r('#3a2a22', dx, up, 7, 9); const c = pane(rng) === LIT ? LIT : '#7f9488';
    r(c, dx + 1, up + 1, 5, 7);
    for (const i of [2, 4]) r('#3a2a22', dx + i, up + 1, 1, 7);
    for (const j of [3, 5]) r('#3a2a22', dx + 1, up + j, 5, 1);
  },
  /** A glowing window (karaoke), 7 x 9. */
  neon(r, rng, dx, up) {
    const c = rng() < 0.5 ? '#e8603a' : '#f2a040';
    r(INK, dx, up, 7, 9); r(c, dx + 1, up + 1, 5, 7); r(shade(c, 1.2), dx + 1, up + 6, 5, 2);
  },
  /** A shop's glass front, w wide and as tall as a door (18): a frame, a bar about every 9 px, a kick rail. */
  shop(r, dx, up, w, h = 18, frame = FRAME, c = GLASS) {
    r(frame, dx, up, w, h); r(c, dx + 1, up + 2, w - 2, h - 3);
    const panes = Math.max(1, Math.round((w - 2) / 9));
    for (let i = 1; i < panes; i++) r(frame, dx + Math.round(i * (w - 1) / panes), up + 2, 1, h - 3);
    r(shade(c, 0.9), dx + 1, up + h - 3, w - 2, 2);                      // the top of the glass in shade
    for (let i = 0; i < panes; i++) { const x = dx + 1 + Math.round(i * (w - 1) / panes); r(shade(c, 1.15), x + 1, up + 9, 1, 3); r(shade(c, 1.15), x + 2, up + 11, 1, 2); }
  },
};
export const WW = { sash: 7, pair: 13, alu: 7, aluPair: 13, tall: 7, shuttered: 11, arched: 7, leaded: 7, shoji: 7, neon: 7 };
/** One window of a kind with its sill at `up` (tall kinds start a pixel lower). */
export function oneWindow(r, rng, kind, dx, up, o = {}) {
  switch (kind) {
    case 'sash': return WINDOWS.sash(r, rng, dx, up, 7, o.frame);
    case 'pair': return WINDOWS.sash(r, rng, dx, up, 13, o.frame);
    case 'alu': return WINDOWS.alu(r, rng, dx, up);
    case 'aluPair': return WINDOWS.alu(r, rng, dx, up, 13);
    case 'tall': return WINDOWS.tall(r, rng, dx, up - 2, o.frame);
    case 'shuttered': return WINDOWS.shuttered(r, rng, dx + 2, up - 2, o.shutter ?? '#3c4a5a', o.frame);
    case 'arched': return WINDOWS.arched(r, rng, dx, up - 2, o.frame);
    case 'leaded': return WINDOWS.leaded(r, rng, dx, up);
    case 'shoji': return WINDOWS.shoji(r, dx, up);
    case 'neon': return WINDOWS.neon(r, rng, dx, up);
  }
}
/** How many windows of a kind fit between x0 and x1, at least `gap` apart. */
export const howMany = (kind, x0, x1, gap = 4) => Math.max(1, Math.floor((x1 - x0 - gap) / (WW[kind] + gap)));
/** n windows of a kind spread evenly between x0 and x1, their sills at `up`. */
export function windowRow(r, rng, kind, x0, x1, up, n, o) {
  if (x1 - x0 < WW[kind] + 2) return;
  const ww = WW[kind], gap = (x1 - x0 - n * ww) / (n + 1);
  for (let i = 0; i < n; i++) oneWindow(r, rng, kind, Math.round(x0 + gap + i * (ww + gap)), up, o);
}

export const HOUSE_ROOFS = ['#c8603e', '#4a5560', '#6a4a3a', '#3c4a5a', '#7a3a32', '#5a6a5a'];
export const DOOR_COLOURS = [WOOD, '#7a3a32', '#2f4a5a', '#3f6a4a', '#5a4a6a', DARKWOOD];
export const AWNINGS = [[RED, WHITE], ['#2fa36b', WHITE], [NAVY, WHITE], ['#f08a2c', '#f4e6c8'], ['#7a3a6a', WHITE]];

/**
 * Washing on a balcony rail (the rail's top at `up`), from x0 to x1: shirts and
 * towels on pegs, and on the top floor sometimes a futon over the rail. Its own
 * rng (the seed and the floor), so it never changes the building's choices.
 */
export function laundry(r, b, floor, x0, x1, up, top) {
  const rng = seeded((b.seed ?? 1) * 31 + floor * 7 + 3);
  if (rng() < 0.3) return;
  if (top && rng() < 0.45) {
    const w = Math.min(18, x1 - x0 - 6), x = x0 + 3 + Math.floor(rng() * (x1 - x0 - w - 5));
    r('#e8e0f0', x, up - 5, w, 8); for (let i = 1; i < w; i += 4) r('#a8a0c8', x + i, up - 3, 2, 3); r(shade('#e8e0f0', 0.82), x, up - 5, w, 1); r(shade('#e8e0f0', 1.05), x, up + 2, w, 1);
    return;
  }
  const cols = ['#f2f2ee', '#3f7fd6', '#e8402f', '#f2c8d8', '#f2c230', '#5f8f5a', '#262b3a'];
  for (let x = x0 + 2 + Math.floor(rng() * 4); x + 3 < x1; x += 3 + Math.floor(rng() * 4)) {
    if (rng() < 0.35) continue;
    const c = cols[Math.floor(rng() * cols.length)], shirt = rng() < 0.45, w = shirt ? 5 : 3;
    if (x + w >= x1) break;
    if (shirt) { r(c, x, up - 4, 5, 3); r(c, x + 1, up - 6, 3, 2); r(shade(c, 0.8), x + 1, up - 6, 3, 1); }   // a shirt: sleeves out, body down
    else { r(c, x, up - 5, 3, 5); r(shade(c, 0.82), x, up - 5, 3, 1); }   // a towel
    r('#c8ccd0', x + 1, up, 1, 1); x += w;
  }
}

// --- shop fronts -----------------------------------------------------------------
export const SHOPS = {
  konbini: { name: 'KONBINI', bg: WHITE, fg: '#1f4fa8', stripes: ['#2fa36b', '#f08a2c', '#1f4fa8'], auto: true },
  ramen: { name: 'RAMEN', bg: '#d8302a', fg: WHITE, noren: NAVY, lantern: true },
  cafe: { name: 'CAFE', bg: '#5a3a28', fg: '#f4e6c8', awning: ['#2fa36b', WHITE] },
  bookshop: { name: 'BOOKS', bg: '#1f4fa8', fg: WHITE, books: true },
  bakery: { name: 'BAKERY', bg: '#f2c230', fg: '#5a3a28', awning: [RED, WHITE] },
  izakaya: { name: 'IZAKAYA', bg: '#2a2a30', fg: '#f2c230', noren: '#8a3a2a', lantern: true },
};
/**
 * A shop's ground floor (28 tall): glass or a wooden front and its door
 * (0-18), stripes or an awning (18-22), the sign (22-28). Returns the kind.
 */
export function shopFront(r, rng, dx, w, kind, wall) {
  const s = SHOPS[kind] ?? SHOPS.konbini;
  r(shade(wall, 0.9), dx, 18, w, SHOP_GF - 18);
  sign(r, s.bg, s.fg, dx + 1, 21, w - 2, 7, s.name);
  if (s.stripes) s.stripes.forEach((c, i) => r(c, dx, 20 - i, w, 1));
  if (s.noren) {
    r(DARKWOOD, dx, 0, w, 18); r(shade(DARKWOOD, 0.7), dx, 0, w, 2);
    WINDOWS.lattice(r, dx + 3, SILL, w - 26, 9);
    DOORS.sliding(r, dx + w - 19);
    noren(r, s.noren, dx + w - 21, 10, 20, 8);
    if (s.lantern) lantern(r, dx + w - 25, 8);
  } else if (s.auto) {
    WINDOWS.shop(r, dx + 1, 0, w - 20, 18); DOORS.auto(r, dx + w - 18);
    shelves(r, rng, dx + 3, 2, w - 24, 3, ['#f2c230', '#e8402f', '#3f7fd6', '#2fa36b', WHITE]);
  } else {
    WINDOWS.shop(r, dx + 1, 0, w - 14, 18); DOORS.glass(r, dx + w - 12);
    if (s.books) shelves(r, rng, dx + 3, 2, w - 18, 3, [RED, '#3f7fd6', '#f2c230', '#5f8f5a', WHITE, '#7a6aa8']);
    if (kind === 'bakery') for (let i = dx + 4; i + 4 < dx + w - 16; i += 6) { r('#d8a050', i, 2, 4, 2); r(shade('#d8a050', 1.2), i + 1, 3, 2, 1); }   // loaves in the window
    if (kind === 'cafe') { r('#5a3a28', dx + 3, 1, w - 20, 1); for (let i = dx + 5; i + 3 < dx + w - 16; i += 8) { r(WHITE, i, 2, 3, 2); r('#8a5a3a', i + 1, 3, 1, 1); } }   // cups on the counter
  }
  if (s.awning) awning(r, s.awning[0], s.awning[1], dx - 1, 17, w + 2, 5);
  return kind;
}

// --- the buildings ---------------------------------------------------------------
// Each: { draw(r, rng, b, wall, roof, w), approved, open }: w is the old width times 1.5
// (rounded); open (torii, gas station) the ground you can walk into, as in OPEN, at full size.
// draw makes the same choices with the rng as the old drawing (the order of the
// old draw's picks), so a seed gives the same building, now at full size.
// approved: the owner approved it (it is drawn everywhere); not yet approved
// ones are drawn only when asked for (setRedraw('all'), ?redraw=all).

export const FULL = {
  sushi: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), floors = v.chance(0.75) ? 2 : 1, top = floorAt(floors), norenC = v.pick([NAVY, '#7a2a22', '#2f4a3a']);
      const doorRight = v.chance(0.6), dx = doorRight ? w - 21 : 5;
      const POST = shade(DARKWOOD, 0.72);
      if (floors === 2) {
        r(wall, 0, GF, w, top - GF); r(shade(wall, 0.88), 0, GF, w, 2);   // the wall, in shade under the little roof
        windowRow(r, rng, v.pick(['alu', 'shoji']), 3, w - 3, floorAt(1) + SILL, howMany('alu', 3, w - 3, 7));
      }
      r(DARKWOOD, 0, 0, w, GF); r(POST, 0, 0, 2, GF); r(POST, w - 2, 0, 2, GF); r(shade(DARKWOOD, 0.6), 0, 0, w, 2);
      const lx = doorRight ? 5 : 29, lw = w - 34;
      WINDOWS.lattice(r, lx, SILL, lw, 9);
      const sw = Math.min(lw, 26);
      sign(r, LIGHTWOOD, INK, lx + Math.floor((lw - sw) / 2), 16, sw, 7, 'SUSHI');
      DOORS.sliding(r, dx); noren(r, norenC, dx - 2, 11, 20, 8);
      lantern(r, doorRight ? dx - 6 : dx + 19, 10);
      const roofC = b.roof ?? null, kind = v.pick(['pitched', 'hipped']), rc = roofC ?? v.pick(['#4a4442', '#3a3f44', '#5a5450']);
      r(rc, -2, GF - 3, w + 4, 3); r(shade(rc, 1.3), -2, GF - 1, w + 4, 1); r(shade(rc, 0.6), -2, GF - 3, w + 4, 1);   // a little tiled roof over the shop front
      for (let x = 0; x < w + 2; x += 3) r(shade(rc, 0.8), x - 1, GF - 2, 1, 1);
      pitched(r, rc, -2, top, w + 4, Math.round(v.int(12, 15) * 1.5), kind === 'hipped' ? 3 : 0);
    },
  },
  ...PA, ...PB, ...PC, ...PD,
};
