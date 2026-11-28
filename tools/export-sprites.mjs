// Export every drawing to PNG frames for the Swift / SpriteKit game:
//   node tools/export-sprites.mjs [outDir] [--no-preview]      (default: export/sprites)
// The Swift game: node tools/export-sprites.mjs ios/TinyRPG/Sprites --no-preview
// Writes <Group>.atlas/<frame>.png (Xcode makes texture atlases of these folders),
// sprites.json (each frame's size, feet point and scale) and a preview sheet per group.
// Needs Playwright (preinstalled here); serves this folder itself.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), preview = !args.includes('--no-preview');
const out = args.find((a) => !a.startsWith('--')) ?? join(root, 'export/sprites');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try { const p = join(root, decodeURIComponent(req.url.split('?')[0])); res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => { console.error(e); process.exitCode = 1; });
await page.goto(`http://localhost:${port}/tools/sprites.html`);
await page.waitForFunction(() => window.spritesReady);
const { groups, anims } = await page.evaluate(() => window.exportSprites());

const index = { anims, groups: {} };
for (const [group, { scale, frames }] of Object.entries(groups)) {
  const dir = join(out, `${group}.atlas`); await mkdir(dir, { recursive: true });
  index.groups[group] = { scale, frames: {} };
  for (const f of frames) {
    await writeFile(join(dir, `${f.name}.png`), Buffer.from(f.png.split(',')[1], 'base64'));
    index.groups[group].frames[f.name] = { w: f.w, h: f.h, ax: f.ax, ay: f.ay };
  }
  console.log(group, frames.length, 'frames');
  if (!preview) continue;
  // a preview sheet: every frame on a green ground, 3x
  const sheet = await page.evaluate(async ({ frames, scale }) => {
    const imgs = await Promise.all(frames.map((f) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = f.png; })));
    const Z = scale === 1 ? 3 : 1, pad = 4, maxW = 1800;
    let x = pad, y = pad, rowH = 0; const at = [];
    imgs.forEach((im) => { const w = im.width * Z, h = im.height * Z; if (x + w + pad > maxW) { x = pad; y += rowH + pad; rowH = 0; } at.push([x, y]); x += w + pad; rowH = Math.max(rowH, h); });
    const c = document.createElement('canvas'); c.width = maxW; c.height = y + rowH + pad;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#9fb08d'; g.fillRect(0, 0, c.width, c.height);
    imgs.forEach((im, i) => g.drawImage(im, at[i][0], at[i][1], im.width * Z, im.height * Z));
    return c.toDataURL('image/png');
  }, { frames, scale });
  await writeFile(join(out, `preview-${group}.png`), Buffer.from(sheet.split(',')[1], 'base64'));
}
await writeFile(join(out, 'sprites.json'), JSON.stringify(index));
await browser.close(); server.close();
