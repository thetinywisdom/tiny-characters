import { COLORS, LOOKS, SKIN_COLORS, drawCharacter, randomCharacter, seeded } from '../src/tinyCharacters.js';
import { drawCat } from '../src/tinyAnimals.js';

// Looks: the starter looks, then every part on a plain person, and a cat.
const looks = document.querySelector('#looks'), lg = looks.getContext('2d');
const plain = { body: '#3f7fd6', legs: COLORS.navy, hair: COLORS.ink };
const parts = [
  [{}, { hairStyle: 'bald' }, { hairStyle: 'long', body: '#d46a8e' }, { hairStyle: 'ponytail', body: '#d46a8e' },
   { hairStyle: 'ponytail', body: '#d46a8e', facing: 'right', walking: true }, { hairStyle: 'afro' }, { hairStyle: 'bun' },
   { hairStyle: 'mohawk' }, { fringe: 'left' }, { moustache: true }, { hat: 'cap' }, { hat: 'cap', facing: 'right' }, { hat: 'wide' },
   { size: 'tall' }, { size: 'short' }, { kid: true, body: '#f2c230' }],
  [{ top: 'jacket', body: '#5f8f5a' }, { top: 'suit', body: COLORS.navy }, { top: 'apron', body: '#5f8f5a' }, { top: 'yukata', body: '#3f4f6e' },
   { top: 'sailor', body: '#f2f2ee', legwear: 'skirt' }, { top: 'gakuran', body: COLORS.ink, legs: COLORS.ink }, { top: 'police', body: '#bcd2e0' },
   { legwear: 'shorts' }, { legwear: 'skirt', body: '#d46a8e' }, { carry: 'backpack', facing: 'right' }, { carry: 'bag' }, { carry: 'briefcase' },
   { carry: 'stick', hair: '#b3b0a8' }, { carry: 'boxes' }, { carry: 'umbrella' }, 'cat'],
];
function looksFrame(now) {
  const t = now / 1000;
  lg.imageSmoothingEnabled = false;
  lg.fillStyle = COLORS.paper; lg.fillRect(0, 0, looks.width, looks.height);
  Object.values(LOOKS).forEach((look, i) => drawCharacter(lg, { skin: SKIN_COLORS[i % SKIN_COLORS.length], ...look, x: 9 + i * 15, y: 28 }, t));
  parts[0].forEach((part, i) => drawCharacter(lg, { ...plain, skin: SKIN_COLORS[i % 4], ...part, x: 7 + i * 12, y: 58 }, t));
  // four views of a few looks: front, right, back, left
  [LOOKS.woman, LOOKS.girl, LOOKS.salaryman, { ...plain, hairStyle: 'ponytail', carry: 'backpack', carryColor: '#3f7fd6', body: '#e8402f' }].forEach((look, j) =>
    ['down', 'right', 'up', 'left'].forEach((facing, k) => drawCharacter(lg, { skin: SKIN_COLORS[j + 1], ...look, facing, walking: true, x: 10 + j * 50 + k * 11, y: 118 }, t)));
  parts[1].forEach((part, i) => {
    const at = { x: 8 + i * 12 + (i === 14 ? 2 : i === 15 ? 6 : 0), y: 88 };
    if (part === 'cat') drawCat(lg, { ...at, coat: 'ginger', walking: true, facing: 'right' }, t);
    else drawCharacter(lg, { ...plain, skin: SKIN_COLORS[i % 4], ...part, ...at }, t);
  });
  requestAnimationFrame(looksFrame);
}
requestAnimationFrame(looksFrame);

// The gallery: rows of random looks, a few talking and walking.
const gal = document.querySelector('#gallery'), gg = gal.getContext('2d');
let galSeed = 1, galPeople = [];
function shuffle() {
  const rng = seeded(galSeed++);
  galPeople = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 16; i++) galPeople.push({ ...randomCharacter(rng), x: 8 + i * 12, y: 22 + row * 23, talking: (i + row) % 5 === 0, walking: (i + row) % 4 === 1 });
}
shuffle();
document.querySelector('#shuffle').onclick = shuffle;
function galFrame(now) {
  gg.imageSmoothingEnabled = false;
  gg.fillStyle = COLORS.paper; gg.fillRect(0, 0, gal.width, gal.height);
  for (const p of galPeople) drawCharacter(gg, p, now / 1000);
  requestAnimationFrame(galFrame);
}
requestAnimationFrame(galFrame);
