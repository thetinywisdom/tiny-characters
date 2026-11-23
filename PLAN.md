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

## Next (only when the owner asks)

1. Speech with them (floating pixel text from tiny-ui-kit) in the demo.
2. **A tinified catalogue**: a tiny pixel version of the things in
   thetinywisdom/tiny-catalogue, drawn in the same small, simple style as the
   people.
3. **Buildings first, toward a 2D map**: start the tiny catalogue with
   buildings, aiming for a 2D map the tiny people can walk around in.

## Known issues and small ideas

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
