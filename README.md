# Tiny Characters

The little pixel people from **Tiny City Builder**'s bubble lab, and the
town's buildings to go with them. A person is about
5 × 15 pixels each, drawn with a handful of rectangles on a low-resolution
canvas and scaled up with hard pixels. Plain JavaScript, no dependencies.

**Try it:** https://thetinywisdom.github.io/tiny-characters/ (GitHub Pages,
served from `main`). Or open `index.html` through any static server for the demo:
a town to walk around (a 2D map of streets, blocks and grounds; the view
follows you; tap a building to walk to its door), a
park where they stroll about with a couple of cats (move the one with the
gold line with the arrow keys / WASD or by tapping; tap anyone to make them
talk; the keys move you in the town, or in the park once you tap it), every
look they can have, every building, and a gallery of random looks.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## The catalogue

`catalogue.html` (linked from the demo) shows every person, animal and
building on its own card. Filter by group (people, animals, buildings), by
kind (adults, kids, elderly, uniforms, Japanese, European, homes, shops &
food, civic, worship, tall, low, changes shape ...) and by name (press `/`).
Each card has a seed: type one, or roll 🎲 for a new look (🎲 Shuffle all
rolls every card you see; seed 0 is each look as designed). **Copy code**
gives the line that draws exactly that card, for example
`drawBuilding(g, { type: 'mosque', x, y, seed: 8 })` or
`drawCharacter(g, { ...lookFor('salaryman', 7), x, y }, t)`. The filters stay
in the address, so a link opens the same list.

## Use it

```js
import { LOOKS, drawCharacter, drawStage, randomCharacter } from './src/tinyCharacters.js';
import { drawCat } from './src/tinyAnimals.js';

const canvas = document.querySelector('canvas');   // e.g. width 200, height 124
canvas.style.imageRendering = 'pixelated';         // scale up with hard pixels
const g = canvas.getContext('2d');

const person = { ...randomCharacter(), x: 100, y: 100, talking: true };
const worker = { ...LOOKS.salaryman, x: 80, y: 104, walking: true, facing: 'right' };
const cat = { x: 120, y: 106, coat: 'tuxedo', facing: 'down' };
function frame(now) {
  drawStage(g, canvas.width, canvas.height);
  drawCharacter(g, person, now / 1000);             // feet at (x, y)
  drawCharacter(g, worker, now / 1000);
  drawCat(g, cat, now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

A person: `{ x, y, body, hair, skin, legs, you, talking, walking, facing }`
(colours are CSS strings; `facing`: `'down'` (the front, also nothing), `'up'`
(the back), `'left'` or `'right'`; `facingFor(dx, dy)` picks it from the way
someone walks). Everyone
has hands at their sides (swinging when they walk), shoes, a shaded right
side, and a collar and hem on a plain top; they have no faces. Looks, all
optional:

| Key | Values |
| --- | --- |
| `kid` | `true`: a child, 11 px tall instead of 15 |
| `size` | `tall` (17 px) or `short` (14 px); nothing for the usual 15 |
| `fringe` | `left` or `right`: a hair pixel falling on the face |
| `shoes` | the shoe colour (the bottom row of the legs; dark brown, red for kids) |
| `hairStyle` | `short` (default), `bald`, `long`, `ponytail`, `afro`, `bun`, `mohawk` |
| `moustache` | `true`: one pixel, in the hair colour |
| `hat`, `hatColor` | `cap` (brim forward when facing), `wide` (straw hat, fedora) |
| `top`, `trim` | `jacket` (trim: the shirt), `suit` (trim: the tie), `apron`, `yukata` (trim: the obi), `sailor` (trim: the ribbon), `gakuran`, `police` (trim: the vest) |
| `legwear` | `trousers` (default), `shorts`, `skirt` (in the `legs` colour) |
| `carry`, `carryColor` | `backpack` (seen from the side), `bag`, `briefcase`, `umbrella`, `stick`, `boxes` |

The looks come from tiny-catalogue's people, kept to what still shows at this
size. `LOOKS` has starter looks like the catalogue's: `man`, `woman`, `boy`,
`girl`, `grandpa`, `grandma`, `schoolboy`, `schoolgirl`, `salaryman`,
`police`, `delivery`, `summer`, `rainy`.

| Export | What it does |
| --- | --- |
| `drawCharacter(g, person, t)` | Draws one person. `talking`: bobs a pixel six times a second; `walking`: the legs take turns lifting a pixel; `you`: a gold line under the feet; `facing`: a pixel of hair at the back of the head. |
| `LOOKS` | Starter looks to spread into a person. |
| `drawStage(g, W, H)` | The lab's grass with a path across it. |
| `randomCharacter(rng)` | A random look: colours from `BODY_COLORS`, `HAIR_COLORS`, `SKIN_COLORS`, `LEG_COLORS`; sometimes a kid, another hairstyle, a hat, a jacket, a skirt, something to carry. |
| `seeded(seed)` | A seeded random number generator, for crowds that come out the same every time. |
| `lookFor(name, seed)` | A starter look (`'salaryman'` ...), `'random'` or `'kid'` with a seed: always the same person. Seed 0 is the look as designed; other seeds keep the clothes and change skin and hair colour. |
| `headOf(person)` | The point just over the head, hat or umbrella (for speech). |
| `snapToPalette(g, W, H, palette)` | Snaps every pixel to the palette (after drawing anything smooth, like text). |
| `COLORS` | The lab's colours (ink, paper, gold, grass, path, shadow ...). |

## Buildings

`src/tinyBuildings.js` has tiny-catalogue's 31 buildings as small pixel
facades in the same style: house, apartment block, shop with flats above,
shop (konbini, ramen, cafe, bookshop, bakery, izakaya), office building,
shrine (also as a separate torii and shrine hall), school, coin laundromat, café (kissaten), pharmacy, sushi
restaurant, flower shop, fishmonger, udon / soba shop, family restaurant,
takoyaki stand, koban, post office, bank, clinic, fire station, karaoke,
wooden apartment, parking garage, gas station, and the old town: Tudor
cottage, Mediterranean villa, Dutch canal house, French country house,
Scandinavian house, stone chapel; and a mosque (not in the catalogue), whose
`seed` picks its wall, dome colour and size, one or two minarets, side
domes, windows and trim, so every seed is a different mosque.

```js
import { BUILDINGS, drawBuilding, drawStreet } from './src/tinyBuildings.js';

drawStreet(g, 200, 150, { baseY: 104 });                    // sidewalk, road, far sidewalk
drawBuilding(g, { type: 'koban', x: 60, y: 104 });           // centred on x, ground line at y
drawBuilding(g, { type: 'shop', shopType: 'ramen', x: 120, y: 104, seed: 3 });
// then the people in front of them (feet below the ground line)
```

| Export | What it does |
| --- | --- |
| `drawBuilding(g, b)` | One building `{ type, x, y, seed, shopType, wall, roof, scale, dpx }`: centred on `x`, ground line at `y`. `seed` picks the wall and roof colours and which windows are lit; `scale` draws it bigger with crisp pixels (the town uses 1.5); `dpx` lets its signs write their names (see below). |
| `SIGN_FONT` | The signs' typeface: DotGothic16 (load it on the page from Google Fonts). |
| `buildingSize(b)` | Its width and height at its scale. |
| `drawPart(g, { part, x, y, seed, scale })` | One door or window from the kit the buildings are made of, centred on `x`, its bottom at `y`. |
| `PARTS` | `id -> { label, w, h }`: `door.wood`, `door.plank`, `door.glazed`, `door.glass`, `door.steel`, `door.arched`, `door.auto`, `door.sliding`, `door.shoji`, `door.garage`, `window.sash`, `window.pair`, `window.alu`, `window.aluPair`, `window.tall`, `window.shuttered`, `window.arched`, `window.pointed`, `window.stained`, `window.round`, `window.lattice`, `window.shoji`, `window.leaded`, `window.neon`, `window.shop`. |
| `STOREY` | The sizes every building shares: ground floor 16, a shop's 19, upper floors 13, window sills 4 above the floor. |
| `BUILDINGS` | `type -> { label, w, h }`: name, width and height in pixels (roof included). |
| `SHOP_TYPES` | `konbini`, `ramen`, `cafe`, `bookshop`, `bakery`, `izakaya` (for `shop` and `mixedUse`). |
| `drawStreet(g, W, H, { baseY, x0 })` | Sidewalk from `baseY`, road, far sidewalk, grass; `x0` scrolls the paving. |
| `WALL_COLORS`, `ROOF_COLORS` | The catalogue's wall and roof colours. |

Sizes, the same on every building: a ground floor is 16 px (a shop's 19, its
awning and sign above the door), an upper floor 13; a door 6 × 12 (double and
sliding doors 10 × 12, a garage 18 × 14); a window 5 × 6 (a pair 9 × 6, a tall
window 5 × 8) with its sill 4 px above its floor; shop glass is as tall as a
door. Doors and windows show what they are: panelled wood, planks with iron
straps, a café door with glass, glass in aluminium, a flat's steel door,
automatic doors, Japanese lattice sliding doors, shoji; sash, aluminium,
tall, shuttered, arched, pointed, stained, round, lattice, leaded, neon
windows and shop glass. The catalogue has them all under Doors & windows.
**Signs say what the place is** (LAUNDROMAT, PHARMACY, KONBINI, RAMEN, CAFE,
BOOKS, BAKERY, IZAKAYA, FLOWERS, FISH, CLINIC, BANK, KOBAN, POST OFFICE,
TAKOYAKI, SUSHI, UDON, DINER, and KARAOKE down its upright sign), in the pixel
font DotGothic16. A sign is only a few pixels tall, so the canvas has to be
drawn bigger underneath for the letters to fit: make the canvas `dpx` times
bigger than its picture, scale the context (`g.setTransform(dpx, 0, 0, dpx,
0, 0)`) and pass `dpx` (the demo uses 4 for the town, 6 for single
buildings). Without it, a sign shows a row of letter-like dashes instead.

Everything stays crisp when the town draws it 1.5 times bigger: patterns
repeat on even steps and small pictures (crosses, letters, the clock) are
drawn on whole pixels. Roofs are seen from above (8–18 rows, like a
top-down town map), which gives each building its depth. Tall buildings are
squashed (the office has 6 floors, the apartment block 6). Sign text is a row of pixels: real letters do
not fit.

## A town map

`src/tinyTown.js` puts the buildings on a 2D map of streets, cross streets
and blocks, with the shrine grounds, a schoolyard and an old-town square.
Every building's whole picture is solid ground, so nobody is ever hidden
behind one; tall buildings stand only along the back.

```js
import { makeTown, drawTownView } from './src/tinyTown.js';

const town = makeTown();                                   // the demo's town (DEFAULT_TOWN)
const you = { ...randomCharacter(), x: 196, y: 196, you: true };
you.path = town.findPath(you, town.doorOf(town.buildings[0]));   // points to walk to, round buildings
// each frame: move people (check town.blocked(x, y) for the keys), then
drawTownView(g, town, { x: viewX, y: viewY, w: 200, h: 150 }, [you, ...others], now / 1000);
```

| Export | What it does |
| --- | --- |
| `makeTown(layout)` | A town: `{ W, H, buildings, areas, blocked(x, y), findPath(from, to), randomSpot(rng, within), placeAt(x, y), doorOf(building), ground }`. |
| `drawTownView(g, town, view, sprites, t)` | The part of the town in `view`: ground, then buildings, trees, bushes, people, cats (`cat: true`) and dogs (`dog: true`) further back first. |
| `DEFAULT_TOWN` | The demo's layout: `scale` (1.5: the town is drawn that much bigger, the people stay 15 px), `streets`, `crossStreets`, `rows` of buildings, single `buildings`, `areas` with their own ground (all at scale 1; `makeTown` multiplies them). |
| `buildingSolids(b)` (tinyBuildings.js) | The ground a building takes; you can step between a torii's posts and under a gas station's canopy. |

## Animals

`src/tinyAnimals.js`: cats and dogs with four views like the people
(`facing`: `'down'`, `'up'`, `'left'`, `'right'`), walking steps, and no faces
(a dog has a nose and a collar).

| Export | What it does |
| --- | --- |
| `drawCat(g, { x, y, coat, facing, walking }, t)` | A cat. `coat`: `ginger`, `grey` (tabbies), `black`, `white`, `tuxedo`, `calico`, `siamese`, `brown` (`CAT_COATS`); or `color` for a plain coat. |
| `drawDog(g, { x, y, breed, coat, collar, facing, walking }, t)` | A dog. `breed`: `shiba`, `corgi`, `dachshund`, `poodle`, `pug`, `labrador`, `husky`, `dalmatian` (`DOG_BREEDS`); it wags its tail standing still. |
| `catFor(seed)`, `dogFor(breed, seed)` | A coat (and a breed for `'random'`) from a seed. |

## Monsters

`src/tinyMonsters.js`: seven monsters with four variants each, four views like
the people, walking (or floating, or flying) and, unlike the faceless people,
eyes.

```js
import { drawMonster, MONSTERS } from './src/tinyMonsters.js';
drawMonster(g, { type: 'zombie', variant: 'schoolgirl', x, y, facing: 'left', walking: true }, now / 1000);
```

| `type` | `variant` (or 0-3) |
| --- | --- |
| `zombie` | `office`, `schoolgirl`, `farmer`, `rotten` (arms reaching, a slow shamble) |
| `werewolf` | `grey`, `brown`, `black`, `white` (taller than a person, snout, claws, tail, glowing eyes) |
| `ghostGirl` | `white dress`, `yurei` (white kimono, triangle headband), `red dress`, `pale blue` (floating, long hair over her face) |
| `reaper` | `black`, `purple`, `navy`, `bone` (hooded robe, glowing eyes, a scythe; floating) |
| `spider` | `black widow`, `tarantula`, `huntsman`, `poison` (giant, eight walking legs) |
| `skeleton` | `plain`, `warrior` (helmet, shield, sword), `pirate` (bandana, eyepatch, cutlass), `mage` (robe, staff with a glowing orb) |
| `skull` | `fire`, `blue fire`, `green fire`, `purple fire` (a flying skull in flickering flames) |

The catalogue shows them all under Monsters. In the demo's town they roam
too (zombies on the streets, ghost girls round the shrine, a reaper by the
chapel, skeletons in the schoolyard, werewolves, giant spiders and flaming
skulls everywhere); **Hide monsters** under the town hides them.
`drawTownView` draws any sprite with `monster: type` (and `variant`).

## Combat

`src/tinyCombat.js`: weapons, attacks, each monster's own skills, and what
happens to whoever is on the other end. Everything is drawn from the time
since it began, so a game decides when things happen.

```js
import { drawAction, drawArmed, drawWeapon } from './src/tinyCombat.js';
drawArmed(g, { ...person, weapon: 'sword' }, t);                           // holding a weapon
const running = drawAction(g, { ...person, weapon: 'axe', facing: 'right' }, 'chop', now - startedAt, t);
drawAction(g, { monster: 'spider', variant: 0, x, y, facing: 'left' }, 'webTrap', now - startedAt, t);
drawAction(g, zombie, 'dead', now - diedAt, t);                            // false once it has finished
```

| Kind | Names |
| --- | --- |
| Weapons (`WEAPONS`, `drawWeapon`) | `sword`, `axe`, `spear`, `bow`, `shield` |
| Attacks (`ACTIONS`) | `slash`, `stab` (sword), `axeSwing`, `chop` (axe), `spearSwing`, `spearStab` (spear), `shoot` (bow: the arrow flies), `defend` (shield) |
| Monster skills (`SKILLS`) | `bite` (zombie), `claw` (werewolf), `curse` (ghost girl), `scythe` (reaper), `webShot` and `webTrap` (spider), `boneThrow` (skeleton), `fireball` (flaming skull) |
| Reactions (`REACTIONS`) | `hit` (flashes white, recoils), `shoved` (slides back), `dead` (falls over; a ghost fades away, a skeleton falls into bones, a skull bursts, a spider flips over) |

The actor is anything the library draws: a person, `{ cat: true }`,
`{ dog: true }`, `{ monster: type, variant }`. The catalogue shows them all
under Combat.

## Nature

`src/tinyNature.js`: 15 trees, 10 bushes and 10 terrains, scaled with crisp
pixels like the buildings.

| Export | What it does |
| --- | --- |
| `drawTree(g, { type, x, y, seed, scale })` | `oak`, `maple`, `sakura`, `pine`, `cedar`, `fir`, `birch`, `palm`, `willow`, `ginkgo`, `bamboo`, `apple`, `poplar`, `cypress`, `bare` (`TREES`). The seed picks where fruit, blossom and leaves fall and mirrors the tree. |
| `drawBush(g, { type, x, y, seed, scale })` | `round`, `hedge`, `azalea`, `hydrangea`, `rose`, `lavender`, `fern`, `pampas`, `holly`, `cactus` (`BUSHES`). |
| `drawTerrain(g, { type, x, y, w, h, seed, scale, t })` | Fills a rectangle: `grass`, `meadow`, `tallGrass`, `dirt`, `sand`, `gravel`, `cobble`, `water` (ripples with `t`), `snow`, `paddy` (`TERRAINS`). |

In the town, a forest rings everything nobody can reach (behind the
skyline, the sides with gaps where the streets run out, below the last
street), the back gardens are full of bushes, small trees, meadow and long
grass, trees and bushes stand round the shrine, the school and the square; the grounds are terrains; there is a pond; dogs go
for walks with their owners. The catalogue has them all (Animals, Nature).

Speech for these people (floating pixel text, the design picked in the
bubble lab) lives in **tiny-ui-kit** (`src/ui/pixelOverlay.js`).
