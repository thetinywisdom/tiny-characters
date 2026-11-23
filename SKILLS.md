# SKILLS: how Tiny Characters works and how to extend it

Read this before changing anything; `PLAN.md` says what is done and next.

## What this is

The tiny 2D pixel people from Tiny City Builder's bubble lab
(thetinywisdom/character-creator, `labs/bubble-lab.html`), as a library.
The owner chose these as the start of this repo.

## Files

```
src/tinyCharacters.js  the library (plain ES module, no dependencies):
                       drawCharacter, drawStage, randomCharacter, seeded,
                       headOf, snapToPalette, COLORS and the colour lists
index.html             the demo page (park + gallery)
demo/demo.js           the demo: strolling crowd, you (keys / tap to walk),
                       tap someone to make them talk; the gallery
demo/demo.css          the demo page's look (light and dark)
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

Keep them this small and this simple: that is what the owner liked.

## Common tasks

- **A new look part** (a hat, a skirt, a bag): add an option to the person,
  draw it in `drawCharacter` with a few `fillRect`s at fixed pixel offsets,
  show it in the demo gallery, describe it above.
- **A new colour:** add it to the list (`BODY_COLORS` ...); `snapToPalette`
  uses all the lists.

## Testing and checking

No build step. Serve the folder (`python3 -m http.server`), open the page,
and check with Playwright screenshots on a desktop size and a phone
(`devices['iPhone 13']`), with no page errors.

## Keeping the docs up to date

With every change, in the same commit: update this file (files, API, how a
person is drawn), `PLAN.md` (Done, Next, known issues, the owner's decisions)
and `README.md` (what people see and use).
