// Small life in the demo town (the owner chose all of it, Nov 2026): people
// sit on benches, ride bikes, stop at a vending machine for a drink, feed
// the ducks, have a picnic; shopkeepers stand at their doors (sweeping in the
// morning, bowing to passers-by) and go home at night when the shutters come
// down; kids play on the swings and the slide and kick a ball in the
// schoolyard; pigeons peck and scatter, crows sit on the wires, a cat naps on
// a wall; dogs greet each other; rubbish goes out in the morning; laundry
// hangs out by day; commuters pour out of the station when a train stops,
// and someone takes a taxi from the rank.
//
//   makeLife({ town, traffic, people, follow, rng }) -> { update(dt, t, hour), sprites, above, bikes }
//     people   the demo's people (life adds a few and gives some of them things to do;
//              anyone with p.busy is left alone by the demo's walking)
//     sprites  extra things to draw with the people (pigeons, the ball, rubbish, the picnic...)
//     above    things drawn over everything (crows on the wires)

import { LOOKS, SKIN_COLORS, facingFor, randomCharacter, seeded } from '../src/tinyCharacters.js';
import { drawNappingCat, drawPigeon, drawCrow, drawPose, drawRubbish, drawTrolley } from '../src/tinyLife.js';
import { closes } from '../src/tinyBuildings.js';
import { emote } from '../src/tinySpeech.js';
import { poleTops } from '../src/tinyStreet.js';

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const near = (a, b, dx, dy = dx) => Math.abs(a.x - b.x) < dx && Math.abs(a.y - b.y) < dy;
const ON_FOOT = (p) => !p.monster && !p.cat && !p.dog && !p.you && !p.kid && !p.busy && !p.job && !p.pose && !p.temp && !p.player;

export function makeLife({ town, traffic, people, follow, rng = Math.random }) {
  const k = town.scale, area = (name) => town.areas.find((a) => a.name === name);
  const props = (type) => town.props.filter((p) => p.type === type);
  const sprites = [], above = [];
  let T = 0, hour = 12;
  const free = (x, y) => !town.blocked(x, y) && !town.roadAt(x, y);

  // --- jobs: walk somewhere, then do something there for a while -------------------------------
  // job: { to: {x, y}, start(p), each(p, u, dt), end(p), dur }
  function give(p, job) {
    p.path = town.findPath(p, job.to);
    if (!p.path) return false;
    p.job = job; p.wait = 0; return true;
  }
  function runJob(p, dt) {
    const j = p.job;
    if (!j.started) {
      if (p.path) return;                                                  // still on the way (the demo walks them)
      if (!near(p, j.to, 4)) { p.job = null; j.drop?.(p); return; }        // never got there: never mind
      j.started = T; p.busy = true; p.walking = false; j.start?.(p);
    }
    const u = (T - j.started) / j.dur;
    if (u >= 1) { p.busy = false; p.pose = null; p.job = null; j.end?.(p); p.wait = 1 + rng() * 3; return; }
    j.each?.(p, u, dt);
  }

  // --- benches ------------------------------------------------------------------------------
  const seats = props('bench').flatMap((b) => [-1, 1].map((s) => ({ bench: b, dx: s * Math.round(3.5 * k), who: null })));
  function sitDown(p) {
    const seat = seats.filter((s) => !s.who && Math.hypot(s.bench.x - p.x, s.bench.y - p.y) < 160 && free(s.bench.x + s.dx, s.bench.y + 3))[0];
    if (!seat) return;
    seat.who = p;
    if (!give(p, {
      to: { x: seat.bench.x + seat.dx, y: seat.bench.y + 3 }, dur: 10 + rng() * 12,
      start: (q) => { q.pose = { kind: 'sitBench' }; q.x = seat.bench.x + seat.dx; q.y = seat.bench.y + 0.5; q.facing = 'down'; },
      end: (q) => { q.y = seat.bench.y + 3; seat.who = null; }, drop: () => { seat.who = null; },
    })) seat.who = null;
  }

  // --- the vending machines: stop, buy a can (it drops with a clunk), drink it ------------------
  function getDrink(p) {
    const m = props('vendingMachine').filter((v) => Math.hypot(v.x - p.x, v.y - p.y) < 240 && free(v.x, v.y + 4)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (!m || people.some((q) => q.job?.machine === m)) return;
    give(p, {
      machine: m, to: { x: m.x, y: m.y + 4 }, dur: 5,
      start: (q) => { q.facing = 'up'; },
      each: (q, u) => { if (u > 0.35 && !q.pose) { q.pose = { kind: 'drink' }; q.can = ['#e8402f', '#3f7fd6', '#f2c230', '#2fa36b'][Math.floor(rng() * 4)]; q.facing = 'down'; } },
    });
  }

  // --- shopkeepers: at the door, sweeping in the morning, bowing to whoever passes -----------------
  const SHOPS = new Set(['shop', 'mixedUse', 'fishmonger', 'florist', 'takoyaki', 'kissaten', 'pharmacy', 'udonSoba', 'sushi']);
  const keepers = [];
  for (const b of town.buildings) {
    if (!SHOPS.has(b.type) || rng() < 0.4) continue;
    const d = town.doorOf(b), x = d.x + Math.round(7 * k), y = d.y - 1;
    if (!free(x, y) || people.some((q) => near(q, { x, y }, 6, 4))) continue;
    const look = randomCharacter(rng);
    const p = { ...look, kid: false, size: undefined, top: 'apron', trim: '#f2f2ee', body: ['#3f7fd6', '#5a3a28', '#2f6a4a', '#8a2a2a'][keepers.length % 4], carry: undefined, x, y, home: { x, y }, facing: 'down', busy: true, keeper: b, talk: 0, bowed: new Set() };
    keepers.push(p); people.push(p);
  }
  function keep(p) {
    const b = p.keeper;
    p.away = !!b.shut && closes(b);                                        // gone home: the shutter is down
    if (p.away) return;
    if (p.pose?.kind === 'bow' && T > p.pose.until) p.pose = null;
    if (p.pose?.kind === 'bow') { p.pose.u = 1 - (p.pose.until - T) / 1.4; return; }
    // someone walks by close in front: a little bow (once each)
    const by = people.find((q) => q !== p && !q.monster && !q.cat && !q.dog && !p.bowed.has(q) && Math.abs(q.x - p.x) < 10 && q.y > p.y - 3 && q.y < p.y + 10);
    if (by) { p.bowed.add(by); if (p.bowed.size > 30) p.bowed.clear(); p.pose = { kind: 'bow', u: 0, until: T + 1.4 }; p.facing = 'down'; return; }
    if (hour >= 6 && hour < 10) {                                          // the morning sweep, a step to and fro
      p.pose = { kind: 'sweep' }; const sx = p.home.x + Math.sin(T * 0.5 + p.home.x) * 4;
      if (free(sx, p.y)) { p.facing = sx < p.x ? 'left' : 'right'; p.x = sx; }
    } else if (p.pose?.kind === 'sweep') { p.pose = null; p.x = p.home.x; p.facing = 'down'; }
  }

  // --- bike riders: on the sidewalks, quicker than walkers ---------------------------------------
  const bikes = [];
  for (let i = 0; i < 4; i++) {
    const at = town.randomSpot(rng);
    const p = { ...randomCharacter(rng), kid: false, carry: undefined, x: at.x, y: at.y, pose: { kind: 'ride' }, bike: ['#3f7fd6', '#e8402f', '#f2f2ee', '#2f8a5a'][i], path: null, wait: rng() * 3, talk: 0, rider: true };
    bikes.push(p); people.push(p);
  }
  // a mix (the owner): two of them on city bikes (one with a child on the seat behind, one with
  // shopping in the basket), and two schoolkids on city bikes in white helmets; their own random
  // stream, so nothing else in the town changes
  const brng = seeded(77);
  bikes[1].city = true; bikes[1].child = { ...randomCharacter(brng), kid: true, carry: undefined, hat: undefined };
  bikes[3].city = true; bikes[3].load = '#e8c840';
  for (const look of [LOOKS.schoolboy, LOOKS.schoolgirl]) {
    const at = town.randomSpot(brng);
    const p = { ...look, skin: SKIN_COLORS[Math.floor(brng() * SKIN_COLORS.length)], kid: true, carry: undefined, x: at.x, y: at.y, pose: { kind: 'ride' }, city: true, helmet: true, bike: ['#c8ccd0', '#3a3d42'][bikes.length % 2], path: null, wait: brng() * 3, talk: 0, rider: true };
    bikes.push(p); people.push(p);
  }

  // --- the playground: swings and the slide ---------------------------------------------------------
  const kid = () => ({ ...randomCharacter(rng), kid: true, size: undefined, carry: undefined, top: undefined });
  const swings = props('swings')[0];
  const swingers = [{ kid: kid(), phase: 0, amp: 0.6 }, rng() < 0.7 ? { kid: kid(), phase: 1.7, amp: 0.45 } : null];
  if (swings) swings.riders = swingers;
  const slide = props('slide')[0], slider = slide && { ...kid(), x: slide.x, y: slide.y + 1, busy: true, talk: 0, slider: true, byDay: true, draw: (g, s, t) => drawPose(g, { ...s, ...(s.drawAt ?? {}), draw: undefined }, t) };
  if (slider) people.push(slider);
  function playSlide() {
    // round and round: up the ladder, a moment at the top, down the chute, back round on the ground
    const L = slide.x - Math.round(11 * k), u = (T * 0.16) % 1, gy = slide.y + 1;
    slider.walking = false; slider.pose = null;
    if (u < 0.25) { const v = u / 0.25; slider.drawAt = { x: L + 3 * k, y: gy - 2 - v * 13 * k }; slider.facing = 'up'; slider.walking = true; }
    else if (u < 0.32) { slider.drawAt = { x: L + 4 * k, y: gy - 2 - 13 * k }; slider.facing = 'right'; }
    else if (u < 0.45) { const v = (u - 0.32) / 0.13; slider.drawAt = { x: L + (9 + v * 13) * k, y: gy - 2 - (13 - v * 13) * k }; slider.facing = 'right'; slider.pose = { kind: 'slide' }; }
    else { const v = (u - 0.45) / 0.55; slider.drawAt = null; slider.x = L + (25 - v * 23) * k; slider.y = gy + 4; slider.facing = 'left'; slider.walking = true; return; }
    slider.x = slider.drawAt.x; slider.y = gy;                              // (sorted just in front of the slide)
  }

  // --- the schoolyard: two kids kicking a ball to each other ----------------------------------------
  const yard = area('Schoolyard'), kickers = [];
  let soccer = null;
  if (yard) {
    const cy = yard.y + Math.round(yard.h * 0.62), cx = yard.x + yard.w / 2;
    for (const dx of [-22, 22]) { const p = { ...kid(), x: cx + dx, y: cy, busy: true, talk: 0, facing: dx < 0 ? 'right' : 'left', byDay: true }; if (free(p.x, p.y)) { kickers.push(p); people.push(p); } }
    if (kickers.length === 2) {
      soccer = { byDay: true, x: kickers[0].x + 4, y: cy + 1, from: 0, start: 0, draw: (g, b) => { px(g, '#f2f2ee', b.x - 1, b.y - 3, 3, 3); px(g, '#2f3236', b.x, b.y - 2); } };
      sprites.push(soccer);
    }
  }
  function playBall() {
    const a = kickers[soccer.from], b = kickers[1 - soccer.from], u = (T - soccer.start) / 2.2;
    a.pose = u < 0.3 ? { kind: 'kick', u: u / 0.3 } : null; b.pose = null;
    const roll = Math.max(0, Math.min(1, (u - 0.18) / 0.7)), ease = 1 - (1 - roll) * (1 - roll);
    const s = (q) => (q.facing === 'left' ? -1 : 1);
    soccer.x = a.x + 4 * s(a) + (b.x - 4 * s(b) - a.x - 4 * s(a)) * ease; soccer.y = a.y + 1 + (b.y - a.y) * ease;
    if (u >= 1) { soccer.from = 1 - soccer.from; soccer.start = T; }
  }

  // --- the pond: someone feeding the ducks ------------------------------------------------------
  const pond = town.areas.find((a) => a.koi), park = area('Pond park');
  let feeder = null;
  if (pond) {
    feeder = { ...LOOKS.grandma, skin: '#e2b08e', carry: undefined, x: pond.x - 6, y: pond.y + pond.h / 2 + 4, path: null, wait: 2, talk: 0, within: park, feeder: true, next: 6 };
    people.push(feeder);
  }
  function feed(p) {
    const spot = { x: pond.x - 6, y: Math.round(pond.y + pond.h / 2 + 2) };
    if (!free(spot.x, spot.y)) return;
    give(p, {
      to: spot, dur: 12,
      start: (q) => { q.facing = 'right'; pond.feedAt = { x: pond.x + 14, y: pond.y + pond.h / 2 }; },
      each: (q, u) => { q.pose = { kind: 'throw', u: (u * 12) % 1.6 < 0.8 ? ((u * 12) % 1.6) / 0.8 : 0.2 }; },
      end: () => { pond.feedAt = null; },
    });
  }

  // --- a picnic in the park: a blanket and a family sitting on it -----------------------------------
  if (park) {
    for (let tries = 0; tries < 30; tries++) {
      const at = town.randomSpot(rng, park), ok = [-8, 0, 8].every((dx) => free(at.x + dx, at.y)) && !(pond && at.x > pond.x - 10 && at.x < pond.x + pond.w + 10 && at.y > pond.y - 6 && at.y < pond.y + pond.h + 8);
      if (!ok) continue;
      sprites.push({ byDay: true, x: at.x, y: at.y - 4, draw: (g, b) => { px(g, '#c8402c', b.x - 12, b.y - 1, 24, 7); for (let i = 0; i < 24; i += 4) for (let j = 0; j < 7; j += 2) px(g, '#f2f2ee', b.x - 12 + i + (j % 4 ? 2 : 0), b.y - 1 + j, 2, 1); px(g, '#a87a4a', b.x + 6, b.y - 1, 4, 3); px(g, '#e8402f', b.x - 9, b.y + 3, 2, 2); } });   // the blanket, a basket, an apple
      [[-6, LOOKS.woman], [2, LOOKS.man], [-1, null]].forEach(([dx, look], i) => {
        const p = { ...(look ?? kid()), ...(look ? { skin: ['#e2b08e', '#c98d65'][i % 2] } : {}), carry: undefined, x: at.x + dx, y: at.y + (i === 2 ? 2 : 0), pose: { kind: 'sitGround' }, busy: true, talk: 0, facing: 'down', byDay: true };
        people.push(p);
      });
      break;
    }
  }

  // --- pigeons: flocks pecking about; anyone close and up they all go, to land somewhere else -------------
  const flocks = [], FLIGHT = 2.9;                                     // a flight, the slowest bird's included (s)
  for (const [name, n] of [['Station plaza', 6], ['Station plaza', 5], ['Old-town square', 5], ['Pond park', 4], ['Shrine grounds', 4]]) {
    const a = area(name);
    if (!a) continue;
    const f = { area: a, birds: [], fly: 0, centre: town.randomSpot(rng, a) };
    for (let i = 0; i < n; i++) { const b = { x: f.centre.x + (rng() - 0.5) * 16, y: f.centre.y + (rng() - 0.5) * 6, h: 0, peck: true, facing: rng() < 0.5 ? 'left' : 'right', draw: drawPigeon, bird: true }; f.birds.push(b); sprites.push(b); }
    flocks.push(f);
  }
  function pigeons(dt) {
    for (const f of flocks) {
      if (f.fly > 0) {
        f.fly -= dt;
        const el = FLIGHT - f.fly;
        // (the owner: more scattered in the air) each bird on its own: a moment later or sooner,
        // its own speed, height and curve out to the side, a flutter; they land spread out
        for (const b of f.birds) {
          const e = Math.max(0, Math.min(1, (el - b.fl.delay) / b.fl.dur)), up = Math.sin(e * Math.PI);
          const dx = b.tx - b.fl.x, dy = b.ty - b.fl.y, d = Math.hypot(dx, dy) || 1;
          const nx = b.fl.x + dx * e - dy / d * b.fl.bend * up + Math.sin(el * 9 + b.fl.delay * 20) * up * 1.5;
          const ny = b.fl.y + dy * e + dx / d * b.fl.bend * up;
          if (e > 0 && e < 1) b.facing = nx < b.x ? 'left' : nx > b.x ? 'right' : b.facing;
          b.x = nx; b.y = ny; b.h = up * b.fl.peak; b.flying = b.h > 0.5;
        }
        if (f.fly <= 0) for (const b of f.birds) { b.x = b.tx; b.y = b.ty; b.h = 0; b.flying = false; }
        continue;
      }
      const scare = people.find((q) => !q.away && !q.busy && (q.walking || q.you) && !(q.monster && ['ghostGirl', 'reaper', 'skull'].includes(q.monster)) && f.birds.some((b) => near(q, b, 12, 7)));
      if (scare) {                                                         // up they go, to land somewhere else in their area
        f.fly = FLIGHT; f.centre = town.randomSpot(rng, f.area);
        for (const b of f.birds) {
          b.tx = f.centre.x + (rng() - 0.5) * 26; b.ty = f.centre.y + (rng() - 0.5) * 10;
          if (!free(b.tx, b.ty)) { b.tx = f.centre.x; b.ty = f.centre.y; }
          b.fl = { x: b.x, y: b.y, delay: rng() * 0.5, dur: 1.6 + rng() * 0.8, peak: 10 + rng() * 16, bend: (rng() - 0.5) * 40 };
        }
        continue;
      }
      for (const b of f.birds) if (rng() < dt * 0.6) {                      // pottering: a step, a turn, peck peck
        const nx = b.x + (rng() - 0.5) * 4, ny = b.y + (rng() - 0.5) * 2;
        if (free(nx, ny) && Math.abs(nx - f.centre.x) < 14 && Math.abs(ny - f.centre.y) < 6) { b.facing = nx < b.x ? 'left' : 'right'; b.x = nx; b.y = ny; }
        b.peck = rng() < 0.7;
      }
    }
  }

  // --- crows on the wires, now and then hopping along; a cat asleep on the block wall ----------------
  const wires = town.wires.filter(([a, b]) => Math.abs(b.x - a.x) > 30);
  const wireAt = ([a, b, sag], u) => { const [p, q] = a.x <= b.x ? [a, b] : [b, a]; return { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u + sag * 4 * u * (1 - u) }; };
  const crows = [];
  for (let i = 0; i < 8 && wires.length; i++) {
    const w = wires[Math.floor(rng() * wires.length)], c = { wire: w, u: 0.15 + rng() * 0.7, facing: rng() < 0.5 ? 'left' : 'right', draw: drawCrow };
    Object.assign(c, wireAt(w, c.u)); crows.push(c); above.push(c);
  }
  for (const p of props('utilityPole')) if (rng() < 0.12) { const [top] = poleTops(p); above.push({ x: top.x + 1, y: top.y, facing: 'right', draw: drawCrow }); }
  const wall = props('blockWall')[0];
  if (wall) sprites.push({ x: wall.x, y: wall.y + 0.5, color: '#e8a060', draw: (g, c, t) => drawNappingCat(g, { ...c, y: wall.y - Math.round(7 * k) + 1 }, t) });

  // --- rubbish day: bags out by the flats in the morning ---------------------------------------
  const rubbish = town.buildings.filter((b) => b.type === 'apartment' || b.type === 'woodApartment').map((b) => {
    const d = town.doorOf(b), x = d.x - Math.round(12 * k);
    return free(x, d.y) ? { x, y: d.y - 1, draw: drawRubbish } : null;
  }).filter(Boolean);

  // --- the rubbish truck (the owner chose the green one, Nov 2026): once each morning while the bags are
  // out it comes round, stops by each pile, a worker in a cap walks the bags to the back, and it drives on
  const WORKER = { body: '#8aa8c0', legs: '#6a88a0', hair: '#2f3236', skin: '#e2b08e', hat: 'cap', hatColor: '#8aa8c0', top: 'jacket', trim: '#c8d8e4' };
  let truck = null, worker = null, roundDone = false;
  // the parcel truck (the owner chose B, the hand trolley, Nov 2026): every minute or two it comes round two
  // or three shops on one street; at each it stops just past the door, hazards blinking, and the driver
  // wheels the parcels in on a trolley and comes back for the next
  const PARCEL_SHOPS = ['shop', 'mixedUse', 'kissaten', 'pharmacy', 'florist', 'fishmonger', 'udonSoba', 'familyRestaurant', 'takoyaki', 'laundromat', 'karaoke', 'sushi'];
  const shopRows = new Map();
  for (const b of town.buildings) if (PARCEL_SHOPS.includes(b.type) || b.shopType) { const r = shopRows.get(b.y) ?? []; r.push(b); shopRows.set(b.y, r); }
  // the driver's uniform (the owner, from a photo): a dark green shirt with a yellow placket, dark green-grey trousers
  const DRIVER = { body: '#2f5a3a', top: 'jacket', trim: '#f2c230', legs: '#3a4a42', hair: '#2f3236', skin: '#e2b08e' };
  let parcel = null, porter = null, nextParcel = 20;
  function deliveries(dt, h) {
    if (!traffic.sendRound) return;
    if (parcel && !traffic.vehicles.includes(parcel)) { parcel = null; if (porter) { sprites.splice(sprites.indexOf(porter), 1); porter = null; } }
    if (!parcel) {
      if ((nextParcel -= dt) > 0 || h < 7 || h >= 20) return;                 // by day only
      const rows = [...shopRows.values()], row = rows[Math.floor(rng() * rows.length)].slice().sort(() => rng() - 0.5).slice(0, 3);
      parcel = traffic.sendRound('parcelTruck', row.map((b) => { const d = town.doorOf(b); return { x: d.x + 20, y: d.y, door: d }; }));
      nextParcel = parcel ? 70 + rng() * 50 : 5;
      return;
    }
    const stop = parcel.atStop;
    if (!stop || parcel.wait <= 0) return;
    parcel.signal = 'h';                                                        // hazards on while it stands
    const door = stop.spot.door, back = { x: parcel.x - 18, y: door.y + 4 };
    if (!porter) { porter = { ...DRIVER, x: back.x, y: back.y, walking: true, leg: 'there', load: true, inside: 0, draw: drawTrolley, talk: 0 }; sprites.push(porter); }
    if (porter.inside > 0) {                                                    // at the door a moment, unloading (the owner: no vanishing)
      porter.walking = false; porter.facing = 'up';
      if ((porter.inside -= dt) < 0.6) porter.load = false;                     // the parcels off, in at the door
      if (porter.inside <= 0) porter.leg = 'back';
      return;
    }
    const to = porter.leg === 'there' ? { x: door.x, y: door.y + 2 } : back, dx = to.x - porter.x, dy = to.y - porter.y, d = Math.hypot(dx, dy), step = 16 * dt;
    porter.facing = facingFor(dx, dy, porter.facing); porter.walking = true;
    if (d > step) { porter.x += dx / d * step; porter.y += dy / d * step; return; }
    porter.x = to.x; porter.y = to.y;
    if (porter.leg === 'there') { porter.inside = 1.2; return; }
    sprites.splice(sprites.indexOf(porter), 1); porter = null; parcel.atStop = null; parcel.wait = 0.5; parcel.signal = null;   // in the back, and on
  }

  // the fire engine (the owner, Nov 2026): every few minutes a call: out of the fire station, lights flashing,
  // round the town, back in
  const fireStation = town.buildings.find((b) => b.type === 'fireStation');
  let nextCall = 40, engine = null;
  function fireCalls(dt) {
    if (!fireStation || !traffic.callOut) return;
    if (engine && !traffic.vehicles.includes(engine)) engine = null;
    if (engine || (nextCall -= dt) > 0) return;
    const d = town.doorOf(fireStation);
    engine = traffic.callOut('fireEngine', { x: d.x, y: d.y }, 35);
    nextCall = engine ? 150 + rng() * 90 : 5;
  }
  function collect(dt, h) {
    if (h < 6) roundDone = false;
    if (!truck && !roundDone && h >= 7 && h < 10.5 && rubbish.length && traffic.sendRound) {
      truck = traffic.sendRound('rubbishTruck', rubbish.filter((r) => !r.collected));
      if (truck) roundDone = true;
    }
    if (!truck) return;
    if (!traffic.vehicles.includes(truck)) { truck = null; return; }
    const stop = truck.atStop;
    if (!stop || truck.wait <= 0) return;
    const bag = stop.spot, back = { x: truck.x - 19, y: truck.y - 8 };
    if (!worker) { worker = { ...WORKER, x: back.x, y: back.y, walking: true, facing: 'up', leg: 'there', talk: 0 }; sprites.push(worker); }
    const to = worker.leg === 'there' ? { x: bag.x, y: bag.y + 3 } : back, dx = to.x - worker.x, dy = to.y - worker.y, d = Math.hypot(dx, dy), step = 22 * dt;
    worker.facing = facingFor(dx, dy, worker.facing);
    if (d > step) { worker.x += dx / d * step; worker.y += dy / d * step; return; }
    worker.x = to.x; worker.y = to.y;
    if (worker.leg === 'there') { worker.leg = 'back'; bag.collected = true; worker.carry = 'bag'; worker.carryColor = '#3f7fd6'; return; }
    sprites.splice(sprites.indexOf(worker), 1); worker = null; truck.atStop = null; truck.wait = 0.5;   // in the back, and on
  }

  // --- dogs greeting: two dogs meet, sniff, wag; their owners stop for a moment --------------------------
  const dogs = people.filter((p) => p.dog);
  let greetings = [];
  function dogsMeet() {
    for (let i = 0; i < dogs.length; i++) for (let j = i + 1; j < dogs.length; j++) {
      const a = dogs[i], b = dogs[j];
      if (a.greet || b.greet || T < (a.calm ?? 0) || T < (b.calm ?? 0) || a.owner.busy || b.owner.busy || !near(a, b, 34, 14) || [a, b, a.owner, b.owner].some((q) => town.roadAt(q.x, q.y))) continue;   // (never in the road)
      const gr = { a, b, until: T + 4 };
      a.greet = b; b.greet = a; a.owner.busy = b.owner.busy = true; a.owner.walking = b.owner.walking = false;
      a.owner.facing = b.owner.x < a.owner.x ? 'left' : 'right'; b.owner.facing = a.owner.x < b.owner.x ? 'left' : 'right';
      emote(a, 'heart', T, 1.6); greetings.push(gr);
    }
    greetings = greetings.filter((gr) => {
      if (T > gr.until) { for (const d of [gr.a, gr.b]) { d.greet = null; d.owner.busy = false; d.calm = T + 25; } return false; }
      for (const [d, o] of [[gr.a, gr.b], [gr.b, gr.a]]) {                  // nose to nose (a little apart)
        const ex = o.x - d.x, ey = o.y - d.y, dist = Math.hypot(ex, ey);
        if (dist > 7) { d.x += ex / dist * 0.5; d.y += ey / dist * 0.5; d.walking = true; } else d.walking = false;
        d.facing = facingFor(ex, ey, d.facing);
      }
      if (T > gr.until - 2 && !gr.b.mood) emote(gr.b, 'note', T, 1.4);
      return true;
    });
  }

  // --- the station: commuters come out when a train stops; someone takes a taxi -----------------------
  const stations = town.buildings.filter((b) => b.type.startsWith('station'));
  let dwelling = false, nextTaxi = 20;
  function commuter(at) {
    const look = rng() < 0.5 ? { ...LOOKS.salaryman, skin: ['#e2b08e', '#f1cdb0', '#c98d65'][Math.floor(rng() * 3)] } : { ...randomCharacter(rng), kid: false };
    return { ...look, x: at.x + (rng() - 0.5) * 6, y: at.y, path: null, wait: 0, talk: 0, temp: true };
  }
  function station(dt) {
    const tr = traffic.train;
    if (!tr) return;
    const now = tr.dwell > 0 && tr.speed === 0;
    if (now && !dwelling) {                                                // a train has just stopped: out they come
      const st = stations.slice().sort((a, b) => Math.abs(a.x - tr.x) - Math.abs(b.x - tr.x))[0], door = town.doorOf(st);
      const n = Math.min(4 + Math.floor(rng() * 3), 20 - people.filter((p) => p.temp).length);
      for (let i = 0; i < n; i++) {
        const p = commuter(door);
        if (!free(p.x, p.y)) continue;
        let to = town.randomSpot(rng);
        for (let k = 0; k < 6 && town.roadAt(to.x, to.y); k++) to = town.randomSpot(rng);
        p.path = Math.hypot(to.x - p.x, to.y - p.y) < 260 ? town.findPath(p, to) : null;
        if (p.path) { p.hold = p.path; p.path = null; p.holdT = i * 0.7; p.busy = true; p.away = true; people.push(p); }   // one after another (inside till then)
      }
    }
    dwelling = now;
    // the taxi rank: now and then someone comes out of the station and gets into the first taxi
    if ((nextTaxi -= dt) <= 0 && town.parked?.length) {
      nextTaxi = 25 + rng() * 25;
      const taxi = town.parked.slice().sort((a, b) => a.x - b.x)[0], st = stations.slice().sort((a, b) => Math.abs(a.x - taxi.x) - Math.abs(b.x - taxi.x))[0];
      const p = commuter(town.doorOf(st)), door = { x: taxi.x - 4, y: taxi.y - 9 };
      if (free(door.x, door.y) && free(p.x, p.y)) {
        people.push(p);
        give(p, { to: door, dur: 0.6, start: (q) => { q.facing = 'down'; }, end: (q) => { q.gone = true; traffic.pickUp(taxi); } });
      }
    }
  }

  // --- each frame -------------------------------------------------------------------------------
  let nextSit = 2, nextDrink = 6;
  function update(dt, t, h) {
    T = t; hour = h;
    // the buildings: laundry out by day, shutters down at night, the windows' own rhythm
    const day = h >= 8 && h < 16, shut = h >= 21 || h < 7;
    for (const b of town.buildings) { b.laundry = day; b.shut = shut; }
    // rubbish out from 6 to 11 in the morning, until the truck has taken it (it stays out while the truck is
    // still on its round: the round takes longer than the town's morning)
    const out = (h >= 6 && h < 11) || (!!truck && h >= 6 && h < 19);
    if (h < 6) for (const r of rubbish) r.collected = false;
    for (const r of rubbish) { const i = sprites.indexOf(r), show = out && !r.collected; if (show && i < 0) sprites.push(r); else if (!show && i >= 0) sprites.splice(i, 1); }
    collect(dt, h);
    fireCalls(dt);
    deliveries(dt, h);
    for (const p of people) {
      if (p.job) runJob(p, dt);
      if (p.hold && (p.holdT -= dt) <= 0 && !people.some((q) => q !== p && !q.away && near(q, p, 5, 3))) { p.path = p.hold; p.hold = null; p.busy = false; p.away = false; }
      if (p.temp && !p.path && !p.hold && !p.job) p.gone = true;           // got where they were going: off home
    }
    for (let i = people.length - 1; i >= 0; i--) if (people[i].gone) people.splice(i, 1);
    if ((nextSit -= dt) <= 0) { nextSit = 2 + rng() * 3; const pool = people.filter((p) => ON_FOOT(p) && !p.path && !p.rider && !p.keeper && !p.feeder); if (pool.length) sitDown(pool[Math.floor(rng() * pool.length)]); }
    if ((nextDrink -= dt) <= 0) { nextDrink = 6 + rng() * 6; const pool = people.filter((p) => ON_FOOT(p) && !p.path && !p.rider && !p.keeper && !p.feeder); if (pool.length) getDrink(pool[Math.floor(rng() * pool.length)]); }
    if (feeder && !feeder.job && (feeder.next -= dt) <= 0 && !feeder.path && h >= 7 && h < 18) { feeder.next = 18 + rng() * 10; feed(feeder); }
    for (const p of keepers) keep(p);
    // the picnic, the playground and the ball game: by day only (home for dinner at six)
    const daytime = h >= 7 && h < 18, hidden = sprites.filter((s) => s.byDay);
    for (const p of people) if (p.byDay) p.away = !daytime;
    for (const s of hidden) s.hidden = !daytime;
    if (swings) { if (!daytime) swings.riders = null; else { swings.riders ??= swingers; for (const r of swings.riders) if (r) r.angle = Math.sin(t * 2.3 + r.phase) * r.amp; } }
    if (slider) playSlide();
    if (soccer) playBall();
    pigeons(dt);
    dogsMeet();
    station(dt);
    for (const c of crows) if (c.wire && rng() < dt * 0.04) {             // a hop along the wire
      c.u = Math.max(0.08, Math.min(0.92, c.u + (rng() - 0.5) * 0.12)); Object.assign(c, wireAt(c.wire, c.u)); c.facing = rng() < 0.5 ? 'left' : 'right';
    }
  }
  // whoever stood where someone now sits or plays steps somewhere else
  for (const q of people) if (q.busy) for (const o of people) if (o !== q && !o.busy && !o.you && !o.dog && near(o, q, 6, 4)) { const at = town.randomSpot(rng, o.within); o.x = at.x; o.y = at.y; o.path = null; }
  return { update, get sprites() { return sprites.filter((s) => !s.hidden); }, above, bikes };
}
