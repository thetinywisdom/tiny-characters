// The demo's maps (the owner chose them from five mock-ups, Nov 2026): a round radar in the town's
// top-right corner showing the streets round you (north up, you in the middle), and, when it is tapped,
// the big map of the whole town, drawn like a paper map, with the places' names. On the big map tap a
// place to walk there (it closes); tap outside it, Esc or Close to close it. All on the pixel grid.
//
//   makeMaps(town, buildingSize) -> { drawRadar(g, view, you), onRadar(x, y, view),
//                                     drawBig(g, view, you), bigAt(x, y, view) }
//   (x, y and the drawing are in the view's own pixels: g already scaled to town pixels)

const RADAR_R = 26, RADAR_SCALE = 6;
const LIVE = { forest: '#3f6a40', garden: '#8aa86e', gravel: '#c8c0b0', sand: '#e0cc98', paving: '#b8b4aa', grass: '#7aa860', water: '#5a9ad0', court: '#3f86c8', parking: '#6e7277', building: '#d8c8b8', station: '#e8c070', road: '#4a4e54', rail: '#8a7a6a' };
const PAPER = { forest: '#c8d4a8', garden: '#efe6cc', gravel: '#e4d8bc', sand: '#efdcae', paving: '#e0d6c0', grass: '#cfe0a8', water: '#9cc4d8', court: '#a8c4dc', parking: '#d0c8b8', building: '#c89878', station: '#b86a4a', road: '#fffaf0', rail: '#8a6a50' };
// the places' names on the big map, short enough to fit (a layout's area can give its own: mapName)
const SHORT = { 'Shrine grounds': 'Shrine', Schoolyard: 'School', 'Old-town square': 'Square', 'Pond park': 'Park', Playground: 'Play', 'Basketball court': 'Court', 'Station plaza': 'Station', 'Coin parking': 'P' };
// 3 x 5 pixel letters for the names
const LETTERS = { A: '010101111101101', B: '110101110101110', C: '111100100100111', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '111100101101111', H: '101101111101101', I: '111010010010111', K: '101110100110101', L: '100100100100111', M: '101111111101101', N: '101111111111101', O: '111101101101111', P: '110101110100100', Q: '111101101111001', R: '110101110101101', S: '111100111001111', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', Y: '101101010010010', X: '101101010101101', ' ': '000000000000000', '-': '000000111000000' };

/** The town in little: forest, gardens, grounds, buildings, roads, the railway; `scale` town pixels a pixel. */
function picture(town, buildingSize, scale, pal) {
  const W = Math.ceil(town.W / scale), H = Math.ceil(town.H / scale), c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(Math.floor(x / scale), Math.floor(y / scale), Math.max(1, Math.round(w / scale)), Math.max(1, Math.round(h / scale))); };
  const top = town.streets[0], bot = town.streets[town.streets.length - 1] + town.dims.STREET;
  R(pal.forest, 0, 0, town.W, town.H);
  R(pal.garden, town.pad, top, town.W - town.pad * 2, bot - top);
  for (const a of town.areas) R(pal[a.ground] ?? pal.garden, a.x, a.y, a.w, a.h);
  for (const b of town.buildings) { const { w, h } = buildingSize(b); R(b.type.startsWith('station') ? pal.station : pal.building, b.x - w / 2, b.y - h * 0.7, w, h * 0.7); }
  for (const y of town.streets) R(pal.road, 0, y + town.dims.SIDE - 2, town.W, town.dims.ROAD + 4);
  for (const x of town.crossStreets) R(pal.road, x + town.dims.VSIDE - 2, top, town.dims.ROAD + 4, bot - top);
  if (town.railway) R(pal.rail, 0, town.railway.y, town.W, town.railway.h);
  return { canvas: c, W, H, scale, data: g.getImageData(0, 0, W, H).data };
}

/** You on a map: a gold cross on a dark one. */
function youMark(g, x, y, dark = '#2f3236') {
  g.fillStyle = dark; g.fillRect(x - 1, y - 2, 3, 5); g.fillRect(x - 2, y - 1, 5, 3);
  g.fillStyle = '#f2c230'; g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1);
}
function text(g, s, x, y, col) {
  g.fillStyle = col;
  for (const ch of s.toUpperCase()) { const f = LETTERS[ch] ?? LETTERS[' ']; [...f].forEach((b, i) => { if (b === '1') g.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1); }); x += 4; }
}

export function makeMaps(town, buildingSize) {
  const live = picture(town, buildingSize, RADAR_SCALE, LIVE);
  const big = picture(town, buildingSize, 9, PAPER);
  const size = RADAR_R * 2 + 1, radar = document.createElement('canvas'); radar.width = radar.height = size;
  const rg = radar.getContext('2d'), img = rg.createImageData(size, size);
  const corner = (view) => ({ cx: view.w - RADAR_R - 6, cy: RADAR_R + 6 });
  /** The radar: a disc of the live map round you, a dark rim, N at the top. */
  function drawRadar(g, view, you) {
    const ux = Math.floor(you.x / RADAR_SCALE), uy = Math.floor(you.y / RADAR_SCALE), d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4, dx = x - RADAR_R, dy = y - RADAR_R, r = Math.hypot(dx, dy);
      if (r > RADAR_R + 0.5) { d[i + 3] = 0; continue; }
      if (r > RADAR_R - 1.5) { d[i] = 32; d[i + 1] = 36; d[i + 2] = 44; d[i + 3] = 255; continue; }   // the rim
      const sx = ux + dx, sy = uy + dy, j = (sy * live.W + sx) * 4, inside = sx >= 0 && sy >= 0 && sx < live.W && sy < live.H;
      d[i] = inside ? live.data[j] : 63; d[i + 1] = inside ? live.data[j + 1] : 106; d[i + 2] = inside ? live.data[j + 2] : 64; d[i + 3] = 255;
    }
    rg.putImageData(img, 0, 0);
    const { cx, cy } = corner(view);
    g.drawImage(radar, cx - RADAR_R, cy - RADAR_R);
    youMark(g, cx, cy);
    text(g, 'N', cx - 1, cy - RADAR_R + 3, '#f2f2ee');
  }
  const onRadar = (x, y, view) => { const { cx, cy } = corner(view); return Math.hypot(x - cx, y - cy) <= RADAR_R + 1; };
  /** Where the big map sits in the view. */
  const place = (view) => { const s = Math.min((view.h - 14) / big.H, (view.w - 20) / big.W, 1); const W = Math.floor(big.W * s), H = Math.floor(big.H * s); return { s, W, H, x0: Math.floor((view.w - W) / 2), y0: 6 }; };
  /** The big map: the view dimmed, the paper map of the town, you, the places' names, Close. */
  function drawBig(g, view, you) {
    const { s, W, H, x0, y0 } = place(view);
    g.fillStyle = 'rgba(20,22,28,0.82)'; g.fillRect(0, 0, view.w, view.h);
    g.fillStyle = '#8a6a4a'; g.fillRect(x0 - 2, y0 - 2, W + 4, H + 4);
    g.imageSmoothingEnabled = false; g.drawImage(big.canvas, x0, y0, W, H);
    // the names: each place's short name (as much as fits), at its middle
    for (const a of town.areas) {
      if (a.ground === 'water' || a.name === 'Station alley') continue;
      const word = a.mapName ?? SHORT[a.name] ?? a.name.split(' ')[0], fit = Math.max(1, Math.floor((a.w / big.scale * s) / 4)), label = word.slice(0, fit);
      text(g, label, x0 + Math.round((a.x + a.w / 2) / big.scale * s - label.length * 2), y0 + Math.round((a.y + a.h / 2) / big.scale * s) - 2, '#3a2a1a');
    }
    youMark(g, x0 + Math.round(you.x / big.scale * s), y0 + Math.round(you.y / big.scale * s), '#5a3a28');
    text(g, 'N', x0 + W - 5, y0 + 2, '#5a3a28');
    text(g, 'X CLOSE', view.w - 32, view.h - 8, '#f2f2ee');
  }
  /** The town point under (x, y) on the big map, or null outside it. */
  function bigAt(x, y, view) {
    const { s, W, H, x0, y0 } = place(view);
    if (x < x0 || y < y0 || x >= x0 + W || y >= y0 + H) return null;
    return { x: (x - x0) / s * big.scale, y: (y - y0) / s * big.scale };
  }
  return { drawRadar, onRadar, drawBig, bigAt };
}
