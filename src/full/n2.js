// Full-size trees, part 2: palm, weeping willow, ginkgo, bamboo, apple tree, poplar,
// cypress, bare winter tree. Drawn at the town's size (one pixel = one person pixel):
// r(colour, dx, up, w, h) from the image's plant-left, `up` above the foot; cx the middle.
import { shade } from '../tinyCharacters.js';

const BARK = '#6b4a2a', DARK_BARK = '#4a3424';

// --- local pieces ------------------------------------------------------------------
const px = (r, c, x, y) => r(c, x, y, 1, 1);
const pick = (rng, list) => list[Math.floor(rng() * list.length)];

/**
 * A clump of leaves: an ellipse lit from the upper left, shaded to the lower right, a
 * darker rim underneath and a small highlight cluster; `bump` scallops its edge.
 */
function clump(r, cx, cy, rx, ry, c, bump = 0) {
  const L = shade(c, 1.16), D = shade(c, 0.8), DD = shade(c, 0.66), H = shade(c, 1.32);
  for (let j = -ry; j <= ry; j++) {
    let hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
    if (bump && hw > 2 && Math.abs(j) < ry - 1 && ((j + ry) % 4 === 1 || (j + ry) % 4 === 2)) hw += 1;   // scalloped edge
    const y = cy + j, v = j / ry;
    let run = null, x0 = 0;
    for (let x = cx - hw; x <= cx + hw + 1; x++) {
      let col = null;
      if (x <= cx + hw) {
        const u = (x - cx) / Math.max(1, rx), lit = -u * 0.6 + v * 0.8;
        col = j === -ry || (j === -ry + 1 && Math.abs(x - cx) >= hw - 1) ? DD
          : lit > 0.42 ? L : lit < -0.62 ? D : c;
        if (x === cx + hw && hw > 1 && col !== DD) col = D;
      }
      if (col !== run) { if (run) r(run, x0, y, x - x0, 1); run = col; x0 = x; }
    }
  }
  if (rx >= 3 && ry >= 2) {                                                // a small shine
    const hx = cx - Math.round(rx * 0.45), hy = cy + Math.round(ry * 0.45);
    r(H, hx, hy, 2, 1); px(r, H, hx, hy - 1);
  }
}
/** A filled ellipse in one colour (the shadowed mass behind the clumps). */
function mass(r, cx, cy, rx, ry, c) {
  for (let j = -ry; j <= ry; j++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
    r(c, cx - hw, cy + j, hw * 2 + 1, 1);
  }
}
/** A straight pixel line (x0, y0) -> (x1, y1), w px wide. */
function line(r, c, x0, y0, x1, y1, w = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) r(c, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, 1);
}
/** A trunk w px wide with a lit left edge, a shaded right edge and a flared foot. */
function bole(r, cx, h, c = BARK, w = 3, flare = true) {
  const x = cx - Math.floor(w / 2);
  r(c, x, 0, w, h); r(shade(c, 0.75), x + w - 1, 0, 1, h); r(shade(c, 1.18), x, 0, 1, h);
  if (flare) { r(shade(c, 0.85), x - 1, 0, 1, 2); r(shade(c, 0.7), x + w, 0, 1, 2); }
}

// --- the trees -----------------------------------------------------------------------
export const PART = {
  // 29 x 36: a ringed trunk leaning right, a crown of feathered fronds, coconuts
  palm: { approved: false, draw(r, rng, cx) {
    const T = '#b89a6a', TD = '#8a7048', TL = '#ccb084', top = 27, lean = 5;
    let tx = cx;
    for (let y = 0; y < top; y++) {                                          // the ringed trunk
      tx = cx - 2 + Math.round(lean * Math.pow(y / top, 1.6));
      const ring = y % 3 === 2;
      r(ring ? TD : T, tx, y, 3, 1); if (!ring) { px(r, TL, tx, y); px(r, shade(T, 0.86), tx + 2, y); }
    }
    r(TD, cx - 3, 0, 5, 1);                                                  // its foot
    const ox = tx + 1, oy = top + 1;
    const G = '#4a8a4e', GD = '#3a7040', GL = '#62a45a';
    const frond = (ex, ey, lift, col, under) => {                            // a frond: a curved spine, leaflets below
      const seen = new Set(), pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, x = Math.round((1 - t) * (1 - t) * ox + 2 * t * (1 - t) * (ox + ex * 0.5) + t * t * (ox + ex));
        const y = Math.round((1 - t) * (1 - t) * oy + 2 * t * (1 - t) * (oy + lift) + t * t * (oy + ey));
        const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); pts.push([x, y]); }
      }
      const dir = Math.sign(ex) || 1, n = pts.length;
      pts.forEach(([x, y], i) => {
        if (i > 0 && i < n * 0.75) px(r, under, x, y - 1);                  // two thick, thinning to the tip
        if (i > 1 && i % 3 === 1 && i < n - 1) px(r, under, x + dir, y - 2);   // leaflets hanging from it
        px(r, col, x, y);
      });
    };
    const v = () => Math.floor(rng() * 3) - 1;                              // each variant's fronds differ a little
    if (rng() < 0.45) {                                                      // a dry frond hanging down
      const s = rng() < 0.5 ? -1 : 1;
      line(r, '#8a7a4a', ox + s, oy - 1, ox + s * 3, oy - 7); px(r, '#a8945a', ox + s * 2, oy - 4); px(r, '#6a5a3a', ox + s * 4, oy - 6);
    }
    frond(-11 + v(), -8 + v(), 3, GD, shade(GD, 0.8));                      // lower fronds, behind
    frond(11 + v(), -8 + v(), 3, GD, shade(GD, 0.8));
    const nuts = 2 + Math.floor(rng() * 3);                                  // coconuts under the crown
    for (let i = 0; i < nuts; i++) {
      const x = ox - 2 + [0, 2, 1, 3][i] - (i === 3 ? 4 : 0), y = oy - 3 - (i === 2 ? 1 : 0);
      r('#6a4a2a', x, y, 2, 2); px(r, '#8a6a3a', x, y + 1); px(r, '#4a3424', x + 1, y);
    }
    frond(-10 + v(), -2 + v(), 5, G, GD);                                    // the middle fronds
    frond(10 + v(), -2 + v(), 5, G, GD);
    frond(-5, 6, 6, GL, G);                                                  // and the top ones, lit
    frond(5, 5 + v(), 6, G, GD);
    r(GD, ox - 1, oy - 1, 3, 2); px(r, GL, ox - 1, oy);                      // the heart of the crown
  } },

  // 32 x 30: a dome on a forked trunk, curtains of strands hanging to the ground
  willow: { approved: false, draw(r, rng, cx) {
    bole(r, cx, 16, BARK, 3);
    const C = '#8aa85a', S1 = '#7a9a4e', S2 = '#9ab86a', cy = 21, rx = 13, ry = 7;
    const edge = (i) => { const a = Math.abs(i) / (rx + 0.5); return Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - a * a))); };
    for (let i = -12; i <= 12; i += 2) {                                     // strands behind, darker
      if (Math.abs(i) <= 2) continue;
      const x = cx + i + (i < 0 ? 1 : -1), bottom = 6 + Math.floor(rng() * 4);
      r(shade(S1, 0.86), x, bottom, 1, edge(i) - bottom + 1);
    }
    clump(r, cx, cy, rx, ry, C, 1);                                          // the dome
    for (const [x, y, w] of [[-8, 2, 3], [-3, 4, 4], [3, 1, 3], [7, 3, 2], [-1, -1, 3]]) {   // drooping tufts on the dome
      r(shade(C, 0.84), cx + x, cy + y - 1, w, 1); px(r, shade(C, 0.84), cx + x - 1, cy + y - 2); px(r, shade(C, 0.84), cx + x + w, cy + y - 2);
    }
    for (let i = -12; i <= 12; i += 2) {                                     // the curtain in front
      if (Math.abs(i) <= 1) continue;                                        // the trunk shows through
      const top = edge(i) + 3 + (Math.abs(i) % 4 === 2 ? 2 : 0), bottom = 3 + (Math.abs(i) % 3) + Math.floor(rng() * 3);
      const col = i % 4 ? S1 : S2;
      r(shade(col, 0.88), cx + i, top - 2, 1, 2);                            // where it leaves the dome
      r(col, cx + i, bottom, 1, top - 2 - bottom);
      r(shade(col, 1.1), cx + i, top - 5, 1, 2);                             // a lit stretch
      px(r, shade(col, 0.82), cx + i, bottom);                               // its tip
    }
  } },

  // 23 x 33: an upright crown of golden clumps on a straight trunk, fallen leaves
  ginkgo: { approved: false, draw(r, rng, cx) {
    bole(r, cx, 13, BARK, 3);
    const Y = '#e8c040', YL = '#f2d860', YD = '#c8a030';
    mass(r, cx, 21, 8, 11, shade(Y, 0.7));
    line(r, BARK, cx, 12, cx - 3, 16); line(r, BARK, cx, 12, cx + 3, 17);  // branches in the gaps
    const k = rng() < 0.5 ? 0 : 1;                                           // the clumps sit a little differently
    clump(r, cx - 4, 15, 4, 3, shade(Y, 0.88)); clump(r, cx + 4, 16 - k, 4, 3, shade(Y, 0.86));
    clump(r, cx + 4, 22, 4, 4, shade(Y, 0.94)); clump(r, cx - 4, 21 + k, 4, 4, shade(Y, 0.98));
    clump(r, cx, 18, 4, 3, shade(Y, 0.95));
    clump(r, cx + 2, 27, 4, 3, shade(Y, 1.0)); clump(r, cx - 2, 26 - k, 4, 4, Y);
    clump(r, cx, 30, 3, 2, shade(Y, 1.04));
    for (let i = 0; i < 4; i++) {                                            // fans of leaves catching the light
      const x = cx - 6 + Math.floor(rng() * 6) * 2, y = 16 + Math.floor(rng() * 6) * 2;
      if (((x - cx) / 7) ** 2 + ((y - 21) / 9) ** 2 > 0.8) continue;
      r(YL, x, y, 2, 1); px(r, YL, x, y + 1);
    }
    for (let i = 0; i < 5; i++) {                                            // leaves on the ground
      const x = cx - 10 + Math.floor(rng() * 10) * 2;
      if (Math.abs(x - cx) < 2) continue;
      r(i % 2 ? YL : Y, x, 0, 2, 1); if (i % 3 === 0) px(r, YD, x + 1, 0);
    }
  } },

  // 23 x 39: four jointed stalks, slender leaves at the tops and on side twigs
  bamboo: { approved: false, draw(r, rng, cx) {
    const S = '#6aa04a', SD = '#4f8038', SL = '#8ac060', N = '#4a7a34', LF = '#5a9a44', LFL = '#7ab45a', LFD = '#467a36';
    const stalks = [[-7, 30], [-3, 36], [2, 33], [6, 28]];
    const leaf = (x, y, dir, len, c) => { for (let k = 0; k < len; k++) px(r, c, x + dir * k, y - (k >= len - 1 ? 1 : 0)); };
    stalks.forEach(([dx, h0], s) => {
      const h = h0 - Math.floor(rng() * 2), x = cx + dx, back = s === 0 || s === 3;
      const c = back ? shade(S, 0.86) : S;
      r(c, x, 0, 2, h); r(back ? c : SL, x, 0, 1, h); r(back ? shade(SD, 0.9) : SD, x + 1, 0, 1, h);
      for (let y = 5 + (s % 2) * 2; y < h - 2; y += 6) r(back ? shade(N, 0.9) : N, x, y, 2, 1);   // the joints
      leaf(x - 1, h - 1, -1, 5, LF); leaf(x + 2, h, 1, 4, LFL); leaf(x, h + 1, -1, 3, LFL); px(r, LF, x + 1, h + 1);   // the top's spray
      const y = Math.round(h * 0.6) + Math.floor(rng() * 4), dir = s < 2 ? -1 : 1;   // a side twig with leaves
      if (rng() < 0.7) { leaf(dir < 0 ? x - 1 : x + 2, y, dir, 4, rng() < 0.5 ? LF : LFD); px(r, LFL, (dir < 0 ? x - 1 : x + 2) + dir, y + 1); }
    });
    if (rng() < 0.4) {                                                       // a young shoot
      const x = cx + pick(rng, [-10, -5, 4, 9]);
      r('#8a7a4a', x, 0, 3, 2); r('#a8945a', x, 0, 1, 2); r('#8a7a4a', x + 1, 2, 1, 2); px(r, '#a8b46a', x + 1, 4);
    }
  } },

  // 26 x 27: a round crown of clumps on a forked trunk, apples with a shine
  apple: { approved: false, draw(r, rng, cx) {
    bole(r, cx, 11, BARK, 3);
    line(r, BARK, cx - 1, 10, cx - 5, 14, 2); line(r, shade(BARK, 0.8), cx + 1, 10, cx + 5, 15, 2);
    const G = '#5f9a4a';
    mass(r, cx, 18, 11, 8, shade(G, 0.68));
    clump(r, cx - 5, 15, 6, 4, shade(G, 0.92), 1); clump(r, cx + 5, 16, 6, 4, shade(G, 0.88), 1);
    clump(r, cx - 3, 21, 6, 4, G, 1); clump(r, cx + 4, 21, 5, 4, shade(G, 0.97), 1);
    clump(r, cx, 24, 4, 2, shade(G, 1.03));
    const placed = [];
    for (let tries = 0; placed.length < 9 && tries < 60; tries++) {          // apples, not touching
      const x = cx + Math.round((rng() * 2 - 1) * 9), y = 18 + Math.round((rng() * 2 - 1) * 6);
      if (((x - cx) / 10) ** 2 + ((y - 18) / 7) ** 2 > 0.85 || placed.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - y) < 4)) continue;
      placed.push([x, y]);
      const c = rng() < 0.65 ? '#d8443c' : '#e8603a';
      r(c, x, y, 2, 2); px(r, shade(c, 0.72), x + 1, y); px(r, shade(c, 1.35), x, y + 1);
    }
    if (rng() < 0.4) { const x = cx + pick(rng, [-8, -6, 5, 7]); r('#d8443c', x, 0, 2, 2); px(r, '#f08070', x, 1); px(r, '#a8302a', x + 1, 0); }   // a fallen apple
  } },

  // 14 x 42: a tall column of stacked clumps on a short trunk
  poplar: { approved: false, draw(r, rng, cx) {
    bole(r, cx, 9, BARK, 3, false);
    const G = '#5f9a4e', D = shade(G, 0.8), DD = shade(G, 0.66), L = shade(G, 1.16), H = shade(G, 1.3);
    const lean = rng() < 0.5 ? 0 : 1;
    for (let y = 7; y <= 41; y++) {                                          // a tall column, blunt below, pointed on top
      const t = (y - 7) / 34, f = t < 0.38 ? (0.38 - t) / 0.41 : (t - 0.38) / 0.64;
      const hw = Math.round(5.2 * Math.sqrt(Math.max(0, 1 - f * f))), x0 = cx - hw;
      for (let x = 0; x <= hw * 2; x++) {
        const u = (x - hw) / 5, lit = -u * 0.8 + (t - 0.4) * 0.8;
        const c = y <= 8 ? DD : x === hw * 2 && hw > 0 ? D : lit > 0.3 ? L : lit < -0.45 ? D : G;
        px(r, c, x0 + x, y);
      }
    }
    for (let y = 11 + Math.floor(rng() * 3), k = 0; y < 37; y += 4 + (k % 2), k++) {   // tufts: a shadow under each
      const left = (k + lean) % 2 === 0, x = cx + (left ? -3 : 0) + (y > 30 ? (left ? 1 : 0) : 0);
      r(D, x, y, 3, 1); px(r, D, left ? x - 0 : x + 3, y + 1);
      if (left) px(r, L, x + 1, y + 1);
    }
    r(H, cx - 3, 26, 1, 3); px(r, H, cx - 2, 29);                            // a shine on the lit side
  } },

  // 14 x 38: a dark flame of twisting foliage
  cypress: { approved: false, draw(r, rng, cx) {
    bole(r, cx, 5, DARK_BARK, 2, false);
    const C = '#355a40', D = '#2a4a34', DD = '#22402c', L = '#44704e', H = '#548258';
    const tip = rng() < 0.5 ? -1 : rng() < 0.5 ? 1 : 0, phase = Math.floor(rng() * 5);
    for (let k = 0; k < 33; k++) {
      const y = 4 + k, t = k / 32;
      const hw = k < 7 ? Math.min(4, 2 + Math.floor(k / 2)) : Math.round(5 * Math.pow(Math.max(0, 1 - (k - 7) / 26), 0.75));
      const off = Math.round(tip * t * t * 2);
      for (let x = -hw; x <= hw; x++) {
        const band = (k + phase + Math.floor((x + hw) / 2) * 2) % 6;
        let c = band === 0 ? D : band === 1 && x > -hw ? DD : C;
        if (x === hw) c = D;
        else if (x <= -hw + 1 && band > 2) c = L;
        if (k === 0) c = DD;
        px(r, c, cx + off + x, y);
      }
    }
    for (const [x, y] of [[-3, 16], [-2, 23], [-1, 30]]) { r(H, cx + x, y, 2, 1); px(r, L, cx + x, y - 1); }   // light on the left
  } },

  // 26 x 30: a bare trunk opening into a fan of branches, twigs at their tips
  bare: { approved: false, draw(r, rng, cx) {
    const B = '#5a4a3a', BD = shade(B, 0.78), BL = shade(B, 1.2), T = shade(B, 1.08);
    bole(r, cx, 15, B, 3);
    const fork = 15, limbs = [[-9, 13], [-4, 15], [0, 14], [4, 15], [9, 13]];
    limbs.forEach(([ex, ey], i) => {
      const x1 = cx + ex + (i !== 2 ? Math.floor(rng() * 2) * Math.sign(ex) : 0), y1 = fork + ey - Math.floor(rng() * 2);
      const mid = [Math.round((cx + x1) / 2), Math.round(fork + (y1 - fork) * 0.5)];
      line(r, i < 2 ? B : i > 2 ? BD : B, cx - (i < 2 ? 1 : i > 2 ? -1 : 0), fork - 1, mid[0], mid[1], 2);   // the thick part
      line(r, B, mid[0], mid[1], x1, y1);                                    // the thin part
      if (i < 2) px(r, BL, mid[0], mid[1]);
      const dir = Math.sign(ex) || (rng() < 0.5 ? -1 : 1);                   // a twig or two off it
      const ty = mid[1] + 2 + Math.floor(rng() * 3), tx = Math.round(cx + (x1 - cx) * (ty - fork) / (y1 - fork));
      line(r, T, tx, ty, tx + dir * 2, ty + 3);
      px(r, BD, x1 - dir, y1 + 1); px(r, BD, x1 + (dir || 1), y1 + 1);       // forked tip
    });
    if (rng() < 0.4) {                                                       // a last dry leaf or two
      const x = cx + pick(rng, [-7, -3, 3, 7]), y = 22 + Math.floor(rng() * 4);
      r('#a8784a', x, y, 2, 1); px(r, '#8a5a34', x + 1, y - 1);
    }
    if (rng() < 0.3) {                                                       // a crow's old nest in a fork
      const x = cx + pick(rng, [-4, 2]), y = 21;
      r('#4a3a2a', x, y, 4, 2); r('#6a5440', x, y + 1, 4, 1); px(r, '#7a644e', x + 1, y + 1);
    }
  } },
};
