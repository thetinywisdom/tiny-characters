import { BUILDINGS, SIGN_FONT, buildingSize, buildingSolids, drawBuilding } from '../src/tinyBuildings.js';
import { LOOKS, facingFor, randomCharacter, seeded } from '../src/tinyCharacters.js';
import { CAT_COATS, DOG_BREEDS, dogFor } from '../src/tinyAnimals.js';
import { drawTownView, makeTown } from '../src/tinyTown.js';
import { makeTraffic } from '../src/tinyTraffic.js';

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
const traffic = makeTraffic(town, { cars: 18, buses: 2 });
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
  for (let i = 0; i < 6; i++) people.push(walker({ coat: Object.keys(CAT_COATS)[Math.floor(rng() * 8)] }, rng, undefined, true));
  // dog walkers: a dog follows its owner, a little behind
  for (let i = 0; i < 5; i++) {
    const owner = walker(randomCharacter(rng), rng);
    const breed = Object.keys(DOG_BREEDS)[Math.floor(rng() * Object.keys(DOG_BREEDS).length)];
    people.push(owner, { dog: true, ...dogFor(breed, 1 + Math.floor(rng() * 99)), collar: ['#d8443c', '#3f7fd6', '#2fa36b', '#f2c230'][i % 4], owner, x: owner.x - 6, y: owner.y, talk: 0 });
  }
  you = { ...randomCharacter(rng), body: '#f2f2ee', x: town.pad + Math.round(196 * town.scale), y: town.pad + Math.round(204 * town.scale), you: true, talk: 0, path: null };
  // monsters, each somewhere that suits it
  const M = (monster, variant, within) => walker({ monster, variant }, rng, within);
  for (let v = 0; v < 4; v++) people.push(M('zombie', v));                              // zombies shamble the streets
  for (let v = 0; v < 2; v++) people.push(M('werewolf', Math.floor(rng() * 4)));
  people.push(M('ghostGirl', 1, shrine), M('ghostGirl', 0, shrine), M('ghostGirl', 2), M('ghostGirl', 3));  // ghosts drift round the shrine
  people.push(M('reaper', 0, square), M('reaper', Math.floor(rng() * 4)));             // a reaper by the chapel
  people.push(M('skeleton', 0, yard), M('skeleton', 3, yard), M('skeleton', 1), M('skeleton', 2));
  for (let v = 0; v < 2; v++) people.push(M('spider', Math.floor(rng() * 4)));
  for (let v = 0; v < 3; v++) people.push(M('skull', Math.floor(rng() * 4)));
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
  const hit = people.filter((p) => p !== you && !p.cat && !p.dog && !p.monster && Math.abs(p.x - x) < 5 && y > p.y - 17 && y < p.y + 3).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (hit) { hit.talk = 2; return; }
  // a building: walk to its door; anywhere else you can stand: walk there
  const b = town.buildings.find((b) => buildingSolids(b).some((s) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h))
    ?? town.buildings.find((b) => { const { w, h } = buildingSize(b); return Math.abs(x - b.x) <= w / 2 && y <= b.y && y >= b.y - h; });
  const to = b ? town.doorOf(b) : { x, y };
  if (!town.blocked(to.x, to.y)) you.path = town.findPath(you, to);
});
document.querySelector('#newTown').onclick = newPeople;
// monsters: their speeds (a zombie shambles, a werewolf runs), and a button to hide them
const MONSTER_SPEED = { zombie: 7, werewolf: 26, ghostGirl: 9, reaper: 11, spider: 18, skeleton: 13, skull: 16 };
let showMonsters = true;
const monstersButton = document.querySelector('#monsters');
monstersButton.onclick = () => { showMonsters = !showMonsters; monstersButton.textContent = showMonsters ? 'Hide monsters' : 'Show monsters'; monstersButton.setAttribute('aria-pressed', showMonsters); };

/** A dog keeps a little behind its owner: it trots after them when they get away. */
function heel(d, dt) {
  const o = d.owner, back = o.facing === 'left' ? 7 : o.facing === 'right' ? -7 : 0, down = o.facing === 'up' ? 5 : o.facing === 'down' ? -4 : 0;
  const tx = o.x + back, ty = o.y + down + 1, ex = tx - d.x, ey = ty - d.y, dist = Math.hypot(ex, ey);
  if (dist > 1.5) { const v = Math.min(dist, (dist > 12 ? 30 : 16) * dt); d.x += ex / dist * v; d.y += ey / dist * v; d.walking = true; d.facing = facingFor(ex, ey, d.facing); }
  else { d.walking = false; d.facing = o.facing ?? 'down'; }
}

/** Walk p along its path at `speed` px/s (waiting at a crossing while its cars have green); true when it has arrived. */
function follow(p, speed, dt) {
  const q = p.path?.[0];
  if (!q) { p.path = null; return true; }
  const ex = q.x - p.x, ey = q.y - p.y, d = Math.hypot(ex, ey), step = speed * dt;
  if (d > 0 && !p.flying && !traffic.mayCross(p.x, p.y, p.x + ex / d * (step + 2), p.y + ey / d * (step + 2), t)) { p.walking = false; p.facing = facingFor(ex, ey, p.facing); return false; }
  if (d <= step) { p.x = q.x; p.y = q.y; p.path.shift(); }
  else { p.x += ex / d * step; p.y += ey / d * step; }
  if (Math.hypot(ex, ey) > 0.3) p.facing = facingFor(ex, ey, p.facing);
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
    if (p.dog) { heel(p, dt); continue; }
    if (p.talking) { p.walking = false; continue; }
    if (p.path) { if (follow(p, p.monster ? MONSTER_SPEED[p.monster] : p.cat ? 18 : 14, dt)) { p.walking = false; p.wait = 1 + Math.random() * 4; } continue; }
    p.walking = false;
    if ((p.wait -= dt) > 0) continue;
    const range = (p.cat ? 70 : p.monster ? 220 : 170) * town.scale;
    let to = town.randomSpot(Math.random, p.within);
    for (let k = 0; k < 6 && Math.hypot(to.x - p.x, to.y - p.y) > range; k++) to = town.randomSpot(Math.random, p.within);
    p.path = town.findPath(p, to);
    if (!p.path) p.wait = 1;
  }
  const shownPeople = showMonsters ? people : people.filter((p) => !p.monster);
  traffic.update(dt, t, shownPeople);
  // the view follows you
  view = {
    x: Math.round(Math.max(0, Math.min(town.W - VW, you.x - VW / 2))),
    y: Math.round(Math.max(0, Math.min(town.H - VH, you.y - VH * 0.6))),
    w: VW, h: VH,
  };
  g.setTransform(D, 0, 0, D, 0, 0);
  drawTownView(g, town, view, [...shownPeople, ...traffic.vehicles], t, { dpx: D });
  const name = town.placeAt(you.x, you.y);
  if (name !== shown) { shown = name; here.textContent = name; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Buildings: each one on its own, with its name, three seeds of each: a seed
// picks the width, floors, windows, door, roof and colours, so pick seeds
// that come out at different sizes.
const sheet = document.querySelector('#buildings');
const SHOWN = 3;
const SD = 6;                                                 // drawn 6 times bigger underneath, for the signs
await document.fonts.load(`16px ${SIGN_FONT}`).catch(() => {});
for (const [type, { label, widths }] of Object.entries(BUILDINGS)) {
  if (type === 'torii' || type === 'shrineHall') continue;    // shown together as the shrine
  const seeds = [], seen = new Set();
  for (let seed = 1; seed <= 40 && seeds.length < SHOWN; seed++) {
    const { w, h } = buildingSize({ type, seed }), key = widths.length > 1 ? `${w}x${h}` : `${seed}`;
    if (!seen.has(key)) { seen.add(key); seeds.push(seed); }
  }
  for (const seed of seeds) {
    const { w, h } = buildingSize({ type, seed });
    const c = document.createElement('canvas');
    c.width = (w + 4) * SD; c.height = (h + 4) * SD; c.className = 'bld';
    c.style.setProperty('--w', w + 4);
    const g = c.getContext('2d');
    g.setTransform(SD, 0, 0, SD, 0, 0); g.imageSmoothingEnabled = false;
    g.fillStyle = '#d8d2c4'; g.fillRect(0, h + 2, w + 4, 2);
    drawBuilding(g, { type, x: 2 + w / 2, y: h + 2, seed, dpx: SD });
    const f = document.createElement('figure');
    const cap = document.createElement('figcaption'); cap.textContent = `${label} (seed ${seed})`;
    f.append(c, cap); sheet.append(f);
  }
}
