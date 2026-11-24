# PLAN: Tiny Characters

## Goal

A home for the tiny pixel people the owner liked in Tiny City Builder's
bubble lab, so games can use them and they can grow.

## Decisions (agreed with the owner)

- The demo is on GitHub Pages, served from `main`; every update is pushed
  to `main` right away, without asking.
- The characters are the bubble lab's tiny 2D pixel people (about 5 × 15
  pixels), kept as small and simple as they are there.
- Roofs (Nov 2026): like a top-down town map, every building shows its roof
  from above (8–18 rows), so it has depth; tile rows and a ridge on pitched
  roofs, a rim and rooftop things on flat roofs, front gables with the roof
  running back. Every roof fills its whole rectangle; a hipped roof's ends
  are darker triangles at its sides, not cut-away corners (consistent with
  the gables).
- The town map (Nov 2026): every building's whole picture is solid ground,
  so nobody walks behind one (walk round it); tall buildings only in the back
  row; low buildings in the blocks; the shrine, school and old town get their
  own grounds; the map stops at its edges (no wrapping).
- Shadows (Nov 2026): no shadows, except under floating and flying
  monsters (ghost girl, reaper, flaming skull), which have a 30% black one.
- Greenery (Nov 2026): the map is full of greenery; every unreachable area
  is visibly blocked by forest.
- Signs and type (Nov 2026): signs show the place's name instead of dots
  or stripes, in DotGothic16, **in English** (also the Japanese shops:
  RAMEN, KONBINI, not ラーメン); the pages use DotGothic16 too.
- Doors and windows (Nov 2026): one set of sizes and proportions on every
  building (storeys 16 / 19 / 13, doors 6 × 12 and 10 × 12, windows 5 × 6,
  9 × 6, 5 × 8, sills 4 above the floor), and detailed types that show what
  they are (wood, glass, sliding, shoji, steel ...).
- People (Nov 2026): four views (front, back, both sides); walking up shows
  the back. The town is drawn 1.5 times bigger than the people.
- People (Nov 2026): no eyes, they stay faceless; different sizes are fine
  (tall, short, kids); everyone gets hands, shoes, a shaded side, a collar and
  hem on plain tops, and sometimes a fringe, so they look less generic.
- Looks from the catalogue (Nov 2026): keep mohawk (3 px tall), moustache
  (1 px only) and the cat (side view); umbrella with an 11 px canopy;
  ponytail out from the back then 5 px down, swinging out on the walking
  step; no twin tails, beard, helmet, tank top; none of the "maybe" parts
  (flu mask, wings, bulky build, shoes or boots: too small to matter).

## Done

1. **First version**: the library (`src/tinyCharacters.js`: draw a person,
   the stage, random looks, seeded crowds, palette snapping), drawn exactly as
   in the bubble lab, plus walking steps, facing, skin and leg colours; the
   demo page (a park to walk around in, tap to talk, a gallery); README,
   SKILLS, PLAN, CLAUDE.md.
2. **GitHub Pages** for the demo, from the root of `main`
   (https://thetinywisdom.github.io/tiny-characters/), with `.nojekyll`.
3. **Looks from tiny-catalogue's people**, kept to what shows at 5 × 15:
   kids; hairstyles (bald, long, ponytail, afro, bun, mohawk); moustache;
   cap and wide hat; jacket, suit, apron, yukata, sailor uniform, gakuran,
   police uniform; shorts and skirt; backpack, bag, briefcase, umbrella,
   walking stick, boxes; a cat (`drawCat`); starter looks (`LOOKS`); random
   looks use them; the demo's Looks canvas shows every one, and cats wander
   the park.
4. **Tiny buildings** (`src/tinyBuildings.js`): all 31 of tiny-catalogue's
   buildings as pixel facades (Japanese town, shop kinds, civic buildings,
   the European old town), `drawStreet`; the demo's Town (one long street
   you walk down, the view following you, "In front of: ..." under it) and
   a Buildings sheet.
5. **A 2D town map** (`src/tinyTown.js`): four streets, two cross streets with
   crossings, tall buildings along the back, two rows of low blocks, shrine
   grounds (torii, stepping stones, hall), a schoolyard and an old-town
   square; solid buildings, path finding round them, tap a building to walk
   to its door; townspeople taking trips and turning at corners, kids in the
   schoolyard, cats; the name of where you are under the map.
6. **Roofs with depth**: every building's roof seen from above (`flatRoof`,
   `pitched`, `gable`), building heights measured from their drawings, the
   town's blocks made taller to fit, a warning if a building reaches into a
   street. Hipped roofs fill their rectangle too.
7. **A mosque** (the owner asked; not in the catalogue): seeded variations
   (wall, dome colour and size, one or two minarets, side domes, windows,
   trim); eight of them on the Buildings sheet, one in the town's back row.
8. **The catalogue page** (`catalogue.html`): every person, cat and building
   on a card; filters by group, kind and name (kept in the address); a seed
   per card to type or roll, shuffle all, seed 0 for all; copy the code line;
   `lookFor(name, seed)` in the library for seeded people.
9. **Less generic people**: hands that swing, shoes, a shaded side, collar
   and hem, fringe (left / right), sizes (tall 17 px, short 14 px); random
   and seeded looks use them; the police officer is tall, grandma short.
10. **Four views and a bigger town**: people show their back walking up, their
    front walking down, a side walking across (`facingFor`); the Looks
    canvas shows the four views, catalogue cards turn round; the town is
    drawn at scale 1.5 (`scale` for buildings and towns), people stay 15 px.
11. **Doors and windows**: audited every building (doors were 5–8 × 11–14,
    windows 4 × 4 to 7 × 9, sills anywhere); one set of sizes; a kit of 10
    door and 15 window types with detail; every building rebuilt on it;
    `drawPart` / `PARTS` and a Doors & windows group in the catalogue.
12. **Review at town scale** (the owner saw broken crosses and random
    stripes): even scaling (same size for every rectangle), patterns on
    even steps, pixel icons (crosses, P, clock, chapel cross, 〒), centred
    sign words, even shop-glass bars, shelves, hipped roofs without teeth,
    Tudor windows (no "faces"), the Dutch roof, the koban's lamp, the
    izakaya's noren.
13. **Names on the signs** in DotGothic16 (laundromat, pharmacy, konbini,
    ramen, ...; karaoke and the shop-with-flats on upright signs): canvases
    drawn 4-6 times bigger underneath (`dpx`) so the letters fit, a
    fallback when they do not; the pages' headings and buttons in
    DotGothic16.
14. **Animals and nature**: cats with four views and coats (tabbies, black,
    white, tuxedo, calico, Siamese, brown); dogs (shiba, corgi, dachshund,
    poodle, pug, labrador, husky, dalmatian) with collars, tail wags and four
    views (`src/tinyAnimals.js`); 15 trees, 10 bushes, 10 terrains
    (`src/tinyNature.js`); in the town: plants in gardens and grounds, a pond,
    terrains under the grounds, dog walkers; Animals and Nature in the
    catalogue.
15. **Greenery and forest**: a forest border round the town (behind the
    skyline, the sides with gaps for the streets, below the last street),
    blocking everything nobody can reach; bushes, small trees, meadow and
    long grass in the back gardens.
16. **Trees fixed** (the owner saw broken, striped trees): plants are drawn
    once at their real size and scaled as an image (no more size-by-seed
    scaling); the seed mirrors them; birch bark bands; forest crowns stay
    off the roads.
17. **Monsters** (`src/tinyMonsters.js`): zombies, werewolves, the ghost
    girl, the reaper with a scythe, giant spiders, skeletons and flaming
    skulls, four variants each, four views, walking / floating / flying,
    with eyes; a Monsters group in the catalogue (28 cards).
18. **Monsters in the town**: zombies on the streets, ghost girls round the
    shrine, a reaper by the chapel, skeletons in the schoolyard, werewolves,
    giant spiders and flaming skulls roaming, each at its own speed; a
    Hide / Show monsters button.
19. **Shadows**: removed from people, animals, walking monsters, trees and
    bushes; only floating and flying monsters keep one, 30% black
    (`COLORS.shadow`); `snapToPalette` skips it.
20. **Combat** (`src/tinyCombat.js`): sword, axe, spear, bow, shield;
    slash, stab, axe swing, chop, spear swing, spear stab, bow shot, shield
    defend; each monster's skills (bite, claw, curse, scythe, web shot, web
    trap, bone throw, fireball); hit, shoved back, dead (with special deaths
    for ghosts, skeletons, skulls, spiders); a Combat group in the catalogue.

## Next (only when the owner asks)

1. Speech with them (floating pixel text from tiny-ui-kit) in the demo.
2. **More town**: a station plaza and a back alley like the catalogue's
   areas, a park (meadow, pond, trees), street props in the back gardens.
3. **The rest of the tinified catalogue**: street props (lamps, vending
   machines, signs, bus stop, benches) and vehicles.

## Known issues and small ideas

- Sign text is drawn by the canvas, so its edges are a little soft (not
  snapped to the pixel grid like everything else).

- Nobody goes inside buildings yet (tapping one walks you to its door).
- Townspeople cross roads anywhere their path goes, not only at crossings,
  and walk through each other.
- Sign text is a row of pixels, not letters. Real kana would need at least
  5 px tall signs; could try for a few (ラーメン, コンビニ) if the owner wants.

- Turned down when comparing with the catalogue (do not add): twin tails,
  beard, helmet, tank top, flu mask, wings, bulky build, shoes or boots,
  glasses, sunglasses, beanie, hoodie, sleeves, coffee cup, phone, ice
  cream, bow tie, fanny pack, headphones, hairstyle variations, body
  sliders, walk styles.
- Bags, briefcase and the stick are drawn at the front hand; the boxes and
  apron cover the body the same from the front and the side.
- People walk only left / right / up / down on a flat stage; there is no
  depth sorting beyond drawing the ones further back first.
- People keep to the strip around the path, so the top two thirds of the park
  is empty grass (let them wander higher, or make the park shorter?).
- On a walking step the body bobs up a pixel and a one-pixel gap opens
  between body and legs (close it, or keep it as in the bubble lab?).

## Open questions for the owner

None right now.
