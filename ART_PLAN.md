# ART PLAN: redrawing everything by hand

**Dropped (Nov 2026):** the owner chose to have everything redrawn in code
at full size instead ("E"; see PLAN.md and SKILLS.md, How a building is drawn).
Kept for the record.

The owner's call (Nov 2026): the pictures the code draws look generic ("AI
slop"). The goal is that **every picture in Tiny Characters is drawn by the
owner**, as pixel-art images, and the code only places, animates, sorts and
lights them. This file is the plan for that: what there is to draw, what to
decide first, how to draw and export it, in what order, and what the code
side (an agent) does at each step.

## The plan in short

1. **Choose your style first:**
   - how big a person is (now 5 × 15 pixels, or bigger)
   - one fixed colour palette
   - outlines or not
   - which direction the light comes from

   Draw everything at one size (right now the town is drawn 1.5 times
   bigger than the people, which makes it look off).
2. **Get a pixel-art editor.** Aseprite is the best; Piskel is free and works
   in the browser.
3. **Do a small test set:** one person walking in 4 directions, road,
   sidewalk and grass tiles, one house, one tree, one bench. They go in the
   town next to the old art; look, adjust and redraw until you love it.
4. **Then draw in this order:**
   1. people
   2. ground tiles
   3. the 10 most common buildings
   4. the remaining buildings
   5. street things and trees
   6. cars
   7. animals and monsters
   8. effects and icons
5. **Save each drawing as a PNG** named after the thing (`house.png`,
   `bench.png`). It is swapped into the town; whatever is not drawn yet keeps
   the old art, so nothing breaks while you go.

After the people, the ground and the main buildings, the town already looks
like yours. The rest can come piece by piece.

**First decision: how big a person should be** (everything else is sized
from that).

The details (every choice, the full list of what to draw with sizes, how to
name and hand over images, what the code does) follow below.

## How it works (the idea)

- You draw **PNG images** (sprite sheets) in a pixel-art editor and drop them
  in `assets/`.
- The code gets a small **sprite loader**: for each thing (a person's hair, a
  building, a bench) it uses your image if there is one, and the current
  code drawing if there is not yet. So nothing breaks: you replace the town
  **one piece at a time**, and every piece you finish shows up live.
- When a whole kind is done (say all the trees), its drawing code is deleted.
  At the end, the code draws nothing itself.
- What stays code: walking, paths, traffic, the clock, speech, sorting who is
  in front, the night (darkening, light), the catalogue, the map layout.

## Step 0: decide the style (before drawing anything)

Make these choices once; everything after follows them. Draw one test set
(Step 1) to try them out.

1. **Size of a person.** Now about 5 × 15 px. Keep that, or go a bit bigger
   (for example 8 × 20 or 12 × 24) so faces, hands and clothes can show more
   character. Bigger = more expressive, but more to draw for everything else
   too (buildings and cars scale with people).
2. **One scale for everything.** Now the town is drawn 1.5 times bigger than
   the people (so 1 town pixel is 1.5 person pixels; that is part of why it
   looks off). Draw everything at **the same pixel size**: one pixel is one
   pixel everywhere.
3. **The view.** Now: fronts face you, roofs and tops are seen from above
   (a "3/4" top-down town, like most pixel city games). Keep it, or go fully
   side-on or fully top-down. Everything must use the same one.
4. **A palette.** Pick one fixed palette (e.g. 24 to 48 colours; see
   https://lospec.com/palette-list for ready ones) and use only those
   colours everywhere. This alone makes things look like they belong
   together.
5. **Light comes from** one side (now: the upper left): shading on every
   picture follows it.
6. **Outlines:** none (as now), dark outlines, or outlines in a darker shade
   of each colour (selective outlining). Same rule for everything.
7. **Colours that change:** shirts, cars, hair colours vary from person to
   person. Either draw each colour you want, or draw those parts in a grey
   ramp (3 to 4 greys) and let the code recolour them (palette swap). The
   second saves a lot of drawing.

## Tools

- **Aseprite** (paid, the standard for pixel art; layers, animation, exports
  sprite sheets with a JSON file) — recommended.
- Free: **LibreSprite** or **Pixelorama** (desktop), **Piskel** (in the
  browser). On iPad: **Pixquare** or **Resprite**.
- Export: PNG with transparency, no scaling (1×), no smoothing.

## How to hand over images (so the code can use them)

- One folder: `assets/`, one sub-folder per kind: `assets/people/`,
  `assets/buildings/`, `assets/props/`, `assets/nature/`, `assets/ground/`,
  `assets/vehicles/`, `assets/animals/`, `assets/monsters/`,
  `assets/combat/`, `assets/effects/`, `assets/ui/`.
- **File names** are the thing's name in the code (listed below), e.g.
  `assets/buildings/house.png`, `assets/props/bench.png`.
- **The anchor** is the middle of the bottom edge (where it stands on the
  ground). Leave no empty rows under the feet or the wall.
- **Animation frames** go side by side in one PNG, all the same size, in the
  order given below (or export from Aseprite with its JSON; the loader can
  read that too).
- **Variants** (a second or third house) are `house.png`, `house-2.png`,
  `house-3.png`: the town picks one per building instead of the current
  random "seeds".
- **Night:** for anything with windows or lamps, a second image with only
  what glows at night (lit windows, signs, lamp heads), same size:
  `house.night.png`. The code darkens the town and adds this layer on top.

## What there is to draw (the full list)

Numbers are today's sizes in pixels (width × height) at the current scale;
they change if you change the person size in Step 0.

### People (seen most, do first)

Two ways to draw people; decide in Step 0:

- **A. Whole looks** (simplest, best looking): one sheet per character, e.g.
  13 starter looks (man, woman, boy, girl, grandpa, grandma, schoolboy,
  schoolgirl, salaryman, police, delivery, summer, rainy) plus as many
  townspeople as you like. Every person is drawn exactly as you meant.
- **B. Paper-doll parts** (more variety from less drawing): a body per size
  (kid, short, normal, tall) and parts drawn on the same grid that stack on
  it: hair (short, bald, long, ponytail, afro, bun, mohawk), hats (cap, wide
  straw hat), tops (plain, jacket, suit, apron, yukata, sailor, gakuran,
  police), legwear (trousers, shorts, skirt), things carried (backpack,
  bag, briefcase, umbrella, stick, boxes). The code mixes them.

Frames per person (or per part), each in 4 directions (front, back, left,
right; right can be the left flipped): **standing, step 1, step 2** (the
walk), so 3 frames × 4 directions = 12. Optional: talking (a frame with the
mouth or head moved), and the poses: sitting on a bench, sitting on the
ground, riding a bike, bowing, sweeping, kicking, throwing, drinking, going
down a slide (9 poses; 1 to 3 frames each, front or side).

Also: the ring under your feet (gold) and under whoever you point at
(white): one small image each.

### The ground (biggest change for the least drawing)

Tiles (e.g. 16 × 16, they repeat): grass, meadow, tall grass, dirt, sand,
gravel, cobble, water (2 to 4 animated frames), snow, rice paddy; the road,
the road's centre line, the sidewalk and its kerb, zebra crossing, the
railway (rails and sleepers), the level crossing, the basketball court
(floor and lines), the park's dirt path. About 20 to 30 tiles.

### Buildings (41 kinds)

Each: one front with its roof seen from above, standing on its anchor; 1 to
3 variants each; plus its `.night.png`. Today's sizes:

- Homes: house 52×47, apartment 42×93, wood apartment 56×41, tudor cottage
  44×55, mediterranean villa 52×45, dutch canal house 28×80, french country
  house 50×49, scandinavian house 46×46
- Shops and food: shop 48×33 (6 kinds of shop front: konbini, ramen, cafe,
  bookshop, bakery, izakaya), shop with flats above 44×70, kissaten 40×43,
  sushi 42×44, florist 36×55, fishmonger 46×31, udon and soba 42×44, family
  restaurant 72×30, takoyaki 24×27, karaoke 40×80, laundromat 42×31,
  pharmacy 50×31, kiosk 24×27, yakitori alley stall 28×28
- Civic: office 40×108, school 110×58, police station (koban) 42×28, post
  office 62×30, bank 52×67, clinic 46×54, fire station 66×64, parking
  garage 64×66, gas station 68×36, public toilets 44×28
- Stations: small station 60×32, modern 104×55, brick 112×50, wooden 104×38
- Worship: shrine 72×33, shrine hall 48×33, torii gate 26×23, mosque 56×69,
  stone chapel 40×61
- Extras that change through the day (separate small images laid over a
  building): laundry and futons on a balcony, a shop's roller shutter.

(Doors and windows are drawn as parts today, 25 kinds; if you draw whole
buildings you do not need them separately.)

### Street things (25)

utility pole 10×30, street lamp 6×19, old lamp 5×17, stone lantern 5×10,
vending machine 7×11, bench 12×5, bus stop 20×16, bins 9×6, bike rack 16×6,
post box 4×8, plant pot 5×6, traffic light 8×19 (green, yellow, red: 3
frames), stop sign 5×14, swings 30×22 (seats separate, they swing), slide
22×18, sandbox 26×10, drinking fountain 6×11, basketball hoop 10×24,
floodlight 6×36, plaza clock 8×28, red lantern 4×15, block wall 24×7,
crates 10×9, AC unit 10×8, level crossing gate 24×16 (boom up and down,
lamps flashing). Plus the wires between poles (the code can keep drawing
those as lines).

### Nature

Trees (15): oak, maple, sakura, pine, cedar, fir, birch, palm, willow,
ginkgo, bamboo, apple, poplar, cypress, bare; bushes (10): round, hedge,
azalea, hydrangea, rose, lavender, fern, pampas, holly, cactus. 1 to 3
variants each (later: a version per season, from the backlog).

### Vehicles (7)

car, kei car, taxi, van, kei truck, bus, delivery scooter; the train (a
carriage and the front). Today they are 3D blocks seen from 16 directions.
Hand-drawn: **4 directions** (left, right, up, down; plenty for straight
streets) or **8** (smoother turns at corners). Colours by palette swap, or a
few colour versions each. Night image: headlights and tail lights.

### Animals and monsters

- Cats: 8 coats (ginger, grey, black, white, tuxedo, calico, siamese,
  brown), 4 directions × 3 walk frames; plus a sleeping cat (on the wall).
- Dogs: 8 breeds (shiba, corgi, dachshund, poodle, pug, labrador, husky,
  dalmatian), 4 directions × 3 frames.
- Birds: pigeon (walking, pecking, flying 2 frames), crow (sitting, cawing),
  duck and duckling (swimming), koi.
- Monsters (7): zombie, werewolf, ghost girl, reaper, giant spider,
  skeleton, flaming skull; 4 directions × walk frames; 4 colour variants
  each today (palette swap).

### Fighting (only if you keep combat)

13 weapons (sword, axe, spear, bow, shield, bat, umbrella, golf club, pan,
pickaxe, hammer, broom, wok), 8 attack animations (slash, stab, axe swing,
chop, spear swing, spear stab, shoot, defend), 8 monster skills (bite, claw,
curse, scythe, web shot, web trap, bone throw, fireball), 3 reactions (hit,
shoved, dead).

### Effects and interface

Steam (3 to 4 frames), cherry petals, rubbish bags, the picnic blanket,
the ball(s), the night's light shapes (lamp glow and headlight pool: one
image each, in your chosen pixel style), speech bubble icons (heart, note,
dots, !, ?, Z, anger: 7 small images) and the bubble frame.

## The order (each step goes live when done)

1. **Style test** (a day or two): one person (standing + walking, 4
   directions), one street tile set (road, sidewalk, grass), one small
   building (a house), one tree, one bench. The code side puts them in the
   town next to the old art. Look, adjust the Step 0 choices, redo until you
   love it. Nothing else starts before this.
2. **People** (starter looks, or the paper-doll parts), then their poses.
3. **The ground tiles** (the whole town changes at once).
4. **Buildings**: the ten most seen first (house, apartment, shop and its 6
   fronts, office, konbini row, school, the big station), then the rest.
5. **Street things and nature.**
6. **Vehicles** (decide 4 or 8 directions first).
7. **Animals, birds, monsters.**
8. **Effects, icons, night images.**
9. **Fighting** (if kept).

## The code side (what an agent does, step by step)

- Step 1: add `assets/` and a tiny loader (`src/tinySprites.js`): load a
  manifest, draw a sprite by name, frame and direction at its anchor,
  palette-swap greys to colours; fall back to the current drawing when an
  image is missing. Make everything draw at one scale (Step 0, point 2).
  Show the test set in the town and in the catalogue.
- Each later step: switch that kind over to the images, check it in the
  town by day and at night, then delete its drawing code. Keep the catalogue
  showing every image with its name, so missing ones are easy to see.
- Buildings: the "seed" that now invents a building's windows and roof
  becomes "which of your variants"; sizes come from your images, and the
  ground a building blocks (where people cannot walk) is read from its
  image's bottom rows.
- Night: windows light from the `.night.png` images instead of the code's
  colours.
- The docs (`SKILLS.md`, `README.md`, `PLAN.md`, this file) are updated with
  every step, as usual.

## Rough amount of drawing

- Style test: 5 to 8 small images.
- People: 13 looks × 12 frames ≈ 150 frames (A), or about 35 parts × 12
  frames (B); poses about 20 frames.
- Ground: 20 to 30 tiles.
- Buildings: 41 fronts (+ variants, + night images, + 6 shop fronts).
- Street things 25, trees and bushes 25, vehicles 7 × 4 or 8 directions,
  cats and dogs 16 × 12 frames (fewer with palette swaps), monsters 7 × 12.

It is a lot; that is why the order matters: after steps 1 to 4 (people,
ground, the main buildings) the town will already look like yours, and the
rest can come over weeks, a piece at a time.

## Decisions for the owner

- [ ] Person size (keep 5 × 15, or bigger?)
- [ ] The view (keep the 3/4 top-down?)
- [ ] The palette
- [ ] Outlines or not
- [ ] People as whole looks (A) or paper-doll parts (B)
- [ ] Vehicles in 4 or 8 directions
- [ ] Keep fighting and monsters?
- [ ] Which editor
