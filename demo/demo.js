import { COLORS, drawCharacter, drawStage, randomCharacter, seeded } from '../src/tinyCharacters.js';

// The park: tiny people stroll between spots on the path; you (the gold line)
// walk with the keys or go where you tap; tapping someone makes them talk.
const park = document.querySelector('#park'), pg = park.getContext('2d');
const W = park.width, H = park.height;
let people = [], you, paused = false, seed = 7;
const keys = new Set();

function newCrowd() {
  const rng = seeded(seed++);
  people = Array.from({ length: 8 }, (_, i) => ({ ...randomCharacter(rng), x: 20 + i * 22, y: 92 + Math.round(rng() * 10), to: null, wait: rng() * 3, talk: 0 }));
  you = { ...randomCharacter(rng), body: '#f2f2ee', x: 100, y: 100, you: true, talk: 0 };
  people.push(you);
}
newCrowd();

addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow')) e.preventDefault(); keys.add(e.key.toLowerCase()); });
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
park.addEventListener('pointerdown', (e) => {
  const r = park.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  // tapped someone (their 5 x 15 body, a little roomier): they talk; else you walk there
  const hit = people.filter((p) => p !== you && Math.abs(p.x - x) < 5 && y > p.y - 17 && y < p.y + 3).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
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
    let dx = (keys.has('arrowright') || keys.has('d')) - (keys.has('arrowleft') || keys.has('a'));
    let dy = (keys.has('arrowdown') || keys.has('s')) - (keys.has('arrowup') || keys.has('w'));
    if (dx || dy) you.to = null;
    else if (you.to) { const ex = you.to.x - you.x, ey = you.to.y - you.y, d = Math.hypot(ex, ey); if (d < 1) you.to = null; else { dx = ex / d; dy = ey / d; } }
    you.walking = !!(dx || dy);
    if (dx) you.facing = dx < 0 ? 'left' : 'right';
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
        else { p.x += ex / d * 14 * dt; p.y += ey / d * 10 * dt; p.walking = true; p.facing = ex < 0 ? 'left' : 'right'; }
      } else p.walking = false;
    }
  }
  pg.imageSmoothingEnabled = false;
  drawStage(pg, W, H);
  for (const p of [...people].sort((a, b) => a.y - b.y)) drawCharacter(pg, p, t); // farther back first
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

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
