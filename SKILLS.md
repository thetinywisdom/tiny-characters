# SKILLS: how Tiny Characters works and how to extend it

Read this before changing anything; `PLAN.md` says what is done and next.

## What this is

The tiny 2D pixel people from Tiny City Builder's bubble lab
(thetinywisdom/character-creator, `labs/bubble-lab.html`), as a library.
The owner chose these as the start of this repo.

## Files

```
src/tinyCharacters.js  the library (plain ES module, no dependencies):
                       drawCharacter, drawStage, randomCharacter,
                       LOOKS, seeded, headOf, snapToPalette, COLORS, the
                       colour lists and the look lists (HAIRSTYLES, HATS,
                       TOPS, LEGWEAR, CARRY)
src/tinyBuildings.js   the buildings (plain ES module, imports seeded from
                       tinyCharacters.js): drawBuilding, BUILDINGS,
                       SHOP_TYPES, buildingSolids, drawStreet,
                       WALL_COLORS, ROOF_COLORS
src/tinyAnimals.js     cats and dogs: drawCat, drawDog, CAT_COATS,
                       DOG_BREEDS, catFor, dogFor
src/tinyNature.js      trees, bushes, terrains: drawTree, drawBush,
                       drawTerrain, TREES, BUSHES, TERRAINS
src/tinyMonsters.js    monsters: drawMonster, MONSTERS (zombie, werewolf,
                       ghostGirl, reaper, spider, skeleton, skull; 4
                       variants each; four views)
src/tinyCombat.js      weapons and fights: drawWeapon, drawArmed,
                       drawAction, drawActor, WEAPONS, ACTIONS, SKILLS,
                       REACTIONS
src/tinyStreet.js      street things: drawProp, PROPS, propSolid,
                       propLights, poleTops, drawWire
src/tinyTraffic.js     vehicles and traffic: drawVehicle, VEHICLES,
                       makeTraffic (lanes, lights, turns, buses)
src/tinyTown.js        the 2D town map: makeTown, drawTownView,
                       DEFAULT_TOWN (layout, ground, walkable ground,
                       path finding, place names)
index.html             the demo page (town, park, looks, buildings, gallery)
catalogue.html         the catalogue page: every item on a card, filters,
                       seeds, copy code
demo/catalogue.js      the catalogue: the item list (people, cat, buildings,
                       one card per shop kind), kinds (tags), filters kept in
                       the address, seed per card, copy code
demo/catalogue.css     the catalogue's look
demo/demo.js           the demo: strolling crowd and cats, you (keys / tap
                       to walk), tap someone to make them talk; every look;
                       the gallery
demo/town.js           the town (walk around the map; townspeople, kids in
                       the schoolyard, shrine visitors, cats) and the
                       Buildings sheet
demo/demo.css          the demo page's look (light and dark)
.nojekyll              tells GitHub Pages to serve the files as they are
```

## How a person is drawn (feet at x, y; one canvas pixel = one pixel)

- **no shadow** (the owner's decision: shadows under people looked odd);
  only floating and flying monsters (ghost girl, reaper, flaming skull) have
  one, in `COLORS.shadow` (30% black, `rgba(0, 0, 0, 0.3)`); people,
  animals, walking monsters, trees and bushes have none
- body: 5 × 6 at (x − 2, y − 9), `body`
- legs: two 2 × 3 at (x − 2, y − 3) and (x + 1, y − 3), `legs`
- head: 3 × 4 at (x − 1, y − 13), `skin`; hair: 3 × 2 on top, `hair`
- talking: body, head and hair 1 px up on every other sixth of a second
- walking: one leg 1 px shorter, eight steps a second, the body bobbing up
  on the second step; facing left / right: one hair pixel at the back
- you: a 7 × 1 gold line under the feet

Every look is drawn with `R(colour, dx, dy, w, h)`: a rectangle at
(x + dx, y + dy), mirrored when facing left, so "back" is negative dx and
"front" positive. Rows come from `frameOf(p, bob)`: `legH` (3, a kid 2),
`bodyH` (6, a kid 4), `B` the body top (−9) and `Hd` the head top (−13).
Draw order: shadow, backpack, legs, body, top, skirt, boxes, head, hair,
moustache, hat, things in the hand, the gold line.

- sizes: kid legs 2 rows, body 4 (11 px); short body 5 (14 px); tall legs 4,
  body 7 (17 px); `frameOf` gives the rows, so every part follows
- on everyone: shoes (the bottom row of each leg, `shoes`); the shaded side
  (the right column of body, face and right leg in a darker shade, drawn
  with `W`, which is never mirrored: the light always comes from the left);
  hands (1 × 2 skin at both sides near the bottom of the body, swinging a
  pixel with the steps; from the side one hand swings in front and behind;
  no right hand when something is carried there, none round boxes); a plain
  top (no `top`) gets a collar (3 px white, or a darker shade on light tops)
  and a hem 3 rows above its bottom
- four views (`facing`): 'down' or nothing is the front; 'left' / 'right'
  the sides (drawn mirrored by `R`); 'up' the back: hair over the whole head
  (the nape shows under short hair; long hair 5 wide to the shoulders; a
  ponytail hangs down the back and swings), no fringe, moustache or collar,
  a backpack across the back (3 wide), a yukata's obi bow, the sailor
  collar's flap, an apron's strings, boxes hidden in front. `facingFor(dx,
  dy)` gives the view for a walking direction (whichever way moves most);
  cats and dogs have the four views too (tinyAnimals)
- fringe: one hair pixel at (±1, Hd + 1), front view only
- no eyes, no faces (the owner's decision); the moustache is the only face
  detail
- hair: bald (skin one row higher), long (a column down each side; the back
  one when facing), ponytail (front: a pixel out, then 5 down on the side;
  facing: the same at the back; on the walking step it swings out: B frame),
  afro (5 × 3 plus sides), bun (a pixel on top), mohawk (bald plus a 1 × 3
  strip). Under a hat, afro and bun become short and mohawk bald.
- moustache: one pixel at (x, Hd + 2), the hair colour
- hats: cap 3 × 2 over the hair, a brim pixel in front when facing; wide
  hat a 5 × 1 brim and 3 × 1 crown
- tops: jacket a middle column of `trim`; suit a white 3 × 2 shirt and a
  `trim` tie; apron 3 wide from the chest over the legs; yukata the body
  colour down to the feet, an obi row; sailor a navy collar row and a ribbon
  pixel; gakuran two gold buttons; police a 3-wide vest and a gold badge
- legwear: shorts the top leg row in `legs`, skin below; skirt a 5 × 2 band
  in `legs`, skin legs below
- carried: backpack 2 × 4 behind (side only); bag 2 × 3 and briefcase 2 × 2
  in front at the hand; stick 1 px down to the ground; boxes 5 × 4 over the
  body; umbrella a pole and an 11 / 9 / 5 px canopy with a tip
- cats and dogs: see "How animals are drawn" below

Keep them this small and this simple: that is what the owner liked. Looks
the owner turned down (too small, or not wanted) are listed in `PLAN.md`
under Decisions; do not add them back.

## How a building is drawn

Every building faces you: a front wall, then its roof **seen from above**
(8–18 rows, as in a top-down town map: this is what gives a building its
depth), windows, a door, and one or two details that make it that building.
Each is an entry in `DEFS` in `src/tinyBuildings.js`:
`[label, widths, draw(r, rng, b, wall, roof, w)]`.

**The seed changes the building, not only its colours** (the owner: a seed
must not just recolour the same building). `drawBuilding` mixes the seed
into `rng` (neighbouring seeds would otherwise choose alike), takes the
wall, the roof colour, then one of the type's `widths`; `draw` gets that
width `w` and makes every other choice from `rng`, through `V(rng)`
(`pick`, `chance`, `int`):
- floors (house 1-2, apartment 4-6, office 5-7, karaoke 3-5, Dutch house
  3-5, parking garage 2-4 levels, school 2-3 ...)
- windows: their kind (`oneWindow`: sash, pair, alu, aluPair, tall,
  shuttered, arched, leaded, shoji, neon; widths in `WW`) and how many,
  spread evenly with `windowRow(r, rng, kind, x0, x1, up, n)` (`howMany`
  gives how many fit; nothing is drawn where there is no room)
- the door: kind, side (left, middle, right), colour (`DOOR_COLOURS`)
- the roof: flat, pitched or hipped (`aRoof`), its depth and colour
  (`HOUSE_ROOFS`), chimneys, dormers, a clock tower, a bell tower, an
  antenna, things on a flat roof (`rooftop`: AC units, a plant room)
- details: balconies, awnings (`AWNINGS`), which side an upright sign is on,
  noren colours, the Dutch gable (stepped, bell, triangle), flower boxes,
  a roof garden, the number of garages ...
Every size still comes from `STOREY` and the door / window kit, so every
seed is on the same grid. `buildingSize(b)` is the size for that seed
(drawn once with a measuring painter, cached); `BUILDINGS[type]` has the
largest any of 40 seeds makes (`w`, `h`, so a card sized from it fits every
seed) and the `widths`. Seeds are stable: the same seed always draws the
same building. The torii, koban, gas station and mosque keep one width (the
gas station and torii have open ground in `OPEN` measured on that width).

The mosque picks its wall, dome colour (green, gold, blue, white,
teal) and size (radius 7–10), trim colour, one or two minarets (50–63 px,
a single one left or right), small side domes, one or two arched windows
each side. Its pieces: `dome` (a half disc lit on the left) and
`pointedArch`.

- `r(colour, dx, up, w, h)`: a rectangle `dx` from the left edge whose
  bottom is `up` pixels above the ground line. Keep everything inside
  `0 .. width` (signs, bikes, post boxes too) so buildings in a row do not
  overlap; shift the building with a wrapping `r` if something stands beside
  it (see the koban and the family restaurant).
- Roofs: `flatRoof(r, wall, dx, up, w, d)` (a rim, the light roof top with
  seams; put AC units, water tanks, a roof garden, parked cars on it),
  `pitched(r, colour, dx, up, w, d, hip)` (ridge along the street: front
  slope with a darker tile row every third row, a light ridge, a little of
  the back slope; `hip`: the sloping ends of a hipped roof, drawn as darker
  triangles at the sides), `gable(r, colour, face, dx, up,
  w, gh, d)` (a gable facing the street: a wall triangle edged with roof and
  the roof running back behind it, left slope in shade, right in light;
  Tudor cottage, stone chapel). Chimneys, towers, domes and dormers sit on the
  roof, inside its rows. **Every roof fills its whole rectangle** (the
  owner's rule, so all buildings look alike): never cut corners away.
- **Doors and windows: one set of sizes (the owner's rule).** `STOREY`:
  ground floor `GF` 16 (a shop's `SHOP_GF` 19: glass and door 0–12,
  stripes or awning 12–15, sign 15–19), upper floors `FL` 13 (`floorAt(n,
  gf)` is the bottom of floor n), window sills `SILL` 4 above the floor (3
  for a tall window). Doors are 12 tall: `DOORS.wood`, `plank`, `glazed`,
  `glass`, `steel`, `arched` (6 wide), `auto`, `sliding`, `shoji` (10 wide),
  `garage` (18 × 14). Windows: `WINDOWS.sash` (5 × 6, a pair at 9, white
  frame and a sill), `alu` (aluminium, 5 or 9), `tall` (5 × 8, transom),
  `shuttered`, `arched`, `pointed`, `stained`, `round` (4 × 4), `lattice`
  (any width, 6 tall), `shoji`, `leaded`, `neon`, `shop` (as tall as a
  door, a bar every 6 px). `pane(rng)` decides dark glass, a lit room or
  curtains. **Never draw a door or window as a bare rectangle**: use the
  kit, at its size, on the floor lines, so all buildings stay alike.
  `PART_DEFS` / `drawPart` show each on its own (the catalogue's Doors &
  windows group).
- Other pieces: `awning` (2 px stripes), `sign` (a band with a row of
  "letters"), `noren`, `lantern`, `dots` (books, flowers, goods), `dome`,
  `pointedArch`, `shopFront(r, rng, dx, w, kind, wall)` (the six shop kinds
  on a 19 px shop ground floor).
- A person (15 px) reaches three quarters of a door at scale 1; in the
  town (scale 1.5) doors are taller than people.
- Colours: the catalogue's walls and roofs (`WALL_COLORS`, `ROOF_COLORS`),
  glass `#9fb6cc`, windows `#5f7487` (lit `#f0dca0`), wood, ink, red, navy.

People in front of a building are drawn after it (their feet are below its
ground line); anyone behind it (smaller y) would be drawn before it and
hidden, so in a town nobody can stand there (see the map rules below).

## How the town map works

**Drawing for 1.5 (the owner found broken icons and "random stripes"):**
`painter` scales every rectangle to the same size wherever it sits (a 1 px
line is always 2 px, a 2 px stripe always 3), so keep these rules:
- anything that repeats (stripes, slats, tiles, letters, shelves, windows)
  repeats on **even steps** (2, 4, 6, 8, 10 px); steps of 3, 5, 9 come out
  uneven (4 and 5 px) and look random
- small pictures (crosses, letters, the clock, a cross on a roof) are
  `icon(r, dx, up, rows, colours)`: rows of characters drawn on whole
  pixels, centred, so they stay sharp and symmetric (`CROSS` is the medical
  cross)
- signs show the place's name (`sign(r, bg, fg, dx, up, w, h, text)`,
  `upright(...)` for a narrow sign read top to bottom) in DotGothic16
  (`SIGN_FONT`) through `r.text`: it picks the biggest size of 32, 24, 16,
  12, 10 device pixels that fits the box, or returns false and the sign
  draws the old dashes. It needs `dpx` (device pixels per canvas pixel):
  the canvas is made dpx times bigger and the context scaled, so the
  pixel art stays crisp and the letters get real pixels (town 4, the
  Buildings sheet and catalogue cards 6). Painters moved sideways use
  `shifted(r, ox)` so they keep `text` and `px`. Shop
  names live in `SHOPS[kind].name`. The pages load DotGothic16 from Google
  Fonts and draw static canvases again once it has loaded; headings,
  buttons and chips use it too. Signs not lettered edge to edge; shop
  glass spreads its bars evenly; shelves are shelf lines with 3 px goods
- check a new building at scale 1.5 next to a person before committing

**Scale:** `DEFAULT_TOWN.scale` is 1.5 (the owner wanted the town bigger
than the people). The layout is written at scale 1; `makeTown` multiplies
every position and size (`scaled`), street sizes come from `streetDims(k)`,
and each building gets `scale` (drawBuilding scales and rounds every
rectangle's edges, so 1 px lines become 1 or 2 px and stay crisp; sizes via
`buildingSize`). People are never scaled. The Buildings sheet and the
catalogue show buildings at scale 1.

The owner's rules: every building faces you and **its whole picture is solid
ground** (`buildingSolids`), so nobody is ever hidden behind one: to get past
you walk round it. Only the torii (between its posts) and the gas station
(8 px under its canopy) can be stepped into; `OPEN` in tinyBuildings.js lists
their solid parts. **Tall buildings stand only in the back row** (above the
first street, nothing behind them); the blocks between streets hold low
buildings (up to about 50 px); the shrine, the school and the old town have
their own grounds in front of them.

- Layout (`DEFAULT_TOWN`): `streets` (the top of each; a street is 7 px
  sidewalk, 18 px road, 7 px sidewalk), `crossStreets` (left edges; 6 + 18 + 6
  px, from the first street to the last), `rows` (a ground line, a left edge
  and building types packed 2 px apart, `'shop:ramen'` for a shop kind;
  `makeTown` gives each a seed that fits: it tries seeds until one is no
  taller than the room under the street above, and if the row is too wide
  for the room before the next cross street it swaps the pick that saves
  the most for its narrowest fitting seed, until it fits),
  `buildings` (placed one by one), `areas` (`gravel`, `sand`, `paving`
  grounds with a name; the shrine's has stepping stones). A row's buildings
  must end before the next cross street; a block's buildings must be lower
  than the block (the street above stays clear).
- The ground (grass, grounds, streets, crossings) is drawn once onto
  `town.ground`; `drawTownView` copies the part in view, then draws buildings
  and sprites sorted by their ground line / feet.
- `blocked(x, y)`: outside the map, above the first street's sidewalk, or in
  a building's solid ground (widened by the person's half width).
- `findPath(from, to)`: breadth-first search on a 4 px grid of free cells,
  four directions, kept to the corners; null if `to` is blocked or cut off.
- Monsters in the demo: walkers with `monster: type, variant` (some kept to
  an area with `within`), each at its own speed (`MONSTER_SPEED`: a zombie
  7 px/s, a werewolf 26); they cannot be tapped to talk; the Hide / Show
  monsters button filters them out of the sprites drawn (they keep moving).
- The demo: you move with the keys (each axis checked on its own, so you
  slide along walls) or along a path to where you tapped (a building: its
  door, `doorOf`); townspeople take short trips (`randomSpot`, then a path)
  and rest; kids stay in the schoolyard, some people in the shrine grounds
  and the square (`within`); `placeAt` names where you are.

## How animals are drawn (src/tinyAnimals.js)

One four-legged drawing, `quad(g, a, t, spec, coat, dog)`, for cats and
dogs. `spec`: body `bw` × `bh`, legs `lh`, head `hw` × `hh`, `ear` (`cat`,
`point`, `flop`), `tail` (`up`: a cat's S, `curl`, `down`, `stub`, `pom`);
`coat`: [main, second, pattern] with patterns `tabby` (stripes), `tuxedo` /
`chest` (white chest and paws), `calico` (patches), `points` (dark ears,
face, paws, tail), `spots`, `face` (a pug's dark face), `plain`.
- side (mirrored for left): four legs, the far pair darker, taking turns
  when walking (short legs step sideways); the tail behind; the body with a
  darker belly row; the head at the front (a cat's sits on its shoulders),
  ears; a dog's nose and collar
- front: the chest (a dog's shoulders wider than its head), two legs, a
  neck shadow, a dog's collar, the head with its ears, the tail beside it,
  a dog's nose
- back: the rump, two legs, the back of the head with ears, the tail over
  the back (a shade darker so it shows on a plain coat)
- a dog standing still wags its tail
A new breed is an entry in `DOG_BREEDS` (and coats in `DOG_COATS`).

## How monsters are drawn (src/tinyMonsters.js)

`drawMonster` picks the variant (index or name), sets up `R` (mirrored for
left) and `W` (never mirrored), and calls the type's function with `side`,
`back`, `t` and `walking`. Each type is drawn like the people (feet at y,
the body from `B`, the head from `Hd`) with its own sizes: the werewolf is
taller (18 px, hunched, legs bent like a wolf's), floaters (`ghostGirl`,
`reaper`) bob with `sin(t)` above a small shadow and have no feet, the
ghost girl is drawn at 0.88 alpha, the flaming skull flies at head height
with a flame shape of three colours that leans back when it flies
sideways and flickers. Variants are rows of colours / gear in the
`ZOMBIES`, `WOLVES`, `GIRLS`, `REAPERS`, `SPIDERS`, `FIRES` tables; the
skeleton's are drawn in code (warrior, pirate, mage). Monsters have eyes
(the people do not). A new variant: add a row to the table and its name to
`MONSTERS`; check all four views at real size next to a person.

## How combat is drawn (src/tinyCombat.js)

Everything is a function of `u`, the progress 0-1 (`time / duration`), so
it can be paused, scrubbed or replayed.
- Weapons are drawn along a line from the hand at an angle (`along`,
  `across`): grip, guard and blade for a sword, a head for an axe, a long
  shaft for a spear; the bow is a curve with a string pulled back by
  `pull`; the shield is a round face.
- Attacks are poses (`POSES`): the hand (from the shoulder), the weapon's
  angle, a lean, a crouch, a trail (the tip's last positions, drawn
  faded), dust, a flying arrow. The axe swing is a spin (`spin: true`): its
  angle is on the screen (mirrored only when facing left), the hand circles
  the middle of the body, the fighter turns through the four views
  (`facing` per frame), the axe goes behind the body on the far side, and a
  ring of motion grows round them. `reach` / `range` on each action tell a
  game what it hits. `drawPersonPose` draws the person, an arm
  from the shoulder to the hand, then the weapon (behind the body when they
  face away). Angles are for facing right and are mirrored for the left.
- Skills (`drawSkill`) draw the monster, then their effect: a lunge and a
  bite, claw streaks, curse rings, a scythe's crescent, a web ball and a
  web net, a spinning bone, a fireball with a tail; projectiles fly along
  the facing direction.
- Reactions (`drawReaction`) draw the actor into a small canvas (`sprite`)
  so it can flash white (source-atop), be turned a quarter to lie down, be
  flipped (a spider) or faded (a ghost).
A new attack: a pose function in `POSES` and an entry in `ACTIONS`; a new
skill: a case in `drawSkill` and an entry in `SKILLS`. Check every frame
(a strip of six) next to a person.

## How nature is drawn (src/tinyNature.js)

Trees and bushes: `[label, w, h, draw(r, rng, cx)]` from the bottom left,
`cx` the middle. Pieces: `blob` (a clump of leaves lit from the top left),
`sprinkle` (fruit, flowers, blossom on even steps), `trunk`, `shadowUnder`.
**Each plant is drawn once at its real size into a small cached image**
(`plantImage`, 8 looks per type) and placed at the scale asked for with
nearest-pixel scaling; the seed picks a look and mirrors it. Never draw a
plant straight at a scale like 1.5 or a random one (the owner saw "broken"
striped trees: rows of leaves overlapped or missed). In the town the canvas
is 4 times bigger underneath, so 1.5 is exactly 6 screen pixels per plant
pixel. Forest trees keep their trunks 20 px (scale 1) below a street so
their crowns stay off it. Terrains fill a rectangle
(clipped) with a base colour and a pattern on a grid of whole pixels
(`c = round(scale)`); water's ripples move with `t`. In the town, `plants`
in the layout (`{ tree: 'sakura', x, y }` or `{ bush: ... }`) block at the
trunk / the bush's base; areas with `solid: true` (the pond) block whole;
the grounds are drawn with `drawTerrain` (`TERRAIN_OF`), water again every
frame.

**Greenery and forest (the owner: unreachable areas are blocked by
forest).** `DEFAULT_TOWN.forest` (48) is a border round the town: `scaled`
moves everything in by it and makes the map that much bigger. `makeTown`
then fills, with a seeded rng (`layout.seed`):
- the forest (`forestIn`: a jittered grid of cedars, pines, firs, oaks,
  cypresses, birches) behind the skyline, at both sides (skipping the
  streets, which run out of town through the gaps) and below the last
  street; it is not solid, `blocked` keeps people out of it (only the
  streets cross the sides); the forest floor is long grass
- the back gardens (`roomFor`: away from buildings, other plants, areas and
  cross streets, 40 % of spots left empty for paths): bushes near the
  street, small trees deeper in; patches of meadow and long grass on the
  ground
Forest trees are drawn like any plant (sorted with buildings and people),
only those in view.

## How street things are drawn (src/tinyStreet.js)

Each thing is an entry in `DEFS`: `[label, w, h, depth, draw(r, rng),
lights]`, drawn with the buildings' painter (`makePainter`), so it scales
as crisply (the town draws them at 1.5). `depth` is the rows of ground it
stands on (`propSolid`; `FOOT` narrows poles and lamps to their pole so
they never block a sidewalk); `lights` are `[dx, up, radius]` for the night.
Keep them on whole pixels and small: a vending machine is 7 x 11, a lamp 19
tall, a utility pole 30 (the tallest thing on a street).

In the town (`placeProps` in tinyTown.js): the layout's `props` first, then
vending machines and bins where a row ends short of its cross street,
utility poles every 58 px on the far sidewalk of each street (none at the
crossings), street lamps in the gardens along the cross streets (their arm
over the sidewalk). Nothing goes where it would cover a building or another
thing (`fits`). Poles on the same street are wired (`town.wires`, drawn
over everything). Garden plants keep clear of things. Manholes are part of
the ground picture.

## How traffic works (src/tinyTraffic.js)

**Vehicles** are drawn at the people's size (one canvas pixel = one pixel,
not scaled with the town): `DEFS[type]` has `size: [[length, height] side
on, [width, height] head on]` and `side(R, c, c2)` (facing right; left is
mirrored), `front` and `back` (`headOn` / `tailOn`: bumper, lamps, glass,
then the roof running back, seen from above like the buildings' roofs).
`R(colour, dx, up, w, h)` draws from the bottom-left. **Every view has
depth, like the buildings** (the owner: side views looked like paper
cars): side on, above the side panel come 4-5 rows of the vehicle's top
seen from above (bonnet and boot lower, then the raised cabin: its side
windows, then rear window, roof and windscreen; a van's and a bus's long
roof; a kei truck's open bed with its load), the far edge a shade darker;
head on, the roof runs back above the front. A car is 22 x 12 side on, 12
x 16 head on; a bus 40 x 18 and 14 x 26. The seed picks colours
(`CAR_COLORS`, taxi and bus liveries).

**The town's junctions** come from makeTown (`junctionsOf`): for each
street x cross street, the `box` where the roads cross, its zebra
`crossings` (`axis` 'h' over the street, west of the junction; 'v' over the
cross street, north and south of it) and two `signals` (traffic light
props: one for the street's traffic at the north-west corner, one for the
cross street's at the south-east). `roadAt(x, y)` / `crossingAt(x, y)`; the
path-finding grid treats road as blocked except at crossings, so people on
foot only cross there (`blocked`, which the keys use, still lets you walk
on roads).

**The traffic** (`makeTraffic`): lanes on the left (`hLanes`: east-bound in
the lower half of a street, west-bound in the upper; `vLanes`: south-bound
on the east side of a cross street, north-bound on the west). The lights
(`signal`): a 16 s cycle per junction, offset by its place (street green
6 s, yellow 1.5, all red 1, cross street green 6, yellow 1, all red), set
on the traffic light props each update. Each update, `room(v)` is how far
a vehicle may go: to the back of the one ahead in its lane, to the stop
line of a red (or late yellow) light, to anyone standing in front of it;
it speeds up (40 px/s²) and brakes (90) toward 30 px/s (a bus 24). Turns:
passing a cross street's lane, a car may turn into it (30 %); going along a
cross street it may turn at each street and must turn at the last one.
Buses stay on the east-bound lanes of streets with bus stops and wait 2.5
s at each. Vehicles leaving the town on a street come back in at the edge
of another. `mayCross` stops someone on foot from stepping onto a crossing
unless that crossing's cars have red (the walk signal is green then).

## How day and night work

`drawTownView`'s `night` (0 to 1) runs `drawNight` after everything else:
1. a `multiply` tint over the view: white by day, warm orange at dusk
   (strongest at night 0.35), deep blue (`#4c5494`) at night
2. the lights come on from night 0.25 (full at 0.7): each building in view
   is drawn again with `lights: true`: its painter (`nightLights` in
   tinyBuildings.js) draws only colours in `NIGHT` (lit rooms, curtains,
   shop glass, neon, lanterns `LANTERN`, the karaoke's glass), each as its
   lit colour, plus 45 % of the dark windows (`WIN`), picked by a hash of
   the building's seed and the window's place, so the same windows are lit
   every frame; signs (`sign`, `upright`) draw through `r.force`, so they
   are always lit
3. soft glows (`lighter`, radial gradients) round every light:
   `propLights` (lamps warm, vending machines white, a traffic light's lit
   lamp and walk signal) and `vehicleLights` (headlights ahead, red tail
   lights behind)
A new building's lights come for free if it uses the shared colours (`LIT`,
`CURTAIN`, `GLASS` ...); a new thing that shines gets `lights` in its
`DEFS` entry. The demo's clock (`hour`, `nightAt` in demo/town.js): night
from 20 to 5, day from 7 to 17, easing between.

## Common tasks

- **A new look part:** add a value to the list (`HATS`, `TOPS` ...), draw it
  in `drawCharacter` with a few `R(...)` calls relative to `B` / `Hd`, add it
  to `parts` in `demo/demo.js` (the Looks canvas) and its caption in
  `index.html`, describe it above. Check it at real size first: if it does
  not show at 5 × 15, it does not go in.
- **A new starter look:** add it to `LOOKS` (it shows in the Looks canvas's
  top row; add its name to the caption).
- **A new building:** add an entry to `DEFS` (look at the catalogue's
  builder for what makes it that building, then keep only what shows at this
  size) with two or three widths, and let the seed choose its floors,
  windows, door and roof (see above); the Buildings sheet shows three seeds
  of different sizes. Put it in the town by adding it to
  a row of `DEFAULT_TOWN` (tall ones in the back row only). Check it next to
  a person.
- **Change the town:** edit `DEFAULT_TOWN`; render the whole map once
  (`drawTownView` with the view the size of the town) and check nothing
  overlaps a street or another building.
- **Put something new in the catalogue:** people come from `PEOPLE` (a
  starter look and its kinds), buildings from `BUILDINGS` automatically;
  give a new building its kind in `KIND` (Homes, Shops & food, Civic,
  Worship) and `EUROPEAN` if it is (in `demo/catalogue.js`).
  Each card's code line must draw exactly what the card shows.
- **A new colour:** add it to the list (`BODY_COLORS`, `THING_COLORS` ...);
  `snapToPalette` uses all the lists.

## Testing and checking

No build step. Serve the folder (`python3 -m http.server`), open the page,
and check with Playwright screenshots on a desktop size and a phone
(`devices['iPhone 13']`), with no page errors.

## GitHub Pages

The demo is served from the root of `main` (Settings → Pages → Deploy from a
branch → `main`, `/ (root)`) at https://thetinywisdom.github.io/tiny-characters/.
Every push to `main` updates it within a minute or two; push each update
to `main` (see CLAUDE.md). All paths in
`index.html` and `demo/` are relative, so keep them that way (no leading `/`).

## Keeping the docs up to date

With every change, in the same commit: update this file (files, API, how a
person is drawn), `PLAN.md` (Done, Next, known issues, the owner's decisions)
and `README.md` (what people see and use).
