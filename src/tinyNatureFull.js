// Tiny Nature at full size: trees and bushes drawn again at the town's size (scale 1.5),
// one pixel = one person pixel, like the buildings and street things.
//
//   FULL_TREES, FULL_BUSHES   type -> { approved, draw(r, rng, cx) }: used by drawTree /
//                             drawBush once approved (setRedraw / ?redraw=all)
//
// A full drawing fills round(w * 1.5) x round(h * 1.5) of the old size (TREES / BUSHES),
// centred on cx with its foot at the ground line (the trunk where the old one was, x 1.5).
// The seed picks one of 8 variants (rng) and mirrors it, as before.
// Plain ES module.

import { PART as N1 } from './full/n1.js';
import { PART as N2 } from './full/n2.js';
import { PART as N3 } from './full/n3.js';
import { PART as T1 } from './full/t1.js';

export const FULL_TREES = { ...N1, ...N2 };
export const FULL_BUSHES = { ...N3 };
/** Terrains at full size: type -> { approved, draw(g, { x, y, w, h, seed, t, rng }) } (in canvas pixels, clipped to the rectangle). */
export const FULL_TERRAINS = { ...T1 };
