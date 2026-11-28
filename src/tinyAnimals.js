// Tiny Animals: cats and dogs in the same small pixel style as the people,
// with four views (front, back, both sides) like them.
//
//   drawCat(g, cat, t)    { x, y, coat, facing, walking, sit } (feet at x, y)
//   drawDog(g, dog, t)    { x, y, breed, coat, facing, walking, sit }
//                         standing still they sit now and then (sit: true / false to choose), cats
//                         flick their tails, dogs wag (walking too)
//   catFor(seed), dogFor(breed, seed)   a coat (and a breed) from a seed
//   CAT_COATS, DOG_BREEDS
//
// facing: 'down' (the front; also nothing), 'up' (the back), 'left', 'right'.
// No faces, like the people (a dog has a nose pixel). Plain ES module.

import { CAT_COLORS, seeded, shade } from './tinyCharacters.js';

const INK = '#2f3236', WHITE = '#f2efe8';

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
  const wag = dog ? Math.floor(t * (a.walking ? 7 : 5)) % 2 : 0;                     // dogs wag walking too
  const seedT = ((a.seed ?? Math.round(a.x * 7 + a.y * 3)) % 97) / 9.7;
  const sits = !a.walking && (a.sit ?? Math.floor((t + seedT) / 5) % 2 === 1);      // standing a while: sits now and then
  const flick = spec.cat && !a.walking && Math.floor((t + seedT) * 3) % 7 === 0;    // a cat's tail tip flicks now and then
  if (sits) { sitting(g, a, x, y, spec, main, second, pattern, dog, flick || wag); return; }
  const dark = shade(main, 0.78), legC = pattern === 'points' ? second : main;
  const paw = pattern === 'tuxedo' || pattern === 'chest' ? second : pattern === 'points' ? second : legC;
  const bodyTop = -(lh + bh), headTop = spec.cat ? bodyTop - hh : bodyTop - hh + 1;   // a cat's head sits on its shoulders
  const collar = dog ? (a.collar ?? '#d8443c') : null;
  const earC = pattern === 'points' || pattern === 'face' ? second : ear === 'flop' ? shade(main, 0.72) : main;

  if (side) {
    const x0 = -Math.floor(bw / 2), hx = spec.cat ? x0 + bw - 2 : x0 + bw - 1;
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
    for (const [tx, ty] of T) R(tailC, x0 + tx - (wag && ty < 0 ? 1 : 0) + (flick && ty === -3 ? 1 : 0), bodyTop + ty - (wag && tail === 'down' ? 1 : 0), 1, 1);   // a wag (or a flick): the tip moves
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
  const fw = dog ? Math.min(bw, hw + 2) + (hw >= 4 ? 1 : 0) : 4, fx = -Math.floor(fw / 2);   // the shoulders wider than the head (a cat: 4)
  const hwF = spec.cat ? 4 : hw, hx = -Math.floor(hwF / 2), hw2 = hwF;
  const legsAt = [fx, fx + fw - 1];
  legsAt.forEach((lx, i) => {
    const lifted = step === i, h = lifted ? Math.max(1, lh - 1) : lh;
    R(legC, lx, -lh, 1, h); R(paw, lx, -lh + h - 1, 1, 1);
  });
  const tailC = pattern === 'points' ? second : main;
  if (!back && spec.cat) { R(tailC, fx + fw, -3 - (flick ? 1 : 0), 1, 3); R(tailC, fx + fw - 1, -1, 1, 1); }   // a cat's tail up beside it, curling in at the foot
  else if (!back && tail !== 'stub') R(tailC, fx + fw + (wag ? 1 : 0), bodyTop - (tail === 'up' ? 2 : 0), 1, tail === 'up' ? 3 : 2);   // the tail beside it
  R(main, fx, bodyTop, fw, bh);
  R(dark, fx, -lh - 1, fw, 1);
  if (!back && (pattern === 'chest' || pattern === 'tuxedo')) R(second, fx + Math.floor((fw - 1) / 2), bodyTop, fw % 2 ? 1 : 2, bh);
  if (pattern === 'tabby') R(second, fx, bodyTop, 1, 1), R(second, fx + fw - 1, bodyTop, 1, 1);
  if (pattern === 'spots') { R(second, fx, bodyTop + 1); R(second, fx + fw - 1, bodyTop); }
  if (pattern === 'calico') R(second, fx, bodyTop, Math.ceil(fw / 2), 1);
  R(shade(main, 0.8), fx, bodyTop, fw, 1);                                   // the neck's shadow
  if (collar) R(collar, hx, bodyTop, hw2, 1);
  R(main, hx, headTop - (spec.cat ? 1 : 0), hw2, spec.cat ? hh + 1 : hh - 1);
  if (pattern === 'tabby') R(second, hx + Math.floor(hw2 / 2) - (spec.cat ? 1 : 0), headTop - (spec.cat ? 1 : 0), spec.cat ? 2 : 1, 1);
  if (pattern === 'calico') R('#dc9a5c', hx, headTop, 1, 2), R(INK, hx + hw2 - 1, headTop, 1, 1);
  if (!back && (pattern === 'points' || pattern === 'face')) R(second, hx + Math.floor((hw2 - 1) / 2), headTop + 1 - (spec.cat ? 1 : 0), hw2 % 2 ? 1 : 2, hh - (spec.cat ? 0 : 1));
  if (ear === 'cat' || ear === 'point') { const up = spec.cat ? 2 : 1; R(earC, hx, headTop - up); R(earC, hx + hw2 - 1, headTop - up); }
  else { R(earC, hx - 1, headTop, 1, 2); R(earC, hx + hw2, headTop, 1, 2); }
  if (!back && dog) R(INK, hx + Math.floor((hw2 - 1) / 2), headTop + hh - 1, hw2 % 2 ? 1 : 2, 1);   // the nose
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

// sitting (the cats and dogs, standing still a while): side on the haunches low at the back, the front legs
// straight, the chest up, the head on top, the tail round the feet (a dog's wagging on the ground); head on:
// a rounded body wider at the bottom, the head and ears on top, the tail round the front
function sitting(g, a, x, y, spec, main, second, pattern, dog, moving) {
  const s = a.facing === 'left' ? -1 : 1, side = a.facing === 'left' || a.facing === 'right', back = a.facing === 'up' || a.facing === 'back';
  const R = (col, dx, dy, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(s > 0 ? x + dx : x - dx - w + 1, y + dy, w, h); };
  const big = !spec.cat && spec.bw >= 8, hw = spec.cat ? 3 : spec.hw, legH = spec.cat ? 3 : spec.lh + 2;
  const dark = shade(main, 0.78), legC = pattern === 'points' ? second : main, tailC = pattern === 'points' ? second : main;
  const earC = pattern === 'points' || pattern === 'face' ? second : spec.ear === 'flop' ? shade(main, 0.72) : main;
  const light = pattern === 'chest' || pattern === 'tuxedo' ? second : null;
  if (side) {
    const rear = big ? 4 : 3;
    R(main, -rear, -rear, rear, rear); R(dark, -rear, -1, rear, 1);                     // the haunch
    if (spec.cat) { R(tailC, -rear - 1, -1, rear + 2, 1); if (moving) R(tailC, 1, -2, 1, 1); }   // the tail round the front paws, its tip flicking
    else R(tailC, -rear - 1 - (moving ? 1 : 0), -1 - (moving ? 1 : 0), 1, 1);           // a dog's tail on the ground, sweeping
    R(legC, 1, -legH, 1, legH); R(pattern === 'tuxedo' || pattern === 'chest' ? second : legC, 1, -1, 1, 1);   // the front legs
    R(main, -1, -legH - 2, 3, 3);                                                       // the chest
    if (light) R(light, 1, -legH - 1, 1, 2);
    if (pattern === 'tabby') { R(second, -2, -rear, 1, 2); R(second, -rear + 1, -rear + 1, 1, 1); R(second, 1, -legH - 2); }
    if (pattern === 'calico') { R('#dc9a5c', -rear, -rear, 2, 2); R(INK, -1, -legH - 2, 2, 1); }
    if (pattern === 'tuxedo') { R(second, 1, -legH - 2, 1, 3); }
    if (pattern === 'spots') { R(second, -2, -2); R(second, 0, -legH - 1); }
    const hy = -legH - 2 - (spec.cat ? 2 : spec.hh);
    R(main, 0, hy, hw, spec.cat ? 2 : spec.hh);
    if (pattern === 'points' || pattern === 'face') R(second, hw - 2, hy + 1, 2, (spec.cat ? 2 : spec.hh) - 1);
    if (spec.ear === 'cat' || spec.ear === 'point') { R(earC, 0, hy - 1); R(earC, hw - 1, hy - 1); } else R(earC, 0, hy, 1, 2);
    if (dog) { R(INK, hw, hy + spec.hh - 2); R(a.collar ?? '#d8443c', 0, hy + spec.hh); }
    return;
  }
  const w = big ? 6 : spec.cat ? 5 : 5, fx = -Math.floor(w / 2);
  R(main, fx, -3, w, 3); R(main, fx + 1, -5, w - 2, 2); R(dark, fx, -1, w, 1);          // the body, wider at the bottom
  if (!back) { R(legC, fx + 1, -3, 1, 3); R(legC, fx + w - 2, -3, 1, 3); if (light) R(light, fx + 2, -4, w - 4, 3); }   // front legs, the chest
  if (back || spec.cat) R(tailC, fx - 1 + (back ? 0 : 0), -1, back ? 2 : w + 1, 1);    // the tail round
  if (back && moving) R(tailC, fx - 2, -2);
  const hx = -Math.floor((spec.cat ? 4 : hw) / 2), hwF = spec.cat ? 4 : hw, hy = -5 - (spec.cat ? 3 : spec.hh - 1);
  R(main, hx, hy, hwF, spec.cat ? 3 : spec.hh - 1);
  if (pattern === 'tabby') { R(second, hx + 1, hy, 2, 1); R(second, fx, -3, 1, 1); R(second, fx + w - 1, -3, 1, 1); }
  if (pattern === 'calico') { R('#dc9a5c', hx, hy, 2, 2); R(INK, fx + w - 2, -3, 2, 1); R('#dc9a5c', fx, -2, 2, 1); }
  if (pattern === 'tuxedo' && !back) R(second, fx + 2, -4, w - 4, 3);
  if (!back && (pattern === 'points' || pattern === 'face')) R(second, hx + 1, hy + 1, hwF - 2, 1);
  if (spec.ear === 'cat' || spec.ear === 'point') { R(earC, hx, hy - 1); R(earC, hx + hwF - 1, hy - 1); } else { R(earC, hx - 1, hy, 1, 2); R(earC, hx + hwF, hy, 1, 2); }
  if (!back && dog) R(INK, hx + Math.floor((hwF - 1) / 2), hy + spec.hh - 2, hwF % 2 ? 1 : 2, 1);
  if (dog) R(a.collar ?? '#d8443c', hx, -5, hwF, 1);
}
