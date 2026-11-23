import { BUILDINGS, SIGN_FONT, buildingSize, buildingSolids, drawBuilding } from '../src/tinyBuildings.js';
import { CAT_COLORS, LOOKS, facingFor, randomCharacter, seeded } from '../src/tinyCharacters.js';
import { drawTownView, makeTown } from '../src/tinyTown.js';

// The town: a 2D map of streets and blocks. The view follows you (the gold
// line): arrow keys / WASD, or tap where to go (tap a building to walk to its
// door); tap someone to make them talk. Everyone walks round the buildings.
// The keys move whoever is in the canvas you tapped last (the town at first).
const canvas = document.querySelector('#town'), g = canvas.getContext('2d');
const VW = canvas.width, VH = canvas.height;
// the canvas is drawn 4 times bigger underneath (the pixels stay as crisp),
// so the shop signs have the pixels to write their names in DotGothic16
const D = 4;
canvas.width = VW * D; canvas.height = VH * D;
const here = document.querySelector('#here');
const town = makeTown();
const area = (name) => town.areas.find((a) => a.name === name);

let people, you, seed = 11;
const keys = new Set();
function walker(look, rng, within, cat = false) {
  const at = town.randomSpot(rng, within);
  return { ...look, ...at, within, cat, path: null, wait: rng() * 3, talk: 0 };
}
function newPeople() {
  const rng = seeded(seed++);
  people = [];
  for (let i = 0; i < 40; i++) people.push(walker(randomCharacter(rng), rng));
  const yard = area('Schoolyard'), shrine = area('Shrine grounds'), square = area('Old-town square');
  for (let i = 0; i < 10; i++) people.push(walker({ ...randomCharacter(rng), ...(i % 3 === 0 ? (i % 2 ? LOOKS.schoolgirl : LOOKS.schoolboy) : {}), kid: true, carry: undefined }, rng, yard));
  for (let i = 0; i < 5; i++) people.push(walker(randomCharacter(rng), rng, shrine));
  for (let i = 0; i < 6; i++) people.push(walker(randomCharacter(rng), rng, square));
  for (let i = 0; i < 6; i++) people.push(walker({ color: CAT_COLORS[Math.floor(rng() * CAT_COLORS.length)] }, rng, undefined, true));
  you = { ...randomCharacter(rng), body: '#f2f2ee', x: Math.round(196 * town.scale), y: Math.round(204 * town.scale), you: true, talk: 0, path: null };
  people.push(you);
}
newPeople();

const active = () => (document.body.dataset.active ?? 'town') === 'town';
addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow') && active()) e.preventDefault(); keys.add(e.key.toLowerCase()); });
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

let view = { x: 0, y: 0, w: VW, h: VH };
canvas.addEventListener('pointerdown', (e) => {
  document.body.dataset.active = 'town';
  const r = canvas.getBoundingClientRect();
  const x = view.x + (e.clientX - r.left) / r.width * VW, y = view.y + (e.clientY - r.top) / r.height * VH;
  const hit = people.filter((p) => p !== you && !p.cat && Math.abs(p.x - x) < 5 && y > p.y - 17 && y < p.y + 3).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (hit) { hit.talk = 2; return; }
  // a building: walk to its door; anywhere else you can stand: walk there
  const b = town.buildings.find((b) => buildingSolids(b).some((s) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h))
    ?? town.buildings.find((b) => { const { w, h } = buildingSize(b); return Math.abs(x - b.x) <= w / 2 && y <= b.y && y >= b.y - h; });
  const to = b ? town.doorOf(b) : { x, y };
  if (!town.blocked(to.x, to.y)) you.path = town.findPath(you, to);
});
document.querySelector('#newTown').onclick = newPeople;

/** Walk p along its path at `speed` px/s; true when it has arrived. */
function follow(p, speed, dt) {
  const q = p.path?.[0];
  if (!q) { p.path = null; return true; }
  const ex = q.x - p.x, ey = q.y - p.y, d = Math.hypot(ex, ey), step = speed * dt;
  if (d <= step) { p.x = q.x; p.y = q.y; p.path.shift(); }
  else { p.x += ex / d * step; p.y += ey / d * step; }
  if (p.cat) { if (Math.abs(ex) > 0.3) p.facing = ex < 0 ? 'left' : 'right'; }
  else if (Math.hypot(ex, ey) > 0.3) p.facing = facingFor(ex, ey, p.facing);
  p.walking = true;
  return false;
}

let last = performance.now(), t = 0, shown = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  // you: the keys (sliding along walls), else your path
  let dx = 0, dy = 0;
  if (active()) {
    dx = (keys.has('arrowright') || keys.has('d')) - (keys.has('arrowleft') || keys.has('a'));
    dy = (keys.has('arrowdown') || keys.has('s')) - (keys.has('arrowup') || keys.has('w'));
  }
  if (dx || dy) {
    you.path = null; you.walking = true;
    you.facing = facingFor(dx, dy, you.facing);
    const nx = you.x + dx * 36 * dt, ny = you.y + dy * 24 * dt;
    if (!town.blocked(nx, you.y)) you.x = nx;
    if (!town.blocked(you.x, ny)) you.y = ny;
  } else if (you.path) follow(you, 36, dt);
  else you.walking = false;
  // everyone else: a short trip, a rest, another trip
  for (const p of people) {
    p.talk = Math.max(0, p.talk - dt); p.talking = p.talk > 0;
    if (p === you) continue;
    if (p.talking) { p.walking = false; continue; }
    if (p.path) { if (follow(p, p.cat ? 18 : 14, dt)) { p.walking = false; p.wait = 1 + Math.random() * 4; } continue; }
    p.walking = false;
    if ((p.wait -= dt) > 0) continue;
    const range = (p.cat ? 70 : 170) * town.scale;
    let to = town.randomSpot(Math.random, p.within);
    for (let k = 0; k < 6 && Math.hypot(to.x - p.x, to.y - p.y) > range; k++) to = town.randomSpot(Math.random, p.within);
    p.path = town.findPath(p, to);
    if (!p.path) p.wait = 1;
  }
  // the view follows you
  view = {
    x: Math.round(Math.max(0, Math.min(town.W - VW, you.x - VW / 2))),
    y: Math.round(Math.max(0, Math.min(town.H - VH, you.y - VH * 0.6))),
    w: VW, h: VH,
  };
  g.setTransform(D, 0, 0, D, 0, 0);
  drawTownView(g, town, view, people, t, { dpx: D });
  const name = town.placeAt(you.x, you.y);
  if (name !== shown) { shown = name; here.textContent = name; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Buildings: each one on its own, with its name; a few seeds of those that vary.
const sheet = document.querySelector('#buildings');
const VARIED = { mosque: [1, 2, 3, 8, 11, 16, 9, 6] };
const SD = 6;                                                 // drawn 6 times bigger underneath, for the signs
await document.fonts.load(`16px ${SIGN_FONT}`).catch(() => {});
for (const [type, { label, w, h }] of Object.entries(BUILDINGS)) {
  if (type === 'torii' || type === 'shrineHall') continue;    // shown together as the shrine
  for (const seed of VARIED[type] ?? [2]) {
    const c = document.createElement('canvas');
    c.width = (w + 4) * SD; c.height = (h + 4) * SD; c.className = 'bld';
    c.style.setProperty('--w', w + 4);
    const g = c.getContext('2d');
    g.setTransform(SD, 0, 0, SD, 0, 0); g.imageSmoothingEnabled = false;
    g.fillStyle = '#d8d2c4'; g.fillRect(0, h + 2, w + 4, 2);
    drawBuilding(g, { type, x: 2 + w / 2, y: h + 2, seed, dpx: SD });
    const f = document.createElement('figure');
    const cap = document.createElement('figcaption'); cap.textContent = VARIED[type] ? `${label} (seed ${seed})` : label;
    f.append(c, cap); sheet.append(f);
  }
}
