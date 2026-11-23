// Tiny Animals: cats and dogs in the same small pixel style as the people,
// with four views (front, back, both sides) like them.
//
//   drawCat(g, cat, t)    { x, y, coat, facing, walking } (feet at x, y)
//   drawDog(g, dog, t)    { x, y, breed, coat, facing, walking }
//   catFor(seed), dogFor(breed, seed)   a coat (and a breed) from a seed
//   CAT_COATS, DOG_BREEDS
//
// facing: 'down' (the front; also nothing), 'up' (the back), 'left', 'right'.
// No faces, like the people (a dog has a nose pixel). Plain ES module.

import { CAT_COLORS, COLORS, seeded } from './tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2efe8';
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');

/**
 * Cat coats: [label, main colour, second colour, pattern]. Patterns: tabby
 * (stripes), tuxedo (white chest and paws), calico (patches), points (dark
 * ears, face, paws and tail), plain.
 */
export const CAT_COATS = {
  ginger: ['Ginger tabby', '#dc9a5c', '#b8743a', 'tabby'],
  grey: ['Grey tabby', '#a8a6a0', '#7a7872', 'tabby'],
  black: ['Black', '#2f3236', '#2f3236', 'plain'],
  white: ['White', '#f2efe8', '#d8d4ca', 'plain'],
  tuxedo: ['Tuxedo', '#2f3236', WHITE, 'tuxedo'],
  calico: ['Calico', WHITE, '#dc9a5c', 'calico'],
  siamese: ['Siamese', '#eadcc4', '#6a4a3a', 'points'],
  brown: ['Brown', '#8a6440', '#6a4a30', 'plain'],
};
/** Plain cat colours (c.color), from tinyCharacters. */
export { CAT_COLORS };

/**
 * Dog breeds: size (body w x h, legs, head), ears, tail and coat (main,
 * second colour, pattern: chest / spots / dark face / saddle).
 */
export const DOG_BREEDS = {
  shiba: { label: 'Shiba', bw: 6, bh: 3, lh: 2, hw: 3, hh: 3, ear: 'point', tail: 'curl', coat: ['#c8743a', WHITE, 'chest'] },
  corgi: { label: 'Corgi', bw: 7, bh: 2, lh: 1, hw: 3, hh: 3, ear: 'point', tail: 'stub', coat: ['#d8903a', WHITE, 'chest'] },
  dachshund: { label: 'Dachshund', bw: 8, bh: 2, lh: 1, hw: 3, hh: 2, ear: 'flop', tail: 'down', coat: ['#7a3a22', '#5a2a18', 'plain'] },
  poodle: { label: 'Poodle', bw: 5, bh: 3, lh: 2, hw: 3, hh: 3, ear: 'flop', tail: 'pom', coat: [WHITE, '#d8d4ca', 'plain'] },
  pug: { label: 'Pug', bw: 5, bh: 3, lh: 1, hw: 3, hh: 3, ear: 'flop', tail: 'curl', coat: ['#d8c09a', INK, 'face'] },
  labrador: { label: 'Labrador', bw: 8, bh: 3, lh: 3, hw: 4, hh: 3, ear: 'flop', tail: 'down', coat: ['#e0b870', '#c89850', 'plain'] },
  husky: { label: 'Husky', bw: 8, bh: 3, lh: 3, hw: 4, hh: 3, ear: 'point', tail: 'curl', coat: ['#7f858c', WHITE, 'chest'] },
  dalmatian: { label: 'Dalmatian', bw: 8, bh: 3, lh: 3, hw: 4, hh: 3, ear: 'flop', tail: 'down', coat: [WHITE, INK, 'spots'] },
};
const CAT = { bw: 6, bh: 2, lh: 1, hw: 3, hh: 2, ear: 'cat', tail: 'up', cat: true };

/** Coats a dog of a breed can have (the breed's own first). */
const DOG_COATS = {
  shiba: [['#c8743a', WHITE, 'chest'], [INK, '#c8743a', 'chest'], ['#eadcc4', WHITE, 'chest']],
  labrador: [['#e0b870', '#c89850', 'plain'], [INK, INK, 'plain'], ['#6a4a30', '#5a3a22', 'plain']],
  poodle: [[WHITE, '#d8d4ca', 'plain'], ['#8a6440', '#6a4a30', 'plain'], [INK, INK, 'plain'], ['#d8a87a', '#c08a5a', 'plain']],
  dachshund: [['#7a3a22', '#5a2a18', 'plain'], [INK, '#b8743a', 'chest']],
};

/** A cat's coat from a seed (seed 0: ginger). */
export function catFor(seed = 0) {
  const keys = Object.keys(CAT_COATS);
  return { coat: seed ? keys[Math.floor(seeded(seed * 7919 + 29)() * keys.length)] : 'ginger' };
}
/** A dog from a breed ('random' for any) and a seed: { breed, coat }. */
export function dogFor(breed = 'random', seed = 0) {
  const rng = seeded(seed * 7919 + 31), keys = Object.keys(DOG_BREEDS);
  const b = breed === 'random' || !DOG_BREEDS[breed] ? keys[seed ? Math.floor(rng() * keys.length) : 0] : breed;
  const coats = DOG_COATS[b];
  return { breed: b, coat: seed && coats ? coats[Math.floor(rng() * coats.length)] : undefined };
}

/** Draw a cat with its feet at (c.x, c.y). c.coat: a CAT_COATS key (or c.color for a plain coat). */
export function drawCat(g, c, t = 0) {
  const def = CAT_COATS[c.coat];
  const coat = def ? [def[1], def[2], def[3]] : [c.color ?? CAT_COLORS[0], shade(c.color ?? CAT_COLORS[0], 0.8), 'plain'];
  quad(g, c, t, CAT, coat, false);
}
/** Draw a dog with its feet at (d.x, d.y). d.breed: a DOG_BREEDS key; d.coat: [main, second, pattern] to change its coat. */
export function drawDog(g, d, t = 0) {
  const spec = DOG_BREEDS[d.breed] ?? DOG_BREEDS.shiba;
  quad(g, d, t, spec, d.coat ?? spec.coat, true);
}

// A four-legged animal: spec { bw, bh, lh, hw, hh, ear, tail }, coat [main, second, pattern].
function quad(g, a, t, spec, [main, second, pattern], dog) {
  const x = Math.round(a.x), y = Math.round(a.y);
  const s = a.facing === 'left' ? -1 : 1, side = a.facing === 'left' || a.facing === 'right';
  const back = a.facing === 'up' || a.facing === 'back';
  const R = (col, dx, dy, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(s > 0 ? x + dx : x - dx - w + 1, y + dy, w, h); };
  const { bw, bh, lh, hw, hh, ear, tail } = spec;
  const step = a.walking ? Math.floor(t * 8) % 2 : -1;
  const wag = !a.walking && dog ? Math.floor(t * 5) % 2 : 0;
  const dark = shade(main, 0.78), legC = pattern === 'points' ? second : main;
  const paw = pattern === 'tuxedo' || pattern === 'chest' ? second : pattern === 'points' ? second : legC;
  const bodyTop = -(lh + bh), headTop = spec.cat ? bodyTop - hh : bodyTop - hh + 1;   // a cat's head sits on its shoulders
  const collar = dog ? (a.collar ?? '#d8443c') : null;
  const earC = pattern === 'points' || pattern === 'face' ? second : ear === 'flop' ? shade(main, 0.72) : main;

  if (side) {
    const x0 = -Math.floor(bw / 2), hx = spec.cat ? x0 + bw - 2 : x0 + bw - 1;
    R(COLORS.shadow, x0 - 1, 0, bw + 2, 1);
    // legs: the far pair darker; walking, the pairs take turns
    const legs = [[x0, 0], [x0 + 1, 1], [x0 + bw - 2, 1], [x0 + bw - 1, 0]];
    for (const [lx, far] of legs) {
      const lifted = step >= 0 && (far === step);
      const h = lifted ? Math.max(1, lh - 1) : lh, ox = lifted && lh === 1 ? (far ? 1 : -1) : 0;   // short legs step sideways instead
      R(far ? shade(legC, 0.8) : legC, lx + ox, -lh, 1, h);
      R(paw, lx + ox, -lh + h - 1, 1, 1);
    }
    // tail behind the body
    const T = { up: [[-1, 0], [-2, -1], [-2, -2], [-1, -3]], curl: [[-1, 0], [-1, -1], [0, -2], [1, -1]], down: [[-1, 0], [-2, 1]], stub: [[-1, 0]],
      pom: [[-1, 0], [-2, -1], [-1, -1], [-2, -2], [-1, -2]] }[tail];
    const tailC = pattern === 'points' ? second : main;
    for (const [tx, ty] of T) R(tailC, x0 + tx - (wag && ty < 0 ? 1 : 0), bodyTop + ty - (wag && tail === 'down' ? 1 : 0), 1, 1);   // a wag: the tip moves
    // body, belly, patterns
    R(main, x0, bodyTop, bw, bh);
    if (pattern === 'tabby') for (let i = x0 + 1; i < x0 + bw - 1; i += 2) R(second, i, bodyTop, 1, bh - 1);
    if (pattern === 'chest' || pattern === 'tuxedo') { R(second, x0 + 1, -lh - 1, bw - 2, 1); R(second, hx, bodyTop + 1, 1, bh - 1); }
    if (pattern === 'calico') { R(second, x0, bodyTop, 2, bh - 1); R(INK, x0 + bw - 3, bodyTop, 2, 1); }
    if (pattern === 'spots') { R(second, x0 + 1, bodyTop, 1, 1); R(second, x0 + 4, bodyTop + 1, 1, 1); R(second, x0 + 6, bodyTop, 1, 1); }
    R(dark, x0, -lh - 1, bw, 1);
    if (pattern === 'chest' || pattern === 'tuxedo') R(second, x0 + 1, -lh - 1, bw - 2, 1);
    // head, ears, snout
    R(main, hx, headTop, hw, hh);
    if (pattern === 'tabby') R(second, hx + 1, headTop, 1, 1);
    if (pattern === 'calico') R('#dc9a5c', hx, headTop, 2, 1);
    if (pattern === 'points' || pattern === 'face') R(second, hx + hw - 2, headTop + 1, 2, hh - 1);
    if (ear === 'cat' || ear === 'point') { R(earC, hx, headTop - 1); R(earC, hx + hw - 1, headTop - 1); }
    else R(earC, hx, headTop, 1, 2);
    if (dog) { R(INK, hx + hw, headTop + hh - 2, 1, 1); R(collar, hx, headTop + hh, 1, 1); }   // nose, collar
    return;
  }
  // front and back: the chest (or the rump), two legs, the head above
  const fw = dog ? Math.min(bw, hw + 2) : hw, fx = -Math.floor(fw / 2), hx = -Math.floor(hw / 2);   // the shoulders wider than the head
  R(COLORS.shadow, fx - 1, 0, fw + 2, 1);
  const legsAt = [fx, fx + fw - 1];
  legsAt.forEach((lx, i) => {
    const lifted = step === i, h = lifted ? Math.max(1, lh - 1) : lh;
    R(legC, lx, -lh, 1, h); R(paw, lx, -lh + h - 1, 1, 1);
  });
  const tailC = pattern === 'points' ? second : main;
  if (!back && tail !== 'stub') R(tailC, fx + fw + (wag ? 1 : 0), bodyTop - (tail === 'up' ? 2 : 0), 1, tail === 'up' ? 3 : 2);   // the tail beside it
  R(main, fx, bodyTop, fw, bh);
  R(dark, fx, -lh - 1, fw, 1);
  if (!back && (pattern === 'chest' || pattern === 'tuxedo')) R(second, fx + Math.floor((fw - 1) / 2), bodyTop, fw % 2 ? 1 : 2, bh);
  if (pattern === 'tabby') R(second, fx, bodyTop, 1, 1), R(second, fx + fw - 1, bodyTop, 1, 1);
  if (pattern === 'spots') { R(second, fx, bodyTop + 1); R(second, fx + fw - 1, bodyTop); }
  if (pattern === 'calico') R(second, fx, bodyTop, Math.ceil(fw / 2), 1);
  R(shade(main, 0.8), fx, bodyTop, fw, 1);                                   // the neck's shadow
  if (collar) R(collar, hx, bodyTop, hw, 1);
  R(main, hx, headTop, hw, spec.cat ? hh : hh - 1);
  if (pattern === 'tabby') R(second, hx + Math.floor(hw / 2), headTop, 1, 1);
  if (pattern === 'calico') R('#dc9a5c', hx, headTop, 1, 2), R(INK, hx + hw - 1, headTop, 1, 1);
  if (!back && (pattern === 'points' || pattern === 'face')) R(second, hx + Math.floor((hw - 1) / 2), headTop + 1, hw % 2 ? 1 : 2, hh - 1);
  if (ear === 'cat' || ear === 'point') { R(earC, hx, headTop - 1); R(earC, hx + hw - 1, headTop - 1); }
  else { R(earC, hx - 1, headTop, 1, 2); R(earC, hx + hw, headTop, 1, 2); }
  if (!back && dog) R(INK, hx + Math.floor((hw - 1) / 2), headTop + hh - 1, hw % 2 ? 1 : 2, 1);   // the nose
  if (back) {
    // the tail, seen over the back (a shade darker, so it shows on a plain coat)
    const tailC = pattern === 'points' ? second : shade(main, main === INK ? 1.5 : 0.82);
    if (tail === 'up') R(tailC, 0, bodyTop - 3, 1, 4);
    else if (tail === 'curl') { R(tailC, -1, bodyTop - 1, 3, 1); R(tailC, -1, bodyTop - 2, 1, 1); R(tailC, 1, bodyTop - 2, 1, 1); }
    else if (tail === 'pom') R(tailC, -1, bodyTop - 2, 2, 2);
    else if (tail === 'down') R(shade(main, 0.85), 0, bodyTop + 1, 1, bh + (wag ? 0 : 1));
    else R(tailC, 0, bodyTop, 1, 1);
  }
}
