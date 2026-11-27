// Full-size terrains: one pattern pixel = one canvas pixel (= one person pixel).
// Each draw fills the rectangle (canvas pixels, already clipped by drawTerrain) with
// the same base colour as the old terrain and calm marks on regular steps. Marks sit on
// a grid fixed to the canvas (not to the rectangle), each picked by a hash of its cell
// and the seed, so two patches of the same ground meet without a seam and a bigger or
// smaller patch does not reshuffle the marks that were already there.

/** A number in [0, 1) for a cell (i, j), a seed and a salt. */
function hash(i, j, s, k = 0) {
  let a = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul((s | 0) + 0x9e37, 0x85ebca6b) ^ Math.imul(k + 1, 0xc2b2ae35);
  a = Math.imul(a ^ (a >>> 15), 0x2c1b3c6d);
  a = Math.imul(a ^ (a >>> 12), 0x297a2d39);
  return ((a ^ (a >>> 15)) >>> 0) / 4294967296;
}
/** A painter for one call: whole-pixel rectangles, the area's bounds and a grid walker. */
function painter(g, { x, y, w, h, seed }) {
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.ceil(x + w), y1 = Math.ceil(y + h);
  const P = (col, px, py, pw = 1, ph = 1) => { g.fillStyle = col; g.fillRect(Math.round(px), Math.round(py), pw, ph); };
  /** Call fn(cx, cy, i, j) for each grid cell (sx x sy, rows shifted by `stagger`) that may touch the area (with a margin). */
  const cells = (sx, sy, fn, stagger = 0, margin = 8) => {
    for (let j = Math.floor((y0 - margin) / sy); j * sy < y1 + margin; j++) {
      const off = stagger ? (((j % 2) + 2) % 2) * stagger : 0;
      for (let i = Math.floor((x0 - margin - off) / sx); i * sx + off < x1 + margin; i++) fn(i * sx + off, j * sy, i, j);
    }
  };
  const H = (i, j, k) => hash(i, j, seed, k);
  return { x0, y0, x1, y1, P, cells, H, fill: (col) => P(col, x0, y0, x1 - x0, y1 - y0) };
}

// --- the grounds ---------------------------------------------------------------------
const GRASS = '#9fb08d', GRASS_D = '#93a582', GRASS_L = '#aabb98';
/** Quiet lawn marks: in each 12 x 8 cell, now and then a little tuft or a light blade. */
function lawn(P, cells, H, dark = GRASS_D, light = GRASS_L, n = 0.72) {
  cells(12, 8, (cx, cy, i, j) => {
    if (H(i, j, 1) > n) return;
    const px = cx + Math.floor(H(i, j, 2) * 9), py = cy + Math.floor(H(i, j, 3) * 6), v = H(i, j, 4);
    if (v < 0.35) { P(dark, px, py + 1, 3, 1); P(dark, px + 1, py); }        // a tuft: three at the root, one blade up
    else if (v < 0.7) P(light, px, py, 3, 1);                                  // a light blade lying down
    else { P(dark, px, py, 2, 1); P(light, px + 2, py); }                      // a dark one, its tip in the light
  });
}

const FLOWERS = [['#f2efe8', '#f2c230'], ['#f2c230', '#f8e8a0'], ['#e870a0', '#f2efe8'], ['#9a7ac8', '#f2efe8']];
const TUFT = '#7a9466', TUFT_L = '#a8bc90';

export const PART = {
  grass: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill(GRASS); lawn(P, cells, H);
    },
  },
  meadow: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill('#a4b48e'); lawn(P, cells, H, GRASS_D, '#b0c09c', 0.5);
      cells(14, 10, (cx, cy, i, j) => {                                      // little flowers: four petals round an eye, a stem
        if (H(i, j, 11) > 0.62) return;
        const px = cx + 1 + Math.floor(H(i, j, 12) * 10), py = cy + 1 + Math.floor(H(i, j, 13) * 5);
        const [pet, eye] = FLOWERS[Math.floor(H(i, j, 14) * FLOWERS.length)];
        if (H(i, j, 15) < 0.35) { P(pet, px, py); P('#86a072', px, py + 1); return; }   // a bud
        P('#86a072', px + 1, py + 3);
        P(pet, px + 1, py); P(pet, px, py + 1); P(pet, px + 2, py + 1); P(pet, px + 1, py + 2); P(eye, px + 1, py + 1);
      }, 7);
    },
  },
  tallGrass: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill('#8fa47a');
      cells(8, 8, (cx, cy, i, j) => {                                        // a tuft in every cell, shifted a little: three blades
        const px = cx + Math.floor(H(i, j, 21) * 4), py = cy + Math.floor(H(i, j, 22) * 3);
        P(TUFT, px, py + 1, 1, 3); P(TUFT, px + 2, py, 1, 4); P(TUFT_L, px + 1, py + 2, 1, 2);
        if (H(i, j, 23) < 0.3) P(TUFT_L, px + 2, py);                          // a sunlit tip now and then
      }, 4);
    },
  },
  dirt: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill('#a88a68');
      cells(9, 7, (cx, cy, i, j) => {                                        // fine grains: one per cell, darker or lighter, now and then a pair
        const v = H(i, j, 33), px = cx + Math.floor(H(i, j, 31) * 8), py = cy + Math.floor(H(i, j, 32) * 6);
        if (v < 0.5) P('#967858', px, py); else if (v < 0.8) P('#b89a78', px, py); else { P('#967858', px, py, 2, 1); P('#b89a78', px, py - 1); }
      }, 4);
      cells(22, 14, (cx, cy, i, j) => {                                      // a pebble now and then: lit on top, a shadow under
        if (H(i, j, 36) > 0.45) return;
        const px = cx + Math.floor(H(i, j, 37) * 18), py = cy + Math.floor(H(i, j, 38) * 11), big = H(i, j, 39) < 0.4;
        const [body, top] = H(i, j, 40) < 0.5 ? ['#a8a090', '#c8b498'] : ['#9a8a74', '#b8a688'];
        P(body, px, py, big ? 4 : 3, 2); P(top, px + 1, py, big ? 2 : 1, 1); P('#8a7056', px + 1, py + 2, big ? 3 : 2, 1);
      });
    },
  },
  sand: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill('#e6d2a0');
      cells(20, 9, (cx, cy, i, j) => {                                       // wind ripples: a long low ridge, light on its top, trailing off
        const px = cx + Math.floor(H(i, j, 41) * 4), py = cy + 4, n = 6 + Math.floor(H(i, j, 42) * 4);
        P('#d8c290', px, py, n, 1); P('#d8c290', px + n, py + 1, 2, 1);
        P('#f0e0b8', px + 1, py - 1, n - 3, 1);
      }, 10);
      cells(9, 7, (cx, cy, i, j) => {                                        // a few light grains
        if (H(i, j, 43) < 0.35) P('#f0e0b8', cx + Math.floor(H(i, j, 44) * 9), cy + Math.floor(H(i, j, 45) * 7));
      });
    },
  },
  gravel: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill('#c8c2b4');
      cells(5, 4, (cx, cy, i, j) => {                                        // a small stone in every cell: lit top, a shadow under
        const px = cx + Math.floor(H(i, j, 51) * 4), py = cy + Math.floor(H(i, j, 52) * 3), v = H(i, j, 53);
        if (v < 0.4) { P('#dcd6c8', px, py, 2, 1); P('#a8a294', px + 1, py + 1); }
        else if (v < 0.7) P('#b0aa9c', px, py);
        else if (v < 0.85) { P('#d4cec0', px, py); P('#a09a8c', px, py + 1); }
        else P('#bcb6a8', px, py, 2, 1);
      }, 2);
    },
  },
  cobble: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill('#8f8a80');                                                       // the joints
      cells(12, 8, (cx, cy, i, j) => {                                       // stones 10 x 6, rows shifted by half a stone, round corners
        const v = H(i, j, 61), body = v < 0.33 ? '#b8b2a6' : v < 0.66 ? '#aaa498' : '#c4beb2';
        P(body, cx + 1, cy, 8, 6); P(body, cx, cy + 1, 10, 4);
        P('#d4cec2', cx + 1, cy, 8, 1); P('#d4cec2', cx, cy + 1, 1, 2);       // light on the top and the left
        P('#9c968a', cx + 1, cy + 5, 8, 1); P('#9c968a', cx + 9, cy + 2, 1, 3);  // a shade on the bottom and the right
        if (H(i, j, 62) < 0.25) P('#a09a8e', cx + 2 + Math.floor(H(i, j, 63) * 6), cy + 2 + Math.floor(H(i, j, 64) * 2), 2, 1);   // a worn spot
      }, 6);
    },
  },
  water: {
    approved: false,
    // ripples on a 18 x 9 grid; each one breathes and drifts by whole pixels with t, at its own pace
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a), t = a.t ?? 0;
      fill('#6a9ac0');
      cells(18, 9, (cx, cy, i, j) => {
        const ph = H(i, j, 71) * 6.283, sp = 1.1 + H(i, j, 72) * 0.8;
        const dx = Math.round(2.4 * Math.sin(t * sp * 0.6 + ph)), n = 4 + Math.round(1.6 + 1.6 * Math.sin(t * sp + ph * 1.7));
        const px = cx + Math.floor(H(i, j, 73) * 6) + dx, py = cy + 3;
        P('#8ab8d8', px, py, n, 1);
        if (n >= 6) P('#5e8eb4', px + 1, py + 1, n - 2, 1);                    // a full ripple shows its trough under it
        if (Math.sin(t * sp * 1.3 + ph * 3) > 0.93) P('#c8e0f0', px + (n >> 1), py);   // the sun catches its crest now and then
      }, 9);
    },
  },
  snow: {
    approved: false,
    draw(g, a) {
      const { P, cells, H, fill } = painter(g, a);
      fill('#eef2f4');
      cells(8, 6, (cx, cy, i, j) => {                                        // fine sparkle and shade, one per cell
        const v = H(i, j, 81);
        if (v < 0.5) P(v < 0.25 ? '#ffffff' : '#dce4ec', cx + Math.floor(H(i, j, 82) * 8), cy + Math.floor(H(i, j, 83) * 6));
      }, 4);
      cells(24, 14, (cx, cy, i, j) => {                                      // a soft drift: white on top, a blue shade under
        if (H(i, j, 84) > 0.5) return;
        const px = cx + Math.floor(H(i, j, 85) * 16), py = cy + 2 + Math.floor(H(i, j, 86) * 9), n = 4 + Math.floor(H(i, j, 87) * 3);
        P('#ffffff', px + 1, py, n - 2, 1); P('#dce4ec', px, py + 1, n, 1); P('#c8d4e0', px + 1, py + 2, n - 2, 1);
      });
    },
  },
  paddy: {
    approved: false,
    draw(g, a) {
      const { P, cells, fill } = painter(g, a);
      fill('#7a8a6a');                                                       // muddy water
      cells(8, 8, (cx, cy) => P('#869676', cx + 1, cy + 6, 4, 1));             // a glint on the water between the plants
      cells(8, 8, (cx, cy) => {                                              // rows of rice: a stalk and two leaves, light at the tips
        const px = cx + 3, py = cy + 1;
        P('#6aa04a', px, py + 1, 1, 3); P('#6aa04a', px + 1, py + 2);
        P('#8ac060', px, py); P('#8ac060', px - 1, py + 1);
      });
    },
  },
};
