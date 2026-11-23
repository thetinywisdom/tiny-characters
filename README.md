# Tiny Characters

The little pixel people from **Tiny City Builder**'s bubble lab: about
5 × 15 pixels each, drawn with a handful of rectangles on a low-resolution
canvas and scaled up with hard pixels. Plain JavaScript, no dependencies.

**Try it:** https://thetinywisdom.github.io/tiny-characters/ (GitHub Pages,
served from `main`). Or open `index.html` through any static server for the demo:
a park where they stroll about with a couple of cats (move the one with the
gold line with the arrow keys / WASD or by tapping; tap anyone to make them
talk), every look they can have, and a gallery of random looks.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Use it

```js
import { LOOKS, drawCat, drawCharacter, drawStage, randomCharacter } from './src/tinyCharacters.js';

const canvas = document.querySelector('canvas');   // e.g. width 200, height 124
canvas.style.imageRendering = 'pixelated';         // scale up with hard pixels
const g = canvas.getContext('2d');

const person = { ...randomCharacter(), x: 100, y: 100, talking: true };
const worker = { ...LOOKS.salaryman, x: 80, y: 104, walking: true, facing: 'right' };
const cat = { x: 120, y: 106, color: '#dcb08c' };
function frame(now) {
  drawStage(g, canvas.width, canvas.height);
  drawCharacter(g, person, now / 1000);             // feet at (x, y)
  drawCharacter(g, worker, now / 1000);
  drawCat(g, cat, now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

A person: `{ x, y, body, hair, skin, legs, you, talking, walking, facing }`
(colours are CSS strings; `facing`: `'left'`, `'right'` or nothing), plus
looks, all optional:

| Key | Values |
| --- | --- |
| `kid` | `true`: a child, 11 px tall instead of 15 |
| `hairStyle` | `short` (default), `bald`, `long`, `ponytail`, `afro`, `bun`, `mohawk` |
| `moustache` | `true`: one pixel, in the hair colour |
| `hat`, `hatColor` | `cap` (brim forward when facing), `wide` (straw hat, fedora) |
| `top`, `trim` | `jacket` (trim: the shirt), `suit` (trim: the tie), `apron`, `yukata` (trim: the obi), `sailor` (trim: the ribbon), `gakuran`, `police` (trim: the vest) |
| `legwear` | `trousers` (default), `shorts`, `skirt` (in the `legs` colour) |
| `carry`, `carryColor` | `backpack` (seen from the side), `bag`, `briefcase`, `umbrella`, `stick`, `boxes` |

The looks come from tiny-catalogue's people, kept to what still shows at this
size. `LOOKS` has starter looks like the catalogue's: `man`, `woman`, `boy`,
`girl`, `grandpa`, `grandma`, `schoolboy`, `schoolgirl`, `salaryman`,
`police`, `delivery`, `summer`, `rainy`.

| Export | What it does |
| --- | --- |
| `drawCharacter(g, person, t)` | Draws one person. `talking`: bobs a pixel six times a second; `walking`: the legs take turns lifting a pixel; `you`: a gold line under the feet; `facing`: a pixel of hair at the back of the head. |
| `drawCat(g, cat, t)` | A cat seen from the side: `{ x, y, color, facing, walking }`. |
| `LOOKS` | Starter looks to spread into a person. |
| `drawStage(g, W, H)` | The lab's grass with a path across it. |
| `randomCharacter(rng)` | A random look: colours from `BODY_COLORS`, `HAIR_COLORS`, `SKIN_COLORS`, `LEG_COLORS`; sometimes a kid, another hairstyle, a hat, a jacket, a skirt, something to carry. |
| `seeded(seed)` | A seeded random number generator, for crowds that come out the same every time. |
| `headOf(person)` | The point just over the head, hat or umbrella (for speech). |
| `snapToPalette(g, W, H, palette)` | Snaps every pixel to the palette (after drawing anything smooth, like text). |
| `COLORS` | The lab's colours (ink, paper, gold, grass, path, shadow ...). |

Speech for these people (floating pixel text, the design picked in the
bubble lab) lives in **tiny-ui-kit** (`src/ui/pixelOverlay.js`).
