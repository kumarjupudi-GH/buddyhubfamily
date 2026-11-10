/* ArtBuddy – front-end app (no build step, no dependencies). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LESSONS = window.LESSONS, CATS = window.CATEGORIES, TECHS = window.TECHNIQUES;
  const byId = id => LESSONS.find(l => l.id === id);
  const catOf = id => CATS.find(c => c.id === id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const DIFFS = [
    { id: 'very-easy', label: 'Very Easy', emoji: '🌱', tier: 1, hint: 'Just the basics' },
    { id: 'easy', label: 'Easy', emoji: '🌼', tier: 2, hint: 'A few details' },
    { id: 'medium', label: 'Medium', emoji: '🌳', tier: 3, hint: 'Patterns & shading' },
    { id: 'challenge', label: 'Challenge Me', emoji: '🚀', tier: 4, hint: 'All the details' }
  ];
  const SHAPE_ICON = { oval: '⬭ Oval', circle: '⚪ Circle', triangle: '🔺 Triangle', rectangle: '▬ Rectangle', square: '⬜ Square', line: '╱ Line', curve: '〰️ Curve', dot: '⚫ Dot', cloud: '☁️ Cloud' };
  const COLORS = ['#2b2b3a', '#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#8b5a2b'];
  const SIZES = [6, 12, 24];
  const PRAISE = ['Great job!', 'Wow, nice lines!', 'Super!', 'You’re doing awesome!', 'Looking great!', 'Nice work, artist!', 'Fantastic!', 'I love your style!'];
  const BADGES = [
    { id: 'first', emoji: '🌟', name: 'First Masterpiece', desc: 'Finish 1 drawing', test: s => total(s) >= 1 },
    { id: 'five', emoji: '🎖️', name: 'Super Artist', desc: 'Finish 5 drawings', test: s => total(s) >= 5 },
    { id: 'ten', emoji: '🏆', name: 'Art Champion', desc: 'Finish 10 drawings', test: s => total(s) >= 10 },
    { id: 'tricks', emoji: '🎨', name: 'Trick Explorer', desc: 'Learn 3 different tricks', test: s => new Set(Object.keys(s.done).map(id => (byId(id) || { tech: [''] }).tech[0])).size >= 3 },
    { id: 'brave', emoji: '🚀', name: 'Brave Challenger', desc: 'Finish a Challenge Me drawing', test: s => Object.values(s.done).some(d => d.best >= 4) },
    { id: 'animals', emoji: '🐯', name: 'Animal Artist', desc: 'Draw 3 animals', test: s => Object.keys(s.done).filter(id => (byId(id) || {}).cat === 'animals').length >= 3 }
  ];
  const total = s => Object.values(s.done).reduce((a, d) => a + d.count, 0);

  /* ---------- persistent state ---------- */
  const KEY = 'artbuddy.v1';
  const fresh = () => ({ diff: 0, stars: 0, done: {}, gallery: [], last: null });
  function loadState() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') return Object.assign(fresh(), s); } catch (e) { } return fresh(); }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { if (S.gallery.length) { S.gallery.pop(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e2) { } } }
  }
  let S = loadState();
  const diff = () => DIFFS[S.diff] || DIFFS[0];

  /* ---------- lesson plan & SVG rendering ---------- */
  function buildPlan(l, d) {
    const plan = l.steps.filter(s => s.tier <= d.tier).map(s => ({ kind: 'draw', t: s.t, say: s.say, d: s.d }));
    plan.push({ kind: 'color', t: 'Add Color', say: 'Time for color! Use any colors you love. They don’t have to match mine!' });
    if (d.tier >= 3 && l.shade) plan.push({ kind: 'shade', t: 'Add Shading', say: 'Add soft shadows on one side with a darker color. Press lightly!' });
    return plan;
  }
  function svg(l, plan, upto, o = {}) {
    const pal = Object.assign({}, l.pal, o.pal || {});
    const style = Object.entries(pal).map(([k, v]) => `--${k}:${v}`).join(';');
    let colors = false, shade = false, old = '', cur = '';
    plan.forEach((p, i) => {
      if (i > upto) return;
      if (p.kind === 'draw') { if (i === upto && !o.final && !o.ghost) cur += p.d; else old += p.d; }
      else if (p.kind === 'color') colors = true; else shade = true;
    });
    const cls = o.ghost ? 'ghost' : (colors ? 'done' : 'old');
    return `<svg class="art-svg" viewBox="0 0 400 400" style="${style}" role="img" aria-label="${esc(l.name)} drawing">` +
      (colors ? `<g class="fills">${l.bg}${l.colors}</g>` : '') +
      (shade && l.shade ? `<g class="shade">${l.shade}</g>` : '') +
      (l.guide ? `<g class="ink guide">${l.guide}</g>` : '') +
      `<g class="ink ${cls}">${old}</g><g class="ink new">${cur}</g></svg>`;
  }
  const finalSVG = (l, pal) => { const p = buildPlan(l, diff()); return svg(l, p, p.length - 1, { final: true, pal }); };

  /* ---------- view state ---------- */
  let V = { name: 'home' };       // current screen
  let LS = null;                  // active lesson session
  const app = $('#app');

  function go(name, extra) { V = Object.assign({ name }, extra); render(); window.scrollTo(0, 0); }
  function render() {
    const fn = { home, category, results, intro, lesson, done, art, tech }[V.name] || home;
    app.innerHTML = fn();
    if (V.name === 'lesson') initLesson();
    if (V.name === 'done') confetti();
  }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }

  /* ---------- shared UI pieces ---------- */
  const logo = () => 'ArtBuddy'.split('').map(c => `<span>${c}</span>`).join('');
  const topbar = (back) => `<header class="top">${back ? `<button class="btn ghost back" data-a="home" aria-label="Home">🏠 Home</button>` : `<div class="logo" aria-label="ArtBuddy">${logo()}</div>`}
    <button class="chip stars" data-a="art" aria-label="My Art and stars">⭐ ${S.stars} · My Art</button></header>`;
  const diffPills = () => `<div class="diffs" role="radiogroup" aria-label="How tricky?">${DIFFS.map((d, i) =>
    `<button class="diff ${i === S.diff ? 'on' : ''}" role="radio" aria-checked="${i === S.diff}" data-a="diff" data-v="${i}"><span class="em">${d.emoji}</span>${d.label}<small>${d.hint}</small></button>`).join('')}</div>`;
  function lessonCard(l) {
    const d = S.done[l.id];
    return `<button class="card lcard" data-a="lesson" data-v="${l.id}" aria-label="Draw ${esc(l.name)}">
      ${d ? `<span class="tick">✓ ${'⭐'.repeat(d.best)}</span>` : ''}
      <div class="art">${finalSVG(l)}</div><h3>${l.emoji} ${esc(l.name)}</h3><div class="meta">${esc(l.tech[0])}</div></button>`;
  }

  /* ---------- screens ---------- */
  function home() {
    const sugg = ['tiger', 'rocket', 'flower', 'castle', 'pizza', 'robot'];
    const last = S.last && byId(S.last);
    return `<div>${topbar(false)}
    <section class="card hero"><div class="mascot bounce" aria-hidden="true">✏️</div><div style="flex:1;width:100%">
      <h1>Hi, artist! What do you want to draw?</h1>
      <form id="sf" class="search" autocomplete="off"><input id="q" type="text" maxlength="60" placeholder="Try: tiger, rocket, flower…" aria-label="What do you want to draw?">
      <button class="btn orange big" type="submit">Let’s go! 🔍</button></form>
      <div class="sugg">${sugg.map(s => `<button class="chip" data-a="search" data-v="${s}">${esc(s)}</button>`).join('')}</div></div></section>
    <section><h2>How tricky should it be?</h2>${diffPills()}</section>
    <section><h2>Pick something to draw</h2><div class="cats">${CATS.map(c => `<button class="cat" style="background:${c.color}" data-a="cat" data-v="${c.id}"><span class="em">${c.emoji}</span>${c.name}</button>`).join('')}</div></section>
    <section class="two">
      <button class="card tile" data-a="tech"><span style="font-size:44px">🎨</span><span>Learn a drawing trick<small>Shapes, shading, symmetry…</small></span></button>
      ${last ? `<button class="card tile" data-a="lesson" data-v="${last.id}"><span style="font-size:44px">${last.emoji}</span><span>Draw ${esc(last.name)} again<small>Keep practicing!</small></span></button>`
        : `<button class="card tile" data-a="lesson" data-v="tiger"><span style="font-size:44px">🐯</span><span>Start with a Tiger<small>A great first drawing</small></span></button>`}
    </section></div>`;
  }
  function category() {
    const c = catOf(V.id);
    const ls = c.id === 'techniques' ? TECHS.map(t => byId(t.lesson)).filter((l, i, a) => l && a.indexOf(l) === i) : LESSONS.filter(l => l.cat === c.id);
    return `<div>${topbar(true)}<section><h1>${c.emoji} ${c.name}</h1><p>Pick a drawing!</p><div class="lgrid">${ls.map(lessonCard).join('')}</div></section></div>`;
  }
  function results() {
    const r = V.res, q = esc(V.q);
    if (r.lessons.length) return `<div>${topbar(true)}<section><h1>Here’s what I can teach for “${q}”</h1><div class="lgrid">${r.lessons.map(lessonCard).join('')}</div></section></div>`;
    const some = LESSONS.slice().sort(() => Math.random() - .5).slice(0, 4);
    return `<div>${topbar(true)}<section class="card"><div style="display:flex;gap:14px;align-items:center"><div class="mascot small" aria-hidden="true">✏️</div>
      <div><h2>Hmm, I don’t know how to draw “${q}” yet!</h2><p>I’m still learning. Try one of these, or pick a category.</p></div></div></section>
      <section><div class="lgrid">${some.map(lessonCard).join('')}</div></section>
      <section><div class="cats">${CATS.map(c => `<button class="cat" style="background:${c.color}" data-a="cat" data-v="${c.id}"><span class="em">${c.emoji}</span>${c.name}</button>`).join('')}</div></section></div>`;
  }
  function intro() {
    const l = byId(V.id), d = diff(), plan = buildPlan(l, d);
    const draws = plan.map((p, i) => ({ p, i })).filter(x => x.p.kind === 'draw');
    return `<div>${topbar(true)}
    <div class="intro"><section class="bigart"><div class="art">${finalSVG(l)}</div></section>
    <section><h1>${l.emoji} ${esc(l.name)}</h1>
      <h3>Shapes we’ll use</h3><div class="shapes">${l.shapes.map(s => `<span class="shape">${SHAPE_ICON[s] || s}</span>`).join('')}</div>
      <div class="trick"><b>🎨 Today’s trick: ${esc(l.tech[0])}</b><br>${esc(l.tech[1])}</div>
      <h3>How hard?</h3>${diffPills()}
      <p style="margin:14px 0 0"><button class="btn orange big" data-a="start" data-v="${l.id}">Let’s draw! ✏️</button></p></section></div>
    <section><h3>Watch it grow – ${plan.length} steps</h3><div class="strip">${draws.map((x, n) => `<figure><div class="art">${svg(l, plan, x.i)}</div>Step ${n + 1}</figure>`).join('')}<figure><div class="art">${finalSVG(l)}</div>All done!</figure></div></section></div>`;
  }
  const toolbar = () => `<div class="toolbar" role="toolbar" aria-label="Drawing tools">
      <button class="tb on" data-a="tool" data-v="pen" id="t-pen" aria-label="Pencil">✏️</button>
      <button class="tb" data-a="tool" data-v="eraser" id="t-eraser" aria-label="Eraser">🧽</button>
      <button class="tb" data-a="undo" id="t-undo" aria-label="Undo" disabled>↩️</button>
      <button class="tb" data-a="redo" id="t-redo" aria-label="Redo" disabled>↪️</button>
      <button class="tb" data-a="clear" aria-label="Clear">🗑️</button>
      <button class="tb" data-a="save" aria-label="Save my drawing">💾</button></div>
    <div class="toolbar" aria-label="Colors">${COLORS.map((c, i) => `<button class="sw ${i === 0 ? 'on' : ''}" style="background:${c}" data-a="color" data-v="${c}" aria-label="Color ${i + 1}"></button>`).join('')}</div>
    <div class="toolbar" aria-label="Brush size">${SIZES.map((s, i) => `<button class="tb sz ${i === 1 ? 'on' : ''}" data-a="size" data-v="${s}" aria-label="Brush size ${i + 1}"><i style="width:${8 + i * 8}px;height:${8 + i * 8}px"></i></button>`).join('')}</div>`;
  function lesson() {
    const l = LS.l;
    return `<div><div class="lhead"><button class="btn ghost" data-a="leave" aria-label="Back">⬅️</button><h2>${l.emoji} ${esc(l.name)}</h2><span class="chip">${diff().emoji} ${diff().label}</span></div>
    <div class="progress" aria-hidden="true"><i id="bar"></i></div><div class="dots" id="dots"></div>
    <div class="work">
      <section class="card panel"><h3 id="stepTitle"></h3><div class="art bigart" id="example"></div><div class="caption" id="caption"></div>
        <p style="text-align:center;margin:8px 0 0"><button class="chip" data-a="speak" aria-label="Read it to me">🔊 Read to me</button></p></section>
      <section class="card panel"><h3>✏️ Your turn!</h3>
        <div class="stage" id="stage"><div id="ghost" aria-hidden="true"></div><canvas id="cv" width="600" height="600" aria-label="Drawing canvas"></canvas></div>
        ${toolbar()}
        <label class="toggle"><input type="checkbox" id="trace"> Show helper lines (trace it)</label></section></div>
    <div class="teacher"><div class="mascot small bounce" aria-hidden="true">✏️</div><div style="flex:1"><div class="bubble" id="bubble"></div>
      <form class="ask" id="askf" autocomplete="off"><input id="askq" maxlength="140" placeholder="Ask ArtBuddy a question…" aria-label="Ask ArtBuddy"><button class="chip" type="submit">Ask</button></form></div></div>
    <div class="nav"><button class="btn ghost big" data-a="prev" id="prev">⬅️ Back</button>
      <div class="mid"><button class="btn teal big" data-a="help">🙋 Help me!</button></div>
      <button class="btn orange big" data-a="next" id="next">Next ➡️</button></div></div>`;
  }
  function done() {
    const l = LS.l, pal = LS.pal;
    const alt = l.palettes || [];
    return `<div class="done"><div class="confetti" id="confetti" aria-hidden="true"></div>${topbar(true)}
    <section><h1>🎉 You did it! Amazing drawing!</h1><p style="font-size:22px">You drew a ${esc(l.name)} and earned <b>${LS.earned} ⭐</b></p>
      ${LS.newBadges.length ? `<p class="chip" style="background:#fff7d6">${LS.newBadges.map(b => b.emoji + ' ' + b.name).join(' · ')} unlocked!</p>` : ''}</section>
    <section class="pair"><figure><div class="frame">${LS.img ? `<img alt="Your drawing" src="${LS.img}">` : '<span style="font-size:60px">🖼️</span>'}</div><figcaption>Your drawing</figcaption></figure>
      <figure><div class="frame" id="finalEx">${finalSVG(l, pal)}</div><figcaption>ArtBuddy’s example</figcaption></figure></section>
    <section class="card"><h2>Make it your own!</h2><div class="ideas">${(l.vars || []).map(v => `<span class="shape">${esc(v)}</span>`).join('')}</div>
      <h3>Try new colors</h3><div class="pals"><button class="pal" data-a="pal" data-v="-1">Original</button>${alt.map((p, i) => `<button class="pal" data-a="pal" data-v="${i}"><b style="background:${p.c1}"></b><b style="background:${p.c2}"></b><b style="background:${p.c3}"></b>${esc(p.n)}</button>`).join('')}</div></section>
    <div class="actions"><button class="btn orange big" data-a="start" data-v="${l.id}">✏️ Draw it again</button>
      <button class="btn teal big" data-a="cat" data-v="${l.cat}">${catOf(l.cat).emoji} More ${catOf(l.cat).name}</button>
      <button class="btn big" data-a="home">🏠 Home</button></div></div>`;
  }
  function art() {
    const unlocked = BADGES.filter(b => b.test(S));
    const cats = CATS.filter(c => c.id !== 'techniques').map(c => { const ls = LESSONS.filter(l => l.cat === c.id); const n = ls.filter(l => S.done[l.id]).length; return { c, n, t: ls.length }; }).filter(x => x.t);
    return `<div>${topbar(true)}<section><h1>⭐ My Art</h1>
      <p style="font-size:22px"><b>${S.stars}</b> stars · <b>${total(S)}</b> drawings finished · <b>${Object.keys(S.done).length}</b> of ${LESSONS.length} lessons tried</p></section>
    <section><h2>Badges (${unlocked.length}/${BADGES.length})</h2><div class="badges">${BADGES.map(b => `<div class="badge ${b.test(S) ? '' : 'locked'}"><span class="em">${b.emoji}</span>${b.name}<small>${b.desc}</small></div>`).join('')}</div></section>
    <section><h2>Progress</h2><div class="bars">${cats.map(x => `<div class="bar">${x.c.emoji} ${x.c.name} <span style="float:right">${x.n}/${x.t}</span><div class="progress"><i style="width:${x.n / x.t * 100}%"></i></div></div>`).join('')}</div></section>
    <section><h2>My drawings</h2>${S.gallery.length ? `<div class="gal">${S.gallery.map((g, i) => `<figure><img alt="${esc(g.name)} drawing" src="${g.img}"><div>${esc(g.name)}</div><div class="row"><button class="tb" data-a="dl" data-v="${i}" aria-label="Download">⬇️</button><button class="tb" data-a="del" data-v="${i}" aria-label="Delete">🗑️</button></div></figure>`).join('')}</div>`
        : `<div class="card empty">No drawings yet. Pick a lesson and tap 💾 to save your first one!</div>`}</section></div>`;
  }
  function tech() {
    return `<div>${topbar(true)}<section><h1>🎨 Drawing tricks</h1><p>Every trick has a fun lesson to practice it.</p><div class="tgrid">${TECHS.map(t => `<button class="card tcard" data-a="lesson" data-v="${t.lesson}"><div class="em">${t.emoji}</div><h3>${esc(t.name)}</h3><div>${esc(t.tip)}</div><div class="meta" style="color:var(--purple);font-weight:600;margin-top:6px">Practice: ${byId(t.lesson).emoji} ${esc(byId(t.lesson).name)}</div></button>`).join('')}</div></section></div>`;
  }

  /* ---------- search ---------- */
  const STOP = new Set('i want to draw a an the please how can do you me teach show let us lets my some learn make would like drawing picture of'.split(' '));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const stem = w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
  function lev(a, b) { const m = []; for (let i = 0; i <= a.length; i++) { m[i] = [i]; } for (let j = 1; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
  function search(q) {
    const toks = norm(q).filter(w => !STOP.has(w)).map(stem);
    if (!toks.length) return { lessons: [], cat: null };
    const phrase = toks.join(' ');
    const scored = LESSONS.map(l => {
      let sc = 0;
      for (const k of l.keys) {
        const ks = k.split(' ').map(stem);
        if (phrase === ks.join(' ')) sc = Math.max(sc, 10);
        for (const t of toks) {
          if (ks.includes(t)) sc = Math.max(sc, 8);
          else if (t.length >= 4) for (const w of ks) if (w.length >= 4 && lev(t, w) <= (t.length >= 5 ? 2 : 1)) sc = Math.max(sc, 5);
        }
      }
      return { l, sc };
    }).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc);
    const cat = CATS.find(c => c.alias.some(a => toks.includes(stem(a))));
    return { lessons: scored.map(x => x.l), scores: scored.map(x => x.sc), cat };
  }
  function doSearch(q) {
    q = (q || '').trim(); if (!q) { toast('Type what you want to draw! ✏️'); return; }
    const r = search(q);
    const top = r.lessons[0];
    if (r.lessons.length === 1 || (r.scores[0] >= 8 && (r.scores[1] || 0) < r.scores[0])) return go('intro', { id: top.id });
    if (r.cat && !r.lessons.length) return go('category', { id: r.cat.id });
    go('results', { q, res: r });
  }

  /* ---------- lesson session ---------- */
  function startLesson(id) {
    const l = byId(id); if (!l) return;
    LS = { l, plan: buildPlan(l, diff()), i: 0, helps: 0, inked: false, pal: null, img: null, earned: 0, newBadges: [], saved: false };
    S.last = id; saveState();
    go('lesson');
  }
  const cv = { el: null, ctx: null, tool: 'pen', color: COLORS[0], size: SIZES[1], states: [], idx: 0, down: false, lx: 0, ly: 0 };
  function initLesson() {
    cv.el = $('#cv'); cv.ctx = cv.el.getContext('2d'); cv.tool = 'pen'; cv.color = COLORS[0]; cv.size = SIZES[1];
    cv.ctx.lineCap = cv.ctx.lineJoin = 'round';
    cv.states = [cv.ctx.getImageData(0, 0, cv.el.width, cv.el.height)]; cv.idx = 0;
    const pos = e => { const r = cv.el.getBoundingClientRect(); return [(e.clientX - r.left) * cv.el.width / r.width, (e.clientY - r.top) * cv.el.width / r.width]; };
    const line = (x0, y0, x1, y1) => {
      const c = cv.ctx; c.globalCompositeOperation = cv.tool === 'eraser' ? 'destination-out' : 'source-over';
      c.strokeStyle = cv.color; c.lineWidth = cv.tool === 'eraser' ? cv.size * 2 : cv.size;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    };
    cv.el.addEventListener('pointerdown', e => { e.preventDefault(); cv.el.setPointerCapture(e.pointerId); cv.down = true;[cv.lx, cv.ly] = pos(e); line(cv.lx, cv.ly, cv.lx + .01, cv.ly + .01); });
    cv.el.addEventListener('pointermove', e => { if (!cv.down) return; e.preventDefault(); const [x, y] = pos(e); line(cv.lx, cv.ly, x, y); cv.lx = x; cv.ly = y; });
    const up = () => { if (!cv.down) return; cv.down = false; LS.inked = true; pushState(); };
    cv.el.addEventListener('pointerup', up); cv.el.addEventListener('pointercancel', up);
    updateStep(0);
  }
  function pushState() {
    cv.states = cv.states.slice(0, cv.idx + 1); cv.states.push(cv.ctx.getImageData(0, 0, cv.el.width, cv.el.height));
    if (cv.states.length > 30) cv.states.shift(); cv.idx = cv.states.length - 1; syncUndo();
  }
  function syncUndo() { const u = $('#t-undo'), r = $('#t-redo'); if (u) u.disabled = cv.idx <= 0; if (r) r.disabled = cv.idx >= cv.states.length - 1; }
  function restore() { cv.ctx.globalCompositeOperation = 'source-over'; cv.ctx.putImageData(cv.states[cv.idx], 0, 0); syncUndo(); }
  function composite(max) {
    const t = document.createElement('canvas'); t.width = t.height = max; const c = t.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, max, max); c.drawImage(cv.el, 0, 0, max, max); return t.toDataURL(max < 600 ? 'image/jpeg' : 'image/png', .85);
  }

  function bubble(html) { const b = $('#bubble'); if (b) b.innerHTML = html; }
  function updateStep(dir) {
    const { l, plan, i } = LS, p = plan[i];
    $('#stepTitle').textContent = `Step ${i + 1}: ${p.t}`;
    $('#example').innerHTML = svg(l, plan, i);
    $('#ghost').innerHTML = svg(l, plan, i, { ghost: true });
    $('#caption').textContent = p.say;
    $('#bar').style.width = ((i + 1) / plan.length * 100) + '%';
    $('#dots').innerHTML = plan.map((_, n) => `<button class="dot-b ${n === i ? 'on' : n < i ? 'past' : ''}" data-a="jump" data-v="${n}" aria-label="Step ${n + 1}">${n < i ? '✓' : n + 1}</button>`).join('');
    $('#prev').disabled = i === 0;
    $('#next').textContent = i === plan.length - 1 ? 'Finish! 🎉' : 'Next ➡️';
    LS.helps = 0;
    if (dir === 0) bubble(`Hi! I’m ArtBuddy. Look at the <b style="color:var(--orange)">orange</b> part, then draw it your way. There’s no wrong way to draw! 🌈`);
    else if (dir > 0) bubble(`${pick(PRAISE)} Next up: <b>${esc(p.t)}</b>. ${i === 1 && l.tech ? 'Remember: ' + esc(l.tech[1]) : ''}`);
    else bubble(`No problem, let’s look at this step again. Take your time! 😊`);
  }
  const AI = { ok: false };
  async function askAI(kind, question) {
    const { l, plan, i } = LS;
    try {
      const r = await window.BuddyAI.fetch('/api/public/teach', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, lesson: l.name, step: plan[i].t, instruction: plan[i].say, difficulty: diff().label, question: question || '' }) });
      if (!r.ok) throw new Error('no ai'); const j = await r.json(); return j.text || null;
    } catch (e) { return null; }
  }
  const HELP = [
    p => `Let’s make it simpler! Look at only the <b style="color:var(--orange)">orange</b> lines. That is all you draw right now. Take a deep breath, you can do it! 💪`,
    p => `Try it lightly first. I turned on the helper lines so you can trace them. You can always use ↩️ undo or the 🧽 eraser!`,
    p => `Let’s break it down: <b>${esc(p.t)}</b>. ${esc(p.say)} Draw one tiny piece at a time. It’s okay if it looks different from mine, that makes it yours! 🌟`
  ];
  async function help() {
    const p = LS.plan[LS.i], n = LS.helps++;
    if (n >= 1) { const t = $('#trace'); if (t) { t.checked = true; $('#stage').classList.add('trace'); } }
    bubble('🤔 Let me think…');
    const ai = AI.ok ? await askAI('help', '') : null;
    bubble(ai ? esc(ai) : HELP[Math.min(n, 2)](p));
  }
  async function ask(q) {
    q = q.trim(); if (!q) return;
    bubble('🤔 Let me think…');
    const ai = AI.ok ? await askAI('chat', q) : null;
    if (ai) return bubble(esc(ai));
    const t = q.toLowerCase();
    if (/erase|mistake|oops|wrong|messed/.test(t)) bubble('Mistakes are okay! Tap the 🧽 eraser or the ↩️ undo arrow. Even pro artists do that!');
    else if (/color|colour/.test(t)) bubble('Pick any color you like at the bottom of the tools. Your colors don’t have to match mine! 🌈');
    else if (/hard|difficult|can.?t|stuck/.test(t)) { LS.helps = 0; help(); }
    else bubble('Good question! Try it your way, because there’s no wrong way to draw. Tap “Help me!” if you want me to explain this step again. 😊');
  }
  function speak() {
    try { const u = new SpeechSynthesisUtterance(LS.plan[LS.i].t + '. ' + LS.plan[LS.i].say); u.rate = .9; u.pitch = 1.1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { toast('Reading out loud is not available here.'); }
  }
  function saveDrawing(download) {
    if (!LS.inked) return toast('Draw something first! ✏️');
    const name = LS.l.name;
    S.gallery.unshift({ id: Date.now(), name, lesson: LS.l.id, img: composite(300), date: new Date().toISOString() });
    S.gallery = S.gallery.slice(0, 24); saveState();
    if (download) { const a = document.createElement('a'); a.href = composite(600); a.download = `artbuddy-${LS.l.id}.png`; a.click(); }
    toast('Saved to My Art! 🎨');
  }
  function finish() {
    const before = new Set(BADGES.filter(b => b.test(S)).map(b => b.id));
    const d = diff(), rec = S.done[LS.l.id] || { count: 0, best: 0 };
    rec.count++; rec.best = Math.max(rec.best, d.tier); S.done[LS.l.id] = rec;
    LS.earned = d.tier; S.stars += d.tier;
    LS.newBadges = BADGES.filter(b => b.test(S) && !before.has(b.id));
    LS.img = LS.inked ? composite(400) : null;
    if (LS.inked && window.BBTrack) window.BBTrack.drawing(LS.l.name, composite(300));
    if (LS.inked) { S.gallery.unshift({ id: Date.now(), name: LS.l.name, lesson: LS.l.id, img: composite(300), date: new Date().toISOString() }); S.gallery = S.gallery.slice(0, 24); }
    saveState(); go('done');
  }
  function confetti() {
    const box = $('#confetti'); if (!box) return;
    box.innerHTML = Array.from({ length: 36 }, () => `<span style="left:${Math.random() * 100}%;animation-duration:${2.5 + Math.random() * 2.5}s;animation-delay:${Math.random() * 1.2}s">${pick(['🎉', '⭐', '🎨', '✨', '🌈', '💛'])}</span>`).join('');
    setTimeout(() => { if (box) box.innerHTML = ''; }, 7000);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, v = b.dataset.v;
    switch (a) {
      case 'home': return go('home');
      case 'art': return go('art');
      case 'tech': return go('tech');
      case 'cat': return go('category', { id: v });
      case 'search': return doSearch(v);
      case 'lesson': return go('intro', { id: v });
      case 'diff': S.diff = +v; saveState(); return render();
      case 'start': return startLesson(v);
      case 'leave': return go('intro', { id: LS.l.id });
      case 'next': if (LS.i >= LS.plan.length - 1) return finish(); LS.i++; return updateStep(1);
      case 'prev': if (LS.i > 0) { LS.i--; updateStep(-1); } return;
      case 'jump': { const n = +v; const dir = n - LS.i; LS.i = n; return updateStep(dir > 0 ? 1 : -1); }
      case 'help': return help();
      case 'speak': return speak();
      case 'tool': cv.tool = v; $$('#t-pen,#t-eraser').forEach(x => x.classList.toggle('on', x.id === 't-' + v)); return;
      case 'color': cv.color = v; cv.tool = 'pen'; $$('.sw').forEach(x => x.classList.toggle('on', x === b)); $$('#t-pen,#t-eraser').forEach(x => x.classList.toggle('on', x.id === 't-pen')); return;
      case 'size': cv.size = +v; $$('.sz').forEach(x => x.classList.toggle('on', x === b)); return;
      case 'undo': if (cv.idx > 0) { cv.idx--; restore(); } return;
      case 'redo': if (cv.idx < cv.states.length - 1) { cv.idx++; restore(); } return;
      case 'clear': if (confirm('Clear your whole drawing?')) { cv.ctx.clearRect(0, 0, cv.el.width, cv.el.height); pushState(); } return;
      case 'save': return saveDrawing(true);
      case 'pal': { const l = LS.l; LS.pal = +v >= 0 ? l.palettes[+v] : null; $('#finalEx').innerHTML = finalSVG(l, LS.pal); return; }
      case 'dl': { const g = S.gallery[+v]; const x = document.createElement('a'); x.href = g.img; x.download = `artbuddy-${g.lesson}.jpg`; x.click(); return; }
      case 'del': if (confirm('Delete this drawing?')) { S.gallery.splice(+v, 1); saveState(); render(); } return;
    }
  });
  document.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'sf') doSearch($('#q').value);
    if (e.target.id === 'askf') { const i = $('#askq'); const q = i.value; i.value = ''; ask(q); }
  });
  document.addEventListener('change', e => { if (e.target.id === 'trace') $('#stage').classList.toggle('trace', e.target.checked); });

  fetch('/api/public/health').then(r => r.ok ? r.json() : null).then(j => { AI.ok = !!(j && j.ai); }).catch(() => { });
  render();
})();
