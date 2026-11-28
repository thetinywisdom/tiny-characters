import { BUILDINGS, SIGN_FONT, buildingSize, buildingSolids, drawBuilding } from '../src/tinyBuildings.js';
import { LOOKS, facingFor, randomCharacter, seeded } from '../src/tinyCharacters.js';
import { CAT_COATS, DOG_BREEDS, dogFor } from '../src/tinyAnimals.js';
import { drawTownView, makeTown } from '../src/tinyTown.js';
import { makeTraffic } from '../src/tinyTraffic.js';
import { drawSpeech, emote, moodFor, sayDuration, speak } from '../src/tinySpeech.js';
import { makeLife } from './life.js';

// The town: a 2D map of streets and blocks. The view follows you (the gold
// ring): arrow keys / WASD, or tap where to go (tap a building to walk to its
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

let people, you, seed = 11, players = [], ball = null, smallLife = null;
const keys = new Set();
function walker(look, rng, within, cat = false) {
  let at = town.randomSpot(rng, within);
  for (let k = 0; k < 12 && people?.some((q) => Math.abs(q.x - at.x) < 6 && Math.abs(q.y - at.y) < 4); k++) at = town.randomSpot(rng, within);   // not on top of someone
  return { ...look, ...at, within, cat, path: null, wait: rng() * 3, talk: 0 };
}
function newPeople() {
  const rng = seeded(seed++);
  people = [];
  for (let i = 0; i < 20; i++) people.push(walker(randomCharacter(rng), rng));
  const yard = area('Schoolyard'), shrine = area('Shrine grounds'), square = area('Old-town square');
  for (let i = 0; i < 5; i++) people.push(walker({ ...randomCharacter(rng), ...(i % 3 === 0 ? (i % 2 ? LOOKS.schoolgirl : LOOKS.schoolboy) : {}), kid: true, carry: undefined }, rng, yard));
  for (let i = 0; i < 3; i++) people.push(walker(randomCharacter(rng), rng, shrine));
  for (let i = 0; i < 3; i++) people.push(walker(randomCharacter(rng), rng, square));
  // the south: strollers in the park, kids on the playground and the court, commuters at the stations, cats in the alley
  const park = area('Pond park'), play = area('Playground'), court = area('Basketball court'), plaza = area('Station plaza'), alley = area('Station alley');
  if (park) for (let i = 0; i < 3; i++) people.push(walker(randomCharacter(rng), rng, park));
  if (play) for (let i = 0; i < 3; i++) people.push(walker({ ...randomCharacter(rng), kid: true, size: undefined, carry: undefined, top: undefined }, rng, play));
  if (plaza) for (let i = 0; i < 4; i++) people.push(walker(randomCharacter(rng), rng, plaza));
  if (alley) for (let i = 0; i < 2; i++) people.push(walker({ coat: Object.keys(CAT_COATS)[Math.floor(rng() * 8)] }, rng, alley, true));
  // a game of basketball: four kids on the court and a ball passed between them
  players = [];
  if (court) {
    for (let i = 0; i < 4; i++) { const p = walker({ ...randomCharacter(rng), kid: true, size: undefined, carry: undefined, top: undefined }, rng, { x: court.x + 16, y: court.y + 14, w: court.w - 32, h: court.h - 24 }); p.player = true; people.push(p); players.push(p); }
    ball = { ball: true, x: players[0].x, y: players[0].y, h: 0, from: players[0], to: players[1], start: 0 };
  }
  for (let i = 0; i < 6; i++) people.push(walker({ coat: Object.keys(CAT_COATS)[Math.floor(rng() * 8)] }, rng, undefined, true));
  // dog walkers: a dog follows its owner, a little behind
  for (let i = 0; i < 3; i++) {
    const owner = walker(randomCharacter(rng), rng);
    const breed = Object.keys(DOG_BREEDS)[Math.floor(rng() * Object.keys(DOG_BREEDS).length)];
    people.push(owner, { dog: true, ...dogFor(breed, 1 + Math.floor(rng() * 99)), collar: ['#d8443c', '#3f7fd6', '#2fa36b', '#f2c230'][i % 4], owner, x: owner.x - 6, y: owner.y, talk: 0 });
  }
  you = { ...randomCharacter(rng), body: '#f2f2ee', x: town.pad + Math.round(196 * town.scale), y: town.pad + Math.round(204 * town.scale), you: true, talk: 0, path: null };
  while (town.roadAt(you.x, you.y) || town.blocked(you.x, you.y)) you.x -= 2;   // start on the sidewalk, not in the road (cars would wait for you)
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
  // small life: benches, bikes, shopkeepers, the playground, pigeons, crows, the station's commuters... (demo/life.js)
  smallLife = makeLife({ town, traffic, people, rng });
}
newPeople();
// for trying things out in the browser's console (and for tests): the town, its traffic, you
window.tinyTown = { town, traffic, get you() { return you; }, get people() { return people; }, get life() { return smallLife; }, get hour() { return hour; }, set hour(h) { hour = h; } };

const active = () => (document.body.dataset.active ?? 'town') === 'town';
addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow') && active()) e.preventDefault(); keys.add(e.key.toLowerCase()); });
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

let view = { x: 0, y: 0, w: VW, h: VH };
/** Where a pointer event is in the town, and who (a person, an animal, a monster) is under it. */
function pointAt(e) {
  const r = canvas.getBoundingClientRect();
  const x = view.x + (e.clientX - r.left) / r.width * VW, y = view.y + (e.clientY - r.top) / r.height * VH;
  const tall = (p) => (p.cat || p.dog ? 10 : p.monster ? 20 : 17);
  const who = people.filter((p) => p !== you && !p.away && (showMonsters || !p.monster) && Math.abs(p.x - x) < 5 && y > p.y - tall(p) && y < p.y + 3).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  return { x, y, who };
}
// point at someone (a mouse): a white ring under them, and the hand cursor
let pointed = null;
canvas.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; pointed = pointAt(e).who ?? null; canvas.style.cursor = pointed ? 'pointer' : ''; });
canvas.addEventListener('pointerleave', () => { pointed = null; canvas.style.cursor = ''; });
canvas.addEventListener('pointerdown', (e) => {
  document.body.dataset.active = 'town';
  const { x, y, who: hit } = pointAt(e);
  // tap someone: they stop and say a line that suits them (a white ring under them while they say it)
  if (hit) { const said = speak(hit, t); hit.talk = Math.min(4, sayDuration(said.text) - 0.8); hit.ringUntil = t + sayDuration(said.text); return; }
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

// the time of day: an hour every 8 seconds, from 4 in the afternoon (so the
// evening comes soon); the button keeps it day or night instead
let hour = 16, timeMode = 'passing';
// the night lights' style: flat steps ('bands', the owner's choice); ?lights=soft | dither | mixed in
// the address tries the others;
// ?time=night starts at night
const params = new URLSearchParams(location.search), LIGHTS = ['soft', 'bands', 'dither', 'mixed'].includes(params.get('lights')) ? params.get('lights') : 'bands';
const timeButton = document.querySelector('#time'), clock = document.querySelector('#clock');
timeButton.onclick = () => {
  timeMode = { passing: 'day', day: 'night', night: 'passing' }[timeMode];
  timeButton.textContent = `Time: ${timeMode}`;
  if (timeMode === 'day') hour = 12; else if (timeMode === 'night') hour = 22;
};
if (params.get('time') === 'night') timeButton.onclick();
if (params.get('time') === 'night') timeButton.onclick();   // passing -> day -> night
// the season and the weather (the owner's choice, Nov 2026): left on auto, the season follows the
// real month and it rains now and then (some 3-hour spells of the town's day; snow in winter);
// the buttons (or ?season= spring | summer | autumn | winter, ?weather= clear | rain) pick them
const SEASON_OF_MONTH = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
const SEASON_MODES = ['auto', 'spring', 'summer', 'autumn', 'winter'], WEATHER_MODES = ['auto', 'clear', 'rain'];
let seasonMode = SEASON_MODES.includes(params.get('season')) ? params.get('season') : 'auto';
let weatherMode = WEATHER_MODES.includes(params.get('weather')) ? params.get('weather') : 'auto';
let day = 0;                                                               // days gone by on the town's clock
const seasonButton = document.querySelector('#season'), weatherButton = document.querySelector('#weather');
const seasonNow = () => (seasonMode === 'auto' ? SEASON_OF_MONTH[new Date().getMonth()] : seasonMode);
const rainingNow = () => (weatherMode === 'auto' ? (Math.imul(day * 8 + Math.floor(hour / 3) + 11, 2654435761) >>> 0) % 100 < 22 : weatherMode === 'rain');
const label = () => {
  seasonButton.textContent = `Season: ${seasonMode === 'auto' ? `auto (${seasonNow()})` : seasonMode}`;
  weatherButton.textContent = `Weather: ${weatherMode === 'auto' ? `auto (${rainingNow() ? (seasonNow() === 'winter' ? 'snow' : 'rain') : 'clear'})` : weatherMode === 'rain' && seasonNow() === 'winter' ? 'snow' : weatherMode}`;
};
seasonButton.onclick = () => { seasonMode = SEASON_MODES[(SEASON_MODES.indexOf(seasonMode) + 1) % SEASON_MODES.length]; label(); };
weatherButton.onclick = () => { weatherMode = WEATHER_MODES[(WEATHER_MODES.indexOf(weatherMode) + 1) % WEATHER_MODES.length]; label(); };
/** While it rains (or snows), walkers put their umbrellas up; afterwards they carry what they had (new people too). */
function umbrellas(raining) {
  for (const p of people) {
    if (p.monster || p.cat || p.dog) continue;
    if (raining && !('dryCarry' in p)) { p.dryCarry = p.carry; p.carry = 'umbrella'; }
    else if (!raining && 'dryCarry' in p) { p.carry = p.dryCarry; delete p.dryCarry; }
  }
}
/** How dark it is at an hour: 0 by day (7 to 17), 1 at night (20 to 5), easing between. */
function nightAt(h) {
  const ease = (u) => u * u * (3 - 2 * u);
  if (h >= 7 && h < 17) return 0;
  if (h >= 17 && h < 20) return ease((h - 17) / 3);
  if (h >= 5 && h < 7) return ease(1 - (h - 5) / 2);
  return 1;
}

/** A dog keeps a little behind its owner: it trots after them when they get away. */
function heel(d, dt) {
  const o = d.owner, back = o.facing === 'left' ? 7 : o.facing === 'right' ? -7 : 0, down = o.facing === 'up' ? 5 : o.facing === 'down' ? -4 : 0;
  let tx = o.x + back, ty = o.y + down + 1;
  if (town.roadAt(tx, ty) && !town.roadAt(o.x, o.y)) { tx = o.x - back; ty = o.y - down + 1; }   // not out in the road behind them: the other side
  const ex = tx - d.x, ey = ty - d.y, dist = Math.hypot(ex, ey);
  if (dist > 1.5) { const v = Math.min(dist, (dist > 12 ? 30 : 16) * dt); d.x += ex / dist * v; d.y += ey / dist * v; d.walking = true; d.facing = facingFor(ex, ey, d.facing); }
  else { d.walking = false; d.facing = o.facing ?? 'down'; }
}

// speech: now and then someone shows how they feel (an icon bubble), and two
// passers-by close to each other stop and chat in icons, taking turns
const CHAT_ICONS = ['dots', 'bang', 'note', 'heart', 'what', 'dots'];
const chatty = (p) => p !== you && !p.monster && !p.dog && !p.cat && !p.chat && !p.talking;
let nextChat = 3;
function life(dt) {
  const night = nightAt(hour);
  for (const p of people) {
    if (p === you || p.dog) continue;
    p.nextMood ??= 3 + Math.random() * 15;
    if ((p.nextMood -= dt) <= 0) { p.nextMood = 8 + Math.random() * 16; if (!p.chat && (showMonsters || !p.monster)) emote(p, moodFor(p, Math.random, { night }), t); }
  }
  // start a chat between two people standing or walking close together, off the road
  if ((nextChat -= dt) <= 0) {
    nextChat = 2 + Math.random() * 3;
    const pool = people.filter(chatty), a = pool[Math.floor(Math.random() * pool.length)];
    const b = a && people.find((q) => q !== a && chatty(q) && Math.abs(q.x - a.x) < 16 && Math.abs(q.y - a.y) < 6);
    if (a && b && !town.roadAt(a.x, a.y) && !town.roadAt(b.x, b.y)) { const c = { a, b, until: t + 4 + Math.random() * 3, next: t, turn: 0 }; a.chat = b.chat = c; }
  }
}
/** Two people chatting: they face each other and take turns with icon bubbles; true while it lasts. */
function chatting(p) {
  const c = p.chat;
  if (!c) return false;
  if (t > c.until) { c.a.chat = c.b.chat = null; return false; }
  const other = p === c.a ? c.b : c.a;
  p.walking = false; p.facing = other.x < p.x ? 'left' : 'right';
  if (p === c.a && t >= c.next) { emote(c.turn % 2 ? c.b : c.a, CHAT_ICONS[Math.floor(Math.random() * CHAT_ICONS.length)], t, 1.1); c.turn++; c.next = t + 1.25; }
  return true;
}

// what flies or floats over cars and people rather than waiting for them
const FLIERS = new Set(['ghostGirl', 'reaper', 'skull']);
/**
 * Is someone else standing where p would stand at (x, y)? Everyone on foot keeps a little room round
 * them (about a person's width across, a little front to back); a dog and its owner, the flying
 * monsters, and hidden monsters are left out.
 */
function crowded(p, x, y) {
  if (FLIERS.has(p.monster)) return null;
  for (const q of people) {
    if (q === p || q.away || q.owner === p || p.owner === q || FLIERS.has(q.monster) || (q.monster && !showMonsters)) continue;
    if (Math.abs(q.x - x) < 4.5 && Math.abs(q.y - y) < 2.5) return q;
  }
  return null;
}
/** Walk p along its path at `speed` px/s (waiting at a crossing while its cars have green); true when it has arrived. */
function follow(p, speed, dt) {
  const q = p.path?.[0];
  if (!q) { p.path = null; return true; }
  const ex = q.x - p.x, ey = q.y - p.y, d = Math.hypot(ex, ey), step = speed * dt;
  if (d > 0 && !p.flying && !traffic.mayCross(p.x, p.y, p.x + ex / d * (step + 2), p.y + ey / d * (step + 2), t)) { p.walking = false; p.facing = facingFor(ex, ey, p.facing); return false; }
  // a car (or the train) in the way: wait for it to go by (flying and floating monsters pass over);
  // someone in the way: step round them if there is room, else wait
  const ux = ex / Math.max(d, 1e-6), uy = ey / Math.max(d, 1e-6);
  const ahead = traffic.hits(p.x + ux * (step + 3), p.y + uy * (step + 3));
  const here = crowded(p, p.x, p.y), there = crowded(p, p.x + ux * (step + 1), p.y + uy * (step + 1));
  // someone in the way: unless already overlapping them and this step takes them apart
  let inWay = d > 0 && !ahead && !!there && (there !== here || Math.hypot(there.x - p.x - ux * step, there.y - p.y - uy * step) < Math.hypot(there.x - p.x, there.y - p.y));
  const onRoad = town.roadAt(p.x, p.y);
  if (inWay && p.path.length === 1 && d < 8 && p !== you && !onRoad) { p.path = null; p.walking = false; return true; }   // where they were going is taken: stop short
  if (inWay) for (const s of here ? [] : [1, -1]) {                                   // a side step (across the way it walks), a pixel at a time
    const sx = p.x - uy * s * 1.2, sy = p.y + ux * s * 0.8;
    if (!town.blocked(sx, sy) && !crowded(p, sx, sy) && !traffic.hits(sx, sy)) { p.x = sx; p.y = sy; inWay = false; break; }
  }
  // someone just standing about in the way (resting between trips): after a moment they step aside
  const resting = (q) => !q.path && !q.busy && !q.you && !q.dog && !q.chat && !q.talking && !q.player;
  if (inWay && resting(there) && (p.blocked ?? 0) > 0.5) there.wait = 0;
  // held up out on a crossing by someone who will not step aside (coming the other way, busy, you):
  // squeeze past (not stand in the cars' way) until clear of them
  if (inWay && onRoad && !resting(there) && ((p.blocked ?? 0) > 0.6 || p.squeeze)) { inWay = false; p.squeeze = true; } else if (!inWay) p.squeeze = false;
  if (d > 0 && (inWay || (ahead && !FLIERS.has(p.monster) && !traffic.hits(p.x, p.y)))) {
    p.walking = false; p.facing = facingFor(ex, ey, p.facing);
    // kept waiting too long (a car, or someone, that waits for them in turn): give up and go somewhere else
    if ((p.blocked = (p.blocked ?? 0) + dt) > 2 && p !== you && !onRoad) { p.blocked = 0; p.path = null; p.wait = 0.5; }
    return false;
  }
  p.blocked = 0;
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
    // walls, things, and cars: you cannot walk through any of them (but you can step out of one you are already in)
    const free = (x, y) => !town.blocked(x, y) && (!traffic.hits(x, y) || traffic.hits(you.x, you.y)) && (!crowded(you, x, y) || crowded(you, you.x, you.y));
    if (free(nx, you.y)) you.x = nx;
    if (free(you.x, ny)) you.y = ny;
  } else if (you.path) follow(you, 36, dt);
  else you.walking = false;
  // everyone else: a short trip, a rest, another trip
  for (const p of people) {
    p.talk = Math.max(0, p.talk - dt); p.talking = p.talk > 0;
    if (p === you) continue;
    if (p.dog) { if (!p.greet) heel(p, dt); continue; }
    if (p.talking) { p.walking = false; continue; }
    if (p.busy) continue;                                                  // sitting, sweeping, playing... (demo/life.js moves them)
    if (chatting(p)) continue;
    if (p.path) { if (follow(p, p.monster ? MONSTER_SPEED[p.monster] : p.cat ? 18 : p.rider ? 32 : 14, dt)) { p.walking = false; p.wait = 1 + Math.random() * 4; } continue; }
    p.walking = false;
    if ((p.wait -= dt) > 0) continue;
    const range = (p.cat ? 70 : p.monster ? 220 : 170) * town.scale;
    // somewhere near enough, where nobody stands or is heading
    const taken = (s) => people.some((q) => q !== p && ((Math.abs(q.x - s.x) < 6 && Math.abs(q.y - s.y) < 4) || (q.path && q.path.length && Math.hypot(q.path[q.path.length - 1].x - s.x, q.path[q.path.length - 1].y - s.y) < 6)));
    let to = town.randomSpot(Math.random, p.within);
    for (let k = 0; k < 10 && (Math.hypot(to.x - p.x, to.y - p.y) > range || taken(to) || town.roadAt(to.x, to.y)); k++) to = town.randomSpot(Math.random, p.within);
    if (town.roadAt(to.x, to.y)) { p.wait = 0.5; continue; }               // (never a trip that ends out on a crossing)
    p.path = town.findPath(p, to);
    if (!p.path) p.wait = 1;
  }
  life(dt);
  smallLife.update(dt, t, hour);
  // the ball: thrown from one player to another in an arc, then the next pass (it bounces once on the way)
  if (ball) {
    const k = Math.min(1, (t - ball.start) / 0.9), a = ball.from, b = ball.to;
    ball.x = a.x + (b.x - a.x) * k; ball.y = a.y + (b.y - a.y) * k + 1;
    ball.h = 7 * Math.abs(Math.cos(Math.PI * k));                          // from hand height, one bounce half way, up to the other's hands
    if (k >= 1) { ball.from = b; ball.to = players.filter((p) => p !== b)[Math.floor(Math.random() * 3)]; ball.start = t; b.facing = ball.to.x < b.x ? 'left' : 'right'; }
  }
  const shownPeople = people.filter((p) => !p.away && (showMonsters || !p.monster));
  traffic.update(dt, t, shownPeople);
  if (timeMode === 'passing') { const h = hour + dt / 8; if (h >= 24) day++; hour = h % 24; }
  const season = seasonNow(), raining = rainingNow();
  umbrellas(raining); label();
  const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 6) * 10;
  const time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  if (clock.textContent !== time) clock.textContent = time;
  // the view follows you
  view = {
    x: Math.round(Math.max(0, Math.min(town.W - VW, you.x - VW / 2))),
    y: Math.round(Math.max(0, Math.min(town.H - VH, you.y - VH * 0.6))),
    w: VW, h: VH,
  };
  for (const p of people) p.ring = p === pointed || (p.ringUntil ?? 0) > t ? '#ffffff' : undefined;
  g.setTransform(D, 0, 0, D, 0, 0);
  drawTownView(g, town, view, [...shownPeople, ...smallLife.sprites, ...traffic.vehicles, ...(ball ? [ball] : [])], t, { dpx: D, night: nightAt(hour), above: smallLife.above, lights: LIGHTS, season, weather: raining ? 'rain' : 'clear' });
  // lines and icon bubbles over everything (and bright at night)
  g.save(); g.translate(-view.x, -view.y); drawSpeech(g, shownPeople, t, { bounds: view }); g.restore();
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
for (const [type, { label, widths, scale = 1 }] of Object.entries(BUILDINGS)) {   // (redrawn ones at their own size, 1.5)
  if (type === 'torii' || type === 'shrineHall') continue;    // shown together as the shrine
  const seeds = [], seen = new Set();
  for (let seed = 1; seed <= 40 && seeds.length < SHOWN; seed++) {
    const { w, h } = buildingSize({ type, seed, scale }), key = widths.length > 1 ? `${w}x${h}` : `${seed}`;
    if (!seen.has(key)) { seen.add(key); seeds.push(seed); }
  }
  for (const seed of seeds) {
    const { w, h } = buildingSize({ type, seed, scale });
    const c = document.createElement('canvas');
    c.width = (w + 4) * SD; c.height = (h + 4) * SD; c.className = 'bld';
    c.style.setProperty('--w', w + 4);
    const g = c.getContext('2d');
    g.setTransform(SD, 0, 0, SD, 0, 0); g.imageSmoothingEnabled = false;
    g.fillStyle = '#d8d2c4'; g.fillRect(0, h + 2, w + 4, 2);
    drawBuilding(g, { type, x: 2 + w / 2, y: h + 2, seed, dpx: SD, scale });
    const f = document.createElement('figure');
    const cap = document.createElement('figcaption'); cap.textContent = `${label} (seed ${seed})`;
    f.append(c, cap); sheet.append(f);
  }
}
