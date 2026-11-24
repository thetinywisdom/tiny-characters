import { BUILDINGS, PARTS, SHOP_TYPES, SIGN_FONT, drawBuilding, drawPart } from '../src/tinyBuildings.js';
import { LOOKS, drawCharacter, lookFor } from '../src/tinyCharacters.js';
import { CAT_COATS, DOG_BREEDS, dogFor, drawCat, drawDog } from '../src/tinyAnimals.js';
import { BUSHES, TERRAINS, TREES, drawBush, drawTerrain, drawTree } from '../src/tinyNature.js';
import { MONSTERS, drawMonster } from '../src/tinyMonsters.js';
import { ACTIONS, REACTIONS, SKILLS, WEAPONS, drawAction, drawWeapon } from '../src/tinyCombat.js';
import { PROPS, drawProp } from '../src/tinyStreet.js';
import { VEHICLES, drawVehicle } from '../src/tinyTraffic.js';

// The catalogue: every person, animal and building, with filters (group,
// kind, search) and a seed per card (type it, or roll it with 🎲). The copy
// button gives the line of code that draws exactly what the card shows.
// The filters live in the address (#g=buildings&t=Japanese,Tall&q=ramen).

const PEOPLE = {
  random: ['Random person', ['Adults', 'Random']], kid: ['Random kid', ['Kids', 'Random']],
  man: ['Man', ['Adults']], woman: ['Woman', ['Adults']], boy: ['Boy', ['Kids']], girl: ['Girl', ['Kids']],
  grandpa: ['Grandpa', ['Elderly']], grandma: ['Grandma', ['Elderly']],
  schoolboy: ['Schoolboy', ['Kids', 'Uniforms']], schoolgirl: ['Schoolgirl', ['Kids', 'Uniforms']],
  salaryman: ['Salaryman', ['Adults', 'Uniforms']], police: ['Police officer', ['Adults', 'Uniforms']],
  delivery: ['Delivery worker', ['Adults', 'Uniforms']], summer: ['Summer stroll', ['Adults']], rainy: ['Rainy day', ['Adults']],
};
const KIND = {
  Homes: ['house', 'apartment', 'woodApartment', 'mixedUse', 'tudorCottage', 'mediterraneanVilla', 'dutchCanalHouse', 'frenchCountryHouse', 'scandinavianHouse'],
  'Shops & food': ['shop', 'mixedUse', 'kissaten', 'pharmacy', 'sushi', 'florist', 'fishmonger', 'udonSoba', 'familyRestaurant', 'takoyaki', 'laundromat', 'karaoke'],
  Civic: ['office', 'school', 'koban', 'postOffice', 'bank', 'clinic', 'fireStation', 'parkingGarage', 'gasStation'],
  Worship: ['shrine', 'torii', 'shrineHall', 'mosque', 'stoneChapel'],
};
const EUROPEAN = ['tudorCottage', 'mediterraneanVilla', 'dutchCanalHouse', 'frenchCountryHouse', 'scandinavianHouse', 'stoneChapel'];

// --- the items -----------------------------------------------------------------
const items = [];
for (const [name, [label, tags]] of Object.entries(PEOPLE)) {
  if (name !== 'random' && name !== 'kid' && !LOOKS[name]) continue;
  items.push({ id: `person.${name}`, label, group: 'People', tags, seed: name === 'random' || name === 'kid' ? 1 : 0, w: 24, h: 26, px: 5,
    draw: (g, seed, t, anim) => drawCharacter(g, { ...lookFor(name, seed), x: 12, y: 22, walking: anim, facing: anim ? ['down', 'right', 'up', 'left'][Math.floor(t / 1.5) % 4] : 'down' }, t),
    code: (seed) => `drawCharacter(g, { ...lookFor('${name}', ${seed}), x, y }, t)` });
}
// animals walk and turn round like the people
const turning = (t, anim) => (anim ? ['down', 'right', 'up', 'left'][Math.floor(t / 1.5) % 4] : 'right');
for (const [coat, [label]] of Object.entries(CAT_COATS)) {
  items.push({ id: `animal.cat.${coat}`, label: `Cat: ${label.toLowerCase()}`, group: 'Animals', tags: ['Cats'], seed: 0, noSeed: true, w: 20, h: 12, px: 6,
    draw: (g, seed, t, anim) => drawCat(g, { x: 10, y: 10, coat, walking: anim, facing: turning(t, anim) }, t),
    code: () => `drawCat(g, { x, y, coat: '${coat}', facing, walking }, t)` });
}
const COLLARS = ['#d8443c', '#3f7fd6', '#2fa36b', '#f2c230', '#d46a8e'];
for (const [breed, { label }] of Object.entries(DOG_BREEDS)) {
  const dog = (seed) => ({ ...dogFor(breed, seed), collar: COLLARS[seed % COLLARS.length] });
  items.push({ id: `animal.dog.${breed}`, label: `Dog: ${label.toLowerCase()}`, group: 'Animals', tags: ['Dogs'], seed: 0, w: 22, h: 14, px: 6,
    draw: (g, seed, t, anim) => drawDog(g, { x: 11, y: 12, ...dog(seed), walking: anim, facing: turning(t, anim) }, t),
    code: (seed) => `drawDog(g, { x, y, ...dogFor('${breed}', ${seed}), collar: '${dog(seed).collar}', facing, walking }, t)` });
}

// monsters: each variant, walking (or floating) and turning round
const MONSTER_KIND = { zombie: 'Undead', skeleton: 'Undead', skull: 'Undead', ghostGirl: 'Ghosts', reaper: 'Ghosts', werewolf: 'Beasts', spider: 'Beasts' };
for (const [type, { label, variants }] of Object.entries(MONSTERS)) variants.forEach((variant) => {
  const big = type === 'spider' || type === 'werewolf';
  items.push({ id: `monster.${type}.${variant.replace(/ /g, '-')}`, label: `${label}: ${variant}`, group: 'Monsters', tags: [MONSTER_KIND[type], label.split(' (')[0]], seed: 0, noSeed: true,
    w: big ? 26 : 22, h: 24, px: 5,
    draw: (g, seed, t, anim) => drawMonster(g, { type, variant, x: big ? 13 : 11, y: 21, walking: anim, facing: turning(t, anim) }, t),
    code: () => `drawMonster(g, { type: '${type}', variant: '${variant}', x, y, facing, walking }, t)` });
});

// combat: weapons, attacks, monster skills, reactions, each playing on a loop
const loop = (t, d) => t % (d + 0.7);
const FIGHTER = { ...LOOKS.man, skin: '#e2b08e' };
for (const [weapon, { label }] of Object.entries(WEAPONS)) items.push({ id: `combat.weapon.${weapon}`, label, group: 'Combat', tags: ['Weapons'], seed: 0, noSeed: true, w: 20, h: 18, px: 7,
  draw: (g) => drawWeapon(g, { weapon, x: weapon === 'bow' || weapon === 'shield' ? 9 : 6, y: weapon === 'bow' || weapon === 'shield' ? 9 : 14, angle: -45 }),
  code: () => `drawWeapon(g, { weapon: '${weapon}', x, y, angle: -45 })` });
for (const [action, { label, weapon, duration }] of Object.entries(ACTIONS)) items.push({ id: `combat.attack.${action}`, label, group: 'Combat', tags: ['Attacks'], seed: 0, noSeed: true, w: weapon === 'bow' ? 64 : 34, h: 26, px: 5, animated: true,
  draw: (g, seed, t) => drawAction(g, { ...FIGHTER, x: 12, y: 22, facing: 'right', weapon }, action, loop(t, duration), t),
  code: () => `drawAction(g, { ...person, weapon: '${weapon}', facing }, '${action}', secondsSinceItBegan, t)` });
for (const [skill, { label, monster, duration }] of Object.entries(SKILLS)) items.push({ id: `combat.skill.${skill}`, label, group: 'Combat', tags: ['Monster skills'], seed: 0, noSeed: true, w: 72, h: 28, px: 4, wide: true, animated: true,
  draw: (g, seed, t) => drawAction(g, { monster, variant: 0, x: monster === 'spider' || monster === 'werewolf' ? 12 : 9, y: 25, facing: 'right' }, skill, loop(t, duration), t),
  code: () => `drawAction(g, { monster: '${monster}', variant, x, y, facing }, '${skill}', secondsSinceItBegan, t)` });
const REACTORS = [['person', FIGHTER], ['skeleton', { monster: 'skeleton', variant: 0 }], ['ghost girl', { monster: 'ghostGirl', variant: 0 }], ['flaming skull', { monster: 'skull', variant: 0 }], ['giant spider', { monster: 'spider', variant: 0 }]];
for (const [reaction, { label, duration }] of Object.entries(REACTIONS)) for (const [who, actor] of reaction === 'dead' ? REACTORS : REACTORS.slice(0, 1)) {
  items.push({ id: `combat.reaction.${reaction}${who === 'person' ? '' : '.' + who.replace(/ /g, '-')}`, label: who === 'person' ? label : `${label}: ${who}`, group: 'Combat', tags: ['Reactions'], seed: 0, noSeed: true, w: 34, h: 26, px: 5, animated: true,
    draw: (g, seed, t) => drawAction(g, { ...actor, x: 20, y: 22, facing: 'right' }, reaction, loop(t, duration + (reaction === 'dead' ? 0.8 : 0)), t),
    code: () => `drawAction(g, { ...actor, facing }, '${reaction}', secondsSinceItBegan, t)` });
}

// trees, bushes and terrains
const JAPANESE_NATURE = ['maple', 'sakura', 'pine', 'cedar', 'bamboo', 'ginkgo', 'azalea', 'paddy'];
for (const [type, { label, w, h }] of Object.entries(TREES)) items.push({ id: `nature.tree.${type}`, label, group: 'Nature', tags: ['Trees', ...(JAPANESE_NATURE.includes(type) ? ['Japanese'] : [])], seed: 1,
  w: Math.round(w * 1.2) + 4, h: Math.round(h * 1.2) + 4, px: 0,
  draw: (g, seed) => drawTree(g, { type, x: (Math.round(w * 1.2) + 4) / 2, y: Math.round(h * 1.2) + 2, seed }),
  code: (seed) => `drawTree(g, { type: '${type}', x, y, seed: ${seed} })` });
for (const [type, { label, w, h }] of Object.entries(BUSHES)) items.push({ id: `nature.bush.${type}`, label, group: 'Nature', tags: ['Bushes', ...(JAPANESE_NATURE.includes(type) ? ['Japanese'] : [])], seed: 1,
  w: Math.round(w * 1.2) + 4, h: Math.round(h * 1.2) + 4, px: 6,
  draw: (g, seed) => drawBush(g, { type, x: (Math.round(w * 1.2) + 4) / 2, y: Math.round(h * 1.2) + 2, seed }),
  code: (seed) => `drawBush(g, { type: '${type}', x, y, seed: ${seed} })` });
for (const [type, { label }] of Object.entries(TERRAINS)) items.push({ id: `nature.terrain.${type}`, label, group: 'Nature', tags: ['Terrain', ...(JAPANESE_NATURE.includes(type) ? ['Japanese'] : [])], seed: 1,
  w: 40, h: 26, px: 4, animated: type === 'water',
  draw: (g, seed, t) => drawTerrain(g, { type, x: 0, y: 0, w: 40, h: 26, seed, t }),
  code: (seed) => `drawTerrain(g, { type: '${type}', x, y, w, h, seed: ${seed}${type === 'water' ? ', t' : ''} })` });
for (const [type, { label, w, h }] of Object.entries(BUILDINGS)) {
  const kinds = Object.keys(KIND).filter((k) => KIND[k].includes(type));
  const tags = [EUROPEAN.includes(type) ? 'European' : type === 'mosque' ? 'Mosque' : 'Japanese', ...kinds, h > 60 ? 'Tall' : 'Low'];
  const shopTypes = type === 'shop' ? SHOP_TYPES : [undefined];
  for (const shopType of shopTypes) {
    items.push({ id: `building.${type}${shopType ? ':' + shopType : ''}`, label: shopType ? `Shop: ${shopType}` : label, group: 'Buildings', tags, seed: 1,
      w: w + 8, h: h + 4, px: 0, wide: w > 60, dpx: 6,               // drawn 6 times bigger underneath, for the signs
      draw: (g, seed) => drawBuilding(g, { type, shopType, x: 4 + w / 2, y: h + 2, seed, dpx: 6 }),
      code: (seed) => `drawBuilding(g, { type: '${type}', ${shopType ? `shopType: '${shopType}', ` : ''}x, y, seed: ${seed} })` });
  }
}

// the doors and windows the buildings are made from (one set of sizes)
const PART_KIND = { 'door.wood': 'Wood', 'door.plank': 'Wood', 'door.glazed': 'Wood', 'door.arched': 'Wood', 'door.sliding': 'Japanese', 'door.shoji': 'Japanese', 'window.lattice': 'Japanese', 'window.shoji': 'Japanese', 'door.glass': 'Glass', 'door.auto': 'Glass', 'window.shop': 'Glass', 'window.alu': 'Glass', 'window.aluPair': 'Glass' };
for (const [id, { label, w, h }] of Object.entries(PARTS)) {
  const [kind, name] = id.split('.');
  const tags = [kind === 'door' ? 'Doors' : 'Windows'];
  if (PART_KIND[id]) tags.push(PART_KIND[id]);
  items.push({ id: `part.${id}`, label, group: 'Doors & windows', tags, seed: 1, w: w + 4, h: h + 3, px: 8,
    draw: (g, seed) => { g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, w + 4, h + 1); drawPart(g, { part: id, x: 2 + w / 2, y: h + 1, seed }); },
    code: (seed) => `drawPart(g, { part: '${id}', x, y, seed: ${seed} })` });
}

// the things on the streets
const PROP_TAGS = { utilityPole: ['Lights', 'Japanese'], streetLamp: ['Lights'], oldLamp: ['Lights', 'European'], stoneLantern: ['Lights', 'Japanese'], vendingMachine: ['Lights', 'Japanese'],
  bench: ['Seats'], busStop: ['Seats'], postBox: ['Japanese'], stopSign: ['Japanese'], trafficLight: ['Lights', 'Japanese'] };
const LIGHT_CYCLE = ['green', 'green', 'yellow', 'red', 'red'];
for (const [type, { label, w, h }] of Object.entries(PROPS)) items.push({ id: `street.${type}`, label, group: 'Street', tags: PROP_TAGS[type] ?? ['Things'], seed: 1,
  w: w + 8, h: h + 4, px: 0, animated: type === 'trafficLight',
  draw: (g, seed, t, moving) => drawProp(g, { type, x: (w + 8) / 2, y: h + 2, seed, lit: moving ? LIGHT_CYCLE[Math.floor(t / 1.2) % 5] : 'green' }),
  code: (seed) => `drawProp(g, { type: '${type}', x, y, seed: ${seed}${type === 'trafficLight' ? ", lit: 'green'" : ''} })` });
// vehicles, turning slowly all the way round (16 headings)
for (const [type, { label, box }] of Object.entries(VEHICLES)) {
  const w = box.w + 4, h = box.h + 4;
  items.push({ id: `street.vehicle.${type}`, label, group: 'Street', tags: ['Vehicles', ...(type === 'kei' || type === 'keiTruck' || type === 'taxi' ? ['Japanese'] : [])], seed: 1,
    w, h, px: 0, animated: true,
    draw: (g, seed, t, moving) => drawVehicle(g, { type, x: w / 2, y: h - 2 - box.below, seed, heading: moving ? (t * 45) % 360 : 30 }),
    code: (seed) => `drawVehicle(g, { type: '${type}', x, y, heading: 30, seed: ${seed} })` });
}

// --- filters ---------------------------------------------------------------------
const GROUPS = ['All', 'People', 'Animals', 'Monsters', 'Combat', 'Buildings', 'Doors & windows', 'Street', 'Nature'];
const state = { g: 'All', t: new Set(), q: '' };
const fromHash = () => {
  const h = new URLSearchParams(location.hash.slice(1));
  state.g = GROUPS.includes(h.get('g')) ? h.get('g') : 'All';
  state.t = new Set((h.get('t') ?? '').split(',').filter(Boolean));
  state.q = h.get('q') ?? '';
};
const toHash = () => {
  const h = new URLSearchParams();
  if (state.g !== 'All') h.set('g', state.g);
  if (state.t.size) h.set('t', [...state.t].join(','));
  if (state.q) h.set('q', state.q);
  history.replaceState(null, '', h.toString() ? `#${h}` : location.pathname);
};
const inGroup = (it) => state.g === 'All' || it.group === state.g;
const searched = (it) => !state.q || `${it.label} ${it.id} ${it.tags.join(' ')}`.toLowerCase().includes(state.q.toLowerCase());
const withTags = (it, tags) => tags.every((t) => it.tags.includes(t));
const matches = (it) => inGroup(it) && withTags(it, [...state.t]) && searched(it);

const $ = (s) => document.querySelector(s);
const chip = (text, pressed, onClick, n) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', pressed);
  b.textContent = text;
  if (n !== undefined) { const s = document.createElement('span'); s.className = 'n'; s.textContent = n; b.append(s); }
  b.onclick = onClick;
  return b;
};
function renderFilters() {
  $('#groups').replaceChildren(...GROUPS.map((g) => chip(g, state.g === g, () => { state.g = g; state.t.clear(); update(); }, items.filter((it) => g === 'All' || it.group === g).length)));
  const ORDER = ['Adults', 'Kids', 'Elderly', 'Uniforms', 'Random', 'Cats', 'Dogs', 'Weapons', 'Attacks', 'Monster skills', 'Reactions', 'Undead', 'Ghosts', 'Beasts', 'Zombie', 'Werewolf', 'Ghost girl', 'Reaper', 'Giant spider', 'Skeleton', 'Flaming skull', 'Trees', 'Bushes', 'Terrain', 'Doors', 'Windows', 'Wood', 'Glass', 'Japanese', 'European', 'Mosque', 'Homes', 'Shops & food', 'Civic', 'Worship', 'Low', 'Tall', 'Lights', 'Seats', 'Things', 'Vehicles'];
  const tags = [...new Set(items.filter(inGroup).flatMap((it) => it.tags))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  // each kind's count: how many you would see with it on
  $('#tags').replaceChildren(...tags.map((t) => chip(t, state.t.has(t), () => { state.t.has(t) ? state.t.delete(t) : state.t.add(t); update(); },
    items.filter((it) => inGroup(it) && withTags(it, [...state.t, t]) && searched(it)).length)));
}

// --- cards -----------------------------------------------------------------------
const cards = items.map((it) => {
  const card = document.createElement('article'); card.className = 'card'; if (it.wide) card.style.gridColumn = 'span 2';
  const stage = document.createElement('div'); stage.className = 'stage';
  const c = document.createElement('canvas'); c.width = it.w * (it.dpx ?? 1); c.height = it.h * (it.dpx ?? 1);
  const px = it.px || Math.max(1, Math.min(3, Math.floor((it.wide ? 360 : 170) / it.w), Math.floor(230 / it.h)));
  c.style.setProperty('--w', it.w); c.style.setProperty('--px', px);
  c.setAttribute('role', 'img'); c.setAttribute('aria-label', it.label);
  stage.append(c);
  const info = document.createElement('div'); info.className = 'info';
  info.innerHTML = `<div class="name"></div><div class="id"></div><div class="tags"></div>`;
  info.querySelector('.name').textContent = it.label;
  info.querySelector('.id').textContent = it.id;
  info.querySelector('.tags').textContent = it.tags.join(' · ');
  const seedRow = document.createElement('div'); seedRow.className = 'seed';
  const input = Object.assign(document.createElement('input'), { type: 'number', min: 0, step: 1, value: it.seed });
  input.setAttribute('aria-label', `Seed for ${it.label}`);
  const roll = Object.assign(document.createElement('button'), { type: 'button', textContent: '🎲' });
  roll.setAttribute('aria-label', `New look for ${it.label}`);
  const copy = Object.assign(document.createElement('button'), { type: 'button', className: 'copy', textContent: 'Copy code' });
  if (it.noSeed) seedRow.append(copy); else seedRow.append('Seed', input, roll, copy);
  card.append(stage, info, seedRow);
  const g = c.getContext('2d');
  const view = { it, card, g, c, input, setSeed(n) { it.seed = Math.max(0, Math.floor(Number(n) || 0)); input.value = it.seed; paint(view, last); } };
  input.onchange = () => view.setSeed(input.value);
  roll.onclick = () => view.setSeed(1 + Math.floor(Math.random() * 9999));
  copy.onclick = async () => {
    const line = it.code(it.seed);
    try { await navigator.clipboard.writeText(line); copy.textContent = 'Copied'; } catch { prompt('Copy this line:', line); }
    setTimeout(() => { copy.textContent = 'Copy code'; }, 1200);
  };
  return view;
});
$('#grid').append(...cards.map((v) => v.card));

let last = 0;
function paint(v, t) {
  const d = v.it.dpx ?? 1;
  v.g.setTransform(d, 0, 0, d, 0, 0); v.g.imageSmoothingEnabled = false;
  v.g.clearRect(0, 0, v.it.w, v.it.h);
  v.g.fillStyle = '#d8d2c4'; v.g.fillRect(0, v.it.h - 2, v.it.w, 2);
  v.it.draw(v.g, v.it.seed, t, $('#animate').checked);
}

function update() {
  toHash();
  renderFilters();
  let n = 0;
  for (const v of cards) { const show = matches(v.it); v.card.hidden = !show; if (show) n++; }
  $('#count').textContent = `${n} of ${items.length}`;
  $('#empty').hidden = n > 0;
  if ($('#q').value !== state.q) $('#q').value = state.q;
}
$('#q').addEventListener('input', (e) => { state.q = e.target.value; update(); });
addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#q').focus(); } });
addEventListener('hashchange', () => { fromHash(); update(); });
$('#shuffleAll').onclick = () => cards.filter((v) => !v.card.hidden).forEach((v) => v.setSeed(1 + Math.floor(Math.random() * 9999)));
$('#resetAll').onclick = () => cards.filter((v) => !v.card.hidden).forEach((v) => v.setSeed(0));
$('#animate').onchange = () => cards.forEach((v) => paint(v, last));

fromHash(); update();
cards.forEach((v) => paint(v, 0));
// the signs need DotGothic16: draw them again once it has loaded
document.fonts.load(`16px ${SIGN_FONT}`).then(() => cards.forEach((v) => paint(v, last))).catch(() => {});
// people and cats move; buildings are drawn again only when their seed changes
function frame(now) {
  last = now / 1000;
  if ($('#animate').checked) for (const v of cards) if (!v.card.hidden && (v.it.group === 'People' || v.it.group === 'Animals' || v.it.group === 'Monsters' || v.it.animated)) paint(v, last);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
