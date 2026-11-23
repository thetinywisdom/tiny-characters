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
                       SHOP_TYPES, drawStreet, WALL_COLORS, ROOF_COLORS
index.html             the demo page (town, park, looks, buildings, gallery)
demo/demo.js           the demo: strolling crowd and cats, you (keys / tap
                       to walk), tap someone to make them talk; every look;
                       the gallery
demo/town.js           the town (one long street of every building, the view
                       following you) and the Buildings sheet
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

- kid: legs 2 rows, body 4, same head: 11 px tall
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

Every building faces you: a front wall, a little roof on top (a flat roof
shows its top as a light band over a darker parapet line; a pitched roof is
rows narrowing to the ridge), windows, a door, and one or two details that
make it that building. Each is an entry in `DEFS` in `src/tinyBuildings.js`:
`[label, width, height, draw(r, rng, b, wall, roof)]`.

- `r(colour, dx, up, w, h)`: a rectangle `dx` from the left edge whose
  bottom is `up` pixels above the ground line. Keep everything inside
  `0 .. width` (signs, bikes, post boxes too) so buildings in a row do not
  overlap; shift the building with a wrapping `r` if something stands beside
  it (see the koban and the family restaurant).
- Pieces: `win` / `windows` (glass, sometimes lit or curtained by `rng`),
  `flatRoof`, `pitched` (top width 1–4 for a gable, wider for a hip roof),
  `awning` (2 px stripes), `sign` (a band with a row of "letters"), `glass`
  (shop glass with frame lines), `door`, `noren`, `lantern`, `dots` (books,
  flowers, goods), `shopFront` (the six shop kinds).
- Sizes: ground floor 15–20 px, upper floors 12–14, door 6 × 13, windows
  about 5 × 6. A person (15 px) reaches three quarters of a door.
- Colours: the catalogue's walls and roofs (`WALL_COLORS`, `ROOF_COLORS`),
  glass `#9fb6cc`, windows `#5f7487` (lit `#f0dca0`), wood, ink, red, navy.

People in front of a building are drawn after it (their feet are below its
ground line); anyone behind it (smaller y) is drawn before it and hidden.

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
  size), add it to `ORDER` in `demo/town.js`; the Buildings sheet picks it up.
  Check it next to a person.
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
