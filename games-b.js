'use strict';
/* Personality & emotion games. */

/* ---------- Portrait (forced-choice pictures) ---------- */
const ICONS = {
  team: '<circle cx="30" cy="38" r="10"/><circle cx="70" cy="38" r="10"/><circle cx="50" cy="30" r="11"/><path d="M12 78c2-14 10-22 18-22M88 78c-2-14-10-22-18-22M30 82c0-16 9-26 20-26s20 10 20 26"/>',
  solo: '<circle cx="50" cy="28" r="12"/><path d="M30 64c0-12 9-20 20-20s20 8 20 20"/><rect x="24" y="66" width="52" height="18" rx="3"/>',
  plan: '<rect x="22" y="14" width="56" height="72" rx="6"/><path d="M34 34l5 5 9-10M34 54l5 5 9-10M56 36h12M56 56h12M34 74h34"/>',
  adapt: '<path d="M18 70c10-30 24-40 32-20s22 10 32-20"/><path d="M74 22l8 8-10 4"/><circle cx="18" cy="70" r="4"/>',
  lead: '<path d="M30 88V14"/><path d="M30 16h44l-10 13 10 13H30"/>',
  support: '<path d="M50 80S16 60 16 38c0-10 8-18 17-18 7 0 13 5 17 11 4-6 10-11 17-11 9 0 17 8 17 18 0 22-34 42-34 42z"/>',
  detail: '<circle cx="42" cy="42" r="22"/><path d="M58 58l24 24M34 42h16M42 34v16"/>',
  vision: '<path d="M10 80l26-40 16 22 12-16 26 34z"/><circle cx="72" cy="24" r="8"/>',
  fast: '<path d="M54 10L24 56h24l-6 34 34-48H52z"/>',
  careful: '<path d="M50 12l32 12v22c0 20-14 34-32 42-18-8-32-22-32-42V24z"/><path d="M36 50l10 10 18-20"/>',
};
const PORTRAIT_ITEMS = [
  ['social', ['team', 'I do my best work bouncing ideas off a team.'], ['solo', 'I do my best work with time to think on my own.']],
  ['structure', ['plan', 'I like a clear plan before I start.'], ['adapt', 'I like to start and adjust as I go.']],
  ['influence', ['lead', 'In a group, I usually take charge.'], ['support', 'In a group, I make sure everyone is heard.']],
  ['focus', ['detail', 'I notice the small errors others miss.'], ['vision', 'I see where the whole project is heading.']],
  ['tempo', ['fast', 'I make quick decisions and move on.'], ['careful', 'I double-check before committing.']],
  ['social', ['team', 'A busy, shared workspace energises me.'], ['solo', 'A quiet corner helps me concentrate.']],
  ['structure', ['plan', 'I keep a detailed to-do list.'], ['adapt', 'I handle tasks as they come up.']],
  ['influence', ['lead', 'I enjoy persuading people to try my idea.'], ['support', 'I enjoy helping others make their idea work.']],
  ['focus', ['detail', 'I like perfecting one piece of work.'], ['vision', 'I like juggling the big-picture strategy.']],
  ['tempo', ['fast', 'A tight deadline brings out my best.'], ['careful', 'I prefer enough time to do it properly.']],
  ['social', ['team', 'I would rather present as a group.'], ['solo', 'I would rather write a report alone.']],
  ['structure', ['plan', 'Surprises in my schedule bother me.'], ['adapt', 'I like days that are never the same.']],
  ['influence', ['lead', 'I volunteer to run the meeting.'], ['support', 'I volunteer to take the notes and follow up.']],
  ['focus', ['detail', 'I read the instructions fully first.'], ['vision', 'I skim and get the gist.']],
  ['tempo', ['fast', 'Done is better than perfect.'], ['careful', 'Getting it right matters more than getting it first.']],
  ['social', ['team', 'I talk problems through with colleagues.'], ['solo', 'I work problems out in my head first.']],
  ['structure', ['plan', 'I follow established processes.'], ['adapt', 'I look for a new way to do things.']],
  ['influence', ['lead', 'I am comfortable making the final call.'], ['support', 'I prefer to advise the person who decides.']],
  ['focus', ['detail', 'I check every number in a report.'], ['vision', 'I look for the story the numbers tell.']],
  ['tempo', ['fast', 'I act on my first instinct.'], ['careful', 'I sleep on important decisions.']],
];
const DIMS = { social: ['Team', 'Independent'], structure: ['Planned', 'Flexible'], influence: ['Leading', 'Supporting'], focus: ['Detail', 'Big picture'], tempo: ['Fast', 'Thorough'] };
IMPL.portrait = ctx => {
  // 20 within-dimension pairs plus 30 cross-dimension pairs (forced choice between two different traits) = 50 items
  const bank = PORTRAIT_ITEMS.flatMap(([d, a, b]) => [{ d, pole: 0, ic: a[0], t: a[1] }, { d, pole: 1, ic: b[0], t: b[1] }]);
  const within = PORTRAIT_ITEMS.map(([d, a, b]) => [{ d, pole: 0, ic: a[0], t: a[1] }, { d, pole: 1, ic: b[0], t: b[1] }]);
  const cross = [], seen = new Set();
  while (cross.length < 30) {
    const x = pick(bank), y = pick(bank), k = [x.t, y.t].sort().join('|');
    if (x.d === y.d || seen.has(k)) continue;
    seen.add(k); cross.push([x, y]);
  }
  const items = shuffle([...within, ...cross]).map(p => shuffle(p));
  const score = Object.fromEntries(Object.keys(DIMS).map(d => [d, [0, 0]]));
  let i = 0;
  function show() {
    if (i >= items.length) return ctx.finish();
    const [a, b] = items[i];
    ctx.progress(`${i + 1} / ${items.length}`); ctx.level('Work style');
    ctx.stage.innerHTML = `<p class="prompt">Which describes you better?</p><div class="prog"><i style="width:${i / items.length * 100}%"></i></div>
      <div class="pair"><button id="pa"><svg viewBox="0 0 100 100" aria-hidden="true">${ICONS[a.ic]}</svg><span>${a.t}</span></button><button id="pb"><svg viewBox="0 0 100 100" aria-hidden="true">${ICONS[b.ic]}</svg><span>${b.t}</span></button></div>`;
    const choose = s => { score[s.d][s.pole]++; i++; show(); };
    $('#pa').onclick = () => choose(a); $('#pb').onclick = () => choose(b);
  }
  ctx.key(e => { if (e.key === 'ArrowLeft') $('#pa')?.click(); if (e.key === 'ArrowRight') $('#pb')?.click(); });
  ctx.hint('Keyboard: ← left option · → right option');
  show();
  return { result() {
    return { stats: [['Answered', `${i}/${items.length}`]], profile: Object.entries(DIMS).map(([d, [l, r]]) => { const [x, y] = score[d]; return { left: l, right: r, value: x + y ? y / (x + y) * 100 : 50 }; }),
      note: 'The dot shows which way you leaned on each dimension. Centre means balanced.' };
  } };
};

/* ---------- PortraitXT (Likert) ---------- */
const XT = [
  ['Drive', 'I set ambitious goals for myself.', 1], ['Drive', 'I keep going when a task gets tedious.', 1], ['Drive', 'I am happy doing just what is required.', -1],
  ['Drive', 'I look for chances to take on more responsibility.', 1], ['Drive', 'I lose interest when progress is slow.', -1], ['Drive', 'I push myself to beat my previous results.', 1],
  ['Collaboration', 'I enjoy working towards a shared goal.', 1], ['Collaboration', 'I would rather get credit for my own work than share it.', -1], ['Collaboration', 'I go out of my way to help a struggling colleague.', 1],
  ['Collaboration', 'I find group decisions frustrating.', -1], ['Collaboration', 'I ask for others’ views before deciding.', 1], ['Collaboration', 'I build good relationships quickly.', 1],
  ['Organisation', 'I plan my week in advance.', 1], ['Organisation', 'My workspace tends to be messy.', -1], ['Organisation', 'I finish tasks well before the deadline.', 1],
  ['Organisation', 'I often forget small commitments.', -1], ['Organisation', 'I break big tasks into clear steps.', 1], ['Organisation', 'I keep track of where my files and notes are.', 1],
  ['Composure', 'I stay calm when things go wrong.', 1], ['Composure', 'Criticism stays on my mind for days.', -1], ['Composure', 'I can think clearly under pressure.', 1],
  ['Composure', 'I get anxious before important events.', -1], ['Composure', 'I recover quickly from setbacks.', 1], ['Composure', 'I keep my emotions in check at work.', 1],
  ['Curiosity', 'I enjoy learning things outside my field.', 1], ['Curiosity', 'I prefer familiar ways of doing things.', -1], ['Curiosity', 'I ask “why” until I understand something properly.', 1],
  ['Curiosity', 'I seek out new tools and methods.', 1], ['Curiosity', 'Abstract ideas bore me.', -1], ['Curiosity', 'I like solving problems nobody has solved before.', 1],
  ['Drive', 'I volunteer for the hardest part of a project.', 1], ['Drive', 'Once a task is “good enough” I stop.', -1],
  ['Drive', 'I measure my progress against clear targets.', 1], ['Drive', 'I keep working on a goal after others give up.', 1],
  ['Collaboration', 'I keep teammates updated without being asked.', 1], ['Collaboration', 'I prefer to fix problems myself rather than involve others.', -1],
  ['Collaboration', 'I change my plan when a colleague has a better idea.', 1], ['Collaboration', 'Small talk with colleagues feels like a waste of time.', -1],
  ['Organisation', 'I rarely need a reminder for a deadline.', 1], ['Organisation', 'I tend to start things at the last minute.', -1],
  ['Organisation', 'I check my work against the brief before handing it in.', 1], ['Organisation', 'I keep a single list of everything I need to do.', 1],
  ['Composure', 'I can take tough feedback without getting defensive.', 1], ['Composure', 'An unexpected problem can ruin my whole day.', -1],
  ['Composure', 'I stay patient with people who are upset.', 1], ['Composure', 'I sleep well before a big day.', 1],
  ['Curiosity', 'I read about topics just because they interest me.', 1], ['Curiosity', 'I prefer clear instructions to open-ended problems.', -1],
  ['Curiosity', 'I enjoy hearing views that differ from mine.', 1], ['Curiosity', 'I like taking things apart to see how they work.', 1],
];
IMPL.portraitxt = ctx => {
  const items = shuffle(XT), ans = [];
  const LAB = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
  let i = 0;
  function show() {
    if (i >= items.length) return ctx.finish();
    ctx.progress(`${i + 1} / ${items.length}`); ctx.level('Self-rating');
    ctx.stage.innerHTML = `<div class="prog"><i style="width:${i / items.length * 100}%"></i></div><p class="statement">${items[i][1]}</p>
      <div class="likert">${LAB.map((l, k) => `<button data-v="${k + 1}"><b>${k + 1}</b>${l}</button>`).join('')}</div>`;
    $$('.likert button', ctx.stage).forEach(b => b.onclick = () => rate(+b.dataset.v));
  }
  function rate(v) { if (i >= items.length) return; ans.push({ t: items[i][0], v: items[i][2] > 0 ? v : 6 - v, raw: v, key: items[i][2] }); i++; show(); }
  ctx.key(e => { if (/^[1-5]$/.test(e.key)) rate(+e.key); });
  ctx.hint('Keyboard: 1–5');
  show();
  return { result() {
    const traits = ['Drive', 'Collaboration', 'Organisation', 'Composure', 'Curiosity'];
    const prof = traits.map(t => { const a = ans.filter(x => x.t === t); return { label: t, value: a.length ? (mean(a.map(x => x.v)) - 1) / 4 * 100 : 0 }; });
    // consistency: within each trait, keyed answers vs reversed answers should agree once reversed
    const gaps = traits.map(t => { const a = ans.filter(x => x.t === t); const p = a.filter(x => x.key > 0).map(x => x.v), n = a.filter(x => x.key < 0).map(x => x.v); return p.length && n.length ? Math.abs(mean(p) - mean(n)) : null; }).filter(x => x != null);
    const cons = gaps.length ? Math.max(0, 1 - mean(gaps) / 4) : null;
    const spread = ans.length ? new Set(ans.map(a => a.raw)).size : 0;
    return { stats: [['Answered', `${ans.length}/${items.length}`], ['Consistency', pct(cons)], ['Scale points used', `${spread}/5`]], profile: prof,
      note: 'Scores run from 0 (low) to 100 (high). Consistency compares your answers to statements worded in opposite directions.' };
  } };
};

/* ---------- E-Motions ---------- */
const EMO = ['Happy', 'Sad', 'Angry', 'Surprised', 'Afraid', 'Disgusted'];
function faceSVG(em, k, skin, hair) {
  const P = { Happy: { m: 1, eo: -0.25, cheek: 1 }, Sad: { m: -0.8, bi: 1, eo: -0.3 }, Angry: { bi: -1.1, bh: -0.3, m: -0.2, eo: -0.35, tight: 1 },
    Surprised: { bh: 1, eo: 0.75, open: 1 }, Afraid: { bh: 0.6, bi: 0.9, eo: 0.65, open: 0.45, wide: 1 }, Disgusted: { bi: -0.5, bh: -0.3, nose: 1, m: -0.5, eo: -0.3, lip: 1 },
    Contempt: { smirk: 1, eo: -0.1 }, Neutral: {} }[em];
  const g = n => (P[n] || 0) * k;
  const eo = 1 + g('eo'), by = 82 - g('bh') * 12, bi = g('bi') * 10;
  const mY = 162, m = g('m'), corner = mY - m * 10, ctrl = mY + m * 16;
  let mouth;
  if (g('open') > 0.05) mouth = `<ellipse cx="100" cy="${mY + 4}" rx="${12 + g('wide') * 9}" ry="${5 + g('open') * 13}" fill="#3a1d1d"/>`;
  else if (g('smirk') > 0.05) mouth = `<path d="M76 ${mY + 1} Q100 ${mY + 4} 126 ${mY - g('smirk') * 10}" stroke="#5a2a2a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  else mouth = `<path d="M76 ${corner} Q100 ${ctrl} 124 ${corner}" stroke="#5a2a2a" stroke-width="${g('tight') ? 5 : 4}" fill="none" stroke-linecap="round"/>`;
  if (g('lip') > 0.05) mouth += `<path d="M84 ${mY - 6 - g('lip') * 4} Q96 ${mY - 12 - g('lip') * 4} 108 ${mY - 6}" stroke="#5a2a2a" stroke-width="3" fill="none"/>`;
  const eye = cx => `<ellipse cx="${cx}" cy="104" rx="13" ry="${Math.max(2, 8 * eo)}" fill="#fff" stroke="#2b2b2b" stroke-width="1.5"/><circle cx="${cx}" cy="104" r="${Math.min(5.5, Math.max(1.5, 8 * eo - 1))}" fill="#2b2b2b"/>`;
  const nose = `<path d="M100 112 Q94 134 100 138" stroke="rgba(0,0,0,.35)" stroke-width="3" fill="none"/>${g('nose') > 0.05 ? `<path d="M88 122 l6 4 M112 122 l-6 4" stroke="rgba(0,0,0,.4)" stroke-width="2.5"/>` : ''}`;
  const cheeks = g('cheek') > 0.05 ? `<circle cx="66" cy="132" r="10" fill="#ff7a7a" opacity="${0.3 * k}"/><circle cx="134" cy="132" r="10" fill="#ff7a7a" opacity="${0.3 * k}"/>` : '';
  return `<svg class="face" viewBox="0 0 200 220" role="img" aria-label="Face showing an expression">
    <ellipse cx="100" cy="118" rx="70" ry="86" fill="${skin}"/>
    <path d="M30 104 C28 40 70 26 100 26 C134 26 174 40 170 104 C160 70 140 56 100 56 C62 56 40 70 30 104z" fill="${hair}"/>
    ${eye(72)}${eye(128)}
    <path d="M56 ${by} L88 ${by - bi}" stroke="${hair}" stroke-width="6" stroke-linecap="round"/><path d="M112 ${by - bi} L144 ${by}" stroke="${hair}" stroke-width="6" stroke-linecap="round"/>
    ${nose}${cheeks}${mouth}</svg>`;
}
IMPL.emotions = ctx => {
  const SKIN = ['#f3d2b5', '#e0ac85', '#c68a62', '#8d5a3b', '#5c3a26'], HAIR = ['#2b1d14', '#5a3a22', '#a36b2f', '#1b1b1b', '#7d7d7d'];
  let lv = 1, streak = 0, pts = 0, ok = 0, bad = 0, lock = false, t0, answer;
  const rts = [], confus = {};
  function show() {
    lock = false; answer = pick(EMO);
    const k = Math.max(0.35, 1.05 - (lv - 1) * 0.12);
    const opts = EMO;
    ctx.level(`Level ${lv}`);
    ctx.stage.innerHTML = `<p class="prompt">Which emotion is this?</p>${faceSVG(answer, k, pick(SKIN), pick(HAIR))}<div class="opts six">${opts.map((o, i) => `<button data-o="${o}"><span class="mono muted">${i + 1}</span> ${o}</button>`).join('')}</div>`;
    t0 = performance.now();
    $$('.opts button', ctx.stage).forEach(b => b.onclick = () => choose(b));
  }
  function choose(b) {
    if (lock) return; lock = true; rts.push(performance.now() - t0);
    if (b.dataset.o === answer) { ok++; pts += lv; b.classList.add('right'); ctx.flash('ok', 'Correct'); if (++streak >= 3) { lv++; streak = 0; } }
    else { bad++; streak = 0; b.classList.add('wrong'); $(`.opts button[data-o="${answer}"]`, ctx.stage).classList.add('right'); confus[answer] = (confus[answer] || 0) + 1; ctx.flash('bad', 'It was ' + answer.toLowerCase()); lv = Math.max(1, lv - 1); }
    ctx.score(pts); ctx.after(900, show);
  }
  ctx.key(e => { if (/^[1-6]$/.test(e.key)) $$('.opts button', ctx.stage)[+e.key - 1]?.click(); });
  ctx.hint('Keyboard: 1–6');
  ctx.score(0); show();
  return { result() {
    const t = ok + bad, worst = Object.entries(confus).sort((a, b) => b[1] - a[1])[0];
    return { score: pts, accuracy: t ? ok / t : null, stats: [['Faces', t], ['Correct', ok], ['Highest level', lv], ['Median response', ms(median(rts))], ['Most missed', worst ? worst[0] : '–']] };
  } };
};

/* ---------- Teamchat ---------- */
/* Each reply: [style, rating 0–2, text]. Rating 2 = the reply that both moves the work forward and keeps the relationship intact. */
const CHAT = [
  { who: 'Priya (project lead)', msgs: ['Morning! The client moved the demo to Thursday instead of next week.', 'Can we still make it?'],
    opts: [['A', 2, 'Let me check the remaining tasks against our hours and come back to you within the hour.'], ['R', 1, 'Sure, we’ll make it happen somehow.'], ['S', 0, 'That’s really stressful. Why do clients always do this?']],
    why: 'Committing before checking the work is risky; complaining helps no one. A quick, time-boxed check gives Priya a real answer.' },
  { who: 'Marco (designer)', msgs: ['Honestly I’m a bit lost on what the client actually wants from the dashboard.'],
    opts: [['S', 2, 'Fair, the brief was vague. Want 15 minutes now to list their main questions together?'], ['D', 1, 'Revenue by region. Start there.'], ['R', 0, 'Just make something and we’ll see what they say.']],
    why: 'Offering short, concrete help clears the confusion and keeps Marco engaged.' },
  { who: 'Lena (developer)', msgs: ['I found a bug in the login flow that might delay my part.', 'Not sure how long it’ll take yet.'],
    opts: [['R', 2, 'Thanks for flagging it early. Give it two hours; if it’s not fixed by then, let’s plan a workaround together.'], ['D', 1, 'Make it your top priority today.'], ['A', 0, 'How did this bug get in there in the first place?']],
    why: 'A time-box plus a fallback keeps the schedule safe; looking for blame now slows everyone down.' },
  { who: 'Sam (intern)', msgs: ['Sorry to bother you… I sent the wrong file version to the client yesterday.'],
    opts: [['S', 2, 'Thanks for telling me straight away. Send the right version with a one-line correction, and copy me in.'], ['R', 1, 'I’ll deal with the client myself.'], ['D', 0, 'You need to be more careful with client files.']],
    why: 'Thanking Sam for honesty and giving a clear fix teaches more than taking over or scolding.' },
  { who: 'Jordan (manager)', msgs: ['Quick one: budget review says we’re 15% over on contractor hours.'],
    opts: [['A', 2, 'I’ll break the hours down by task today so we can see where it came from and what to cut.'], ['D', 1, 'We’ll stop all contractor work until next month.'], ['S', 0, 'Everyone has been working really hard, so it’s understandable.']],
    why: 'Understanding the cause first leads to a targeted fix rather than a blunt stop.' },
  { who: 'Priya (project lead)', msgs: ['Marco and Lena disagree on whether to rebuild the charts or patch them.', 'Can you weigh in?'],
    opts: [['A', 2, 'Let’s get both on a 10-minute call with the hours and risk for each option, then decide.'], ['D', 1, 'Patch them. We don’t have time.'], ['S', 0, 'I’d rather not take sides between them.']],
    why: 'Hearing both views with facts gives a decision both people can accept.' },
  { who: 'Lena (developer)', msgs: ['I’ve been working late every night this week. I’m pretty tired.'],
    opts: [['S', 2, 'Thank you for pushing so hard. Let’s move one task off your plate so you can finish on time today.'], ['R', 1, 'Two more days until the demo, then rest properly.'], ['D', 0, 'Everyone is busy right now.']],
    why: 'Acting on the workload, not just sympathising, protects both Lena and the project.' },
  { who: 'Priya (project lead)', msgs: ['The client loved the demo but wants a new feature before launch.'],
    opts: [['A', 2, 'Great news. Let’s estimate it before we commit, then offer them options: now with a later date, or in phase two.'], ['R', 1, 'Let’s say yes and start today.'], ['D', 0, 'No. Scope is closed.']],
    why: 'Giving the client informed options keeps the relationship strong without overpromising.' },
  { who: 'Marco (designer)', msgs: ['I’ve got an idea for a totally new layout. Risky, but it could look amazing.'],
    opts: [['R', 2, 'I like it. Can you mock up one screen by Friday so we can test it without risking launch?'], ['D', 1, 'Not before launch. Put it in the backlog.'], ['S', 0, 'Sounds cool, do whatever you think is best.']],
    why: 'A small, safe test encourages the idea and protects the deadline.' },
  { who: 'Jordan (manager)', msgs: ['Great work on the launch, everyone.', 'Who should I call out in the team update?'],
    opts: [['A', 2, 'Lena for the login fix and Marco for the layout, both specific wins, plus a thank-you to the whole team.'], ['D', 1, 'Just name the whole team.'], ['R', 0, 'Me, I coordinated most of it.']],
    why: 'Specific credit is more meaningful, and including the team keeps it fair.' },
  { who: 'Sam (intern)', msgs: ['Can I ask a dumb question? I don’t understand how the reporting tool works.'],
    opts: [['S', 2, 'Not dumb at all. I’ll show you for 10 minutes after lunch and send you the guide.'], ['D', 1, 'There’s a guide on the wiki.'], ['R', 0, 'I’m slammed, ask someone else.']],
    why: 'A little time now saves many questions later and builds trust.' },
  { who: 'Jordan (manager)', msgs: ['Can you take on the onboarding project as well? It would start next week.'],
    opts: [['A', 2, 'I’d like to. With my current work that’s too much, so could we push the dashboard by a week or move part of it to Sam?'], ['R', 1, 'Sure, I’ll fit it in.'], ['D', 0, 'No, I’m too busy.']],
    why: 'Saying yes with a clear trade-off is honest and keeps quality up.' },
  { who: 'Lena (developer)', msgs: ['Marco keeps changing the designs after I’ve built them. It’s frustrating.'],
    opts: [['S', 2, 'That sounds frustrating. Shall we agree with Marco on a design sign-off before build starts?'], ['D', 1, 'Tell Marco to stop changing them.'], ['R', 0, 'Just build whatever the latest version is.']],
    why: 'Fixing the process prevents the conflict from repeating.' },
  { who: 'Client (via Priya)', msgs: ['The client says the report numbers look wrong and they’re unhappy.'],
    opts: [['A', 2, 'Thanks. I’ll check the numbers against the source data right now and update them within two hours either way.'], ['S', 1, 'I’m so sorry, we’ll fix everything.'], ['D', 0, 'The numbers are right, they must be reading it wrong.']],
    why: 'Taking it seriously and giving a time-bound check rebuilds confidence.' },
  { who: 'Marco (designer)', msgs: ['I missed the deadline for the icons. Family emergency yesterday.'],
    opts: [['S', 2, 'I’m sorry, I hope everyone is OK. Take what you need; I’ll let Priya know and we’ll set a new date when you’re ready.'], ['R', 1, 'No problem, can you send them today?'], ['D', 0, 'You should have told us earlier.']],
    why: 'People first; then make a realistic plan.' },
  { who: 'Priya (project lead)', msgs: ['We need someone to present the results at Monday’s all-hands.'],
    opts: [['R', 2, 'I can do it. I’ll draft slides by Friday and run them past you.'], ['S', 1, 'Maybe Sam would like the experience?'], ['A', 0, 'What exactly would they need to present?']],
    why: 'Volunteering with a clear plan moves things forward. Suggesting Sam can be good too if you offer to support them.' },
  { who: 'Sam (intern)', msgs: ['I finished my tasks early. Anything else I can help with?'],
    opts: [['R', 2, 'Great! Could you test the new export feature and log any bugs you find?'], ['S', 1, 'Nice work, take it easy for the afternoon.'], ['D', 0, 'Not right now.']],
    why: 'A concrete, useful task builds Sam’s skills and helps the team.' },
  { who: 'Jordan (manager)', msgs: ['Leadership wants us to switch to a new project tool next month.', 'Thoughts?'],
    opts: [['A', 2, 'Open to it. Could we pilot it on one project first and list what we’d need to migrate?'], ['R', 1, 'Let’s switch everything over this week.'], ['D', 0, 'The current tool works fine, let’s not.']],
    why: 'A pilot balances openness with managing risk.' },
  { who: 'Lena (developer)', msgs: ['I think there’s a better way to structure the database, but it means redoing some work.'],
    opts: [['A', 2, 'Interesting. Can you write up the benefits and the hours it would take, so we can decide after the release?'], ['R', 1, 'Let’s do it now while it’s fresh.'], ['D', 0, 'No, we don’t have time for redoing work.']],
    why: 'Taking the idea seriously without derailing the release keeps Lena motivated.' },
  { who: 'Priya (project lead)', msgs: ['Retro time! What should we do differently on the next project?'],
    opts: [['S', 2, 'Agree on designs before build, and give clients one clear contact. I’d love to hear what others think too.'], ['A', 1, 'We should track hours more carefully.'], ['D', 0, 'Nothing really, it went fine.']],
    why: 'Specific improvements plus inviting others makes the retro useful.' },
];
IMPL.teamchat = ctx => {
  const STY = { S: 'Supportive', D: 'Direct', A: 'Analytical', R: 'Driving' };
  const tally = { S: 0, D: 0, A: 0, R: 0 }, rts = [], log = [];
  let i = 0, t0, pts = 0;
  ctx.stage.innerHTML = `<div class="chat" id="ch"><div class="msg sys">#project-atlas · You joined the channel</div></div><div class="typing" id="ty"></div><div class="replies" id="rp"></div>`;
  const ch = $('#ch'), ty = $('#ty'), rp = $('#rp');
  ctx.key(e => { if (/^[1-3]$/.test(e.key)) $$('button', rp)[+e.key - 1]?.click(); });
  ctx.score(0);
  const add = (cls, html) => { ch.insertAdjacentHTML('beforeend', `<div class="msg ${cls}">${html}</div>`); ch.scrollTop = ch.scrollHeight; };
  function scene() {
    if (i >= CHAT.length) return ctx.after(600, ctx.finish);
    const s = CHAT[i]; ctx.progress(`${i + 1} / ${CHAT.length}`); ctx.level('Team chat');
    rp.innerHTML = ''; let j = 0;
    const nextMsg = () => {
      if (j >= s.msgs.length) {
        ty.textContent = ''; t0 = performance.now();
        const opts = shuffle(s.opts);
        rp.innerHTML = opts.map((o, n) => `<button data-n="${n}"><span class="mono muted">${n + 1}</span> ${esc(o[2])}</button>`).join('');
        $$('button', rp).forEach(b => b.onclick = () => {
          if (!rp.contains(b)) return;
          const o = opts[+b.dataset.n], top = s.opts.find(x => x[1] === 2);
          tally[o[0]]++; pts += o[1] * 5; rts.push(performance.now() - t0);
          log.push({ prompt: s.msgs[s.msgs.length - 1], mine: o[2], best: top[2], q: o[1], why: s.why });
          ctx.score(pts); add('me', esc(o[2])); rp.innerHTML = ''; i++; ctx.after(700, scene);
        });
        return;
      }
      ty.textContent = s.who.split(' ')[0] + ' is typing…';
      ctx.after(700 + s.msgs[j].length * 12, () => { add('them', `<small>${esc(s.who)}</small>${esc(s.msgs[j++])}`); nextMsg(); });
    };
    nextMsg();
  }
  ctx.hint('Pick the reply you think works best. Every reply is rated; the review at the end shows the strongest one.');
  scene();
  return { result() {
    const tot = Object.values(tally).reduce((a, b) => a + b, 0);
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    const best = log.filter(l => l.q === 2).length;
    return { score: pts, accuracy: tot ? best / tot : null,
      stats: [['Answered', `${tot}/${CHAT.length}`], ['Strongest reply chosen', `${best}/${tot}`], ['Main style', tot ? STY[top[0]] : '–'], ['Median reply time', tot ? (median(rts) / 1000).toFixed(1) + ' s' : '–']],
      profile: Object.entries(STY).map(([k, l]) => ({ label: l, value: tot ? tally[k] / tot * 100 : 0 })),
      note: 'Share of your replies in each style. Supportive: people first. Direct: clear decisions. Analytical: facts first. Driving: momentum first.',
      review: log.map(l => ({ prompt: l.prompt, mine: l.mine, best: l.best, q: l.q, why: l.why })) };
  } };
};
