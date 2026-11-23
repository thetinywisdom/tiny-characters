import { BUILDINGS, drawBuilding, drawStreet } from '../src/tinyBuildings.js';
import { CAT_COLORS, drawCat, drawCharacter, randomCharacter, seeded } from '../src/tinyCharacters.js';

// The town: every tiny building along one long street. The view follows you
// (the gold line); arrow keys / WASD or tap where to go; tap someone to make
// them talk. The keys move whoever is in the canvas you tapped last.
const town = document.querySelector('#town'), tg = town.getContext('2d');
const VW = town.width, VH = town.height;
const BASE = 104;                                    // the buildings' ground line
const WALK = { top: BASE + 3, bottom: VH - 8 };      // sidewalk, road, far sidewalk
const here = document.querySelector('#here');

// Japanese town first, then the old town (European houses).
const ORDER = [
  ['house'], ['kissaten'], ['shop', 'konbini'], ['mixedUse', 'bakery'], ['koban'], ['apartment'], ['shop', 'ramen'],
  ['florist'], ['bank'], ['office'], ['takoyaki'], ['sushi'], ['laundromat'], ['clinic'], ['postOffice'], ['karaoke'],
  ['udonSoba'], ['pharmacy'], ['woodApartment'], ['fishmonger'], ['shop', 'cafe'], ['familyRestaurant'], ['fireStation'],
  ['mixedUse', 'bookshop'], ['parkingGarage'], ['gasStation'], ['shop', 'izakaya'], ['school'], ['shrine'],
  ['tudorCottage'], ['dutchCanalHouse'], ['frenchCountryHouse'], ['scandinavianHouse'], ['mediterraneanVilla'], ['stoneChapel'],
];
let edge = 6;
const buildings = ORDER.map(([type, shopType], i) => {
  const w = BUILDINGS[type].w, b = { type, shopType, seed: i + 1, x: edge + w / 2, y: BASE, w };
  edge += w + 4;
  return b;
});
const WORLD = edge + 2;

let people, you, cam = 0, seed = 11;
const keys = new Set();
function newTown() {
  const rng = seeded(seed++);
  people = Array.from({ length: 28 }, () => ({ ...randomCharacter(rng), x: 8 + rng() * (WORLD - 16), y: WALK.top + rng() * (WALK.bottom - WALK.top), to: null, wait: rng() * 3, talk: 0 }));
  for (let i = 0; i < 4; i++) people.push({ cat: true, color: CAT_COLORS[Math.floor(rng() * CAT_COLORS.length)], x: 30 + rng() * (WORLD - 60), y: WALK.top + 2, to: null, wait: rng() * 4, talk: 0 });
  you = { ...randomCharacter(rng), body: '#f2f2ee', x: 60, y: WALK.top + 6, you: true, talk: 0 };
  people.push(you);
}
newTown();

const active = () => (document.body.dataset.active ?? 'town') === 'town';
addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow') && active()) e.preventDefault(); keys.add(e.key.toLowerCase()); });
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
town.addEventListener('pointerdown', (e) => {
  document.body.dataset.active = 'town';
  const r = town.getBoundingClientRect();
  const x = cam + (e.clientX - r.left) / r.width * VW, y = (e.clientY - r.top) / r.height * VH;
  const hit = people.filter((p) => p !== you && !p.cat && Math.abs(p.x - x) < 5 && y > p.y - 17 && y < p.y + 3).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (hit) hit.talk = 2; else you.to = { x: Math.max(4, Math.min(WORLD - 4, x)), y: Math.max(WALK.top, Math.min(WALK.bottom, y)) };
});
document.querySelector('#newTown').onclick = newTown;

let last = performance.now(), t = 0, shown = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  // you: keys first (when this canvas is active), else walking to a tapped spot
  let dx = 0, dy = 0;
  if (active()) {
    dx = (keys.has('arrowright') || keys.has('d')) - (keys.has('arrowleft') || keys.has('a'));
    dy = (keys.has('arrowdown') || keys.has('s')) - (keys.has('arrowup') || keys.has('w'));
  }
  if (dx || dy) you.to = null;
  else if (you.to) { const ex = you.to.x - you.x, ey = you.to.y - you.y, d = Math.hypot(ex, ey); if (d < 1) you.to = null; else { dx = ex / d; dy = ey / d; } }
  you.walking = !!(dx || dy);
  if (dx) you.facing = dx < 0 ? 'left' : 'right';
  you.x = Math.max(4, Math.min(WORLD - 4, you.x + dx * 30 * dt));
  you.y = Math.max(WALK.top, Math.min(WALK.bottom, you.y + dy * 18 * dt));
  // everyone else strolls between spots not far away
  for (const p of people) {
    p.talk = Math.max(0, p.talk - dt); p.talking = p.talk > 0;
    if (p === you) continue;
    if (!p.to && (p.wait -= dt) < 0) p.to = { x: Math.max(6, Math.min(WORLD - 6, p.x + (Math.random() - 0.5) * 120)), y: WALK.top + Math.random() * (WALK.bottom - WALK.top) };
    if (p.to && !p.talking) {
      const ex = p.to.x - p.x, ey = p.to.y - p.y, d = Math.hypot(ex, ey), v = p.cat ? 1.3 : 1;
      if (d < 1) { p.to = null; p.wait = 1 + Math.random() * 4; p.walking = false; }
      else { p.x += ex / d * 14 * v * dt; p.y += ey / d * 10 * v * dt; p.walking = true; p.facing = ex < 0 ? 'left' : 'right'; }
    } else p.walking = false;
  }
  // the view follows you
  cam = Math.round(Math.max(0, Math.min(WORLD - VW, you.x - VW / 2)));
  tg.imageSmoothingEnabled = false;
  drawStreet(tg, VW, VH, { baseY: BASE, x0: cam });
  tg.save(); tg.translate(-cam, 0);
  for (const b of buildings) if (b.x + b.w / 2 > cam - 10 && b.x - b.w / 2 < cam + VW + 10) drawBuilding(tg, b);
  for (const p of [...people].sort((a, b) => a.y - b.y)) if (p.x > cam - 10 && p.x < cam + VW + 10) (p.cat ? drawCat : drawCharacter)(tg, p, t);
  tg.restore();
  // the building you are in front of
  const at = buildings.find((b) => Math.abs(you.x - b.x) <= b.w / 2);
  const name = at ? BUILDINGS[at.type].label + (at.shopType ? ` (${at.shopType})` : '') : '';
  if (name !== shown) { shown = name; here.textContent = name ? `In front of: ${name}` : 'Between buildings'; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Buildings: each one on its own, with its name.
const sheet = document.querySelector('#buildings');
for (const [type, { label, w, h }] of Object.entries(BUILDINGS)) {
  const c = document.createElement('canvas');
  c.width = w + 4; c.height = h + 4; c.className = 'bld';
  c.style.setProperty('--w', c.width);
  const g = c.getContext('2d');
  g.fillStyle = '#d8d2c4'; g.fillRect(0, h + 2, c.width, 2);
  drawBuilding(g, { type, x: 2 + w / 2, y: h + 2, seed: 2 });
  const f = document.createElement('figure');
  const cap = document.createElement('figcaption'); cap.textContent = label;
  f.append(c, cap); sheet.append(f);
}
