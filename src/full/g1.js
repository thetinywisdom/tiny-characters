// Full-size ground, part 1: the streets and the railway, drawn on the town's pixels (one
// pattern pixel = one person pixel), on the same rectangles as oldStreets and oldRailway in
// tinyTown.js (roads, sidewalks, kerbs, lane lines, crossings, manholes; ballast, sleepers,
// rails, the level crossings), so lanes, walking, props and the trains stay where they were.
// Texture is a few quiet pixels on a fixed hash of the position (no random stream).

const PAVE = '#d8d2c4', JOINT = '#c4bdae', KERB = '#9a9890', KERB_TOP = '#e2ddd0';
const ROAD_C = '#6f7378', ROAD_D = '#6a6e73', ROAD_L = '#74787d', PAINT = '#e8e4d8';
const HOLE = '#55595e', LID = '#7a7e84', LID_D = '#6a6e73';

/** A whole-pixel hash of a position: the same pixel always gets the same number (0..1). */
function hash(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const painter = (g) => (col, x, y, w, h) => {
  const x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w), y1 = Math.round(y + h);
  if (x1 > x0 && y1 > y0) { g.fillStyle = col; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
};
/** Asphalt: the road's grey with a few slightly lighter and darker grains. */
function asphalt(R, x, y, w, h, base = ROAD_C, dark = ROAD_D, light = ROAD_L) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  R(base, x, y, w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = hash(x + i, y + j, 5);
    if (v < 0.025) R(dark, x + i, y + j, 1, 1); else if (v > 0.985) R(light, x + i, y + j, 1, 1);
  }
}
/** A zebra crossing's stripes along a run of `len` pixels: 3 on, 2 off, centred. Calls f(offset, size). */
function stripes(len, f) {
  const n = Math.max(1, Math.floor((len + 2) / 5)), used = n * 5 - 2, off = Math.floor((len - used) / 2);
  for (let i = 0; i < n; i++) f(off + i * 5, 3);
}
/** A manhole: a pixel-stepped oval rim with a lid of little studs. */
function manhole(R, x, y, w, h) {
  R(HOLE, x + 2, y, w - 4, h); R(HOLE, x + 1, y + 1, w - 2, h - 2); R(HOLE, x, y + 2, w, Math.max(1, h - 4));
  R(LID, x + 2, y + 1, w - 4, h - 2); R(LID, x + 1, y + 2, w - 2, Math.max(1, h - 4));
  for (let j = 1; j < h - 1; j++) for (let i = 2 + (j % 2); i < w - 2; i += 2) R(LID_D, x + i, y + j, 1, 1);
}

export const PART = {
  streets: {
    approved: false,
    draw(g, { W, streets, crossStreets, SIDE, ROAD, STREET, VSIDE, VSTREET, pad, m }) {
      const R = painter(g);
      W = Math.round(W);
      const y0 = streets[0], y1 = streets[streets.length - 1] + STREET, slab = m(8);
      // the cross streets' sidewalks: slabs with joints across, a kerb along the road
      for (const x of crossStreets) {
        R(PAVE, x, y0, VSTREET, y1 - y0);
        for (let y = y0 + slab; y < y1; y += slab) { R(JOINT, x, y, VSIDE - 2, 1); R(JOINT, x + VSIDE + ROAD + 2, y, VSIDE - 2, 1); }
      }
      for (const y of streets) {
        const by = y + SIDE + ROAD;                                         // the near sidewalk's first row
        R(PAVE, 0, y, W, SIDE); R(PAVE, 0, by, W, SIDE);
        for (let x = 0; x < W; x += slab) { R(JOINT, x, y, 1, SIDE - 2); R(JOINT, x, by + 2, 1, SIDE - 2); }
        // kerbs: a light kerb stone with joints, its dark edge on the road
        R(KERB_TOP, 0, y + SIDE - 2, W, 1); R(KERB_TOP, 0, by + 1, W, 1);
        for (let x = 0; x < W; x += slab * 2) { R(JOINT, x, y + SIDE - 2, 1, 1); R(JOINT, x, by + 1, 1, 1); }
        R(KERB, 0, y + SIDE - 1, W, 1); R(KERB, 0, by, W, 1);
        asphalt(R, 0, y + SIDE, W, ROAD);
        for (let x = 0; x < W; x += m(16)) R(PAINT, x, y + SIDE + Math.floor(ROAD / 2), m(8), 1);
        // manholes, here and there in the lanes (the old places)
        for (let x = pad + m(40) + (y % m(50)); x < W - pad - m(10); x += m(130)) {
          const mx = Math.round(x), my = y + SIDE + (Math.round(x / m(130)) % 2 ? m(4) : ROAD - m(7));
          manhole(R, mx, my, m(6), m(3));
        }
      }
      for (const x of crossStreets) {
        asphalt(R, x + VSIDE, y0 + SIDE, ROAD, y1 - y0 - SIDE * 2);
        // kerbs on both sides wherever the cross street's road meets its sidewalks
        for (let j = 0; j < streets.length - 1; j++) {
          const a = streets[j] + SIDE + ROAD, b = streets[j + 1] + SIDE;
          R(KERB, x + VSIDE - 1, a, 1, b - a); R(KERB, x + VSIDE + ROAD, a, 1, b - a);
          R(KERB_TOP, x + VSIDE - 2, a, 1, b - a); R(KERB_TOP, x + VSIDE + ROAD + 1, a, 1, b - a);
          for (let y = a + slab; y < b; y += slab * 2) { R(JOINT, x + VSIDE - 2, y, 1, 1); R(JOINT, x + VSIDE + ROAD + 1, y, 1, 1); }
        }
        // the centre line: dashes as long as the streets' (none where it crosses a street)
        for (let y = y0 + SIDE + 4; y < y1 - SIDE; y += m(16)) if (!streets.some((sy) => y + m(8) > sy && y < sy + STREET)) R(PAINT, x + VSIDE + Math.floor(ROAD / 2), y, 1, m(8));
        // crossings: over each street next to the cross street, and over the cross street next to each street
        for (const y of streets) {
          stripes(ROAD, (j, s) => R(PAINT, x - m(9), y + SIDE + j, m(7), s));
          stripes(ROAD, (j, s) => {
            if (y !== streets[0]) R(PAINT, x + VSIDE + j, y - m(6), s, m(5));
            if (y !== streets[streets.length - 1]) R(PAINT, x + VSIDE + j, y + STREET + 1, s, m(5));
          });
        }
      }
    },
  },

  railway: {
    approved: false,
    draw(g, rail, { W, crossStreets, VSIDE, VSTREET, ROAD, m }) {
      const R = painter(g);
      W = Math.round(W);
      const ry = Math.round(rail.y), rh = Math.round(rail.h);
      const top = ry + Math.round(rh * 0.2), bot = ry + Math.round(rh * 0.72), step = m(4), sw = m(2);
      const onCross = (x) => crossStreets.some((sx) => x >= sx && x < sx + VSTREET);
      // the ballast: grey stones, a few lighter and darker, a darker edge top and bottom
      R('#9a958a', 0, ry, W, rh);
      for (let j = 1; j < rh - 1; j++) for (let x = 0; x < W; x++) {
        const v = hash(x, ry + j, 9);
        if (v < 0.06) R('#8c877c', x, ry + j, 1, 1); else if (v > 0.95) R('#aaa599', x, ry + j, 1, 1);
      }
      R('#8a857a', 0, ry, W, 1); R('#8e897e', 0, ry + rh - 1, W, 1);
      // sleepers on an even step: wood with a lit top and a dark side, a plate under each rail
      for (let x = 0; x < W; x += step) {
        if (onCross(x)) continue;
        R('#6a5040', x, ry + m(2), sw, rh - m(4));
        R('#7a5e4c', x, ry + m(2), sw, 1); R('#5a4234', x + sw - 1, ry + m(2) + 1, 1, rh - m(4) - 1);
        for (const y of [top, bot]) { R('#55595e', x, y - 1, sw, 1); R('#55595e', x, y + 2, sw, 1); }
      }
      // the level crossings: the cross street's sidewalks (slabs) and road (boards with joints) over the track
      for (const sx of crossStreets) {
        R('#d8d2c4', sx, ry, VSTREET, rh);
        for (let y = ry + 6; y < ry + rh; y += m(8)) { R(JOINT, sx, y, VSIDE - 1, 1); R(JOINT, sx + VSIDE + ROAD + 1, y, VSIDE - 1, 1); }
        R(KERB, sx + VSIDE - 1, ry, 1, rh); R(KERB, sx + VSIDE + ROAD, ry, 1, rh);
        R('#5a5e62', sx + VSIDE, ry, ROAD, rh);
        for (let i = Math.round(ROAD / 3); i < ROAD - 1; i += Math.round(ROAD / 3)) R('#4e5256', sx + VSIDE + i, ry, 1, rh);
        for (const y of [top, bot]) R('#45494d', sx + VSIDE, y + 2, ROAD, 1);   // the flangeway beside each rail
      }
      // two rails right across: a lit top, a darker side (the trains run on these rows)
      for (const y of [top, bot]) { R('#c8ccd0', 0, y, W, 1); R('#7a7e84', 0, y + 1, W, 1); }
      for (const sx of crossStreets) for (const y of [ry - 1, ry + rh]) for (let x = sx; x < sx + VSTREET; x += step) R(x % (step * 2) < step ? '#f2c230' : '#2f3236', x, y, Math.min(step, sx + VSTREET - x), 1);   // striped edges
    },
  },
};
