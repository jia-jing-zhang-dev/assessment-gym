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
  const items = shuffle(PORTRAIT_ITEMS).map(([d, a, b]) => Math.random() < 0.5 ? [d, a, b, 0] : [d, b, a, 1]);
  const score = Object.fromEntries(Object.keys(DIMS).map(d => [d, [0, 0]]));
  let i = 0;
  function show() {
    if (i >= items.length) return ctx.finish();
    const [d, a, b, flip] = items[i];
    ctx.progress(`${i + 1} / ${items.length}`); ctx.level('Work style');
    ctx.stage.innerHTML = `<p class="prompt">Which describes you better?</p><div class="prog"><i style="width:${i / items.length * 100}%"></i></div>
      <div class="pair"><button id="pa"><svg viewBox="0 0 100 100">${ICONS[a[0]]}</svg><span>${a[1]}</span></button><button id="pb"><svg viewBox="0 0 100 100">${ICONS[b[0]]}</svg><span>${b[1]}</span></button></div>`;
    const choose = side => { score[d][side ^ flip]++; i++; show(); };
    $('#pa').onclick = () => choose(0); $('#pb').onclick = () => choose(1);
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
const EMO = ['Happy', 'Sad', 'Angry', 'Surprised', 'Afraid', 'Disgusted', 'Contempt', 'Neutral'];
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
    const opts = shuffle([answer, ...sample(EMO.filter(e => e !== answer), 3)]);
    ctx.level(`Level ${lv}`);
    ctx.stage.innerHTML = `<p class="prompt">Which emotion is this?</p>${faceSVG(answer, k, pick(SKIN), pick(HAIR))}<div class="opts">${opts.map((o, i) => `<button data-o="${o}"><span class="mono muted">${i + 1}</span> ${o}</button>`).join('')}</div>`;
    t0 = performance.now();
    $$('.opts button', ctx.stage).forEach(b => b.onclick = () => choose(b));
  }
  function choose(b) {
    if (lock) return; lock = true; rts.push(performance.now() - t0);
    if (b.dataset.o === answer) { ok++; pts += lv; b.classList.add('right'); ctx.flash('ok', 'Correct'); if (++streak >= 3) { lv++; streak = 0; } }
    else { bad++; streak = 0; b.classList.add('wrong'); $(`.opts button[data-o="${answer}"]`, ctx.stage).classList.add('right'); confus[answer] = (confus[answer] || 0) + 1; ctx.flash('bad', 'It was ' + answer.toLowerCase()); lv = Math.max(1, lv - 1); }
    ctx.score(pts); ctx.after(900, show);
  }
  ctx.key(e => { if (/^[1-4]$/.test(e.key)) $$('.opts button', ctx.stage)[+e.key - 1]?.click(); });
  ctx.hint('Keyboard: 1–4');
  ctx.score(0); show();
  return { result() {
    const t = ok + bad, worst = Object.entries(confus).sort((a, b) => b[1] - a[1])[0];
    return { score: pts, accuracy: t ? ok / t : null, stats: [['Faces', t], ['Correct', ok], ['Highest level', lv], ['Median response', ms(median(rts))], ['Most missed', worst ? worst[0] : '–']] };
  } };
};

/* ---------- Teamchat ---------- */
const CHAT = [
  { who: 'Priya (project lead)', msgs: ['Morning! The client moved the demo to Thursday instead of next week.', 'Can we still make it?'],
    opts: [['S', 'That’s a big change. How is everyone feeling about the new date?'], ['D', 'Yes, if we cut the export feature from the demo. I’ll tell the team.'], ['A', 'Let me check the remaining tasks against the hours we have and get back to you within the hour.'], ['R', 'Let’s go for it. I’ll set up a stand-up for 10 to re-plan.']] },
  { who: 'Marco (designer)', msgs: ['Honestly I’m a bit lost on what the client actually wants from the dashboard.'],
    opts: [['S', 'Totally fair, the brief was vague. Want to talk it through together?'], ['A', 'Let’s list their three main questions from the brief and map each one to a chart.'], ['D', 'They want revenue by region up front. Start there.'], ['R', 'Make a rough version today and we’ll get feedback from them tomorrow.']] },
  { who: 'Lena (developer)', msgs: ['I found a bug in the login flow that might delay my part.', 'Not sure how long it’ll take yet.'],
    opts: [['A', 'Can you share the error log? I want to see whether it blocks the demo path.'], ['S', 'Thanks for flagging it early. Shout if you want a second pair of eyes.'], ['R', 'Timebox it to two hours. If it’s not fixed by then we’ll work around it.'], ['D', 'Please make this the top priority over everything else today.']] },
  { who: 'Sam (intern)', msgs: ['Sorry to bother you… I sent the wrong file version to the client yesterday.'],
    opts: [['S', 'Don’t worry, it happens. Let’s fix it together. What did they receive?'], ['D', 'Send the right version now with a short correction note, then let me know.'], ['A', 'Which version did they get? Let’s check what differs before we reply.'], ['R', 'I’ll call them now and sort it. You prep the right file.']] },
  { who: 'Jordan (manager)', msgs: ['Quick one: the budget review flagged that we’re 15% over on contractor hours.'],
    opts: [['A', 'I’ll pull the hours by task so we can see where the overrun came from.'], ['D', 'Understood. We’ll stop new contractor work until next month.'], ['S', 'Let me talk to the contractors first; they may not know they’re over.'], ['R', 'Let’s cut scope on the low-value tasks this week and get back on track.']] },
  { who: 'Priya (project lead)', msgs: ['Marco and Lena disagree on whether to rebuild the charts or patch them.', 'Can you weigh in?'],
    opts: [['S', 'Let’s get them both on a call so each can explain their view.'], ['A', 'What does each option cost in hours, and what’s the risk for Thursday?'], ['D', 'Patch them for Thursday. Rebuild after the demo.'], ['R', 'Whoever can ship by Wednesday noon wins. Let’s decide in 10 minutes.']] },
  { who: 'Lena (developer)', msgs: ['I’ve been working late every night this week. I’m pretty tired.'],
    opts: [['S', 'Thank you for pushing so hard. Please log off early today; I’ll cover the review.'], ['D', 'Let’s move one of your tasks to me so you can stop by 6.'], ['A', 'Let’s look at what’s taking the most time so we can fix the workload, not just this week.'], ['R', 'Two more days and we’re through the demo. Then take a proper break.']] },
  { who: 'Client (via Priya)', msgs: ['The client loved the demo but wants a new feature added before launch.'],
    opts: [['A', 'Let’s estimate it properly before we commit to anything.'], ['D', 'We should say no for launch and offer it in phase two.'], ['S', 'Great news! Let’s ask the team how they feel about taking it on.'], ['R', 'Let’s say yes and start scoping it today.']] },
  { who: 'Marco (designer)', msgs: ['I’ve got an idea for a totally new layout. It’s risky but could look amazing.'],
    opts: [['R', 'Love it. Build a quick prototype and let’s see.'], ['A', 'What problem does it solve that the current layout doesn’t?'], ['S', 'Sounds exciting! Want to show me a sketch first?'], ['D', 'Not before launch. Park it in the backlog.']] },
  { who: 'Jordan (manager)', msgs: ['Great work on the launch, everyone.', 'Who should I call out in the team update?'],
    opts: [['S', 'Lena carried a lot this month; she deserves the shout-out.'], ['D', 'The whole team. Name everyone.'], ['A', 'Lena for the login fix and Marco for the layout; both moved the numbers.'], ['R', 'Everyone, plus a note about what we’re tackling next.']] },
];
IMPL.teamchat = ctx => {
  const STY = { S: 'Supportive', D: 'Direct', A: 'Analytical', R: 'Driving' };
  const tally = { S: 0, D: 0, A: 0, R: 0 }, rts = [];
  let i = 0, t0;
  ctx.stage.innerHTML = `<div class="chat" id="ch"><div class="msg sys">#project-atlas · You joined the channel</div></div><div class="typing" id="ty"></div><div class="replies" id="rp"></div>`;
  const ch = $('#ch'), ty = $('#ty'), rp = $('#rp');
  const add = (cls, html) => { ch.insertAdjacentHTML('beforeend', `<div class="msg ${cls}">${html}</div>`); ch.scrollTop = ch.scrollHeight; };
  function scene() {
    if (i >= CHAT.length) return ctx.after(600, ctx.finish);
    const s = CHAT[i]; ctx.progress(`${i + 1} / ${CHAT.length}`); ctx.level('Team chat');
    rp.innerHTML = ''; let j = 0;
    const nextMsg = () => {
      if (j >= s.msgs.length) {
        ty.textContent = ''; t0 = performance.now();
        rp.innerHTML = shuffle(s.opts).map(([k, t]) => `<button data-k="${k}">${esc(t)}</button>`).join('');
        $$('button', rp).forEach(b => b.onclick = () => { if (!rp.contains(b)) return; tally[b.dataset.k]++; rts.push(performance.now() - t0); add('me', esc(b.textContent)); rp.innerHTML = ''; i++; ctx.after(700, scene); });
        return;
      }
      ty.textContent = s.who.split(' ')[0] + ' is typing…';
      ctx.after(700 + s.msgs[j].length * 12, () => { add('them', `<small>${esc(s.who)}</small>${esc(s.msgs[j++])}`); nextMsg(); });
    };
    nextMsg();
  }
  ctx.hint('Pick the reply closest to what you would actually send.');
  scene();
  return { result() {
    const tot = Object.values(tally).reduce((a, b) => a + b, 0);
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return { stats: [['Answered', `${tot}/${CHAT.length}`], ['Strongest style', tot ? STY[top[0]] : '–'], ['Median reply time', tot ? (median(rts) / 1000).toFixed(1) + ' s' : '–']],
      profile: Object.entries(STY).map(([k, l]) => ({ label: l, value: tot ? tally[k] / tot * 100 : 0 })),
      note: 'Share of your replies in each style. Supportive: people first. Direct: clear decisions. Analytical: facts first. Driving: momentum first.' };
  } };
};
