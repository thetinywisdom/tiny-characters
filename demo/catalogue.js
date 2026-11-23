import { BUILDINGS, PARTS, SHOP_TYPES, SIGN_FONT, drawBuilding, drawPart } from '../src/tinyBuildings.js';
import { LOOKS, drawCharacter, lookFor } from '../src/tinyCharacters.js';
import { CAT_COATS, DOG_BREEDS, dogFor, drawCat, drawDog } from '../src/tinyAnimals.js';
import { BUSHES, TERRAINS, TREES, drawBush, drawTerrain, drawTree } from '../src/tinyNature.js';

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
const SHAPE_BY_SEED = ['mosque', 'mixedUse'];      // the seed changes more than colours

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
  if (SHAPE_BY_SEED.includes(type)) tags.push('Changes shape');
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

// --- filters ---------------------------------------------------------------------
const GROUPS = ['All', 'People', 'Animals', 'Buildings', 'Doors & windows', 'Nature'];
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
  const ORDER = ['Adults', 'Kids', 'Elderly', 'Uniforms', 'Random', 'Cats', 'Dogs', 'Trees', 'Bushes', 'Terrain', 'Doors', 'Windows', 'Wood', 'Glass', 'Japanese', 'European', 'Mosque', 'Homes', 'Shops & food', 'Civic', 'Worship', 'Low', 'Tall', 'Changes shape'];
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
  if ($('#animate').checked) for (const v of cards) if (!v.card.hidden && (v.it.group === 'People' || v.it.group === 'Animals' || v.it.animated)) paint(v, last);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
