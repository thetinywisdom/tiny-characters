# Tiny Characters

The little pixel people from **Tiny City Builder**'s bubble lab, and the
town's buildings to go with them. A person is about
5 × 15 pixels each, drawn with a handful of rectangles on a low-resolution
canvas and scaled up with hard pixels. Plain JavaScript, no dependencies.

**Try it:** https://thetinywisdom.github.io/tiny-characters/ (GitHub Pages,
served from `main`). Or open `index.html` through any static server for the demo:
a town to walk around (a 2D map of streets, blocks and grounds; the view
follows you; tap a building to walk to its door; move the orange guy, you,
with the gold ring, with the arrow keys / WASD or by tapping; tap anyone to make them talk),
every look they can have, every building, and a gallery of random looks.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Working on it

Everything is drawn at full size: one pixel of a building, a street thing, a
plant or the ground is one person pixel (the old drawings, stretched by 1.5,
are gone). `?redraw=all` in the address also shows drawings still in review.

Agents and contributors: start with `CLAUDE.md` (the owner's rules and how
to check a change), then `PLAN.md` (what is done, decided and next) and
`SKILLS.md` (how everything works). No build step: serve the folder
(`python3 -m http.server`) and open `index.html`.

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
| `drawCharacter(g, person, t)` | Draws one person. `talking`: bobs a pixel six times a second; `walking`: the legs take turns lifting a pixel; `you`: a thin gold ring round the feet (`ring`: a ring of another colour; point at someone in the town and a white one shows under them); `facing`: a pixel of hair at the back of the head. |
| `LOOKS` | Starter looks to spread into a person. |
| `{ orange: true }` | The orange guy (from [orange-guy](https://github.com/thetinywisdom/orange-guy), redrawn at the people's size; you, in the town): `drawCharacter(g, { orange: true, x, y, facing, walking }, t)`. `drawOrangeGuy` draws him straight; `ORANGE_GUY` has his colours and frames (text grids). |
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
takoyaki stand, police station (koban), post office, bank, clinic, fire station, karaoke,
wooden apartment, parking garage, gas station, and the old town: Tudor
cottage, Mediterranean villa, Dutch canal house, French country house,
Scandinavian house, stone chapel; and a mosque (not in the catalogue).

**Each seed is a different building**, not the same one recoloured: the seed
picks its width (two or three per type), its floors, its windows (kind, how
many, how spaced), its door (kind, side, colour), its roof (flat, pitched or
hipped, colour, chimneys, dormers, towers, what is on a flat roof) and
details like balconies, awnings and which side a sign is on. Everything
stays on the same door and window sizes. The mosque's seed picks its wall,
dome, minarets, side domes, windows and trim. The Buildings sheet shows
three seeds of each; the town picks seeds that fit each block.

```js
import { BUILDINGS, drawBuilding } from './src/tinyBuildings.js';

drawBuilding(g, { type: 'koban', x: 60, y: 104 });           // centred on x, ground line at y
drawBuilding(g, { type: 'shop', shopType: 'ramen', x: 120, y: 104, seed: 3 });
// then the people in front of them (feet below the ground line)
```

Every building is **drawn at full size** (the town's size, scale 1.5, with
one building pixel to one person pixel): `BUILDINGS[type].scale` is 1.5 and
its `w`, `h` and `widths` are at that size; draw it with `scale: 1.5`
(`drawBuilding(g, { type: 'sushi', x, y, seed, scale: 1.5 })`) to get it pixel
for pixel; at any other scale it is stretched. `setRedraw('approved' | 'all')`
picks whether drawings still in review are used too (the address's
`?redraw=all` does the same).

| Export | What it does |
| --- | --- |
| `drawBuilding(g, b)` | One building `{ type, x, y, seed, shopType, wall, roof, scale, dpx }`: centred on `x`, ground line at `y`. `seed` picks its width, floors, windows, door, roof and colours (see above); `scale` draws it bigger with crisp pixels (the town uses 1.5); `dpx` lets its signs write their names (see below). |
| `SIGN_FONT` | The signs' typeface: DotGothic16 (load it on the page from Google Fonts). |
| `buildingSize(b)` | Its width and height for its seed, at its scale. |
| `drawPart(g, { part, x, y, seed, scale })` | One door or window from the kit the buildings are made of, centred on `x`, its bottom at `y` (at full size: scale 1.5, the default, is pixel for pixel). |
| `PARTS` | `id -> { label, w, h }`: `door.wood`, `door.plank`, `door.glazed`, `door.glass`, `door.steel`, `door.arched`, `door.auto`, `door.sliding`, `door.shoji`, `door.garage`, `window.sash`, `window.pair`, `window.alu`, `window.aluPair`, `window.tall`, `window.shuttered`, `window.arched`, `window.pointed`, `window.stained`, `window.round`, `window.lattice`, `window.shoji`, `window.leaded`, `window.neon`, `window.shop`. |
| `BUILDINGS` | `type -> { label, w, h, widths, scale }`: name, the largest width and height any seed makes (roof included), and the widths a seed picks from, at `scale` (1.5). |
| `SHOP_TYPES` | `konbini`, `ramen`, `cafe`, `bookshop`, `bakery`, `izakaya` (for `shop` and `mixedUse`). |
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
BOOKS, BAKERY, IZAKAYA, FLOWERS, FISH, CLINIC, BANK, POLICE STATION, POST OFFICE,
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
and blocks, with the shrine grounds, a schoolyard and an old-town square;
and in the south a pond park (koi, ducks, a path round it, cherry trees), a
playground (swings, a slide, a sandbox, a drinking fountain, toilets), a
open blue basketball court (kids passing a ball, floodlights at night), a
railway with level crossings (a train runs along it and stops at each
station; the gates come down, cars and people wait), four stations (a small
one and three big ones: modern glass, classic brick, Japanese wooden) with
their plaza, a kiosk, a taxi rank, and a narrow station alley of red
lanterns, cables, crates and cats.

**The demo's map is a showcase.** Every piece is part of the layout
(`DEFAULT_TOWN`), so a map of your own can put them anywhere: `railway: { y,
h }`, areas with `ground: 'court'` (with `fence: true` and `gates` if you want one),
`shape: 'ellipse'` (a pond), `ring: true` (a path round), `koi: true` (fish
and ducks), `buildings` like `{ type: 'stationBrick', x, y }`, `props`,
`parked` vehicles and extra `wires`. Adding to a map never reshuffles the
rest: each region's random greenery and each placed thing's look come from
where it is.
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
| `makeTown(layout)` | A town: `{ W, H, streets, crossStreets, junctions, roadAt(x, y), crossingAt(x, y), buildings, props, wires, areas, blocked(x, y), findPath(from, to), randomSpot(rng, within), placeAt(x, y), doorOf(building), ground }`. |
| `drawTownView(g, town, view, sprites, t, { dpx, night, season, weather })` | The part of the town in `view`: ground, then buildings, trees, bushes, people, cats (`cat: true`) and dogs (`dog: true`) further back first; in a season, and in the rain (see Seasons and weather). |
| `DEFAULT_TOWN` | The demo's layout: `scale` (1.5: the town is drawn that much bigger, the people stay 15 px), `streets`, `crossStreets`, `rows` of buildings, single `buildings`, `props` (street things), `areas` with their own ground, `railway`, `parked`, `wires` (all at scale 1; `makeTown` multiplies them). |
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
| Weapons (`WEAPONS`, `drawWeapon`) | `sword`, `axe`, `spear`, `bow`, `shield`; household things that fight like them: `bat`, `umbrella` (folded), `golfClub` (like a sword), `pan`, `pickaxe`, `hammer` (like an axe), `broom` (like a spear), `wok` (like a shield) |
| Attacks (`ACTIONS`, `actionsFor(weapon)`) | Any weapon of the right kind does them (`{ ...person, weapon: 'pan' }` with `'chop'`): `slash`, `stab` (sword), `axeSwing` (a 360 spin that hits all round), `chop` (axe), `spearSwing`, `spearStab` (spear), `shoot` (bow: the arrow flies), `defend` (shield) |
| Monster skills (`SKILLS`) | `bite` (zombie), `claw` (werewolf), `curse` (ghost girl), `scythe` (reaper), `webShot` and `webTrap` (spider), `boneThrow` (skeleton), `fireball` (flaming skull) |
| Reactions (`REACTIONS`) | `hit` (flashes white, recoils), `shoved` (slides back), `dead` (falls over; a ghost fades away, a skeleton falls into bones, a skull bursts, a spider flips over) |

Each attack says what it reaches (`ACTIONS[name].reach`: `front`, `around`
or `self`, and `range` in pixels), so a game can tell what it hits: the
axe swing reaches everything within 14 px all round; the others reach
ahead.

The actor is anything the library draws: a person, `{ cat: true }`,
`{ dog: true }`, `{ monster: type, variant }`. The catalogue shows them all
under Combat.

## Nature

`src/tinyNature.js`: 15 trees, 10 bushes and 10 terrains, scaled with crisp
pixels like the buildings.

| Export | What it does |
| --- | --- |
| `drawTree(g, { type, x, y, seed, scale, t })` | `oak`, `maple`, `sakura`, `pine`, `cedar`, `fir`, `birch`, `palm`, `willow`, `ginkgo`, `bamboo`, `apple`, `poplar`, `cypress`, `bare` (`TREES`). The seed picks where fruit, blossom and leaves fall and mirrors the tree. With `t` (seconds) it sways in the breeze: gusts roll across the town and the crowns lean a pixel or two (the town and the catalogue pass it). |
| `drawBush(g, { type, x, y, seed, scale })` | `round`, `hedge`, `azalea`, `hydrangea`, `rose`, `lavender`, `fern`, `pampas`, `holly`, `cactus` (`BUSHES`). |
| `drawTerrain(g, { type, x, y, w, h, seed, scale, t })` | Fills a rectangle: `grass`, `meadow`, `tallGrass`, `dirt`, `sand`, `gravel`, `cobble`, `water` (ripples with `t`), `snow`, `paddy` (`TERRAINS`). |

In the town, a forest rings everything nobody can reach (behind the
skyline, the sides with gaps where the streets run out, below the last
street), the back gardens are full of bushes, small trees, meadow and long
grass, trees and bushes stand round the shrine, the school and the square; the grounds are terrains; there is a pond; dogs go
for walks with their owners. The catalogue has them all (Animals, Nature).

## Street things

`src/tinyStreet.js`: what makes the streets feel lived in, in the same
pixel style: utility poles (with a lamp, sometimes a transformer, the
yellow-and-black guard and an address plate) and the wires between them,
street lamps, old street lamps, stone lanterns (tōrō), vending machines,
a bus stop, benches, bins, bikes in a rack, a red post box, pot plants and
a stop sign (tomare) and traffic lights. The catalogue has them all (Street).

| Export | What it does |
| --- | --- |
| `drawProp(g, { type, x, y, seed, scale })` | One thing, centred on `x`, standing on `y` (`PROPS` lists the types). The seed picks a vending machine's colour and drinks, the bikes' colours, a pole's transformer. |
| `propSolid(p)` | The ground it stands on (poles and lamps only their pole), so people walk round it. |
| `propLights(p)` | Where it gives light at night. |
| `poleTops(p)`, `drawWire(g, a, b, sag)` | A pole's wire ends, and a sagging wire between two points. |

In the town, `makeTown` puts utility poles along the far side of every
street with wires between them, street lamps along the cross streets and
vending machines (and bins) where a row of buildings ends; the layout's
`props` add bus stops, benches, stone lanterns by the shrine's path, old
lamps in the square, a bike rack at the school and a post box; two traffic
lights at every junction.
The roads have manholes.

## Traffic

`src/tinyTraffic.js`: cars, kei cars, taxis, delivery vans, kei trucks and
buses, each a small 3D shape drawn from any heading the way the town is seen
(walls full height, tops from above), so the front, back, sides and every
angle between are the same vehicle, with wheels in arches, bumpers, plates,
lamps, grille, mirrors, a sloped windscreen and rear window; and a town's
traffic.

```js
import { makeTraffic } from './src/tinyTraffic.js';

const traffic = makeTraffic(town, { cars: 18, buses: 2 });
// each frame:
traffic.update(dt, t, people);                       // lights change, cars drive, stop, turn
drawTownView(g, town, view, [...people, ...traffic.vehicles], t);
// before someone on foot steps onto a road:
if (!traffic.mayCross(p.x, p.y, nextX, nextY, t)) { /* wait for the green man */ }
```

| Export | What it does |
| --- | --- |
| `drawVehicle(g, { type, x, y, heading, color, seed })` | One vehicle (`VEHICLES`: `car`, `kei`, `taxi`, `van`, `keiTruck`, `bus`), its middle on the ground at (x, y); `heading` in degrees (0 right, 90 towards you, 180 left, 270 away; 16 steps), or `facing` `'right'` / `'down'` / `'left'` / `'up'`. The seed picks the colours. |
| `makeTraffic(town, { cars, buses, seed })` | `{ vehicles, update(dt, t, walkers), mayCross(x, y, nx, ny, t), hits(x, y), lightAt(junction, axis, t), train, crossingClosed(j) }`; `hits` is the vehicle whose body stands on a spot (so nobody walks into one). |

How it behaves: cars drive on the left, as in Japan (east-bound on the
north half of a street); they swing round as they turn; every junction has
traffic lights (green, yellow, red side by side, and a walk signal) that
cars wait at; cars turn at junctions, keep their distance, and stop for
anyone in front of them (you too). Nobody holds the traffic up for long: a car
kept waiting by someone on the road pulls out round them when the other lane is
clear, or turns round; people caught by a car on the road (or beside a taxi
pulling in or out) step aside and go another way; buses keep to the streets with bus stops
and wait at each one; cars leaving town come back in somewhere else. People
on foot cross the roads only at the zebra crossings and wait for the green
man there (you can still walk anywhere with the keys). The catalogue has
the vehicles (Street, Vehicles), turning slowly all the way round.

## Day and night

`drawTownView(g, town, view, sprites, t, { night })` takes how dark it is,
from 0 (day) to 1 (night). As evening comes the town turns golden, then
deep blue; then the lights come on: lit windows (about half the windows of
each building, always the same ones), shop glass, signs, neon, lanterns,
street lamps, vending machines, traffic lights, and cars' headlights and
tail lights. The light is pixel art too: three flat steps round each lamp
and in the headlights' pools, and it never washes over cars or people; people standing in it take on its
warm colour
(`lights: 'soft' | 'dither' | 'mixed'` for other looks). In the demo an hour passes every 8 seconds from 4 in the
afternoon (the clock is under the town); **Time** keeps it day or night
instead.

## Seasons and weather

`drawTownView(..., { season, weather })`: `season` is `'spring'`, `'summer'`,
`'autumn'` or `'winter'` (none: the town as drawn). Spring: cherry blossom,
fresher greens, petals and small flowers on the lawns. Summer: the cherries in
leaf. Autumn: leafy trees red, orange or gold, yellowed lawns with fallen leaves;
evergreens stay green. Winter: snow on the ground, the sidewalks and every roof,
leafy trees bare with snow on their branches, snow on the evergreens; roads stay
clear. `weather: 'rain'`: a faintly grey sky, soft see-through rain falling slowly at a
slant, very few splashes, puddles on the roads and sidewalks (in winter it snows instead,
slowly). Everyone walking leaves footprints, short trails behind them: in the snow,
and wet ones in the rain (`prints`). The same `season` works
on single plants (`drawTree` / `drawBush`), `snow: true` on a building
(`drawBuilding`), and `groundInSeason(canvas, season)` on any ground picture.

In the demo, **Season** and **Weather** under the town pick them; on *auto* the
season follows the real month and it rains now and then (some three-hour spells
of the town's day), and walkers put their umbrellas up while it rains. The
address takes `?season=winter` and `?weather=rain` (or `clear`).

`drawBuilding(g, { ...b, lights: true })` draws only what shines on a
building, `propLights(p)` and `vehicleLights(v)` where things give light;
`drawVehicleBeams(g, v)` the pool of light headlamps throw on the road in
front of a car.

## Speech

`src/tinySpeech.js`: what the people say. In the town, small **icon
bubbles** pop up over people now and then (♥ love, ♪ a hum, … thinking,
! surprise, ? a question, Z sleepy, the anger mark), chosen to suit them (a
kid hums, a tired salaryman sighs, more Z at night), and two passers-by
close to each other stop, face each other and **chat in icons**, taking
turns. **Tap someone** (a person, an animal or a monster) and they stop and
say a line that suits them (the salaryman: "Overtime again...", the police
officer: "Stay safe!", a kid: "Let's play!", a zombie: "Uuurgh...") as
**floating text**: it types itself out, then rises and fades.

```js
import { drawSpeech, emote, speak } from './src/tinySpeech.js';

speak(person, t);                 // a line that suits them
emote(person, 'heart', t);        // an icon bubble for a couple of seconds
// each frame, after the town (so lines stay bright at night):
drawSpeech(g, people, t, { bounds: view });
```

| Export | What it does |
| --- | --- |
| `speak(actor, t)` / `emote(actor, icon, t, seconds)` | Give someone a line (floating text) or an icon bubble. |
| `drawSpeech(g, actors, t, { bounds })` | Draw every line and icon; `bounds` keeps long lines inside the view. |
| `kindOf(actor)`, `lineFor(actor)`, `moodFor(actor, rng, { night })` | What kind of speaker someone is (salaryman, police, kid, student, elderly, delivery, rainy, shopper, adult, cat, dog, each monster), a line, a mood. |
| `ICONS`, `SPEAKERS`, `linesOf(kind, lang)` | The icons, the kinds of speaker, a kind's lines. |
| `LANGUAGES`, `setLanguage(code)` | English now; Japanese (`ja`) and Indonesian (`id`) are ready to be written (they fall back to English until then; the font has Japanese). |

The catalogue has every icon and each speaker saying its lines (Speech).

## Small life

The town is quieter now (about 44 walkers, plus the shopkeepers, the kids
at play, cats, dogs and monsters). People make way for each other (someone standing about steps aside), and
cars never wait for good. It lives through the day (`src/tinyLife.js` draws it; the demo's
`demo/life.js` decides who does what). People **sit on benches**, **ride
bikes** along the sidewalks, stop at a **vending machine** for a can, **feed
the ducks** (who paddle over, ducklings behind), have a **picnic** under the
cherry trees. **Shopkeepers** stand at their doors, sweep in the morning and
bow to passers-by; at night their **shutters** come down and the windows
above light up and go dark one by one. **Laundry** and futons hang on the
balconies by day, **rubbish** goes out in the morning, pixel **steam** puffs up from
the ramen shop and the food stalls, the alley's **lanterns sway** and
**petals** fall. Kids play on the **swings**, the **slide** and **kick a
ball** in the schoolyard. **Pigeons** peck about and fly off when you come
close, **crows** sit on the wires, a **cat naps** on a block wall, two
**dogs** stop to greet each other. When a train stops, **commuters** come out
of the station; now and then someone takes a **taxi** from the rank, and a
**delivery scooter** weaves through the traffic.

```js
import { drawPose } from './src/tinyLife.js';

drawPose(g, { ...person, pose: { kind: 'sitBench' } }, t);   // sitGround, ride, bow, sweep, kick, throw, drink, slide
drawBuilding(g, { ...building, laundry: true });              // or shut: true
```

The catalogue's **Life** group has every pose and each piece of small life.
