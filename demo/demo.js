import { CAT_COLORS, COLORS, LOOKS, SKIN_COLORS, drawCat, drawCharacter, drawStage, facingFor, randomCharacter, seeded } from '../src/tinyCharacters.js';

// The park: tiny people stroll between spots on the path; you (the gold line)
// walk with the keys or go where you tap; tapping someone makes them talk.
// Two cats wander about too.
const park = document.querySelector('#park'), pg = park.getContext('2d');
const W = park.width, H = park.height;
let people = [], you, paused = false, seed = 7;
const keys = new Set();

function newCrowd() {
  const rng = seeded(seed++);
  people = Array.from({ length: 8 }, (_, i) => ({ ...randomCharacter(rng), x: 20 + i * 22, y: 92 + Math.round(rng() * 10), to: null, wait: rng() * 3, talk: 0 }));
  you = { ...randomCharacter(rng), body: '#f2f2ee', x: 100, y: 100, you: true, talk: 0 };
  people.push(you);
  for (let i = 0; i < 2; i++) people.push({ cat: true, color: CAT_COLORS[Math.floor(rng() * CAT_COLORS.length)], x: 40 + i * 110, y: 106, to: null, wait: rng() * 4, talk: 0 });
}
newCrowd();

// the keys move you here only after the park was tapped (else they move you in the town)
const active = () => document.body.dataset.active === 'park';
addEventListener('keydown', (e) => keys.add(e.key.toLowerCase()));
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
park.addEventListener('pointerdown', (e) => {
  document.body.dataset.active = 'park';
  const r = park.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  // tapped someone (their 5 x 15 body, a little roomier): they talk; else you walk there
  const hit = people.filter((p) => p !== you && !p.cat && Math.abs(p.x - x) < 5 && y > p.y - 17 && y < p.y + 3).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (hit) hit.talk = 2; else you.to = { x: Math.max(4, Math.min(W - 4, x)), y: Math.max(80, Math.min(H - 6, y)) };
});
document.querySelector('#crowd').onclick = newCrowd;
document.querySelector('#pause').onclick = (e) => { paused = !paused; e.target.textContent = paused ? 'Play' : 'Pause'; };

let last = performance.now(), t = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!paused) {
    t += dt;
    // you: keys first, else walking to a tapped spot
    let dx = active() ? (keys.has('arrowright') || keys.has('d')) - (keys.has('arrowleft') || keys.has('a')) : 0;
    let dy = active() ? (keys.has('arrowdown') || keys.has('s')) - (keys.has('arrowup') || keys.has('w')) : 0;
    if (dx || dy) you.to = null;
    else if (you.to) { const ex = you.to.x - you.x, ey = you.to.y - you.y, d = Math.hypot(ex, ey); if (d < 1) you.to = null; else { dx = ex / d; dy = ey / d; } }
    you.walking = !!(dx || dy);
    if (dx || dy) you.facing = facingFor(dx, dy, you.facing);
    you.x = Math.max(4, Math.min(W - 4, you.x + dx * 24 * dt));
    you.y = Math.max(80, Math.min(H - 6, you.y + dy * 18 * dt));
    // everyone else strolls between spots
    for (const p of people) {
      p.talk = Math.max(0, p.talk - dt);
      p.talking = p.talk > 0;
      if (p === you) continue;
      if (!p.to && (p.wait -= dt) < 0) p.to = { x: 6 + Math.random() * (W - 12), y: 86 + Math.random() * 30 };
      if (p.to && !p.talking) {
        const ex = p.to.x - p.x, ey = p.to.y - p.y, d = Math.hypot(ex, ey);
        if (d < 1) { p.to = null; p.wait = 1 + Math.random() * 4; p.walking = false; }
        else { const v = p.cat ? 1.3 : 1; p.x += ex / d * 14 * v * dt; p.y += ey / d * 10 * v * dt; p.walking = true; p.facing = p.cat ? (ex < 0 ? 'left' : 'right') : facingFor(ex, ey, p.facing); }
      } else p.walking = false;
    }
  }
  pg.imageSmoothingEnabled = false;
  drawStage(pg, W, H);
  for (const p of [...people].sort((a, b) => a.y - b.y)) (p.cat ? drawCat : drawCharacter)(pg, p, t); // farther back first
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

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
    if (part === 'cat') drawCat(lg, { ...at, color: CAT_COLORS[0], walking: true }, t);
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
