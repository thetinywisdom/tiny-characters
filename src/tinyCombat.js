// Tiny Combat: weapons, attacks, monster skills and reactions for the tiny
// people, animals and monsters, in the same small pixel style.
//
//   drawWeapon(g, { weapon, x, y, angle })          a weapon on its own (angle in degrees, 0 = to the right, -90 = up)
//   drawArmed(g, person, t)                         a person holding person.weapon (walking or standing)
//   drawAction(g, actor, action, time, t)           an attack, a skill or a reaction, `time` seconds after it began;
//                                                   returns false once it has finished (a 'dead' actor stays down)
//   WEAPONS, ACTIONS, SKILLS, REACTIONS             names, durations, which weapon or monster each belongs to
//
// An actor is anything the other modules draw: a person, { cat: true },
// { dog: true }, { monster: 'zombie', variant }. Actions face actor.facing
// ('left' / 'right' / 'down' / 'up'). Plain ES module, no dependencies.

import { canvasOf, drawCharacter } from './tinyCharacters.js';
import { drawCat, drawDog } from './tinyAnimals.js';
import { drawMonster } from './tinyMonsters.js';

const INK = '#2f3236', STEEL = '#d8dce0', STEEL2 = '#9aa0a8', WOOD = '#8a5a2e', GOLD = '#f2b64a', WHITE = '#ffffff';

/** The weapons. */
export const WEAPONS = {
  sword: { label: 'Sword' }, axe: { label: 'Axe' }, spear: { label: 'Spear' }, bow: { label: 'Bow' }, shield: { label: 'Shield' },
};
/**
 * Attacks with a weapon: name -> { label, weapon, duration (s), reach, range }.
 * reach: 'front' (what is ahead of the attacker, within range px), 'around'
 * (everything within range px: the axe's 360 swing) or 'self' (a block).
 */
export const ACTIONS = {
  slash: { label: 'Sword slash', weapon: 'sword', duration: 0.45, reach: 'front', range: 10 },
  stab: { label: 'Sword stab', weapon: 'sword', duration: 0.4, reach: 'front', range: 13 },
  axeSwing: { label: 'Axe swing (360)', weapon: 'axe', duration: 0.42, reach: 'around', range: 14 },   // a full spin: hits all round
  chop: { label: 'Axe chop', weapon: 'axe', duration: 0.6, reach: 'front', range: 10 },
  spearSwing: { label: 'Spear swing', weapon: 'spear', duration: 0.55, reach: 'front', range: 15 },
  spearStab: { label: 'Spear stab', weapon: 'spear', duration: 0.45, reach: 'front', range: 20 },
  shoot: { label: 'Bow shot', weapon: 'bow', duration: 1.0, reach: 'front', range: 74 },
  defend: { label: 'Shield defend', weapon: 'shield', duration: 0.6, reach: 'self', range: 0 },
};
/** Each monster's own skills: name -> { label, monster, duration }. */
export const SKILLS = {
  bite: { label: 'Zombie bite', monster: 'zombie', duration: 0.7 },
  claw: { label: 'Werewolf claw', monster: 'werewolf', duration: 0.5 },
  curse: { label: 'Ghost curse', monster: 'ghostGirl', duration: 1.1 },
  scythe: { label: 'Reaper scythe', monster: 'reaper', duration: 0.8 },
  webShot: { label: 'Spider web shot', monster: 'spider', duration: 0.9 },
  webTrap: { label: 'Spider web trap', monster: 'spider', duration: 1.4 },
  boneThrow: { label: 'Skeleton bone throw', monster: 'skeleton', duration: 0.9 },
  fireball: { label: 'Skull fireball', monster: 'skull', duration: 0.9 },
};
/** What happens to anyone: name -> { label, duration }. */
export const REACTIONS = {
  hit: { label: 'Hit', duration: 0.35 },
  shoved: { label: 'Shoved back', duration: 0.5 },
  dead: { label: 'Dead', duration: 1.2 },
};

// --- small helpers -------------------------------------------------------------------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => 1 - (1 - u) * (1 - u);
/** u inside [a, b] mapped to 0..1. */
const span = (u, a, b) => clamp((u - a) / (b - a));
const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
/** The way an actor faces as a unit step: sx for left/right, and whether it is seen from the front or back. */
function facingOf(a) {
  const f = a.facing ?? 'down';
  return { f, sx: f === 'left' ? -1 : 1, side: f === 'left' || f === 'right', back: f === 'up', dir: f === 'left' ? [-1, 0] : f === 'right' ? [1, 0] : f === 'up' ? [0, -1] : [0, 1] };
}
/** Body rows of a person (as tinyCharacters draws them). */
function bodyOf(p) { const legH = p.kid ? 2 : p.size === 'tall' ? 4 : 3, bodyH = p.kid ? 4 : p.size === 'tall' ? 7 : p.size === 'short' ? 5 : 6; return { B: -legH - bodyH, bodyH }; }

/** Draw any actor: a person, a cat, a dog or a monster. */
export function drawActor(g, a, t = 0) {
  if (a.monster) drawMonster(g, { ...a, type: a.monster }, t);
  else if (a.dog) drawDog(g, a, t);
  else if (a.cat) drawCat(g, a, t);
  else drawCharacter(g, a, t);
}

// --- weapons ---------------------------------------------------------------------------
/**
 * Pixels along a line from (x, y) at `angle` degrees: segments [from, to,
 * colour] in pixels along it (negative: behind the hand).
 */
function along(g, x, y, angle, segs) {
  const r = angle * Math.PI / 180, cx = Math.cos(r), cy = Math.sin(r);
  for (const [a, b, c] of segs) for (let i = a; i <= b; i++) px(g, c, x + cx * i, y + cy * i);
  return (i) => [x + cx * i, y + cy * i];                                  // where a point along it is
}
/** Pixels across the line at distance i (a guard, an axe head). */
function across(g, x, y, angle, i, from, to, c) {
  const r = angle * Math.PI / 180, cx = Math.cos(r), cy = Math.sin(r);
  for (let k = from; k <= to; k++) px(g, c, x + cx * i - cy * k, y + cy * i + cx * k);
}
/**
 * Draw a weapon held at (x, y), pointing at `angle` degrees. side: 1 or -1
 * (an axe's blade and a bow's curve face that way). pull: how far a bow's
 * string is drawn back (0-4).
 */
export function drawWeapon(g, { weapon, x, y, angle = -45, side = 1, pull = 0, arrow = false }) {
  switch (weapon) {
    case 'sword':
      along(g, x, y, angle, [[-2, -1, '#6b4a2a'], [2, 8, STEEL], [8, 8, WHITE]]);   // grip, blade, a glint at the tip
      across(g, x, y, angle, 0, -1, 1, GOLD); px(g, GOLD, x - Math.cos(angle * Math.PI / 180) * 2, y - Math.sin(angle * Math.PI / 180) * 2);   // guard, pommel
      break;
    case 'axe':
      along(g, x, y, angle, [[-2, 7, WOOD]]);
      for (let i = 5; i <= 7; i++) across(g, x, y, angle, i, side > 0 ? -3 : 1, side > 0 ? -1 : 3, i === 5 ? STEEL2 : STEEL);   // the head
      across(g, x, y, angle, 6, side > 0 ? -3 : 3, side > 0 ? -3 : 3, WHITE);
      break;
    case 'spear':
      along(g, x, y, angle, [[-6, 9, WOOD], [10, 12, STEEL], [13, 13, WHITE]]);
      across(g, x, y, angle, 10, -1, 1, STEEL2);
      break;
    case 'bow': {
      // a curved bow standing up in the hand, its string pulled back by `pull`
      const s = side, curve = [[0, -6], [1, -5], [2, -4], [2, -3], [3, -2], [3, -1], [3, 0], [3, 1], [3, 2], [2, 3], [2, 4], [1, 5], [0, 6]];
      for (const [cx, cy] of curve) px(g, WOOD, x + s * cx, y + cy);
      px(g, '#5a3a1e', x + s * 3, y); px(g, '#e8e2d0', x, y - 6, 1, 1); px(g, '#e8e2d0', x, y + 6, 1, 1);
      for (let cy = -5; cy <= 5; cy++) px(g, '#e8e2d0', x - s * Math.round(pull * (1 - Math.abs(cy) / 6)), y + cy);   // the string
      if (arrow) { for (let i = -pull; i <= 6; i++) px(g, i > 4 ? STEEL : '#c8a060', x + s * i, y); px(g, '#e8402f', x - s * (pull + 1), y - 1); px(g, '#e8402f', x - s * (pull + 1), y + 1); }
      break;
    }
    case 'shield': {
      // a round wooden shield with an iron rim and boss, seen face on
      const rows = [[-2, 5], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-2, 5]];
      rows.forEach(([dx, w], j) => px(g, '#7a4a2a', x + dx, y - 3 + j, w, 1));
      px(g, STEEL2, x - 2, y - 3, 5, 1); px(g, STEEL2, x - 2, y + 2, 5, 1); px(g, STEEL2, x - 3, y - 2, 1, 4); px(g, STEEL2, x + 3, y - 2, 1, 4);
      px(g, '#a8643a', x - 2, y - 2, 2, 1); px(g, STEEL, x, y - 1, 1, 2); px(g, WHITE, x, y - 1);
      break;
    }
  }
}

// --- a person holding and using a weapon ------------------------------------------------
/**
 * The pose for an attack at progress u (0-1), seen from the right:
 * hand (relative to the shoulder), weapon angle, lean, crouch, and what
 * the tip leaves behind (a trail) or what flies (an arrow).
 */
const POSES = {
  hold: () => ({ hand: [1, 3], angle: -60 }),
  slash: (u) => {
    if (u < 0.3) { const k = ease(span(u, 0, 0.3)); return { hand: [lerp(1, -1, k), lerp(3, -2, k)], angle: lerp(-60, -140, k) }; }
    if (u < 0.6) { const k = ease(span(u, 0.3, 0.6)); return { hand: [lerp(-1, 3, k), lerp(-2, 3, k)], angle: lerp(-140, 50, k), lean: 1, trail: true }; }
    const k = span(u, 0.6, 1); return { hand: [lerp(3, 1, k), 3], angle: lerp(50, -60, k) };
  },
  stab: (u) => { const k = u < 0.3 ? -span(u, 0, 0.3) : u < 0.55 ? ease(span(u, 0.3, 0.55)) : 1 - span(u, 0.55, 1); return { hand: [1 + k * 5, 2], angle: 0, lean: k > 0.5 ? 1 : 0, trail: u > 0.3 && u < 0.55 }; },
  axeSwing: (u) => {
    // a wind-up, then one full turn: the axe goes all the way round the body
    // (angles here are on the screen, for facing right) and the fighter turns
    // through every view with it; a ring of motion all round
    if (u < 0.1) { const k = ease(span(u, 0, 0.1)); return { hand: [lerp(1, -1, k), lerp(3, 2, k)], angle: lerp(-60, -170, k) }; }
    if (u < 0.88) {
      const k = span(u, 0.1, 0.88), a = 0 + k * 360, r = a * Math.PI / 180;
      const facing = ['right', 'down', 'left', 'up'][Math.floor(((a + 45) % 360) / 90)];
      return { spin: true, facing, hand: [Math.round(Math.cos(r) * 4), Math.round(Math.sin(r) * 2) + 2], angle: a, whirl: k, trail: true };
    }
    const k = span(u, 0.88, 1); return { hand: [1, 3], angle: lerp(0, -60, k), dust: k < 0.8 ? k : 0 };
  },
  chop: (u) => {
    if (u < 0.45) { const k = ease(span(u, 0, 0.45)); return { hand: [lerp(1, 0, k), lerp(3, -4, k)], angle: lerp(-60, -110, k) }; }
    if (u < 0.6) { const k = span(u, 0.45, 0.6); return { hand: [lerp(0, 3, k), lerp(-4, 3, k)], angle: lerp(-110, 75, k), trail: true, lean: 1 }; }
    return { hand: [3, 3], angle: 75, crouch: u < 0.8 ? 1 : 0, dust: u < 0.85 ? span(u, 0.6, 0.85) : 0 };
  },
  spearSwing: (u) => {
    if (u < 0.3) { const k = ease(span(u, 0, 0.3)); return { hand: [1, 2], angle: lerp(-20, -80, k) }; }
    if (u < 0.65) { const k = ease(span(u, 0.3, 0.65)); return { hand: [lerp(1, 2, k), 2], angle: lerp(-80, 35, k), trail: true, lean: 1 }; }
    const k = span(u, 0.65, 1); return { hand: [lerp(2, 1, k), 2], angle: lerp(35, -20, k) };
  },
  spearStab: (u) => { const k = u < 0.3 ? -span(u, 0, 0.3) * 1.5 : u < 0.5 ? ease(span(u, 0.3, 0.5)) : 1 - span(u, 0.5, 1); return { hand: [1 + k * 7, 2], angle: -4, lean: k > 0.5 ? 1 : 0, trail: u > 0.3 && u < 0.5 }; },
  shoot: (u) => {
    const pull = u < 0.45 ? Math.round(span(u, 0.1, 0.45) * 4) : 0;
    return { hand: [3, 1], bow: true, pull, arrow: u < 0.45, fly: u >= 0.45 ? span(u, 0.45, 1) : -1 };
  },
  defend: (u) => ({ hand: [2, 1], shield: true, crouch: 1, flash: u > 0.25 && u < 0.45 }),
};

/** Draw a person holding person.weapon (standing or walking). */
export function drawArmed(g, p, t = 0) { drawPersonPose(g, p, POSES.hold(0), p.weapon ?? 'sword', t, 0); }

function drawPersonPose(g, p0, pose, weapon, t, u, poseFn) {
  const p = pose.facing ? { ...p0, facing: pose.spin ? pose.facing : p0.facing } : p0;
  const { sx: sx0 } = facingOf(p0);
  const { sx, side, back } = facingOf(p);
  const lean = (pose.lean ?? 0) * (side ? sx : 0), crouch = pose.crouch ?? 0;
  const body = { ...p, x: p.x + lean, y: p.y + crouch, walking: p.walking && !poseFn };
  const { B } = bodyOf(p);
  // seen from the front the weapon is held to the side; from the back, it is behind
  const hx = (h) => (side ? sx * h : (back ? -1 : 1) * Math.max(2, h));
  const shoulder = [p.x + lean + (side ? sx : 2), p.y + crouch + B + 1];
  // a spin is drawn round the middle of the body, its angle on the screen (mirrored only for an attacker facing left)
  const mid = [p.x, p.y + crouch + B + 2];
  const hand = pose.spin ? [mid[0] + sx0 * pose.hand[0], mid[1] + pose.hand[1]] : [shoulder[0] + hx(pose.hand[0]), shoulder[1] + pose.hand[1]];
  const angle = pose.spin ? (sx0 > 0 ? pose.angle : 180 - pose.angle) : side ? (sx > 0 ? pose.angle : 180 - pose.angle) : (back ? 180 - pose.angle : pose.angle);
  const wside = side ? sx : back ? -1 : 1;
  const sleeve = p.body ?? '#f2f2ee', skin = p.skin ?? '#e2b08e';
  const drawWeaponNow = () => {
    // the arm from the shoulder to the hand, then the weapon in the hand
    const n = Math.max(Math.abs(hand[0] - shoulder[0]), Math.abs(hand[1] - shoulder[1]));
    for (let i = 0; i <= n; i++) px(g, i === n ? skin : sleeve, lerp(shoulder[0], hand[0], i / Math.max(1, n)), lerp(shoulder[1], hand[1], i / Math.max(1, n)));
    if (pose.shield) {
      drawWeapon(g, { weapon: 'shield', x: hand[0] + (side ? sx : 0), y: hand[1] - 1 });
      if (pose.flash) { px(g, WHITE, hand[0] + (side ? sx * 4 : 0), hand[1] - 4); px(g, WHITE, hand[0] + (side ? sx * 5 : 2), hand[1] - 2, 1, 2); px(g, '#fff2b0', hand[0] + (side ? sx * 4 : 1), hand[1] + 1); }
    } else if (pose.bow) drawWeapon(g, { weapon: 'bow', x: hand[0], y: hand[1], side: wside, pull: pose.pull, arrow: pose.arrow });
    else {
      // a spin leaves a ring of motion round the body, as far round as the axe has gone
      if (pose.spin) {
        const end = angle, start = end - (sx0 > 0 ? 1 : -1) * Math.min(300, pose.whirl * 360 + 40);
        for (let k = 0; k <= 24; k++) {
          const a = lerp(start, end, k / 24) * Math.PI / 180;
          px(g, k > 18 ? '#f4f8ff' : k > 10 ? '#d8e4f0' : '#b8c8d8', mid[0] + Math.cos(a) * 11, mid[1] + Math.sin(a) * 6);
        }
      }
      // a trail where the tip has just been
      if (pose.trail && poseFn && !pose.spin) for (const back of [0.05, 0.1, 0.15]) {
        const q = poseFn(Math.max(0, u - back)), qa = side ? (sx > 0 ? q.angle : 180 - q.angle) : q.angle;
        const qh = [shoulder[0] + hx(q.hand[0]), shoulder[1] + q.hand[1]], len = weapon === 'spear' ? 12 : weapon === 'axe' ? 7 : 8;
        const r = qa * Math.PI / 180;
        px(g, back < 0.1 ? '#f4f8ff' : '#c8d8e8', qh[0] + Math.cos(r) * len, qh[1] + Math.sin(r) * len, 2, 1);
        px(g, '#e0ecf8', qh[0] + Math.cos(r) * (len - 2), qh[1] + Math.sin(r) * (len - 2));
      }
      drawWeapon(g, { weapon, x: hand[0], y: hand[1], angle, side: wside });
    }
    if (pose.dust) for (const [dx, k] of [[4, 1], [7, 0.6], [9, 0.3]]) { const d = pose.dust; px(g, '#c8bca8', p.x + sx * (dx + d * 3), p.y - 1 - d * 2 * k, 2, 1); }
  };
  const behind = pose.spin ? Math.sin(angle * Math.PI / 180) < -0.2 : back;   // in a spin, the axe goes behind the body on the far side
  if (behind) { drawWeaponNow(); drawCharacter(g, body, t); }
  else { drawCharacter(g, body, t); drawWeaponNow(); }
  // an arrow in flight
  if (pose.fly >= 0) {
    const { dir } = facingOf(p), d = 4 + pose.fly * 70, ax = hand[0] + dir[0] * d, ay = hand[1] + dir[1] * d;
    if (dir[0]) { for (let i = -5; i <= 0; i++) px(g, i > -2 ? STEEL : '#c8a060', ax + dir[0] * i, ay); px(g, '#e8402f', ax - dir[0] * 6, ay - 1); px(g, '#e8402f', ax - dir[0] * 6, ay + 1); }
    else { for (let i = -5; i <= 0; i++) px(g, i > -2 ? STEEL : '#c8a060', ax, ay + dir[1] * i); px(g, '#e8402f', ax - 1, ay - dir[1] * 6); px(g, '#e8402f', ax + 1, ay - dir[1] * 6); }
  }
}

// --- monster skills ------------------------------------------------------------------------
function drawSkill(g, a, name, u, t) {
  const { sx, dir, side } = facingOf(a);
  const x = a.x, y = a.y;
  const fwd = (d) => [x + dir[0] * d, y + dir[1] * d];
  switch (name) {
    case 'bite': {                                                          // a lunge, then the bite
      const k = u < 0.4 ? ease(span(u, 0, 0.4)) : 1 - span(u, 0.55, 1);
      drawActor(g, { ...a, x: x + dir[0] * k * 4, y: y + dir[1] * k * 3 }, t);
      if (u > 0.35 && u < 0.7) { const [bx, by] = fwd(9); for (const [dx, dy] of [[0, -11], [1, -12], [2, -11], [0, -9], [1, -8], [2, -9]]) px(g, '#d8303a', bx + dx * sx, by + dy); }
      break;
    }
    case 'claw': {                                                          // three claw streaks in an arc
      drawActor(g, { ...a, x: x + (u > 0.2 && u < 0.6 ? dir[0] * 2 : 0) }, t);
      if (u > 0.2 && u < 0.85) {
        const k = span(u, 0.2, 0.6);
        for (let s = 0; s < 3; s++) for (let i = 0; i < Math.round(k * 7); i++) {
          const [cx, cy] = fwd(6 + i); px(g, i === Math.round(k * 7) - 1 ? WHITE : '#e8a0a0', cx + (side ? 0 : s * 2 - 2), cy - 16 + i + s * 2 + (side ? 0 : 0));
        }
      }
      break;
    }
    case 'curse': {                                                         // pale rings rolling forward
      drawActor(g, { ...a }, t);
      for (let r = 0; r < 3; r++) {
        const k = u * 1.3 - r * 0.25; if (k < 0 || k > 1) continue;
        const [cx, cy] = fwd(6 + k * 30), rad = 2 + Math.round(k * 4), c = r % 2 ? '#c8a0e8' : '#e8d8ff';
        for (let i = -rad; i <= rad; i++) { px(g, c, cx + (side ? 0 : i), cy - 9 + (side ? i : 0)); }
        px(g, c, cx + (side ? -sx : -rad - 1), cy - 9 + (side ? -rad - 1 : 0)); px(g, c, cx + (side ? -sx : rad + 1), cy - 9 + (side ? rad + 1 : 0));
      }
      break;
    }
    case 'scythe': {                                                        // a wide silver crescent sweeping in front
      drawActor(g, a, t);
      if (u > 0.15 && u < 0.85) {
        const k = span(u, 0.15, 0.65), from = -120, to = lerp(-120, 60, k);
        for (let ang = from; ang <= to; ang += 12) {
          const r = ang * Math.PI / 180, cx = x + sx * (2 + Math.cos(r) * 11), cy = y - 10 + Math.sin(r) * 9;
          px(g, ang > to - 25 ? WHITE : '#b8c0c8', cx, cy, 2, 1);
        }
      }
      break;
    }
    case 'webShot': {                                                       // a ball of web flies forward
      drawActor(g, a, t);
      if (u > 0.2) { const [bx, by] = fwd(6 + span(u, 0.2, 1) * 50); webBall(g, bx, by - 4); }
      break;
    }
    case 'webTrap': {                                                       // a web net spreads where it lands
      drawActor(g, a, t);
      const [tx, ty] = fwd(34);
      if (u < 0.35) { const [bx, by] = fwd(6 + span(u, 0, 0.35) * 28); webBall(g, bx, by - 4 - Math.sin(span(u, 0, 0.35) * Math.PI) * 6); }
      else webNet(g, tx, ty - 3, Math.round(2 + ease(span(u, 0.35, 0.7)) * 6));
      break;
    }
    case 'boneThrow': {                                                     // a spinning bone
      drawActor(g, a, t);
      if (u > 0.25) {
        const [bx, by] = fwd(6 + span(u, 0.25, 1) * 55), spin = Math.floor(u * 16) % 4, c = '#e8e2d0';
        const shapes = [[[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [2, 1]], [[-1, -1], [0, 0], [1, 1], [-2, -1], [2, 1]], [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [1, -2], [-1, 2]], [[1, -1], [0, 0], [-1, 1], [2, -1], [-2, 1]]];
        for (const [dx, dy] of shapes[spin]) px(g, c, bx + dx, by - 9 + dy);
      }
      break;
    }
    case 'fireball': {                                                      // a fireball with a flickering tail
      drawActor(g, a, t);
      if (u > 0.15) {
        const d = 4 + span(u, 0.15, 1) * 60, [bx, by] = fwd(d), fy = by - 14, fl = Math.floor(t * 12) % 2;
        for (let i = 1; i <= 4; i++) px(g, i < 2 ? '#f2a040' : '#d8402a', bx - dir[0] * i * 2 + (dir[0] ? 0 : (fl ? 1 : -1)), fy - dir[1] * i * 2 + (dir[0] ? (i % 2 ? fl : -fl) : 0), 2, 1);
        px(g, '#d8402a', bx - 1, fy - 1, 3, 3); px(g, '#f2a040', bx - 1, fy - 1, 2, 2); px(g, '#fff2b0', bx, fy, 1, 1);
      }
      break;
    }
  }
}
function webBall(g, x, y) { const c = '#f2f2f6'; px(g, c, x - 1, y - 1, 3, 3); px(g, '#c8c8d0', x, y); px(g, c, x - 2, y); px(g, c, x + 2, y); px(g, c, x, y - 2); px(g, c, x, y + 2); }
function webNet(g, x, y, r) {
  const c = '#eeeef4', c2 = '#c8c8d4';
  for (let i = -r; i <= r; i++) { px(g, c, x + i, y); px(g, c, x, y + Math.round(i / 2)); px(g, c2, x + i, y + Math.round(i / 2)); px(g, c2, x + i, y - Math.round(i / 2)); }
  for (const k of [0.5, 1]) { const rr = Math.round(r * k); for (let a = 0; a < 16; a++) { const ang = a / 16 * Math.PI * 2; px(g, c2, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr / 2); } }
}

// --- reactions --------------------------------------------------------------------------------
/** The actor drawn into a small canvas of its own (to flash it white, turn it over, fade it); one canvas, kept and cleared. */
let spriteCanvas = null;
function sprite(a, t) {
  const c = spriteCanvas ??= canvasOf(48, 48), g = c.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, 48, 48);
  drawActor(g, { ...a, x: 24, y: 40, walking: false }, t);
  return { c, g };
}
function drawReaction(g, a, name, u, t) {
  const { sx, dir } = facingOf(a);
  const back = [-dir[0], -dir[1]];                                          // pushed away from where it faces
  const floaty = a.monster === 'ghostGirl' || a.monster === 'reaper' || a.monster === 'skull';
  if (name === 'hit') {
    const off = u < 0.5 ? 1 : 0, { c, g: sg } = sprite(a, t);
    if (u < 0.12 || (u > 0.24 && u < 0.34)) { sg.globalCompositeOperation = 'source-atop'; sg.fillStyle = WHITE; sg.fillRect(0, 0, 48, 48); }   // two white flashes
    g.drawImage(c, Math.round(a.x + back[0] * off) - 24, Math.round(a.y + back[1] * off) - 40);
    if (u < 0.5) for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [0, 2], [-1, -1], [1, 1]]) px(g, dy === 0 || dx === 0 ? '#f2d040' : '#e8402f', a.x + dir[0] * 2 + dx, a.y - 9 + dy);   // a spark
    return;
  }
  if (name === 'shoved') {
    const d = ease(u) * 8;
    drawActor(g, { ...a, x: a.x + back[0] * d, y: a.y + back[1] * d * 0.6, walking: false }, t);
    if (!floaty && u < 0.8) for (let i = 0; i < 3; i++) px(g, '#c8bca8', a.x + back[0] * (d - i * 3) - dir[0] * 2 + (dir[0] ? 0 : i - 1), a.y - 1 - (i % 2) + back[1] * d * 0.6, 2, 1);   // dust where the feet slid
    return;
  }
  // dead
  const knock = ease(span(u, 0, 0.25)) * 3, x = a.x + back[0] * knock, y = a.y + back[1] * knock;
  const { c, g: sg } = sprite(a, t);
  if (u < 0.12) { sg.globalCompositeOperation = 'source-atop'; sg.fillStyle = WHITE; sg.fillRect(0, 0, 48, 48); }
  if (a.monster === 'ghostGirl' || a.monster === 'reaper') {                // a ghost fades away, rising
    g.save(); g.globalAlpha = 1 - span(u, 0.2, 1); g.drawImage(c, Math.round(x) - 24, Math.round(y - span(u, 0.2, 1) * 8) - 40); g.restore();
    for (let i = 0; i < 3; i++) if (u > 0.3) px(g, '#e8e8f4', x - 3 + i * 3, y - 12 - ((u * 20 + i * 4) % 10));
    return;
  }
  if (a.monster === 'skull') {                                              // the skull bursts into sparks
    if (u < 0.3) g.drawImage(c, Math.round(x) - 24, Math.round(y) - 40);
    const k = span(u, 0.25, 1);
    if (k > 0 && k < 1) for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2; px(g, i % 2 ? '#f2a040' : '#e8e2d0', x + Math.cos(ang) * k * 9, y - 14 + Math.sin(ang) * k * 7); }
    return;
  }
  if (a.monster === 'skeleton' && u > 0.3) {                                // the skeleton falls apart into a pile of bones
    const B = '#e8e2d0', S = '#b8b2a0';
    px(g, B, x - 4, y - 1, 9, 1); px(g, S, x - 3, y - 2, 3, 1); px(g, B, x + 1, y - 2, 2, 1); px(g, B, x - 1, y - 4, 3, 2); px(g, INK, x - 1, y - 3); px(g, INK, x + 1, y - 3);   // bones, the skull on top
    px(g, B, x + 4, y - 2, 1, 1); px(g, B, x - 5, y - 2, 1, 1);
    return;
  }
  if (a.monster === 'spider' && u > 0.25) {                                 // the spider flips onto its back, legs curled up
    g.save(); g.translate(Math.round(x), Math.round(y) - 8); g.scale(1, -1); g.drawImage(c, -24, -40); g.restore();   // flipped, still on the ground
    return;
  }
  // everyone else falls over: the sprite turned a quarter, head away from where it faced
  if (u < 0.25) { g.drawImage(c, Math.round(x) - 24, Math.round(y) - 40); return; }
  const fall = u < 0.4 ? 0.5 : 1;                                           // half way, then flat
  g.save(); g.translate(Math.round(x), Math.round(y) - 2); g.rotate(-sx * fall * Math.PI / 2); g.drawImage(c, -24, -40); g.restore();   // lying on the ground
  if (u > 0.5 && !a.monster && !a.cat && !a.dog) for (let i = 0; i < 3; i++) {   // stars circling over the head
    const ang = t * 4 + i * 2.1; px(g, '#f2d040', x - sx * 12 + Math.cos(ang) * 3, y - 4 + Math.sin(ang) * 1.5);
  }
}

// --- one call for all of it ---------------------------------------------------------------
/**
 * Draw `actor` doing `action` (an attack, a skill or a reaction), `time`
 * seconds after it began; `t` is the clock for walking and flickering.
 * Attacks use actor.weapon or the action's own. Returns false once the
 * action has finished (draw the actor as usual then; 'dead' stays down).
 */
export function drawAction(g, actor, action, time, t = 0) {
  const def = ACTIONS[action] ?? SKILLS[action] ?? REACTIONS[action];
  if (!def) { drawActor(g, actor, t); return false; }
  const u = clamp(time / def.duration);
  if (ACTIONS[action]) drawPersonPose(g, actor, POSES[action](u), actor.weapon ?? def.weapon, t, u, POSES[action]);
  else if (SKILLS[action]) drawSkill(g, actor, action, u, t);
  else drawReaction(g, actor, action, u, t);
  return time < def.duration;
}
