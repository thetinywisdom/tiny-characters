// Tiny Characters: the little pixel people from Tiny City Builder's bubble
// lab, as a small reusable library. Each person is drawn with a handful of
// rectangles on a low-resolution canvas (about 5 x 15 pixels), then the
// canvas is scaled up with hard pixels (CSS `image-rendering: pixelated`).
//
//   drawCharacter(g, person, t)   one person, feet at (person.x, person.y), in 3D (tinyVoxel)
//   drawStage(g, W, H)            the lab's grass strip and path
//   randomCharacter(rng)          a random look
//   LOOKS                         starter looks (salaryman, grandma ...)
//   snapToPalette(g, W, H)        hard edges, only the palette's colours
//
// A person: { x, y, body, hair, skin, legs, you, talking, walking, facing }
// plus looks: kid, hairStyle, moustache, hat, hatColor, top, trim, legwear,
// carry, carryColor (see SKILLS.md).
// Colours are CSS strings. Plain ES module (draws with tinyVoxel.js).

import { voxelSprite } from './tinyVoxel.js';

/** The lab's colours. */
export const COLORS = {
  ink: '#2f3236', paper: '#f2efe8', navy: '#262b3a', gold: '#f2b64a',
  grass: '#9fb08d', grass2: '#93a582', path: '#ddd0aa',
  shadow: 'rgba(0, 0, 0, 0.3)',   // 30% black: a natural shadow on any ground (the owner's choice)
};

/** Body (top) colours used by the lab's people, and a few more. */
export const BODY_COLORS = ['#f2f2ee', '#3f7fd6', '#d46a8e', '#5f8f5a', '#f2c230', '#7a6aa8', '#e2e2e2', '#e8402f', '#262b3a', '#9e6c60'];
export const HAIR_COLORS = ['#2f3236', '#3a2a22', '#8a5a2a', '#c99c5a', '#b3b0a8', '#f2efe8'];
export const SKIN_COLORS = ['#f1cdb0', '#e2b08e', '#c98d65', '#8d5a3b', '#5a3825'];
export const LEG_COLORS = ['#2f3236', '#262b3a', '#3f4f6e', '#6b5a48'];

/** Colours of things: hats, bags, cardboard, the walking stick, uniforms. */
export const THING_COLORS = ['#f2f2ee', '#e8402f', '#3f7fd6', '#d8b860', '#c09060', '#8a6440', '#6b4a2a', '#bcd2e0', '#7a7a74', '#dcb08c'];
/** Cat colours: ginger, black, white, grey, brown. */
export const CAT_COLORS = ['#dcb08c', '#2f3236', '#f2efe8', '#b3b0a8', '#8a6440'];

/** Hairstyles, hats, tops, legwear and carried things a person can have. */
export const HAIRSTYLES = ['short', 'bald', 'long', 'ponytail', 'afro', 'bun', 'mohawk'];
/** Sizes besides the usual 15 px: tall is 17, short 14 (a kid is 11). */
export const SIZES = ['tall', 'short'];
export const HATS = ['cap', 'wide'];
export const TOPS = ['jacket', 'suit', 'apron', 'yukata', 'sailor', 'gakuran', 'police'];
export const LEGWEAR = ['trousers', 'shorts', 'skirt'];
export const CARRY = ['backpack', 'bag', 'briefcase', 'umbrella', 'stick', 'boxes'];

const WHITE = '#f2f2ee', RED = '#e8402f';
/** A colour darker (f < 1) or lighter (f > 1). */
const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');
/** Is a colour light (so a white collar would not show on it)? */
const light = (hex) => [1, 3, 5].reduce((a, i) => a + parseInt(hex.slice(i, i + 2), 16), 0) > 600;
const DEFAULT_HAT = { cap: RED, wide: '#d8b860' };
const DEFAULT_CARRY = { backpack: '#e8402f', bag: '#c9b48a', briefcase: '#2f3236', umbrella: '#3f7fd6', stick: '#6b4a2a', boxes: '#c09060' };

// Row offsets (from the feet) of a person: legs, body top, head top.
function frameOf(p, bob = 0) {
  // a kid 11 px tall, short 14, everyone else 15, tall 17
  const legH = p.kid ? 2 : p.size === 'tall' ? 4 : 3, bodyH = p.kid ? 4 : p.size === 'tall' ? 7 : p.size === 'short' ? 5 : 6;
  const B = -legH - bodyH + bob;
  return { legH, bodyH, B, Hd: B - 4 };
}

/**
 * The old flat drawing of a person (kept for reference; drawCharacter draws
 * them in 3D): feet at (p.x, p.y), into a 2D context `g` of a low-res canvas. `t` (seconds) drives the talking bob and the walking step.
 *  - talking: the body and head bob up a pixel, six times a second
 *  - walking: the legs take turns lifting a pixel, eight steps a second
 *  - you: a gold line under the feet (the player)
 * facing: 'down' (the front; also nothing), 'up' (the back), 'left', 'right'.
 * Looks (all optional, see SKILLS.md): kid, size, hairStyle, fringe,
 * moustache, hat, hatColor, top, trim, legwear, shoes, carry, carryColor.
 * Everyone has hands, shoes, a darker right side, and a collar and hem on a
 * plain top. No eyes: the people are faceless.
 */
export function drawCharacterFlat(g, p, t = 0) {
  const x = Math.round(p.x), y = Math.round(p.y);
  const talkBob = p.talking && Math.floor(t * 6) % 2 ? -1 : 0;
  const step = p.walking ? Math.floor(t * 8) % 2 : -1;      // which leg is lifted (-1: standing)
  const walkBob = p.walking && step === 1 ? -1 : 0;
  const bob = talkBob || walkBob;
  // four views: front ('down', or nothing), back ('up'), and the sides
  // R: a rectangle at (x + dx, y + dy), mirrored when facing left
  const s = p.facing === 'left' ? -1 : 1, side = p.facing === 'left' || p.facing === 'right';
  const back = p.facing === 'up' || p.facing === 'back';
  const R = (c, dx, dy, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(s > 0 ? x + dx : x - dx - w + 1, y + dy, w, h); };
  // W: the same, never mirrored (the light always comes from the left)
  const W = (c, dx, dy, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, w, h); };
  const { legH, bodyH, B, Hd } = frameOf(p, bob);
  const body = p.body ?? BODY_COLORS[0], legs = p.legs ?? COLORS.ink, skin = p.skin ?? SKIN_COLORS[1], hair = p.hair ?? COLORS.ink;
  const carry = p.carry, carryColor = p.carryColor ?? DEFAULT_CARRY[carry];
  const wear = p.legwear ?? 'trousers';
  // no shadow (only floating and flying things have one); a backpack behind the body (only seen from the side)
  if (carry === 'backpack' && side) R(carryColor, -4, p.kid ? B - 1 : B, 2, p.kid ? 3 : 4);
  // legs (walking: one lifts a pixel, then the other); shorts and skirts show
  // skin; shoes are the bottom row; the right leg's outer column in shade
  const shoes = p.shoes ?? (p.kid ? RED : '#3a2a22');
  if (p.top !== 'yukata') {
    for (const [dx, lifted] of [[-2, step === 0], [1, step === 1]]) {
      const h = lifted ? legH - 1 : legH, c = wear === 'trousers' ? legs : skin;
      R(c, dx, -legH, 2, h);
      if (wear === 'shorts') R(legs, dx, -legH, 2, 1);
      R(shoes, dx, -legH + h - 1, 2, 1);
    }
    W(shade(wear === 'trousers' ? legs : skin, 0.78), 2, -legH, 1, legH - 2);
  }
  // body and what is worn on it; a plain top gets a collar and a hem
  R(body, -2, B, 5, bodyH);
  if (!p.top) { if (!back) R(light(body) ? shade(body, 0.86) : WHITE, -1, B, 3, 1); R(shade(body, 0.8), -2, B + bodyH - 3, 5, 1); }
  const trim = p.trim;
  if (back) switch (p.top) {                                     // seen from behind
    case 'apron': R(trim ?? WHITE, -1, B + bodyH - 3, 3, 1); break;                       // its strings, tied
    case 'yukata': R(body, -2, -legH - 1, 5, legH); R(p.shoes ?? legs, -1, -1); R(p.shoes ?? legs, 1, -1); R(trim ?? RED, -2, B + bodyH - 3, 5, 1); R(trim ?? RED, -1, B + bodyH - 5, 3, 2); break; // obi and its bow
    case 'sailor': R(COLORS.navy, -2, B, 5, 2); break;                                     // the collar's flap
    case 'police': R(trim ?? COLORS.navy, -1, B, 3, bodyH); break;
  }
  else switch (p.top) {
    case 'jacket': R(trim ?? WHITE, 0, B, 1, bodyH); break;                              // open: the shirt shows
    case 'suit': R(WHITE, -1, B, 3, 2); R(trim ?? BODY_COLORS[1], 0, B, 1, Math.min(4, bodyH)); break; // shirt and tie
    case 'apron': R(trim ?? WHITE, -1, B + 2, 3, bodyH); break;
    case 'yukata': R(body, -2, -legH - 1, 5, legH); R(p.shoes ?? legs, -1, -1); R(p.shoes ?? legs, 1, -1); R(trim ?? RED, -2, B + bodyH - 3, 5, 1); break; // robe to the feet, obi
    case 'sailor': R(COLORS.navy, -2, B, 5, 1); R(trim ?? RED, 0, B + 1); break;          // collar and ribbon
    case 'gakuran': R(COLORS.gold, 0, B + 1); R(COLORS.gold, 0, B + 3); break;            // gold buttons
    case 'police': R(trim ?? COLORS.navy, -1, B, 3, bodyH); R(COLORS.gold, -1, B + 1); break; // vest and badge
  }
  if (wear === 'skirt') R(legs, -2, -legH - 1, 5, 2);
  W(shade(body, 0.82), 2, B, 1, p.top === 'yukata' ? bodyH + legH - 1 : bodyH);   // the shaded side
  if (carry === 'backpack' && back) R(carryColor, -1, p.kid ? B - 1 : B, 3, p.kid ? 4 : bodyH - 2);  // a backpack, seen on the back
  // hands at the sides, swinging when walking; seen from the side, one hand
  // swings in front and behind; not over what is carried in front
  const swing = step === -1 ? 0 : step ? 1 : -1;
  if (carry !== 'boxes') {
    if (!side) { R(skin, -3, B + bodyH - 3 + swing, 1, 2); if (!['bag', 'briefcase', 'stick', 'umbrella'].includes(carry)) R(skin, 3, B + bodyH - 3 - swing, 1, 2); }  // front and back
    else if (swing) R(skin, swing > 0 ? 3 : -3, B + bodyH - 3, 1, 2);
  }
  if (carry === 'boxes' && !back) { R(carryColor, -2, B, 5, 4); R('#8a6440', -2, B + 2, 5, 1); }
  // head and hair (facing: a pixel of hair at the back of the head)
  R(skin, -1, Hd, 3, 4);
  let style = p.hairStyle ?? 'short';
  if (p.hat && (style === 'afro' || style === 'bun' || style === 'mohawk')) style = style === 'mohawk' ? 'bald' : 'short'; // under a hat
  if (style === 'bald' || style === 'mohawk') R(skin, -1, Hd - 1, 3, 1);
  if (back) {
    // from behind: hair over the whole head, the nape showing under short hair
    if (style === 'mohawk') R(hair, 0, Hd - 3, 1, 5);
    else if (style === 'afro') { R(hair, -2, Hd - 2, 5, 3); R(hair, -2, Hd + 1, 5, 2); }
    else if (style !== 'bald') {
      R(hair, -1, Hd - 1, 3, 4);
      if (style === 'bun') R(hair, 0, Hd - 2);
      if (style === 'long') { R(hair, -2, Hd, 5, 5); }
      if (style === 'ponytail') R(hair, step === 1 ? 1 : 0, Hd + 2, 1, 4);                    // the tail down the back, swinging
    }
  }
  if (back) { /* drawn above */ }
  else if (style === 'mohawk') R(hair, 0, Hd - 3, 1, 3);
  else if (style === 'afro') { R(hair, -2, Hd - 2, 5, 3); R(hair, -2, Hd + 1, 1, 2); R(hair, 2, Hd + 1, 1, 2); }
  else if (style !== 'bald') {
    R(hair, -1, Hd - 1, 3, 2);
    if (side) R(hair, -1, Hd + 1);
    if (style === 'bun') R(hair, 0, Hd - 2);
    if (style === 'long') { R(hair, -2, Hd, 1, 4); if (!side) R(hair, 2, Hd, 1, 4); }
    if (style === 'ponytail') {
      if (!side) { R(hair, 2, Hd); R(hair, 3, Hd, 1, 5); }                                        // seen from the front
      else if (step === 1) { R(hair, -2, Hd - 1, 1, 2); R(hair, -3, Hd, 1, 3); R(hair, -4, Hd + 2, 1, 2); } // swinging out
      else { R(hair, -2, Hd); R(hair, -3, Hd, 1, 5); }                                            // out, then down
    }
  }
  if (!back || style === 'bald' || style === 'mohawk') W(shade(skin, 0.88), 1, Hd + (style === 'bald' || style === 'mohawk' ? 0 : 1), 1, style === 'bald' || style === 'mohawk' ? 4 : 3);  // the shaded side of the face
  else W(shade(hair, 0.8), 1, Hd - 1, 1, 4);
  // a fringe or side part: one hair pixel on the face (seen from the front)
  if (p.fringe && !side && !back && !p.hat && style !== 'bald' && style !== 'mohawk' && style !== 'afro') R(hair, p.fringe === 'right' ? 1 : -1, Hd + 1);
  if (p.moustache && !back) R(hair, 0, Hd + 2);
  // hats
  const hatColor = p.hatColor ?? DEFAULT_HAT[p.hat];
  if (p.hat === 'cap') { R(hatColor, -1, Hd - 2, 3, 2); if (side) R(hatColor, 2, Hd - 1); }   // brim forward
  else if (p.hat === 'wide') { R(hatColor, -2, Hd - 1, 5, 1); R(hatColor, -1, Hd - 2, 3, 1); }  // straw hat, fedora
  // carried in the hand
  if (carry === 'bag') R(carryColor, 3, -legH - 2, 2, 3);
  else if (carry === 'briefcase') R(carryColor, 3, -legH - 1, 2, 2);
  else if (carry === 'stick') R(carryColor, 3, -legH - 4, 1, legH + 4);
  else if (carry === 'umbrella') {
    R(COLORS.ink, 2, Hd - 2, 1, 7);
    R(carryColor, -5, Hd - 3, 11, 1); R(carryColor, -4, Hd - 4, 9, 1); R(carryColor, -2, Hd - 5, 5, 1); R(COLORS.ink, 0, Hd - 6);
  }
  // the player's gold line
  if (p.you) R(COLORS.gold, -3, 1, 7, 1);
}

// --- people in 3D ---------------------------------------------------------------------
// Like the vehicles, a person is a small shape of pixel-sized blocks drawn
// from any heading (tinyVoxel): legs and shoes, the body and what is worn on
// it, arms with hands, the head, hair, a hat, what they carry. Their tops
// (hair, hat brims, shoulders, an umbrella) show from above like the
// buildings' roofs, the light comes from the upper left, and they turn
// round as one solid thing. Blocks: u is forward, v across (+ their left),
// z up from the soles; the body is 5 across and 3 deep, the head 3 x 3.

const HEAD_OF = { down: 90, up: 270, back: 270, right: 0, left: 180 };
const PEOPLE = new Map();
const HAND = -3;                                    // things are carried in the right hand

/** The blocks of a person (a Map 'u,v,z' -> colour) for a look and a moment (step: -1 standing, 0 or 1; bob 0 or 1). */
function personBlocks(p, step, bob) {
  const M = new Map(), set = (u, v, z, c) => M.set(`${u},${v},${z}`, c);
  const box = (u0, u1, v0, v1, z0, z1, c) => { for (let u = u0; u <= u1; u++) for (let v = v0; v <= v1; v++) for (let z = z0; z <= z1; z++) set(u, v, z, c); };
  const { legH, bodyH } = frameOf(p);
  const body = p.body ?? BODY_COLORS[0], legs = p.legs ?? COLORS.ink, skin = p.skin ?? SKIN_COLORS[1], hair = p.hair ?? COLORS.ink;
  const carry = p.carry, carryColor = p.carryColor ?? DEFAULT_CARRY[carry], wear = p.legwear ?? 'trousers', trim = p.trim;
  const shoes = p.shoes ?? (p.kid ? RED : '#3a2a22');
  const b0 = legH + bob, b1 = b0 + bodyH - 1, hz = b1 + 1;            // body rows, the head's bottom row
  const swing = step === -1 ? 0 : step ? 1 : -1;
  // legs: one forward and one back when walking; shoes with a toe; a talking bob stretches them
  if (p.top !== 'yukata') {
    for (const [v0, s] of [[1, swing], [-2, -swing]]) {
      const c = wear === 'trousers' ? legs : skin;
      box(-1 + s, 0 + s, v0, v0 + 1, 1, b0 - 1, c);
      if (wear === 'shorts') box(-1 + s, 0 + s, v0, v0 + 1, b0 - 1, b0 - 1, legs);
      box(-1 + s, 1 + s, v0, v0 + 1, 0, 0, shoes);
    }
    if (wear === 'skirt') box(-1, 1, -2, 2, b0 - 1, b0, legs);
  } else {
    box(-1, 1, -2, 2, 1, b0 - 1, body);                                  // the robe down to the feet
    box(0, 1, -1, -1, 0, 0, p.shoes ?? legs); box(0, 1, 1, 1, 0, 0, p.shoes ?? legs);
  }
  // the body, and what is worn on it (front: u = 1; back: u = -1)
  box(-1, 1, -2, 2, b0, b1, body);
  if (wear === 'skirt') box(-1, 1, -2, 2, b0, b0, legs);
  const front = (v0, v1, z0, z1, c) => box(1, 1, v0, v1, z0, z1, c), back = (v0, v1, z0, z1, c) => box(-1, -1, v0, v1, z0, z1, c);
  const hem = b0 + 2;
  switch (p.top) {
    case undefined: case null: front(-1, 1, b1, b1, light(body) ? shade(body, 0.86) : WHITE); box(-1, 1, -2, 2, hem, hem, shade(body, 0.8)); break;   // collar and hem
    case 'jacket': front(0, 0, b0, b1, trim ?? WHITE); break;
    case 'suit': front(-1, 1, b1 - 1, b1, WHITE); front(0, 0, b1 - Math.min(3, bodyH - 1), b1, trim ?? BODY_COLORS[1]); break;
    case 'apron': front(-1, 1, b0, b1 - 2, trim ?? WHITE); back(-1, 1, hem, hem, trim ?? WHITE); break;
    case 'yukata': box(-1, 1, -2, 2, hem, hem, trim ?? RED); box(-2, -2, -1, 1, hem + 1, hem + 2, trim ?? RED); break;   // obi and its bow
    case 'sailor': front(-2, 2, b1, b1, COLORS.navy); front(0, 0, b1 - 1, b1 - 1, trim ?? RED); back(-2, 2, b1 - 1, b1, COLORS.navy); break;
    case 'gakuran': front(0, 0, b1 - 1, b1 - 1, COLORS.gold); front(0, 0, b1 - 3, b1 - 3, COLORS.gold); break;
    case 'police': front(-1, 1, b0, b1, trim ?? COLORS.navy); front(1, 1, b1 - 1, b1 - 1, COLORS.gold); back(-1, 1, b0, b1, trim ?? COLORS.navy); break;
  }
  // arms: sleeves and hands, swinging opposite the legs; not when carrying boxes in front
  if (carry !== 'boxes') for (const [v, s] of [[3, -swing], [-3, swing]]) {
    const holding = v === HAND && ['bag', 'briefcase', 'stick', 'umbrella'].includes(carry), d = holding ? 0 : s;
    box(d, d, v, v, b0 + 2, b1, body); box(d, d, v, v, b0, b0 + 1, skin);
  }
  if (carry === 'boxes') { box(2, 3, -2, 2, b0 + 1, b0 + 4, carryColor); box(2, 3, -2, 2, b0 + 3, b0 + 3, '#8a6440'); box(1, 1, -3, -3, b0 + 1, b0 + 2, skin); box(1, 1, 3, 3, b0 + 1, b0 + 2, skin); }
  if (carry === 'backpack') { box(-2, -2, -1, 1, b0 + (p.kid ? 0 : 1), b1, carryColor); box(-2, -2, -1, 1, b1, b1, shade(carryColor, 0.8)); }
  // the head and hair
  box(-1, 1, -1, 1, hz, hz + 3, skin);
  let style = p.hairStyle ?? 'short';
  if (p.hat && (style === 'afro' || style === 'bun' || style === 'mohawk')) style = style === 'mohawk' ? 'bald' : 'short';
  // (the top of the head shows from above, so hair needs no extra row over it, as the flat drawing did)
  if (style === 'mohawk') box(-1, 1, 0, 0, hz + 3, hz + 5, hair);
  else if (style === 'afro') { box(-2, 1, -2, 2, hz + 3, hz + 4, hair); box(-2, 1, -2, -2, hz + 1, hz + 2, hair); box(-2, 1, 2, 2, hz + 1, hz + 2, hair); box(-2, -2, -2, 2, hz + 1, hz + 2, hair); }
  else if (style !== 'bald') {
    box(-1, 1, -1, 1, hz + 3, hz + 3, hair);                              // the top of the head
    box(-1, -1, -1, 1, hz + 1, hz + 3, hair);                             // the back, the nape bare
    if (style === 'bun') box(-1, 0, 0, 0, hz + 4, hz + 4, hair);
    if (style === 'long') { box(-1, 0, -2, -2, hz, hz + 3, hair); box(-1, 0, 2, 2, hz, hz + 3, hair); box(-2, -2, -2, 2, hz - 1, hz + 3, hair); }
    if (style === 'ponytail') { set(-2, 0, hz + 3, hair); const out = step === 1 ? -4 : -3; box(-3, -3, 0, 0, hz + 1, hz + 3, hair); box(out, out, 0, 0, hz - 1, hz + 1, hair); }
  }
  if (p.fringe && !p.hat && style !== 'bald' && style !== 'mohawk' && style !== 'afro') set(1, p.fringe === 'right' ? -1 : 1, hz + 2, hair);
  if (p.moustache) set(1, 0, hz + 1, hair);
  // hats
  const hatColor = p.hatColor ?? DEFAULT_HAT[p.hat];
  if (p.hat === 'cap') { box(-1, 1, -1, 1, hz + 3, hz + 4, hatColor); box(2, 2, -1, 1, hz + 3, hz + 3, hatColor); }   // the brim forward
  else if (p.hat === 'wide') { box(-2, 2, -2, 2, hz + 3, hz + 3, hatColor); box(-1, 1, -1, 1, hz + 4, hz + 4, hatColor); }
  // carried in the hand
  if (carry === 'bag') box(-1, 0, HAND - 1, HAND, b0 - 2, b0 - 1, carryColor);
  else if (carry === 'briefcase') box(-1, 1, HAND, HAND, b0 - 2, b0 - 1, carryColor);
  else if (carry === 'stick') box(1, 1, HAND, HAND, 0, b0 + 1, carryColor);
  else if (carry === 'umbrella') {
    // held high, so the face shows under it: a round canopy, seen from above
    box(0, 0, -2, -2, b0 + 2, hz + 6, COLORS.ink);
    for (const [z, r] of [[hz + 7, 4.7], [hz + 8, 3.3]]) for (let u = -5; u <= 5; u++) for (let v = -5; v <= 5; v++) if (u * u + v * v <= r * r) set(u, v, z, carryColor);
    set(0, 0, hz + 9, COLORS.ink);
  }
  return M;
}

/** A person's sprite for a look, a moment and a heading (kept once made). */
function personSprite(p, step, bob, heading) {
  const look = [p.kid, p.size, p.body, p.legs, p.skin, p.hair, p.hairStyle, p.fringe, p.moustache, p.hat, p.hatColor, p.top, p.trim, p.legwear, p.shoes, p.carry, p.carryColor].join('|');
  const key = `${look}#${step}${bob}@${heading}`;
  if (!PEOPLE.has(key)) {
    const M = personBlocks(p, step, bob);
    PEOPLE.set(key, voxelSprite((u, v, z) => M.get(`${u},${v},${z}`) ?? null, { L: 12, W: 12, H: 28, centred: true }, heading));
  }
  return PEOPLE.get(key);
}

/**
 * Draw one person with their feet at (p.x, p.y): a small 3D figure seen the
 * way the town is, from in front and above, at p.heading (degrees: 0 right,
 * 90 towards you, 180 left, 270 away; 8 steps) or p.facing ('down' their
 * front, 'up' their back, 'left', 'right'). `t` (seconds) drives the talking
 * bob and the walking step: legs and arms swing front and back.
 * Looks (all optional, see SKILLS.md): kid, size, hairStyle, fringe,
 * moustache, hat, hatColor, top, trim, legwear, shoes, carry, carryColor.
 * No eyes: the people are faceless. drawCharacterFlat is the old flat drawing.
 */
export function drawCharacter(g, p, t = 0) {
  const talkBob = p.talking && Math.floor(t * 6) % 2 ? 1 : 0;
  const step = p.walking ? Math.floor(t * 8) % 2 : -1;
  const bob = talkBob || (p.walking && step === 1 ? 1 : 0);
  const heading = p.heading ?? HEAD_OF[p.facing ?? 'down'] ?? 90;
  const dir = ((Math.round(heading / 45) % 8) + 8) % 8;                 // 8 steps: at this size the in-between ones are noise
  const s = personSprite(p, step, bob, dir * 45);
  const x = Math.round(p.x), y = Math.round(p.y);
  g.drawImage(s.canvas, x - s.ox, y - s.oy);
  if (p.you) { g.fillStyle = COLORS.gold; g.fillRect(x - 3, y + 2, 7, 1); }   // the player's gold line
}

/**
 * Which way someone walking by (dx, dy) faces: 'up' (their back), 'down'
 * (their front), 'left' or 'right', whichever way they move most.
 */
export function facingFor(dx, dy, was = 'down') {
  if (!dx && !dy) return was;
  return Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right');
}

/** The point just over a person's head (where speech goes), above any hat or umbrella. */
export function headOf(p) {
  const { Hd } = frameOf(p);
  const style = p.hairStyle ?? 'short';
  let top = Hd - 1;
  if (p.hat || style === 'afro' || style === 'bun') top = Hd - 2;
  if (style === 'mohawk' && !p.hat) top = Hd - 3;
  if (p.carry === 'umbrella') top = Hd - 6;
  return { x: p.x, y: p.y + top - 1 };
}

/**
 * Starter looks, like tiny-catalogue's people tiles and outfits. Spread one
 * into a person: { ...LOOKS.salaryman, skin, x, y }.
 */
export const LOOKS = {
  man: { body: WHITE, legs: COLORS.navy, hair: COLORS.ink },
  woman: { body: '#d46a8e', legs: COLORS.navy, hair: '#3a2a22', hairStyle: 'long', legwear: 'skirt', fringe: 'left' },
  boy: { kid: true, body: '#f2c230', legs: COLORS.navy, hair: COLORS.ink, legwear: 'shorts', carry: 'backpack', carryColor: COLORS.ink },
  girl: { kid: true, body: WHITE, legs: RED, hair: COLORS.ink, hairStyle: 'ponytail', legwear: 'skirt', carry: 'backpack', carryColor: RED },
  grandpa: { body: '#9e6c60', trim: '#c9b48a', top: 'jacket', legs: '#6b5a48', hair: '#b3b0a8', moustache: true, hat: 'cap', hatColor: '#7a7a74', carry: 'stick' },
  grandma: { size: 'short', body: '#7a6aa8', top: 'jacket', legs: '#6b4a2a', hair: '#f2efe8', hairStyle: 'bun', legwear: 'skirt', carry: 'bag' },
  schoolboy: { kid: true, body: COLORS.ink, legs: COLORS.ink, hair: COLORS.ink, top: 'gakuran' },
  schoolgirl: { kid: true, body: WHITE, legs: COLORS.navy, hair: COLORS.ink, hairStyle: 'ponytail', top: 'sailor', legwear: 'skirt' },
  salaryman: { fringe: 'right', body: COLORS.navy, legs: COLORS.navy, hair: COLORS.ink, top: 'suit', carry: 'briefcase' },
  police: { size: 'tall', body: '#bcd2e0', legs: COLORS.navy, hair: COLORS.ink, top: 'police', hat: 'cap', hatColor: COLORS.navy },
  delivery: { body: '#3f7fd6', legs: COLORS.navy, hair: COLORS.ink, hat: 'cap', hatColor: '#3f7fd6', carry: 'boxes' },
  summer: { body: WHITE, legs: '#c9b48a', hair: '#3a2a22', legwear: 'shorts', hat: 'wide' },
  rainy: { body: COLORS.navy, top: 'jacket', legs: COLORS.ink, hair: '#8a5a2a', carry: 'umbrella' },
};

/** The lab's backdrop: grass, a path across, a row of grass tufts. */
export function drawStage(g, W, H, { pathY = Math.round(H * 0.68), pathH = Math.round(H * 0.18) } = {}) {
  g.fillStyle = COLORS.grass; g.fillRect(0, 0, W, H);
  g.fillStyle = COLORS.path; g.fillRect(0, pathY, W, pathH);
  g.fillStyle = COLORS.grass2; for (let x = 0; x < W; x += 9) g.fillRect(x + ((x / 9) % 2) * 3, pathY - 12, 2, 1);
}

/**
 * A random look. rng: () => [0, 1) (Math.random by default). Mostly plain
 * people as in the bubble lab, some kids, other hairstyles, hats, jackets,
 * skirts and things to carry.
 */
export function randomCharacter(rng = Math.random) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const body = pick(BODY_COLORS);
  let legs = pick(LEG_COLORS);
  if (legs === body) legs = COLORS.ink;
  const p = { body, hair: pick(HAIR_COLORS), skin: pick(SKIN_COLORS), legs };
  const grey = p.hair === '#b3b0a8' || p.hair === '#f2efe8';
  if (!grey && rng() < 0.2) p.kid = true;
  p.hairStyle = pick(['short', 'short', 'short', 'short', 'long', 'long', 'ponytail', 'ponytail', 'bald', 'bun', 'afro', 'mohawk']);
  if (p.kid && (p.hairStyle === 'bald' || p.hairStyle === 'mohawk')) p.hairStyle = 'short';
  if (!p.kid) { const r = rng(); if (r < 0.2) p.size = 'tall'; else if (r < 0.4) p.size = 'short'; }
  if (rng() < 0.5) p.fringe = rng() < 0.5 ? 'left' : 'right';
  if (!p.kid && rng() < 0.1) p.moustache = true;
  if (rng() < 0.2) { p.hat = pick(HATS); p.hatColor = pick(THING_COLORS); }
  const top = rng();
  if (top < 0.15) { p.top = 'jacket'; p.trim = pick(BODY_COLORS); }
  else if (top < 0.2 && !p.kid) { p.top = 'suit'; p.trim = pick(BODY_COLORS); }
  else if (top < 0.23) p.top = 'apron';
  const wear = rng();
  if (wear < 0.2) p.legwear = 'skirt'; else if (wear < 0.35) p.legwear = 'shorts';
  if (rng() < 0.3) {
    p.carry = grey && rng() < 0.5 ? 'stick' : pick(['bag', 'bag', 'briefcase', 'backpack', 'backpack', 'umbrella']);
    if (p.carry !== 'stick') p.carryColor = pick(THING_COLORS);
  }
  if (p.trim === body) delete p.trim;
  return p;
}

/** A small seeded random number generator (mulberry32), for repeatable crowds. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Real pixels: every pixel of the canvas snapped to the nearest colour of
 * `palette` (CSS hex strings), fully opaque. Run after drawing a frame when
 * anything smooth (text, scaled images) was drawn on top.
 */
export function snapToPalette(g, W, H, palette = [...Object.values(COLORS), ...BODY_COLORS, ...HAIR_COLORS, ...SKIN_COLORS, ...LEG_COLORS, ...THING_COLORS, ...CAT_COLORS, '#c9b48a']) {
  const pal = palette.filter((h) => h.startsWith('#')).map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));   // solid colours only (not the shadow)
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let best = pal[0], bd = Infinity;
    for (const c of pal) { const e = (c[0] - d[i]) ** 2 + (c[1] - d[i + 1]) ** 2 + (c[2] - d[i + 2]) ** 2; if (e < bd) { bd = e; best = c; } }
    d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

/**
 * A person from a starter look and a seed, the same every time: seed 0 is
 * the look as it is in LOOKS; any other seed keeps the clothes and changes
 * the skin and hair colour (grey and white hair stay). 'random' is a whole
 * random person (randomCharacter), 'kid' a random kid.
 *   drawCharacter(g, { ...lookFor('salaryman', 7), x, y }, t)
 */
export function lookFor(name = 'random', seed = 0) {
  const rng = seeded((seed >>> 0) * 7919 + (name === 'kid' ? 41 : 13));
  if (name === 'random') return randomCharacter(rng);
  if (name === 'kid') {
    const p = { ...randomCharacter(rng), kid: true, moustache: undefined };
    if (p.hairStyle === 'bald' || p.hairStyle === 'mohawk') p.hairStyle = 'short';
    if (p.top === 'suit') delete p.top;
    return p;
  }
  const base = LOOKS[name] ?? {};
  if (!seed) return { skin: SKIN_COLORS[1], ...base };
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const look = { ...base, skin: pick(SKIN_COLORS) };
  if (!base.kid) { const r = rng(); look.size = r < 0.25 ? 'tall' : r < 0.5 ? 'short' : undefined; }
  if (rng() < 0.5) look.fringe = rng() < 0.5 ? 'left' : 'right';
  const grey = ['#b3b0a8', '#f2efe8'];
  if (!grey.includes(base.hair)) look.hair = pick(HAIR_COLORS.filter((c) => !grey.includes(c)));
  return look;
}
