# PLAN: Tiny Characters

## Goal

A home for the tiny pixel people the owner liked in Tiny City Builder's
bubble lab, so games can use them and they can grow.

## Decisions (agreed with the owner)

- The demo is on GitHub Pages, served from `main`; every update is pushed
  to `main` right away, without asking.
- The characters are the bubble lab's tiny 2D pixel people (about 5 × 15
  pixels), kept as small and simple as they are there.
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

## Next (only when the owner asks)

1. Speech with them (floating pixel text from tiny-ui-kit) in the demo.
2. **A 2D map** from the buildings: more than one street (blocks, corners,
   a crossing), buildings on both sides, walking around and behind them
   (footprints the people cannot walk through), like the catalogue's areas
   (shopping street, lane, station plaza, shrine corner, old-town square,
   back alley).
3. **The rest of the tinified catalogue**: street props (lamps, vending
   machines, signs, bus stop, benches), vehicles, trees and nature.

## Known issues and small ideas

- In the town people only walk in front of the buildings (sidewalk, road,
  far sidewalk); nobody goes behind or inside them yet.
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
