'use strict';
/* Cognitive and spatial games. Each returns { result() } and drives ctx. */

/* ---------- Flashback (n-back) ---------- */
IMPL.flashback = ctx => {
  const LV = [{ n: 1, c: 0 }, { n: 2, c: 0 }, { n: 3, c: 0 }, { n: 1, c: 1 }, { n: 2, c: 1 }, { n: 3, c: 1 }];
  const SH = Object.keys(SHAPES), CO = STIM.slice(0, 4);
  let li = 0, maxLi = 0, seq = [], bOk = 0, bN = 0, answered = true, can = false, t0 = 0, pts = 0;
  const st = { hit: 0, cr: 0, miss: 0, fa: 0, slow: 0 }, rts = [];
  ctx.stage.innerHTML = `<p class="prompt" id="fq">Get ready</p><div class="stim-card blank" id="fc"></div>
    <div class="btnrow"><button class="btn yes" id="fy">Match <kbd>←</kbd></button><button class="btn no" id="fn">No match <kbd>→</kbd></button></div>`;
  ctx.hint('Keyboard: ← Match · → No match. On touch screens, swipe the card left or right.');
  const q = $('#fq'), card = $('#fc'), by = $('#fy'), bn = $('#fn');
  const L = () => LV[li];
  const label = () => `${L().n}-back · ${L().c ? 'shape + colour' : 'shape only'}`;
  const same = (a, b) => a.s === b.s && (!L().c || a.c === b.c);
  function gen() {
    const l = L(), k = seq.length, back = seq[k - l.n];
    if (back && Math.random() < 0.35) return { ...back };
    if (back && l.c && Math.random() < 0.3) { let c; do c = pick(CO); while (c === back.c); return { s: back.s, c }; }
    let it; do it = { s: pick(SH), c: l.c ? pick(CO) : 'var(--ink)' }; while (back && same(it, back));
    return it;
  }
  function setLevel(dir) { ctx.level(label(), dir); seq = []; bOk = 0; bN = 0; }
  function inter(title) {
    by.disabled = bn.disabled = true; q.textContent = 'New rule';
    card.classList.remove('blank'); card.innerHTML = `<div class="inter"><b>${title}</b><span>${label()}</span></div>`;
    ctx.after(1900, next);
  }
  function next() {
    const l = L(), it = gen(); seq.push(it);
    can = seq.length > l.n;
    q.textContent = can ? `Does this match the one ${l.n} back?` : 'Remember this shape';
    card.classList.remove('blank'); card.innerHTML = shapeSVG(it.s, it.c, 130);
    by.disabled = bn.disabled = !can; answered = !can; t0 = performance.now();
    ctx.after(can ? 2000 : 1500, () => {
      card.classList.add('blank'); card.innerHTML = '';
      ctx.after(can ? 700 : 450, () => {
        if (!answered) { answered = true; st.slow++; bN++; ctx.flash('slow', 'Too slow'); }
        if (bN >= 10) {
          const acc = bOk / bN;
          if (acc >= 0.8 && li < LV.length - 1) { li++; maxLi = Math.max(maxLi, li); setLevel('up'); return inter('Level up'); }
          if (acc < 0.5 && li > 0) { li--; setLevel('down'); return inter('Level down'); }
          bOk = 0; bN = 0;
        }
        next();
      });
    });
  }
  function answer(m) {
    if (answered || !can) return; answered = true;
    const l = L(), k = seq.length, isM = same(seq[k - 1], seq[k - 1 - l.n]);
    rts.push(performance.now() - t0); bN++;
    if (m === isM) { bOk++; pts += l.n + l.c; isM ? st.hit++ : st.cr++; ctx.flash('ok', 'Correct'); }
    else { isM ? st.miss++ : st.fa++; ctx.flash('bad', 'Incorrect'); }
    ctx.score(pts);
  }
  by.onclick = () => answer(true); bn.onclick = () => answer(false);
  // touch: swipe the card left for Match, right for No match (same sides as the arrow keys)
  let sx = null;
  card.addEventListener('pointerdown', e => { sx = e.clientX; });
  card.addEventListener('pointerup', e => {
    if (sx == null) return; const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) < 40) return;
    card.style.setProperty('--swipe', dx < 0 ? '-24px' : '24px'); card.classList.remove('swiped'); void card.offsetWidth; card.classList.add('swiped');
    answer(dx < 0);
  });
  card.addEventListener('pointercancel', () => { sx = null; });
  ctx.key(e => { if (e.key === 'ArrowLeft') answer(true); else if (e.key === 'ArrowRight') answer(false); });
  setLevel(); ctx.score(0); ctx.after(900, next);
  return { result() {
    const tot = st.hit + st.cr + st.miss + st.fa + st.slow;
    return { score: pts, accuracy: tot ? (st.hit + st.cr) / tot : null, stats: [
      ['Highest rule', `${LV[maxLi].n}-back${LV[maxLi].c ? ' + colour' : ''}`], ['Correct matches', st.hit], ['Correct rejections', st.cr],
      ['Missed matches', st.miss], ['False alarms', st.fa], ['Too slow', st.slow], ['Median reaction', ms(median(rts))]] };
  } };
};

/* ---------- Numerosity ---------- */
IMPL.numerosity = ctx => {
  let lv = 1, maxLv = 1, streak = 0, misses = 0, pts = 0, ok = 0, bad = 0, skips = 0, tiles = [], sel = new Set(), k = 2, type = 'sum', target = 0, t0 = 0, lock = false;
  const rts = [];
  ctx.stage.innerHTML = `<p class="prompt" id="nq"></p><div class="tiles" id="nt"></div><p class="calc" id="nc"></p>
    <div class="btnrow"><button class="btn ghost" id="nclr">Clear</button><button class="btn ghost" id="nskip">Skip</button></div>`;
  ctx.hint('Tap bubbles to select. Your answer is checked when you reach the required count.');
  // operator unlocks with level: + first, then −, ×, ÷ (difference and quotient accept either order)
  const OPS = {
    sum: { sym: '+', verb: n => `add up to`, val: v => v.reduce((a, b) => a + b, 0) },
    diff: { sym: '−', verb: () => `have a difference of`, val: v => Math.abs(v[0] - v[1]) },
    product: { sym: '×', verb: () => `multiply to`, val: v => v.reduce((a, b) => a * b, 1) },
    quot: { sym: '÷', verb: () => `divide to give`, val: v => Math.max(...v) / Math.min(...v) },
  };
  function puzzle() {
    const n = Math.min(6 + lv, 12), hi = 9 + lv * 3;
    const pool = ['sum', ...(lv >= 2 ? ['diff'] : []), ...(lv >= 4 ? ['product'] : []), ...(lv >= 5 ? ['quot'] : [])];
    type = pick(pool);
    k = type === 'sum' ? (lv < 3 ? 2 : lv < 6 ? 3 : 4) : 2;
    tiles = Array.from({ length: n }, () => type === 'product' || type === 'quot' ? 2 + rnd(11) : 1 + rnd(hi));
    let idx = sample([...tiles.keys()], k);
    if (type === 'quot') { const b = tiles[idx[0]]; tiles[idx[1]] = b * (2 + rnd(6)); }
    if (type === 'diff' && tiles[idx[0]] === tiles[idx[1]]) tiles[idx[1]] += 1 + rnd(5);
    target = OPS[type].val(idx.map(i => tiles[i]));
    sel = new Set(); lock = false; t0 = performance.now();
    ctx.level(`Level ${lv} · ${OPS[type].sym}`);
    $('#nq').innerHTML = `<span class="chip acc" style="margin-right:8px">${OPS[type].sym}</span>Select <b>${k}</b> numbers that ${OPS[type].verb()} <b class="mono">${target}</b>`;
    $('#nt').innerHTML = tiles.map((v, i) => `<button class="tile" data-i="${i}">${v}</button>`).join('');
    $$('#nt .tile').forEach(b => b.onclick = () => toggle(+b.dataset.i, b));
    calc();
  }
  function calc() {
    const v = [...sel].map(i => tiles[i]);
    $('#nc').textContent = v.length ? v.join(` ${OPS[type].sym} `) + (v.length === k ? ' = ' + +OPS[type].val(v).toFixed(2) : '') : `${k} to pick`;
  }
  function toggle(i, b) {
    if (lock) return;
    sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel'); calc();
    if (sel.size === k) { lock = true; ctx.after(220, check); }
  }
  function check() {
    const val = +OPS[type].val([...sel].map(i => tiles[i])).toFixed(2);
    rts.push(performance.now() - t0);
    if (val === target) { ok++; pts += k * lv; streak++; misses = 0; ctx.flash('ok', 'Correct'); if (streak >= 2) { lv++; maxLv = Math.max(maxLv, lv); streak = 0; } }
    else { bad++; streak = 0; misses++; ctx.flash('bad', `${val} ≠ ${target}`); if (misses >= 2) { lv = Math.max(1, lv - 1); misses = 0; } }
    ctx.score(pts); ctx.after(450, puzzle);
  }
  $('#nclr').onclick = () => { if (lock) return; sel.clear(); $$('#nt .tile').forEach(b => b.classList.remove('sel')); calc(); };
  $('#nskip').onclick = () => { if (lock) return; skips++; puzzle(); };
  ctx.score(0); puzzle();
  return { result() { const t = ok + bad; return { score: pts, accuracy: t ? ok / t : null, stats: [['Highest level', maxLv], ['Solved', ok], ['Wrong', bad], ['Skipped', skips], ['Median solve time', ms(median(rts))]] }; } };
};

/* ---------- Pathfinder ---------- */
IMPL.pathfinder = ctx => {
  const D = [[-1, 0, 1], [0, 1, 2], [1, 0, 4], [0, -1, 8]], OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
  const TYPES = [3, 5, 6, 9, 10, 12];
  let lv = 1, maxLv = 1, pts = 0, solved = 0, skips = 0, N, sr, er, cells, tray, sel = null, path, t0;
  const times = [];
  const tileSVG = m => `<svg viewBox="0 0 100 100" aria-hidden="true">${m & 1 ? '<path class="pipe" d="M50 50V0"/>' : ''}${m & 2 ? '<path class="pipe" d="M50 50H100"/>' : ''}${m & 4 ? '<path class="pipe" d="M50 50V100"/>' : ''}${m & 8 ? '<path class="pipe" d="M50 50H0"/>' : ''}<circle class="pipe-c" cx="50" cy="50" r="11"/></svg>`;
  function genPath() {
    for (;;) {
      const s = rnd(N), vis = new Set(), p = [];
      const dfs = (r, c) => {
        vis.add(r * N + c); p.push([r, c]);
        if (c === N - 1 && (p.length >= N + 2 || Math.random() < 0.35)) return true;
        if (p.length < N * N * 0.7) for (const d of shuffle(D)) { const nr = r + d[0], nc = c + d[1]; if (nr >= 0 && nr < N && nc >= 0 && nc < N && !vis.has(nr * N + nc) && dfs(nr, nc)) return true; }
        p.pop(); return false;
      };
      if (dfs(s, 0)) return p;
    }
  }
  const dirBit = (a, b) => D.find(d => a[0] + d[0] === b[0] && a[1] + d[1] === b[1])[2];
  function puzzle() {
    N = lv <= 2 ? 4 : lv <= 4 ? 5 : 6;
    path = genPath(); sr = path[0][0]; er = path[path.length - 1][0];
    cells = Array(N * N).fill(null); tray = [];
    const lockP = Math.max(0.15, 0.5 - lv * 0.06);
    path.forEach((p, i) => {
      const m = (i === 0 ? 8 : dirBit(p, path[i - 1])) | (i === path.length - 1 ? 2 : dirBit(p, path[i + 1]));
      if (Math.random() < lockP && i !== 0) cells[p[0] * N + p[1]] = { m, locked: true }; else tray.push(m);
    });
    for (let i = 0; i < 2; i++) tray.push(pick(TYPES));
    tray = shuffle(tray); sel = null; t0 = performance.now();
    ctx.level(`Level ${lv} · ${N}×${N}`); draw();
  }
  function connected() {
    let r = sr, c = 0, from = 8;
    for (let s = 0; s <= N * N; s++) {
      const t = cells[r * N + c]; if (!t || !(t.m & from)) return false;
      const out = t.m & ~from;
      if (c === N - 1 && out === 2 && r === er) return true;
      const d = D.find(d => d[2] === out); if (!d) return false;
      r += d[0]; c += d[1]; if (r < 0 || r >= N || c < 0 || c >= N) return false; from = OPP[out];
    }
    return false;
  }
  function draw(done = false) {
    const cs = Math.min(64, Math.floor((Math.min(window.innerWidth, 860) - 70) / (N + 2)));
    let g = `<div class="pf ${done ? 'solved' : ''}" style="--cs:${cs}px;grid-template-columns:repeat(${N + 2},var(--cs))">`;
    for (let r = 0; r < N; r++) {
      g += `<div class="mark">${r === sr ? 'IN →' : ''}</div>`;
      for (let c = 0; c < N; c++) { const t = cells[r * N + c]; g += `<div class="cell ${t ? (t.locked ? 'locked' : 'placed') : 'empty'}" data-i="${r * N + c}">${t ? tileSVG(t.m) : ''}</div>`; }
      g += `<div class="mark">${r === er ? '→ OUT' : ''}</div>`;
    }
    ctx.stage.innerHTML = g + `</div><div class="tray">${tray.map((m, i) => `<button data-t="${i}" class="${sel === i ? 'sel' : ''}" aria-label="Tile">${tileSVG(m)}</button>`).join('')}</div>
      <div class="btnrow"><button class="btn ghost" id="pskip">Skip (grid gets easier)</button></div>`;
    if (done) return;
    $$('.tray button', ctx.stage).forEach(b => b.onclick = () => { sel = sel === +b.dataset.t ? null : +b.dataset.t; draw(); });
    $$('.pf .cell', ctx.stage).forEach(el => el.onclick = () => {
      const i = +el.dataset.i, t = cells[i];
      if (t && t.locked) return;
      if (t) { tray.push(t.m); cells[i] = null; draw(); return; }
      if (sel == null) { ctx.flash('info', 'Pick a tile from the tray first'); return; }
      cells[i] = { m: tray[sel] }; tray.splice(sel, 1); sel = null;
      if (connected()) {
        solved++; pts += path.length + lv; times.push(performance.now() - t0); ctx.score(pts); ctx.flash('ok', 'Path connected');
        draw(true); lv++; maxLv = Math.max(maxLv, lv); ctx.after(900, puzzle);
      } else draw();
    });
    $('#pskip').onclick = () => { skips++; lv = Math.max(1, lv - 1); puzzle(); };
  }
  ctx.hint('Tap a tray tile, then an empty cell. Tap a placed tile to return it.');
  ctx.score(0); puzzle();
  return { result() { return { score: pts, accuracy: null, stats: [['Paths solved', solved], ['Highest level', maxLv], ['Skipped', skips], ['Median solve time', times.length ? (median(times) / 1000).toFixed(1) + ' s' : '–']] }; } };
};

/* ---------- Digitspan ---------- */
IMPL.digitspan = ctx => {
  const LET = 'ACFHKMPT';
  let len = 3, maxLen = 3, wrongRow = 0, pts = 0, ok = 0, bad = 0, seq = [], input = '', phase = 'show', useLetters = false, back = false, backOk = 0, backN = 0;
  function round() {
    useLetters = len >= 5;
    back = len >= 5 && Math.random() < 0.35;
    seq = Array.from({ length: len }, () => useLetters && Math.random() < 0.4 ? pick(LET) : String(rnd(10)));
    for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) seq[i] = /\d/.test(seq[i]) ? String((+seq[i] + 1) % 10) : LET[(LET.indexOf(seq[i]) + 1) % LET.length];
    ctx.level(`Span ${len}${useLetters ? ' · digits + letters' : ''}${back ? ' · backwards' : ''}`);
    phase = 'show'; input = '';
    ctx.stage.innerHTML = `<p class="prompt">${back ? 'Memorise it. You will type this one <b>backwards</b>' : 'Memorise the sequence'}</p><div class="bigchar mono" id="dc"></div>`;
    let i = 0;
    const step = () => {
      if (i >= seq.length) return ctx.after(400, entry);
      $('#dc').textContent = seq[i++];
      ctx.after(850, () => { $('#dc').textContent = ''; ctx.after(250, step); });
    };
    ctx.after(500, step);
  }
  function entry() {
    phase = 'input';
    const keys = [...'1234567890', ...(useLetters ? LET : '')];
    ctx.stage.innerHTML = `<p class="prompt">${back ? 'Enter the sequence <b>last to first</b>' : 'Enter the sequence in order'}</p><div class="slots" id="ds"></div>
      <div class="keypad">${keys.map(k => `<button data-k="${k}">${k}</button>`).join('')}<button data-k="del" aria-label="Delete">⌫</button></div>
      <div class="btnrow"><button class="btn" id="dsub">Submit</button></div>`;
    $$('.keypad button', ctx.stage).forEach(b => b.onclick = () => press(b.dataset.k));
    $('#dsub').onclick = submit; paint();
  }
  function paint() { $('#ds').innerHTML = Array.from({ length: seq.length }, (_, i) => `<span class="${input[i] ? 'f' : ''}">${input[i] || ''}</span>`).join(''); }
  function press(k) { if (phase !== 'input') return; if (k === 'del') input = input.slice(0, -1); else if (input.length < seq.length) input += k; paint(); }
  function submit() {
    if (phase !== 'input') return; phase = 'wait';
    const want = back ? seq.slice().reverse() : seq;
    if (back) backN++;
    if (input === want.join('')) { ok++; if (back) backOk++; pts += len + (back ? 2 : 0); ctx.flash('ok', 'Correct'); len++; maxLen = Math.max(maxLen, len - 1); wrongRow = 0; }
    else { bad++; ctx.flash('bad', 'Answer: ' + want.join(' '), 1400); if (++wrongRow >= 2) { len = Math.max(3, len - 1); wrongRow = 0; } }
    ctx.score(pts); ctx.after(1300, round);
  }
  ctx.key(e => {
    if (phase !== 'input') return;
    const k = e.key.toUpperCase();
    if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter') submit();
    else if (/^[0-9]$/.test(k) || (useLetters && LET.includes(k) && k.length === 1)) press(k);
  });
  ctx.hint('Keyboard: type characters, Backspace to correct, Enter to submit.');
  ctx.score(0); round();
  return { result() { const t = ok + bad; return { score: pts, accuracy: t ? ok / t : null, stats: [['Longest span', maxLen], ['Correct sequences', ok], ['Wrong sequences', bad], ['Backwards correct', `${backOk}/${backN}`]] }; } };
};

/* ---------- Disconumbers ---------- */
IMPL.disconumbers = ctx => {
  let len = 3, maxLen = 3, pts = 0, orderOk = 0, sumOk = 0, rounds = 0, nums = [], seq = [], clicks = [], phase = 'show', G = 3;
  function round() {
    G = len >= 6 ? 4 : 3; rounds++;
    const hidden = len >= 5, hi = len >= 7 ? 19 : len >= 5 ? 14 : 9;
    nums = Array.from({ length: G * G }, () => 1 + rnd(hi));
    seq = sample([...nums.keys()], len); clicks = []; phase = 'show';
    ctx.level(`${len} circles${hidden ? ' · numbers hidden' : ''}`);
    ctx.stage.innerHTML = `<p class="prompt" id="dq">${hidden ? 'Watch the order. Numbers show only while lit' : 'Watch the order'}</p><div class="disc" style="grid-template-columns:repeat(${G},auto)">${nums.map((n, i) => `<button data-i="${i}" disabled>${hidden ? '' : n}</button>`).join('')}</div><div id="dsum"></div>`;
    const btns = $$('.disc button', ctx.stage);
    btns.forEach(b => b.onclick = () => tap(+b.dataset.i, b));
    let i = 0;
    const step = () => {
      if (i >= seq.length) { phase = 'order'; $('#dq').textContent = 'Tap the circles in the same order'; btns.forEach(b => b.disabled = false); return; }
      const b = btns[seq[i++]]; b.classList.add('lit'); if (hidden) b.textContent = nums[+b.dataset.i];
      ctx.after(650, () => { b.classList.remove('lit'); if (hidden) b.textContent = ''; ctx.after(250, step); });
    };
    ctx.after(600, step);
  }
  function tap(i, b) {
    if (phase !== 'order' || clicks.includes(i)) return;
    clicks.push(i); b.classList.add('picked');
    if (clicks.length === seq.length) {
      phase = 'sum';
      const right = clicks.every((c, j) => c === seq[j]);
      if (right) { orderOk++; pts += len; ctx.flash('ok', 'Order correct'); } else ctx.flash('bad', 'Order incorrect');
      ctx.score(pts);
      $$('.disc button', ctx.stage).forEach(x => x.disabled = true);
      const sum = seq.reduce((s, j) => s + nums[j], 0);
      const opts = new Set([sum]); while (opts.size < 4) { const d = sum + (rnd(2) ? 1 : -1) * (1 + rnd(5)); if (d > 0) opts.add(d); }
      $('#dq').textContent = 'What was the sum of the lit numbers?';
      $('#dsum').innerHTML = `<div class="opts">${shuffle([...opts]).map(o => `<button data-v="${o}" class="mono">${o}</button>`).join('')}</div>`;
      $$('#dsum button').forEach(x => x.onclick = () => {
        if (phase !== 'sum') return; phase = 'wait';
        const good = +x.dataset.v === sum;
        x.classList.add(good ? 'right' : 'wrong');
        if (good) { sumOk++; pts += len; ctx.flash('ok', 'Sum correct'); } else ctx.flash('bad', 'The sum was ' + sum, 1100);
        ctx.score(pts);
        if (good && right) { len++; maxLen = Math.max(maxLen, len); } else if (!good && !right) len = Math.max(3, len - 1);
        ctx.after(1100, round);
      });
    }
  }
  ctx.score(0); round();
  return { result() { const t = rounds * 2; return { score: pts, accuracy: t ? (orderOk + sumOk) / t : null, stats: [['Longest sequence', maxLen], ['Orders correct', `${orderOk}/${rounds}`], ['Sums correct', `${sumOk}/${rounds}`]] }; } };
};

/* ---------- Puzzle ---------- */
IMPL.puzzle = ctx => {
  let lv = 1, pts = 0, perfect = 0, placedOk = 0, placedAll = 0, rounds = 0, G, img, board, tray, sel = null;
  function makeImage() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 360; const g = cv.getContext('2d');
    const h0 = rnd(360), gr = g.createLinearGradient(0, 0, 360, 360);
    gr.addColorStop(0, `hsl(${h0} 65% 62%)`); gr.addColorStop(1, `hsl(${(h0 + 90) % 360} 60% 38%)`);
    g.fillStyle = gr; g.fillRect(0, 0, 360, 360);
    for (let i = 0; i < 3; i++) { g.fillStyle = `hsla(${rnd(360)} 70% 85% / .5)`; g.fillRect(0, rnd(360), 360, 10 + rnd(20)); }
    for (let i = 0; i < 11; i++) {
      g.fillStyle = `hsl(${rnd(360)} ${55 + rnd(35)}% ${30 + rnd(45)}%)`;
      const x = rnd(360), y = rnd(360), s = 40 + rnd(100); g.beginPath();
      const t = rnd(4);
      if (t === 0) g.arc(x, y, s / 2, 0, Math.PI * 2);
      else if (t === 1) g.rect(x - s / 2, y - s / 3, s, s * 0.66);
      else if (t === 2) { g.moveTo(x, y - s / 2); g.lineTo(x + s / 2, y + s / 2); g.lineTo(x - s / 2, y + s / 2); }
      else { g.lineWidth = 10; g.strokeStyle = g.fillStyle; g.arc(x, y, s / 2, 0, Math.PI * 1.3); g.stroke(); continue; }
      g.fill();
    }
    return cv.toDataURL('image/png');
  }
  const piece = (i, size) => { const r = Math.floor(i / G), c = i % G; return `background-image:var(--img);background-size:${G * size}px ${G * size}px;background-position:-${c * size}px -${r * size}px`; };
  let building = false, moves = 0;
  function round() {
    G = lv <= 2 ? 3 : lv <= 4 ? 4 : 5; rounds++; moves = 0;
    img = makeImage(); sel = null; building = false;
    do board = shuffle([...Array(G * G).keys()]); while (board.every((p, i) => p === i));
    ctx.level(`Level ${lv} · ${G}×${G}`);
    ctx.stage.style.setProperty('--img', `url(${img})`);
    let left = 5;
    ctx.stage.innerHTML = `<p class="prompt">Memorise this image · <span class="mono" id="pc">${left}</span>s</p><div class="pzimg" style="background-image:var(--img)"></div><div class="btnrow"><button class="btn" id="pgo">I’m ready</button></div>`;
    $('#pgo').onclick = build;
    const tick = () => { if (!$('#pc')) return; left--; if (left <= 0) return build(); $('#pc').textContent = left; ctx.after(1000, tick); };
    ctx.after(1000, tick);
  }
  function build() { if (building) return; building = true; draw(); }
  function draw() {
    const ps = Math.floor(Math.min(320, window.innerWidth - 60) / G);
    ctx.stage.innerHTML = `<p class="prompt">Swap tiles to rebuild the image · <span class="mono">${moves}</span> swaps</p>
      <div class="pzboard" style="--ps:${ps}px;grid-template-columns:repeat(${G},var(--ps))">${board.map((p, i) => `<div data-s="${i}" tabindex="0" role="button" aria-label="Tile ${i + 1}" style="${piece(p, ps)}${sel === i ? ';outline:3px solid var(--signal);outline-offset:-3px' : ''}"></div>`).join('')}</div>
      <div class="btnrow"><button class="btn ghost" id="pchk">Submit as is</button></div>`;
    $$('.pzboard div', ctx.stage).forEach(d => {
      const go = () => {
        const s = +d.dataset.s;
        if (sel == null) { sel = s; return draw(); }
        if (sel !== s) { [board[sel], board[s]] = [board[s], board[sel]]; moves++; }
        sel = null;
        if (board.every((p, i) => p === i)) return check();
        draw();
      };
      d.onclick = go; d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') go(); };
    });
    $('#pchk').onclick = check;
  }
  function check() {
    if (!building) return;
    const right = board.filter((p, i) => p === i).length, n = G * G;
    placedOk += right; placedAll += n;
    if (right === n) { perfect++; pts += n + G * 2; lv++; ctx.flash('ok', `Solved in ${moves} swaps`); }
    else { pts += Math.floor(right / 2); ctx.flash('bad', `${right} of ${n} tiles in place`, 1200); }
    ctx.score(pts);
    draw(); building = false;
    $$('.pzboard div', ctx.stage).forEach((d, i) => { d.onclick = null; d.onkeydown = null; d.style.outline = board[i] === i ? '3px solid var(--ok)' : '3px solid var(--bad)'; d.style.outlineOffset = '-3px'; });
    $('#pchk').disabled = true;
    ctx.after(1500, round);
  }
  ctx.hint('Tap one tile, then another, to swap them. A finished image submits itself.');
  ctx.score(0); round();
  return { result() { return { score: pts, accuracy: placedAll ? placedOk / placedAll : null, stats: [['Images attempted', rounds], ['Solved', perfect], ['Tiles in place', `${placedOk}/${placedAll}`], ['Highest level', lv]] }; } };
};

/* ---------- Shapedance ---------- */
IMPL.shapedance = ctx => {
  const SH = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'], CO = STIM.slice(0, 4), FI = ['solid', 'outline', 'striped'];
  let lv = 1, pts = 0, hits = 0, fas = 0, misses = 0, perfect = 0, rounds = 0, items = [], sel = new Set(), tgt, lock = false;
  const eq = (a, b) => a.s === b.s && a.c === b.c && a.f === b.f;
  function round() {
    rounds++; lock = false; sel = new Set();
    const useFill = lv >= 3, n = [9, 12, 16, 20][Math.min(lv - 1, 3)], k = 2 + rnd(3);
    tgt = { s: pick(SH), c: pick(CO), f: useFill ? pick(FI) : 'solid' };
    items = Array.from({ length: k }, () => ({ ...tgt }));
    while (items.length < n) {
      let it;
      do {
        it = { ...tgt };
        const lure = Math.random() < 0.65;
        if (lure) { const which = pick(useFill ? ['s', 'c', 'f'] : ['s', 'c']); if (which === 's') it.s = pick(SH); else if (which === 'c') it.c = pick(CO); else it.f = pick(FI); }
        else it = { s: pick(SH), c: pick(CO), f: useFill ? pick(FI) : 'solid' };
      } while (eq(it, tgt));
      items.push(it);
    }
    items = shuffle(items);
    const spin = lv >= 5;
    items.forEach(it => it.r = spin ? 90 * rnd(4) : 0);
    ctx.level(`Level ${lv}${useFill ? ' · fill counts' : ''}${spin ? ' · rotated' : ''}`);
    const cols = n <= 9 ? 3 : 4, gs = Math.min(84, Math.floor((Math.min(window.innerWidth, 860) - 80) / cols) - 10);
    ctx.stage.innerHTML = `<div class="target"><span class="small muted">Find every</span>${shapeSVG(tgt.s, tgt.c, 54, tgt.f)}${spin ? '<span class="small muted">Rotated copies count</span>' : ''}</div>
      <div class="sgrid" style="--gs:${gs}px;grid-template-columns:repeat(${cols},var(--gs))">${items.map((it, i) => `<button data-i="${i}" aria-label="Item ${i + 1}">${shapeSVG(it.s, it.c, 60, it.f, it.r)}</button>`).join('')}</div>
      <div class="btnrow"><button class="btn" id="sdone">Done <kbd>Enter</kbd></button></div>`;
    $$('.sgrid button', ctx.stage).forEach(b => b.onclick = () => { if (lock) return; const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel'); });
    $('#sdone').onclick = done;
  }
  function done() {
    if (lock) return; lock = true;
    let h = 0, f = 0, m = 0;
    $$('.sgrid button', ctx.stage).forEach((b, i) => {
      const match = eq(items[i], tgt), s = sel.has(i);
      if (match && s) { h++; b.classList.add('right'); } else if (!match && s) { f++; b.classList.add('wrong'); } else if (match) { m++; b.classList.add('wrong'); }
    });
    hits += h; fas += f; misses += m;
    pts = Math.max(0, pts + h - f + (f + m === 0 ? lv : 0));
    if (f + m === 0) { perfect++; lv++; ctx.flash('ok', 'All found'); } else ctx.flash('bad', `${h} found · ${m} missed · ${f} wrong`, 1200);
    ctx.score(pts); ctx.after(1100, round);
  }
  ctx.key(e => { if (e.key === 'Enter') done(); });
  ctx.hint('Tap every exact match, then press Done.');
  ctx.score(0); round();
  return { result() { const t = hits + fas + misses; return { score: pts, accuracy: t ? hits / t : null, stats: [['Rounds', rounds], ['Perfect rounds', perfect], ['Matches found', hits], ['Matches missed', misses], ['Wrong selections', fas], ['Highest level', lv]] }; } };
};

/* ---------- Singularity ---------- */
IMPL.singularity = ctx => {
  let lv = 1, streak = 0, pts = 0, ok = 0, bad = 0, lock = false, t0;
  const rts = [];
  const norm = cs => { const r0 = Math.min(...cs.map(c => c[0])), c0 = Math.min(...cs.map(c => c[1])); return cs.map(([r, c]) => [r - r0, c - c0]); };
  const key = cs => norm(cs).map(c => c.join(',')).sort().join(';');
  const rot = cs => norm(cs.map(([r, c]) => [c, -r]));
  const mir = cs => norm(cs.map(([r, c]) => [r, -c]));
  const rots = cs => { const o = [cs]; for (let i = 0; i < 3; i++) o.push(rot(o[o.length - 1])); return o; };
  function poly(n) {
    for (;;) {
      const set = new Map([['0,0', [0, 0]]]);
      while (set.size < n) { const [r, c] = pick([...set.values()]); const d = pick([[0, 1], [1, 0], [0, -1], [-1, 0]]); const nr = r + d[0], nc = c + d[1]; set.set(nr + ',' + nc, [nr, nc]); }
      const cs = norm([...set.values()]);
      if (Math.max(...cs.map(c => c[0])) > 3 || Math.max(...cs.map(c => c[1])) > 3) continue;
      const m = key(mir(cs));
      if (!rots(cs).some(x => key(x) === m)) return cs;
    }
  }
  const glyph = cs => { const w = Math.max(...cs.map(c => c[1])) + 1, h = Math.max(...cs.map(c => c[0])) + 1, ox = (4 - w) / 2, oy = (4 - h) / 2;
    return `<svg viewBox="-0.2 -0.2 4.4 4.4" class="glyph" aria-hidden="true">${cs.map(([r, c]) => `<rect x="${c + ox + 0.04}" y="${r + oy + 0.04}" width=".92" height=".92" rx=".12"/>`).join('')}</svg>`; };
  function round() {
    lock = false;
    const n = lv <= 1 ? 9 : lv <= 3 ? 12 : lv <= 5 ? 16 : 20, rotate = lv >= 3, cells = lv >= 5 ? 6 + rnd(2) : 5;
    const base = poly(cells), odd = rnd(n);
    const items = Array.from({ length: n }, (_, i) => { let s = i === odd ? mir(base) : base; if (rotate) s = rots(s)[rnd(4)]; return s; });
    ctx.level(`Level ${lv}${rotate ? ' · rotated' : ''}`);
    const cols = n <= 9 ? 3 : n <= 16 ? 4 : 5, gs = Math.min(84, Math.floor((Math.min(window.innerWidth, 860) - 80) / cols) - 10);
    ctx.stage.innerHTML = `<p class="prompt">Find the shape that is different</p><div class="sgrid" style="--gs:${gs}px;grid-template-columns:repeat(${cols},var(--gs))">${items.map((s, i) => `<button data-i="${i}" aria-label="Shape ${i + 1}">${glyph(s)}</button>`).join('')}</div>`;
    t0 = performance.now();
    $$('.sgrid button', ctx.stage).forEach(b => b.onclick = () => {
      if (lock) return; lock = true; rts.push(performance.now() - t0);
      const i = +b.dataset.i;
      if (i === odd) { ok++; pts += lv; b.classList.add('right'); ctx.flash('ok', 'Found it'); if (++streak >= 2) { lv++; streak = 0; } }
      else { bad++; streak = 0; b.classList.add('wrong'); $$('.sgrid button', ctx.stage)[odd].classList.add('right'); ctx.flash('bad', 'Not that one'); lv = Math.max(1, lv - (bad % 2 === 0 ? 1 : 0)); }
      ctx.score(pts); ctx.after(800, round);
    });
  }
  ctx.hint('Rotations are the same shape. Mirror images are different.');
  ctx.score(0); round();
  return { result() { const t = ok + bad; return { score: pts, accuracy: t ? ok / t : null, stats: [['Found', ok], ['Wrong picks', bad], ['Highest level', lv], ['Median find time', ms(median(rts))]] }; } };
};

/* ---------- Pulse (go / no-go) ---------- */
IMPL.pulse = ctx => {
  const RED = '#e5484d', OTHER = ['#3e7bfa', '#2f9e6b', '#8e5bd8'], LURE = '#f08a24';
  let cur = null, pts = 0, hits = 0, misses = 0, fas = 0, lureFa = 0, shown = 0;
  const rts = [];
  ctx.stage.innerHTML = `<p class="prompt">Red dot: press <kbd style="background:var(--line)">Space</kbd> or tap. Anything else: wait.</p><div class="arena" id="ar"><div class="dot" id="dt"></div></div>`;
  const ar = $('#ar'), dt = $('#dt');
  // adaptive pace: accurate responses speed it up, mistakes ease it off
  let sp = 1, cr = 0, topSp = 1;
  const nudge = d => { sp = Math.min(8, Math.max(1, sp + d)); topSp = Math.max(topSp, sp); };
  const lvl = () => Math.floor(sp);
  function spawn() {
    const l = lvl(); ctx.level('Speed ' + l, 'quiet');
    const r = Math.random(), red = r < 0.3, lure = !red && l >= 2 && r < 0.45;
    const color = red ? RED : lure ? LURE : pick(OTHER);
    cur = { red, lure, t: performance.now(), done: false }; shown++;
    dt.style.left = (10 + Math.random() * 80) + '%'; dt.style.top = (14 + Math.random() * 72) + '%'; dt.style.background = color;
    dt.classList.add('on');
    const life = Math.max(480, 850 - l * 80);
    ctx.after(life, () => {
      dt.classList.remove('on');
      if (cur && cur.red && !cur.done) { misses++; pts -= 5; nudge(-1); ctx.flash('slow', 'Missed'); ctx.score(pts); }
      else if (cur && !cur.red && !cur.done) { cr++; pts += 2; nudge(0.25); ctx.score(pts); }
      cur = null;
      ctx.after(Math.max(350, 1000 - l * 90) + rnd(500), spawn);
    });
  }
  function respond() {
    if (cur && !cur.done) {
      cur.done = true;
      if (cur.red) { const rt = performance.now() - cur.t; rts.push(rt); hits++; pts += 10 + Math.max(0, Math.round((600 - rt) / 60)); nudge(0.5); ctx.flash('ok', Math.round(rt) + ' ms'); }
      else { fas++; if (cur.lure) lureFa++; pts -= 10; nudge(-1); ctx.flash('bad', 'Not red'); }
    } else if (!cur) { fas++; pts -= 10; nudge(-1); ctx.flash('bad', 'No dot'); }
    ctx.score(pts);
  }
  ar.addEventListener('pointerdown', e => { e.preventDefault(); if (ctx.alive) respond(); });
  ctx.key(e => { if (e.key === ' ' && !e.repeat) respond(); });
  ctx.hint('Accurate play speeds the dots up; mistakes slow them down. Orange dots are lures.');
  ctx.score(0); ctx.after(1000, spawn);
  return { result() { const reds = hits + misses; return { score: Math.max(0, pts), accuracy: reds + cr + fas ? (hits + cr) / (reds + cr + fas) : null, stats: [['Red dots hit', `${hits}/${reds}`], ['Correctly ignored', cr], ['Missed reds', misses], ['False alarms', fas], ['Fell for orange lure', lureFa], ['Top speed', Math.floor(topSp)], ['Median reaction', ms(median(rts))]] }; } };
};
