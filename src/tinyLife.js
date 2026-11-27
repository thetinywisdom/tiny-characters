// Tiny Life: the small things that make the town feel lived in (the owner chose
// all of them from mock-ups, Nov 2026): new poses for the people (sitting on a
// bench or the ground, riding a bike, sweeping, kicking, throwing, drinking a
// can, bowing, going down a slide), pigeons, crows, a cat napping on a wall,
// swings in use, steam from food stalls, cherry petals falling, rubbish bags,
// the delivery scooter. Same pixel style and sizes as the people.
//
//   drawPose(g, p, t)        a person in p.pose: { kind, ... } (see POSES), feet (or seat) at (p.x, p.y)
//   drawPigeon(g, b, t)      { x, y, flying, peck }        drawCrow(g, c, t)   { x, y }
//   drawNappingCat(g, c, t)  a cat lying on a wall, its tail flicking
//   drawSwings(g, prop, t)   a swing frame whose seats swing with prop.riders on them
//   drawSteam(g, x, y, t, seed)   see-through pixel puffs rising from (x, y)
//   drawPetals(g, tree, t)   petals drifting down round a cherry tree
//   drawRubbish(g, r)        rubbish bags under a green net (rubbish day)
//   drawScooter(g, v)        the delivery scooter, side on or head on
//
// Plain ES module.

import { drawCharacter, drawRing, shade } from './tinyCharacters.js';
import { drawWeapon } from './tinyCombat.js';
import { drawProp } from './tinyStreet.js';
import { SWING_SEATS, chainColour } from './full/p3.js';

const INK = '#2f3236', WHITE = '#f2f2ee';
const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const legRows = (p) => (p.kid ? 2 : p.size === 'tall' ? 4 : 3);
const legColour = (p) => ((p.legwear ?? 'trousers') === 'trousers' ? p.legs ?? INK : p.skin ?? '#e2b08e');
const shoes = (p) => p.shoes ?? (p.kid ? '#e8402f' : '#3a2a22');
/** The person's body and head only (their legs are drawn by the pose), feet line at y. */
function upper(g, p, x, y) {
  g.save(); g.beginPath(); g.rect(Math.round(x) - 14, -1e4, 28, Math.round(y) - legRows(p) + 1e4); g.clip();
  drawCharacter(g, { ...p, x, y, walking: false }, 0); g.restore();
}

/**
 * The poses: kind -> draw(g, p, t). p.x, p.y is where they stand (their feet, or the ground
 * under the seat for 'sitBench'); p.facing as usual. Other fields per pose:
 *  sitBench: on a bench (front: up on the seat, knees forward, feet down; side: thighs along the seat)
 *  sitGround: cross-legged on the ground or a blanket
 *  ride: on a bike (p.bike its colour; walking pedals); swing: on a swing seat (drawn by drawSwings)
 *  sweep / kick / throw / drink / bow: with p.pose.u, 0-1 through the move
 *  slide: sitting, legs forward, going down a slide
 */
export const POSES = {
  sitBench(g, p) {
    const x = Math.round(p.x), seat = Math.round(p.y) - 6, side = p.facing === 'left' || p.facing === 'right', s = p.facing === 'left' ? -1 : 1;
    upper(g, p, x, seat + 3);
    if (side) { px(g, legColour(p), s > 0 ? x - 1 : x - 3, seat, 5, 2); px(g, legColour(p), s > 0 ? x + 3 : x - 4, seat, 2, 5); px(g, shoes(p), s > 0 ? x + 3 : x - 5, Math.round(p.y) - 1, 3, 1); return; }
    const lap = (p.legwear === 'skirt' ? p.legs : legColour(p)) ?? INK;
    px(g, lap, x - 2, seat - 1, 5, 2); px(g, shade(lap, 1.2), x - 2, seat - 1, 5, 1);                 // the thighs, towards you
    for (const dx of [-2, 1]) { px(g, p.legwear === 'trousers' || !p.legwear ? shade(lap, 0.85) : p.skin ?? '#e2b08e', x + dx, seat + 1, 2, 4); px(g, shoes(p), x + dx, Math.round(p.y) - 1, 2, 1); }
  },
  sitGround(g, p) {
    const x = Math.round(p.x), seat = Math.round(p.y) - 2;
    upper(g, p, x, seat + legRows(p) - 1);
    px(g, p.legwear === 'skirt' ? p.legs ?? INK : legColour(p), x - 3, seat, 7, 2); px(g, shoes(p), x - 3, seat + 1, 2, 1); px(g, shoes(p), x + 2, seat + 1, 2, 1);
  },
  ride(g, p, t) {
    const x = Math.round(p.x), y = Math.round(p.y), col = p.bike ?? '#3f7fd6', step = p.walking ? Math.floor(t * 6) % 2 : 0;
    if (p.facing === 'left' || p.facing === 'right') {
      const s = p.facing === 'left' ? -1 : 1, X = (dx) => x + dx * s;
      for (const wx of [-6, 6]) { px(g, INK, X(wx) - 2, y - 6, 5, 1); px(g, INK, X(wx) - 2, y - 1, 5, 1); px(g, INK, X(wx) - 3, y - 5, 1, 4); px(g, INK, X(wx) + 3, y - 5, 1, 4); px(g, '#9aa0a8', X(wx), y - 3); }   // wheels
      px(g, col, Math.min(X(-6), X(0)), y - 4, 7, 1); px(g, col, X(0), y - 7, 1, 4); px(g, col, Math.min(X(1), X(4)), y - 8, 4, 1); px(g, col, X(5), y - 8, 1, 5);   // frame
      px(g, INK, Math.min(X(-2), X(1)), y - 8, 4, 1); px(g, INK, Math.min(X(4), X(6)), y - 10, 3, 1); px(g, '#c8ccd0', X(6), y - 6);   // saddle, handlebar, light
      upper(g, { ...p, facing: p.facing }, X(-1), y - 5);
      const lc = legColour(p);
      px(g, lc, Math.min(X(-1), X(0)), y - 8, 2, 2); px(g, lc, Math.min(X(step), X(step + 1)), y - 6, 2, 3 - step); px(g, shoes(p), Math.min(X(step), X(step + 1)), y - 3 - step, 2, 1);   // the legs on the pedals
      return;
    }
    // head on or from behind: a narrow bike under them
    px(g, INK, x - 1, y - 5, 2, 5); px(g, col, x - 1, y - 8, 2, 3); px(g, INK, x - 4, y - 10, 8, 1); px(g, step ? '#c8ccd0' : INK, x - 1, y - 6, 2, 1);
    upper(g, p, x, y - 4);
    px(g, legColour(p), x - 3, y - 7, 2, 3 - step); px(g, legColour(p), x + 1, y - 7, 2, 2 + step);
  },
  bow(g, p) {
    // the head and body dip forward (two pixels down), the legs stay
    const u = p.pose?.u ?? 0.5, dip = u < 0.2 ? Math.round(u * 10) : u > 0.8 ? Math.round((1 - u) * 10) : 2;
    g.save(); g.beginPath(); g.rect(Math.round(p.x) - 14, Math.round(p.y) - legRows(p), 28, 40); g.clip(); drawCharacter(g, p, 0); g.restore();
    upper(g, p, p.x, p.y + Math.min(2, dip));
  },
  sweep(g, p, t) {
    drawCharacter(g, { ...p, walking: false }, 0);
    const k = Math.floor(t * 3) % 3, s = p.facing === 'left' ? -1 : 1, a = [100, 75, 125][k];
    drawWeapon(g, { weapon: 'broom', x: p.x + 3 * s, y: p.y - 7, angle: s > 0 ? a : 180 - a, side: s });
    if (k === 2) { px(g, '#c8bca8', p.x + 9 * s, p.y - 2, 2, 1); px(g, '#c8bca8', p.x + 11 * s, p.y - 3); }
  },
  kick(g, p) {
    const u = p.pose?.u ?? 0.5, s = p.facing === 'left' ? -1 : 1, x = Math.round(p.x), y = Math.round(p.y);
    if (u < 0.4 || u > 0.8) { drawCharacter(g, { ...p, walking: u < 0.4 }, u * 2); return; }
    upper(g, p, x, y); const lc = legColour(p);
    px(g, lc, x - 2 * s - (s < 0 ? 1 : 0), y - 2, 2, 2); px(g, shoes(p), x - 2 * s - (s < 0 ? 1 : 0), y - 1, 2, 1);   // the standing leg
    px(g, lc, s > 0 ? x : x - 4, y - 3, 4, 1); px(g, shoes(p), s > 0 ? x + 4 : x - 5, y - 3, 2, 1);                      // the kicking leg, straight out
  },
  throw(g, p) {
    const u = p.pose?.u ?? 0.5, s = p.facing === 'left' ? -1 : 1, x = Math.round(p.x), y = Math.round(p.y);
    drawCharacter(g, { ...p, walking: false }, 0);
    if (u < 0.5) { px(g, p.body ?? WHITE, x + 2 * s, y - 10, 1, 2); px(g, p.skin ?? '#e2b08e', x + 3 * s, y - 12, 1, 2); }   // the arm up and over
    else for (let k = 0; k < 3; k++) px(g, '#d8b070', x + s * (6 + k * 3 + (u - 0.5) * 10), y - 13 + k * 2 + (u - 0.5) * 12);   // crumbs flying
  },
  drink(g, p) {
    const x = Math.round(p.x), y = Math.round(p.y), s = p.facing === 'left' ? -1 : 1;
    drawCharacter(g, { ...p, carry: undefined }, 0);
    px(g, p.body ?? WHITE, x + 3 * s, y - 8, 1, 2); px(g, p.skin ?? '#e2b08e', x + 2 * s, y - 10, 1, 2); px(g, p.can ?? '#e8402f', x + (s > 0 ? 1 : -2), y - 12, 2, 3); px(g, '#c8ccd0', x + (s > 0 ? 1 : -2), y - 12, 2, 1);
  },
  slide(g, p) {
    const x = Math.round(p.x), y = Math.round(p.y), s = p.facing === 'left' ? -1 : 1;
    upper(g, p, x, y); px(g, legColour(p), s > 0 ? x : x - 3, y - 2, 4, 1); px(g, shoes(p), s > 0 ? x + 3 : x - 3, y - 2, 1, 1);
  },
};
/** Draw a person in their pose (p.pose.kind); without one, as usual. */
export function drawPose(g, p, t = 0) {
  const fn = POSES[p.pose?.kind];
  if (fn && (p.you || p.ring)) drawRing(g, p.x, p.y, p.ring ?? '#f2c230');
  if (fn) fn(g, p, t); else drawCharacter(g, p, t);
}

// --- animals --------------------------------------------------------------------------------
/** A pigeon: grey with a green-and-purple neck, pecking or walking; flying, its wings up and down. */
export function drawPigeon(g, b, t = 0) {
  const x = Math.round(b.x), y = Math.round(b.y - (b.h ?? 0)), s = b.facing === 'left' ? -1 : 1, X = (dx, w = 1) => (s > 0 ? x + dx : x - dx - w + 1);
  px(g, '#8a909a', X(-2, 4), y - 3, 4, 2); px(g, '#6a707a', X(1), y - 3); px(g, '#6a9a8a', X(1), y - 4);
  const peck = b.peck && Math.floor(t * 3 + b.x) % 2;
  if (peck) { px(g, '#5a6a7a', X(2), y - 2); px(g, '#e8a040', X(3), y - 1); }
  else { px(g, '#5a6a7a', X(1, 2), y - 5, 2, 2); px(g, '#e8a040', X(3), y - 4); }
  if (b.flying) { const up = Math.floor(t * 10) % 2; px(g, '#9aa0aa', X(-3, 2), y - (up ? 7 : 4), 2, 3); px(g, '#9aa0aa', X(0, 2), y - (up ? 8 : 4), 2, 3); }
  else { px(g, '#e8806a', X(-1), y - 1); px(g, '#e8806a', X(0), y - 1); }
}
/** A crow on a wire or a pole: black, its beak out; now and then it caws (beak open). */
export function drawCrow(g, c, t = 0) {
  const x = Math.round(c.x), y = Math.round(c.y), s = c.facing === 'left' ? -1 : 1, X = (dx, w = 1) => (s > 0 ? x + dx : x - dx - w + 1);
  px(g, '#1e2024', X(-2, 4), y - 3, 4, 3); px(g, '#1e2024', X(1, 2), y - 5, 2, 2); px(g, '#1e2024', X(-3), y - 2);
  px(g, '#4a4e54', X(3), y - 4); if (Math.floor(t * 0.7 + c.x) % 5 === 0) px(g, '#4a4e54', X(3), y - 3);
}
/** A cat lying asleep on a wall, its tail hanging down and flicking. */
export function drawNappingCat(g, c, t = 0) {
  const x = Math.round(c.x), y = Math.round(c.y), col = c.color ?? '#e8a060', dark = shade(col, 0.82), flick = Math.floor(t * 1.5) % 4 === 0 ? 1 : 0;
  px(g, col, x - 4, y - 3, 8, 3); px(g, col, x + 3, y - 5, 3, 3); px(g, dark, x + 4, y - 6); px(g, dark, x + 6, y - 6); px(g, INK, x + 5, y - 4);   // body, head, ears, a closed eye
  px(g, dark, x - 3, y - 2); px(g, dark, x, y - 2); px(g, col, x - 5 + flick, y, 1, 4);                                                           // stripes, the tail
}

// --- the playground: swings in use ------------------------------------------------------------
/**
 * Swings (the street prop's frame, 30 x 22 at its scale) with each seat at its own angle:
 * prop.riders[i] = { angle, kid } (a person on it) or null (the seat hangs still).
 */
export function drawSwings(g, prop, t = 0) {
  // the swings' frame (src/full/p3.js, drawn by drawProp), then the chains, kids and seats on its grid
  drawProp(g, { ...prop, type: 'swings', riders: undefined, frameOnly: true });
  const k = prop.scale ?? 1, f = k / 1.5, n = (v) => Math.round(v * f), s = Math.max(1, n(1)), S = SWING_SEATS;
  const L = Math.round(prop.x - Math.round(30 * k) / 2), y = Math.round(prop.y), top = y - n(S.top) - s;
  S.centres.forEach((c, i) => {
    const r = prop.riders?.[i], a = r?.angle ?? 0, dx = Math.sin(a) * f, dy = Math.cos(a) * f;
    for (const hx of [L + n(c - S.half), L + n(c + S.half)]) {
      px(g, S.hook, hx, top, s, s);
      for (let d = 1; d < S.len; d++) px(g, chainColour(d), hx + dx * d, top + dy * d, s, s);
    }
    const ex = L + n(c) + dx * S.len, ey = top + dy * S.len;
    if (r?.kid) {
      const kid = { ...r.kid, facing: 'right' }, x = ex + 1;
      upper(g, kid, x + 1, ey + 1); px(g, kid.legwear === 'skirt' ? kid.legs : legColour(kid), x - 1, ey - 1, 5, 2);
      const lean = Math.sign(a); px(g, kid.skin ?? '#f1cdb0', x + 3, ey + 1, 2, 1); px(g, kid.skin ?? '#f1cdb0', x + 4 + Math.max(0, lean), ey + 1, 1, 3); px(g, shoes(kid), x + 4 + Math.max(0, lean), ey + 3, 2, 1);
    }
    px(g, S.seatTop, ex - n(S.half), ey, n(S.half * 2 + 1), s); px(g, S.seat, ex - n(S.half), ey + s, n(S.half * 2 + 1), n(S.seatH) - s);
  });
}

// --- steam, petals, rubbish ---------------------------------------------------------------------
/**
 * Steam rising from (x, y), in pixels (the owner chose see-through pixel puffs,
 * Nov 2026): four round puffs on the pixel grid that grow as they rise, sway a
 * little and fade out (half see-through at the bottom, gone at the top). No
 * state: from the time; `seed` sets one stall's steam apart from the next.
 */
export function drawSteam(g, x, y, t = 0, seed = 0) {
  g.save();
  for (let k = 0; k < 4; k++) {
    const u = (t * 0.45 + k / 4 + seed * 0.13) % 1, r = 1 + Math.round(u * 2.6);
    const cx = Math.round(x + Math.sin(u * 5 + k + seed) * 2), cy = Math.round(y - u * 20);
    g.globalAlpha = 0.7 * (1 - u);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) if (dx * dx * 0.8 + dy * dy * 1.4 <= r * r + 0.8) px(g, '#ffffff', cx + dx, cy + dy);
  }
  g.restore();
}
/** Petals drifting down round a cherry tree (its crown about h px above its foot). */
export function drawPetals(g, tree, t = 0, h = 34) {
  for (let k = 0; k < 6; k++) {
    const u = ((t * 0.12 + k / 6 + (tree.seed ?? 0) * 0.17) % 1);
    px(g, k % 2 ? '#f2c8d8' : '#f8e0e8', tree.x - 14 + ((k * 37 + (tree.seed ?? 0) * 11) % 28) + Math.sin(u * 9 + k) * 3, tree.y - h + u * (h + 2));
  }
}
/** Rubbish bags out for collection, under a green net. */
export function drawRubbish(g, r) {
  const x = Math.round(r.x), y = Math.round(r.y);
  [['#3f7fd6', -8], [WHITE, -2], ['#3f7fd6', 4]].forEach(([c, dx]) => { px(g, c, x + dx, y - 5, 5, 5); px(g, shade(c, 0.8), x + dx, y - 5, 5, 1); px(g, shade(c, 0.85), x + dx + 4, y - 4, 1, 4); });
  for (let i = -9; i < 10; i += 3) px(g, '#2f6a4a', x + i, y - 6, 2, 1);
  px(g, '#2f6a4a', x - 9, y - 6, 1, 5); px(g, '#2f6a4a', x + 9, y - 6, 1, 5);
}

// --- the delivery scooter ------------------------------------------------------------------------
/** The delivery scooter { x, y, heading }: white with a red front, a red box on the back, its rider. */
export function drawScooter(g, v, t = 0) {
  const x = Math.round(v.x), y = Math.round(v.y) + 2, h = (((v.heading ?? 0) % 360) + 360) % 360;
  const side = h < 45 || h >= 315 || (h >= 135 && h < 225), s = h >= 135 && h < 225 ? -1 : 1, X = (dx, w = 1) => (s > 0 ? x + dx : x - dx - w + 1);
  const rider = { ...(v.rider ?? {}), body: '#3f7fd6', legs: '#262b3a', hair: INK, hat: 'cap', hatColor: '#3f7fd6', skin: v.rider?.skin ?? '#e2b08e' };
  if (side) {
    for (const wx of [-7, 7]) { px(g, INK, X(wx - 2, 4), y - 4, 4, 4); px(g, '#9aa0a8', X(wx - 1, 2), y - 3, 2, 2); }
    px(g, WHITE, X(-8, 10), y - 7, 10, 3); px(g, '#e8402f', X(2, 4), y - 11, 4, 8); px(g, WHITE, X(3, 3), y - 12, 3, 2); px(g, INK, X(4, 3), y - 14, 3, 1); px(g, '#fff2c0', X(7), y - 9, 1, 2);
    px(g, '#c8402c', X(-12, 8), y - 15, 8, 7); px(g, WHITE, X(-11, 6), y - 13, 6, 1);
    upper(g, { ...rider, facing: s > 0 ? 'right' : 'left' }, X(-2), y - 6);
    px(g, rider.legs, X(-2, 4), y - 9, 4, 2); px(g, rider.legs, X(1, 2), y - 8, 2, 3);
    return;
  }
  // head on (down) or from behind (up): narrow, the box behind or in front
  const back = h >= 225;
  px(g, INK, x - 1, y - 4, 2, 4);
  if (back) { px(g, '#c8402c', x - 4, y - 13, 8, 7); px(g, WHITE, x - 3, y - 11, 6, 1); px(g, '#e8402f', x - 1, y - 6, 2, 1); }
  upper(g, { ...rider, facing: back ? 'up' : 'down' }, x, y - 5);
  px(g, '#e8402f', x - 3, y - 7, 6, 4); px(g, WHITE, x - 2, y - 8, 4, 1); px(g, INK, x - 4, y - 9, 8, 1);
  if (!back) px(g, '#fff2c0', x - 1, y - 6, 2, 1);
}
