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
- The koban is called a police station (its sign says POLICE STATION; its
  type stays 'koban').
- Signs and type (Nov 2026): signs show the place's name instead of dots
  or stripes, in DotGothic16, **in English** (also the Japanese shops:
  RAMEN, KONBINI, not ラーメン); the pages use DotGothic16 too.
- Doors and windows (Nov 2026): one set of sizes and proportions on every
  building (storeys 16 / 19 / 13, doors 6 × 12 and 10 × 12, windows 5 × 6,
  9 × 6, 5 × 8, sills 4 above the floor), and detailed types that show what
  they are (wood, glass, sliding, shoji, steel ...).
- People (Nov 2026): four views (front, back, both sides); walking up shows
  the back.
- How to work (Nov 2026): show the owner a preview of any change to how
  things look before switching everything over; for new things, show a
  picture of every option (on the real town) before building, since words
  are imagined differently.
- Maps (Nov 2026): the demo's town is a showcase; users will build their
  own maps from the same pieces, so every new place is a layout item.
- Speech (Nov 2026): icon bubbles in the town, floating text (no box) when
  you tap someone, typing out; passers-by chat in icons; lines that suit
  the speaker; English first, code ready for Japanese and Indonesian.
- People stay flat (Nov 2026): no 3D people (tried: the owner found every
  version bad). The town is drawn 1.5 times bigger than the people.
- People (Nov 2026): no eyes, they stay faceless; different sizes are fine
  (tall, short, kids); everyone gets hands, shoes, a shaded side, a collar and
  hem on plain tops, and sometimes a fringe, so they look less generic.
- Looks from the catalogue (Nov 2026): keep mohawk (3 px tall), moustache
  (1 px only) and the cat (side view); umbrella with an 11 px canopy;
  ponytail out from the back then 5 px down, swinging out on the walking
  step; no twin tails, beard, helmet, tank top; none of the "maybe" parts
  (flu mask, wings, bulky build, shoes or boots: too small to matter).

- Headlights (Nov 2026): a pool of light on the road ahead of the car (not
  cones or beams), with small glows on the lamps.
- Building seeds (Nov 2026): a seed changes the building itself (width,
  floors, windows' kind, number and spacing, door, roof, details), not only
  its colours; all on the shared door and window sizes.
- Pixels everywhere (Nov 2026): it is a pixel world, so effects are drawn on
  the pixel grid too (the steam: see-through pixel puffs, not soft circles;
  the night's light: flat steps, A, round lamps and in the headlights' pools).
- Small life (Nov 2026): all of it, as agreed from mock-ups; the kids at play
  and the picnic go home at six, shopkeepers when their shutters come down.
- Fewer people (Nov 2026): half the walkers (44); the town should not feel
  crowded.
- The player's marker (Nov 2026): a thin gold pixel ring round your feet,
  still (no pulse), as bright at night as by day; a white ring under whoever
  you point at or tap.
- The basketball court (Nov 2026): blue, and open (no fence).
- Light at night (Nov 2026): flat pixel steps (A); it never washes over cars
  or people; whoever stands inside a glow takes on its warm colour (C), by
  the glow's own steps.
- The walking step (Nov 2026): the body still bobs a pixel, and the hips
  stretch up so no gap opens.
- Full-size drawing (Nov 2026): everything is redrawn natively at the town's
  size (E), one building pixel = one person pixel; the same buildings with
  more detail; reviewed in batches of 20 on a review page (accept, reject,
  notes); only approved ones go live. The hand-drawn PNG plan (ART_PLAN) is
  dropped.
- The front page (Nov 2026): no park (the owner never used it): the town,
  the looks, the buildings and the gallery.

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
21. **Axe swing is a 360 spin** (the owner: it should affect everything
    round the character): a quick wind-up, one fast full turn (0.42 s in
    all) through every view, a ring of motion; actions now say their reach (`front`, `around`, `self`)
    and range.
22. **Smarter building seeds** (the owner: seeds only changed colours, so
    every seed was the same building): each type has two or three widths
    and its seed picks the width, floors, window kind / number / spacing,
    door kind / side / colour, roof (flat, pitched, hipped; colour; chimneys,
    dormers, towers, rooftop units) and details; `buildingSize` per seed;
    the seed is mixed first (neighbouring seeds chose alike); the town picks
    seeds that fit each block and row; the Buildings sheet shows three seeds
    of each.

23. **Street things** (`src/tinyStreet.js`; the owner asked what makes a
    town feel alive and chose: street things, then cars and traffic
    lights, then day and night): utility poles with lamps and wires,
    street lamps, old lamps, stone lanterns, vending machines, bus stops,
    benches, bins, bikes in a rack, a post box, pot plants, stop signs,
    manholes; placed in the town; a Street group in the catalogue.

24. **Cars and traffic lights** (`src/tinyTraffic.js`): cars, kei cars,
    taxis, delivery vans, kei trucks and buses in four views; driving on
    the left; traffic lights at every junction (Japanese: lamps side by
    side, a walk signal) that cars wait at; turns at junctions; buses
    waiting at the bus stops; cars stopping for anyone in front; people on
    foot cross only at the zebra crossings and wait for the green man;
    vehicles in the catalogue (Street, Vehicles). The stop signs left the
    town (lights at every junction), but stay in the catalogue.

25. **Day and night**: a clock in the demo (an hour every 8 s, from 4 pm;
    Time: passing / day / night); the town turns golden at dusk, then deep
    blue; lit windows, shop glass, signs, neon, lanterns, street lamps,
    vending machines, traffic lights and car lights glow.

26. **Vehicles with depth** (the owner: from the side they looked like
    paper cars): side views now show the top from above too (bonnet, boot,
    raised cabin with side windows, rear window, roof, windscreen; the
    van's and bus's roofs; the kei truck's open bed), as the buildings show
    their roofs. Then the front and back views (the owner: they were all
    weird, tall boxes): the face, then a top a third of the length (bonnet,
    a narrower cabin with mirrors, boot), same proportions as the sides.

27. **3D vehicles** (the owner showed a 3D car sprite sheet turning round:
    our views were weird and did not match): every vehicle is now a small
    3D shape of pixel blocks drawn from 16 headings in the town's view, so
    all views are the same vehicle; bigger (a car 30 long, a person's size
    beside it) with arches, hubs, bumpers, plates, twin lamps, grille, side
    skirt, doors, mirrors, sloped glass; cars swing round as they turn and
    only turn into room; the lanes fixed to the left (east-bound in the
    north half); buses serve their stops on the kerb side. At night: two
    headlights and two tail lights on the lamps (not one in the middle),
    each beam on the road, lamps on the far end hidden.
28. **Headlights shine on the road** (the owner: they looked like floating
    orbs; tried soft cones, pixel beams and a light pool, chose the pool):
    one smooth pool of light on the road ahead of each car, never over a
    car; small glows on the lamps themselves.

29. **People in 3D: tried and dropped** (the owner asked to try the
    vehicles' approach on the people; the first try was switched in without
    asking and put back; a flat-looking first preview, then three variants
    with an angled camera and outlines; the owner: all bad, forget it). All
    of it removed; the people stay flat.

30. **Clean-up** (the owner: remove useless stuff, make it lightweight):
    one `shade` and one `canvasOf` (exported from tinyCharacters) instead of
    8 and 5 copies; unused imports, variables and arguments gone (ESLint
    clean but for style); `drawStreet` removed (left over from the first
    one-street demo, used nowhere); `aDoor` (both branches the same) and
    `DW` removed; the buildings' flat roof with things on it written once
    (`flatTop`, 8 places); the night's headlight layer and the combat
    reactions' sprite canvas are kept and cleared instead of made again
    every frame. Every picture checked the same before and after (210).

31. **Household weapons** (the owner's list): baseball bat, folded umbrella,
    golf club (sword moves), frying pan, pickaxe, hammer (axe moves), broom
    (spear moves), wok (shield); each weapon has a kind and does that
    kind's attacks (`actionsFor`); 23 new catalogue cards (Combat,
    Household); every earlier picture unchanged. The hammer then made a
    bulky sledgehammer (the owner: too like the axe).

32. **Speech** (`src/tinySpeech.js`; the owner saw a mock-up of every option
    on the real town first and chose): icon bubbles over people in the town
    (moods that suit them, sleepier at night); passers-by close together
    stop and chat in icons, taking turns; tap someone (people, animals,
    monsters) and they say a line that suits them as floating text that
    types out, rises and fades; English lines for 18 kinds of speaker, with
    Japanese and Indonesian ready to fill in; a Speech group in the
    catalogue. Also: the player now starts on the sidewalk (they started in
    the cross street, and turning cars queued up waiting for them).

33. **More town** (the owner chose from mock-ups: grow the map; all of the
    places; both stations, and then all three big station designs with
    smaller doors): the map grows south with a pond park, a playground and
    extras, a fenced basketball court, a railway with level crossings and a
    train, a small station and three big ones (modern glass, classic brick,
    Japanese wooden) with their plaza, kiosk and taxi rank, and a station
    alley; people, kids, a basketball game and cats there; every piece a
    reusable layout item for maps of one's own; maps made stable (adding to
    a map changes nothing elsewhere; the forest and garden filler and some
    vending machine colours were dealt once anew for it).

34. **Things in the road** (the owner found two bins in the middle of a
    cross street, on its zebra crossing): those bins and a pot plant in
    another cross street removed, the station plaza's clock moved off the
    cross street; makeTown now warns about any layout prop on a road or a
    cross street's sidewalk.

35. **Night lights over people** (the owner: people passed behind a station's
    lit doors): building lights are now drawn into their own layer in the
    scene's order, with everyone in front wiping their shape out of it.

36. **Cars and people collide** (the owner: they went through each other):
    vehicles have real footprints; cars stop for anyone across their whole
    width; people wait instead of walking into a car or the train (and give
    up after 2 s, so nobody waits for good); the keys will not walk you into
    one. A minute of the live town: 13,320 checks, nobody inside a vehicle,
    traffic still flowing.

37. **Cars with cars, people with people** (the owner): cars stop for any
    vehicle in their way by footprints, whichever way it faces (junctions,
    turns), the first one made going first; people keep a little room, step
    round or wait, never start on or head for someone's spot; you cannot
    walk through anyone. Measured: car overlaps 10 to 0 in three simulated
    minutes; people overlaps 311 to 1 in a minute and a half.

38. **Small life** (the owner chose all of it from mock-ups; `src/tinyLife.js`,
    `demo/life.js`): new poses (sitting on a bench or the ground, riding a
    bike, bowing, sweeping, kicking, throwing, drinking a can, going down a
    slide); pigeon flocks that peck and fly off when someone comes close;
    crows on the wires; a cat napping on a new block wall; ducklings behind
    their mother, and ducks that paddle over when someone throws bread;
    two dogs greeting (their owners stop); laundry and futons on balconies
    by day; shopkeepers at their doors (sweeping 6-10, bowing to passers-by,
    gone home when the shutter comes down 21-7); windows that light up and
    go dark one by one at night; steam from the food stalls (ramen,
    yakitori, takoyaki, udon, the kiosk); the alley's lanterns swaying;
    rubbish bags out 6-11; kids on the swings (each seat at its own angle),
    the slide and kicking a ball, a picnic family (by day only); bike
    riders on the sidewalks; a delivery scooter in the traffic; commuters
    coming out when a train stops; someone taking a taxi from the rank (it
    pulls out, drives off, and a new one comes back and pulls in);
    cherry petals falling. Catalogue: a Life group (19 cards). Every old
    catalogue card is unchanged pixel for pixel.

39. **Traffic jams fixed** (found while checking small life; they were there
    before): cars no longer wait for people standing on the sidewalk by the
    kerb (only for people on the road), nobody ends a trip, stops short or
    gives up out on a crossing, and someone held up on a crossing squeezes
    past. A 100 s run: no car held up for 15 s or more (before: about ten).

40. **Half the walkers** (the owner: too many people): 86 walkers down to 44
    (20 anywhere, 5 schoolyard kids, 4 at the plaza, 3 each at the shrine,
    the square, the park and the playground, 3 dog walkers). Small life,
    monsters, cats and the basketball game are as they were: 99 on foot in
    all (was 142).

41. **Small fixes** (the owner): someone resting in the way steps aside
    after half a second ("excuse me") instead of being squeezed into; only
    someone who cannot move (coming the other way, busy, you) is squeezed
    past on a crossing; a dog waits on the other side of its owner rather
    than in the road; a taxi pulls out or in only when nobody stands
    against it. Overlaps in 90 s: 103 to 20; no car held up for 15 s.

42. **Front-page park removed** (the owner: barely used, useless) and **the
    walking step's gap closed** (option B from a mock-up: the hips stretch up
    on the bob, the bounce stays). `drawStage` stays in the library.

43. **A ring instead of the gold line** (the owner chose from mock-ups: the
    thin pixel ring, still, no pulse): gold round your feet; a white one
    under whoever the mouse points at (with the hand cursor), or whoever you
    tap while they say their line (phones have no hover).

44. **Pixel steam** (the owner: it should be pixelated; chose B from
    animated mock-ups): see-through pixel puffs that grow as they rise and
    fade out, over every food stall and the ramen shops.

45. **Lights no longer wash over cars and people** (the owner: a street
    lamp's glow destroyed the car behind it): the light on the ground has
    every vehicle and everyone on foot painted out of it; the night's pixel
    light styles can be tried live with `?lights=bands|dither|mixed` (and
    `?time=night`); the owner chose A, flat steps: now the default.

46. **People in the light** (the owner: something should happen when they
    stand under a light; chose C from mock-ups): at night, anyone (and cats,
    dogs, monsters) under a lamp, a lantern, by a vending machine or in front
    of a car's headlights shows in their day colours tinted by that light, in
    the light's own steps (full, half, none).

47. **A blue basketball court** (the owner): the court is blue (#3f86c8),
    the run-off round it a deeper blue; the lines stay white.

48. **An open court, and light that matches what you see** (the owner: hard to
    get into the court; the light looked weird): the court has no fence now
    (a fence with gates on any side stays possible for other maps); whoever
    stands inside a lamp's glow is lit by its steps, and nobody outside it
    is (it used to go by the distance to the lamp's foot, so people stood
    dark inside the glow); cars inside a glow are lit too.

49. **Your ring stays gold at night** (the owner): the rings (yours, and the
    white one under whoever you point at) are drawn again over the night, so
    the dark does not dim them; still behind the legs.

50. **Hand-over docs** (the owner: for other agents to pick up the project):
    `CLAUDE.md` rewritten (the owner's rules, where things are, how to check a
    change, things that bit before), SKILLS' testing recipes, a "Working on
    it" pointer in the README.

51. **The plan to redraw everything by hand** (the owner: it all looks like
    AI slop): `ART_PLAN.md` — the style choices to make first, tools, how to
    hand over images (names, anchors, frames, variants, night images), the
    full list of what to draw with sizes, the order, and what the code does
    at each step (a sprite loader with the current drawings as fallback).

52. **Full-size buildings, batch 1** (the owner chose E over B: draw everything
    natively at the town's size instead of stretching by 1.5; forget the
    hand-drawn ART_PLAN): the full-size kit (`src/tinyBuildingsFull.js`), a
    gate so only approved drawings are used (`setRedraw`, `?redraw=all`), the
    catalogue and Buildings sheet showing them at their size, a review page
    with accept / reject / notes. Approved and live: house, apartment block,
    shop with flats, office, shop (all six kinds), laundromat, kissaten,
    pharmacy, florist, sushi, fishmonger, udon / soba, family restaurant,
    takoyaki, karaoke, police station (its red lamp back to the old square
    shape, done better: the owner), post office, bank, clinic. The wooden
    apartment was sent back (its stairs: "maybe just a ladder"). Each seed is
    still the same building (same rng calls, checked); nothing else changed
    a pixel.

53. **Full-size buildings, batch 2: every building is redrawn.** Approved and live:
    the wooden apartment (its stairs now a plain ladder, the owner's note), fire
    station (a FIRE STATION sign on the red band), parking garage (no cars on its
    roof, the owner), gas station (a SHOP sign on the kiosk; the same walk-in ground
    under the canopy), school (windows centred), toilets (the door signs no longer
    cut off), shrine, torii, shrine hall (small stone lanterns either side), mosque,
    stone chapel, kiosk, the four stations, the yakitori alley stall, and the old
    town's Tudor cottage, Mediterranean villa, Dutch canal house (the ground floor's
    door and window now under the windows above, the owner), French country house,
    Scandinavian house. New lights at night: the parking garage's strip lights, the
    pumps and prices, the departure board and station clock, the kiosk, the stone
    lanterns, the mosque's door lamp, lattice windows. Same rng choices as before;
    nothing else changed a pixel.

54. **Full-size street things (batch 3), all 25 approved and live:** utility pole (the
    wires still hang from its crossarm), street lamp, old lamp, stone lantern, traffic
    light, floodlight, plaza clock, red lantern, level crossing gate, stop sign, vending
    machine, bench, bus stop, bins, bikes in a rack, post box, pot plant, drinking
    fountain, swings (also when kids ride them), slide, sandbox, basketball hoop, block
    wall, crates, AC unit. Lamp heads sit under their night glows, the bench seat, the
    swings, the slide and the wall top where they were, so sitting, swinging, sliding
    and the napping cat work as before. The catalogue shows them at the town's size.

## In progress

- **Redrawing everything at full size (E)**, in batches reviewed on a review page
  (https://claude.ai/artifact/4QAkLRYE9m2mcs5caQUZzB). Every building is done (batches 1-2).
  Every building and every street thing is done (batches 1-3). Next: trees and bushes
  (batch 4), then the ground and streets.

## Next (only when the owner asks)

**The full-size redraw comes first** (In progress). Other ideas offered before (on hold):
- weather and time (the backlog): wind, rain, seasons
- a map maker: place streets, buildings, props and areas, save and load
  (every place is already a layout piece)
- people going into buildings (and maybe a simple look inside)
- Japanese and Indonesian lines (the code is ready; Japanese with the
  reading, the English and grammar notes)
- real kana on a few signs (ラーメン, コンビニ, えき)

## Backlog (agreed ideas for later)

- **Weather and time** (the owner: later): wind (leaves, petals, laundry
  flapping), rain (umbrellas up, puddles), seasons (spring blossom, autumn
  colours, a snowy winter). They change existing looks, so preview first.

## Known issues and small ideas

- A shop's ground floor is the same for every seed of its kind (the shop
  kind sets it); the seed changes the width, roof and what is above.
- The town's back row is packed from the left, so narrower seeds leave a
  gap at its right end.

- The catalogue has no night view yet.
- A car's tail-light glow can tint a tree standing right in front of it.
- Sign text is drawn by the canvas, so its edges are a little soft (not
  snapped to the pixel grid like everything else).

- Nobody goes inside buildings yet (tapping one walks you to its door).
- A dog can brush past someone who is not its owner.
- People still brush past each other now and then (about 20 overlaps in 90 s,
  mostly cats and walkers).
- Pigeons, crows, the picnic blanket and the rubbish bags are drawn only;
  people walk over the blanket and the bags.
- Real kana on signs (ラーメン, コンビニ) could be tried on a few if the owner
  wants (the signs are in English now, by the owner's choice).
- The basketball court's centre circle is a smooth line, not pixels (offered
  to redraw it as a pixel ring; waiting for the owner).

- Turned down when comparing with the catalogue (do not add): twin tails,
  beard, helmet, tank top, flu mask, wings, bulky build, shoes or boots,
  glasses, sunglasses, beanie, hoodie, sleeves, coffee cup, phone, ice
  cream, bow tie, fanny pack, headphones, hairstyle variations, body
  sliders, walk styles.
- Bags, briefcase and the stick are drawn at the front hand; the boxes and
  apron cover the body the same from the front and the side.
- People walk only left / right / up / down on a flat stage; there is no
  depth sorting beyond drawing the ones further back first.

## Open questions for the owner

- Redraw the basketball court's centre circle in pixels, like the ring under
  your feet?
- What next (see Next)?
