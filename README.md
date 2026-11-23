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

## Use it

```js
import { LOOKS, drawCat, drawCharacter, drawStage, randomCharacter } from './src/tinyCharacters.js';

const canvas = document.querySelector('canvas');   // e.g. width 200, height 124
canvas.style.imageRendering = 'pixelated';         // scale up with hard pixels
const g = canvas.getContext('2d');

const person = { ...randomCharacter(), x: 100, y: 100, talking: true };
const worker = { ...LOOKS.salaryman, x: 80, y: 104, walking: true, facing: 'right' };
const cat = { x: 120, y: 106, color: '#dcb08c' };
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
(colours are CSS strings; `facing`: `'left'`, `'right'` or nothing), plus
looks, all optional:

| Key | Values |
| --- | --- |
| `kid` | `true`: a child, 11 px tall instead of 15 |
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
| `drawCat(g, cat, t)` | A cat seen from the side: `{ x, y, color, facing, walking }`. |
| `LOOKS` | Starter looks to spread into a person. |
| `drawStage(g, W, H)` | The lab's grass with a path across it. |
| `randomCharacter(rng)` | A random look: colours from `BODY_COLORS`, `HAIR_COLORS`, `SKIN_COLORS`, `LEG_COLORS`; sometimes a kid, another hairstyle, a hat, a jacket, a skirt, something to carry. |
| `seeded(seed)` | A seeded random number generator, for crowds that come out the same every time. |
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
Scandinavian house, stone chapel.

```js
import { BUILDINGS, drawBuilding, drawStreet } from './src/tinyBuildings.js';

drawStreet(g, 200, 150, { baseY: 104 });                    // sidewalk, road, far sidewalk
drawBuilding(g, { type: 'koban', x: 60, y: 104 });           // centred on x, ground line at y
drawBuilding(g, { type: 'shop', shopType: 'ramen', x: 120, y: 104, seed: 3 });
// then the people in front of them (feet below the ground line)
```

| Export | What it does |
| --- | --- |
| `drawBuilding(g, b)` | One building `{ type, x, y, seed, shopType, wall, roof }`: centred on `x`, ground line at `y`. `seed` picks the wall and roof colours and which windows are lit. |
| `BUILDINGS` | `type -> { label, w, h }`: name, width and height in pixels (roof included). |
| `SHOP_TYPES` | `konbini`, `ramen`, `cafe`, `bookshop`, `bakery`, `izakaya` (for `shop` and `mixedUse`). |
| `drawStreet(g, W, H, { baseY, x0 })` | Sidewalk from `baseY`, road, far sidewalk, grass; `x0` scrolls the paving. |
| `WALL_COLORS`, `ROOF_COLORS` | The catalogue's wall and roof colours. |

Sizes: a storey is 13–20 px and a door 6 × 13, so a 15 px person reaches
about three quarters of a door. Roofs are seen from above (8–18 rows, like a
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
| `drawTownView(g, town, view, sprites, t)` | The part of the town in `view`: ground, then buildings, people and cats (`cat: true`) further back first. |
| `DEFAULT_TOWN` | The demo's layout: `streets`, `crossStreets`, `rows` of buildings, single `buildings`, `areas` with their own ground. |
| `buildingSolids(b)` (tinyBuildings.js) | The ground a building takes; you can step between a torii's posts and under a gas station's canopy. |

Speech for these people (floating pixel text, the design picked in the
bubble lab) lives in **tiny-ui-kit** (`src/ui/pixelOverlay.js`).
