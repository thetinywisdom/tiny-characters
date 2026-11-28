// Sprite export: every drawing of the library as plain PNG frames, for engines
// that load images (the Swift / SpriteKit game). Run by tools/export-sprites.mjs;
// window.exportSprites() returns { groups: { name: { scale, frames: [{ name, png, w, h, ax, ay }] } }, anims }.
// One PNG pixel = one person pixel (buildings: `scale` 4, so the signs' letters stay crisp).
// ax, ay: where the feet (the drawing's x, y) are in the frame, from its top left.
import { LOOKS, lookFor, drawCharacter } from '../src/tinyCharacters.js';
import { CAT_COATS, DOG_BREEDS, dogFor, drawCat, drawDog } from '../src/tinyAnimals.js';
import { MONSTERS, drawMonster } from '../src/tinyMonsters.js';
import { BUILDINGS, SHOP_TYPES, drawBuilding } from '../src/tinyBuildings.js';
import { PROPS, drawProp, propScale } from '../src/tinyStreet.js';
import { TREES, BUSHES, drawTree, drawBush, plantScale } from '../src/tinyNature.js';

const VIEWS = ['down', 'up', 'left', 'right'];
const STEPS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];   // a walk cycle sampled; repeats are dropped

// Draw into a big scratch canvas (the feet at its centre), k device px per pixel.
function render(draw, size, k = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size * k;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(k, k);
  draw(g, size / 2, size * 0.75);
  return c;
}
const hashOf = (c) => c.toDataURL();
// The box of non-clear pixels over several canvases.
function bounds(cs) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (const c of cs) {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
function crop(c, b) {
  const o = document.createElement('canvas'); o.width = b.w; o.height = b.h;
  o.getContext('2d').drawImage(c, b.x0, b.y0, b.w, b.h, 0, 0, b.w, b.h);
  return o.toDataURL('image/png');
}
// A set of frames cropped to one shared box, so an animation does not jump.
function frameSet(list, size, k = 1) {
  const cs = list.map((f) => render(f.draw, size, k)), b = bounds(cs);
  if (!b) return [];
  return list.map((f, i) => ({ name: f.name, png: crop(cs[i], b), w: b.w, h: b.h, ax: size / 2 * k - b.x0, ay: size * 0.75 * k - b.y0 }));
}
// Standing + the walk cycle in each view, for anything drawn as fn(g, { x, y, facing, walking }, t).
// The cycle is sampled 8 times a second over a second; each different picture is one frame
// (walk0, walk1 ...), and anims[`${name}_${facing}`] is the order to play them in, 0.125 s each.
const anims = {};
function walker(name, fn, extra, size = 64) {
  const list = [];
  for (const facing of VIEWS) {
    list.push({ name: `${name}_${facing}_stand`, draw: (g, x, y) => fn(g, { ...extra, x, y, facing, walking: false }, 0) });
    const seen = new Map(), seq = [];
    for (const t of STEPS) {
      const c = render((g, x, y) => fn(g, { ...extra, x, y, facing, walking: true }, t), size), h = hashOf(c);
      if (!seen.has(h)) {
        const frame = `${name}_${facing}_walk${seen.size}`; seen.set(h, frame);
        list.push({ name: frame, draw: (g, x, y) => fn(g, { ...extra, x, y, facing, walking: true }, t) });
      }
      seq.push(seen.get(h));
    }
    anims[`${name}_${facing}`] = seq;
  }
  return frameSet(list, size);
}

window.exportSprites = async () => {
  await document.fonts.load('16px "DotGothic16"');
  const groups = { People: { scale: 1, frames: [] }, Animals: { scale: 1, frames: [] }, Monsters: { scale: 1, frames: [] },
    Buildings: { scale: 4, frames: [] }, Props: { scale: 1, frames: [] }, Plants: { scale: 1, frames: [] } };
  for (const look of Object.keys(LOOKS)) groups.People.frames.push(...walker(look, drawCharacter, lookFor(look, 0)));
  for (let s = 1; s <= 12; s++) groups.People.frames.push(...walker(`random${s}`, drawCharacter, lookFor('random', s)));
  for (let s = 1; s <= 4; s++) groups.People.frames.push(...walker(`kid${s}`, drawCharacter, lookFor('kid', s)));
  for (const coat of Object.keys(CAT_COATS)) groups.Animals.frames.push(...walker(`cat_${coat}`, drawCat, { coat, sit: false }));
  for (const breed of Object.keys(DOG_BREEDS)) groups.Animals.frames.push(...walker(`dog_${breed}`, drawDog, { ...dogFor(breed, 0), collar: '#d8443c', sit: false }));
  for (const [type, { variants }] of Object.entries(MONSTERS)) variants.forEach((variant) =>
    groups.Monsters.frames.push(...walker(`${type}_${variant.replace(/ /g, '-')}`, drawMonster, { type, variant }, 80)));
  for (const [type, { w, h, scale }] of Object.entries(BUILDINGS)) for (const shopType of type === 'shop' ? SHOP_TYPES : [undefined]) for (let seed = 1; seed <= 3; seed++) {
    const size = Math.ceil(Math.max(w, h * 1.4) / 2) * 2 + 8;
    groups.Buildings.frames.push(...frameSet([{ name: `${type}${shopType ? '_' + shopType : ''}_${seed}`,
      draw: (g, x, y) => drawBuilding(g, { type, shopType, x, y, seed, scale, dpx: 4 }) }], size, 4));
  }
  for (const type of Object.keys(PROPS)) { const scale = propScale(type); if (scale !== 1.5) continue;
    groups.Props.frames.push(...frameSet([{ name: type, draw: (g, x, y) => drawProp(g, { type, x, y, seed: 1, scale }) }], 96)); }
  for (const [defs, fn, kind] of [[TREES, drawTree, 'tree'], [BUSHES, drawBush, 'bush']]) for (const type of Object.keys(defs)) {
    const scale = plantScale(type); if (scale !== 1.5) continue;
    for (let seed = 1; seed <= 2; seed++) groups.Plants.frames.push(...frameSet([{ name: `${kind}_${type}_${seed}`, draw: (g, x, y) => fn(g, { type, x, y, seed, scale }) }], 128));
  }
  return { groups, anims };
};
window.spritesReady = true;
