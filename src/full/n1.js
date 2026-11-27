// Full-size trees, part 1: oak, Japanese maple, cherry blossom, Japanese pine, cedar, fir, birch.
// Each is the old tree (tinyNature.js) times 1.5 on whole pixels: the same shape and colours,
// the extra pixels spent on clumps of leaves (lit upper left, shaded lower right), bark,
// branches showing through the gaps, blossom and leaves in small clusters.
// Drawn into a pixel sheet first (so clumps can shade over each other), then painted with r.
import { shade } from '../tinyCharacters.js';

const BARK = '#6b4a2a', DARK_BARK = '#4a3424';

// --- a pixel sheet: (x, up) from the plant's left and foot ---------------------------------
function sheet() {
  const px = new Map(), key = (x, y) => `${x},${y}`;
  return {
    set(x, y, c) { px.set(key(x, y), c); },
    get(x, y) { return px.get(key(x, y)); },
    has(x, y) { return px.has(key(x, y)); },
    rect(c, x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px.set(key(x + i, y + j), c); },
    /** Paint everything with r, in runs along each row. */
    paint(r) {
      const rows = new Map();
      for (const [k, c] of px) { const [x, y] = k.split(',').map(Number); if (!rows.has(y)) rows.set(y, []); rows.get(y).push([x, c]); }
      for (const [y, row] of rows) {
        row.sort((a, b) => a[0] - b[0]);
        for (let i = 0; i < row.length;) {
          let j = i + 1;
          while (j < row.length && row[j][1] === row[i][1] && row[j][0] === row[j - 1][0] + 1) j++;
          r(row[i][1], row[i][0], y, j - i, 1); i = j;
        }
      }
    },
  };
}

const inEll = (x, y, rx, ry) => (x * x) / ((rx + 0.5) * (rx + 0.5)) + (y * y) / ((ry + 0.5) * (ry + 0.5)) <= 1;

/**
 * A clump of leaves: an ellipse at (cx, cy) with a shaded crescent on its lower right and a lit
 * one on its upper left. `inside` (a sheet) keeps it within leaves already there (texture).
 */
function clump(P, cx, cy, rx, ry, c, { light = shade(c, 1.14), dark = shade(c, 0.8), inside = false, lit = [1.4, 1.4], sh = [1.6, 1.6] } = {}) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if (!inEll(x, y, rx, ry)) continue;
    if (inside && !P.has(cx + x, cy + y)) continue;
    const dk = !inEll(x + sh[0], y - sh[1], rx, ry), lt = !inEll(x - lit[0], y + lit[1], rx, ry);
    P.set(cx + x, cy + y, dk && !lt ? dark : lt && !dk ? light : c);
  }
}
/**
 * A cluster's edge drawn over leaves already there: their colour a little darker along its lower
 * right and a little lighter along its upper left, so a big lit crown breaks into clusters.
 */
function cluster(P, cx, cy, rx, ry, { dark = 0.84, light = 1.09, lit = [0.8, 1.4], sh = [0.8, 1.8] } = {}) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if (!inEll(x, y, rx, ry) || !P.has(cx + x, cy + y)) continue;
    const dk = !inEll(x + sh[0], y - sh[1], rx, ry), lt = !inEll(x - lit[0], y + lit[1], rx, ry);
    if (dk && !lt) P.set(cx + x, cy + y, shade(P.get(cx + x, cy + y), dark));
    else if (lt && !dk) P.set(cx + x, cy + y, shade(P.get(cx + x, cy + y), light));
  }
}

/** Small clusters (fruit, flowers, bright leaves) on leaves already drawn, kept apart from each other. */
function dots(P, rng, cx, cy, rx, ry, colours, n, shape = [[0, 0], [1, 0]], gap = 3) {
  const put = [];
  for (let tries = 0; put.length < n && tries < n * 12; tries++) {
    const x = cx + Math.round((rng() * 2 - 1) * rx), y = cy + Math.round((rng() * 2 - 1) * ry);
    if (!shape.every(([dx, dy]) => P.has(x + dx, y + dy))) continue;
    if (put.some(([a, b]) => Math.abs(a - x) < gap && Math.abs(b - y) < gap)) continue;
    put.push([x, y]);
    const c = colours[Math.floor(rng() * colours.length)];
    for (const [dx, dy] of shape) P.set(x + dx, y + dy, Array.isArray(c) ? c[(dx + dy) & 1 ? 1 : 0] : c);
  }
  return put;
}

/** A trunk w wide from up 0 to h: a lit left edge, a shaded right one, a wider foot, bark marks. */
function trunk(P, rng, cx, h, c, w, { marks = 2, foot = true } = {}) {
  const x0 = cx - Math.floor(w / 2);
  P.rect(c, x0, 0, w, h);
  P.rect(shade(c, 1.18), x0, 0, 1, h);
  P.rect(shade(c, 0.72), x0 + w - 1, 0, 1, h);
  if (foot) { P.rect(shade(c, 0.85), x0 - 1, 0, 1, 1); P.rect(shade(c, 0.72), x0 + w, 0, 1, 1); }
  for (let i = 0; i < marks; i++) P.rect(shade(c, 0.78), x0 + 1 + Math.floor(rng() * Math.max(1, w - 2)), 2 + Math.floor(rng() * Math.max(1, h - 5)), 1, 2);
}

/** A branch from (x, y) going dx across and dy up, `t` thick, as a pixel line. */
function branch(P, x, y, dx, dy, c, t = 2) {
  const n = Math.max(Math.abs(dx), Math.abs(dy));
  for (let k = 0; k <= n; k++) P.rect(c, Math.round(x + dx * k / n), Math.round(y + dy * k / n), t, 1);
}

/** Dark pockets in a crown, where a branch shows through. */
function pockets(P, rng, spots, deep, wood) {
  for (const [x, y] of spots) {
    if (!P.has(x, y) || !P.has(x + 1, y)) continue;
    P.set(x, y, deep); P.set(x + 1, y, deep);
    if (wood) P.set(x + (rng() < 0.5 ? 0 : 1), y, wood);
  }
}

const jit = (rng, n = 1) => Math.round((rng() * 2 - 1) * n);

export const PART = {
  // 29 x 33: a stout trunk forking into a round crown of three big clumps, broken into leaf clusters
  oak: { approved: false, draw(r, rng, cx) {
    const P = sheet(), G = '#5f8f4a', G2 = '#6a9a52';
    trunk(P, rng, cx, 14, BARK, 4, { marks: 2, foot: false });
    const W = shade(BARK, 0.85);
    branch(P, cx - 2, 11, -5, 5, W); branch(P, cx, 11, 5, 6, W);                // the fork, under the crown
    // the crown's three clumps (the old one's, times 1.5): lit on top, shaded underneath
    clump(P, cx - 5, 18, 9, 7, G, { dark: shade(G, 0.74), lit: [1, 2], sh: [1.5, 3] });
    clump(P, cx + 5, 19, 9, 7, G, { dark: shade(G, 0.74), lit: [1, 2], sh: [1.5, 3] });
    clump(P, cx, 24, 11, 8, G2, { light: shade(G2, 1.14), dark: shade(G2, 0.8), lit: [3, 3], sh: [1, 3] });
    for (const [x, y] of [[-1, 11], [0, 11], [1, 11], [0, 12]]) P.set(cx + x, y, x === 1 ? shade(BARK, 0.7) : W);
    // leaf clusters, a little different on each seed
    const a = jit(rng), b = jit(rng), c = jit(rng);
    for (const [x, y, rx, ry] of [
      [cx - 7 + a, 15, 5, 3], [cx + 6 + c, 15 + b, 5, 3],
      [cx - 4 + b, 21, 6, 3], [cx + 6 + a, 21 + c, 4, 3],
      [cx - 1 + c, 27, 6, 3]]) cluster(P, x, y, rx, ry);
    P.paint(r);
  } },

  // 26 x 29: a dark trunk, three red-to-orange clumps (deeper below), bright and dark leaves in clusters
  maple: { approved: false, draw(r, rng, cx) {
    const P = sheet(), A = '#c8402c', B = '#d85a34', C = '#e8703a';
    trunk(P, rng, cx, 12, DARK_BARK, 3, { marks: 1, foot: false });
    branch(P, cx - 1, 10, -4, 4, DARK_BARK); branch(P, cx, 10, 4, 5, shade(DARK_BARK, 0.85));
    clump(P, cx - 5, 15, 8, 6, A, { dark: shade(A, 0.74), lit: [1, 2], sh: [1.5, 3] });
    clump(P, cx + 4, 16, 8, 6, B, { dark: shade(B, 0.74), lit: [1, 2], sh: [1.5, 3] });
    clump(P, cx, 21, 9, 6, C, { light: shade(C, 1.12), dark: shade(C, 0.82), lit: [3, 3], sh: [1, 3] });
    const a = jit(rng), b = jit(rng);
    for (const [x, y, rx, ry] of [[cx - 6 + a, 13, 4, 3], [cx + 5 + b, 13, 4, 3], [cx - 2 + b, 18, 5, 3], [cx + 5 + a, 19, 3, 2], [cx - 1 + a, 23, 5, 2]]) cluster(P, x, y, rx, ry);
    // leaves catching the light above, deep red ones in the shade below
    dots(P, rng, cx - 1, 21, 7, 3, ['#f2a040'], 4, [[0, 0], [1, 0], [0, 1]], 4);
    dots(P, rng, cx, 12, 9, 2, ['#a8301f'], 4, [[0, 0], [1, 0]], 4);
    P.paint(r);
  } },

  // 29 x 30: a dark trunk with two spreading branches, a pale pink crown with the branches showing
  // through, white and deep pink blossom in clusters, petals on the ground
  sakura: { approved: false, draw(r, rng, cx) {
    const P = sheet(), WOOD = '#4a3434', K = '#f2b8c8', K2 = '#f6c8d4';
    trunk(P, rng, cx, 13, WOOD, 3, { marks: 1, foot: false });
    branch(P, cx - 1, 10, -8, 2, WOOD); branch(P, cx + 1, 11, 8, 2, shade(WOOD, 0.85));     // the branches
    clump(P, cx - 6, 18, 8, 6, K, { dark: shade(K, 0.84), light: shade(K, 1.06), lit: [1, 2], sh: [1.5, 3] });
    clump(P, cx + 6, 18, 8, 6, K, { dark: shade(K, 0.84), light: shade(K, 1.06), lit: [1, 2], sh: [1.5, 3] });
    clump(P, cx, 22, 9, 6, K2, { dark: shade(K2, 0.88), light: '#fbe0e8', lit: [3, 3], sh: [1, 3] });
    const a = jit(rng), b = jit(rng);
    for (const [x, y, rx, ry] of [[cx - 7 + a, 16, 5, 3], [cx + 7 + b, 16, 5, 3], [cx - 2 + b, 22, 6, 3]]) cluster(P, x, y, rx, ry, { dark: 0.9, light: 1.04 });
    // twigs showing in the gaps low in the crown
    const tw = rng() < 0.5 ? [cx - 5, 14, 1] : [cx + 4, 14, -1], TW = shade(WOOD, 1.3);
    for (let k = 0; k < 3; k++) P.set(tw[0] + (k > 1 ? tw[2] : 0), tw[1] + k, TW);
    dots(P, rng, cx - 1, 22, 10, 5, ['#ffffff'], 5, [[0, 0], [1, 0], [0, 1]], 5);            // blossom
    dots(P, rng, cx, 16, 11, 3, ['#e898b0'], 4, [[0, 0], [1, 0]], 5);
    for (let i = 0; i < 7; i++) P.set(cx - 12 + Math.floor(rng() * 13) * 2, 0, rng() < 0.3 ? '#ffffff' : K);   // petals on the ground
    P.paint(r);
  } },

  // 32 x 32: a crooked trunk leaning up to the right, three flat cloud pads of needles
  pine: { approved: false, draw(r, rng, cx) {
    const P = sheet(), WOOD = DARK_BARK, N = '#3f6a44', N2 = '#4a7a4e';
    const seg = (x, y, h) => { P.rect(WOOD, x, y, 3, h); P.rect(shade(WOOD, 1.25), x, y, 1, h); P.rect(shade(WOOD, 0.75), x + 2, y, 1, h); };
    seg(cx - 2, 0, 9); seg(cx - 1, 9, 8); seg(cx, 17, 9);                                  // a crooked trunk
    branch(P, cx - 2, 13, -6, 2, WOOD); branch(P, cx + 1, 19, 5, 2, shade(WOOD, 0.85));
    /** A pad: a flat lens of needles 7 rows high, lit on top, dark underneath, tufts along its top. */
    const pad = (x, y, w, c) => {
      const L = shade(c, 1.18), D = shade(c, 0.74), E = shade(c, 0.66);
      const rows = [[w - 4, D], [w - 1, D], [w, c], [w, c], [w - 1, L], [w - 3, L]];
      rows.forEach(([hw, col], k) => {
        const yy = y - 3 + k;
        P.rect(col, x - hw, yy, hw * 2 + 1, 1);
        if (k >= 2) P.rect(k >= 4 ? c : D, x + hw - 1, yy, 2, 1);                        // its shaded right end
        if (k === 2 || k === 3) P.rect(shade(c, 1.08), x - hw, yy, 2, 1);                // its lit left end
      });
      P.rect(E, x - w + 5, y - 3, (w - 5) * 2 + 1, 1);
      const o = Math.floor(rng() * 3);
      for (let i = -w + 4 + o; i <= w - 5; i += 4) P.rect(shade(L, 1.06), x + i, y + 3, 2, 1);   // tufts
    };
    const e1 = jit(rng), e2 = jit(rng), e3 = jit(rng);
    pad(cx - 8, 15, 7 + Math.min(0, e1), N);
    pad(cx + 6, 21, 9 + Math.min(0, e2), N);
    pad(cx + 2 + e3, 27, 6, N2);
    P.paint(r);
  } },

  // 17 x 48: a tall narrow cone in tiers, each tier's hem hanging a little and darker underneath
  cedar: { approved: false, draw(r, rng, cx) {
    const P = sheet(), C = '#3a6a48', BAND = '#2f5a3c', EDGE = '#2a4a34', LIT = '#467a52';
    trunk(P, rng, cx, 7, BARK, 3, { marks: 1, foot: false });
    for (let k = 0; k < 40; k++) {
      const t = k % 6, hw = Math.max(0, Math.round(7 - k * 7 / 40) + (t === 0 && k < 36 ? 1 : 0) - (t === 5 ? 1 : 0)), y = 6 + k;
      P.rect(t === 0 ? BAND : C, cx - hw, y, hw * 2 + 1, 1);
      if (t >= 2 && hw > 1) P.rect(LIT, cx - hw + (t === 2 ? 1 : 0), y, Math.max(1, Math.round(hw * 0.6)), 1);   // the lit left side
      if (hw > 0) P.rect(EDGE, cx + hw, y, 1, 1);
      if (t === 1 && hw > 2) P.rect(shade(C, 0.88), cx + Math.ceil(hw / 2), y, hw - Math.ceil(hw / 2), 1);        // the shade under the tier above
    }
    P.set(cx, 46, C); P.set(cx, 47, LIT);                                                    // the tip
    P.paint(r);
  } },

  // 23 x 36: three tiers, lit on the left, shaded on the right, each hem hanging in tips
  fir: { approved: false, draw(r, rng, cx) {
    const P = sheet(), C = '#3f7048', LIT = '#4c8056', SH = '#355f40', EDGE = '#2a4a34', HEM = '#2f5a3c';
    trunk(P, rng, cx, 6, BARK, 3, { marks: 0, foot: false });
    const tiers = [[4, 11, 12], [13, 9, 11], [22, 6, 11]];
    tiers.forEach(([base, w, h], n) => {
      for (let k = 0; k < h; k++) {
        const hw = Math.round(w - k * w / h), y = base + k;
        P.rect(C, cx - hw, y, hw * 2 + 1, 1);
        if (hw > 1) P.rect(LIT, cx - hw + (k === 0 ? 0 : 1), y, Math.max(1, Math.ceil(hw * 0.55)), 1);
        if (hw > 2) P.rect(SH, cx + Math.ceil(hw * 0.45), y, hw - Math.ceil(hw * 0.45), 1);
        if (hw > 0) P.rect(EDGE, cx + hw, y, 1, 1);
        if (k === 0) { P.rect(HEM, cx - hw, y, hw * 2 + 1, 1); P.set(cx - hw, y - 1, HEM); P.set(cx + hw, y - 1, EDGE); }
      }
    });
    // the shade each tier casts on the one below
    for (const [base, w] of tiers.slice(1)) for (let i = -w; i <= w; i++) if (P.get(cx + i, base - 2) && P.get(cx + i, base - 2) !== HEM && P.get(cx + i, base - 2) !== EDGE) P.set(cx + i, base - 2, SH);
    P.set(cx, 33, C); P.set(cx, 34, LIT);
    P.paint(r);
  } },

  // 23 x 33: a white trunk with dark marks, a light airy crown of small clumps, bright leaves
  birch: { approved: false, draw(r, rng, cx) {
    const P = sheet(), W = '#eeeae0', W2 = '#d8d4ca', INK = '#3a3a3a', G = '#8ab45a';
    P.rect(W, cx - 1, 0, 3, 21); P.rect(W2, cx + 1, 0, 1, 21); P.rect(shade(W2, 0.85), cx - 1, 0, 3, 1);
    branch(P, cx, 17, -5, 4, W2, 1); branch(P, cx + 1, 18, 4, 4, W2, 1);
    for (const y of [3, 9, 15]) { const o = Math.floor(rng() * 2); P.rect(INK, cx - 1 + o, y + jit(rng), 2, 1); }   // dark bands
    for (let i = 0; i < 3; i++) P.set(cx - 1 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 18), shade(W2, 0.7));
    clump(P, cx, 23, 7, 9, G, { light: shade(G, 1.14), dark: shade(G, 0.78), lit: [3.5, 4.5], sh: [1.2, 5] });
    const a = jit(rng), b = jit(rng);
    for (const [dx, y] of [[-3 + a, 17], [2, 16 + b], [4, 21 + a]]) if (P.has(cx + dx, y) && P.has(cx + dx + 1, y)) { P.set(cx + dx, y, shade(G, 0.66)); P.set(cx + dx + 1, y, shade(G, 0.66)); }   // gaps between the leaves
    dots(P, rng, cx - 2, 26, 3, 3, [shade(G, 1.24)], 2, [[0, 0], [1, 0], [0, 1]], 3);    // leaves in the sun
    dots(P, rng, cx, 24, 6, 6, ['#a8c870'], 5, [[0, 0], [1, 0]], 3);
    P.paint(r);
  } },
};
