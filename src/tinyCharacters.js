// Tiny Characters: the little pixel people from Tiny City Builder's bubble
// lab, as a small reusable library. Each person is drawn with a handful of
// rectangles on a low-resolution canvas (about 5 x 15 pixels), then the
// canvas is scaled up with hard pixels (CSS `image-rendering: pixelated`).
//
//   drawCharacter(g, person, t)   one person, feet at (person.x, person.y)
//   drawStage(g, W, H)            the lab's grass strip and path
//   drawRing(g, x, y, colour)     a thin ring round the feet (you: gold; pointed at: white)
//   randomCharacter(rng)          a random look
//   LOOKS                         starter looks (salaryman, grandma ...)
//   snapToPalette(g, W, H)        hard edges, only the palette's colours
//
// A person: { x, y, body, hair, skin, legs, you, talking, walking, facing }
// plus looks: kid, hairStyle, moustache, hat, hatColor, top, trim, legwear,
// carry, carryColor (see SKILLS.md).
// Colours are CSS strings. Plain ES module, no dependencies.

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
/** A colour darker (f < 1) or lighter (f > 1) (the other modules use this one). */
export const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');
/** A canvas of its own, w x h (an OffscreenCanvas where there is one) (the other modules use this one). */
export const canvasOf = (w, h) => (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h }));
/** Is a colour light (so a white collar would not show on it)? */
const light = (hex) => [1, 3, 5].reduce((a, i) => a + parseInt(hex.slice(i, i + 2), 16), 0) > 600;
const DEFAULT_HAT = { cap: RED, wide: '#d8b860' };
const DEFAULT_CARRY = { backpack: '#e8402f', bag: '#c9b48a', briefcase: '#2f3236', umbrella: '#3f7fd6', stick: '#6b4a2a', boxes: '#c09060' };

/** Is someone old (grey or white hair, not a kid; or p.stoop): they stoop and walk slower (the owner, Nov 2026). */
export const isOld = (p) => p.stoop ?? (!p.kid && (p.hair === '#b3b0a8' || p.hair === '#f2efe8'));
// Row offsets (from the feet) of a person: legs, body top, head top (an old person's head a pixel lower: a stoop).
function frameOf(p, bob = 0) {
  // a kid 11 px tall, short 14, everyone else 15, tall 17
  const legH = p.kid ? 2 : p.size === 'tall' ? 4 : 3, bodyH = p.kid ? 4 : p.size === 'tall' ? 7 : p.size === 'short' ? 5 : 6;
  const B = -legH - bodyH + bob;
  return { legH, bodyH, B, Hd: B - 4 + (isOld(p) ? 1 : 0) };
}

/**
 * Draw one person with their feet at (p.x, p.y), into a 2D context `g` of a
 * low-res canvas. `t` (seconds) drives the talking bob and the walking step.
 *  - talking: the body and head bob up a pixel, six times a second
 *  - walking: the legs take turns lifting a pixel, eight steps a second
 *  - you: a thin gold ring round the feet (the player); ring: a ring of that
 *    colour (the demo: white under whoever the pointer is over, or was tapped)
 * facing: 'down' (the front; also nothing), 'up' (the back), 'left', 'right'.
 * Looks (all optional, see SKILLS.md): kid, size, hairStyle, fringe,
 * moustache, hat, hatColor, top, trim, legwear, shoes, carry, carryColor.
 * Everyone has hands, shoes, a darker right side, and a collar and hem on a
 * plain top. No eyes: the people are faceless.
 */
export function drawCharacter(g, p, t = 0) {
  if (p.facing === 'left' || p.facing === 'right') { drawSide(g, p, t); return; }
  const x = Math.round(p.x), y = Math.round(p.y);
  if (p.you || p.ring) drawRing(g, x, y, p.ring ?? COLORS.gold);   // round the feet, under everything
  const talkBob = p.talking && Math.floor(t * 6) % 2 ? -1 : 0;
  const step = p.walking ? Math.floor(t * (isOld(p) ? 5 : 8)) % 2 : -1;      // which leg is lifted (-1: standing; slower when old)
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
    if (bob < 0) R(wear === 'trousers' || wear === 'skirt' ? legs : skin, -2, -legH + bob, 5, -bob);   // the hips, so the bob opens no gap
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
}

/**
 * A person seen side on (the owner chose A, Nov 2026): a profile, 4 pixels wide (the front view is 5),
 * the head with a nose pixel at the front and the hair over the top and down the back (no eyes); each
 * leg a pixel wide, the far one darker; walking takes four steps (the legs' lower halves a pixel
 * forward and back, then passing, the body a pixel up), the near hand swinging forward and back.
 */
function drawSide(g, p, t = 0, bw = 4) {
  const x = Math.round(p.x), y = Math.round(p.y);
  if (p.you || p.ring) drawRing(g, x, y, p.ring ?? COLORS.gold);
  const s = p.facing === 'left' ? -1 : 1;
  const R = (c, dx, dy, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(s > 0 ? x + dx : x - dx - w + 1, y + dy, w, h); };
  const old = isOld(p), phase = p.walking ? Math.floor(t * (old ? 5 : 8)) % 4 : -1;                 // 0: near leg forward, 2: far leg forward, 1 / 3: passing
  const talkBob = p.talking && Math.floor(t * 6) % 2 ? -1 : 0, bob = talkBob || (phase === 1 || phase === 3 ? -1 : 0);
  const { legH, bodyH, B, Hd } = frameOf(p, bob);
  const body = p.body ?? BODY_COLORS[0], legs = p.legs ?? COLORS.ink, skin = p.skin ?? SKIN_COLORS[1], hair = p.hair ?? COLORS.ink;
  const carry = p.carry, carryColor = p.carryColor ?? DEFAULT_CARRY[carry], wear = p.legwear ?? 'trousers', shoes = p.shoes ?? (p.kid ? RED : '#3a2a22');
  const L = bw === 4 ? -2 : -1;                                          // the body's back column (its front is +1)
  if (carry === 'backpack') R(carryColor, L - 2, p.kid ? B - 1 : B, 2, p.kid ? 3 : 4);
  // legs: a stride (forward leg leaning to the front, back leg to the back), the far one darker
  const legCol = wear === 'trousers' ? legs : skin;
  // each leg one pixel wide seen from the side (near at 0, far at -1); a step: the leg's lower half
  // a pixel forward or back, the shoe a pixel longer at the toe
  const leg = (col, fwd, c, sh) => {
    for (let i = 0; i < legH; i++) {
      const lower = i >= Math.ceil(legH / 2), dx = col + (lower ? fwd : 0), last = i === legH - 1;
      R(last ? sh : wear === 'shorts' && i === 0 ? legs : c, dx, -legH + i, 1, 1);
      if (last) R(sh, dx + 1, -1, 1, 1);
    }
  };
  if (p.top !== 'yukata') {
    if (bob < 0) R(wear === 'trousers' || wear === 'skirt' ? legs : skin, -1, -legH - 1, 2, 1);
    const far = shade(legCol, 0.72), farShoe = shade(shoes, 0.75);
    if (phase === 0) { leg(-1, -1, far, farShoe); leg(0, 1, legCol, shoes); }
    else if (phase === 2) { leg(-1, 1, far, farShoe); leg(0, -1, legCol, shoes); }
    else { leg(-1, 0, far, farShoe); leg(0, 0, legCol, shoes); }
  }
  // body
  R(body, L, B, bw, bodyH);
  R(shade(body, 0.8), L, B + bodyH - 3, bw, 1);                          // the hem
  switch (p.top) {
    case 'jacket': R(p.trim ?? WHITE, 1, B, 1, bodyH); break;
    case 'suit': R(WHITE, 1, B, 1, 2); break;
    case 'apron': R(p.trim ?? WHITE, 1, B + 2, 1, bodyH - 2); break;
    case 'yukata': R(body, L, -legH - 1, bw, legH); R(p.shoes ?? legs, 0, -1, 2, 1); R(p.trim ?? RED, L, B + bodyH - 3, bw, 1); break;
    case 'sailor': R(COLORS.navy, L, B, bw - 1, 2); R(p.trim ?? RED, 1, B + 1); break;
    case 'gakuran': R(COLORS.gold, 1, B + 1); R(COLORS.gold, 1, B + 3); break;
    case 'police': R(p.trim ?? COLORS.navy, L, B, bw, bodyH); R(COLORS.gold, 1, B + 1); break;
  }
  if (wear === 'skirt') R(legs, -2, -legH - 1, bw === 4 ? 5 : 4, 2);
  // the near arm: a sleeve down the side, the hand swinging forward and back
  const swing = phase === 0 ? -2 : phase === 2 ? 2 : 0;
  if (carry !== 'boxes') {
    R(shade(body, 0.86), 0, B + 1, 1, bodyH - 3);
    R(skin, swing === 0 ? 0 : swing, B + bodyH - 3 + (swing ? 0 : 1), 1, 2);
  }
  if (carry === 'boxes') { R(carryColor, 1, B, 3, 4); R('#8a6440', 1, B + 2, 3, 1); R(skin, 1, B + 2); }
  const H = (c, dx, dy, w = 1, h = 1) => R(c, dx + (old ? 1 : 0), dy, w, h);   // the head (old: a pixel forward, over a rounded back)
  if (old) R(body, L, B - 1, 2, 1);
  // the head in profile: the face at the front, a nose, hair over the top and the back
  H(skin, -1, Hd, 3, 4); H(skin, 2, Hd + 2);                              // head, nose
  H(shade(skin, 0.88), -1, Hd + 1, 1, 3);
  let style = p.hairStyle ?? 'short';
  if (p.hat && (style === 'afro' || style === 'bun' || style === 'mohawk')) style = style === 'mohawk' ? 'bald' : 'short';
  if (style === 'afro') { H(hair, -2, Hd - 2, 4, 3); H(hair, -2, Hd + 1, 2, 2); }
  else if (style === 'mohawk') H(hair, -1, Hd - 1, 3, 1);
  else if (style !== 'bald') {
    H(hair, -1, Hd - 1, 3, 1); H(hair, -1, Hd, 2, 1); H(hair, -1, Hd + 1, 1, 1);
    if (style === 'long') { H(hair, -2, Hd, 1, 5); H(hair, -1, Hd + 2, 1, 3); }
    if (style === 'bun') H(hair, -2, Hd - 1, 1, 2);
    if (style === 'ponytail') { const sw = phase === 1 || phase === 3 ? -1 : 0; H(hair, -2, Hd, 1, 1); H(hair, -3 + sw, Hd + 1, 1, 3); }
  }
  if (p.moustache) H(hair, 1, Hd + 3);
  const hatColor = p.hatColor ?? DEFAULT_HAT[p.hat];
  if (p.hat === 'cap') { H(hatColor, -1, Hd - 2, 3, 2); H(hatColor, 2, Hd - 1); }
  else if (p.hat === 'wide') { H(hatColor, -2, Hd - 1, 5, 1); H(hatColor, -1, Hd - 2, 3, 1); }
  // carried in the near hand
  const hx = swing, hy = B + bodyH - 1;
  if (carry === 'bag') R(carryColor, hx - 1 + (swing < 0 ? 0 : 0), -legH - 1, 2, 3);
  else if (carry === 'briefcase') R(carryColor, hx - 1, -legH, 3, 2);
  else if (carry === 'stick') R(carryColor, 2, -legH - 3, 1, legH + 3);
  else if (carry === 'umbrella') { R(COLORS.ink, 1, Hd - 2, 1, 7); R(carryColor, -5, Hd - 3, 11, 1); R(carryColor, -4, Hd - 4, 9, 1); R(carryColor, -2, Hd - 5, 5, 1); R(COLORS.ink, 0, Hd - 6); }
}
/**
 * A thin ring on the ground round someone's feet at (x, y): 13 x 5 pixels, its
 * back row hidden behind the legs (draw it before them). The owner's choice
 * (Nov 2026): gold under you, white under whoever you point at.
 */
export function drawRing(g, x, y, c = COLORS.gold) {
  x = Math.round(x); y = Math.round(y); g.fillStyle = c;
  for (const [dx, dy, w] of [[-3, -2, 7], [-5, -1, 2], [4, -1, 2], [-6, 0, 1], [6, 0, 1], [-5, 1, 2], [4, 1, 2], [-3, 2, 7]]) g.fillRect(x + dx, y + dy, w, 1);
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
