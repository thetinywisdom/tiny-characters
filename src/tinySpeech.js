// Tiny Speech: what the tiny people say, the owner's choices (Nov 2026):
//  - in the town, small icon bubbles over people now and then (a mood: love,
//    a hum, thinking, surprise, a question, sleepy, angry), and passers-by
//    who stop and chat in icons, taking turns
//  - tap someone and they say a line that suits them (a salaryman sighs
//    about overtime, a kid wants to play, a zombie groans) as floating text
//    with no box: it types itself out, then rises and fades
//
//   speak(actor, t, rng)            give someone a line that suits them (floating text)
//   emote(actor, icon, t, seconds)  show an icon bubble over someone for a while
//   drawSpeech(g, actors, t, opts)  draw everyone's lines and icons (after the town, so night does not dim them)
//   kindOf(actor), lineFor(actor, rng), moodFor(actor, rng, { night }), SPEAKERS, linesOf(kind, lang)
//   ICONS                           the icon names
//   LANGUAGES, setLanguage(code)    'en' now; 'ja' (Japanese) and 'id' (Indonesian) are ready to fill in
//
// An actor is anything drawn in the town: a person, { cat }, { dog }, { monster }.
// Plain ES module.

import { COLORS, headOf } from './tinyCharacters.js';

const INK = COLORS.ink, WHITE = '#ffffff', FONT = '"DotGothic16", monospace';

// --- the lines, by language ----------------------------------------------------------------
// LINES[language][kind]: what a kind of actor says. Only English is written so
// far; a missing language or kind falls back to English. DotGothic16 has
// Japanese (kana and kanji) and Latin letters, so all three draw with the same font.
export const LANGUAGES = { en: 'English', ja: '日本語', id: 'Bahasa Indonesia' };
const LINES = {
  en: {
    adult: ['Nice day!', 'Where did I park...?', 'I need coffee.', 'Is it going to rain?', "What's for dinner?", 'Hi there!'],
    salaryman: ['Overtime again...', 'Another meeting...', "Train's late again.", 'Just one more email.', 'I need a holiday.'],
    police: ['Stay safe!', 'Move along, please.', 'Watch the traffic!', 'All quiet today.', 'Need directions?'],
    kid: ["Let's play!", "Tag, you're it!", 'I want ice cream!', "School's out!", 'Look, a cat!'],
    student: ['Test tomorrow...', 'See you at club!', 'Did you do the homework?', "I'm going to be late!"],
    elderly: ['Lovely weather.', 'In my day...', 'My back hurts.', 'The sakura are early.', 'Have you eaten?'],
    delivery: ['Package for you!', 'Sign here, please.', 'So many boxes...', 'Running late!'],
    rainy: ['Looks like rain.', 'Good thing I brought my umbrella.'],
    shopper: ['Big sale today!', 'I forgot the milk...', 'These bags are heavy.'],
    cat: ['Meow.', 'Purr...', 'Mrrp?'],
    dog: ['Woof!', 'Arf arf!', '*wags tail*'],
    zombie: ['Uuurgh...', 'Braaains...', 'Hnnngh...'],
    werewolf: ['Grrr!', 'Awoooo!'],
    ghostGirl: ['...', 'Why...?', 'Play with me...'],
    reaper: ['Your time will come.', '...'],
    spider: ['Hsss...', '*click click*'],
    skeleton: ['*rattle rattle*', 'Bone to be wild!'],
    skull: ['Burn!', 'Hahaha!'],
  },
  ja: {},   // Japanese: to write (e.g. salaryman: ['また残業か…'])
  id: {},   // Indonesian: to write (e.g. salaryman: ['Lembur lagi...'])
};
let language = 'en';
/** Choose the language the lines are said in ('en', 'ja', 'id'); unknown codes are ignored. */
export function setLanguage(code) { if (LANGUAGES[code]) language = code; return language; }
export const getLanguage = () => language;

/** What kind of speaker an actor is, from how they look (the lines and moods follow it). */
export function kindOf(a) {
  if (a.monster) return a.monster;
  if (a.cat) return 'cat';
  if (a.dog) return 'dog';
  if (a.top === 'police') return 'police';
  if (a.carry === 'boxes') return 'delivery';
  if (a.top === 'sailor' || a.top === 'gakuran') return 'student';
  if (a.kid) return 'kid';
  if (a.top === 'suit' || a.carry === 'briefcase') return 'salaryman';
  if (a.hair === '#f2efe8' || a.hair === '#b3b0a8' || a.carry === 'stick') return 'elderly';
  if (a.carry === 'umbrella') return 'rainy';
  if (a.carry === 'bag') return 'shopper';
  return 'adult';
}
/** Every kind of speaker. */
export const SPEAKERS = Object.keys(LINES.en);
/** A kind's lines in a language (the current one by default; English where it has none yet). */
export const linesOf = (kind, lang = language) => LINES[lang]?.[kind] ?? LINES.en[kind] ?? LINES.en.adult;
/** A line that suits the actor, in the current language. */
export function lineFor(a, rng = Math.random) {
  const list = linesOf(kindOf(a));
  return list[Math.floor(rng() * list.length)];
}

// --- icon bubbles ----------------------------------------------------------------------------
// 5 x 5 pixel pictures inside a small bubble.
const ICON_ART = {
  heart: [['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'], { r: '#e8402f' }],
  note: [['..kk.', '..k.k', '..k..', 'kkk..', 'kk...'], { k: INK }],
  dots: [['.....', '.....', 'k.k.k', '.....', '.....'], { k: INK }],
  bang: [['..r..', '..r..', '..r..', '.....', '..r..'], { r: '#e8402f' }],
  what: [['.kkk.', '...k.', '..k..', '.....', '..k..'], { k: INK }],
  zzz: [['kkkkk', '...k.', '..k..', '.k...', 'kkkkk'], { k: '#3f7fd6' }],
  anger: [['rr.rr', 'r...r', '.....', 'r...r', 'rr.rr'], { r: '#e8402f' }],
};
export const ICONS = Object.keys(ICON_ART);
// the moods each kind shows now and then (a few repeated, to be likelier)
const MOODS = {
  adult: ['dots', 'note', 'heart', 'what', 'dots'], salaryman: ['dots', 'zzz', 'anger', 'dots'], police: ['bang', 'dots'],
  kid: ['note', 'heart', 'bang', 'note'], student: ['note', 'what', 'dots'], elderly: ['heart', 'zzz', 'dots'],
  delivery: ['bang', 'dots'], rainy: ['dots', 'what'], shopper: ['heart', 'note', 'what'],
  cat: ['heart', 'zzz', 'note'], dog: ['heart', 'note', 'bang'],
};
/** An icon that suits the actor's mood (sleepier at night). */
export function moodFor(a, rng = Math.random, { night = 0 } = {}) {
  if (night > 0.6 && rng() < 0.4) return 'zzz';
  const list = MOODS[kindOf(a)] ?? (a.monster ? ['anger', 'bang'] : MOODS.adult);
  return list[Math.floor(rng() * list.length)];
}

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
/** The top of an actor (where a bubble goes): over a person's head and hat, a monster, a cat or a dog. */
function topOf(a) {
  if (a.monster) return a.y - (a.monster === 'spider' ? 12 : a.monster === 'werewolf' ? 21 : 19);
  if (a.cat) return a.y - 8;
  if (a.dog) return a.y - 10;
  return headOf(a).y;
}
/** An icon bubble (9 x 9 with a tail) over an actor; it pops up a pixel as it appears. */
function drawIcon(g, a, icon, age) {
  const art = ICON_ART[icon];
  if (!art) return;
  const [rows, cols] = art, x = Math.round(a.x), y = Math.round(topOf(a)) - (age < 0.1 ? 0 : 1);
  const bx = x - 4, by = y - 12;
  px(g, INK, bx + 1, by, 7, 9); px(g, INK, bx, by + 1, 9, 7); px(g, WHITE, bx + 1, by + 1, 7, 7);
  px(g, INK, x - 1, by + 9, 2, 1); px(g, INK, x, by + 10, 1, 1);           // the tail
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') px(g, cols[ch], bx + 2 + i, by + 2 + j); }));
}

// --- floating text ---------------------------------------------------------------------------
const TYPE = 18, HOLD = 1.8, FADE = 0.8;                 // letters a second; seconds shown in full; seconds to rise and fade
/** How long a line stays up (typing it out, holding it, rising away). */
export const sayDuration = (text) => [...text].length / TYPE + HOLD + FADE;
/** A line over an actor, no box: white letters edged in ink, typing out, then rising and fading. */
function drawSaid(g, a, text, age, bounds) {
  const letters = [...text], shown = letters.slice(0, Math.min(letters.length, Math.floor(age * TYPE) + 1)).join('');
  const typed = letters.length / TYPE, out = Math.max(0, (age - typed - HOLD) / FADE);
  if (out >= 1) return;
  g.save();
  g.font = `7px ${FONT}`; g.textBaseline = 'bottom'; g.textAlign = 'left';
  const w = g.measureText(text).width;                  // place it by the whole line, so it does not jump as it types
  let x = a.x - w / 2;
  if (bounds) x = Math.max(bounds.x + 1, Math.min(bounds.x + bounds.w - w - 1, x));
  const y = topOf(a) - 2 - out * 6;
  g.globalAlpha = 1 - out;
  g.lineJoin = 'round'; g.lineWidth = 1.6; g.strokeStyle = INK; g.strokeText(shown, x, y);
  g.fillStyle = WHITE; g.fillText(shown, x, y);
  g.restore();
}

// --- giving them something to say ---------------------------------------------------------------
/** Tap: the actor says a line that suits them (floating text) and stops for a moment to say it. */
export function speak(a, t, rng = Math.random) {
  const text = lineFor(a, rng);
  a.say = { text, start: t, until: t + sayDuration(text) };
  a.mood = null;
  return a.say;
}
/** An icon bubble over the actor for `seconds`. */
export function emote(a, icon, t, seconds = 1.8) {
  if (a.say && t < a.say.until) return null;              // a line is up: no icon over it
  a.mood = { icon, start: t, until: t + seconds };
  return a.mood;
}

/**
 * Draw every actor's line or icon. Call it after the town is drawn (with
 * the same transform), so lines stay bright at night. bounds ({ x, y, w, h },
 * the view) keeps long lines inside it.
 */
export function drawSpeech(g, actors, t, { bounds } = {}) {
  for (const a of actors) {
    if (a.say) { if (t < a.say.until) drawSaid(g, a, a.say.text, t - a.say.start, bounds); else a.say = null; }
    else if (a.mood) { if (t < a.mood.until) drawIcon(g, a, a.mood.icon, t - a.mood.start); else a.mood = null; }
  }
}
