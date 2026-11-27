# Instructions for agents working in this repository

Tiny Characters: the tiny pixel people from Tiny City Builder's bubble lab
(thetinywisdom/character-creator), and a little pixel town for them (buildings,
streets, traffic, a railway, night, speech, small life). Plain ES modules, a
canvas, no build step, no dependencies. Live demo (GitHub Pages, from `main`):
https://thetinywisdom.github.io/tiny-characters/ and the catalogue
https://thetinywisdom.github.io/tiny-characters/catalogue.html

**The big change under way: the owner will redraw every picture by hand**
(`ART_PLAN.md`: the code moves to the owner's PNG images one kind at a time,
with the current drawings as a fallback until each is replaced). Read it
first; do not polish the code-drawn art any more unless asked.

**Read before working:** this file, `ART_PLAN.md`, then `PLAN.md` (what is done, the owner's
decisions, what is next, open questions), `SKILLS.md` (how everything is
drawn and works, file by file, and how to check it) and `README.md` (what
people see and the public API).

## The owner's standing rules

- **Pictures first, then build.** For anything new, or any change to how
  something already looks: make mock-ups of the options *on the real town*
  (Playwright screenshots, an animated GIF for anything that moves), show
  them, recommend one, and build only after the owner picks. Never change
  existing looks unasked. ("show me pictures, give me options, and i will
  decide. only after you will build"; "just let me see it first before
  changing shit".) A direct, specific instruction ("make the court blue",
  "remove the fence", "halve the walkers") is done straight away.
- **Keep the docs up to date, in the same commit as every change:**
  `PLAN.md` (a numbered Done entry; Decisions; Next; Known issues; Open
  questions), `SKILLS.md` (files, API, how things are drawn, workflows) and
  `README.md` (what people see and use).
- **Push to `main` after every update, without asking**: GitHub Pages serves
  the demo from `main`, so each change goes live. Commit on the working
  branch, push it, then push the same commit to `main` (fast-forward,
  `git push origin <branch>:main`; never force-push).
- **Pixels everywhere.** It is a pixel world: people, buildings, effects
  (steam, the night's light, rings) are drawn on the pixel grid; nothing
  soft or anti-aliased (one known leftover: the court's centre circle).
- Keep the characters as small and simple as they are (about 5 × 15 px); no
  3D people (tried and dropped), no shadows except under floating and
  flying monsters, no eyes.
- The demo town is a showcase: users will build their own maps from the same
  pieces, so every new place or thing is a reusable layout item
  (`DEFAULT_TOWN` in `src/tinyTown.js`), and adding to a map must not
  reshuffle the rest (per-region random streams; see SKILLS).
- Signs and lines are in English (the speech code is ready for Japanese and
  Indonesian). When asked for help with Japanese, give the hiragana reading,
  an English translation and grammar notes (the owner writes comics in
  Japanese).
- Talk to the owner briefly and plainly: what changed, a picture, what is
  left; ask one clear question when a choice is theirs.

## Where things are

- `src/` the library (each file starts with a comment listing its exports):
  `tinyCharacters.js` people (and the shared `shade`, `canvasOf`,
  `drawRing`), `tinyBuildings.js`, `tinyStreet.js` (props), `tinyNature.js`
  (trees, bushes, ground), `tinyAnimals.js`, `tinyMonsters.js`,
  `tinyCombat.js`, `tinyVoxel.js` (3D blocks for vehicles only),
  `tinyTraffic.js` (vehicles, lanes, lights, the train, the taxi rank),
  `tinySpeech.js`, `tinyLife.js` (poses, birds, steam ...), `tinyTown.js`
  (the map: layout, ground, walking, path finding, drawing a view, night).
- `index.html` + `demo/town.js` (the town demo: walkers, you, taps, the
  clock), `demo/life.js` (small life: who sits, rides, sweeps, plays ...),
  `demo/demo.js` (the Looks and Gallery canvases).
- `catalogue.html` + `demo/catalogue.js`: every item on a card with seeds and
  a copy-code line (each card's code must draw exactly what it shows).

## Checking a change

- Serve the folder: `python3 -m http.server 8765`, open
  `http://localhost:8765/` (and `/catalogue.html`).
- Playwright (preinstalled; `require('playwright')`): screenshot the town
  canvas `#town` on a desktop size and on `devices['iPhone 13']`, with no
  page errors or console errors. Look at the pictures.
- The demo exposes `window.tinyTown` = `{ town, traffic, you, people, life,
  hour }` (set `hour`, move `you.x / you.y` to look at a place). The address
  takes `?time=night` and `?lights=soft|dither|mixed` (other light styles).
- Render a view yourself for mock-ups: `drawTownView(g, town, view, sprites,
  t, { dpx, night, above, lights, steam })` on a canvas scaled by `dpx`.
- A refactor must not change a pixel: hash every deterministic picture
  (town by day / dusk / night from fixed seeds, the layout, the Buildings
  sheet, every catalogue card with the clock frozen and `Math.random`
  seeded) before and after; all equal.
- Behaviour checks used so far (see SKILLS, Testing): no vehicle held up for
  15 s in a 100 s run; people overlaps sampled every 0.5 s; nobody inside a
  vehicle; frame time by day and night (about 2 ms and 7 ms).

## Things that bit before (read SKILLS for the rest)

- Canvas compositing: `destination-in` applies per drawing call, so mask
  with one finished shape (`drawImage` of a canvas), never by drawing a
  person rectangle by rectangle.
- The town is drawn at scale 1.5 (`town.scale`), people at 1; the town canvas
  is 4 device px per pixel (`dpx`) so the signs' letters are crisp.
- Night: buildings' lights, the ground's light (with vehicles and people
  painted out), lit copies of whoever stands in a glow, then the rings again
  over the dark. Keep that order.
- Module-level state in `tinyBuildings.js` (e.g. `lastShop`) must be
  declared before anything that draws at load time.
- Long-running local servers get stopped by the environment; restart them.
