// Full-size bushes, part 3: the round shrub, the boxwood hedge, the azalea, the hydrangea,
// the rose bush, the lavender, the fern, the pampas grass, the holly and the cactus.
// Each fills about the old size times 1.5 (BUSHES in tinyNature.js), centred on cx, its foot
// at up 0. Leafy ones are built on a pixel grid from round clumps (painted back to front, each
// lit from the upper left with a dark rim at the lower right), then flowers or berries go on
// the leaves where there is room; the rng gives each of the 8 variants its own look.
import { shade } from '../tinyCharacters.js';

// --- a grid of pixels (x from the plant's left, up from the foot), painted at the end ----------
function grid() {
  const m = new Map(), k = (x, y) => x + ',' + y;
  return {
    set(x, y, c, t = 2) { m.set(k(x, y), { c, t }); },
    get(x, y) { return m.get(k(x, y)); },
    each(fn) { for (const [key, v] of m) { const [x, y] = key.split(',').map(Number); fn(x, y, v); } },
    flush(r) {
      // runs of the same colour along each row, as one rectangle
      const rows = new Map();
      for (const [key, v] of m) { const [x, y] = key.split(',').map(Number); if (!rows.has(y)) rows.set(y, []); rows.get(y).push([x, v.c]); }
      for (const [y, row] of rows) {
        row.sort((a, b) => a[0] - b[0]);
        let s = 0;
        for (let i = 1; i <= row.length; i++) {
          if (i < row.length && row[i][0] === row[i - 1][0] + 1 && row[i][1] === row[s][1]) continue;
          r(row[s][1], row[s][0], y, row[i - 1][0] - row[s][0] + 1, 1); s = i;
        }
      }
    },
  };
}
// tones: 0 rim (darkest), 1 shade, 2 leaf, 3 lit
const tones = (c) => [shade(c, 0.7), shade(c, 0.85), c, shade(c, 1.18)];

/**
 * A leafy mass from round lobes [x, y, rx, ry] (painted back to front): the whole is lit from
 * the upper left and darker below; each lobe adds a lit cap at its upper left and a shaded
 * crescent at its lower right, so the clumps read without speckle.
 */
function mass(G, lobes, c, lo = -1e9, hi = 1e9) {
  const T = tones(c), owner = new Map(), key = (x, y) => x + ',' + y;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  lobes.forEach(([x, y, rx, ry], n) => {
    for (let j = -ry; j <= ry; j++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + ry * 0.9))));
      for (let i = -hw; i <= hw; i++) {
        const px = Math.round(x + i), py = y + j;
        if (px < lo || px > hi) continue;
        owner.set(key(px, py), [px, py, n]);
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
    }
  });
  const gx = (x0 + x1) / 2, gy = (y0 + y1) / 2, grx = (x1 - x0) / 2 + 0.5, gry = (y1 - y0) / 2 + 0.5;
  for (const [px, py, n] of owner.values()) {
    const [x, y, rx, ry] = lobes[n];
    const u = (px - x) / (rx + 0.5), v = (py - y) / (ry + 0.5), d = u * u + v * v, ln = -0.5 * u + 0.86 * v;
    const gu = (px - gx) / grx, gv = (py - gy) / gry, gn = -0.45 * gu + 0.9 * gv;
    let t = 2 + (gn < -0.3 ? -1 : 0);
    if (n > 0 && d > 0.3 && ln > 0.45 && gn > -0.3) t += 1;                               // the lobe's lit cap
    if (n > 0 && d > 0.55 && ln < -0.25 && owner.has(key(px, py - 1))) t -= 1;   // its shaded crescent
    if (!owner.has(key(px, py - 1))) t = 0;                                  // the underside
    t = Math.max(owner.has(key(px, py - 1)) ? 1 : 0, Math.min(3, t));
    G.set(px, py, T[t], t);
  }
}
/** Leaf texture: a few lit leaf dashes on the light side, dark gaps in the shade (clean clusters, not speckle). */
function leaves(G, rng, c, n = 6) {
  const T = tones(c), spots = [];
  G.each((x, y, v) => spots.push([x, y, v.t]));
  spots.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const used = [];
  const free = (x, y) => used.every(([a, b]) => Math.abs(a - x) > 2 || Math.abs(b - y) > 1);
  for (let k = 0, tries = 0; k < n && tries < 200; tries++) {
    const [x, y, t] = spots[Math.floor(rng() * spots.length)];
    if (!free(x, y)) continue;
    if (t === 3 && G.get(x + 1, y)?.t >= 2) { G.set(x, y, shade(c, 1.32), 3); G.set(x + 1, y, T[3], 3); used.push([x, y]); k++; }
    else if (t === 1 && G.get(x + 1, y)?.t === 1 && G.get(x, y - 1)?.t >= 1) { G.set(x, y, T[0], 0); G.set(x + 1, y, T[0], 0); used.push([x, y]); k++; }
    else if (t === 2 && G.get(x, y - 1)?.t >= 1) { G.set(x, y, T[3], 3); used.push([x, y]); k++; }
  }
}
/** Leaf tips over the top edge: a pixel above the outline here and there. */
function tips(G, rng, c, n = 4) {
  const top = new Map();
  G.each((x, y) => { if (!top.has(x) || top.get(x) < y) top.set(x, y); });
  const xs = [...top.keys()].sort((a, b) => a - b);
  for (let k = 0; k < n; k++) {
    const x = xs[1 + Math.floor(rng() * (xs.length - 2))], y = top.get(x);
    const left = x < (xs[0] + xs[xs.length - 1]) / 2;
    G.set(x, y + 1, shade(c, left ? 1.18 : 1), 2);
  }
}
/** Prickles all round the edge (holly): a leaf point sticking out every third pixel. */
function prickles(G, rng, c) {
  const top = new Map(), lo = new Map(), hi = new Map(), o = Math.floor(rng() * 3);
  G.each((x, y) => {
    if (!top.has(x) || top.get(x) < y) top.set(x, y);
    if (!lo.has(y) || lo.get(y) > x) lo.set(y, x);
    if (!hi.has(y) || hi.get(y) < x) hi.set(y, x);
  });
  const pts = [];
  for (const [x, y] of top) if ((x + o) % 3 === 0) pts.push([x, y + 1, shade(c, x < 8 ? 1.18 : 1)]);
  for (const [y, x] of lo) if (y > 1 && (y + o) % 3 === 0) pts.push([x - 1, y, shade(c, 1.1)]);
  for (const [y, x] of hi) if (y > 1 && (y + o) % 3 === 1) pts.push([x + 1, y, shade(c, 0.85)]);
  for (const [x, y, col] of pts) G.set(x, y, col, 2);
}
/** Places for little things (flowers, berries) on the leaves: s x s of leaf, not on the rim, spaced apart. */
function spots(G, rng, n, s, gap, draw) {
  const ok = [];
  G.each((x, y) => {
    for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) { const v = G.get(x + a, y + b); if (!v || v.t === 0) return; }
    if (!G.get(x, y - 1) || !G.get(x - 1, y + s - 1) || !G.get(x + s, y + s - 1)) return;
    ok.push([x, y]);
  });
  ok.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const got = [];
  for (let tries = 0; got.length < n && tries < 300 && ok.length; tries++) {
    const [x, y] = ok[Math.floor(rng() * ok.length)];
    if (got.some(([a, b]) => Math.abs(a - x) < gap && Math.abs(b - y) < gap)) continue;
    got.push([x, y]); draw(x, y);
  }
}
/** A leafy bush of the old blob's size times 1.5 (17 x 12): a body, three lobes behind, three in front. */
function leafy(G, rng, cx, c) {
  const j = () => Math.floor(rng() * 3) - 1;
  mass(G, [
    [cx, 5, 8, 5],
    [cx - 4 + j(), 7, 3.5, 3], [cx + 4 + j(), 7, 3.5, 3], [cx + j(), 9, 3.5, 2],
    [cx - 4, 4, 3.5, 3], [cx + 4, 4, 3.5, 3], [cx + j(), 5, 3, 3],
  ], c, cx - 8, cx + 8);
}

export const PART = {
  // 17 x 12: a rounded shrub of clumps
  round: { approved: false, draw(r, rng, cx) {
    const G = grid(), c = '#5f8f4a';
    leafy(G, rng, cx, c);
    tips(G, rng, c, 3); leaves(G, rng, c, 3);
    G.flush(r);
  } },

  // 23 x 11: a clipped box: the lit flat top with a few dips, the front face with clusters
  // of leaves, darker low down, a dark foot
  hedge: { approved: false, draw(r, rng, cx) {
    const x0 = cx - 11, W = 23, B = '#4a7a3e', M = '#5f8f4a', T = '#6f9f58';
    r(B, x0, 0, W, 7); r(shade(B, 0.92), x0, 0, W, 3); r(shade(B, 0.78), x0 + 1, 0, W - 2, 1);   // the face, darker low down, its foot
    r(shade(B, 1.1), x0, 1, 1, 6); r(shade(B, 0.82), x0 + W - 1, 1, 1, 6);            // the lit end, the shaded end
    r(shade(B, 0.86), x0, 6, W, 1);                                                   // the edge of the top
    r(M, x0, 7, W, 3); r(M, x0 + 1, 10, W - 2, 1); r(shade(M, 0.9), x0 + W - 1, 7, 1, 3);   // the clipped top
    r(T, x0 + 1, 9, W - 3, 1); r(T, x0 + 2, 10, W - 5, 1); r(shade(T, 1.12), x0 + 3, 10, 6, 1);   // its lit top
    for (let i = 0; i < 4; i++) { const x = x0 + 2 + i * 5 + Math.floor(rng() * 3); r(shade(M, 0.9), x, 8, 2, 1); }   // dips in the top
    const got = [];
    for (let tries = 0; got.length < 6 && tries < 60; tries++) {                       // clusters of leaves on the face
      const x = 2 + Math.floor(rng() * (W - 6)), up = 1 + Math.floor(rng() * 4);
      if (got.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - up) < 3)) continue;
      got.push([x, up]); r(shade(B, 1.14), x0 + x, up + 1, 2, 1); r(shade(B, 0.8), x0 + x + 1, up, 2, 1);
    }
    for (let k = 0; k < 2; k++) { const x = x0 + 3 + Math.floor(rng() * (W - 6)); r(T, x, 11, 1, 1); }   // a shoot or two
  } },

  // 17 x 12: a shrub covered in pink flowers
  azalea: { approved: false, draw(r, rng, cx) {
    const G = grid(), c = '#4f7f42';
    leafy(G, rng, cx, c);
    tips(G, rng, c, 3); leaves(G, rng, c, 4);
    const P = '#e870a0', L = '#f2a0c0';
    spots(G, rng, 9 + Math.floor(rng() * 3), 2, 3, (x, y) => {
      G.set(x, y + 1, L, 3); G.set(x + 1, y + 1, P, 3); G.set(x, y, P, 3); G.set(x + 1, y, shade(P, 0.82), 3);
    });
    G.flush(r);
  } },

  // 17 x 12: a shrub with four or five big round heads of blue or purple flowers
  hydrangea: { approved: false, draw(r, rng, cx) {
    const G = grid(), c = '#4f7f42';
    leafy(G, rng, cx, c);
    tips(G, rng, c, 3); leaves(G, rng, c, 5);
    G.flush(r);
    const heads = [[-5, 6], [1, 8], [4, 4], [-2, 3]];
    if (rng() < 0.5) heads.push([-7, 1]);                                          // sometimes a fifth, low at the left
    for (const [dx, up] of heads) {
      const p = rng() < 0.5 ? '#7a8ad8' : '#a080c8', x = cx + dx + Math.floor(rng() * 2) - 1;
      r(p, x + 1, up + 3, 2, 1); r(p, x, up + 1, 4, 2); r(shade(p, 0.82), x + 1, up, 2, 1);   // a round head
      r(shade(p, 1.2), x, up + 2, 2, 1); r(shade(p, 1.2), x + 1, up + 3, 1, 1);          // lit at the top left
      r(shade(p, 0.82), x + 3, up + 1, 1, 1); r(shade(p, 1.1), x + 2, up + 1, 1, 1);      // a floret
    }
  } },

  // 17 x 12: a dark green bush with red roses
  rose: { approved: false, draw(r, rng, cx) {
    const G = grid(), c = '#3f6a3a';
    leafy(G, rng, cx, c);
    tips(G, rng, c, 4); leaves(G, rng, c, 6);
    const R = '#d8303a', L = '#e85060', K = shade(R, 0.68);
    spots(G, rng, 5 + Math.floor(rng() * 3), 3, 4, (x, y) => {                       // a bloom: round, lit at the top left, its curled heart
      G.set(x, y + 1, R, 3); G.set(x + 1, y + 1, K, 3); G.set(x + 2, y + 1, R, 3);
      G.set(x, y + 2, L, 3); G.set(x + 1, y + 2, R, 3); G.set(x + 1, y, shade(R, 0.82), 3);
      if (rng() < 0.5) G.set(x + 2, y + 2, R, 3);
    });
    G.flush(r);
  } },

  // 17 x 12: stems standing up out of a low grey-green mound, purple spikes in whorls
  lavender: { approved: false, draw(r, rng, cx) {
    const S = '#7a9a6a', F = '#9a7ac8', SL = shade(S, 1.15), SD = shade(S, 0.85);
    for (let i = -6; i <= 6; i += 2) {                                               // stems, each with a purple spike in whorls
      const h = 7 + Math.floor(rng() * 4) + (Math.abs(i) < 4 ? 1 : 0), lean = i < -3 ? -1 : i > 3 ? 1 : 0, x = cx + i;
      r(S, x, 4, 1, h - 7); r(S, x + lean, h - 3, 1, 1);
      r(F, x + lean, h - 2, 1, 4); r(shade(F, 0.78), x + lean, h - 2, 1, 1); r(shade(F, 0.78), x + lean, h, 1, 1);
      r(shade(F, 1.18), x + lean, h + 1, 1, 1);
    }
    r(shade(S, 0.78), cx - 5, 0, 11, 1); r(S, cx - 7, 1, 15, 2); r(S, cx - 6, 3, 13, 1); r(S, cx - 4, 4, 9, 1);   // the grey-green mound
    r(SL, cx - 6, 2, 5, 1); r(SL, cx - 5, 3, 4, 1); r(SL, cx - 3, 4, 3, 1);                   // lit at the left
    r(SD, cx + 4, 1, 3, 2); r(SD, cx + 3, 3, 3, 1); r(SD, cx - 6, 1, 1, 1);                 // shaded at the right
    for (const dx of [-5, -1, 3, 6]) r(dx < 0 ? SL : S, cx + dx, dx === 6 || dx === -5 ? 4 : 5, 1, 1);   // leaf tips
  } },

  // 20 x 11: fronds arching out from the middle and drooping at the tips, leaflets along each
  fern: { approved: false, draw(r, rng, cx) {
    const D = '#4a8a44', L = '#5f9f52', H = shade(L, 1.15), S = shade(D, 0.85);
    const lift = Math.floor(rng() * 2);
    const arch = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6 + lift], [6, 6 + lift], [7, 6], [8, 5], [9, 4]];
    const low = [[1, 0], [2, 1], [3, 1], [4, 2], [5, 2], [6, 2], [7, 1], [8, 1 - lift]];
    const frond = (pts, s) => pts.forEach(([dx, up], k) => {
      const x = cx + s * dx;
      r(D, x, up, 1, 1);                                                              // the stem
      if (k >= 1 && k < pts.length - 1) r(s < 0 ? H : L, x, up + 1, 1, 1);           // leaflets above
      if (k >= 1 && k < pts.length - 2 && k % 2 === 0) r(S, x, up - 1, 1, 1);         // and below
    });
    for (const s of [-1, 1]) frond(low, s);
    for (const s of [-1, 1]) frond(arch, s);
    const top = 9 + lift;                                                             // the middle frond, leaflets either side
    for (let up = 0; up <= top; up++) r(D, cx, up, 1, 1);
    for (let up = 3; up < top; up++) { r(up % 2 ? H : L, cx - 1, up, 1, 1); if (up % 2 === 0 || up > top - 3) r(L, cx + 1, up, 1, 1); }
    r(L, cx, top + 1, 1, 1);
  } },

  // 17 x 21: a fountain of long grass blades, tall stems with cream plumes
  pampas: { approved: false, draw(r, rng, cx) {
    const G = '#8a9a6a', GL = shade(G, 1.12), GD = shade(G, 0.82), S = '#9aa878', P = '#eee4c8', PD = '#e0d4b0';
    const plumes = [[-4, 15], [-2, 19], [1, 18], [4, 14]];
    if (rng() < 0.5) plumes.push([-1 + Math.floor(rng() * 2) * 3, 12 + Math.floor(rng() * 3)]);
    for (const [dx, h0] of plumes) {
      const h = h0 + Math.floor(rng() * 2), lean = dx < -2 ? -1 : dx > 2 ? 1 : 0, x = cx + dx, px = x + lean;
      r(S, x, 4, 1, h - 10); r(S, px, h - 6, 1, 1);                                   // the stem
      r(P, px, h - 5, 2, 4); r(P, px + (lean > 0 ? 1 : 0), h - 1, 1, 2);              // the plume, tapered
      r(shade(P, 1.04), px, h - 4, 1, 3); r(PD, px + 1, h - 5, 1, 3); r(PD, px, h - 5, 1, 1);
    }
    const blade = (pts, c) => pts.forEach(([dx, up]) => r(c, cx + dx, up, 1, 1));
    for (const s of [-1, 1]) {                                                        // blades arching out
      const c = s < 0 ? GL : G;
      blade([[s * 3, 4], [s * 4, 5], [s * 5, 6], [s * 6, 6], [s * 7, 5]], c);
      blade([[s * 5, 2], [s * 6, 3], [s * 7, 3], [s * 8, 2]], c);
      blade([[s * 2, 5], [s * 2, 6], [s * 3, 7], [s * 3, 8]], c);
    }
    r(GD, cx - 4, 0, 9, 1); r(G, cx - 5, 1, 11, 2); r(G, cx - 4, 3, 9, 2); r(G, cx - 2, 5, 5, 1);   // the tuft
    r(GL, cx - 4, 2, 3, 1); r(GL, cx - 3, 3, 3, 2); r(GL, cx - 2, 5, 2, 1);
    r(GD, cx + 3, 1, 3, 2); r(GD, cx + 2, 3, 2, 2); r(GD, cx, 1, 1, 3);
  } },

  // 17 x 12: dark glossy leaves with spiky edges, bunches of red berries
  holly: { approved: false, draw(r, rng, cx) {
    const G = grid(), c = '#2f5a36';
    leafy(G, rng, cx, c);
    prickles(G, rng, c); leaves(G, rng, c, 7);
    const R = '#d8303a', L = '#f05a60';
    spots(G, rng, 4 + Math.floor(rng() * 3), 2, 4, (x, y) => {
      G.set(x, y + 1, L, 3); G.set(x + 1, y + 1, R, 3); G.set(x, y, R, 3);
    });
    G.flush(r);
  } },

  // 14 x 18: a ribbed column with two arms bending up, a few spines, a pink flower on top
  cactus: { approved: false, draw(r, rng, cx) {
    const C = '#5a9a54', L = shade(C, 1.15), D = '#4a8044', DD = shade(D, 0.85), SP = '#d4e4a4', F = '#e870a0';
    const H = 15 + Math.floor(rng() * 2);
    const upright = (x, y0, h) => {                                                  // an arm's upright: lit, green, shaded; a round top
      r(L, x, y0, 1, h - 1); r(C, x + 1, y0, 1, h); r(DD, x + 2, y0, 1, h - 1);
    };
    const a = 5 + Math.floor(rng() * 2), ah = 5 + Math.floor(rng() * 2);
    const b = 7 + Math.floor(rng() * 3), bh = 4 + Math.floor(rng() * 2);
    r(C, cx - 5, a, 3, 2); r(D, cx - 5, a, 3, 1); upright(cx - 6, a + 1, ah);        // the left arm
    r(C, cx + 3, b, 3, 2); r(D, cx + 3, b, 3, 1); upright(cx + 4, b + 1, bh);        // the right arm
    r(L, cx - 2, 0, 1, H - 1); r(C, cx - 1, 0, 1, H); r(shade(C, 1.06), cx, 0, 1, H); r(D, cx + 1, 0, 1, H); r(DD, cx + 2, 0, 1, H - 1);   // the trunk, ribbed
    r(C, cx - 1, H, 2, 1); r(DD, cx - 2, 0, 5, 1);
    for (let up = 3; up < H - 2; up += 4) { r(SP, cx - 1, up, 1, 1); r(SP, cx + 1, up + 2, 1, 1); }   // spines
    r(SP, cx - 3, 3, 1, 1); r(SP, cx + 3, 12, 1, 1);
    r(F, cx - 1, H + 1, 3, 1); r(F, cx, H + 2, 1, 1); r(shade(F, 1.2), cx - 1, H + 2, 1, 1); r('#f2c230', cx, H + 1, 1, 1);   // the flower
    if (rng() < 0.4) { r(F, cx - 5, a + ah + 1, 2, 1); r(shade(F, 1.2), cx - 5, a + ah + 2, 1, 1); }   // a second on an arm
  } },
};
