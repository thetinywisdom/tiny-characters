import { BUILDINGS, SHOP_TYPES, drawBuilding } from '../src/tinyBuildings.js';
import { CAT_COLORS, LOOKS, drawCat, drawCharacter, lookFor, seeded } from '../src/tinyCharacters.js';

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
const catColor = (seed) => (seed ? CAT_COLORS[Math.floor(seeded(seed * 7919 + 13)() * CAT_COLORS.length)] : CAT_COLORS[0]);
items.push({ id: 'animal.cat', label: 'Cat', group: 'Animals', tags: ['Cats'], seed: 0, w: 24, h: 14, px: 5,
  draw: (g, seed, t, anim) => drawCat(g, { x: 12, y: 11, color: catColor(seed), walking: anim }, t),
  code: (seed) => `drawCat(g, { x, y, color: '${catColor(seed)}' }, t)` });
for (const [type, { label, w, h }] of Object.entries(BUILDINGS)) {
  const kinds = Object.keys(KIND).filter((k) => KIND[k].includes(type));
  const tags = [EUROPEAN.includes(type) ? 'European' : type === 'mosque' ? 'Mosque' : 'Japanese', ...kinds, h > 60 ? 'Tall' : 'Low'];
  if (SHAPE_BY_SEED.includes(type)) tags.push('Changes shape');
  const shopTypes = type === 'shop' ? SHOP_TYPES : [undefined];
  for (const shopType of shopTypes) {
    items.push({ id: `building.${type}${shopType ? ':' + shopType : ''}`, label: shopType ? `Shop: ${shopType}` : label, group: 'Buildings', tags, seed: 1,
      w: w + 8, h: h + 4, px: 0, wide: w > 60,
      draw: (g, seed) => drawBuilding(g, { type, shopType, x: 4 + w / 2, y: h + 2, seed }),
      code: (seed) => `drawBuilding(g, { type: '${type}', ${shopType ? `shopType: '${shopType}', ` : ''}x, y, seed: ${seed} })` });
  }
}

// --- filters ---------------------------------------------------------------------
const GROUPS = ['All', 'People', 'Animals', 'Buildings'];
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
  const ORDER = ['Adults', 'Kids', 'Elderly', 'Uniforms', 'Random', 'Cats', 'Japanese', 'European', 'Mosque', 'Homes', 'Shops & food', 'Civic', 'Worship', 'Low', 'Tall', 'Changes shape'];
  const tags = [...new Set(items.filter(inGroup).flatMap((it) => it.tags))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  // each kind's count: how many you would see with it on
  $('#tags').replaceChildren(...tags.map((t) => chip(t, state.t.has(t), () => { state.t.has(t) ? state.t.delete(t) : state.t.add(t); update(); },
    items.filter((it) => inGroup(it) && withTags(it, [...state.t, t]) && searched(it)).length)));
}

// --- cards -----------------------------------------------------------------------
const cards = items.map((it) => {
  const card = document.createElement('article'); card.className = 'card'; if (it.wide) card.style.gridColumn = 'span 2';
  const stage = document.createElement('div'); stage.className = 'stage';
  const c = document.createElement('canvas'); c.width = it.w; c.height = it.h;
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
  seedRow.append('Seed', input, roll, copy);
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
  v.g.imageSmoothingEnabled = false;
  v.g.clearRect(0, 0, v.c.width, v.c.height);
  v.g.fillStyle = '#d8d2c4'; v.g.fillRect(0, v.c.height - 2, v.c.width, 2);
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
// people and cats move; buildings are drawn again only when their seed changes
function frame(now) {
  last = now / 1000;
  if ($('#animate').checked) for (const v of cards) if (!v.card.hidden && v.it.group !== 'Buildings') paint(v, last);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
