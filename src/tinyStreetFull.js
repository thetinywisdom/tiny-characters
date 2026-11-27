// Tiny Street at full size: the street things drawn again at the town's size (scale 1.5),
// one pixel = one person pixel, like the buildings (tinyBuildingsFull.js).
//
//   FULL_PROPS     type -> { approved, draw(r, rng, p) }: drawn by drawProp instead of the
//                  old drawing once approved (setRedraw / ?redraw=all in tinyBuildings.js)
//
// A full drawing fills round(w * 1.5) x round(h * 1.5) of the old size (PROPS), makes the
// same rng calls in the same order, and keeps every spot other code relies on (lamp heads,
// the crossarm's ends, a bench's seat, the swing bar, the slide, the hoop, a traffic
// light's lamps, the crossing gate's boom and lamps) at the old place times 1.5.
// Plain ES module.

import { PART as P1 } from './full/p1.js';
import { PART as P2 } from './full/p2.js';
import { PART as P3 } from './full/p3.js';

export const FULL_PROPS = { ...P1, ...P2, ...P3 };
