# SKILLS: how Tiny Characters works and how to extend it

Read this before changing anything; `PLAN.md` says what is done and next.

## What this is

The tiny 2D pixel people from Tiny City Builder's bubble lab
(thetinywisdom/character-creator, `labs/bubble-lab.html`), as a library.
The owner chose these as the start of this repo.

## Files

```
src/tinyCharacters.js  the library (plain ES module, no dependencies):
                       drawCharacter, drawCat, drawStage, randomCharacter,
                       LOOKS, seeded, headOf, snapToPalette, COLORS, the
                       colour lists and the look lists (HAIRSTYLES, HATS,
                       TOPS, LEGWEAR, CARRY)
src/tinyBuildings.js   the buildings (plain ES module, imports seeded from
                       tinyCharacters.js): drawBuilding, BUILDINGS,
                       SHOP_TYPES, buildingSolids, drawStreet,
                       WALL_COLORS, ROOF_COLORS
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

- shadow: 7 × 2 at (x − 3, y), the shadow colour
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
  cats only face left / right
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
- cat (`drawCat`): 5 × 2 body, 2 × 2 head with an ear, a 2 px tail, legs
  that swap when walking; facing right by default

Keep them this small and this simple: that is what the owner liked. Looks
the owner turned down (too small, or not wanted) are listed in `PLAN.md`
under Decisions; do not add them back.

## How a building is drawn

Every building faces you: a front wall, then its roof **seen from above**
(8–18 rows, as in a top-down town map: this is what gives a building its
depth), windows, a door, and one or two details that make it that building.
Each is an entry in `DEFS` in `src/tinyBuildings.js`:
`[label, width, draw(r, rng, b, wall, roof)]`. The height in `BUILDINGS` is
measured from the drawing (the top of its highest rectangle, the tallest of
40 seeds), so it always includes the roof and anything on it.

**Buildings that vary by seed** (the mosque): draw every choice from `rng`
(the building's seed), keep the width fixed, and add a few seeds that show
the variations to `VARIED` in `demo/town.js` (the Buildings sheet shows
each). The mosque picks its wall, dome colour (green, gold, blue, white,
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
- signs show a short centred word (`sign`), not letters edge to edge; shop
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
  and building types packed 2 px apart, `'shop:ramen'` for a shop kind),
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
- The demo: you move with the keys (each axis checked on its own, so you
  slide along walls) or along a path to where you tapped (a building: its
  door, `doorOf`); townspeople take short trips (`randomSpot`, then a path)
  and rest; kids stay in the schoolyard, some people in the shrine grounds
  and the square (`within`); `placeAt` names where you are.

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
  size); the Buildings sheet picks it up. Put it in the town by adding it to
  a row of `DEFAULT_TOWN` (tall ones in the back row only). Check it next to
  a person.
- **Change the town:** edit `DEFAULT_TOWN`; render the whole map once
  (`drawTownView` with the view the size of the town) and check nothing
  overlaps a street or another building.
- **Put something new in the catalogue:** people come from `PEOPLE` (a
  starter look and its kinds), buildings from `BUILDINGS` automatically;
  give a new building its kind in `KIND` (Homes, Shops & food, Civic,
  Worship) and `EUROPEAN` if it is, and add it to `SHAPE_BY_SEED` if its
  seed changes its shape, not only its colours (all in `demo/catalogue.js`).
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
