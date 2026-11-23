// Tiny Characters: the little pixel people from Tiny City Builder's bubble
// lab, as a small reusable library. Each person is drawn with a handful of
// rectangles on a low-resolution canvas (about 5 x 15 pixels), then the
// canvas is scaled up with hard pixels (CSS `image-rendering: pixelated`).
//
//   drawCharacter(g, person, t)   one person, feet at (person.x, person.y)
//   drawStage(g, W, H)            the lab's grass strip and path
//   randomCharacter(rng)          a random look (body, hair, skin, legs)
//   snapToPalette(g, W, H)        hard edges, only the palette's colours
//
// A person: { x, y, body, hair, skin, legs, you, talking, walking, facing }.
// Colours are CSS strings. Plain ES module, no dependencies.

/** The lab's colours. */
export const COLORS = {
  ink: '#2f3236', paper: '#f2efe8', navy: '#262b3a', gold: '#f2b64a',
  grass: '#9fb08d', grass2: '#93a582', path: '#ddd0aa', shadow: '#7f8f6e',
};

/** Body (top) colours used by the lab's people, and a few more. */
export const BODY_COLORS = ['#f2f2ee', '#3f7fd6', '#d46a8e', '#5f8f5a', '#f2c230', '#7a6aa8', '#e2e2e2', '#e8402f', '#262b3a', '#9e6c60'];
export const HAIR_COLORS = ['#2f3236', '#3a2a22', '#8a5a2a', '#c99c5a', '#b3b0a8', '#f2efe8'];
export const SKIN_COLORS = ['#f1cdb0', '#e2b08e', '#c98d65', '#8d5a3b', '#5a3825'];
export const LEG_COLORS = ['#2f3236', '#262b3a', '#3f4f6e', '#6b5a48'];

/**
 * Draw one person with their feet at (p.x, p.y), into a 2D context `g` of a
 * low-res canvas. `t` (seconds) drives the talking bob and the walking step.
 *  - talking: the body and head bob up a pixel, six times a second
 *  - walking: the legs take turns lifting a pixel, eight steps a second
 *  - you: a gold line under the feet (the player)
 */
export function drawCharacter(g, p, t = 0) {
  const x = Math.round(p.x), y = Math.round(p.y);
  const talkBob = p.talking && Math.floor(t * 6) % 2 ? -1 : 0;
  const step = p.walking ? Math.floor(t * 8) % 2 : -1;      // which leg is lifted (-1: standing)
  const walkBob = p.walking && step === 1 ? -1 : 0;
  const bob = talkBob || walkBob;
  // shadow
  g.fillStyle = COLORS.shadow; g.fillRect(x - 3, y, 7, 2);
  // body
  g.fillStyle = p.body ?? BODY_COLORS[0]; g.fillRect(x - 2, y - 9 + bob, 5, 6);
  // legs (walking: one lifts a pixel, then the other)
  g.fillStyle = p.legs ?? COLORS.ink;
  g.fillRect(x - 2, y - 3, 2, step === 0 ? 2 : 3);
  g.fillRect(x + 1, y - 3, 2, step === 1 ? 2 : 3);
  // head and hair (facing: the hair sits a pixel to the back)
  g.fillStyle = p.skin ?? SKIN_COLORS[1]; g.fillRect(x - 1, y - 13 + bob, 3, 4);
  g.fillStyle = p.hair ?? COLORS.ink;
  if (p.facing === 'left') { g.fillRect(x - 1, y - 14 + bob, 3, 2); g.fillRect(x + 1, y - 12 + bob, 1, 1); }
  else if (p.facing === 'right') { g.fillRect(x - 1, y - 14 + bob, 3, 2); g.fillRect(x - 1, y - 12 + bob, 1, 1); }
  else g.fillRect(x - 1, y - 14 + bob, 3, 2);
  // the player's gold line
  if (p.you) { g.fillStyle = COLORS.gold; g.fillRect(x - 3, y + 1, 7, 1); }
}

/** The point just over a person's head (where speech goes). */
export function headOf(p) { return { x: p.x, y: p.y - 15 }; }

/** The lab's backdrop: grass, a path across, a row of grass tufts. */
export function drawStage(g, W, H, { pathY = Math.round(H * 0.68), pathH = Math.round(H * 0.18) } = {}) {
  g.fillStyle = COLORS.grass; g.fillRect(0, 0, W, H);
  g.fillStyle = COLORS.path; g.fillRect(0, pathY, W, pathH);
  g.fillStyle = COLORS.grass2; for (let x = 0; x < W; x += 9) g.fillRect(x + ((x / 9) % 2) * 3, pathY - 12, 2, 1);
}

/** A random look. rng: () => [0, 1) (Math.random by default). */
export function randomCharacter(rng = Math.random) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const body = pick(BODY_COLORS);
  let legs = pick(LEG_COLORS);
  if (legs === body) legs = COLORS.ink;
  return { body, hair: pick(HAIR_COLORS), skin: pick(SKIN_COLORS), legs };
}

/** A small seeded random number generator (mulberry32), for repeatable crowds. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Real pixels: every pixel of the canvas snapped to the nearest colour of
 * `palette` (CSS hex strings), fully opaque. Run after drawing a frame when
 * anything smooth (text, scaled images) was drawn on top.
 */
export function snapToPalette(g, W, H, palette = [...Object.values(COLORS), ...BODY_COLORS, ...HAIR_COLORS, ...SKIN_COLORS, ...LEG_COLORS]) {
  const pal = palette.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let best = pal[0], bd = Infinity;
    for (const c of pal) { const e = (c[0] - d[i]) ** 2 + (c[1] - d[i + 1]) ** 2 + (c[2] - d[i + 2]) ** 2; if (e < bd) { bd = e; best = c; } }
    d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
