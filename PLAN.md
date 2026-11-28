# PLAN: Tiny Characters

## Goal

A home for the tiny pixel people the owner liked in Tiny City Builder's
bubble lab, so games can use them and they can grow.

## Decisions (agreed with the owner)

- The demo is on GitHub Pages, served from `main`; every update is pushed
  to `main` right away, without asking.
- The characters are the bubble lab's tiny 2D pixel people (about 5 × 15
  pixels), kept as small and simple as they are there.
- You stay a townsperson (Nov 2026): the orange guy (thetinywisdom/orange-guy) was
  tried as you, redrawn at the people's size, and removed (the owner: "looks bad").
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
- Seasons and weather (Nov 2026): all four seasons as in the mock-ups (autumn colours by
  tree, bare trees and snow in winter); rain with splashes, puddles and umbrellas (C),
  made gentler and slow (the owner: the town must stay easy to see), snow falling
  slower still, footprints for everyone in snow and rain, in short trails; a picker under the town, otherwise the real
  month and rain now and then.
- The breeze (Nov 2026): trees sway in gusts that roll across the town (B, from
  animated mock-ups: up to 2 px at the top, trunks still); bushes stay still.
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

55. **Trees sway in the breeze** (the owner asked; chose B, gusts, from three animated
    mock-ups; trees only): the crowns lean up to 2 px in whole-pixel steps as waves of
    wind roll across the town from the left, the trunks stay still, each tree a
    little out of step; the catalogue's tree cards move too. About +0.5 ms a frame.

56. **Full-size trees and bushes (batch 4), all 25 approved and live:** oak, Japanese
    maple, cherry blossom, Japanese pine, cedar, fir, birch, palm, willow, ginkgo,
    bamboo, apple, poplar, cypress, bare tree; round shrub, hedge, azalea, hydrangea,
    rose (now told apart from the holly), lavender, fern, pampas, holly, cactus. They
    keep their 8 looks per seed and fit where the old ones stood; the trees sway in the
    breeze like before. The catalogue shows them at the town's size.
57. **The forest at night is lighter** (the owner asked whether the breeze makes it
    heavy: it adds about 1 ms in the thickest forest; the night was the heavy part):
    at night every tree was drawn a second time into the buildings' light layer; now
    only trees and bushes that overlap a building drawn before them are (nothing else
    has light to wipe). Same picture; a forest view at night 26 ms to 10 ms (on a 4x
    slower CPU 121 ms to 49 ms).

58. **Full-size ground (batch 5), all approved and live: the redraw is complete.** The ten
    terrains (one pattern pixel = one person pixel; marks on a fixed grid, so patches meet
    without seams and adding one reshuffles nothing; cobbles rounded and lit; water that
    ripples a pixel at a time), the streets (kerb stones, grained asphalt, zebra crossings
    with 5 wider stripes, pixel manholes), the railway (ballast, sleepers with rail plates,
    level crossings), the pond with a pixel bank of stones (its water stays inside the same
    edge), the ring path as pixel spans, visible stepping stones, and the court's centre
    circle as a pixel ring (the last soft leftover). Every road, sidewalk, crossing and rail
    is where it was.

59. **The old drawings deleted** (the owner: "delete them, if I want them I can revert"):
    the scale-1 drawings of every building, street thing, tree, bush, terrain and
    ground piece, and their old kit, are gone; only the full-size ones remain (about
    1,200 lines fewer; tinyBuildings.js from 1,100 lines to 270). The type lists keep
    their labels, widths, sizes, feet and glows. Every picture of the town, every
    building at every seed (day, night, shut, laundry) and the catalogue are unchanged,
    but the Doors & windows cards, which now show the full-size kit. `?redraw=none` is
    gone; `STOREY` is no longer exported (`FULL_STOREY` in tinyBuildingsFull.js).

60. **A faster forest** (the owner's pick, first of three): in a view, runs of 12 or more
    plants one after another (a forest) are drawn into a layer at half the canvas's
    pixels and copied up in one go, instead of each tree at 4x: the same picture (63
    views by day, dusk and night with the breeze, all identical). A forest view 7 to 4
    ms by day, 11 to 7 at night; on a 4x slower CPU 34 to 18 ms and 56 to 35 ms;
    street views 2.0 to 1.2 ms.

61. **Seasons and weather** (the owner chose from mock-ups: all four seasons; rain C, heavy
    with splashes, puddles and umbrellas; a picker plus the real calendar): spring cherry
    blossom and fresh greens; summer the cherries in leaf; autumn leafy trees red, orange
    or gold with fallen leaves; winter snow on the ground, sidewalks and every roof, leafy
    trees bare with snow, evergreens snowy, roads clear; rain with a grey sky, slanting
    streaks, splashes and puddles, snow falling in winter. The demo's Season and Weather
    buttons (auto: the real month, rain spells now and then), `?season=`, `?weather=`;
    walkers put umbrellas up in the rain. Without a season every picture is unchanged.

62. **No more traffic jams** (the owner saw one: a walker on a crossing held a car, the
    car held the junction): cars held by someone on foot pull out round them into the
    other lane when it is clear, or turn round when there is no way round; a car held 6
    s finds another way (a taxi gives up the rank); a car that cannot fit into a forced
    turn turns the other way. People held up by a car step aside off the road (the way
    there never through a car) and go elsewhere; nobody stays out on the road. Before:
    one run in three jammed (a car held 50 s, a walker on the road 66 s); after: none in
    eight runs of 150-200 s (longest hold 10 s); you standing on the road holds cars at
    most about 7 s.

63. **Gentler rain, slower snow, footprints** (the owner: the rain was too harsh, the
    town hard to see; rain as slow as the snow was, snow slower; footprints in the snow):
    a lighter grey, fewer see-through streaks, few splashes, falling gently; snow drifting
    down at half that; you leave footprints on snowy ground (left and right by turns,
    gone after 30 s). Going into buildings is on hold (the owner); when it comes back:
    doors that open (B, from the mock-ups), then a peek inside as its own step.

64. **Footprints for everyone, in snow and rain, in short trails** (the owner): people,
    you, cats, dogs, the monsters that walk, and bicycles (a tyre track) leave prints off
    the roads: pale in the snow, wet and dark in the rain (washed away sooner); each keeps
    only the last 60 px of its trail, so the town does not fill up with prints.

65. **Softer rain** (the owner: still too harsh): half as many drops, fainter and shorter
    streaks (22-38 % see-through, 3 px), a barely grey sky, very few faint splashes.

67. **Wind, fog and thunder** (the owner, from animated mock-ups: wind yes, fog B, thunder B):
    `weather: 'wind'` blows autumn leaves or spring petals across, tosses the trees harder
    and flaps the washing on the balconies; `'fog'` drifts banks of mist over the town in
    three hard-edged steps (the night's lights through it); `'storm'` is rain with
    lightning (a double flash and a pixel bolt, now and then). The Weather button and
    `?weather=` take them; on auto, windy spells, fog some early mornings, a third of
    the rain stormy. Clear and rainy pictures unchanged (hashes).

68. **Calmer wind** (the owner: too strong, confusing): a third as many leaves or petals,
    drifting at a third of the speed, turning over slowly; the trees lean only a little
    further than in the breeze; the washing flaps now and then, slowly.

69. **Pigeons scatter when they fly** (the owner: the flock looked like one big random
    animal): each bird takes off a moment sooner or later, at its own speed and height,
    curving out to the side with a flutter, and they land spread out.

70. **No footprints on the court in the snow** (the owner): prints in winter only where the
    ground lies under snow (the court, which stays clear, gets none).

71. **Vehicles, small fixes** (the owner, from pictures): brake lights (brighter tail
    lamps and a high brake lamp), turn signals blinking before and through a turn,
    headlamps on in rain, storms and fog by day, snow on the roofs in winter.

72. **Scooters and motorbikes in the traffic** (the owner chose A from mock-ups: flat, like
    the people and the delivery scooter, over 3D blocks): three scooters and a motorbike, a
    rider in a helmet each (colours and rider from the seed), side on or head on; brake lamp,
    turn signals, a headlamp at night; at a red light they ride past the cars standing in
    the queue, by the kerb, to the front. Catalogue cards (Street, Vehicles).

73. **City bikes and bike parking** (the owner, from mock-ups: a mix of bikes, rack B): two
    of the four cyclists ride city bikes (mamachari: low frame, wire basket, rack; one with a
    child on a seat behind, one with shopping in the basket) and two schoolkids ride city
    bikes in white helmets; a new layout item `bikeParking` (ten bikes side by side seen end
    on, staggered, coloured mudguards, baskets) in front of the wooden station. The old
    two-bike `bikeRack` stays as it was.

## In progress

- Vehicles (the owner's order, Nov 2026): 1. small fixes, 2. motorbikes in the traffic,
  3. city bikes and bike racks, 4. the rubbish truck; each from mock-ups first.
  - Step 3, done (73): city bikes and bike parking. Next: step 4, the rubbish truck.
  - Step 2, done (72): scooters and motorbikes.
  - Step 1, done (71): brake lights (the tail lamps a brighter red and a high brake lamp at the bottom of the
    rear window while slowing or standing), turn signals (the turn decided 40 px before
    the corner; that side's corner lamps blink amber until round it), headlamps on in
    rain, storms and fog by day (a faint pool ahead, red behind), snow on the roofs in
    winter (roof only: on the bonnet too a blue car looked white).
  - Ideas from the look at vehicles (not chosen yet): a redraw with more detail, cleaner
    corner views, parked cars, a police car, a fire engine, the van stopping at shops,
    bike lamps at night, smoother bike turns.

## Next (only when the owner asks)

The full-size redraw is done. Ideas offered before (on hold):
- the catalogue in the seasons and the weather (the backlog)
- a map maker: place streets, buildings, props and areas, save and load
  (every place is already a layout piece)
- people going into buildings (on hold, the owner: chose B from mock-ups, the door
  opens, they step in and it closes; then a peek inside as its own step)
- Japanese and Indonesian lines (the code is ready; Japanese with the
  reading, the English and grammar notes)
- real kana on a few signs (ラーメン, コンビニ, えき)

## Backlog (agreed ideas for later)

- The catalogue showing the seasons and the weather.

## Known issues and small ideas

- A shop's ground floor is the same for every seed of its kind (the shop
  kind sets it); the seed changes the width, roof and what is above.
- The town's back row is packed from the left, so narrower seeds leave a
  gap at its right end.

- The catalogue has no night view yet.
- A car's tail-light glow can tint a tree standing right in front of it.
- A view full of forest at night is still the slowest (about 7 ms; 35 ms on a 4x
  slower CPU): the night's layers over the whole view.
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

- What next (see Next)?
