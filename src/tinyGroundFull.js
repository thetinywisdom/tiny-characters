// Tiny ground at full size: the town's ground pieces drawn again at the town's size, every
// pattern pixel one person pixel (the old ones used 2-pixel cells at scale 1.5), with
// pixel-stepped curves instead of the canvas's soft ellipses.
//
//   FULL_GROUND   name -> { approved, draw(...) }: used by drawGround (tinyTown.js) instead of
//                 the old piece once approved (setRedraw / ?redraw=all):
//     streets         draw(g, dims)                 sidewalks, kerbs, roads, lane lines, crossings, manholes
//     railway         draw(g, rail, dims)           ballast, sleepers, rails, the level crossings
//     court           draw(g, a, k)                 the basketball court (a pixel centre circle)
//     pond            draw(g, a, k, terrain), water(g, a, k, water)   an ellipse area (the pond) with a pixel edge;
//                     water() draws the moving water each frame inside the same edge
//     ringPath        draw(g, a, k, terrain)        the dirt path looping round inside the pond park
//     steppingStones  draw(g, a, k)                 the stones along an area's path (the shrine)
//   dims: { W, H, streets, crossStreets, k, SIDE, ROAD, STREET, VSIDE, VSTREET, pad, m }
//   terrain(ctx, x?, y?, w?, h?, type?, seed?) draws the area's terrain (or another) into ctx.
// Plain ES module.

import { PART as G1 } from './full/g1.js';
import { PART as G2 } from './full/g2.js';

export const FULL_GROUND = { ...G1, ...G2 };
