// Tiny Voxel: draws a small 3D shape made of pixel-sized blocks the way the
// town is seen: walls at their full height, tops from above at 0.6 of their
// depth (like the buildings' roofs), from any heading. The vehicles and the
// people are drawn with it, so they turn round as one solid thing.
//
//   voxelSprite(get, box, heading, tone)
//       get(bu, bv, bz)  the colour of the block at u (along it, + its front),
//                        v (across it), z (up), or null; blocks are 1 x 1 x 1
//       box              { L, W, H }: how far it reaches (L along, W across, H up)
//       heading          degrees: 0 faces right, 90 towards you, 180 left, 270 away
//       tone(colour, f, face)  optional: change the shading of some colours
//     -> { canvas, ox, oy }: draw the canvas at (x - ox, y - oy) to stand its
//        middle on the ground at (x, y)
//   KY                  how much of a top shows (0.6 of its depth)
//
// Each pixel looks into the shape along the line of sight (from in front and
// above); the first block it meets gives its colour, shaded by the face it
// hit: tops light, faces towards the light (from the upper left) brighter,
// faces away darker. Plain ES module, no dependencies.

export const KY = 0.6;
const LIGHT = [-0.45, 0.89];
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');
const canvasOf = (w, h) => (typeof document !== 'undefined' ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : new OffscreenCanvas(w, h));

/** Draw a shape of blocks at a heading into a canvas of its own (see the top of the file). */
export function voxelSprite(get, box, heading, tone) {
  const th = (heading * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th);
  const hl = box.L / 2, hw = box.W / 2, top = box.H + 1;
  // the screen box: the corners of the shape
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  // skew: the camera a little to one side as well as above, so every block shows a side face too
  const sk = box.skew ?? 0;
  for (const u of [-hl, hl]) for (const v of [-hw, hw]) for (const z of [0, top]) {
    const Yw = u * sn + v * cs, X = u * cs - v * sn + Yw * sk, Y = Yw * KY - z;
    x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
  }
  x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 1; y1 = Math.ceil(y1) + 1;
  const w = x1 - x0, h = y1 - y0, cv = canvasOf(w, h), g = cv.getContext('2d');
  const off = box.centred ? 0.5 : 0;                   // blocks centred on whole numbers (u, v) instead of starting at them
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const Xs = x0 + px + 0.5, sy = y0 + py + 0.5;
    let prev = null;
    for (let z = top; z >= 0; z -= 0.2) {
      // the line of sight: Y * KY - z = sy, nearer to you as z rises (and, skewed, further to one side)
      const Y = (sy + z) / KY, X = Xs - Y * sk, u = X * cs + Y * sn, v = -X * sn + Y * cs;
      const bu = Math.floor(u + off), bv = Math.floor(v + off), bz = Math.floor(z);
      const col = get(bu, bv, bz);
      if (col) {
        let f = 1.1, face = 'top';
        if (prev && prev[2] === bz) {
          let n;
          if (prev[0] !== bu) { const s = prev[0] > bu ? 1 : -1; n = [s * cs, s * sn]; face = 'end'; }
          else { const s = prev[1] > bv ? 1 : -1; n = [-s * sn, s * cs]; face = 'side'; }
          f = (box.dark ?? 0.74) + (1 - (box.dark ?? 0.74) + 0.04) * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1]);
        }
        if (tone) f = tone(col, f, face);
        g.fillStyle = shade(col, f); g.fillRect(px, py, 1, 1);
        break;
      }
      prev = [bu, bv, bz];
    }
  }
  // an outline: 'inner' darkens the figure's own edge pixels, 'outer' adds a dark line round it
  if (box.outline) {
    const d = g.getImageData(0, 0, w, h), a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d.data[(y * w + x) * 4 + 3]);
    const out = g.createImageData(w, h); out.data.set(d.data);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, edge = !a(x - 1, y) || !a(x + 1, y) || !a(x, y - 1) || !a(x, y + 1);
      if (box.outline === 'inner' && a(x, y) && edge) for (let k = 0; k < 3; k++) out.data[i + k] = d.data[i + k] * 0.62;
      if (box.outline === 'outer' && !a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) { out.data.set([38, 34, 40, 255], i); }
    }
    g.putImageData(out, 0, 0);
  }
  return { canvas: cv, ox: -x0, oy: -y0 };
}
