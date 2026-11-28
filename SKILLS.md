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
                       TOPS, LEGWEAR, CARRY); and the helpers every other
                       module shares: shade (a colour darker or lighter)
                       and canvasOf (a canvas of its own); do not copy them
src/tinyBuildings.js   the buildings: drawBuilding, BUILDINGS (TYPES: each
                       type's label and widths), buildingSize,
                       buildingSolids, SHOP_TYPES, WALL_COLORS, ROOF_COLORS,
                       PARTS / drawPart, closes, cooks, the night's lights,
                       the painter, setRedraw / usesFull
src/tinyBuildingsFull.js  the buildings' kit (storeys, doors, windows,
                       roofs, signs, awnings ...) and FULL, the drawings
src/tinyStreetFull.js  FULL_PROPS: the street things' drawings
src/tinyNatureFull.js  FULL_TREES, FULL_BUSHES, FULL_TERRAINS
src/tinyGroundFull.js  FULL_GROUND: the streets, railway, court, pond, paths
src/full/*.js          the drawings themselves, in parts (a-h buildings,
                       p1-p3 street things, n1-n3 plants, t1 terrains, g1-g2
                       ground), each entry { approved, draw ... }; the parts
                       export shared helpers (see How a building is drawn)
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
src/tinyVoxel.js       the 3D block renderer for the vehicles: voxelSprite, KY
src/tinyTraffic.js     vehicles and traffic: drawVehicle, VEHICLES,
                       makeTraffic (lanes, lights, turns, buses)
src/tinySpeech.js      speech: speak, emote, drawSpeech, kindOf, lineFor,
                       moodFor, ICONS, SPEAKERS, linesOf, LANGUAGES,
                       setLanguage
src/tinyLife.js        small life (drawing only): POSES, drawPose (sitBench,
                       sitGround, ride, bow, sweep, kick, throw, drink,
                       slide), drawPigeon, drawCrow, drawNappingCat,
                       drawSwings (riders), drawSteam, drawPetals,
                       drawRubbish, drawScooter
src/tinyTown.js        the 2D town map: makeTown, drawTownView,
                       DEFAULT_TOWN (layout, ground, walkable ground,
                       path finding, place names)
index.html             the demo page (town, looks, buildings, gallery)
catalogue.html         the catalogue page: every item on a card, filters,
                       seeds, copy code
demo/catalogue.js      the catalogue: the item list (people, cat, buildings,
                       one card per shop kind), kinds (tags), filters kept in
                       the address, seed per card, copy code
demo/catalogue.css     the catalogue's look
demo/demo.js           the demo page's Looks (every look) and Gallery (the
                       front-page park was removed: the owner did not use it)
demo/town.js           the town (walk around the map; 44 walkers since the
                       owner halved them: 20 anywhere, 5 schoolyard kids, 4
                       plaza, 3 each shrine, square, park, playground, 3 dog
                       walkers; townspeople, kids in
                       the schoolyard, shrine visitors, cats) and the
                       Buildings sheet
demo/life.js           small life in the demo town: who sits, rides, sweeps,
                       bows, plays, feeds the ducks; pigeons, crows, the
                       napping cat, rubbish day, dogs greeting, commuters
                       and the taxi rank; laundry and shutters by the hour
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
- you: a thin gold ring round the feet (`drawRing`, 13 × 5, drawn first so its
  back row hides behind the legs); `ring: colour` gives anyone one (the demo:
  white under whoever the mouse points at, or who was tapped, while they talk;
  tinyTown draws it under cats, dogs and monsters too; posed people get it
  from drawPose; at night drawTownView draws the rings again over the dark,
  the wearer and whatever stands in front painted out, so they keep their
  colour). The owner chose the thin ring, still (no pulse)

**Old people** (`isOld(p)`: `p.stoop`, else grey or white hair on an adult): `frameOf` puts
the head a pixel lower (a stoop); side on the head goes a pixel forward too with a rounded
back behind it; the walk is slower (5 steps a second, not 8; the demo walks them at 9 px/s).

**Side on** (`drawSide`, the owner's A, Nov 2026: drawCharacter hands every left / right
facing to it): the body 4 wide (columns -2..1, its front at +1, mirrored when facing left),
the head 3 x 4 with a nose pixel at +2, the hair over the top, a column down the back (long:
two; ponytail and bun behind), the shaded column at the back of the head; each leg one pixel
(near at 0, far at -1, the far one at 0.72), a shoe with a toe pixel forward. Walking:
`phase = floor(t * 8) % 4`: 0 the near leg's lower half forward and the far one back, 2 the
other way, 1 and 3 passing with the body a pixel up; the near arm a darker column down the
side, its hand behind (phase 0), in front (2) or at the side. Tops show on the front edge
(jacket, suit, apron, gakuran, sailor ribbon; the police vest over the side; a yukata to the
feet). Things in the hand go with the hand; the backpack behind, boxes in front.

Every look is drawn with `R(colour, dx, dy, w, h)`: a rectangle at
(x + dx, y + dy), mirrored when facing left, so "back" is negative dx and
"front" positive. Rows come from `frameOf(p, bob)`: `legH` (3, a kid 2),
`bodyH` (6, a kid 4), `B` the body top (−9) and `Hd` the head top (−13).
Draw order: shadow, backpack, legs, body, top, skirt, boxes, head, hair,
moustache, hat, things in the hand, the gold ring.

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

- Walking: the legs take turns lifting a pixel and the body bobs up a pixel
  on the second step; on the bob the hips (a 5 px row in the legs' colour)
  stretch up so no gap opens between body and legs (the owner's choice, B).

## How a building is drawn

Every building faces you: a front wall, then its roof **seen from above**
(what gives a building its depth on a map), windows, a door, and the details
that make it that building. Everything is drawn **at full size**: made for
the town's scale 1.5, one building pixel is one person pixel (the owner
chose this, "E", over drawing at scale 1 and stretching, which made uneven
lines and pixels bigger than the people's).

- **Where:** `TYPES` in `src/tinyBuildings.js` has each type's label and
  widths (at scale 1; drawn at `round(w * 1.5)`; the order mixes into the
  seed's random stream, so add new types at the end). The drawings are
  `FULL[type] = { approved, draw(r, rng, b, wall, roof, w), open }` in
  `src/tinyBuildingsFull.js`, which spreads in the parts `src/full/a.js` ..
  `h.js` (parts export shared helpers: a: `row`, `edges`, `band`, `plinth`,
  `chimney`, `railing`; b: `pier`, `window`, `awn`, `dark`, `goods`,
  `shopFront`; c: `shifted`, `bigSign`; d: `evenRow`, `windows`, `walls`).
  `draw` returns the shop kind it drew (for shutters and steam), if any.
  `open` (torii, gas station) is the ground you can walk into, as `[dx, w,
  top, bottom]` rectangles.
- **The seed changes the building, not only its colours.** `choices` mixes
  the seed into `rng` (neighbouring seeds would otherwise choose alike),
  takes the wall, the roof colour and one of the widths; `draw` makes every
  other choice from `rng` through `V(rng)` (`pick`, `chance`, `int`):
  floors, windows (kind, how many), the door (kind, side, colour), the roof
  (flat, pitched, hipped; depth, colour, chimneys, dormers, towers, things on
  a flat roof), awnings, signs' side, balconies ... New detail that must not
  change those choices comes from its own `seeded(...)` stream.
- **The kit** (`src/tinyBuildingsFull.js`), one set of sizes for every
  building (the owner's rule): ground floor 24, a shop's 28 (glass and door
  0-18, awning 17-22, sign 21-28), upper floors 20 (`FULL_STOREY`,
  `floorAt`), sills 6 above the floor; doors 18 tall (`DOORS.wood`, `plank`,
  `glazed`, `glass`, `steel`, `arched` 9 wide; `auto`, `sliding`, `shoji` 16
  wide; `garage` 27 x 21); windows (`WINDOWS.sash` 7 x 9, a pair 13; `alu`;
  `tall` 7 x 12; `shuttered`, `arched`, `pointed`, `stained`, `round`,
  `lattice`, `shoji`, `leaded`, `neon`, `shop`); `pane(rng)` decides dark
  glass, a lit room or curtains. **Never draw a door or window as a bare
  rectangle**: use the kit. Roofs: `flatRoof` (a rim, seams), `pitched`
  (tile rows with staggered joints, a lit ridge; `hip` for the sloping
  ends), `gable`, `aRoof`, `rooftop`; **every roof fills its whole
  rectangle**. Pieces: `sign` (the name in DotGothic16, as big as fits),
  `upright`, `awning` (a hem), `noren` (a round crest), `lantern`, `dots`,
  `shelves`, `icon` (rows of characters, one pixel each), `dome`,
  `pointedArch`, `laundry`, `shopFront`. `PART_DEFS` / `drawPart` show
  each door and window on its own (the catalogue's Doors & windows group).
- `r(colour, dx, up, w, h)`: a rectangle `dx` from the left edge whose
  bottom is `up` pixels above the ground line. Keep everything inside
  `0 .. width` so buildings in a row do not overlap (move a building
  sideways with `shifted` if something stands beside it).
- **Night:** the lights go by colour value (`NIGHT` in tinyBuildings.js):
  `WIN` (some windows light up, each on its own rhythm), `LIT`, `CURTAIN`
  (also the paper of lattices), `GLASS`, `GLASS2`, `'#dfe8ec'` (shop glass),
  `LANTERN` and the neon colours glow; everything else goes dark. So use
  those exact colours for glass and lamps, and not for anything that must
  not glow. `sign()` lights by itself (`r.force`); things in front of a
  glow can be drawn as dark silhouettes at night (`dark`).
- `buildingSize(b)` is the size for that seed (measured once with a painter
  that only records, cached); `BUILDINGS[type]` has the largest of 40 seeds
  at scale 1.5 (`scale: 1.5`), so a card sized from it fits every seed.
  Seeds are stable: the same seed always draws the same building.
- **New drawings are reviewed before they are used:** `approved: false`
  drawings show only with `setRedraw('all')` / `?redraw=all`. The workflow:
  draw a batch (helpers in parallel, one part file each), make before / after
  pictures (seeds in rows, a person for scale, day and night) and town
  views, publish them on a review page (an Artifact with a `db` store; each
  item `reviews/<round>-<id>` = { verdict, note }), then set `approved: true`
  on the accepted ones and redo the rest from the notes.

People in front of a building are drawn after it (their feet are below its
ground line); anyone behind it (smaller y) would be drawn before it and
hidden, so in a town nobody can stand there (see the map rules below).

## Street things, plants and the ground at full size

- **Street things** (`FULL_PROPS`, `src/tinyStreetFull.js`, parts
  `src/full/p1.js` .. `p3.js`): `{ approved, draw(r, rng, p) }`, drawn by
  `drawProp` with the painter at `p.scale / 1.5`. Sizes, feet (`FOOT`),
  glows (`propLights`) and wire ends (`poleTops`) stay in scale-1 pixels in
  `DEFS`, and each drawing puts those spots at the same place times 1.5
  (lamp heads under their glows, the crossarm's ends, the bench seat, the
  swing bar, the slide's ladder and chute, the hoop, the wall's top).
  `drawSwings` (tinyLife.js) draws the frame through `drawProp` and the
  chains, seats and kids on its grid (`SWING_SEATS` from p3.js).
- **Trees and bushes** (`FULL_TREES`, `FULL_BUSHES` in
  `src/tinyNatureFull.js`, parts `n1.js`, `n2.js` trees, `n3.js` bushes):
  `{ approved, draw(r, rng, cx) }`, about `w x h` (scale-1 sizes in
  tinyNature.js) times 1.5, centred on `cx`, the foot at 0.
- **The ground** (`FULL_TERRAINS`, part `t1.js`: `draw(g, { x, y, w, h,
  seed, t })`; `FULL_GROUND` in `src/tinyGroundFull.js`, parts `g1.js`
  streets and railway, `g2.js` court, pond, ring path, stepping stones; its
  header lists each piece's signature): a terrain fills its rectangle with
  one pattern pixel per canvas pixel, its marks on a grid fixed to the
  canvas (a hash of the cell and the seed), so patches meet without seams
  and adding one reshuffles nothing; the pond's `water()` draws the moving
  water each frame inside the same pixel edge as `draw()`. Curves (the pond,
  the ring path, the court's circle) are whole-pixel row spans, never canvas
  ellipses.

## How the town map works

**Layout pieces (Nov 2026; the demo map is a showcase, users will make
their own):** `railway: { y, h }` (a band of gravel, sleepers and rails;
solid but where a cross street crosses it, `railAt`; crossing gates are
placed at each level crossing, after the other props); areas: `ground:
'court'` (`drawCourt`: run-off in deep blue, the court in blue (the owner's
choice), lines, keys; `fence: true` adds a solid chain-link fence round it,
with gates: `gates: { top, bottom, left, right }` (widths) or `gate` (one at
the top), `gatePosts: true` marks them; the demo's court has no fence: the
owner found it too hard to get in), `shape:
'ellipse'` (drawn and redrawn clipped), `ring: true` (a dirt path round
inside it), `koi: true` (on water: `drawPondLife`, koi circling and two
ducks); `parked: [{ type, x, y, heading }]` (vehicles drawn and solid);
`wires: [[[x, y], [x, y], sag]]`. Sprites with `ball: true` (`drawBall`,
`h` its height) draw a basketball. New buildings: `station`,
`stationModern`, `stationBrick`, `stationWooden`, `kiosk`, `toilets`,
`alleyStall` (their doors from the shared kit: the owner found the mock-up
doors too big). New props: swings, slide, sandbox, drinkingFountain, hoop,
floodlight, plazaClock, redLantern, crates, acUnit, crossingGate (`down`,
`flash`).

**A map maker's check:** `makeTown` warns in the console when a layout
prop stands on a road or on a cross street's narrow sidewalk (it would
block the way); crossing gates are meant to.

**Stable maps:** each block's gardens and each strip of forest has its own
random sequence (`rngFor`), and every placed prop's seed comes from where it
stands, so adding something to a map never changes anything elsewhere
(checked: the town with and without the south area match above it, but for
the grass texture's dots).

**Cars and people never pass through each other** (the owner): every
vehicle has a footprint on the ground (its length and width turned with its
heading; the train its whole length on the rails). `local(v, x, y)` gives a
point `ahead` / `side` of a vehicle in ground units; `hits(x, y, margin)` the
vehicle standing there. **Giving way (the owner saw a jam: a walker on a crossing
held a car, the car held the junction):** a car held by someone on foot (`room`
sets `v.blocker`) for 1.2 s pulls out into the other lane when that is clear ahead
and they do not stand in it too (`dodge`, `steer`: across at 12 px/s, turned a
little, back once past them); held 3.5 s with no way round, it turns round into the
other lane (`uTurn`); held 6 s by anything, a taxi gives up the rank and drives on,
other cars turn round; a car that must turn and cannot fit may turn the other way
after 2 s. In the demo, anyone held up by a car steps aside (`offRoad`: the nearest
spot off the road, 5 px clear of cars, the way there not through one) after 0.6 s
on the road or 1.2 s beside it, and anyone held 1.5 s out on the road, whatever by,
steps off it. A pulling-out taxi waits 1.5 s for whoever stands beside it, then only
for someone right in its way. Cars stop for anyone on the road (not the sidewalk)
within their width from inside them to 12 px ahead; in the demo, people wait
instead of stepping into a vehicle (flying and floating monsters pass over),
give up and go elsewhere after 2 s of waiting (but never out on a crossing:
someone resting in their way steps aside after 0.5 s; on a crossing they
squeeze past anyone who cannot, after 0.6 s; no trip ends on the road; a dog
keeps to the other side of its owner rather than stand in the road), so a car and a person never wait for each other for good, and the keys will not walk you into one (`window.tinyTown.traffic.hits`
in the console).

**Cars never pass through cars:** besides keeping their distance in a lane,
each car looks ahead for any other vehicle by their footprints (`gapTo(v,
o)`: o's body turned with its own heading, measured along v's heading and
across it; within 26 px ahead), so cars crossing a junction or turning stop
for each other; when two are in each other's way, the one made first goes
(`id`), so they never wait for each other. Measured: 3 simulated minutes,
10 overlaps before, none after, traffic moving as much.

**People never pass through people** (demo/town.js `crowded`): everyone on
foot keeps a little room (4.5 px across, 2.5 front to back); a walker steps
round someone in the way if there is room, else waits (and after 2 s goes
elsewhere); people who overlap may only move apart; spawn points and trips
avoid spots where someone stands or is heading, and a walker whose spot is
taken stops short. A dog and its owner, and the flying monsters, are left
out. The keys will not walk you through anyone. Measured: a minute and a
half of the live town, 311 overlaps before, 1 after (a dog brushing past).

**Trains** (tinyTraffic, when the town has a railway): one train of four
carriages (`drawTrain`, side on, drawn at the people's size), slowing for
and stopping 3 s at each station building's middle, leaving town and coming
back the other way after a pause. `crossingClosed(j)`: the train within
reach of cross street j's crossing; the gates go down and flash, cars on
that cross street stop before the rails, `mayCross` keeps people off the
rails until it opens.

**Signs and icons:** signs show the place's name (`sign(r, bg, fg, dx, up,
w, h, text)`, `upright(...)` for a narrow sign read top to bottom) in
DotGothic16 (`SIGN_FONT`) through `r.text`: it picks the biggest size of 32,
24, 16, 12, 10 device pixels that fits the box, or returns false and the sign
draws dashes instead. It needs `dpx` (device pixels per canvas pixel): the
canvas is made dpx times bigger and the context scaled, so the pixel art
stays crisp and the letters get real pixels (town 4, the Buildings sheet and
catalogue cards 6). Painters moved sideways use `shifted(r, ox)` so they keep
`text`, `px` and `force`. Small pictures (crosses, letters, the clock) are
`icon(r, dx, up, rows, colours)`: rows of characters, one pixel each, so they
stay sharp and symmetric. The pages load DotGothic16 from Google Fonts and
draw static canvases again once it has loaded. Check a new building in the
town next to a person before committing.

**Scale:** `DEFAULT_TOWN.scale` is 1.5 (the owner wanted the town bigger
than the people). The layout is written at scale 1; `makeTown` multiplies
every position and size (`scaled`), street sizes come from `streetDims(k)`,
and each building, thing and plant gets `scale`; the drawings are made for
1.5, so in the town they are drawn pixel for pixel. People are never scaled.
The Buildings sheet and the catalogue show everything at 1.5 too.

The owner's rules: every building faces you and **its whole picture is solid
ground** (`buildingSolids`), so nobody is ever hidden behind one: to get past
you walk round it. Only the torii (between its posts) and the gas station
(under its canopy) can be stepped into; their drawings' `open` lists their
solid parts. **Tall buildings stand only in the back row** (above the
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

- **Sitting, flicking, wagging** (the owner, Nov 2026): standing still, an animal sits by turns
  (`sits`: 5 s on, 5 s off, out of step by its seed or place; `a.sit` true / false chooses),
  drawn by `sitting()`: side on the haunch (3 wide, 4 for big dogs) low at the back, the front
  legs straight, the chest, the head on top, the tail round the paws (a cat's tip flicking, a
  dog's sweeping); head on a body wider at the bottom, the head, ears, collar, the tail round.
  Coats: tabby stripes, calico patches, a tuxedo's white chest, dark points. A standing cat's
  tail tip flicks a pixel now and then (`flick`); dogs wag walking (7 a second) and standing (5).
  Head on a cat is 4 wide with a 4-wide head, ears two rows up, the tail standing beside it.

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
- Household weapons (`WEAPONS[name].household`): each has a `kind` (sword,
  axe, spear, shield) and does that kind's attacks (`actionsFor`; an
  action's `weapon` is a kind), with the same poses; `len` is how far its
  tip is from the hand (the trail). Drawn like the others along the line
  from the hand: a bat (taped grip, wider barrel), a folded umbrella (hooked
  handle, rolled cloth, metal tip), a golf club (long shaft, head turned
  out), a frying pan (a solid disc whatever the angle), a pickaxe, a
  sledgehammer (the owner: bulkier than the axe: a thick two-pixel handle,
  a big block of iron the same both sides with bright striking faces,
  filled in half-pixel steps so it stays solid at any angle),
  a broom (band, spreading straw); the wok is drawn like the shield, face
  on, its handle back towards the hand.
A new weapon: an entry in `WEAPONS` (with its kind and len) and a case in
`drawWeapon`; the catalogue adds its card and its attacks.
A new attack: a pose function in `POSES` and an entry in `ACTIONS`; a new
skill: a case in `drawSkill` and an entry in `SKILLS`. Check every frame
(a strip of six) next to a person.

## How nature is drawn (src/tinyNature.js)

**The breeze** (trees only; the owner chose gusts, B): `drawTree` with `t` draws the
cached image in horizontal slices, each row shifted by a whole number of pixels
(`breeze`): nothing below 30% of the height moves, the top up to 2 pixels; the lean
follows `sin(t * 1.6 - phase)` scaled by a gust wave `0.5 + 0.5 sin(t * 0.55 - x * 0.012)`
that rolls across the town from the left; the phase comes from the tree's place and seed.
Rows that move together are one `drawImage` (about +0.5 ms a frame by day). The town
passes `t` to every tree; bushes stay still.

Trees and bushes: `TREE_DEFS` / `BUSH_DEFS` in tinyNature.js are `[label,
w, h]` at scale 1; the drawings (see above) are 1.5 times that. **Each plant
is drawn once into a small cached image** (`plantImage`, 8 looks per type,
margins 15 and 12 px for what sticks out) and placed at the scale asked for
with nearest-pixel scaling; the seed picks a look and mirrors it. Forest
trees keep their trunks 20 px (scale 1) below a street so their crowns stay
off it. In the town, `plants`
in the layout (`{ tree: 'sakura', x, y }` or `{ bush: ... }`) block at the
trunk / the bush's base; areas with `solid: true` (the pond) block whole;
the grounds are drawn with `drawTerrain` (`TERRAIN_OF`), water again every
frame (inside the pond's pixel edge, `FULL_GROUND.pond.water`).

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

Each thing is an entry in `DEFS`: `[label, w, h, depth, lights]` at scale 1
(its drawing, in tinyStreetFull.js, is 1.5 times that; see above). `depth`
is the rows of ground it stands on (`propSolid`; `FOOT` narrows poles and
lamps to their pole so they never block a sidewalk); `lights` are `[dx, up,
radius]` for the night. Keep them small: a vending machine is 7 x 11 (scale
1), a lamp 19 tall, a utility pole 30 (the tallest thing on a street).

In the town (`placeProps` in tinyTown.js): the layout's `props` first, then
vending machines and bins where a row ends short of its cross street,
utility poles every 58 px on the far sidewalk of each street (none at the
crossings), street lamps in the gardens along the cross streets (their arm
over the sidewalk). Nothing goes where it would cover a building or another
thing (`fits`). Poles on the same street are wired (`town.wires`, drawn
over everything). Garden plants keep clear of things. Manholes are part of
the ground picture.

## How traffic works (src/tinyTraffic.js)

**Vehicles are small 3D shapes** (the owner compared them with a 3D car
sprite sheet turning round: every view must be the same car). `SHAPES[type]`
has its size in blocks (`L` long, `W` wide, `H` tall; one block = one pixel,
the people's size, not scaled with the town) and `shape(u, v, z, c, c2)`:
the colour of the block at `u` along it (+ its front), `v` across (+ its
right), `z` up, or null. `carShape(o)` builds the car-likes (more detail, the owner's A, Nov 2026: rims round a dark hub,
lamps in `RUBBER` surrounds, grille slats, `BUMPER` grey, door handles at `door` + 2 and
`door2` + 2, a lighter crease under the windows, `RUBBER` along the windows' bottom, the roof's
rim darker, a `GLINT` on the windscreen): wheels (tyre and
hub) in dark arches, the lower body (bumpers, white plates, twin headlamps,
grille, tail lamps, a side skirt, the doors' line, a stripe for taxis and
vans) up to `body`, then a cabin a block narrower each side whose front and
back slope in (`cabF` / `slopeF`, `cabB` / `slopeB`: windscreen and rear
window), glass to a roof one block thick, pillars, mirrors; `panel` makes a
van's sides solid, `extra` adds things above (the taxi's roof sign). The
kei truck and the bus have their own shapes (the open bed with a load; the
bus's windows, kerb-side door, destination, air conditioning).

**Drawing** (`sprite`): the view is the town's: walls at full height, tops
at 0.6 of their depth (`KY`), seen from in front and above. For each pixel
the renderer walks along the line of sight from the top down until it meets
a block, and shades it by the face it hit: tops light (1.1), faces towards
the light (`LIGHT`, from the upper left) brighter, faces away darker; glass
one tone on its slopes and darker on the side windows (no stair steps);
lamps unshaded. Sprites are made for 16 headings, once per type and colours,
and kept (`SPRITES`). `drawVehicle` takes `heading` (degrees; 0 right, 90
towards you) or `facing`, and its (x, y) is the middle of the vehicle on the
ground. `VEHICLES[type].box` is the largest sprite (for cards). A car is
30 x 13 x 11.5 blocks (about 30 x 16 px side on, 13 x 24 head on), a kei car
24 x 12 x 13, a bus 54 x 16 x 19. The seed picks colours (`CAR_COLORS`,
taxi and bus liveries). To add a vehicle: add a shape (start from
`carShape` with other numbers) and check it at all 16 headings.

**Lamps that change and snow** (`sprite(type, c, c2, dir, { brake, blink, snow })`, each
state its own cached sprite): a wrapper over the shape turns the tail lamps `BRAKE` red
and the bottom middle of the rear window into a high brake lamp (`v.brake`: slowing, or
standing); the outer lamps (front and back) of the side `v.signal` ('l' | 'r'; +v is
the vehicle's right) `AMBER` while `v.blinkOn` (2.5 blinks a second; `v.signal = 'h'`: hazards, both sides, blinking while it stands); with `snow` (the
town in winter) the roof's top blocks white. `vehicleLights` adds a bigger red glow
when braking and an amber one when blinking. Turns are planned 40 px before the lane
(`v.plan`, `v.planFor`; `turnSide` gives the side; the signal stays on until the
vehicle has swung round). drawTownView draws `drawVehicleBeams` faintly ('lighter', 70 %)
under everything on a dark day (rain, storm, fog) so the headlamps show.

**The time on the town** (demo/town.js `drawClock`, after the view and the speech, so the night
does not darken it): a plate (`rgba(32,36,44,0.78)`) at (4, 4), 34 x 11 town pixels, a sun
(from 5:30) or a moon (from 19:00), the time in 3 x 5 pixel numbers (`DIGITS`), ten minutes
at a time, like the small clock by the buttons. The demo's clock runs one town hour every 8 s
(`hour += dt / 8` while Time is passing).

**The police car and the fire engine** (`police`: `carShape` with `twoTone`, the body below the
windows all `c2` black, white above, a light bar `extra`; `fireEngine`: its own shape). A shape
takes a sixth argument, `flash` (0 | 1, or null for lights off): their roof lights are `LIGHT_ON`
on the side `flash` picks, `LIGHT_OFF` otherwise; `sprite(..., { flash })` caches each state;
`drawVehicle` passes `v.siren ? v.flash : null`, and the traffic sets `v.flash` (4 a second) while
`v.siren`. `vehicleLights` adds a red glow on the roof at night. The police car (`makeTraffic({
police: 1 })`) turns its siren on for 12-22 s every 40-90 s (`v.sirenT`) and drives at 1.3 x
while it is on. `traffic.callOut(type, spot, secs)`: a vehicle pulls out from a spot on the
sidewalk (`driftY`) into the kerb-side lane of the street below, siren on, drives freely for
`secs`, then, once it leaves the town, comes back along that street (a `route` with a `home`
stop) and is gone when it reaches the spot. The demo (`fireCalls` in demo/life.js) calls the
fire engine out from the fire station's door 40 s in and every 150-240 s. The respawn at the
town's edge keeps any type not in `TYPES` (the bus, two wheels, the police car, the fire engine).

**The rubbish truck** (`rubbishTruck`, a shape like the bus's; the owner chose the green cab)
and **rounds**: `traffic.sendRound(type, spots)` sends a vehicle round places on the sidewalk:
each becomes a stop on the kerb-side (east-bound) lane of the street below it, at its x plus
0.42 of the vehicle's length (its back by the spot); the vehicle comes in from the west edge,
does not turn, stops at each (`v.atStop`, `v.wait` 99) until let go (`v.wait = 0`), leaves at
the east edge, comes in on the next stop's street, and is gone when all are done. The demo
(`collect` in demo/life.js) sends it once a morning (from 7, while the bags are out, which
stay out while it is still on its round), walks a worker (`WORKER`, light blue, a cap) from
the truck's back to the pile and back with a bag, hides the pile (`collected`, until 6 the
next morning) and lets the truck go. A round of the three piles takes about 85 s.

**City bikes** (tinyLife's `cityBike`, through the `ride` pose with `p.city`; the owner chose a
mix with the plain bike): a low step-through frame in `p.bike`, a wire basket at the front
(`p.load`: a pixel of shopping in it), a lamp under it, a rack behind (`p.child`: a kid in a
dark seat on it, drawn by `upper`), a white helmet (`p.helmet`, the schoolkids); smaller wheels
for a kid. The demo's two schoolkid cyclists and the child come from their own stream
(`seeded(77)`), so nothing else in the town changes. **Bike parking** (`bikeParking`, a prop,
36 x 12 at scale 1, 54 x 18 drawn; rack B): ten bikes end on from behind, every other one 2 px
further in, a mudguard in the bike's colour with a red reflector, the rack, the saddle, the
handlebar and (four in five) a basket beyond, a rail in front.

**Scooters and motorbikes** (`moped`, `motorbike`; the owner chose flat like the people, A):
tinyLife's `drawMotorbike` draws them the way `drawScooter` draws the delivery scooter (side on
for headings near 0 / 180, else head on or from behind), the rider by `upper` with a `helmet`
over the head; `motoLook` picks the colour (`MOPED_COLORS`, `MOTORBIKE_COLORS`), helmet and
rider from the seed. `TWO_WHEELS` (with the delivery scooter) have one headlamp; their brake
lamp is a brighter pixel, the signal an amber pixel at both ends (side on, only for the side
you see) or at the end of the handlebar (head on). `makeTraffic({ motorbikes: 4 })` (one in
four a motorbike). Squeezing to the front: in `room`, a two-wheeler with a red or yellow light
within 140 px (`redAhead`) looks past four-wheeled vehicles standing still in its lane; while
it passes one (`v.squeezing`) and while it waits slowly at the front, it moves 6 px towards the
kerb on its left (`v.kerb`), back to the lane's middle once it gets going.

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
the north half of a street, west-bound in the south half; `vLanes`: south-bound
on the east side of a cross street, north-bound on the west). The lights
(`signal`): a 16 s cycle per junction, offset by its place (street green
6 s, yellow 1.5, all red 1, cross street green 6, yellow 1, all red), set
on the traffic light props each update. Each update, `room(v)` is how far
a vehicle may go: to the back of the one ahead in its lane, to the stop
line of a red (or late yellow) light, to anyone standing in front of it;
it speeds up (40 px/s²) and brakes (90) toward 30 px/s (a bus 24). Turns:
passing a cross street's lane, a car may turn into it (30 %); going along a
cross street it may turn at each street and must turn at the last one.
Vehicles swing round to a new heading when they turn (280°/s), and only
turn into a lane with room (a car that must turn waits for a gap). Buses
stay on the west-bound lanes (the kerb on their left) of streets with bus stops and wait 2.5
s at each. Vehicles leaving the town on a street come back in at the edge
of another. `mayCross` stops someone on foot from stepping onto a crossing
unless that crossing's cars have red (the walk signal is green then).

## How seasons and weather work

The owner chose all four seasons and heavy rain with umbrellas (C) from mock-ups
(Nov 2026). `drawTownView(..., { season, weather })`; no season means the town as
drawn (so pictures without one are unchanged).
- **Plants** (`inSeason` in tinyNature.js, on each cached plant image, keyed by
  season): leaf greens (and the cherry's blossom) are mapped, darkest to lightest,
  onto a ramp of the season's colours (`RAMPS`: spring greens; the cherry in leaf
  for summer; three autumn ramps, red, orange, gold, by the plant's look; a browner
  ramp for autumn bushes), so a plant keeps its shading on a few clean colours.
  `EVERGREEN` plants keep their greens. Winter: leafy trees are drawn as the `bare`
  tree, and every edge of a tree or bush that faces up gets two rows of snow.
- **Buildings:** `drawBuilding({ snow: true })` sets `setSnow` in the kit while it
  draws, so `flatRoof`, `pitched`, `gable` and `dome` draw their tops under snow
  (`SNOWC` colours); parts with their own roofs ask `snowing()` (the chapel's gable,
  the villa's barrel tiles, the Tudor tiles, the torii's beams, the stone lanterns).
- **The ground** (`groundInSeason`, cached per town in `town.grounds` by
  `groundOf`): lawns mapped onto a spring or autumn ramp, with petals and flowers or
  fallen leaves dotted by a hash of the place; winter puts lawns, sand, dirt and the
  sidewalks under snow, dusts gravel and paving, and leaves the roads clear.
- **Rain** (`drawRain`, over everything, after the night; the owner found it too harsh
  twice): a faint `multiply` grey, about one 3-pixel see-through streak (22-38 %) per
  1200 pixels of view falling gently at a slant (a view's height in about 8 s, by `t`,
  nothing random), very few half see-through splashes; the wet ground has `puddles` on roads and
  sidewalks. In winter it snows: white flakes drifting down slowly (half the rain's
  speed), no puddles.
- **Footprints** (the owner: everything leaves them, in snow and rain, but the town must
  not fill up with them): the demo's `footprints` adds a print for everyone walking
  (people, you, cats, dogs, the monsters that walk; a bicycle leaves a 1 px tyre track)
  off the roads (in the snow only where the ground lies under snow: `snowyAt` compares the
  winter ground with the ground as drawn, once, so none on the court or the water; the
  owner), every 4 px (animals 3, bikes 2), left and right by turns: pale in the
  snow (25 s), dark and 40 % see-through in the rain (10 s); each walker keeps only the
  last 60 px of its trail (`addPrint`, `TRAIL`). `drawTownView({ prints })` draws them
  ({ x, y, w, c, alpha, age }) after the ground, before everyone, half as strong once
  half their time is gone. The demo puts walkers' umbrellas up
  (`dryCarry` keeps what they carried) and picks the season by the real month and
  rain spells by the town's day and hour (`rainingNow`).
- **Wind, fog and thunder** (the owner chose them from animated mock-ups, Nov 2026: wind
  yes, fog B, thunder B): `weather: 'wind' | 'fog' | 'storm'`, all by `t` and hashes,
  nothing random.
  - Wind (`drawWind`, in the air before the night so the dark covers it): autumn leaves
    or spring petals (`BLOWN`; other seasons none; the owner: calmer), one per 1500 pixels
    of view, drifting 12-22 px a second across the view with a slow wobble, turning over
    (2 × 1, 1 × 2, 1 × 1). Trees get `wind: true`: `breeze` leans them a little further
    over (up to 2 pixels), steadily, gently tossing.
    Buildings get `wind: t`: drawBuilding sets `setWind` in the kit and `laundry` blows
    the top of each shirt and towel a pixel over now and then (`flap`, slowly; with no wind the
    washing is drawn exactly as before).
  - Fog (`drawFog`, before the night, so the lights shine through it): two layers of
    value noise (`vnoise`), worked out every 4 pixels and filled in between, drifting
    slowly in town pixels; three steps of `#e8ecef` (18, 32, 46 %), drawn as runs of a
    row; about 1 ms a frame.
  - Thunder (`drawThunder`, last of all, in a storm, not in winter): in each 9 s three
    times in four a strike (`flashOf`): the view flashes twice (brighter at night) and
    for 0.3 s a jagged bolt (white on a pale blue edge, now and then a fork) strikes
    from the top of the view.
  - The demo: `weatherNow()` (auto: of each 3-hour spell's hash, 7 % storm, 15 % rain,
    10 % wind, 20 % fog in the spells from 3 to 9 in the morning; the rain spells are
    the same as before); in winter a storm is snow.
- Putting a town in a season the first time recolours its ground once (a fraction
  of a second); after that it is cached.

## How day and night work

`drawTownView`'s `night` (0 to 1) runs `drawNight` after everything else:
1. a `multiply` tint over the view: white by day, warm orange at dusk
   (strongest at night 0.35), deep blue (`#4c5494`) at night
2. the lights come on from night 0.25 (full at 0.7): each building in view
   is drawn again with `lights: true`, into a layer of its own in the
   scene's back-to-front order (`lightLayer`): every thing first wipes its
   shape out of the layer (`destination-out`), a building then adds its own
   lights, so lit doors and windows never cover people in front of them, nor
   shine through a building in front (the owner saw people pass behind a
   station's lit doors); its painter (`nightLights` in
   tinyBuildings.js) draws only colours in `NIGHT` (lit rooms, curtains,
   shop glass, neon, lanterns `LANTERN`, the karaoke's glass), each as its
   lit colour, plus 45 % of the dark windows (`WIN`), picked by a hash of
   the building's seed and the window's place, so the same windows are lit
   every frame; signs (`sign`, `upright`) draw through `r.force`, so they
   are always lit
3. soft glows (`lighter`, radial gradients) round every light:
   `propLights` (lamps warm, vending machines white, a traffic light's lit
   lamp and walk signal) and `vehicleLights` (small glows on the two
   headlamps and two tail lights, each only when its end faces you)
4. the light the headlamps throw on the road (`drawVehicleBeams`: one
   smooth oval pool ahead of the car, the owner's choice over cones and
   pixel beams; further out when the car drives away) is drawn into a layer
   of its own, every vehicle is painted out of it (`destination-out`), so
   the light falls on the road and never over a car, then it is added to
   the picture
A new building's lights come for free if it uses the shared colours (`LIT`,
`CURTAIN`, `GLASS` ...); a new thing that shines gets `lights` in its
`DEFS` entry. The demo's clock (`hour`, `nightAt` in demo/town.js): night
from 20 to 5, day from 7 to 17, easing between.

## How speech works (src/tinySpeech.js)

The owner's choices: icon bubbles in the town (1C), floating text when you
tap someone (1B), typing out (1E), passers-by chatting (1F), lines that suit
the speaker (1G); English now, ready for Japanese and Indonesian.
- An actor carries `say` ({ text, start, until }: floating text) or `mood`
  ({ icon, start, until }: an icon bubble); `speak` / `emote` set them,
  `drawSpeech` draws them (after the town and its night tint, so they stay
  bright) and clears them when their time is up. A line hides any icon.
- Floating text: DotGothic16 at 7 px (crisp because the town canvas is drawn
  4x bigger underneath), white with a 1.6 px ink edge, no box; it types out
  at 18 letters a second (placed by the whole line, so it does not jump),
  holds 1.8 s, then rises 6 px and fades in 0.8 s (`sayDuration`); `bounds`
  keeps it inside the view. It sits over `topOf(actor)` (a person's head
  and hat from `headOf`; a height for monsters, cats and dogs).
- Icon bubbles: 9 x 9, ink edge, white inside, a 2 px tail, a 5 x 5 picture
  (`ICON_ART`); they pop up a pixel as they appear.
- Who says what: `kindOf` reads the look (police top, boxes, a sailor or
  gakuran uniform, kid, suit or briefcase, grey or white hair or a stick,
  umbrella, bag, else adult; cats, dogs, each monster); `LINES[lang][kind]`
  has the lines, `MOODS[kind]` the icons they show now and then (more Z at
  night).
- **Another language**: fill `LINES.ja` / `LINES.id` with the same kinds
  (anything missing falls back to English), then `setLanguage('ja')`. When
  writing Japanese lines for the owner, give the reading, the English and
  grammar notes. Keep lines short (the town view is 200 px wide).
- In the demo (demo/town.js `life`, `chatting`): everyone gets a mood every
  8-24 s; every 2-5 s two people (not monsters, animals or you; off the
  road) within 16 px of each other may start a chat for 4-7 s: they stop,
  face each other and take turns with icons every 1.25 s. Tapping someone
  makes them say a line and stop while they say it.

## How small life works (src/tinyLife.js, demo/life.js)

The owner chose all of it from mock-ups (Nov 2026). The library only draws;
the demo decides who does what.
- **Poses**: a person with `pose: { kind, u }` is drawn by `drawPose`
  (drawTownView does it for any sprite with `pose`). Each pose draws the body
  and head with `upper()` (drawCharacter clipped above the legs) and its own
  legs: `sitBench` (front: thighs towards you over the seat, shins down;
  side: thighs along the seat; stand them at the bench's y + 0.5 so they
  sort in front of it), `sitGround`, `ride` (a bike under them, pedalling
  while `walking`; `p.bike` its colour), `bow` (head and body 2 px down),
  `sweep` (the broom from tinyCombat), `kick`, `throw` (crumbs fly),
  `drink` (`p.can`), `slide`. `u` (0-1) is how far through a move.
- **Sprites with their own drawing**: any sprite with `draw(g, s, t)` is
  drawn by it, sorted with the people (pigeons: scared, each bird flies on its own, a
  moment sooner or later, its own height, 10-26, and a curve out to the side up to 20 px,
  a flutter, landing up to 13 px from the flock's new spot; `FLIGHT` 2.9 s; the owner:
  together they looked like one big animal), the ball, rubbish, the
  picnic blanket); `drawTownView(..., { above })` draws a list over
  everything, after the wires (the crows). `steam: (g, x, y, t, seed) => ...` swaps the
  steam's drawing (used to try styles out; the default is `drawSteam`). `lights: 'soft' | 'bands' | 'dither' |
  'mixed'` sets how the night's glows and headlight pools are drawn (all added
  up in one layer, then turned into pixel steps or dots by `pixelLight`;
  the light on the ground, lamps' and headlights', has every vehicle and
  everyone on foot painted out of it, so it never washes over them; a
  vehicle's own lamps are added on it after; anyone standing in a light
  takes on its colour (`litUp`, the owner's choice C): drawn again in day
  colours, multiplied by the light's colour, judged by where their feet,
  middle or head (a vehicle's body) are in the glow as drawn: 80 % in its
  inner step (or right in front of a car), 40 % in its outer step, none
  outside; lit copies go under the light layer, so a car's own lamps show; whatever stands in
  front of them is painted out of that copy;
  'bands', three flat steps, is the default: the owner's choice; the demo
  takes `?lights=soft|dither|mixed` and `?time=night` in its address).
- **Swings in use**: a swings prop with `riders: [{ angle, kid } | null,
  ...]` is drawn by `drawSwings` (each seat at its own angle); without
  `riders` it is the plain prop.
- **Buildings**: `b.laundry` hangs washing (and on the top floor sometimes
  a futon) on apartment balconies and the wood apartment's rail, with an rng
  of its own so the building itself never changes; `b.shut` pulls a shutter
  over shops that close (`closes(b)`: not the konbini, ramen or izakaya; at
  night it also wipes their light); at night each window has its own
  rhythm (`b.time`, passed by drawNight), going dark and lighting up.
  Steam (`drawSteam`) is four round puffs on the pixel grid, growing as they
  rise and fading from 70 % to nothing (the owner's choice, B; no soft shapes).
  `cooks(b)` says which steam (ramen shops, the yakitori stall, takoyaki,
  udon, the kiosk; drawTownView draws the steam).
- **The town draws by itself**: lanterns sway (`p.sway`), petals fall round
  every sakura, ducklings follow the first duck, and when a pond has
  `feedAt: { x, y }` the ducks paddle over (`pull` eases in and out).
- **Traffic**: `makeTraffic(town, { scooters: 1 })` adds the delivery
  scooter (drawn flat by `drawScooter`, one lamp; `VEHICLES.scooter`);
  `traffic.pickUp(parkedTaxi)` takes a taxi from `town.parked`: it pulls out
  into the nearest west-bound lane (turned a little while it drifts across),
  drives off and is gone; 20-35 s later another comes along that lane and
  pulls into the same spot.
- **The demo** (`makeLife({ town, traffic, people, rng })`, returning
  `{ update(dt, t, hour), sprites, above }`): people with `busy` are left
  alone by the demo's walking; `away` hides someone (shopkeepers at night,
  the picnic and playing kids after six, commuters still inside the station).
  Jobs (`give(p, { to, dur, start, each, end, drop })`) walk someone
  somewhere, then do something for a while: a bench (two seats each, 10-22
  s), a vending machine (5 s), feeding the ducks (12 s, by day), getting
  into a taxi. Laundry 8-16, shutters 21-7, rubbish 6-11, sweeping 6-10.
  Commuters come out one by one when the train stops and go home when they
  get where they were going.

## Common tasks

- **A new look part:** add a value to the list (`HATS`, `TOPS` ...), draw it
  in `drawCharacter` with a few `R(...)` calls relative to `B` / `Hd`, add it
  to `parts` in `demo/demo.js` (the Looks canvas) and its caption in
  `index.html`, describe it above. Check it at real size first: if it does
  not show at 5 × 15, it does not go in.
- **A new starter look:** add it to `LOOKS` (it shows in the Looks canvas's
  top row; add its name to the caption).
- **A new building:** add its label and two or three widths at the end of
  `TYPES`, and its drawing to a part file in `src/full/` (`approved: false`)
  with the kit's sizes; let the seed choose its floors, windows, door and
  roof (see above). Show it to the owner (before / after or options, on the
  real town), then set `approved: true`. Put it in the town by adding it to
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

- **A refactor must not change a pixel.** Before it, render everything that
  is deterministic and keep a hash per picture (the whole town by day, at
  dusk and at night with traffic and people from fixed seeds, the town's
  layout, the Buildings sheet, every catalogue card with the clock frozen
  and Math.random seeded); after it, render again and compare: all equal.
  (Done for the Nov 2026 clean-up: 210 pictures, all the same.)

No build step. Serve the folder (`python3 -m http.server`), open the page,
and check with Playwright screenshots on a desktop size and a phone
(`devices['iPhone 13']`), with no page errors.

- **Look at a place, at an hour:** in the page, `window.tinyTown` is `{ town,
  traffic, you, people, life, hour }`; set `tinyTown.hour = 22`, move
  `tinyTown.you.x / .y` (e.g. to an area: `town.areas.find(a => a.name ===
  'Station plaza')`), wait a moment, screenshot `#town`. `?time=night` in the
  address starts at night.
- **Mock-ups for the owner:** import the modules in `page.evaluate` and draw
  a view yourself: `drawTownView(g, town, view, sprites, t, { dpx, night,
  lights, steam, above, petals })` on a canvas of `view.w * dpx` by `view.h *
  dpx` with `g.setTransform(dpx, 0, 0, dpx, 0, 0)`; side by side with labels
  (PIL), or frames into a GIF for anything that moves. For a layout change,
  copy `DEFAULT_TOWN`, change it, `makeTown(copy)`.
- **Traffic flows:** every second for 100 s, count how long each vehicle has
  had `speed < 0.5` without `wait`; none should reach 15 s (if one does, log
  who is near it: people standing on the road, a dog, a crossing). Run several
  at once (it is random): five 200 s runs that screenshot and log the scene when a
  car has waited 20 s caught the taxi rank and forced-turn deadlocks. Also stand
  `you` still on the road (mid-street and in a junction) for 25 s: cars should
  wait at most about 7 s before going round or turning.
- **People do not overlap:** every 0.5 s for 90 s, count pairs closer than
  3.5 px across and 2 px front to back (leave out dogs with their owners and
  the flying monsters); about 20 is normal now. Count anyone inside a
  vehicle's footprint (`traffic.hits(x, y, 0)`): 0.
- **Speed:** draw 120 views across the town by day and at night with 60
  people and the traffic: about 1.2 ms and 5 ms a frame. A view full of forest:
  about 4 ms by day and 7 ms at night (it was 7 and 10 before runs of plants
  went into a half-resolution layer, `plantLayer` in drawTownView) (CDP `Emulation.setCPUThrottlingRate`
  4 for a phone-like CPU: about 18 and 35 ms). At night, plants that overlap no
  building drawn before them are not drawn into the light layer (nothing to wipe).
- **The map:** render the whole town (a view the size of `town.W` by
  `town.H`); the console warns about any layout prop on a road or a cross
  street's sidewalk.
- **A redrawn or new drawing:** pictures per type (several seeds, day and
  night) and in the town; a changed drawing keeps the same rng calls in the
  same order (so seeds stay the same buildings; count them for many seeds
  with a painter that only records) and its size within the space it had;
  and the hash check: only the changed types (and town views) may change.

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
