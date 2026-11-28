// Tiny Monsters: zombies, werewolves, ghosts, reapers, giant spiders,
// skeletons and flaming skulls, in the same small pixel style as the people
// (a person is 5 x 15), with four views like them.
//
//   drawMonster(g, { type, variant, x, y, facing, walking }, t)   feet (or shadow) at x, y
//   MONSTERS: type -> { label, variants: [names] }
//
// facing: 'down' (the front; also nothing), 'up' (the back), 'left', 'right'.
// variant: 0-3 or a variant's name. t (seconds) drives walking, floating,
// flickering fire. Unlike the faceless people, monsters have eyes. Only
// floating and flying monsters (ghost girl, reaper, skull) have a shadow.

import { COLORS, shade } from './tinyCharacters.js';

const INK = '#2f3236';

/** The monsters and their four variants. */
export const MONSTERS = {
  zombie: { label: 'Zombie', variants: ['office', 'schoolgirl', 'farmer', 'rotten'] },
  werewolf: { label: 'Werewolf', variants: ['grey', 'brown', 'black', 'white'] },
  ghostGirl: { label: 'Ghost girl', variants: ['white dress', 'yurei', 'red dress', 'pale blue'] },
  reaper: { label: 'Reaper (scythe)', variants: ['black', 'purple', 'navy', 'bone'] },
  spider: { label: 'Giant spider', variants: ['black widow', 'tarantula', 'huntsman', 'poison'] },
  skeleton: { label: 'Skeleton', variants: ['plain', 'warrior', 'pirate', 'mage'] },
  skull: { label: 'Flaming skull', variants: ['fire', 'blue fire', 'green fire', 'purple fire'] },
};

/** Draw a monster with its feet (or, for floaters, its shadow) at (m.x, m.y). */
export function drawMonster(g, m, t = 0) {
  const def = MONSTERS[m.type];
  if (!def) return;
  const v = typeof m.variant === 'string' ? Math.max(0, def.variants.indexOf(m.variant)) : (m.variant ?? 0) % 4;
  const x = Math.round(m.x), y = Math.round(m.y);
  const s = m.facing === 'left' ? -1 : 1, side = m.facing === 'left' || m.facing === 'right';
  const back = m.facing === 'up' || m.facing === 'back';
  // R: mirrored when facing left; W: never mirrored
  const R = (c, dx, dy, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(s > 0 ? x + dx : x - dx - w + 1, y + dy, w, h); };
  const W = (c, dx, dy, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, w, h); };
  DRAW[m.type]({ R, W, g, x, y, v, side, back, s, t, walking: !!m.walking });
}

// --- zombies ----------------------------------------------------------------------
const ZOMBIES = [
  { skin: '#9fb08a', top: '#e4e0d6', legs: '#4a4e54', hair: '#3a3a2e', tie: '#7a3a32' },          // office worker
  { skin: '#a8b496', top: '#eeeae0', legs: '#a8b496', hair: INK, skirt: '#2c3652', sailor: true, long: true },   // schoolgirl
  { skin: '#8fa078', top: '#c8a060', legs: '#4a6a8a', hair: '#6a5a3a', overalls: '#4a6a8a', hat: '#d8b860' },  // farmer
  { skin: '#7a8a60', top: '#6a5a48', legs: '#5a4a3a', hair: null, ribs: true },                     // rotten
];
function zombie({ R: R0, W: W0, v, side, back, t, walking }) {
  const z = ZOMBIES[v], step = walking ? Math.floor(t * 4) % 2 : -1;      // a slow shamble
  // a lurch from side to side as it shambles (head on), its top half leaning in (side on)
  const sway = walking && !side ? (step ? 1 : -1) : 0;
  const R = (c, dx, dy, w, h) => R0(c, dx + (dy < -3 ? sway : 0) + (side && dy < -8 ? 1 : 0), dy, w, h);
  const W = (c, dx, dy, w, h) => W0(c, dx + (dy < -3 ? sway : 0) + (side && dy < -8 ? 1 : 0), dy, w, h);
  const B = -9, Hd = -13, blood = '#7a2a22';
  // legs: one drags (lifts less)
  for (const [dx, lifted] of [[-2, step === 0], [1, step === 1]]) {
    const h = lifted ? 2 : 3;
    R(z.skirt ? z.skin : z.legs, dx, -3, 2, h); R('#3a3a2e', dx, -3 + h - 1, 2, 1);
  }
  if (z.skirt) R(z.skirt, -2, -4, 5, 2);
  // body: torn clothes, skin showing through, a stain
  R(z.top, -2, B, 5, 6);
  if (z.overalls) { R(z.overalls, -2, B + 2, 5, 4); if (!back) { R(z.overalls, -2, B, 1, 2); R(z.overalls, 2, B, 1, 2); } }
  if (z.sailor) R('#2c3652', -2, B, 5, back ? 2 : 1);
  if (z.ribs) { R(z.skin, -1, B + 1, 3, 3); R(shade(z.skin, 0.7), -1, B + 2, 3, 1); R(shade(z.skin, 0.7), -1, B + 4, 3, 1); }
  else { R(z.skin, 1, B + 3, 1, 1); R(z.skin, -2, B + 4, 1, 1); }
  if (!back) R(blood, 0, B + 2, 1, 1);
  if (z.tie && !back) R(z.tie, 0, B, 1, 3);
  R(z.top, -2, B + 5, 1, 1); R(shade(z.top, 0.8), 2, B, 1, 6);              // ragged hem, shaded side
  // arms reaching forward
  // arms held out in front (the owner, Nov 2026): side on long and level, the hands drooping; head on
  // reaching at you, sleeves and hands over the chest, a little apart; from behind, the elbows out
  if (side) { R(shade(z.top, 0.85), 2, B + 1, 4, 1); R(shade(z.top, 0.7), 2, B + 2, 3, 1); R(z.skin, 6, B + 1, 1, 2); R(z.skin, 5, B + 3, 1, 1); }
  else if (back) { R(shade(z.top, 0.85), -3, B + 1, 1, 2); R(shade(z.top, 0.85), 3, B + 1, 1, 2); }
  else { R(shade(z.top, 0.85), -3, B + 1, 2, 2); R(shade(z.top, 0.85), 2, B + 1, 2, 2); R(z.skin, -3, B + 3, 2, 1); R(z.skin, 2, B + 3, 2, 1); R(shade(z.skin, 0.8), -3, B + 3, 1, 1); R(shade(z.skin, 0.8), 3, B + 3, 1, 1); }
  // head: grey-green, sunken eyes, hair or none
  R(z.skin, -1, Hd, 3, 4);
  if (back) { if (z.hair) R(z.hair, -1, Hd - 1, 3, z.long ? 6 : 3); }
  else {
    if (z.hair) { R(z.hair, -1, Hd - 1, 3, 2); if (side) R(z.hair, -1, Hd + 1, 1, 1); if (z.long) { R(z.hair, -2, Hd, 1, 5); if (!side) R(z.hair, 2, Hd, 1, 5); } }
    else { R(z.skin, -1, Hd - 1, 3, 1); R(shade(z.skin, 0.8), 0, Hd - 1, 1, 1); }
    if (side) R(INK, 1, Hd + 1, 1, 1); else { R(INK, -1, Hd + 1, 1, 1); R(INK, 1, Hd + 1, 1, 1); R(blood, 0, Hd + 3, 1, 1); }
  }
  if (z.hat) { R(z.hat, -2, Hd - 1, 5, 1); R(z.hat, -1, Hd - 2, 3, 1); }
  W(shade(z.skin, 0.85), 1, Hd + (back ? 3 : 1), 1, back ? 1 : 3);
}

// --- werewolves -------------------------------------------------------------------
const WOLVES = [
  { fur: '#8a8a88', eye: '#f2d040', rags: '#4a4a6a' },
  { fur: '#7a5a3e', eye: '#e8402f', rags: '#5a6a4a' },
  { fur: '#3a3a3e', eye: '#f2d040', rags: '#6a3a3a' },
  { fur: '#e8e6e0', eye: '#4ab0e8', rags: '#4a5a7a' },
];
function werewolf({ R, W, v, side, back, t, walking }) {
  const f = WOLVES[v], fur = f.fur, dark = shade(fur, 0.72), light = shade(fur, 1.22), claw = '#f2efe8';
  const step = walking ? Math.floor(t * 6) % 2 : -1;
  const B = -11, Hd = -14;                                                  // taller than a person, hunched (the head low)
  // legs bent like a wolf's: thigh, shin, a clawed foot
  for (const [dx, lifted] of [[-3, step === 0], [1, step === 1]]) {
    const up = lifted ? 1 : 0;
    R(fur, dx, -4 - up, 2, 2); R(dark, dx + 1, -2 - up, 1, 2); R(fur, dx, -1 - up, 3, 1); R(claw, dx + 2, -1 - up, 1, 1);
  }
  R(f.rags, -3, -5, 7, 2); R(shade(f.rags, 0.75), -3, -4, 1, 1); R(shade(f.rags, 0.75), 3, -4, 1, 1);   // torn trousers
  if ((back || side) && true) { const tx = side ? -4 : 0; R(fur, tx, -6, 1, 3); R(dark, tx - (side ? 1 : 0), -4, 1, 1); }    // tail
  // a hunched beast (the owner, Nov 2026: less boxy): broad shoulders over a narrow waist, shaggy edges, a
  // lighter chest, the head low and forward between the shoulders
  R(fur, -2, B + 3, 5, 4); R(fur, -3, B, 7, 3); R(fur, -4, B + 1, 1, 2); R(fur, 4, B + 1, 1, 2);   // waist, chest, shoulders
  R(dark, -3, B + 5, 1, 1); R(dark, 3, B + 4, 1, 1); R(fur, -3, B + 3, 1, 1); R(fur, 3, B + 3, 1, 1); // shaggy sides
  W(dark, 2, B + 3, 1, 4);
  if (!back) { R(light, -1, B + 1, side ? 2 : 3, 3); R(light, 0, B + 4, 1, 1); }
  else R(dark, 0, B + 1, 1, 4);                                             // the spine
  R(dark, -3, B, 7, 1); R(fur, -2, B - 1, 5, 1);                            // the hump of the shoulders
  // long arms hanging low, claws by the knees
  if (side) { R(fur, 1, B + 2, 2, 3); R(fur, 2, B + 5, 2, 2); R(dark, 2, B + 6, 1, 1); R(claw, 4, B + 7, 1, 1); R(claw, 3, B + 8, 1, 1); R(claw, 2, B + 8, 1, 1); }
  else { for (const ax of [-5, 5]) { R(fur, ax, B + 2, 1, 5); R(dark, ax, B + 5, 1, 1); R(claw, ax, B + 7, 1, 1); R(claw, ax + (ax < 0 ? 1 : -1), B + 7, 1, 1); } }
  const Hh = (c, dx, dy, w = 1, h = 1) => R(c, dx + (side ? 1 : 0), dy, w, h);   // side on, the head jutting forward
  // the wolf's head: ears up, a snout
  if (side) {
    Hh(fur, -1, Hd, 4, 4); Hh(fur, 3, Hd + 2, 2, 2); Hh(light, 3, Hd + 3, 2, 1); Hh(INK, 5, Hd + 2, 1, 1);   // snout, nose
    Hh(fur, -1, Hd - 2, 1, 2); Hh(dark, 0, Hd - 1, 1, 1);                     // ear
    Hh(f.eye, 1, Hd + 1, 1, 1); Hh(claw, 4, Hd + 3, 1, 1);                    // eye, a fang
  } else {
    Hh(fur, -2, Hd, 5, 4);
    Hh(fur, -2, Hd - 2, 1, 2); Hh(fur, 2, Hd - 2, 1, 2); Hh(dark, -2, Hd - 2, 1, 1); Hh(dark, 2, Hd - 2, 1, 1);   // ears
    if (!back) {
      Hh(light, -1, Hd + 2, 3, 2); Hh(INK, 0, Hd + 2, 1, 1); Hh(claw, -1, Hd + 3, 1, 1); Hh(claw, 1, Hd + 3, 1, 1);   // muzzle, nose, fangs
      Hh(f.eye, -1, Hd + 1, 1, 1); Hh(f.eye, 1, Hd + 1, 1, 1);
    } else Hh(dark, -1, Hd + 3, 3, 1);
  }
}

// --- the ghost girl ---------------------------------------------------------------
const GIRLS = [
  { dress: '#eeeef0', hair: '#1d1f22', skin: '#e4e8ec' },
  { dress: '#e8ecf0', hair: '#1d1f22', skin: '#d8e0e8', band: true },        // yurei: white kimono, triangle headband
  { dress: '#b8303a', hair: '#1d1f22', skin: '#e8e4e4' },
  { dress: '#c8dcec', hair: '#a8b0b8', skin: '#e0eaf2' },
];
function ghostGirl({ R, g, v, side, back, t }) {
  const p = GIRLS[v], bob = -3 + Math.round(Math.sin(t * 2) * 1.5);         // she floats
  const B = -9 + bob, Hd = -13 + bob;
  R(COLORS.shadow, -2, 0, 5, 1);
  g.save(); g.globalAlpha = 0.88;
  // the dress, long, its hem ragged and fading
  R(p.dress, -2, B, 5, 8); R(shade(p.dress, 0.85), 2, B, 1, 8);
  for (const dx of [-2, 0, 2]) R(shade(p.dress, 1.06), dx, B + 8, 1, 1);
  R(shade(p.dress, 0.92), -1, B + 9, 1, 1); R(shade(p.dress, 0.92), 1, B + 9, 1, 1);
  if (v === 1 && !back) R(shade(p.dress, 0.8), -1, B, 1, 4);              // the kimono's fold
  // pale arms hanging
  if (!side) { R(p.skin, -3, B + 1, 1, 5); R(p.skin, 3, B + 1, 1, 5); } else R(p.skin, 1, B + 1, 1, 5);
  // the head under long black hair that hides the face
  R(p.skin, -1, Hd, 3, 4);
  R(p.hair, -2, Hd - 1, 5, 2);
  if (back) R(p.hair, -2, Hd, 5, 9);
  else if (side) { R(p.hair, -2, Hd, 2, 9); R(p.hair, 0, Hd, 2, 2); R(p.hair, 1, Hd + 2, 1, 1); }
  else { R(p.hair, -2, Hd, 5, 8); R(p.skin, 0, Hd + 1, 1, 3); R(INK, 0, Hd + 2, 1, 1); }   // a slit of pale face, one eye
  if (p.band && !back) { R('#f6f6f8', -1, Hd - 1, 3, 1); R('#f6f6f8', 0, Hd - 2, 1, 1); }  // the triangle headband
  g.restore();
}

// --- the reaper -------------------------------------------------------------------
const REAPERS = [
  { robe: '#26262c', eye: '#e8402f' },
  { robe: '#4a2a5a', eye: '#6ae86a' },
  { robe: '#1f2a44', eye: '#6ac8f2' },
  { robe: '#d8d2c0', eye: '#f2a040' },
];
function reaper({ R, W, v, side, back, t }) {
  const p = REAPERS[v], bob = -3 + Math.round(Math.sin(t * 1.6) * 1.5);
  const robe = p.robe, dark = shade(robe, v === 3 ? 0.75 : 0.6), light = shade(robe, v === 3 ? 1.05 : 1.5);
  const B = -10 + bob, Hd = -15 + bob;
  R(COLORS.shadow, -3, 0, 7, 1);
  // the scythe behind (from the back) or in front
  const scythe = () => {
    const sx = side ? 4 : 4;
    R('#6b4a2a', sx, Hd - 2, 1, 17);                                       // the staff
    for (const [dx, dy] of [[0, -3], [-1, -3], [-2, -3], [-3, -2], [-4, -1], [-5, 0]]) R('#c8ccd0', sx + dx, Hd + dy, 1, 1);  // the curved blade
    R('#eef2f4', sx - 1, Hd - 3, 2, 1);
  };
  if (back) scythe();
  // a robe widening to a ragged hem, sleeves
  R(robe, -2, B, 5, 4); R(robe, -3, B + 4, 7, 5); R(dark, 3, B + 4, 1, 5); W(dark, 2, B, 1, 4);
  for (const dx of [-3, -1, 1, 3]) R(robe, dx, B + 9, 1, 1);                // the tattered hem
  if (!back) { R(dark, -1, B + 1, 1, 7); }
  if (!back) { R(light, side ? 2 : 3, B + 2, 1, 1); R('#e8e2d0', side ? 3 : 3, B + 3, 1, 1); }   // a bony hand on the staff
  // the hood, a dark face with glowing eyes
  R(robe, -2, Hd - 1, 5, 6); R(robe, -1, Hd - 2, 3, 1);
  if (!back) {
    if (side) { R(INK, 1, Hd, 2, 3); R(p.eye, 2, Hd + 1, 1, 1); }
    else { R(INK, -1, Hd, 3, 3); R(p.eye, -1, Hd + 1, 1, 1); R(p.eye, 1, Hd + 1, 1, 1); }
  } else R(dark, 0, Hd - 1, 1, 5);
  if (!back) scythe();
}

// --- giant spiders ----------------------------------------------------------------
const SPIDERS = [
  { body: '#26262c', mark: '#d8303a', leg: '#26262c' },                     // black widow (a red hourglass)
  { body: '#6a4a30', mark: '#d88a3a', leg: '#5a3a24', bands: true },          // tarantula (banded legs)
  { body: '#9a8a70', mark: '#6a5a44', leg: '#8a7a60', stripes: true },        // huntsman
  { body: '#4a8a3a', mark: '#f2d040', leg: '#3a6a2e', spots: true },          // poison
];
function spider({ R, v, side, back, t, walking }) {
  const p = SPIDERS[v], step = walking ? Math.floor(t * 10) % 2 : 0, eye = '#e8402f';
  const leg = p.leg, band = p.bands ? p.mark : shade(leg, 1.25);
  // eight legs: up from the body, then down to the ground; walking, they take turns
  const legs = (dir) => [[2, 0], [3, 1], [3, 2], [2, 3]].forEach(([out, i]) => {
    const lift = (i + (dir > 0 ? 0 : 1) + step) % 2 ? 1 : 0;
    const bx = dir * (2 + i), kx = dir * (3 + out + i), fx = dir * (4 + out + i);
    R(leg, Math.min(bx, kx), -5 - lift, Math.abs(kx - bx) + 1, 1);            // up to the knee
    R(leg, kx, -4 - lift, 1, 1); R(band, kx, -5 - lift, 1, 1);
    R(leg, fx, -3 - lift, 1, 3 - (lift ? 0 : 0));                             // down to the foot
  });
  if (side) {
    legs(1); legs(-1);
    R(p.body, -6, -8, 6, 5); R(shade(p.body, 0.75), -6, -4, 6, 1); R(shade(p.body, 1.25), -5, -8, 3, 1);   // the abdomen behind
    if (p.mark && v === 0) R(p.mark, -4, -5, 2, 1);
    if (p.stripes) { R(p.mark, -5, -7, 1, 3); R(p.mark, -3, -7, 1, 3); }
    if (p.spots) { R(p.mark, -5, -7, 1, 1); R(p.mark, -2, -6, 1, 1); }
    R(p.body, 0, -6, 4, 3); R(eye, 3, -6, 1, 1); R(eye, 3, -5, 1, 1); R(shade(p.body, 0.75), 3, -4, 2, 1);   // head, eyes, fangs
    return;
  }
  legs(1); legs(-1);
  const abd = back ? -5 : -8, head = back ? -8 : -5;
  // seen from in front the head is nearer (lower); from behind, the abdomen
  const drawAbd = () => {
    R(p.body, -3, abd - 2, 7, 5); R(shade(p.body, 1.25), -2, abd - 2, 4, 1); R(shade(p.body, 0.75), -3, abd + 2, 7, 1);
    if (v === 0) { R(p.mark, 0, abd - 1, 1, 1); R(p.mark, -1, abd, 3, 1); R(p.mark, 0, abd + 1, 1, 1); }   // the hourglass
    if (p.stripes) { R(p.mark, -1, abd - 2, 1, 4); R(p.mark, 1, abd - 2, 1, 4); }
    if (p.spots) { R(p.mark, -2, abd - 1, 1, 1); R(p.mark, 2, abd, 1, 1); R(p.mark, 0, abd + 1, 1, 1); }
    if (p.bands) R(shade(p.body, 1.15), -3, abd, 7, 1);
  };
  const drawHead = () => {
    R(p.body, -2, head - 1, 5, 3);
    if (!back) { R(eye, -1, head - 1, 1, 1); R(eye, 1, head - 1, 1, 1); R(eye, 0, head, 1, 1); R(shade(p.body, 0.7), -1, head + 2, 1, 1); R(shade(p.body, 0.7), 1, head + 2, 1, 1); }
  };
  if (back) { drawHead(); drawAbd(); } else { drawAbd(); drawHead(); }
}

// --- skeletons --------------------------------------------------------------------
const BONE = '#e8e2d0', BONE_SHADE = '#b8b2a0';
function skeleton({ R, W, v, side, back, t, walking }) {
  const step = walking ? Math.floor(t * 8) % 2 : -1, B = -9, Hd = -13;
  // thin bone legs, a pelvis, a spine, ribs
  for (const [dx, lifted] of [[-1, step === 0], [1, step === 1]]) { const h = lifted ? 2 : 3; R(BONE, dx, -3, 1, h); R(BONE, dx + (dx < 0 ? -1 : 0), -3 + h - 1, 2, 1); }
  if (v === 3) { R('#4a2a6a', -2, B, 5, 8); R('#3a1f54', 2, B, 1, 8); R('#6a4a8a', -2, B + 7, 5, 1); }   // the mage's robe
  else {
    R(BONE, -1, -4, 3, 1);                                                  // pelvis
    R(BONE_SHADE, 0, B, 1, 5);                                              // spine
    for (const ry of [1, 3]) R(BONE, side ? -1 : -2, B + ry, side ? 3 : 5, 1);   // ribs
    R(BONE, -2, B, 5, 1);                                                   // collarbones
  }
  // arms (thin), the hands
  if (side) { R(BONE, 0, B + 1, 1, 4); R(BONE, 1, B + 4, 1, 1); }
  else { R(BONE, -3, B + 1, 1, 5); R(BONE, 3, B + 1, 1, 5); }
  // the skull: sockets, nose, teeth
  R(BONE, -1, Hd, 3, 4); W(BONE_SHADE, 1, Hd + 1, 1, 3);
  if (!back) {
    if (side) { R(INK, 1, Hd + 1, 1, 1); R(INK, 1, Hd + 3, 1, 1); }
    else { R(INK, -1, Hd + 1, 1, 1); R(INK, 1, Hd + 1, 1, 1); R(INK, 0, Hd + 2, 1, 1); R(INK, -1, Hd + 3, 1, 1); R(INK, 1, Hd + 3, 1, 1); }
  }
  // what each kind carries and wears
  if (v === 1) {                                                            // warrior: helmet, shield, sword
    R('#8a8e94', -1, Hd - 1, 3, 2); R('#6a6e74', -2, Hd, 5, 1);
    if (!back) { R('#7a4a2a', side ? -2 : -4, B + 1, 3, 4); R('#c8a040', side ? -1 : -3, B + 2, 1, 2); }
    R('#c8ccd0', side ? 2 : 3, B - 2, 1, 6); R('#7a4a2a', side ? 1 : 2, B + 3, 3, 1);
  } else if (v === 2) {                                                     // pirate: bandana, cutlass
    R('#c8302a', -1, Hd - 1, 3, 2); R('#c8302a', side ? -2 : 2, Hd, 1, 2);
    if (!back && !side) R(INK, -1, Hd + 1, 2, 1);                           // eyepatch
    R('#c8ccd0', side ? 2 : 3, B + 1, 1, 4); R('#e8e8ec', side ? 3 : 4, B + 1, 1, 1); R('#c8a040', side ? 2 : 3, B + 5, 1, 1);
  } else if (v === 3) {                                                     // mage: hood, staff with a glowing orb
    R('#4a2a6a', -2, Hd - 1, 5, 2); R('#4a2a6a', -2, Hd, 1, 4); R('#4a2a6a', 2, Hd, 1, 4); if (back) R('#4a2a6a', -1, Hd, 3, 4);
    R('#6b4a2a', side ? 2 : 3, Hd - 2, 1, 15);
    const glow = Math.floor(t * 4) % 2 ? '#8af08a' : '#5ad05a';
    R(glow, side ? 1 : 2, Hd - 4, 3, 2); R('#e0ffe0', side ? 2 : 3, Hd - 4, 1, 1);
  }
}

// --- flaming skulls -----------------------------------------------------------------
const FIRES = [
  ['#fff2b0', '#f2a040', '#d8402a'],
  ['#e8fbff', '#6ac8f2', '#2a5ad8'],
  ['#e8ffd0', '#7ae84a', '#2a8a2a'],
  ['#ffe0f8', '#c86ae8', '#5a2a9a'],
];
function skull({ R, W, v, side, back, t }) {
  const [core, mid, outer] = FIRES[v], bob = Math.round(Math.sin(t * 3) * 1.5), Y = -14 + bob;   // it flies at head height
  const flick = Math.floor(t * 8) % 2;
  R(COLORS.shadow, -2, 0, 5, 1);
  // the flames: a shape rising from the skull (streaming back when it flies sideways),
  // outer flame, hotter middle, a white-hot core; the tips flicker
  const lean = (k) => (side ? -k : 0);
  const rows = [[-1, 7, 5, 3], [-2, 5, 3, 1], [-3, 5, 3, 1], [-4, 3, 1, 0], [-5, 3, 1, 0], [-6, 1, 0, 0]];
  rows.forEach(([dy, ow, mw, cw], k) => {
    const wob = k >= 3 ? (flick ? 1 : -1) * (k % 2 ? 1 : 0) : 0, x0 = lean(k) + wob;
    R(outer, x0 - Math.floor(ow / 2), Y + dy, ow, 1);
    if (mw) R(mid, x0 - Math.floor(mw / 2), Y + dy, mw, 1);
    if (cw) R(core, x0 - Math.floor(cw / 2), Y + dy, cw, 1);
  });
  if (!side) { R(outer, -3, Y + 1 + flick, 1, 2); R(outer, 3, Y + 2 - flick, 1, 2); }   // licking round the sides
  else { R(outer, -4, Y + flick, 2, 1); R(mid, -3, Y + 1, 1, 1); }
  // the skull: cranium, cheeks, a narrower jaw
  R(BONE, -1, Y, 3, 1); R(BONE, -2, Y + 1, 5, 3); R(BONE, -1, Y + 4, 3, 1); W(BONE_SHADE, 2, Y + 1, 1, 3);
  if (back) { R(BONE_SHADE, -1, Y + 4, 3, 1); return; }
  if (side) { R(INK, 1, Y + 2, 1, 1); R(core, 1, Y + 2, 1, 1); R(INK, 2, Y + 3, 1, 1); R(INK, 1, Y + 4, 1, 1); R(BONE, 2, Y + 4, 1, 1); }
  else {
    R(INK, -2, Y + 2, 2, 1); R(INK, 1, Y + 2, 2, 1); R(core, -1, Y + 2, 1, 1); R(core, 1, Y + 2, 1, 1);   // sockets, burning eyes
    R(INK, 0, Y + 3, 1, 1);                                                // nose
    R(INK, 0, Y + 4, 1, 1);                                                // between the teeth
  }
}

const DRAW = { zombie, werewolf, ghostGirl, reaper, spider, skeleton, skull };
