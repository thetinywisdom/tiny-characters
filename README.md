# Tiny Characters

The little pixel people from **Tiny City Builder**'s bubble lab: about
5 × 15 pixels each, drawn with a handful of rectangles on a low-resolution
canvas and scaled up with hard pixels. Plain JavaScript, no dependencies.

Open `index.html` through any static server (or GitHub Pages) for the demo:
a park where they stroll about (move the one with the gold line with the arrow
keys / WASD or by tapping; tap anyone to make them talk) and a gallery of
random looks.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Use it

```js
import { drawCharacter, drawStage, randomCharacter } from './src/tinyCharacters.js';

const canvas = document.querySelector('canvas');   // e.g. width 200, height 124
canvas.style.imageRendering = 'pixelated';         // scale up with hard pixels
const g = canvas.getContext('2d');

const person = { ...randomCharacter(), x: 100, y: 100, talking: true };
function frame(now) {
  drawStage(g, canvas.width, canvas.height);
  drawCharacter(g, person, now / 1000);             // feet at (x, y)
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

A person: `{ x, y, body, hair, skin, legs, you, talking, walking, facing }`
(colours are CSS strings; `facing`: `'left'`, `'right'` or nothing).

| Export | What it does |
| --- | --- |
| `drawCharacter(g, person, t)` | Draws one person. `talking`: bobs a pixel six times a second; `walking`: the legs take turns lifting a pixel; `you`: a gold line under the feet; `facing`: a pixel of hair at the back of the head. |
| `drawStage(g, W, H)` | The lab's grass with a path across it. |
| `randomCharacter(rng)` | A random look from `BODY_COLORS`, `HAIR_COLORS`, `SKIN_COLORS`, `LEG_COLORS`. |
| `seeded(seed)` | A seeded random number generator, for crowds that come out the same every time. |
| `headOf(person)` | The point just over the head (for speech). |
| `snapToPalette(g, W, H, palette)` | Snaps every pixel to the palette (after drawing anything smooth, like text). |
| `COLORS` | The lab's colours (ink, paper, gold, grass, path, shadow ...). |

Speech for these people (floating pixel text, the design picked in the
bubble lab) lives in **tiny-ui-kit** (`src/ui/pixelOverlay.js`).
