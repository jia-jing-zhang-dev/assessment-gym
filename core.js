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
const STIM_NAME = { '#e5484d': 'red', '#3e7bfa': 'blue', '#2f9e6b': 'green', '#e9a21a': 'yellow', '#8e5bd8': 'purple' };
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

/* ---------- game catalogue ---------- */
const CATS = ['Cognitive', 'Spatial', 'Personality & Emotions'];
const META = [
  { id: 'numerosity', name: 'Numerosity', cat: 'Cognitive', mins: 3, scored: true, measures: 'Number sense, quick estimation',
    blurb: 'Select the combination of numbers that satisfies the condition on screen.',
    desc: 'A grid of numbered bubbles and a condition such as “pick 3 numbers that add up to 24”. Find a valid combination as fast as you can. Solve consecutive puzzles and the condition gets longer, the numbers get larger and multiplication appears.',
    how: ['A condition appears above a set of numbered bubbles.', 'Tap bubbles to select them. The running total shows below.', 'When you have selected the required count, your answer is checked automatically.', 'Two correct answers in a row raise the level; two misses drop it.'],
    skills: ['Number sense', 'Mental arithmetic', 'Processing speed'],
    strategy: ['Anchor on the largest number first, then look for the remainder. 24 with 3 numbers: take 11, now you need 13 from two.', 'For products, factor the target before scanning (36 = 4×9 = 6×6 = 3×12).', 'Skipping is cheaper than staring. If nothing jumps out in a few seconds, skip and take a fresh puzzle.'],
    faq: [['Is there only one correct combination?', 'No. Any selection that meets the condition counts as correct.'], ['Does a skip count against me?', 'A skip earns nothing and does not change your level, so it costs only the time you spent.']] },
  { id: 'flashback', name: 'Flashback', cat: 'Cognitive', mins: 3, scored: true, measures: 'Visual memory, pattern recognition',
    blurb: 'Decide if the shape on screen matches the one shown N steps earlier.',
    desc: 'An n-back memory task. Shapes appear one at a time in a continuous stream and you decide whether the current shape matches the one shown N steps back. You start at 1-back; keep succeeding and the rule escalates to 2-back, then 3-back, and then colour joins the matching rule.',
    how: ['Shapes appear one at a time in a continuous stream.', 'Decide whether the current shape matches the one shown N steps back. You start at 1-back.', 'Answer while the shape is on screen or in the brief gap after it. A missed window shows “Too slow” and counts as a miss.', 'Keep succeeding and the game escalates: 2-back, then 3-back, with colour joining the matching rule.'],
    skills: ['Working memory', 'Visual recall', 'Concentration'],
    strategy: ['Say the sequence under your breath (“star, circle, star”) so the buffer has a rhythm.', 'At 2-back and above, update the buffer the moment a new shape appears, before you decide. Decide, then drop the oldest item.', 'When colour joins the rule, a same-shape different-colour item is a lure. Check colour last, only when the shape matches.', 'Answer every trial. A “Too slow” is always a miss, while a guess is right about two times in three.'],
    faq: [['How is Flashback scored here?', 'Each correct answer earns points equal to the current N, plus one when colour is part of the rule. Accuracy, misses, false alarms and reaction time are reported separately.'], ['When does the level change?', 'After every 10 answerable trials. 80% or better moves you up one rule; under 50% moves you down.'], ['Why does it feel so hard?', 'Holding a moving window of items is exactly what the task measures. Practice makes the format familiar so all of your attention goes to the memory load.']] },
  { id: 'pathfinder', name: 'Pathfinder', cat: 'Spatial', mins: 5, scored: true, measures: 'Spatial reasoning, path planning',
    blurb: 'Place path tiles to connect the entrance to the exit.',
    desc: 'A grid with a marked entrance on the left and an exit on the right. Some path tiles are fixed in place. Pick tiles from the tray and drop them into empty cells until a single connected path runs from IN to OUT. The tray always contains a couple of decoys.',
    how: ['Find IN on the left edge and OUT on the right edge.', 'Tap a tile in the tray, then tap an empty cell to place it.', 'Tap a placed tile to send it back to the tray.', 'The puzzle solves as soon as the path connects. Each solve raises the level and the grid grows.'],
    skills: ['Spatial reasoning', 'Planning', 'Visual scanning'],
    strategy: ['Work from both ends. The fixed tiles next to IN and OUT tell you which openings the neighbouring cells need.', 'Count the openings each empty cell must have before reaching for the tray.', 'Leftover tiles are decoys. You do not need to use every tile.'],
    faq: [['Can tiles be rotated?', 'No. Each tile has a fixed orientation, which is what makes choosing the right one a spatial problem.'], ['Is there more than one solution?', 'Sometimes. Any connected route from IN to OUT counts.']] },
  { id: 'digitspan', name: 'Digitspan', cat: 'Cognitive', mins: 3, scored: true, measures: 'Working memory, sequence recall',
    blurb: 'Remember a sequence of numbers and letters, then enter it in order.',
    desc: 'Characters flash one at a time. When the sequence ends, type it back in exactly the same order. Each correct answer lengthens the next sequence by one; from five items on, letters mix in with the digits.',
    how: ['Watch the characters appear one at a time.', 'When the keypad appears, enter the sequence in the order shown.', 'Use the on-screen keypad or your keyboard. Backspace corrects, Enter submits.', 'Correct answers add one item to the next sequence. Two misses in a row remove one.'],
    skills: ['Working memory', 'Sequence recall', 'Attention'],
    strategy: ['Chunk into groups of three or four, like a phone number: 4 8 1 · 7 3 9.', 'Rehearse silently while the sequence plays rather than waiting until it ends.', 'Give letters a sound and digits a sound, then rehearse the mixed sequence as one spoken string.'],
    faq: [['How is it scored?', 'Each correct sequence earns points equal to its length, so longer spans count more.'], ['Are letters case-sensitive?', 'No. Letters are always shown and accepted as capitals.']] },
  { id: 'disconumbers', name: 'Disconumbers', cat: 'Cognitive', mins: 3, scored: true, measures: 'Working memory, mental arithmetic',
    blurb: 'Watch circles light up, replay the order, then pick the correct sum.',
    desc: 'A grid of numbered circles. Some light up in sequence. First tap them back in the same order, then choose the sum of the numbers that lit up. Get both right and the next sequence is one longer.',
    how: ['Watch the circles light up one after another.', 'Tap the circles in the same order they lit.', 'Pick the sum of the lit numbers from four options.', 'Both parts correct adds one circle to the next round.'],
    skills: ['Working memory', 'Mental arithmetic', 'Divided attention'],
    strategy: ['Keep a running total while the circles light; don’t try to add at the end.', 'Remember positions as a shape (an L, a zig-zag) rather than as a list.', 'The order and the sum score separately, so a wrong order does not stop you earning the sum.'],
    faq: [['Can a circle light twice?', 'No. Each round lights distinct circles.'], ['Does the grid grow?', 'Yes. From six circles per sequence the grid grows from 3×3 to 4×4.']] },
  { id: 'puzzle', name: 'Puzzle', cat: 'Spatial', mins: 7, scored: true, measures: 'Visual memory, pattern recreation',
    blurb: 'Memorise an image, then rebuild it from scattered pieces.',
    desc: 'An abstract image is shown for a few seconds. It is then cut into a grid of pieces and scattered. Rebuild it from memory by placing each piece in its slot. Perfect rebuilds raise the level and the grid gets finer.',
    how: ['Study the image while the countdown runs (or start early).', 'Tap a piece in the tray, then tap a slot on the board to place it.', 'Tap a placed piece to send it back to the tray.', 'When every slot is filled, check your answer. All pieces correct raises the level.'],
    skills: ['Visual memory', 'Pattern recreation', 'Spatial reasoning'],
    strategy: ['Memorise the corners and the largest shapes first; they anchor everything else.', 'Name colour regions while memorising (“blue top-left, orange stripe across the middle”).', 'Place the pieces with strong edges first, then fill the gaps by elimination.'],
    faq: [['Can I look at the image again?', 'No. Once you start building, the original is hidden.'], ['How is it scored?', 'One point per correctly placed piece, plus a bonus equal to the grid size for a perfect rebuild.']] },
  { id: 'portrait', name: 'Portrait', cat: 'Personality & Emotions', mins: 5, scored: false, measures: 'Self-reflection, work-style traits',
    blurb: 'Pick the picture that best describes how you like to work.',
    desc: 'Pairs of illustrated work situations. For each pair, choose the one that sounds more like you. There are no right answers; the result is a profile across five work-style dimensions.',
    how: ['Two illustrated statements appear side by side.', 'Choose the one that describes you better, even if both or neither fit perfectly.', 'Answer quickly; your first reaction is usually the most accurate.', 'Your work-style profile appears at the end.'],
    skills: ['Self-awareness', 'Work-style preferences', 'Consistency'],
    strategy: ['Answer as you actually work, not as you think an employer wants.', 'Be consistent. Similar trade-offs come up more than once.', 'Think of a recent concrete week at work or study when an item feels abstract.'],
    faq: [['Is there a good or bad profile?', 'No. Each pole of each dimension suits some roles better than others.'], ['Is my profile saved?', 'Yes, in this browser, alongside your other results.']] },
  { id: 'portraitxt', name: 'PortraitXT', cat: 'Personality & Emotions', mins: 5, scored: false, measures: 'Self-assessment, personality traits',
    blurb: 'Rate how much you agree with statements about yourself.',
    desc: 'Statements about how you work appear one at a time. Rate each on a five-point scale from strongly disagree to strongly agree. The result is a profile across five traits.',
    how: ['Read the statement.', 'Choose how much you agree, from 1 (strongly disagree) to 5 (strongly agree).', 'Keys 1–5 also work.', 'Your trait profile appears at the end.'],
    skills: ['Self-assessment', 'Personality traits', 'Response consistency'],
    strategy: ['Use the whole scale. Answering only 3s gives a flat, uninformative profile.', 'Some statements are reversed. Read each one fully.', 'Answer at a steady pace; overthinking adds noise.'],
    faq: [['What are the five traits?', 'Drive, Collaboration, Organisation, Composure and Curiosity.'], ['What is the consistency score?', 'It compares your answers to pairs of statements that ask about the same thing in opposite directions.']] },
  { id: 'shapedance', name: 'Shapedance', cat: 'Spatial', mins: 3, scored: true, measures: 'Pattern recognition, visual comparison',
    blurb: 'Find every shape that matches the target pattern.',
    desc: 'A target shape is shown above a grid. Select every item that matches it exactly, then confirm. Many items share one feature with the target to trip you up. At higher levels the fill pattern also has to match.',
    how: ['Study the target: shape, colour and, later, fill pattern.', 'Tap every matching item in the grid.', 'Press Done (or Enter) when you have them all.', 'A perfect round raises the level; the grid grows and the lures get closer.'],
    skills: ['Visual comparison', 'Attention to detail', 'Processing speed'],
    strategy: ['Filter by the rarest feature first, usually colour, then check shape.', 'Scan in rows, left to right, so you don’t revisit items.', 'A wrong selection costs as much as a missed one, so confirm before you tap.'],
    faq: [['How is it scored?', 'One point per correct item, minus one per wrong selection, plus a bonus for a perfect round.']] },
  { id: 'emotions', name: 'E-Motions', cat: 'Personality & Emotions', mins: 4, scored: true, measures: 'Emotion recognition',
    blurb: 'Read a facial expression and pick the emotion it shows.',
    desc: 'A face appears with four emotion labels. Choose the one that best matches the expression. As you progress, the expressions become subtler.',
    how: ['Look at the face: brows, eyes and mouth.', 'Pick the emotion that matches from four options.', 'Keys 1–4 also work.', 'Correct answers make the next expressions subtler.'],
    skills: ['Emotion recognition', 'Social perception', 'Attention to detail'],
    strategy: ['Start with the brows: raised (surprise, fear), pinched down (anger), inner corners up (sadness).', 'Fear and surprise both open the eyes; fear also stretches the mouth sideways.', 'Contempt is one-sided. Look for a lifted corner on only one side.'],
    faq: [['Which emotions appear?', 'Happiness, sadness, anger, surprise, fear, disgust, contempt and neutral.']] },
  { id: 'singularity', name: 'Singularity', cat: 'Spatial', mins: 3, scored: true, measures: 'Attention to detail, visual scanning',
    blurb: 'Find the one shape that is different from all the others.',
    desc: 'A grid of identical block shapes with one odd one out: a mirror image. At higher levels every shape is also rotated, so you have to tell a rotation (same) from a reflection (different).',
    how: ['Scan the grid of shapes.', 'Tap the one that is different from the rest.', 'At higher levels shapes are rotated. Rotations count as the same; mirror images do not.', 'Two correct answers in a row raise the level.'],
    skills: ['Visual scanning', 'Mental rotation', 'Attention to detail'],
    strategy: ['Pick one distinctive feature, such as a lone block sticking out, and track which side it is on.', 'Compare the candidate against two others, not one.', 'Speed matters, but a wrong tap breaks your streak. Confirm with a second glance.'],
    faq: [['How is it scored?', 'Points equal to the current level for each correct pick.']] },
  { id: 'teamchat', name: 'Teamchat', cat: 'Personality & Emotions', mins: 5, scored: false, measures: 'Communication, work style',
    blurb: 'Reply to teammates by choosing the response most like you.',
    desc: 'A chat with your project team. Messages arrive and you pick one of several replies. There are no right answers; the result is a profile of your communication style.',
    how: ['Read the incoming messages.', 'Choose the reply that is closest to what you would actually send.', 'The conversation continues across several work situations.', 'Your communication-style profile appears at the end.'],
    skills: ['Communication', 'Collaboration', 'Judgement'],
    strategy: ['Pick what you would really send, not the most polished option.', 'Think about the person and the deadline in each message; context matters.', 'Notice your pattern. The profile reflects tendencies across all situations.'],
    faq: [['What are the four styles?', 'Supportive, Direct, Analytical and Driving. Most people show a mix.']] },
  { id: 'pulse', name: 'Pulse', cat: 'Personality & Emotions', mins: 2, scored: true, measures: 'Impulse control, reaction discipline',
    blurb: 'React only when the red dot appears, and hold back on everything else.',
    desc: 'Coloured dots flash at random places. Press Space (or tap the area) only when a red dot appears. Hold back for every other colour, including the orange lures. Dots get faster over time.',
    how: ['Watch the play area.', 'Red dot: press Space or tap as fast as you can.', 'Any other colour: do nothing.', 'The pace picks up every 30 seconds.'],
    skills: ['Impulse control', 'Reaction speed', 'Sustained attention'],
    strategy: ['Keep your finger ready, but decide on colour before moving.', 'Orange is the trap. Treat “warm” as “wait” until you see true red.', 'A false alarm costs more than a slightly slower hit.'],
    faq: [['How is it scored?', '10 points per hit plus a speed bonus, minus 10 per false alarm and 5 per miss.']] },
];
const META_BY = Object.fromEntries(META.map(m => [m.id, m]));
const IMPL = {};
const catClass = c => 'cat-' + c.split(' ')[0];

/* ---------- storage (this browser only) ---------- */
const Store = {
  key: 'agym.v1', data: { attempts: [], interviews: [] },
  load() { try { const s = localStorage.getItem(this.key); if (s) this.data = Object.assign({ attempts: [], interviews: [] }, JSON.parse(s)); } catch (e) {} },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  add(a) { this.data.attempts.push(a); this.save(); },
  forGame(id, full = true) { return this.data.attempts.filter(a => a.game === id && (!full || !a.quick)).sort((x, y) => x.ts - y.ts); },
};

/* ---------- game engine ---------- */
let ACTIVE = null;
function stopActive() { if (ACTIVE) { ACTIVE.kill(); ACTIVE = null; } }

function startGame(meta, { quick = false, onDone = null, mock = false, label = '' } = {}) {
  stopActive();
  const total = quick ? 60 : meta.mins * 60;
  app().innerHTML = `<div class="play">
    <div class="playbar"><button class="btn ghost sm" id="quit">Quit</button><strong>${esc(meta.name)}</strong>
      <span class="chip acc" id="lv"></span>${label ? `<span class="chip">${esc(label)}</span>` : ''}<span class="sp"></span>
      <span class="mono small muted" id="sc"></span><span class="timer" id="tm">${fmtTime(total)}</span></div>
    <div class="timebar"><i id="tb"></i></div>
    <div class="stagewrap"><div class="fb" id="fb"></div><div class="stage" id="stage"></div><p class="hint" id="hint"></p></div></div>`;
  window.scrollTo(0, 0);
  const timers = new Set(), keys = [];
  let alive = true, fbT = null;
  const t0 = performance.now();
  const ctx = {
    stage: $('#stage'),
    after(ms, fn) { const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms); timers.add(id); return id; },
    key(fn) { keys.push(fn); },
    level(t) { $('#lv').textContent = t; },
    hint(t) { $('#hint').textContent = t; },
    score(n) { $('#sc').textContent = 'Score ' + n; },
    progress(t) { $('#sc').textContent = t; },
    flash(kind, text, dur = 650) { const f = $('#fb'); f.className = 'fb show ' + kind; f.textContent = text; clearTimeout(fbT); fbT = setTimeout(() => f.classList.remove('show'), dur); },
    elapsed() { return (performance.now() - t0) / 1000; },
    finish() { end(); },
    get alive() { return alive; },
  };
  const onKey = e => {
    if (!alive) return;
    if (e.target.matches && e.target.matches('input,textarea')) return;
    if (['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) e.preventDefault();
    keys.forEach(f => f(e));
  };
  document.addEventListener('keydown', onKey);
  const iv = setInterval(() => {
    const left = total - ctx.elapsed();
    const tm = $('#tm'); if (!tm) return;
    tm.textContent = fmtTime(left); tm.classList.toggle('low', left <= 15);
    $('#tb').style.width = Math.max(0, left / total * 100) + '%';
    if (left <= 0) end();
  }, 200);
  function kill() { alive = false; clearInterval(iv); timers.forEach(clearTimeout); timers.clear(); document.removeEventListener('keydown', onKey); }
  let game;
  function end() {
    if (!alive) return;
    kill(); ACTIVE = null;
    const r = game.result();
    const att = { game: meta.id, ts: Date.now(), quick, mock, secs: Math.round(Math.min(total, ctx.elapsed())),
      score: meta.scored ? (r.score ?? 0) : null, accuracy: r.accuracy ?? null, stats: r.stats || [], profile: r.profile || null };
    Store.add(att);
    if (onDone) onDone(att, r); else showResult(meta, att, r);
  }
  ACTIVE = { kill };
  $('#quit').onclick = () => { stopActive(); location.hash = mock ? '#mock' : '#game-' + meta.id; route(); };
  game = IMPL[meta.id](ctx);
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
  const base = vals.some(v => v < 0) ? H / 2 : H - 40, span = vals.some(v => v < 0) ? H / 2 - 30 : H - 80;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Median score change by attempt number"><line class="grid" x1="${pad}" x2="${W - pad}" y1="${base}" y2="${base}"/>`;
  d.forEach((x, i) => {
    const cx = pad + i * (bw + gap);
    const ord = ['1st', '2nd', '3rd', '4th', '5th'][i];
    if (i === 0) { s += `<rect class="bar base" x="${cx}" y="${base - 6}" width="${bw}" height="6" rx="2"/><text x="${cx + bw / 2}" y="${base - 14}" text-anchor="middle" class="lbl">base</text>`; }
    else if (x.lift != null) {
      const hgt = Math.max(3, Math.abs(x.lift) / mx * span), y = x.lift >= 0 ? base - hgt : base;
      s += `<rect class="bar" x="${cx}" y="${y}" width="${bw}" height="${hgt}" rx="4"/><text class="lbl" x="${cx + bw / 2}" y="${x.lift >= 0 ? y - 7 : y + hgt + 15}" text-anchor="middle">${x.lift >= 0 ? '+' : ''}${Math.round(x.lift * 100)}%</text>`;
    } else s += `<text x="${cx + bw / 2}" y="${base - 10}" text-anchor="middle">no data</text>`;
    s += `<text x="${cx + bw / 2}" y="${H - 8}" text-anchor="middle">${ord}${i && x.n ? ` · ${x.n} game${x.n > 1 ? 's' : ''}` : ''}</text>`;
  });
  return s + '</svg><p class="small muted" style="margin-top:8px">Median change versus your first full-length attempt, across the scored games you have played. Computed from your own results in this browser.</p>';
}
function scoreLine(id) {
  const a = Store.forGame(id).filter(x => x.score != null);
  if (a.length < 2) return '';
  const W = 520, H = 170, p = 30, mx = Math.max(...a.map(x => x.score), 1);
  const X = i => p + i * (W - 2 * p) / (a.length - 1), Y = v => H - p - v / mx * (H - 2 * p);
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
    <div class="foot"><span>${m.mins} min${n ? ` · <span class="best">${m.scored && b != null ? 'best ' + b : n + ' played'}</span>` : ''}</span><b>View game →</b></div></a>`;
}
function demoFlashback() {
  return `<div class="hero-demo" aria-label="Flashback preview"><div class="demo-bar">Flashback <span class="chip acc">2-back · shape only</span><span class="mono">2:41</span></div>
    <div class="demo-stage"><p class="prompt">Does this match the one 2 back?</p><div class="stim-card">${shapeSVG('star', 'var(--ink)', 84)}</div>
    <div class="btnrow"><a class="btn yes sm" href="#play-flashback">Match <kbd>←</kbd></a><a class="btn no sm" href="#play-flashback">No match <kbd>→</kbd></a></div></div></div>`;
}

function viewHome() {
  const att = Store.data.attempts, played = new Set(att.map(a => a.game)).size;
  const cats = ['All', ...CATS];
  app().innerHTML = `
  <div class="hero"><div>
    <p class="eyebrow">HireVue-style game practice</p>
    <h1>Practise all 13 assessment games before the real one</h1>
    <p class="lede" style="margin-top:14px">Timed simulations with instructions, instant feedback, adaptive levels and a results screen for every game. Your scores stay in this browser so you can watch them climb attempt by attempt.</p>
    <div class="row"><a class="btn" href="#games">Choose a game</a><a class="btn ghost" href="#mock">Take a mock assessment</a><a class="btn ghost" href="#interview">Practise the video interview</a></div>
  </div>${demoFlashback()}</div>
  <div class="statline">
    <div><b>13</b><span>games to practise</span></div>
    <div><b>2–7 min</b><span>per game, timed</span></div>
    <div><b class="mono">${att.length}</b><span>attempts by you</span></div>
    <div><b class="mono">${played}/13</b><span>games you’ve tried</span></div>
  </div>

  <section id="games"><p class="eyebrow">Practice games</p><h2>Choose a game</h2>
    <p class="muted" style="margin-top:6px">Each game page has the rules, a strategy guide and your history. Start with a 1-minute warm-up or go straight to the full timed version.</p>
    <div class="filters" role="tablist">${cats.map(c => `<button data-c="${c}" class="${c === catFilter ? 'on' : ''}">${c}</button>`).join('')}</div>
    <div class="cards" id="cards"></div></section>

  <section><p class="eyebrow">Reference</p><h2>Every game at a glance</h2>
    <div class="tablewrap" style="margin-top:16px"><table><thead><tr><th>Game</th><th>Category</th><th>Time</th><th>What it measures</th><th>Prepare</th></tr></thead><tbody>
    ${META.map(m => `<tr><td><b>${m.name}</b></td><td><span class="chip ${catClass(m.cat)}"><span class="catdot"></span>${m.cat}</span></td><td class="mono">${m.mins} min</td><td>${m.measures}</td><td class="act"><a href="#play-${m.id}">Practice</a><a href="#game-${m.id}">Guide</a></td></tr>`).join('')}
    </tbody></table></div></section>

  <section><p class="eyebrow">Preparing for the assessment</p><h2>What to rehearse</h2>
    <div class="grid3" style="margin-top:16px">
      <div class="panel"><h3>Controls and timing</h3><p>Each game runs on its own clock with no pause button. Learn the keys here (arrows, Space, number keys) so none of your real attempt goes on figuring out the controls.</p></div>
      <div class="panel"><h3>Scoring</h3><p>Cognitive and spatial games reward accuracy within the time limit. Personality games have no right answers and produce a profile. Each results screen shows what was measured.</p></div>
      <div class="panel"><h3>Full run-through</h3><p>Employers usually pick a handful of games for each role. The mock assessment draws five at random and runs them back to back, like a real invitation.</p></div>
    </div></section>

  <section class="grid2"><div><p class="eyebrow">Your results over repeated attempts</p><h2>Score lift by attempt</h2>
    <p class="muted" style="margin-top:8px">Most of the gain from practice comes from familiarity: knowing the rules, the pace and the controls. This chart shows your own improvement relative to your first attempt.</p>
    <a class="btn ghost sm" href="#progress" style="margin-top:14px">See full progress</a></div>
    <div class="panel">${liftChart()}</div></section>

  <section><p class="eyebrow">How the games behave</p><h2>Adaptive, timed and short</h2>
    <div class="grid2" style="margin-top:14px"><p class="muted">The games adapt: answer correctly and the levels get harder, so a round that suddenly feels brutal usually means you are doing well. Each game opens at an easy level and most run two to five minutes.</p>
    <p class="muted">On the day: a quiet room, a laptop or desktop, notifications off, one sitting. Chunk digit sequences into threes and fours, and give the n-back game (Flashback) a few extra sessions; it is the one most people find hardest.</p></div></section>

  <section><p class="eyebrow">FAQ</p><h2>Questions about the assessment</h2><div style="margin-top:8px">
    ${[['What is a game-based assessment?', 'A set of short browser games that employers use early in hiring. Cognitive games measure speed and accuracy, spatial games measure visual processing, and personality games map your choices to work-style traits.'],
      ['How many games will I get?', 'The employer chooses a subset for each role, often four to six. Check your invitation for the list.'],
      ['How long does it take?', 'Each game is timed individually, usually two to seven minutes, so a full set takes roughly 15 to 30 minutes.'],
      ['Can I fail the games?', 'There is no universal pass mark. Results are compared with other candidates and the employer sets its own cut-off.'],
      ['Are there tricks or hacks?', 'No. The games measure real abilities. What practice changes is familiarity, so your one real attempt is not spent learning the format.'],
      ['Where are my results saved?', 'In this browser’s local storage. Use “Copy my data” on the My progress page to back them up or move them to another device.'],
      ['Do I see my official results?', 'Usually not. Employers see the results; candidates rarely do. That is why practice feedback is useful.']]
      .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>
  <p class="disclaim">Assessment Gym is an independent practice tool. It is not affiliated with HireVue or any employer. The games are original simulations of common assessment formats for practice only.</p>`;
  const paint = () => { $('#cards').innerHTML = META.filter(m => catFilter === 'All' || m.cat === catFilter).map(gameCard).join(''); };
  paint();
  $$('.filters button').forEach(b => b.onclick = () => { catFilter = b.dataset.c; $$('.filters button').forEach(x => x.classList.toggle('on', x === b)); paint(); });
}

function historyList(id, scored) {
  const a = Store.forGame(id, false).slice().reverse();
  if (!a.length) return `<div class="empty">No attempts yet. Your results will appear here.</div>`;
  return `<div class="tablewrap"><table style="min-width:420px"><thead><tr><th>When</th><th>Mode</th>${scored ? '<th>Score</th><th>Accuracy</th>' : '<th>Answers</th>'}</tr></thead><tbody>
   ${a.slice(0, 12).map(x => `<tr><td>${new Date(x.ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td><td>${x.quick ? 'Warm-up' : x.mock ? 'Mock' : 'Full'}</td>${scored ? `<td class="mono">${x.score}</td><td class="mono">${pct(x.accuracy)}</td>` : `<td class="mono">${(x.stats.find(s => s[0] === 'Answered') || ['', '–'])[1]}</td>`}</tr>`).join('')}
   </tbody></table></div>`;
}

function viewGame(id) {
  const m = META_BY[id]; if (!m) return viewHome();
  const full = Store.forGame(id), b = bestOf(id);
  app().innerHTML = `<p class="crumbs"><a href="#home">Games</a> / ${m.cat} / ${m.name}</p>
  <div class="detail-hero ${catClass(m.cat)}"><div>
    <span class="chip"><span class="catdot"></span>${m.cat}</span>
    <h1 style="margin-top:10px">${m.name}</h1>
    <p class="lede" style="margin-top:12px">${m.desc}</p>
    <div class="row" style="margin-top:20px"><a class="btn" href="#play-${id}">Start ${m.name}</a><a class="btn ghost" href="#warmup-${id}">1-minute warm-up</a></div>
    <div class="row small muted" style="margin-top:14px"><span class="chip">${m.mins} minutes</span><span class="chip">${m.scored ? 'Adaptive levels' : 'Profile, no right answers'}</span>${b != null ? `<span class="chip acc">Your best: ${b}</span>` : ''}</div>
  </div>
  <div class="panel"><h3>How to play</h3><ol class="steps" style="margin-top:12px">${m.how.map(s => `<li><span>${s}</span></li>`).join('')}</ol></div></div>

  <section class="grid2"><div><p class="eyebrow">Skills assessed</p><div class="skills" style="margin-top:10px">${m.skills.map(s => `<span class="chip acc">${s}</span>`).join('')}</div>
    <h2 style="margin-top:28px" id="guide">Strategy guide</h2><ul style="margin:12px 0 0;padding-left:20px;display:grid;gap:8px">${m.strategy.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <div><p class="eyebrow">Your history</p><h2>${full.length ? `${full.length} full attempt${full.length > 1 ? 's' : ''}` : 'Not played yet'}</h2>
    <div style="margin-top:12px">${m.scored ? scoreLine(id) : ''}${historyList(id, m.scored)}</div></div></section>

  <section><p class="eyebrow">FAQ</p><h2>${m.name} questions</h2><div style="margin-top:8px">
    <details><summary>What does ${m.name} measure?</summary><p>${m.measures}. ${m.desc}</p></details>
    <details><summary>How long does it take?</summary><p>${m.mins} minutes on the clock with no pause, the same as a typical real run. The warm-up mode runs for one minute and is kept separate from your progress chart.</p></details>
    ${m.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
    <details><summary>Does practising help?</summary><p>Practice makes the format familiar, so your real attempt goes on the task rather than on learning the controls. Your own score lift is tracked on the My progress page.</p></details>
  </div></section>
  <p class="disclaim">Independent practice simulation. Not affiliated with HireVue or any employer.</p>`;
}

function resultBody(meta, att, r) {
  const prev = Store.forGame(meta.id).filter(x => x.ts < att.ts && x.score != null);
  const prevBest = prev.length ? Math.max(...prev.map(x => x.score)) : null;
  let top;
  if (meta.scored) {
    const cmp = att.quick ? 'Warm-up runs are not compared with full runs.' : prevBest == null ? 'First full attempt. This is your baseline.' :
      att.score > prevBest ? `New personal best, up from ${prevBest}.` : `Your best so far is ${prevBest}.`;
    top = `<div class="score-hero"><div><div class="big mono">${att.score}</div><div class="muted small">points</div></div>
      <div><h2>${meta.name} complete</h2><p class="muted" style="margin-top:6px">${cmp}</p>${att.accuracy != null ? `<p style="margin-top:6px">Accuracy <b class="mono">${pct(att.accuracy)}</b></p>` : ''}</div></div>`;
  } else top = `<div class="score-hero"><div><div class="big">✓</div></div><div><h2>${meta.name} complete</h2><p class="muted" style="margin-top:6px">There are no right answers. Below is the profile your choices produce.</p></div></div>`;
  const stats = r.stats && r.stats.length ? `<div class="kv">${r.stats.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>` : '';
  let prof = '';
  if (r.profile) prof = `<div class="panel"><h3>Your profile</h3><div class="bars" style="margin-top:14px">${r.profile.map(p => p.right != null
    ? `<div class="bar2"><span>${p.left}</span><div class="t"><i style="left:${p.value}%"></i></div><span class="r">${p.right}</span></div>`
    : `<div class="bar1"><span>${p.label}</span><div class="t"><i style="width:${p.value}%"></i></div><span class="mono">${Math.round(p.value)}</span></div>`).join('')}</div>${r.note ? `<p class="small muted" style="margin-top:14px">${r.note}</p>` : ''}</div>`;
  return top + stats + prof;
}
function showResult(meta, att, r) {
  app().innerHTML = `<div class="result">${resultBody(meta, att, r)}
    <div class="panel"><h3>What this measured</h3><p>${meta.measures}. ${meta.strategy[0]}</p></div>
    <div class="row"><button class="btn" id="again">Play again</button><a class="btn ghost" href="#game-${meta.id}">Back to ${meta.name}</a><a class="btn ghost" href="#home">All games</a></div></div>`;
  $('#again').onclick = () => startGame(meta, { quick: att.quick });
  window.scrollTo(0, 0);
}

/* ---------- mock assessment ---------- */
function viewMock() {
  let picks = sample(META, 5);
  const draw = () => {
    const mins = picks.reduce((s, m) => s + m.mins, 0);
    app().innerHTML = `<p class="eyebrow">Mock assessment</p><h1>Your practice invitation</h1>
    <p class="lede" style="margin-top:12px">Five games drawn at random, played back to back like a real invitation. Each game runs on its own clock and gets a short instruction screen first. Total time on the clock: <b class="mono">${mins} min</b>.</p>
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
    $('#again').onclick = viewMock; return;
  }
  const m = picks[i];
  app().innerHTML = `<div class="play"><p class="eyebrow">Game ${i + 1} of ${picks.length}</p><h1>${m.name}</h1><p class="lede" style="margin-top:10px">${m.desc}</p>
   <div class="panel" style="margin-top:18px"><h3>How to play</h3><ol class="steps" style="margin-top:12px">${m.how.map(s => `<li><span>${s}</span></li>`).join('')}</ol></div>
   <div class="row" style="margin-top:18px"><button class="btn" id="go">Begin (${m.mins} min)</button></div></div>`;
  $('#go').onclick = () => startGame(m, { mock: true, label: `Mock ${i + 1}/${picks.length}`, onDone: att => runMock(picks, i + 1, [...done, { m, att }]) });
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
    catch (e) { io.innerHTML = `<textarea id="dump" readonly>${esc(txt)}</textarea><p class="small muted">Copy this text manually.</p>`; $('#dump').select(); }
  };
  $('#imp').onclick = () => {
    io.innerHTML = `<textarea id="paste" placeholder="Paste a backup here"></textarea><div class="row" style="margin-top:8px"><button class="btn sm" id="doimp">Restore backup</button></div>`;
    $('#doimp').onclick = () => { try { const d = JSON.parse($('#paste').value); if (!Array.isArray(d.attempts)) throw 0; Store.data = Object.assign({ attempts: [], interviews: [] }, d); Store.save(); viewProgress(); } catch (e) { io.insertAdjacentHTML('beforeend', '<p class="small" style="color:var(--bad)">That text is not a valid backup. Paste the full text from “Copy my data”.</p>'); } };
  };
  $('#rs').onclick = () => {
    io.innerHTML = `<div class="confirm"><span>Delete all ${all.length} attempts and interview notes from this browser? This cannot be undone.</span><button class="btn no sm" id="yes">Delete everything</button><button class="btn ghost sm" id="no">Keep</button></div>`;
    $('#yes').onclick = () => { Store.data = { attempts: [], interviews: [] }; Store.save(); viewProgress(); };
    $('#no').onclick = () => { io.innerHTML = ''; };
  };
}

/* ---------- video interview practice ---------- */
const IQ = {
  'About you': ['Tell me about yourself and why you applied for this role.', 'What would your last manager or teacher say is your greatest strength?', 'Describe a weakness you are actively working on.', 'Where do you want to be in three years?'],
  'Teamwork': ['Tell me about a time you disagreed with a teammate. What did you do?', 'Describe a group project where someone was not pulling their weight.', 'Give an example of when you helped a colleague who was struggling.', 'Tell me about a time you had to work with someone very different from you.'],
  'Problem solving': ['Describe a difficult problem you solved. How did you approach it?', 'Tell me about a time you made a mistake. What did you learn?', 'Give an example of when you had to make a decision with incomplete information.', 'Tell me about a process you improved.'],
  'Pressure & priorities': ['Tell me about a time you had several deadlines at once.', 'Describe a situation where plans changed at the last minute.', 'Tell me about a time you had to deliver bad news.', 'Describe the most stressful situation you have handled and how you stayed effective.'],
  'Motivation': ['What do you know about our industry and what draws you to it?', 'Why should we hire you over other candidates?', 'Tell me about an achievement you are proud of.', 'What does great customer service mean to you?'],
};
function viewInterview() {
  const hist = Store.data.interviews.slice().reverse();
  app().innerHTML = `<p class="eyebrow">Video interview practice</p><h1>One-way interview drill</h1>
  <p class="lede" style="margin-top:10px">Recorded interviews give you a short preparation time, then a fixed answer window. Pick a topic, answer out loud as if the camera were on, then review yourself against the STAR checklist.</p>
  <div class="grid2" style="margin-top:24px"><div class="panel"><h3>Set up</h3><div style="display:grid;gap:12px;margin-top:12px">
    <label>Topic<select id="iv-topic"><option>Any topic</option>${Object.keys(IQ).map(t => `<option>${t}</option>`).join('')}</select></label>
    <label>Preparation time<select id="iv-prep"><option value="30">30 seconds</option><option value="60">60 seconds</option><option value="0">None</option></select></label>
    <label>Answer time<select id="iv-ans"><option value="60">1 minute</option><option value="120" selected>2 minutes</option><option value="180">3 minutes</option></select></label>
    <button class="btn" id="iv-go">Get a question</button></div></div>
   <div class="panel"><h3>The STAR method</h3><ol class="steps" style="margin-top:12px">
    <li><span><b>Situation.</b> Set the scene in one or two sentences.</span></li><li><span><b>Task.</b> What were you responsible for?</span></li>
    <li><span><b>Action.</b> What did <i>you</i> do? Spend most of your time here.</span></li><li><span><b>Result.</b> What changed? Use a number if you can.</span></li></ol></div></div>
  <section><h2>Past answers</h2><div style="margin-top:12px">${hist.length ? `<div class="tablewrap"><table><thead><tr><th>When</th><th>Question</th><th>Self-rating</th></tr></thead><tbody>${hist.slice(0, 15).map(h => `<tr><td>${new Date(h.ts).toLocaleDateString()}</td><td>${esc(h.q)}</td><td class="mono">${h.rating}/6</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Your practised questions and self-ratings will appear here.</div>'}</div></section>`;
  $('#iv-go').onclick = () => {
    const t = $('#iv-topic').value, pool = t === 'Any topic' ? Object.values(IQ).flat() : IQ[t];
    runInterview(pick(pool), +$('#iv-prep').value, +$('#iv-ans').value);
  };
}
function runInterview(q, prep, ans) {
  stopActive();
  let iv = null, alive = true;
  ACTIVE = { kill() { alive = false; clearInterval(iv); } };
  const phase = (name, secs, next) => {
    const t0 = Date.now();
    app().innerHTML = `<div class="play"><div class="q-card"><div class="row"><span class="chip acc">${name}</span><span class="sp" style="flex:1"></span><span class="ring" id="cd">${fmtTime(secs)}</span></div>
      <p class="q-text">${esc(q)}</p>
      ${name === 'Answering' ? '<p class="muted">Speak your answer out loud now. Jot keywords below if it helps.</p><textarea id="notes" placeholder="Optional notes"></textarea>' : '<p class="muted">Plan your example: situation, task, action, result.</p>'}
      <div class="row"><button class="btn" id="skip">${name === 'Answering' ? 'Finish answer' : 'Start answering now'}</button><a class="btn ghost" href="#interview">Cancel</a></div></div></div>`;
    $('#skip').onclick = () => { clearInterval(iv); next(); };
    clearInterval(iv);
    iv = setInterval(() => { if (!alive) return; const left = secs - (Date.now() - t0) / 1000; const cd = $('#cd'); if (cd) cd.textContent = fmtTime(left); if (left <= 0) { clearInterval(iv); next(); } }, 250);
  };
  const review = () => {
    const notes = $('#notes') ? $('#notes').value : '';
    ACTIVE = null;
    const checks = ['I described the situation briefly', 'I made my own role clear', 'Most of my answer was about actions I took', 'I stated a concrete result', 'I finished inside the time limit', 'I used a specific real example, not a general claim'];
    app().innerHTML = `<div class="play"><div class="q-card"><span class="chip acc">Review</span><p class="q-text">${esc(q)}</p>
      <p class="muted">Tick what you did. Be strict; this is for you.</p><div>${checks.map((c, i) => `<label class="chk"><input type="checkbox" id="c${i}"> ${c}</label>`).join('')}</div>
      <div class="row"><button class="btn" id="save">Save review</button><button class="btn ghost" id="retake">Retake this question</button></div></div></div>`;
    $('#retake').onclick = () => runInterview(q, prep, ans);
    $('#save').onclick = () => { const rating = checks.filter((_, i) => $('#c' + i).checked).length; Store.data.interviews.push({ ts: Date.now(), q, rating, notes }); Store.save(); viewInterview(); };
  };
  const answer = () => phase('Answering', ans, review);
  if (prep > 0) phase('Preparation', prep, answer); else answer();
}

/* ---------- router ---------- */
function route() {
  stopActive();
  const h = location.hash.slice(1) || 'home';
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.n === h || (a.dataset.n === 'home' && /^(home|games|game-)/.test(h))));
  let m;
  if ((m = h.match(/^game-(\w+)$/))) { viewGame(m[1]); window.scrollTo(0, 0); }
  else if ((m = h.match(/^(play|warmup)-(\w+)$/)) && META_BY[m[2]]) startGame(META_BY[m[2]], { quick: m[1] === 'warmup' });
  else if (h === 'mock') viewMock();
  else if (h === 'progress') viewProgress();
  else if (h === 'interview') viewInterview();
  else { viewHome(); if (h === 'games') $('#games').scrollIntoView(); else window.scrollTo(0, 0); }
}
function boot() { Store.load(); window.addEventListener('hashchange', route); route(); }
