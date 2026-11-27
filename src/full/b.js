// Full-size buildings, part B:
// the shop (its six kinds), the coin laundromat, the kissaten, the pharmacy and
// the florist. Each makes the same choices with the rng, in the same order, as
// its old drawing in tinyBuildings.js, so a seed gives the same building.
// (This file and tinyBuildingsFull.js import each other: the kit's bindings are
// read only inside functions, never at the top level.)
import { shade, seeded } from '../tinyCharacters.js';
import {
  V, floorAt, DOORS, SHOPS, AWNINGS, sign, noren, lantern, icon, CROSS, flatRoof, rooftop, flatTop, aRoof, windowRow,
  INK, WHITE, RED, GOLD, CURTAIN, GLASS, GLASS2, HI, WOOD, DARKWOOD, LIGHTWOOD, FRAME, PAPER,
} from '../tinyBuildingsFull.js';

const SG = 28, GF = 24, SILL = 6;                                         // a shop's ground floor, a ground floor, a sill
const KINDS = ['konbini', 'ramen', 'cafe', 'bookshop', 'bakery', 'izakaya'];   // tinyBuildings' SHOP_TYPES, in its order
/** The painter that also paints at night (goods in a lit shop, a lit sign). */
const lit = (r) => r.force ?? r;
/** The old width (the drawing's w is the old one times 1.5). */
const old = (w) => Math.round(w / 1.5);
/** Use up n of the building's rng (the old drawing's goods), so later choices stay the same. */
const burn = (rng, n) => { for (let i = 0; i < n; i++) rng(); };
/** How many goods the old shelves() put on a shelf w wide (one rng each). */
/** A painter that paints by day and, at night, a dark silhouette (bars, slats, things in front of a glow). */
const dark = (r, c0 = '#2a2018') => (r.force ? (c, ...a) => r.force(c0, ...a) : r);
const oldShelf = (w) => (w >= 3 ? Math.floor((w - 3) / 4) + 1 : 0);

// --- pieces ----------------------------------------------------------------------
/** A pier (a narrow strip of wall at the side of a shop front): its left side lit, its right in shade. */
function pier(r, wall, dx, w, h) {
  r(wall, dx, 0, w, h); r(shade(wall, 1.07), dx, 0, 1, h); r(shade(wall, 0.82), dx + w - 1, 0, 1, h);
  r(shade(wall, 0.7), dx, 0, w, 2);                                       // its foot
}
/**
 * A shop window, 18 tall: a frame, a stall riser (rs rows) under the glass, glass
 * in panes about `pane` wide, the top of the glass in the shade of what is above.
 * Returns the glass's box { x, w, y0, y1 } for the goods, and draws the panes'
 * reflections with .shine() (after the goods: they are on the glass).
 */
function window(r, dx, w, o = {}) {
  const frame = o.frame ?? FRAME, c = o.glass ?? GLASS, rs = o.riser ?? 3, riserC = o.riserC ?? shade(frame, 1.25);
  r(frame, dx, 0, w, 18);
  if (rs) { r(riserC, dx + 1, 0, w - 2, rs); r(shade(riserC, 1.15), dx + 1, rs - 1, w - 2, 1); }
  const y0 = rs ? rs + 1 : 1;
  r(c, dx + 1, y0, w - 2, 17 - y0);
  const n = Math.max(1, Math.round((w - 2) / (o.pane ?? 12))), xs = [];
  for (let i = 0; i <= n; i++) xs.push(dx + Math.round(i * (w - 1) / n));
  const panes = xs.slice(0, n).map((x, i) => ({ x: x + 1, w: xs[i + 1] - x - 1 }));
  return {
    x: dx + 1, w: w - 2, y0, y1: 17, panes,
    shine() {
      const bar = dark(r, '#26282c');                                     // the bars stay dark against a lit shop at night
      r(shade(frame, 0.8), dx + 1, 16, w - 2, 1);                         // the shadow under the top rail
      for (let i = 1; i < n; i++) bar(frame, xs[i], y0, 1, 17 - y0);
      const hi = o.hi ?? HI;
      for (const p of panes) if (p.w >= 6) { r(hi, p.x + 1, 11, 1, 2); r(hi, p.x + 2, 13, 1, 2); r(hi, p.x + 3, 15, 1, 1); }
    },
  };
}
/**
 * An awning over a shop front, its top at `top`: the slope (3 rows, lit, a dark
 * line where it meets the wall), the fold, the valance, and a scalloped hem (every
 * other stripe a row longer). Stripes 3 wide. 6 rows in all, below top.
 */
function awn(r, c1, c2, dx, top, w) {
  for (let i = 0; i < w; i += 3) {
    const c = (i / 3) % 2 ? c2 : c1, sw = Math.min(3, w - i);
    r(shade(c, 0.7), dx + i, top - 1, sw, 1);                            // where it meets the wall
    r(c, dx + i, top - 3, sw, 2);                                        // the slope, catching the light
    r(shade(c, 0.78), dx + i, top - 4, sw, 1);                           // the fold
    r(shade(c, 0.9), dx + i, top - 5, sw, 1);                            // the valance
    r(shade(c, 0.8), dx + i + Math.floor(sw / 2), top - 6, 1, 1);        // a scallop under each stripe
  }
}
/** A small tiled roof (hisashi) over a wooden shop front, 3 rows, its bottom at up, eaves 2 px over each side. */
function hisashi(r, c, w, up) {
  r(c, -2, up, w + 4, 3); r(shade(c, 1.3), -2, up + 2, w + 4, 1); r(shade(c, 0.6), -2, up, w + 4, 1);
  for (let x = 0; x < w + 2; x += 3) r(shade(c, 0.8), x - 1, up + 1, 1, 1);
}
/**
 * The kit's lattice over paper (WINDOWS.lattice in the kit), but the paper glows at night
 * (CURTAIN, one of the lit colours) and the slats stay dark in front of it.
 */
function glowLattice(r, dx, up, w, h) {
  const slat = dark(r);
  r(shade(DARKWOOD, 0.72), dx - 1, up - 1, w + 2, h + 2); r(CURTAIN, dx, up, w, h);
  for (let i = dx + 1; i < dx + w; i += 2) slat(WOOD, i, up, 1, h);
  r(LIGHTWOOD, dx - 1, up - 1, w + 2, 1);
}
/** Goods in 2 x 2 blocks on shelves (a shelf line every 4 rows), from a stream of their own. */
function goods(r, g, x, w, y0, rows, colours, shelf = '#c8ccd0', iw = 2) {
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * 4;
    r(shelf, x, y, w, 1);
    for (let i = 1; i + iw <= w; i += iw + 1) { const c = colours[Math.floor(g() * colours.length)]; r(c, x + i, y + 1, iw, 2); r(shade(c, 1.2), x + i, y + 2, 1, 1); }
  }
}

// --- the shop fronts --------------------------------------------------------------
/**
 * A shop's ground floor (28 tall) for one of the six kinds: the front and its
 * door (0-18), stripes, an awning or a little tiled roof (18-21), the sign
 * (21-28). Uses the building's rng as the old shopFront did (only the bookshop's
 * shelves); the goods come from a stream of their own (seed s).
 */
export function shopFront(r, rng, w, kind, wall, s0) {
  const s = SHOPS[kind] ?? SHOPS.konbini, f = lit(r), g = seeded(s0 * 53 + 11);
  r(shade(wall, 0.9), 0, 18, w, SG - 18);
  if (s.noren) {                                                          // ramen, izakaya: a wooden front
    const POST = shade(DARKWOOD, 0.72), dx = w - 20;
    r(DARKWOOD, 0, 0, w, 18); r(POST, 0, 0, 2, 18); r(POST, w - 2, 0, 2, 18); r(shade(DARKWOOD, 0.6), 0, 0, w, 2);
    r(shade(DARKWOOD, 1.15), 2, 17, w - 4, 1);                            // the lintel
    const lw = w - 29;
    glowLattice(r, 4, SILL, lw, 9);
    r(shade(DARKWOOD, 0.85), 3, SILL - 2, lw + 2, 1);                     // the sill's shadow
    DOORS.sliding(r, dx);
    noren(r, s.noren, dx - 2, 10, 20, 8);
    if (s.lantern) lantern(r, dx - 6, 8);
    const d = dark(r);                                                    // in front of the glowing paper: a silhouette at night
    if (kind === 'ramen') {                                               // a menu board on a stand
      d(DARKWOOD, 5, 0, 1, 4); d(DARKWOOD, 11, 0, 1, 4); d(shade(DARKWOOD, 0.7), 4, 4, 9, 8); d(PAPER, 5, 5, 7, 6);
      for (const y of [9, 7]) { d(RED, 6, y, 1, 1); d(INK, 8, y, 3, 1); }
    } else {                                                              // two sake barrels, one on the other
      for (const [x, y] of [[4, 0], [10, 0], [7, 6]]) {
        const st = '#d8cba8';                                             // straw, round at the corners
        d(st, x, y + 1, 6, 4); d(shade(st, 0.7), x + 1, y, 4, 1); d(shade(st, 1.1), x + 1, y + 5, 4, 1); d(shade(st, 0.8), x + 5, y + 1, 1, 4);
        d('#2f4a8a', x, y + 2, 6, 2); d(RED, x + 2, y + 2, 2, 2);
      }
    }
    hisashi(r, kind === 'izakaya' ? '#3a3f44' : '#4a4442', w, 18);
    sign(r, s.bg, s.fg, 1, 21, w - 2, 7, s.name);
    return kind;
  }
  pier(r, wall, 0, 2, 18); pier(r, wall, w - 2, 2, 18);
  if (s.auto) {                                                           // the konbini: glass, automatic doors
    const win = window(r, 2, w - 21, { riser: 2, riserC: shade(WHITE, 0.82) });
    r(wall, w - 19, 0, 1, 18); r(shade(wall, 0.7), w - 19, 0, 1, 2);
    const cols = ['#f2c230', '#e8402f', '#3f7fd6', '#2fa36b', WHITE, '#f08a2c'];
    f(WHITE, win.x, 15, win.w, 1);                                        // the strip lights
    for (let i = win.x + 1; i + 2 <= win.x + win.w; i += 3) {             // magazines along the window
      const c = cols[Math.floor(g() * cols.length)]; f(c, i, win.y0, 2, 4); f(shade(c, 1.25), i, win.y0 + 3, 2, 1);
    }
    goods(f, g, win.x, win.w, win.y0 + 5, 2, cols);
    win.shine();
    DOORS.auto(r, w - 18); r('#6a6e74', w - 18, 0, 16, 1);                // a mat
    s.stripes.forEach((c, i) => r(c, 0, 20 - i, w, 1));
  } else {
    const ww = w - 14, win = window(r, 2, ww, kind === 'cafe' ? { frame: '#3a2a22', riserC: '#5a3a28' } : kind === 'bakery' ? { riserC: shade(WHITE, 0.85) } : {});
    r(wall, w - 12, 0, 1, 18); r(shade(wall, 0.7), w - 12, 0, 1, 2);
    if (s.books) {                                                        // bookshelves: spines of all heights
      burn(rng, 3 * oldShelf(old(w) - 13));
      const cols = [RED, '#3f7fd6', '#f2c230', '#5f8f5a', WHITE, '#7a6aa8', '#c8803a'];
      for (const y of [win.y0, win.y0 + 6]) {
        f(WOOD, win.x, y, win.w, 1);
        for (let i = win.x + 1; i < win.x + win.w - 1; i++) {
          if (g() < 0.12) continue;
          const c = cols[Math.floor(g() * cols.length)], h = 3 + Math.floor(g() * 2);
          f(c, i, y + 1, 1, h); f(shade(c, 1.25), i, y + h, 1, 1);
        }
      }
      f(WOOD, win.x, win.y0 + 12, win.w, 1);
    }
    if (kind === 'bakery') {                                              // bread on two shelves, in every pane
      for (const p of win.panes) {
        f(LIGHTWOOD, p.x, win.y0, p.w, 1); f(LIGHTWOOD, p.x, win.y0 + 6, p.w, 1);
        const n = Math.max(1, Math.floor((p.w + 1) / 5)), x0 = p.x + Math.floor((p.w - (n * 5 - 1)) / 2);
        for (let i = 0; i < n; i++) {                                     // round loaves
          const x = x0 + i * 5; f('#c8803a', x, win.y0 + 1, 4, 2); f('#c8803a', x + 1, win.y0 + 3, 2, 1); f('#e0a860', x + 1, win.y0 + 2, 1, 1);
        }
        for (let i = 0; i < n; i++) {                                     // buns and baguettes
          const x = x0 + i * 5;
          if (g() < 0.5) { f('#d8a050', x, win.y0 + 7, 4, 1); f('#e8c080', x + 1, win.y0 + 8, 2, 1); }
          else { f('#b8703a', x, win.y0 + 7, 4, 2); f('#d89050', x, win.y0 + 8, 1, 1); }
        }
      }
    }
    if (kind === 'cafe') {                                                // a counter with cups, a lamp in every pane
      f('#7a4a2e', win.x, win.y0, win.w, 4); f('#a87048', win.x, win.y0 + 3, win.w, 1); f(shade('#7a4a2e', 0.8), win.x, win.y0, win.w, 1);
      for (const p of win.panes) {
        const cx = p.x + Math.floor(p.w / 2);
        f(INK, cx, 13, 1, 3); f(GOLD, cx - 1, 11, 3, 2); f(shade(GOLD, 1.15), cx - 1, 12, 1, 1);
        for (const x of [cx - 4, cx + 2]) if (x >= p.x && x + 3 <= p.x + p.w) { f(WHITE, x, win.y0 + 4, 2, 2); f('#6a3a22', x, win.y0 + 5, 2, 1); f(WHITE, x + 2, win.y0 + 5, 1, 1); }
      }
    }
    win.shine();
    DOORS.glass(r, w - 11);
    if (s.awning) awn(r, s.awning[0], s.awning[1], -1, 21, w + 2);
    else r(shade(wall, 0.75), 0, 18, w, 1);                               // the shadow of the sign's ledge
  }
  sign(r, s.bg, s.fg, 1, 21, w - 2, 7, s.name);
  return kind;
}

export const PART = {
  shop: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), kind = shopFront(r, rng, w, b.shopType ?? KINDS[Math.floor(rng() * KINDS.length)], wall, b.seed ?? 1);
      flatRoof(r, wall, 0, SG, w, Math.round(v.int(12, 14) * 1.5)); rooftop(r, v, 0, SG, w);
      return kind;
    },
  },
  laundromat: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), f = lit(r);
      r(shade(wall, 0.9), 0, 18, w, SG - 18); r(shade(wall, 0.75), 0, 18, w, 1);
      sign(r, v.pick(['#e8e0d0', WHITE, '#d8e8f0']), '#3f7fd6', 1, 21, w - 2, 7, 'LAUNDROMAT');
      const doorRight = v.chance(0.6), gx = doorRight ? 2 : 12, gw = w - 14;
      pier(r, wall, 0, 2, 18); pier(r, wall, w - 2, 2, 18); pier(r, wall, doorRight ? w - 12 : 11, 1, 18);
      const win = window(r, gx, gw, { riser: 0, pane: 99 });
      f('#e8ecee', win.x, 15, win.w, 1);                                  // the strip light
      const n = Math.floor((old(w) - 18) / 6) + 1, step = Math.min(10, Math.floor((win.w - 2 + 2) / n)), x0 = win.x + Math.floor((win.w - (n - 1) * step - 7) / 2);
      for (let i = 0; i < n; i++) {                                       // the washers: a panel, a dial, a round door
        const x = x0 + i * step, cols = { l: '#f4f6f4', b: '#e2e5e2', s: '#c4c8c8', p: '#c8ccd0', d: INK, k: '#5a5f66', f: '#7a7e84' };
        icon(f, x, 1, ['lllllls', 'ppppdps', 'bbkkkbs', 'bk...ks', 'bk...ks', 'bk...ks', 'bbkkkbs', 'bbbbbbs', 'ffffff.'], cols);
        r(GLASS2, x + 2, 4, 3, 3); r(HI, x + 2, 6, 1, 1);
      }
      win.shine();
      DOORS.glass(r, doorRight ? w - 11 : 2);
      flatTop(r, v, wall, SG, w);
    },
  },
  kissaten: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), top = floorAt(2), front = v.pick([DARKWOOD, '#5a3a28', '#2f4a3a']), aw = v.pick(AWNINGS);
      const doorRight = v.chance(0.65);
      r(wall, 0, GF, w, top - GF); r(shade(wall, 0.85), 0, GF, w, 1);
      r(front, 0, 0, w, GF); r(shade(front, 1.25), 0, 0, 1, GF); r(shade(front, 0.75), w - 1, 0, 1, GF);
      r(shade(front, 0.7), 0, 0, w, 2); r(shade(front, 1.3), 0, GF - 1, w, 1);   // the plinth, the cornice
      const gx = doorRight ? 3 : 15, win = window(r, gx, w - 18, { frame: WOOD, glass: LIGHTWOOD, riserC: shade(front, 1.15), pane: 8, hi: '#e0c48a' });
      r(PAPER, win.x, win.y0, win.w, 5); r(WOOD, win.x, win.y0 + 5, win.w, 1);   // lace half-curtains on a rod
      for (let x = win.x + 1; x < win.x + win.w; x += 2) r(shade(PAPER, 0.88), x, win.y0, 1, 4);
      for (let x = win.x; x < win.x + win.w; x += 2) r(LIGHTWOOD, x, win.y0 + 4, 1, 1);
      r(WOOD, win.x, 13, win.w, 1);                                       // the transom bar
      win.shine();
      DOORS.glazed(r, doorRight ? w - 12 : 3);
      awn(r, aw[0], aw[1], -1, 22, w + 2);
      windowRow(r, rng, v.pick(['sash', 'pair']), 3, w - 3, floorAt(1) + SILL, v.int(1, 2));
      aRoof(r, v.pick(['pitched', 'hipped']), wall, b.roof ?? v.pick(['#5a4a48', '#4a5560', '#7a3a32']), 2, top, w - 4, 21);
    },
  },
  pharmacy: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), f = lit(r), g = seeded((b.seed ?? 1) * 53 + 17);
      r(shade(wall, 0.9), 0, 18, w, SG - 18); r(shade(wall, 0.75), 0, 18, w, 1);
      sign(r, '#eef2e8', '#2fa36b', 11, 21, w - 12, 7, 'PHARMACY');
      icon(f, 2, 21, CROSS, { g: '#2fa36b', w: WHITE });                  // the green cross, lit at night
      const doorRight = v.chance(0.7), gx = doorRight ? 2 : 19, gw = w - 21;
      pier(r, wall, 0, 2, 18); pier(r, wall, w - 2, 2, 18); pier(r, wall, doorRight ? w - 19 : 18, 1, 18);
      const win = window(r, gx, gw, { glass: '#dfe8ec', riserC: shade(WHITE, 0.85) });
      burn(rng, 3 * oldShelf(old(w) - 15));
      goods(f, g, win.x, win.w, win.y0, 3, [RED, '#3f7fd6', '#f2c230', '#2fa36b', WHITE, '#d46a8e'], '#a8b4b8', 3);
      win.shine();
      DOORS.auto(r, doorRight ? w - 18 : 2);
      flatTop(r, v, wall, SG, w);
    },
  },
  florist: {
    approved: true,
    draw(r, rng, b, wall, roof, w) {
      const v = V(rng), floors = v.int(1, 3), top = floorAt(floors, SG), aw = v.pick(AWNINGS), f = lit(r), g = seeded((b.seed ?? 1) * 53 + 23), wo = old(w);
      const FL = [RED, '#f2c230', '#d46a8e', WHITE, '#7b6aa8'], LEAF = '#5f8f5a';
      r(wall, 0, 0, w, top);
      pier(r, wall, 0, 2, 18); pier(r, wall, w - 2, 2, 18); pier(r, wall, w - 12, 1, 18);
      const win = window(r, 2, w - 14, {});
      for (const p of win.panes) {                                        // plants in pots on a shelf inside
        f(shade(WHITE, 0.85), p.x, win.y0 + 6, p.w, 1);
        for (let x = p.x + 1; x + 3 <= p.x + p.w; x += 4) {
          f('#a8664a', x, win.y0 + 7, 3, 2); f(LEAF, x, win.y0 + 9, 3, 2); f(shade(LEAF, 1.25), x, win.y0 + 10, 1, 1);
          if (g() < 0.5) f(FL[Math.floor(g() * FL.length)], x + 1, win.y0 + 11, 1, 1);
        }
      }
      win.shine();
      DOORS.glass(r, w - 11);
      awn(r, aw[0], aw[1], -1, 21, w + 2); sign(r, WHITE, '#d46a8e', 4, 21, w - 8, 7, 'FLOWERS');
      const nw = Math.max(1, Math.floor((wo - 4 - 6) / 11));
      for (let fl = 1; fl < floors; fl++) {
        const up = floorAt(fl, SG);
        r(shade(wall, 0.82), 0, up, w, 1);
        windowRow(r, rng, 'alu', 3, w - 3, up + SILL, nw);
        const gap = (w - 6 - nw * 7) / (nw + 1);
        for (let i = 0; i < nw; i++) {                                    // a window box under each window
          const x = Math.round(3 + gap + i * (7 + gap));
          r('#8a6440', x - 1, up + 1, 9, 3); r(shade('#8a6440', 1.2), x - 1, up + 3, 9, 1); r(shade('#8a6440', 0.8), x + 7, up + 1, 1, 2); r(LEAF, x - 1, up + 4, 9, 1);
          for (let j = 0; j < 9; j += 2) r(FL[Math.floor(g() * FL.length)], x - 1 + j, up + 4 + (j % 4 ? 0 : 1), 1, 1);
        }
      }
      const np = Math.floor((wo - 14 - 1) / 5) + 1;
      for (let i = 0; i < np; i++) {                                      // pots of flowers out in front
        const x = 3 + i * 8, c = [0, 1, 2, 3].map(() => FL[Math.floor(rng() * FL.length)]);
        r('#8a6440', x, 0, 6, 4); r(shade('#8a6440', 1.2), x, 3, 6, 1); r(shade('#8a6440', 0.8), x + 5, 0, 1, 3);
        r(LEAF, x, 4, 6, 2); r(shade(LEAF, 0.8), x + 1, 4, 4, 1);
        r(c[0], x, 6, 2, 2); r(c[1], x + 2, 7, 2, 2); r(c[2], x + 4, 6, 2, 2); r(c[3], x + 1, 9, 1, 1); r(c[3], x + 4, 8, 1, 1);
      }
      flatRoof(r, wall, 0, top, w, 15);
      if (v.chance(0.6)) for (let x = 4; x + 7 <= w - 4; x += 9) {        // a roof garden
        r('#8a6440', x, top + 3, 7, 4); r(shade('#8a6440', 1.2), x, top + 6, 7, 1); r(shade('#8a6440', 0.8), x + 6, top + 3, 1, 3);
        r(LEAF, x + 1, top + 7, 5, 2); r(shade(LEAF, 1.2), x + 1, top + 8, 2, 1); r(LEAF, x + 2, top + 9, 3, 1);
      }
    },
  },
};
