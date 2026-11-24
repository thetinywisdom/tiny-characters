// Tiny Voxel: draws a small 3D shape made of pixel-sized blocks the way the
// town is seen: walls at their full height, tops from above at 0.6 of their
// depth (like the buildings' roofs), from any heading. The vehicles are drawn
// with it, so they turn round as one solid thing.
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
// faces away darker. Plain ES module.

import { canvasOf, shade } from './tinyCharacters.js';

export const KY = 0.6;
const LIGHT = [-0.45, 0.89];

/** Draw a shape of blocks at a heading into a canvas of its own (see the top of the file). */
export function voxelSprite(get, box, heading, tone) {
  const th = (heading * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th);
  const hl = box.L / 2, hw = box.W / 2, top = box.H + 1;
  // the screen box: the corners of the shape
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const u of [-hl, hl]) for (const v of [-hw, hw]) for (const z of [0, top]) {
    const X = u * cs - v * sn, Y = (u * sn + v * cs) * KY - z;
    x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
  }
  x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 1; y1 = Math.ceil(y1) + 1;
  const w = x1 - x0, h = y1 - y0, cv = canvasOf(w, h), g = cv.getContext('2d');
  const off = box.centred ? 0.5 : 0;                   // blocks centred on whole numbers (u, v) instead of starting at them
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const X = x0 + px + 0.5, sy = y0 + py + 0.5;
    let prev = null;
    for (let z = top; z >= 0; z -= 0.2) {
      // the line of sight: Y * KY - z = sy, nearer to you as z rises
      const Y = (sy + z) / KY, u = X * cs + Y * sn, v = -X * sn + Y * cs;
      const bu = Math.floor(u + off), bv = Math.floor(v + off), bz = Math.floor(z);
      const col = get(bu, bv, bz);
      if (col) {
        let f = 1.1, face = 'top';
        if (prev && prev[2] === bz) {
          let n;
          if (prev[0] !== bu) { const s = prev[0] > bu ? 1 : -1; n = [s * cs, s * sn]; face = 'end'; }
          else { const s = prev[1] > bv ? 1 : -1; n = [-s * sn, s * cs]; face = 'side'; }
          f = 0.74 + 0.3 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1]);
        }
        if (tone) f = tone(col, f, face);
        g.fillStyle = shade(col, f); g.fillRect(px, py, 1, 1);
        break;
      }
      prev = [bu, bv, bz];
    }
  }
  return { canvas: cv, ox: -x0, oy: -y0 };
}
