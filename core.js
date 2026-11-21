'use strict';
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, k) => shuffle(a).slice(0, k);
const fmtTime = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const median = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const pct = x => x == null ? '–' : Math.round(x * 100) + '%';
const ms = x => x == null ? '–' : Math.round(x) + ' ms';
const app = () => $('#app');

/* stimulus colours chosen to read on light and dark surfaces */
const STIM = ['#e5484d', '#3e7bfa', '#2f9e6b', '#e9a21a', '#8e5bd8'];
const SHAPES = {
  circle: '<circle cx="50" cy="50" r="40"/>',
  square: '<rect x="12" y="12" width="76" height="76" rx="5"/>',
  triangle: '<polygon points="50,8 93,88 7,88"/>',
  diamond: '<polygon points="50,5 94,50 50,95 6,50"/>',
  star: '<polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"/>',
  hexagon: '<polygon points="27,9 73,9 96,50 73,91 27,91 4,50"/>',
  cross: '<polygon points="36,7 64,7 64,36 93,36 93,64 64,64 64,93 36,93 36,64 7,64 7,36 36,36"/>',
  heart: '<path d="M50 90 L13 53 C-4 34 13 8 34 14 C42 16 47 22 50 28 C53 22 58 16 66 14 C87 8 104 34 87 53 Z"/>'
};
let _uid = 0;
function shapeSVG(name, color, size = 100, fill = 'solid', rot = 0) {
  const tr = rot ? ` transform="rotate(${rot} 50 50)"` : '';
  let defs = '', style;
  if (fill === 'outline') style = `fill:none;stroke:${color};stroke-width:9;stroke-linejoin:round`;
  else if (fill === 'striped') {
    const id = 'p' + (++_uid);
    defs = `<defs><pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" fill="${color}"/></pattern></defs>`;
    style = `fill:url(#${id});stroke:${color};stroke-width:5;stroke-linejoin:round`;
  } else style = `fill:${color}`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="${style};overflow:visible" aria-hidden="true">${defs}<g${tr}>${SHAPES[name]}</g></svg>`;
}

/* ---------- game catalogue (all wording original to this project) ---------- */
const CATS = ['Cognitive', 'Spatial', 'Personality & Emotions'];
const META = [
  { id: 'numerosity', name: 'Numerosity', cat: 'Cognitive', mins: 3, scored: true, measures: 'Number sense, quick estimation',
    blurb: 'Build a target number from the bubbles using the operation shown.',
    desc: 'Each puzzle names an operation (+, −, × or ÷), a target and how many bubbles to use. Find a set of bubbles that hits the target. Early puzzles are two-number sums; as you progress, longer sums, differences, products and quotients mix in, and the operation can change from one puzzle to the next.',
    how: ['Read the operation badge first; it changes between puzzles.', 'Tap bubbles to select them. The working line shows your current result.', 'Once you have the required number of bubbles, the answer is checked for you.', 'Two right in a row moves you up a level; two misses moves you down.'],
    skills: ['Number sense', 'Mental arithmetic', 'Processing speed'],
    strategy: ['Start from the biggest bubble and work out what is still needed. For 24 from three numbers, take 11 and you need 13 from two.', 'For × and ÷, factor the target before scanning: 36 is 4×9, 6×6 or 3×12.', 'For − and ÷ the order does not matter, so look for pairs that are a fixed gap or a fixed multiple apart.', 'If nothing jumps out within a few seconds, skip. A fresh puzzle is cheaper than staring.'],
    mistakes: ['Missing that the operation changed and adding when you should multiply.', 'Clearing and restarting from scratch instead of swapping one bubble.', 'Spending 20 seconds on one hard puzzle that a skip would have replaced.'],
    faq: [['Is there only one correct combination?', 'No. Any selection that meets the condition counts.'], ['Does a skip count against me?', 'A skip earns nothing and leaves your level unchanged, so it only costs the time you spent.']] },
  { id: 'flashback', name: 'Flashback', cat: 'Cognitive', mins: 3, scored: true, measures: 'Working memory, visual recall',
    blurb: 'Hold a moving window of shapes in mind and flag every repeat.',
    desc: 'A working-memory test from the n-back family. Cards arrive in an unbroken stream, and for each one you say whether it repeats the card from N positions earlier. The rule tightens as you succeed: N climbs from 1 to 3, and in the final stage a repeat has to match on colour as well as outline.',
    how: ['One shape at a time appears on the card, with no pause between items.', 'Compare the current card with the one N cards earlier. The first rule is N = 1.', 'Each card gives you about 2.7 seconds to answer, counting the blank after it. Silence is scored as “Too slow”.', 'Every 10 answers are reviewed. 80% or better unlocks a harder rule; under 50% steps you back.'],
    skills: ['Working memory', 'Visual recall', 'Concentration'],
    strategy: ['Say the window under your breath (“star, circle, star”) so it has a rhythm.', 'At N = 2 or 3, update the window the moment a card appears, then decide, then drop the oldest item.', 'When colour joins the rule, a same-outline different-colour card is a trap. Check colour last, only when the outline matches.', 'Always answer. A blank is always wrong, while a guess is right about two times in three.'],
    mistakes: ['Comparing with the previous card out of habit after the rule moves to N = 2.', 'Freezing on a hard card and losing the window for the next one too.', 'Forgetting that colour matters in the last stage.'],
    faq: [['How is it scored here?', 'Each correct answer earns points equal to N, plus one when colour is part of the rule. Accuracy, misses, false alarms and reaction time are listed separately.'], ['Why does it feel so hard?', 'Keeping a moving window of items is exactly what it measures. Practice moves the format out of the way so all your attention goes to the memory load.']] },
  { id: 'pathfinder', name: 'Pathfinder', cat: 'Spatial', mins: 5, scored: true, measures: 'Spatial reasoning, path planning',
    blurb: 'Lay road tiles across a grid until the two ends join up.',
    desc: 'A grid with an entrance on the left and an exit on the right. Some road pieces are fixed. Fill the gaps from a tray of tiles, which always includes a couple of spares, until one continuous road joins the two ends. Each solve grows the grid; skipping shrinks it again.',
    how: ['Locate IN on the left edge and OUT on the right edge.', 'Tap a tray tile, then an empty cell, to place it.', 'Tap a placed tile to send it back to the tray.', 'The puzzle completes as soon as the road connects. Skipping steps you down a grid size.'],
    skills: ['Spatial reasoning', 'Planning', 'Visual scanning'],
    strategy: ['Work inwards from both ends; the fixed tiles beside IN and OUT tell you which openings the next cells need.', 'Count the openings each gap needs before you reach for the tray.', 'Leftover tiles are decoys. You do not need to use every tile.'],
    mistakes: ['Filling cells left to right without checking the exit side.', 'Trying to use every tray tile.', 'Skipping too early; each skip makes the next grid smaller and worth less.'],
    faq: [['Can tiles be rotated?', 'No. Each tile has a fixed orientation, so choosing the right one is the spatial problem.'], ['Is there more than one solution?', 'Sometimes. Any connected road counts.']] },
  { id: 'digitspan', name: 'Digitspan', cat: 'Cognitive', mins: 3, scored: true, measures: 'Working memory, sequence recall',
    blurb: 'Watch a string of characters flash by, then type it back.',
    desc: 'Characters appear one by one, then you type the string back. A correct answer adds one character to the next string; two misses in a row remove one. From five characters on, letters join the digits, and some rounds ask for the string last-to-first.',
    how: ['Watch each character as it flashes up.', 'When the keypad appears, type the string back. Check the prompt: some rounds want it backwards.', 'Use the keypad or your keyboard. Backspace corrects, Enter submits.', 'Right answers lengthen the next string; two misses shorten it.'],
    skills: ['Working memory', 'Sequence recall', 'Attention'],
    strategy: ['Group the string into threes and fours, like a phone number: 4 8 1 · 7 3 9.', 'Rehearse silently while it plays rather than after it ends.', 'For backwards rounds, read your chunks in reverse order, then reverse inside each chunk.'],
    mistakes: ['Missing the “backwards” prompt.', 'Waiting until the end to start rehearsing.', 'Treating letters differently from digits instead of saying them as one string.'],
    faq: [['How is it scored?', 'Each correct string scores its length; backwards strings earn 2 extra.'], ['Which letters are used?', 'Eight letters that cannot be confused with digits: A C F H K M P T.']] },
  { id: 'disconumbers', name: 'Disconumbers', cat: 'Cognitive', mins: 3, scored: true, measures: 'Working memory, mental arithmetic',
    blurb: 'Track a lighting sequence, repeat it, then total the numbers.',
    desc: 'Numbered circles flash one after another. Repeat the flashing order by tapping, then choose the total of the numbers that flashed. Longer sequences hide the numbers except while a circle is lit, use larger values and move to a 4×4 grid.',
    how: ['Watch which circles flash and in what order.', 'Tap the circles in that same order.', 'Choose the total of the flashed numbers from four options.', 'Both parts right adds a circle next round; both wrong removes one.'],
    skills: ['Working memory', 'Mental arithmetic', 'Divided attention'],
    strategy: ['Keep a running total as the circles flash rather than adding at the end.', 'Remember positions as a path shape (an L, a zig-zag) instead of a list.', 'Order and total are scored separately, so a wrong order does not stop you earning the total.'],
    mistakes: ['Losing the running total when numbers become hidden.', 'Watching numbers so closely that the order is lost.', 'Rushing the total question; it is not timed separately.'],
    faq: [['Can a circle flash twice?', 'No. Each round uses different circles.'], ['When do numbers disappear?', 'From five-circle sequences on, numbers show only while their circle is lit.']] },
  { id: 'puzzle', name: 'Puzzle', cat: 'Spatial', mins: 7, scored: true, measures: 'Visual memory, pattern recreation',
    blurb: 'Study a picture for a few seconds, then swap tiles to restore it.',
    desc: 'An abstract picture is shown for five seconds, then sliced into a grid and shuffled. Swap tiles two at a time until the picture is whole again. Solved pictures move you up from 3×3 to 4×4 and then 5×5.',
    how: ['Study the picture for five seconds, or start early.', 'Tap one tile, then another, to swap them.', 'A fully restored picture submits itself. “Submit as is” scores the tiles already in place.', 'Each solved picture raises the grid size.'],
    skills: ['Visual memory', 'Pattern recreation', 'Spatial reasoning'],
    strategy: ['Memorise the corners and the biggest blocks of colour first; they anchor everything else.', 'Name colour regions while you look (“blue top-left, orange band across the middle”).', 'Fix one row at a time; it stops you undoing earlier swaps.'],
    mistakes: ['Spending the five seconds on small details instead of the layout.', 'Swapping randomly instead of placing one known tile per swap.', 'Submitting early when two swaps would finish it.'],
    faq: [['Can I see the picture again?', 'No. Once the tiles are shuffled, the original is hidden.'], ['How is it scored?', 'A solved picture earns one point per tile plus a bonus; a partial submission earns half a point per tile in place.']] },
  { id: 'portrait', name: 'Portrait', cat: 'Personality & Emotions', mins: 5, scored: false, measures: 'Self-reflection, work-style traits',
    blurb: 'Choose between two pictured work habits, again and again.',
    desc: 'Fifty forced choices between two illustrated work habits. Some pairs are opposite ends of one trait; others put two different traits head to head, so you cannot simply pick the “nice” answer. The result is a five-dimension work-style profile.',
    how: ['Two illustrated habits appear side by side.', 'Pick the one that is more like you, even if both or neither fit perfectly.', 'Go with your first reaction; there are 50 items.', 'Your work-style profile appears at the end.'],
    skills: ['Self-awareness', 'Work-style preferences', 'Consistency'],
    strategy: ['Answer as you actually work, not as you think an employer wants.', 'Similar trade-offs come up more than once. Consistency matters more than any single answer.', 'Think of a concrete recent week at work or study when an item feels abstract.'],
    mistakes: ['Trying to guess the “right” answer, which produces an inconsistent profile.', 'Overthinking; slow, second-guessed answers are less accurate.', 'Answering as your ideal self rather than your everyday self.'],
    faq: [['Is there a good or bad profile?', 'No. Each end of each dimension suits some roles better than others.'], ['Is my profile saved?', 'Yes, in this browser, alongside your other results.']] },
  { id: 'portraitxt', name: 'PortraitXT', cat: 'Personality & Emotions', mins: 5, scored: false, measures: 'Self-assessment, personality traits',
    blurb: 'Rate statements about your habits on a five-point scale.',
    desc: 'Fifty statements about how you work, one at a time. Rate each from strongly disagree to strongly agree. About a third are worded in reverse, which lets the result report how consistent your answers were as well as your five trait scores.',
    how: ['Read the statement.', 'Choose how much you agree, from 1 (strongly disagree) to 5 (strongly agree).', 'Keys 1–5 also work.', 'Your trait profile and a consistency score appear at the end.'],
    skills: ['Self-assessment', 'Personality traits', 'Response consistency'],
    strategy: ['Use the whole scale. Answering only 3s gives a flat profile.', 'Some statements are reversed. Read each one to the end.', 'Keep a steady pace; overthinking adds noise.'],
    mistakes: ['Missing a negative word (“rarely”, “prefer not”) in a reversed statement.', 'Sticking to the middle of the scale.', 'Rushing the last ten items after a careful start.'],
    faq: [['What are the five traits?', 'Drive, Collaboration, Organisation, Composure and Curiosity.'], ['What is the consistency score?', 'It compares answers to statements about the same trait that are worded in opposite directions.']] },
  { id: 'shapedance', name: 'Shapedance', cat: 'Spatial', mins: 3, scored: true, measures: 'Pattern recognition, visual comparison',
    blurb: 'Spot every copy of the target among near-identical lures.',
    desc: 'A target sits above a grid of look-alikes. Select every exact copy, then confirm. Most items share one feature with the target to trip you up. Later levels add fill patterns that must match and then rotate the items; a rotated copy still counts.',
    how: ['Study the target: outline, colour and, later, fill.', 'Tap every item that matches it.', 'Press Done (or Enter) when you have them all.', 'A clean round raises the level: bigger grid, closer lures, then rotation.'],
    skills: ['Visual comparison', 'Attention to detail', 'Processing speed'],
    strategy: ['Filter on the rarest feature first, usually colour, then check the outline.', 'Scan row by row so you never revisit an item.', 'A wrong pick costs as much as a missed one, so confirm before tapping.'],
    mistakes: ['Selecting items that match on two of three features.', 'Treating a rotated copy as different.', 'Pressing Done before scanning the last row.'],
    faq: [['How is it scored?', 'One point per correct pick, minus one per wrong pick, plus a bonus for a clean round.']] },
  { id: 'emotions', name: 'E-Motions', cat: 'Personality & Emotions', mins: 4, scored: true, measures: 'Emotion recognition',
    blurb: 'Name the feeling behind each facial expression.',
    desc: 'A face appears and you choose which of six basic emotions it shows: happiness, sadness, anger, surprise, fear or disgust. You see straight away whether you were right. Each streak of correct answers makes the next expressions subtler.',
    how: ['Look at the brows, eyes and mouth.', 'Pick one of the six emotions.', 'Keys 1–6 also work.', 'Three right in a row makes the expressions subtler.'],
    skills: ['Emotion recognition', 'Social perception', 'Attention to detail'],
    strategy: ['Read the brows first: raised (surprise, fear), pulled down (anger, disgust), inner ends up (sadness).', 'Fear and surprise both widen the eyes; fear also tenses the brows inwards.', 'Disgust lifts the upper lip and wrinkles the nose; anger tightens the mouth.'],
    mistakes: ['Confusing fear with surprise.', 'Confusing disgust with anger.', 'Judging from the mouth alone when expressions get subtle.'],
    faq: [['Which emotions appear?', 'The six basic ones: happiness, sadness, anger, surprise, fear and disgust.']] },
  { id: 'singularity', name: 'Singularity', cat: 'Spatial', mins: 3, scored: true, measures: 'Attention to detail, visual scanning',
    blurb: 'One shape in the grid is a mirror image. Find it fast.',
    desc: 'A grid of identical block shapes hides one mirror image. From level 3 every shape is also turned at a random angle, so you must tell a rotation (still the same) from a reflection (the odd one out).',
    how: ['Scan the grid.', 'Tap the shape that differs from the rest.', 'Rotated shapes are the same shape. Only a mirror image is different.', 'Two right in a row raises the level and the grid grows.'],
    skills: ['Visual scanning', 'Mental rotation', 'Attention to detail'],
    strategy: ['Pick one distinctive feature, such as a lone block sticking out, and track which side it is on.', 'Compare a candidate with two others, not one.', 'A wrong tap resets your streak, so take one confirming glance.'],
    mistakes: ['Picking the shape that is merely rotated more than the others.', 'Scanning randomly instead of row by row.'],
    faq: [['How is it scored?', 'Points equal to the current level for each correct pick.']] },
  { id: 'teamchat', name: 'Teamchat', cat: 'Personality & Emotions', mins: 5, scored: true, measures: 'Communication, workplace judgement',
    blurb: 'Answer teammates in a work chat and see which replies land best.',
    desc: 'Twenty situations in a project team’s chat channel. Pick one of three replies each time. Every reply is rated for how well it moves the work forward while keeping the relationship intact, and the end review shows the strongest reply for every situation alongside your style profile.',
    how: ['Read the incoming message.', 'Choose one of three replies (keys 1–3 work).', 'The conversation moves on through 20 work situations.', 'The review at the end shows each strongest reply and why.'],
    skills: ['Communication', 'Collaboration', 'Judgement'],
    strategy: ['The strongest replies usually do two things: acknowledge the person and propose a concrete next step.', 'Avoid blame and vague promises.', 'A time-box (“two hours, then a plan B”) is often better than an open-ended yes or no.'],
    mistakes: ['Agreeing to everything without checking capacity.', 'Being blunt with someone who is struggling.', 'Being sympathetic without suggesting any action.'],
    faq: [['Is there a right answer?', 'Replies are rated 0–2. The highest-rated reply both solves the problem and treats the person well.']] },
  { id: 'pulse', name: 'Pulse', cat: 'Personality & Emotions', mins: 2, scored: true, measures: 'Impulse control, reaction discipline',
    blurb: 'Hit the button for red, and only red.',
    desc: 'Coloured dots flash in random places. Press Space or tap only for red; let every other colour pass, including orange lures. Holding back correctly also earns points. The pace adapts: accurate play speeds the dots up and mistakes slow them down.',
    how: ['Watch the play area.', 'Red dot: press Space or tap as fast as you can.', 'Any other colour: do nothing.', 'The pace rises while you are accurate and eases after mistakes.'],
    skills: ['Impulse control', 'Reaction speed', 'Sustained attention'],
    strategy: ['Keep your finger ready but decide on colour before moving.', 'Treat warm colours as “wait” until you see true red.', 'A false alarm costs more than a slightly slower hit.'],
    mistakes: ['Pressing on orange.', 'Pressing in the gap between dots.', 'Slowing down so much after an error that red dots expire.'],
    faq: [['How is it scored?', '10 points per hit plus a speed bonus, 2 per correctly ignored dot, minus 10 per false alarm and 5 per missed red.']] },
];
const META_BY = Object.fromEntries(META.map(m => [m.id, m]));
const IMPL = {};
const catClass = c => 'cat-' + c.split(' ')[0];

/* ---------- storage (this browser only) ---------- */
const Store = {
  key: 'agym.v1', data: { attempts: [], interviews: [], plan: {} },
  load() { try { const s = localStorage.getItem(this.key); if (s) this.data = Object.assign({ attempts: [], interviews: [], plan: {} }, JSON.parse(s)); } catch (e) {} },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  add(a) { this.data.attempts.push(a); this.save(); },
  forGame(id, full = true) { return this.data.attempts.filter(a => a.game === id && (!full || !a.quick)).sort((x, y) => x.ts - y.ts); },
};

/* ---------- sound (synthesised, no audio files) ---------- */
const Sfx = {
  on: (() => { try { return localStorage.getItem('agym.sound') !== 'off'; } catch (e) { return true; } })(),
  ac: null,
  toggle() { this.on = !this.on; try { localStorage.setItem('agym.sound', this.on ? 'on' : 'off'); } catch (e) {} return this.on; },
  tone(f, t0, dur, type = 'sine', vol = 0.12) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
    const s = ac.currentTime + t0;
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(vol, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.start(s); o.stop(s + dur + 0.02);
  },
  play(kind) {
    if (!this.on) return;
    try {
      if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ac.state === 'suspended') this.ac.resume();
      const T = this.tone.bind(this);
      ({
        ok: () => { T(660, 0, 0.09); T(880, 0.07, 0.12); },
        bad: () => { T(196, 0, 0.18, 'square', 0.06); },
        slow: () => { T(330, 0, 0.12, 'triangle'); T(262, 0.1, 0.16, 'triangle'); },
        level: () => { T(523, 0, 0.1); T(659, 0.08, 0.1); T(784, 0.16, 0.18); },
        down: () => { T(392, 0, 0.12, 'triangle'); T(294, 0.1, 0.18, 'triangle'); },
        tick: () => { T(1200, 0, 0.04, 'sine', 0.05); },
        go: () => { T(880, 0, 0.18); },
        count: () => { T(440, 0, 0.1, 'sine', 0.08); },
        end: () => { T(784, 0, 0.12); T(659, 0.1, 0.12); T(523, 0.2, 0.25); },
        best: () => { [523, 659, 784, 1047].forEach((f, i) => T(f, i * 0.09, 0.16)); },
      }[kind] || (() => {}))();
    } catch (e) {}
  },
};
const SPEAKER = on => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${on ? '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>' : '<path d="M17 9l5 6M22 9l-5 6"/>'}</svg>`;
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const levelNum = t => { const m = String(t).match(/\d+/); return m ? +m[0] : null; };

/* ---------- game engine ---------- */
let ACTIVE = null;
function stopActive() { if (ACTIVE) { ACTIVE.kill(); ACTIVE = null; } }

const TUTORIAL_GOAL = 5; // correct answers before the tutorial says you are ready
function startGame(meta, { quick = false, onDone = null, mock = false, label = '', tutorial = false } = {}) {
  stopActive();
  const total = tutorial ? Infinity : quick ? 60 : meta.mins * 60;
  app().innerHTML = `<div class="play">
    ${tutorial ? `<div class="coach" id="coach" aria-live="polite">
      <div class="coach-top"><span class="chip acc">Tutorial · untimed · not scored</span><span class="sp"></span><span class="small muted" id="cgoal">${meta.scored ? `0 / ${TUTORIAL_GOAL} correct` : 'No right answers here'}</span></div>
      <p class="coach-step"><b id="cnum">Step 1 of ${meta.how.length}</b> <span id="ctext">${meta.how[0]}</span></p>
      <p class="coach-why" id="why" hidden></p>
      <div class="row"><button class="btn ghost sm" id="cprev">Back</button><button class="btn ghost sm" id="cnext">Next tip</button><span class="sp"></span><a class="btn sm" id="creal" href="#play-${meta.id}">Start the real game</a></div></div>` : ''}
    <div class="playbar"><button class="btn ghost sm" id="quit">Quit</button><h1 class="playname">${esc(meta.name)}</h1>
      <span class="chip acc" id="lv"></span>${label ? `<span class="chip">${esc(label)}</span>` : ''}<span class="sp"></span>
      <span class="scorebox"><span class="mono small muted" id="sc"></span><span class="delta" id="dl" aria-hidden="true"></span></span><span class="timer" id="tm" aria-label="Time left">${tutorial ? 'Untimed' : fmtTime(total)}</span>
      <button class="iconbtn" id="snd" aria-pressed="${Sfx.on}" aria-label="Sound">${SPEAKER(Sfx.on)}</button></div>
    <div class="timebar"${tutorial ? ' hidden' : ''}><i id="tb"></i></div>
    <div class="stagewrap"><div class="fb" id="fb" role="status" aria-live="polite"></div><div class="stage" id="stage"></div><p class="hint" id="hint"></p></div></div>`;
  window.scrollTo(0, 0);
  const timers = new Set(), keys = [];
  let alive = true, fbT = null, t0 = 0, iv = null, game = null, lastLevel = null, lastScore = 0, lastTick = null, step = 0, wins = 0;
  const wrap = $('.stagewrap');
  const showStep = i => { step = Math.max(0, Math.min(meta.how.length - 1, i)); $('#cnum').textContent = `Step ${step + 1} of ${meta.how.length}`; $('#ctext').textContent = meta.how[step]; $('#cprev').disabled = step === 0; $('#cnext').disabled = step === meta.how.length - 1; };
  if (tutorial) { $('#cprev').onclick = () => showStep(step - 1); $('#cnext').onclick = () => showStep(step + 1); showStep(0); }
  // restart a CSS animation class on an element
  const anim = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const ctx = {
    stage: $('#stage'),
    after(ms, fn) { const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms); timers.add(id); return id; },
    key(fn) { keys.push(fn); },
    // dir: 'up' | 'down' when the game knows; otherwise inferred from the first number in the label
    level(t, dir) {
      const el = $('#lv'); if (el.textContent === t) return;
      const a = levelNum(lastLevel), b = levelNum(t);
      if (!dir && a != null && b != null) dir = b > a ? 'up' : b < a ? 'down' : null;
      el.textContent = t;
      if (lastLevel != null) {
        anim(el, 'pop');
        if (dir === 'up') { Sfx.play('level'); anim(wrap, 'hit-level'); }
        else if (dir === 'down') Sfx.play('down');
        // 'quiet': label changes without a sound (used by Pulse, whose pace shifts constantly)
      }
      lastLevel = t;
    },
    hint(t) { $('#hint').textContent = t; },
    score(n) {
      $('#sc').textContent = 'Score ' + n;
      const d = n - lastScore; lastScore = n;
      if (d) { const dl = $('#dl'); dl.textContent = (d > 0 ? '+' : '') + d; dl.className = 'delta ' + (d > 0 ? 'up' : 'down'); anim(dl, 'float'); }
    },
    progress(t) { $('#sc').textContent = t; },
    flash(kind, text, dur = 650) {
      const f = $('#fb'); f.className = 'fb show ' + kind; f.textContent = text; clearTimeout(fbT); fbT = setTimeout(() => f.classList.remove('show'), dur);
      if (kind === 'ok') { Sfx.play('ok'); anim(wrap, 'hit-ok'); }
      else if (kind === 'bad') { Sfx.play('bad'); anim(wrap, 'hit-bad'); buzz(40); }
      else if (kind === 'slow') { Sfx.play('slow'); anim(wrap, 'hit-slow'); buzz([20, 40, 20]); }
      if (tutorial && meta.scored) {
        if (kind === 'ok') {
          wins++; ctx.explain('');
          $('#cgoal').textContent = `${Math.min(wins, TUTORIAL_GOAL)} / ${TUTORIAL_GOAL} correct`;
          if (wins === TUTORIAL_GOAL) { Sfx.play('level'); $('#coach').classList.add('ready'); $('#cgoal').textContent = 'You’re ready. Keep practising or start the real game.'; anim($('#creal'), 'pop'); }
        }
      }
    },
    // tutorial-only coaching line: why an answer was right or wrong. No-op in timed games.
    explain(text) { if (!tutorial) return; const w = $('#why'); w.hidden = !text; w.textContent = text ? 'Why: ' + text : ''; },
    tutorial,
    slow: tutorial ? 1.6 : 1, // multiply on-screen timings by this so the tutorial is easier to follow
    elapsed() { return t0 ? (performance.now() - t0) / 1000 : 0; },
    finish() { end(); },
    get alive() { return alive; },
  };
  const onKey = e => {
    if (!alive || !game) return;
    if (e.target.matches && e.target.matches('input,textarea,select')) return;
    if (['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key) && !(e.target.closest && e.target.closest('.pzboard'))) e.preventDefault();
    keys.forEach(f => f(e));
  };
  document.addEventListener('keydown', onKey);
  function kill() { alive = false; clearInterval(iv); timers.forEach(clearTimeout); timers.clear(); document.removeEventListener('keydown', onKey); }
  function end() {
    if (!alive || !game) return;
    kill(); ACTIVE = null;
    Sfx.play('end');
    if (tutorial) { // never saved: show a short wrap-up instead of a scored result
      app().innerHTML = `<div class="result"><div class="score-hero"><div><div class="big">✓</div></div><div><h1 class="h2">${esc(meta.name)} tutorial done</h1>
        <p class="muted" style="margin-top:6px">Tutorial rounds are not saved. When you’re ready, play the real ${meta.mins}-minute version.</p></div></div>
        <div class="row"><a class="btn" href="#play-${meta.id}">Start the real game</a><button class="btn ghost" id="again">Tutorial again</button><a class="btn ghost" href="#game-${meta.id}">Back to ${esc(meta.name)}</a></div></div>`;
      $('#again').onclick = () => startGame(meta, { tutorial: true });
      focusMain(); return;
    }
    const r = game.result();
    const att = { game: meta.id, ts: Date.now(), quick, mock, secs: Math.round(Math.min(total, ctx.elapsed())),
      score: meta.scored ? (r.score ?? 0) : null, accuracy: r.accuracy ?? null, stats: r.stats || [], profile: r.profile || null };
    Store.add(att);
    if (onDone) onDone(att, r); else showResult(meta, att, r);
  }
  ACTIVE = { kill };
  $('#quit').onclick = () => { stopActive(); location.hash = mock ? '#mock' : '#game-' + meta.id; route(); };
  $('#snd').onclick = e => { const on = Sfx.toggle(); const b = e.currentTarget; b.innerHTML = SPEAKER(on); b.setAttribute('aria-pressed', on); if (on) Sfx.play('ok'); };
  // 3-2-1 countdown so the clock never starts while you are still reading
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let n = 3;
  ctx.stage.innerHTML = `<div class="countdown" aria-live="assertive"><span id="cdn">${n}</span><small>${esc(meta.how[1])}</small></div>`;
  const go = () => {
    if (!alive) return;
    t0 = performance.now();
    Sfx.play('go');
    if (!tutorial) iv = setInterval(() => {
      const left = total - ctx.elapsed();
      const tm = $('#tm'); if (!tm) return;
      tm.textContent = fmtTime(left); tm.classList.toggle('low', left <= 15);
      $('#tb').style.width = Math.max(0, left / total * 100) + '%';
      $('#tb').classList.toggle('low', left <= 15);
      // last 10 seconds: one soft tick per second and a pulsing timer
      const s = Math.ceil(left);
      if (left > 0 && s <= 10 && s !== lastTick) { lastTick = s; Sfx.play('tick'); anim(tm, 'pulse'); }
      if (left <= 0) end();
    }, 200);
    ctx.stage.innerHTML = '';
    game = IMPL[meta.id](ctx);
  };
  Sfx.play('count');
  const tick = () => { if (--n <= 0) return go(); const c = $('#cdn'); if (c) { c.textContent = n; anim(c, 'pop'); } Sfx.play('count'); ctx.after(reduce ? 500 : 800, tick); };
  ctx.after(reduce ? 500 : 800, tick);
}

/* ---------- charts ---------- */
function liftData() {
  const out = [];
  for (let k = 1; k <= 5; k++) {
    const lifts = [];
    for (const m of META) {
      if (!m.scored) continue;
      const a = Store.forGame(m.id);
      if (a.length >= k && a[0].score > 0) lifts.push(a[k - 1].score / a[0].score - 1);
    }
    out.push({ k, lift: median(lifts), n: lifts.length });
  }
  return out;
}
function liftChart() {
  const d = liftData();
  if (!d[1].n) return `<div class="empty">Play any scored game at full length at least twice to see your score lift by attempt.</div>`;
  const W = 560, H = 230, pad = 34, bw = 64, gap = (W - pad * 2 - bw * 5) / 4;
  const vals = d.filter(x => x.lift != null).map(x => x.lift);
  const mx = Math.max(0.1, ...vals.map(Math.abs));
  const neg = vals.some(v => v < 0), base = neg ? H / 2 : H - 40, span = neg ? H / 2 - 30 : H - 80;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Median score change by attempt number"><line class="grid" x1="${pad}" x2="${W - pad}" y1="${base}" y2="${base}"/>`;
  d.forEach((x, i) => {
    const cx = pad + i * (bw + gap), ord = ['1st', '2nd', '3rd', '4th', '5th'][i];
    if (i === 0) s += `<rect class="bar base" x="${cx}" y="${base - 6}" width="${bw}" height="6" rx="2"/><text x="${cx + bw / 2}" y="${base - 14}" text-anchor="middle" class="lbl">base</text>`;
    else if (x.lift != null) {
      const hgt = Math.max(3, Math.abs(x.lift) / mx * span), y = x.lift >= 0 ? base - hgt : base;
      s += `<rect class="bar" x="${cx}" y="${y}" width="${bw}" height="${hgt}" rx="4"/><text class="lbl" x="${cx + bw / 2}" y="${x.lift >= 0 ? y - 7 : y + hgt + 15}" text-anchor="middle">${x.lift >= 0 ? '+' : ''}${Math.round(x.lift * 100)}%</text>`;
    } else s += `<text x="${cx + bw / 2}" y="${base - 10}" text-anchor="middle">no data</text>`;
    s += `<text x="${cx + bw / 2}" y="${H - 8}" text-anchor="middle">${ord}${i && x.n ? ` · ${x.n} game${x.n > 1 ? 's' : ''}` : ''}</text>`;
  });
  return s + '</svg><p class="small muted" style="margin-top:8px">Median change versus your first full-length attempt, across the scored games you have played. Calculated from your own results in this browser.</p>';
}
function scoreLine(id) {
  const a = Store.forGame(id).filter(x => x.score != null);
  if (a.length < 2) return '';
  const W = 520, H = 170, p = 30, mx = Math.max(...a.map(x => x.score), 1);
  const X = i => p + i * (W - 2 * p) / (a.length - 1), Y = v => H - p - Math.max(0, v) / mx * (H - 2 * p);
  const pts = a.map((x, i) => `${X(i)},${Y(x.score)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Score by attempt">
    <line class="grid" x1="${p}" x2="${W - p}" y1="${H - p}" y2="${H - p}"/><line class="grid" x1="${p}" x2="${W - p}" y1="${p}" y2="${p}" stroke-dasharray="3 4"/>
    <text x="${p - 6}" y="${p + 4}" text-anchor="end">${mx}</text><text x="${p - 6}" y="${H - p + 4}" text-anchor="end">0</text>
    <polygon class="area" points="${X(0)},${H - p} ${pts} ${X(a.length - 1)},${H - p}"/><polyline class="line" points="${pts}"/>
    ${a.map((x, i) => `<circle class="pt" cx="${X(i)}" cy="${Y(x.score)}" r="4"/><text x="${X(i)}" y="${H - 10}" text-anchor="middle">#${i + 1}</text>`).join('')}</svg>`;
}

/* ---------- views ---------- */
let catFilter = 'All';
function bestOf(id) { const a = Store.forGame(id, false).filter(x => x.score != null); return a.length ? Math.max(...a.map(x => x.score)) : null; }
function gameCard(m) {
  const n = Store.forGame(m.id, false).length, b = bestOf(m.id);
  return `<a class="card ${catClass(m.cat)}" href="#game-${m.id}">
    <div class="row" style="justify-content:space-between"><h3>${m.name}</h3><span class="chip"><span class="catdot"></span>${m.cat}</span></div>
    <p>${m.blurb}</p>
    <div class="foot"><span>${m.mins} min${n ? ` · <span class="best">${m.scored && b != null ? 'best ' + b : n + ' played'}</span>` : ''}</span><b>Open →</b></div></a>`;
}
function demoFlashback() {
  return `<div class="hero-demo" aria-label="Flashback preview"><div class="demo-bar">Flashback <span class="chip acc">2-back · shape only</span><span class="mono">2:41</span></div>
    <div class="demo-stage"><p class="prompt">Same as 2 cards ago?</p><div class="stim-card">${shapeSVG('star', 'var(--ink)', 84)}</div>
    <div class="btnrow"><a class="btn yes sm" href="#play-flashback">Match <kbd>←</kbd></a><a class="btn no sm" href="#play-flashback">No match <kbd>→</kbd></a></div></div></div>`;
}
const focusMain = () => { const h = $('#app h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } };

function viewHome() {
  const att = Store.data.attempts, played = new Set(att.map(a => a.game)).size;
  const cats = ['All', ...CATS];
  app().innerHTML = `
  <div class="hero"><div>
    <p class="eyebrow">Free practice for HireVue-style game assessments</p>
    <h1>Rehearse all 13 games so test day feels familiar</h1>
    <p class="lede" style="margin-top:14px">Every game runs on its real clock with adaptive levels, instant feedback and a results breakdown. No sign-up. Your history stays in this browser, so you can see each game get easier attempt by attempt.</p>
    <div class="row"><a class="btn" href="#games">Pick a game</a><a class="btn ghost" href="#mock">Run a mock assessment</a><a class="btn ghost" href="#plan">7-day prep plan</a></div>
  </div>${demoFlashback()}</div>
  <div class="statline">
    <div><b>13</b><span>games, all free</span></div>
    <div><b>2–7 min</b><span>per game, on the clock</span></div>
    <div><b class="mono">${att.length}</b><span>attempts by you</span></div>
    <div><b class="mono">${played}/13</b><span>games you’ve tried</span></div>
  </div>

  <section id="games"><p class="eyebrow">Practice games</p><h2>Pick a game</h2>
    <p class="muted" style="margin-top:6px">Each game page explains the rules, the usual mistakes and a strategy, and keeps your history. Try the 1-minute warm-up first if a game is new to you.</p>
    <div class="filters" role="group" aria-label="Filter by category">${cats.map(c => `<button data-c="${c}" aria-pressed="${c === catFilter}" class="${c === catFilter ? 'on' : ''}">${c}</button>`).join('')}</div>
    <div class="cards" id="cards"></div></section>

  <section><p class="eyebrow">Reference</p><h2>All 13 games side by side</h2>
    <div class="tablewrap" style="margin-top:16px"><table><thead><tr><th>Game</th><th>Category</th><th>Time</th><th>What it tests</th><th>Go</th></tr></thead><tbody>
    ${META.map(m => `<tr><td><b>${m.name}</b></td><td><span class="chip ${catClass(m.cat)}"><span class="catdot"></span>${m.cat}</span></td><td class="mono">${m.mins} min</td><td>${m.measures}</td><td class="act"><a href="#learn-${m.id}">Learn</a><a href="#play-${m.id}">Play</a><a href="#game-${m.id}">Rules</a></td></tr>`).join('')}
    </tbody></table></div></section>

  <section><p class="eyebrow">Getting ready</p><h2>Three things worth rehearsing</h2>
    <div class="grid3" style="margin-top:16px">
      <div class="panel"><h3>The controls</h3><p>Arrows, Space, number keys and taps. Learn them here so none of your real attempt goes on finding the right key. Every game shows its keys under the play area.</p></div>
      <div class="panel"><h3>The pace</h3><p>The clock never pauses. A 3-second countdown starts each game, then it runs to zero. Practising at full length teaches you how fast is fast enough.</p></div>
      <div class="panel"><h3>The full sitting</h3><p>Real invitations bundle several games. The mock assessment draws five at random and plays them back to back, so you can practise keeping focus for 20 minutes or more.</p></div>
    </div></section>

  <section class="grid2"><div><p class="eyebrow">Your trend</p><h2>How much have you improved?</h2>
    <p class="muted" style="margin-top:8px">Most early gains come from knowing the rules and the rhythm, not from raw ability. This chart compares each of your later attempts with your first one.</p>
    <a class="btn ghost sm" href="#progress" style="margin-top:14px">Open my progress</a></div>
    <div class="panel">${liftChart()}</div></section>

  <section><p class="eyebrow">Know the format</p><h2>What to expect from adaptive games</h2>
    <div class="grid2" style="margin-top:14px"><p class="muted">Difficulty follows your performance. Get things right and the next item is harder; slip and it eases off. So if a game suddenly feels tough, that is usually a sign you are doing well, not badly. Keep going rather than slowing down.</p>
    <p class="muted">Treat the real thing like an exam: a laptop rather than a phone, a quiet room, notifications silenced and enough time to finish in one go. For memory games, practise a technique (chunking, rehearsing aloud) until it is automatic.</p></div></section>

  <section><p class="eyebrow">FAQ</p><h2>Common questions</h2><div style="margin-top:8px">
    ${[['What are these games actually testing?', 'Short browser games stand in for traditional aptitude tests. The memory and number games look at speed and accuracy, the visual games at how quickly you compare and manipulate shapes, and the personality games at your preferences and judgement.'],
      ['Will I have to play all 13?', 'Unlikely. Employers pick a handful for each role. Your invitation should list them, so start with those games here.'],
      ['How long should I set aside?', 'Each game has its own timer of two to seven minutes. A typical set takes about half an hour including instructions.'],
      ['Is there a pass mark?', 'Not a public one. Results are usually compared with other applicants, and each employer chooses its own cut-off.'],
      ['Can practice really make a difference?', 'For the format, yes. Knowing the rules, controls and pace means your real attempt goes on the task itself. Your own improvement shows on the My progress page.'],
      ['Where is my data kept?', 'Only in this browser. Use “Copy my data” on My progress to keep a backup or move it to another device.'],
      ['Is this connected to HireVue?', 'No. Assessment Gym is an independent practice tool with original games modelled on publicly described formats.']]
      .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>
  <p class="disclaim">Assessment Gym is an independent practice tool. It is not affiliated with HireVue or any employer. The games are original simulations of publicly described assessment formats, for practice only.</p>`;
  const paint = () => { $('#cards').innerHTML = META.filter(m => catFilter === 'All' || m.cat === catFilter).map(gameCard).join(''); };
  paint();
  $$('.filters button').forEach(b => b.onclick = () => { catFilter = b.dataset.c; $$('.filters button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); paint(); });
}

function historyList(id, scored) {
  const a = Store.forGame(id, false).slice().reverse();
  if (!a.length) return `<div class="empty">No attempts yet. Your results will appear here.</div>`;
  return `<div class="tablewrap"><table style="min-width:420px"><thead><tr><th>When</th><th>Mode</th>${scored ? '<th>Score</th><th>Accuracy</th>' : '<th>Answers</th>'}</tr></thead><tbody>
   ${a.slice(0, 12).map(x => `<tr><td>${new Date(x.ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td><td>${x.quick ? 'Warm-up' : x.mock ? 'Mock' : 'Full'}</td>${scored ? `<td class="mono">${x.score ?? '–'}</td><td class="mono">${pct(x.accuracy)}</td>` : `<td class="mono">${(x.stats.find(s => s[0] === 'Answered') || ['', '–'])[1]}</td>`}</tr>`).join('')}
   </tbody></table></div>`;
}

function viewGame(id) {
  const m = META_BY[id]; if (!m) return viewHome();
  const full = Store.forGame(id), b = bestOf(id);
  document.title = `${m.name} practice · Assessment Gym`;
  app().innerHTML = `<p class="crumbs"><a href="#home">Games</a> / ${m.cat} / ${m.name}</p>
  <div class="detail-hero ${catClass(m.cat)}"><div>
    <span class="chip"><span class="catdot"></span>${m.cat}</span>
    <h1 style="margin-top:10px">${m.name}</h1>
    <p class="lede" style="margin-top:12px">${m.desc}</p>
    <div class="row" style="margin-top:20px">${Store.forGame(id, false).length
      ? `<a class="btn" href="#play-${id}">Play ${m.name} (${m.mins} min)</a><a class="btn ghost" href="#learn-${id}">Tutorial</a>`
      : `<a class="btn" href="#learn-${id}">Start with the tutorial</a><a class="btn ghost" href="#play-${id}">Play the real game (${m.mins} min)</a>`}<a class="btn ghost" href="#warmup-${id}">1-minute warm-up</a></div>
    <p class="small muted" style="margin-top:8px">The tutorial is untimed, slower, explains your mistakes and isn’t scored.</p>
    <div class="row small muted" style="margin-top:14px"><span class="chip">${m.scored ? 'Adaptive levels' : 'Profile, no right answers'}</span>${b != null ? `<span class="chip acc">Your best: ${b}</span>` : ''}</div>
  </div>
  <div class="panel"><h2 class="h3">How to play</h2><ol class="steps" style="margin-top:12px">${m.how.map(s => `<li><span>${s}</span></li>`).join('')}</ol></div></div>

  <section class="grid2"><div><p class="eyebrow">Skills tested</p><div class="skills" style="margin-top:10px">${m.skills.map(s => `<span class="chip acc">${s}</span>`).join('')}</div>
    <h2 style="margin-top:28px" id="guide">Strategy</h2><ul class="list">${m.strategy.map(s => `<li>${s}</li>`).join('')}</ul>
    <h2 style="margin-top:28px">Common mistakes</h2><ul class="list warn">${m.mistakes.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <div><p class="eyebrow">Your history</p><h2>${full.length ? `${full.length} full attempt${full.length > 1 ? 's' : ''}` : Store.forGame(id, false).length ? 'Warm-ups only so far' : 'Not played yet'}</h2>
    <div style="margin-top:12px">${m.scored ? scoreLine(id) : ''}${historyList(id, m.scored)}</div></div></section>

  <section><p class="eyebrow">FAQ</p><h2>${m.name} questions</h2><div style="margin-top:8px">
    <details><summary>What does ${m.name} test?</summary><p>${m.measures}.</p></details>
    <details><summary>How long is a round?</summary><p>${m.mins} minutes with no pause. The warm-up runs for one minute and is kept out of your progress chart.</p></details>
    ${m.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
  </div></section>
  <p class="disclaim">Independent practice simulation. Not affiliated with HireVue or any employer.</p>`;
}

function resultBody(meta, att, r) {
  const prev = Store.forGame(meta.id).filter(x => x.ts < att.ts && x.score != null);
  const prevBest = prev.length ? Math.max(...prev.map(x => x.score)) : null;
  let top;
  if (meta.scored) {
    const cmp = att.quick ? 'Warm-up runs are kept apart from full runs.' : prevBest == null ? 'First full attempt. This is your baseline.' :
      att.score > prevBest ? `New personal best, up from ${prevBest}.` : `Your best so far is ${prevBest}.`;
    top = `<div class="score-hero"><div><div class="big mono">${att.score}</div><div class="muted small">points</div></div>
      <div><h1 class="h2">${meta.name} finished</h1><p class="muted" style="margin-top:6px">${cmp}</p>${att.accuracy != null ? `<p style="margin-top:6px">Accuracy <b class="mono">${pct(att.accuracy)}</b></p>` : ''}</div></div>`;
  } else top = `<div class="score-hero"><div><div class="big">✓</div></div><div><h1 class="h2">${meta.name} finished</h1><p class="muted" style="margin-top:6px">There are no right answers here. Below is the profile your choices produce.</p></div></div>`;
  const stats = r.stats && r.stats.length ? `<div class="kv">${r.stats.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>` : '';
  let prof = '';
  if (r.profile) prof = `<div class="panel"><h3>Your profile</h3><div class="bars" style="margin-top:14px">${r.profile.map(p => p.right != null
    ? `<div class="bar2"><span>${p.left}</span><div class="t"><i style="left:${p.value}%"></i></div><span class="r">${p.right}</span></div>`
    : `<div class="bar1"><span>${p.label}</span><div class="t"><i style="width:${p.value}%"></i></div><span class="mono">${Math.round(p.value)}</span></div>`).join('')}</div>${r.note ? `<p class="small muted" style="margin-top:14px">${r.note}</p>` : ''}</div>`;
  let rev = '';
  if (r.review && r.review.length) rev = `<div class="panel"><h3>Reply review</h3><div class="review">${r.review.map((x, i) => `<div class="rv ${x.q === 2 ? 'good' : x.q === 1 ? 'ok' : 'weak'}">
      <p class="small muted">${i + 1}. “${esc(x.prompt)}”</p><p><b>You:</b> ${esc(x.mine)} <span class="chip">${['weak', 'okay', 'strongest'][x.q]}</span></p>
      ${x.q < 2 ? `<p><b>Strongest:</b> ${esc(x.best)}</p>` : ''}<p class="small muted">${esc(x.why)}</p></div>`).join('')}</div></div>`;
  return top + stats + prof + rev;
}
function showResult(meta, att, r) {
  app().innerHTML = `<div class="result">${resultBody(meta, att, r)}
    <div class="panel"><h3>Next time</h3><p>${meta.strategy[0]}</p><p style="margin-top:8px"><b>Watch out for:</b> ${meta.mistakes[0]}</p></div>
    <div class="row"><button class="btn" id="again">Play again</button><a class="btn ghost" href="#game-${meta.id}">Back to ${meta.name}</a><a class="btn ghost" href="#home">All games</a></div></div>`;
  $('#again').onclick = () => startGame(meta, { quick: att.quick });
  window.scrollTo(0, 0); focusMain();
  celebrate(meta, att);
}
function celebrate(meta, att) {
  if (!meta.scored) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const big = $('.score-hero .big');
  if (big && !reduce && att.score > 0) { // count the score up over ~0.8 s
    const t0 = performance.now(), target = att.score;
    const step = now => { const p = Math.min(1, (now - t0) / 800); big.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    big.textContent = '0'; requestAnimationFrame(step);
  }
  const prev = Store.forGame(meta.id).filter(x => x.ts < att.ts && x.score != null);
  const best = !att.quick && prev.length && att.score > Math.max(...prev.map(x => x.score));
  if (!best) return;
  Sfx.play('best');
  if (reduce) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const W = cv.width = innerWidth, H = cv.height = innerHeight, g = cv.getContext('2d');
  const cols = ['#0b7a61', '#3fc9a4', '#e39a12', '#3e7bfa', '#e5484d', '#8e5bd8'];
  const bits = Array.from({ length: 120 }, () => ({ x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.35, vx: (Math.random() - 0.5) * 11, vy: -6 - Math.random() * 8, r: Math.random() * 6.3, s: 5 + Math.random() * 5, c: pick(cols) }));
  const t0 = performance.now();
  const frame = now => {
    const t = now - t0; g.clearRect(0, 0, W, H);
    bits.forEach(b => { b.vy += 0.3; b.x += b.vx; b.y += b.vy; b.r += 0.2; g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c; g.globalAlpha = Math.max(0, 1 - t / 1800); g.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); g.restore(); });
    if (t < 1800) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
}

/* ---------- mock assessment ---------- */
function viewMock() {
  let picks = sample(META, 5);
  const draw = () => {
    const mins = picks.reduce((s, m) => s + m.mins, 0);
    app().innerHTML = `<p class="eyebrow">Mock assessment</p><h1>Your practice invitation</h1>
    <p class="lede" style="margin-top:12px">Five games drawn at random and played back to back, the way a real invitation works. Each game has its own clock and a short rules screen first. Clock time: <b class="mono">${mins} min</b>.</p>
    <div class="cards" style="margin-top:22px">${picks.map((m, i) => `<div class="card ${catClass(m.cat)}" style="cursor:default"><span class="mono small muted">Game ${i + 1} of 5</span><h3>${m.name}</h3><p>${m.blurb}</p><div class="foot"><span><span class="catdot" style="display:inline-block"></span> ${m.cat}</span><span>${m.mins} min</span></div></div>`).join('')}</div>
    <div class="row" style="margin-top:22px"><button class="btn" id="go">Start the assessment</button><button class="btn ghost" id="redraw">Draw different games</button></div>`;
    $('#redraw').onclick = () => { picks = sample(META, 5); draw(); };
    $('#go').onclick = () => runMock(picks, 0, []);
  };
  draw();
}
function runMock(picks, i, done) {
  if (i >= picks.length) {
    app().innerHTML = `<p class="eyebrow">Mock assessment</p><h1>Assessment complete</h1>
     <div class="tablewrap" style="margin-top:20px"><table><thead><tr><th>Game</th><th>Result</th><th>Accuracy</th><th></th></tr></thead><tbody>
     ${done.map(({ m, att }) => `<tr><td><b>${m.name}</b></td><td class="mono">${m.scored ? att.score + ' pts' : 'Profile saved'}</td><td class="mono">${pct(att.accuracy)}</td><td><a href="#game-${m.id}">Review</a></td></tr>`).join('')}</tbody></table></div>
     <div class="row" style="margin-top:20px"><a class="btn" href="#progress">See my progress</a><button class="btn ghost" id="again">New mock assessment</button></div>`;
    $('#again').onclick = viewMock; focusMain(); return;
  }
  const m = picks[i];
  app().innerHTML = `<div class="play"><p class="eyebrow">Game ${i + 1} of ${picks.length}</p><h1>${m.name}</h1><p class="lede" style="margin-top:10px">${m.desc}</p>
   <div class="panel" style="margin-top:18px"><h2 class="h3">How to play</h2><ol class="steps" style="margin-top:12px">${m.how.map(s => `<li><span>${s}</span></li>`).join('')}</ol></div>
   <div class="row" style="margin-top:18px"><button class="btn" id="go">Begin (${m.mins} min)</button></div></div>`;
  focusMain();
  $('#go').onclick = () => startGame(m, { mock: true, label: `Mock ${i + 1}/${picks.length}`, onDone: att => runMock(picks, i + 1, [...done, { m, att }]) });
}

/* ---------- 7-day prep plan ---------- */
const PLAN = [
  ['Day 1 · Learn the formats', ['Read the rules page for every game on your invitation', 'Play the 1-minute warm-up of each one', 'Note which two games felt hardest']],
  ['Day 2 · Baselines', ['Play a full-length round of each game on your invitation', 'Write down each score as your baseline', 'Read the “Common mistakes” list for your weakest game']],
  ['Day 3 · Memory games', ['Two full rounds of Flashback', 'Two full rounds of Digitspan using chunking', 'One round of Disconumbers keeping a running total']],
  ['Day 4 · Visual games', ['Two rounds each of Shapedance and Singularity', 'One round of Pathfinder working from both ends', 'One round of Puzzle, memorising corners first']],
  ['Day 5 · Numbers and speed', ['Two rounds of Numerosity, factoring targets first', 'Two rounds of Pulse', 'Replay your weakest game']],
  ['Day 6 · Personality and judgement', ['Do Portrait and PortraitXT once, honestly', 'Play Teamchat and read the reply review', 'Play E-Motions and Pulse once each']],
  ['Day 7 · Dress rehearsal', ['Run a full mock assessment in one sitting', 'Check your progress chart against Day 2', 'Plan the real day: quiet room, laptop, notifications off']],
];
function viewPlan() {
  const st = Store.data.plan || (Store.data.plan = {});
  const total = PLAN.reduce((s, d) => s + d[1].length, 0);
  const done = () => Object.values(st).filter(Boolean).length;
  app().innerHTML = `<p class="eyebrow">Prep plan</p><h1>Seven days to test day</h1>
   <p class="lede" style="margin-top:10px">About 30 minutes a day. Tick tasks as you go; your ticks are saved in this browser.</p>
   <div class="prog" style="max-width:none;margin-top:18px"><i id="pp" style="width:${done() / total * 100}%"></i></div><p class="small muted" style="margin-top:6px" id="pt">${done()} of ${total} tasks done</p>
   <div class="plan">${PLAN.map(([day, tasks], d) => `<div class="panel"><h3>${day}</h3>${tasks.map((t, k) => { const id = `p${d}-${k}`; return `<label class="chk"><input type="checkbox" id="${id}" ${st[id] ? 'checked' : ''}> ${t}</label>`; }).join('')}</div>`).join('')}</div>
   <div class="row" style="margin-top:18px"><button class="btn ghost sm" id="preset">Clear all ticks</button></div>`;
  $$('.plan input').forEach(c => c.onchange = () => { st[c.id] = c.checked; Store.save(); $('#pp').style.width = done() / total * 100 + '%'; $('#pt').textContent = `${done()} of ${total} tasks done`; });
  $('#preset').onclick = () => { Store.data.plan = {}; Store.save(); viewPlan(); };
}

/* ---------- progress ---------- */
function viewProgress() {
  const all = Store.data.attempts;
  app().innerHTML = `<p class="eyebrow">My progress</p><h1>Your practice record</h1>
  <p class="lede" style="margin-top:10px">${all.length} attempts across ${new Set(all.map(a => a.game)).size} games, saved in this browser.</p>
  <section class="grid2" style="margin-top:28px"><div class="panel"><h3>Score lift by attempt</h3><div style="margin-top:10px">${liftChart()}</div></div>
   <div class="panel"><h3>Back up or move your data</h3><p>Results live only in this browser. Copy them to keep a backup, or paste a backup here to restore it.</p>
   <div class="row" style="margin-top:12px"><button class="btn ghost sm" id="cp">Copy my data</button><button class="btn ghost sm" id="imp">Import</button><button class="btn ghost sm" id="rs">Reset all</button></div>
   <div id="io" style="margin-top:12px"></div></div></section>
  <section><h2>By game</h2><div class="tablewrap" style="margin-top:14px"><table><thead><tr><th>Game</th><th>Full attempts</th><th>First</th><th>Best</th><th>Latest</th><th>Change</th></tr></thead><tbody>
   ${META.map(m => { const a = Store.forGame(m.id); const s = a.map(x => x.score);
     const ch = m.scored && a.length > 1 && s[0] > 0 ? Math.round((s[s.length - 1] / s[0] - 1) * 100) : null;
     return `<tr><td><a href="#game-${m.id}"><b>${m.name}</b></a></td><td class="mono">${a.length}</td>${m.scored ? `<td class="mono">${a.length ? s[0] : '–'}</td><td class="mono">${a.length ? Math.max(...s) : '–'}</td><td class="mono">${a.length ? s[s.length - 1] : '–'}</td><td class="mono">${ch == null ? '–' : (ch >= 0 ? '+' : '') + ch + '%'}</td>` : `<td colspan="4" class="muted">Profile game, not scored</td>`}</tr>`; }).join('')}
   </tbody></table></div></section>`;
  const io = $('#io');
  $('#cp').onclick = async () => {
    const txt = JSON.stringify(Store.data);
    try { await navigator.clipboard.writeText(txt); io.innerHTML = `<p class="small" style="color:var(--ok)">Copied ${all.length} attempts to the clipboard.</p>`; }
    catch (e) { io.innerHTML = `<textarea id="dump" readonly aria-label="Your data">${esc(txt)}</textarea><p class="small muted">Copy this text manually.</p>`; $('#dump').select(); }
  };
  $('#imp').onclick = () => {
    io.innerHTML = `<textarea id="paste" aria-label="Backup text" placeholder="Paste a backup here"></textarea><div class="row" style="margin-top:8px"><button class="btn sm" id="doimp">Restore backup</button></div>`;
    $('#doimp').onclick = () => { try { const d = JSON.parse($('#paste').value); if (!Array.isArray(d.attempts)) throw 0; Store.data = Object.assign({ attempts: [], interviews: [], plan: {} }, d); Store.save(); viewProgress(); } catch (e) { io.insertAdjacentHTML('beforeend', '<p class="small" style="color:var(--bad)">That text is not a valid backup. Paste the full text from “Copy my data”.</p>'); } };
  };
  $('#rs').onclick = () => {
    io.innerHTML = `<div class="confirm"><span>Delete all ${all.length} attempts, plan ticks and interview notes from this browser? This cannot be undone.</span><button class="btn no sm" id="yes">Delete everything</button><button class="btn ghost sm" id="no">Keep</button></div>`;
    $('#yes').onclick = () => { Store.data = { attempts: [], interviews: [], plan: {} }; Store.save(); viewProgress(); };
    $('#no').onclick = () => { io.innerHTML = ''; };
  };
}

/* ---------- video interview practice ----------
   Hidden for now: the games come first. Set to true to bring back the nav link, the #interview page and the plan task. */
const SHOW_INTERVIEW = false;
const IQ = {
  'About you': ['Tell me about yourself and why you applied for this role.', 'What would your last manager or teacher say is your greatest strength?', 'Describe a weakness you are actively working on.', 'Where do you want to be in three years?'],
  'Teamwork': ['Tell me about a time you disagreed with a teammate. What did you do?', 'Describe a group project where someone was not pulling their weight.', 'Give an example of when you helped a colleague who was struggling.', 'Tell me about a time you had to work with someone very different from you.'],
  'Problem solving': ['Describe a difficult problem you solved. How did you approach it?', 'Tell me about a time you made a mistake. What did you learn?', 'Give an example of when you had to decide with incomplete information.', 'Tell me about a process you improved.'],
  'Pressure & priorities': ['Tell me about a time you had several deadlines at once.', 'Describe a situation where plans changed at the last minute.', 'Tell me about a time you had to deliver bad news.', 'Describe the most stressful situation you have handled and how you stayed effective.'],
  'Motivation': ['What do you know about our industry and what draws you to it?', 'Why should we hire you over other candidates?', 'Tell me about an achievement you are proud of.', 'What does great customer service mean to you?'],
};
const CHECKS = ['I described the situation briefly', 'I made my own role clear', 'Most of my answer was about actions I took', 'I stated a concrete result', 'I finished inside the time limit', 'I used a specific real example, not a general claim'];
let CAM = null; // live camera stream, kept only while on the interview pages
function stopCam() { if (CAM) { CAM.getTracks().forEach(t => t.stop()); CAM = null; } }
function viewInterview() {
  stopCam();
  const hist = Store.data.interviews.slice().reverse();
  app().innerHTML = `<p class="eyebrow">Video interview practice</p><h1>One-way interview drill</h1>
  <p class="lede" style="margin-top:10px">One-way interviews give you a short planning window, then a fixed recording window. Practise with the same timers, answer out loud, and turn on the camera if you want to watch yourself back.</p>
  <div class="grid2" style="margin-top:24px"><div class="panel"><h2 class="h3">Set up</h2><div style="display:grid;gap:12px;margin-top:12px">
    <label for="iv-mode">Mode<select id="iv-mode"><option value="1">Single question</option><option value="5" selected>Full interview (5 questions)</option></select></label>
    <label for="iv-topic">Topic<select id="iv-topic"><option>Any topic</option>${Object.keys(IQ).map(t => `<option>${t}</option>`).join('')}</select></label>
    <label for="iv-prep">Planning time<select id="iv-prep"><option value="30">30 seconds</option><option value="60">60 seconds</option><option value="0">None</option></select></label>
    <label for="iv-ans">Answer time<select id="iv-ans"><option value="60">1 minute</option><option value="120" selected>2 minutes</option><option value="180">3 minutes</option></select></label>
    <label for="iv-re">Retakes per question<select id="iv-re"><option value="0">None</option><option value="1" selected>1</option><option value="2">2</option></select></label>
    <label class="chk"><input type="checkbox" id="iv-cam"> Record with my camera (stays on this device, never uploaded)</label>
    <button class="btn" id="iv-go">Start</button><p class="small" id="iv-msg" role="status"></p></div></div>
   <div class="panel"><h2 class="h3">The STAR method</h2><ol class="steps" style="margin-top:12px">
    <li><span><b>Situation.</b> Set the scene in one or two sentences.</span></li><li><span><b>Task.</b> What were you responsible for?</span></li>
    <li><span><b>Action.</b> What did <i>you</i> do? Spend most of your time here.</span></li><li><span><b>Result.</b> What changed? Use a number if you can.</span></li></ol></div></div>
  <section><h2>Past answers</h2><div style="margin-top:12px">${hist.length ? `<div class="tablewrap"><table><thead><tr><th>When</th><th>Question</th><th>Self-rating</th></tr></thead><tbody>${hist.slice(0, 20).map(h => `<tr><td>${new Date(h.ts).toLocaleDateString()}</td><td>${esc(h.q)}</td><td class="mono">${h.rating}/6</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Your practised questions and self-ratings will appear here.</div>'}</div></section>`;
  $('#iv-go').onclick = async () => {
    const t = $('#iv-topic').value, pool = t === 'Any topic' ? Object.values(IQ).flat() : IQ[t];
    const n = Math.min(+$('#iv-mode').value, pool.length);
    const cfg = { qs: sample(pool, n), prep: +$('#iv-prep').value, ans: +$('#iv-ans').value, retakes: +$('#iv-re').value, cam: $('#iv-cam').checked, results: [] };
    if (cfg.cam) {
      try { CAM = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
      catch (e) { cfg.cam = false; $('#iv-msg').textContent = 'Camera unavailable here (blocked or not supported). Continuing without recording.'; await new Promise(r => setTimeout(r, 1600)); }
    }
    runInterview(cfg, 0, cfg.retakes);
  };
}
function runInterview(cfg, qi, left) {
  stopActive();
  const q = cfg.qs[qi];
  let iv = null, alive = true, rec = null, chunks = [];
  ACTIVE = { kill() { alive = false; clearInterval(iv); if (rec && rec.state !== 'inactive') rec.stop(); stopCam(); } };
  const head = `<div class="row"><span class="chip">Question ${qi + 1} of ${cfg.qs.length}</span>`;
  const phase = (name, secs, next) => {
    const t0 = Date.now();
    const answering = name === 'Answering';
    app().innerHTML = `<div class="play"><div class="q-card">${head}<span class="chip acc">${name}</span><span class="sp" style="flex:1"></span><span class="ring" id="cd">${fmtTime(secs)}</span></div>
      <h1 class="q-text">${esc(q)}</h1>
      ${cfg.cam ? `<video id="live" class="cam" autoplay muted playsinline></video>` : ''}
      ${answering ? `<p class="muted">${cfg.cam ? '<span class="recdot"></span>Recording. ' : ''}Speak your answer out loud now. Jot keywords if it helps.</p><textarea id="notes" aria-label="Notes" placeholder="Optional notes"></textarea>` : '<p class="muted">Plan your example: situation, task, action, result.</p>'}
      <div class="row"><button class="btn" id="skip">${answering ? 'Finish answer' : 'Start answering now'}</button><a class="btn ghost" href="#interview">Cancel</a></div></div></div>`;
    if (cfg.cam && CAM) { $('#live').srcObject = CAM; }
    if (answering && cfg.cam && CAM && window.MediaRecorder) {
      try { chunks = []; rec = new MediaRecorder(CAM); rec.ondataavailable = e => e.data.size && chunks.push(e.data); rec.start(); } catch (e) { rec = null; }
    }
    focusMain();
    $('#skip').onclick = () => { clearInterval(iv); next(); };
    clearInterval(iv);
    iv = setInterval(() => { if (!alive) return; const l = secs - (Date.now() - t0) / 1000; const cd = $('#cd'); if (cd) cd.textContent = fmtTime(l); if (l <= 0) { clearInterval(iv); next(); } }, 250);
  };
  const review = () => {
    const notes = $('#notes') ? $('#notes').value : '';
    const show = url => {
      app().innerHTML = `<div class="play"><div class="q-card">${head}<span class="chip acc">Review</span></div><h1 class="q-text">${esc(q)}</h1>
        ${url ? `<video class="cam" src="${url}" controls playsinline></video><p class="small muted">Playback stays in this tab and disappears when you leave the page.</p>` : ''}
        <p class="muted">Tick what you did. Be strict; this is for you.</p><div>${CHECKS.map((c, i) => `<label class="chk"><input type="checkbox" id="c${i}"> ${c}</label>`).join('')}</div>
        <div class="row"><button class="btn" id="save">${qi + 1 < cfg.qs.length ? 'Save and next question' : 'Save and finish'}</button>${left > 0 ? `<button class="btn ghost" id="retake">Retake (${left} left)</button>` : ''}</div></div></div>`;
      focusMain();
      if ($('#retake')) $('#retake').onclick = () => runInterview(cfg, qi, left - 1);
      $('#save').onclick = () => {
        const rating = CHECKS.filter((_, i) => $('#c' + i).checked).length;
        Store.data.interviews.push({ ts: Date.now(), q, rating, notes }); Store.save();
        cfg.results.push({ q, rating });
        if (qi + 1 < cfg.qs.length) runInterview(cfg, qi + 1, cfg.retakes); else finish();
      };
    };
    if (rec && rec.state !== 'inactive') { rec.onstop = () => show(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'video/webm' }))); rec.stop(); }
    else show(null);
  };
  const finish = () => {
    stopCam(); ACTIVE = null;
    const avg = mean(cfg.results.map(r => r.rating));
    app().innerHTML = `<p class="eyebrow">Interview complete</p><h1>${cfg.results.length} question${cfg.results.length > 1 ? 's' : ''} answered</h1>
      <p class="lede" style="margin-top:10px">Average self-rating <b class="mono">${avg.toFixed(1)}/6</b>. ${avg >= 5 ? 'Strong. Try a shorter answer time next.' : avg >= 3 ? 'Solid. Focus on the checklist items you missed most.' : 'Keep practising: aim for one concrete example per answer.'}</p>
      <div class="tablewrap" style="margin-top:18px"><table><thead><tr><th>Question</th><th>Self-rating</th></tr></thead><tbody>${cfg.results.map(r => `<tr><td>${esc(r.q)}</td><td class="mono">${r.rating}/6</td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:18px"><a class="btn" href="#interview">Back to set up</a></div>`;
    focusMain();
  };
  const answer = () => phase('Answering', cfg.ans, review);
  if (cfg.prep > 0) phase('Planning', cfg.prep, answer); else answer();
}

/* ---------- router ---------- */
const TITLES = { home: 'Assessment Gym', mock: 'Mock assessment · Assessment Gym', progress: 'My progress · Assessment Gym', interview: 'Video interview drill · Assessment Gym', plan: '7-day prep plan · Assessment Gym' };
function route() {
  stopActive(); stopCam();
  const h = location.hash.slice(1) || 'home';
  $$('#nav a').forEach(a => { const on = a.dataset.n === h || (a.dataset.n === 'home' && /^(home|games|game-)/.test(h)); a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  document.title = (h !== 'interview' || SHOW_INTERVIEW) && TITLES[h] || 'Assessment Gym';
  let m;
  if ((m = h.match(/^game-(\w+)$/))) { viewGame(m[1]); window.scrollTo(0, 0); focusMain(); }
  else if ((m = h.match(/^(play|warmup|learn)-(\w+)$/)) && META_BY[m[2]]) { document.title = `${META_BY[m[2]].name}${m[1] === 'learn' ? ' tutorial' : ''} · Assessment Gym`; startGame(META_BY[m[2]], { quick: m[1] === 'warmup', tutorial: m[1] === 'learn' }); }
  else if (h === 'mock') { viewMock(); focusMain(); }
  else if (h === 'progress') { viewProgress(); focusMain(); }
  else if (h === 'interview' && SHOW_INTERVIEW) { viewInterview(); focusMain(); }
  else if (h === 'plan') { viewPlan(); focusMain(); }
  else { viewHome(); if (h === 'games') $('#games').scrollIntoView(); else window.scrollTo(0, 0); }
}
function boot() {
  if (!SHOW_INTERVIEW) $$('#nav a[data-n="interview"]').forEach(a => a.remove());
  Store.load(); window.addEventListener('hashchange', route); route();
  // offline support where service workers are allowed (e.g. GitHub Pages); silently skipped elsewhere
  try { if ('serviceWorker' in navigator && /github\.io$|^localhost$/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
}
