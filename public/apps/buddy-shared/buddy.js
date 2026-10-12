// Shared engine for the family buddies. Generalized from BrainBoost Buddy
// (public/apps/homework-buddy/index.html). Each page sets window.BUDDY first.
(function () {
  var B = window.BUDDY || {};
  var ID = B.id || "buddy";
  var NAME = B.name || "Buddy";
  function K(k) { return ID + "-" + k; }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function ic(d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }

  // ---- accent colors from config
  var rootStyle = document.documentElement.style;
  if (B.accent) rootStyle.setProperty("--b-acc", B.accent);
  if (B.onAccent) rootStyle.setProperty("--b-on", B.onAccent);
  if (B.accentDark) rootStyle.setProperty("--b-acc-d", B.accentDark);
  if (B.onAccentDark) rootStyle.setProperty("--b-on-d", B.onAccentDark);
  if (!document.title) document.title = NAME;

  // ---- page markup (same structure as BrainBoost Buddy)
  var ICON_SPK = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>';
  document.body.insertAdjacentHTML("afterbegin",
'<div class="app">' +
'  <header><div class="top">' +
'    <div class="brand">' +
'      <div class="mascot badge" role="img" aria-label="' + esc(NAME) + ' mascot">' + esc(B.emoji || "🙂") + '</div>' +
'      <div><h1><span class="wm">' + esc(NAME) + '</span></h1><p class="tag">' + esc(B.tagline || "") + '</p></div>' +
'    </div>' +
'    <div class="tools">' +
'      <button class="btn small" id="voiceBtn" type="button" aria-pressed="true" aria-label="Voice replies: on" title="Voice replies: on" hidden><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' + ICON_SPK + '</svg><span class="lbl" id="voiceLbl"> Voice on</span></button>' +
'      <button class="btn small" id="meBtn" type="button" aria-expanded="false" aria-controls="me" aria-label="About you" title="About you"><svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg><span class="lbl" id="meLbl"> Who\'s here?</span></button>' +
'      <button class="btn small" id="popsBtn" type="button" aria-expanded="false" aria-controls="pops" aria-label="Power-ups"><svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg><span class="lbl"> Power-ups</span></button>' +
'      <button class="btn small" id="newChat" type="button">New chat</button>' +
'    </div>' +
'  </div></header>' +
'  <div class="main" id="main">' +
'    <aside class="side" id="side" aria-label="Subjects"><div class="sidehead">Subjects</div><div id="subjList" class="sidelist"></div></aside>' +
'    <div class="resizer" id="resizer" role="separator" aria-orientation="vertical" aria-label="Resize the subjects panel" aria-valuemin="56" aria-valuemax="320" tabindex="0"></div>' +
'    <section class="chat">' +
'      <div id="banner" class="banner" hidden></div>' +
'      <div id="log" aria-live="polite"></div>' +
'      <footer>' +
'        <div class="vstate" id="vstate" hidden role="status" aria-live="polite"><span class="vicon" id="vicon" aria-hidden="true"></span><span class="vtxt"><strong id="vlabel"></strong><em id="vsub"></em></span><span class="vanim" id="vanim"></span><button class="vstop" id="vstop" type="button" hidden>Stop</button></div>' +
'        <form class="composer" id="form">' +
'          <label class="sr" for="box">Your message</label>' +
'          <textarea id="box" rows="1" placeholder="' + esc(B.placeholder || "Type your question.") + '"></textarea>' +
'          <button class="mic" id="mic" type="button" aria-label="Ask with your voice" title="Ask with your voice" hidden><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg><span class="mlbl">Talk</span></button>' +
'          <button class="btn primary" id="send" type="submit">Send</button>' +
'          <button class="btn" id="stop" type="button" hidden>Stop</button>' +
'        </form>' +
'        <p class="fine">' + esc(B.disclaimer || (NAME + " is an AI and can make mistakes.")) + '</p>' +
'      </footer>' +
'    </section>' +
'    <div class="pops" id="pops" hidden role="dialog" aria-label="Power-ups"></div>' +
'    <div class="pops vnote" id="vnote" hidden role="dialog" aria-label="Using your voice">' +
'      <div class="sidehead">Ready to talk?</div>' +
'      <p class="mfine big">Your browser will listen through your microphone and turn your words into text. Kids, ask a grown-up first if you are not sure.</p>' +
'      <p class="mfine">Some browsers (like Chrome) send what you say to their own speech service to do this. ' + esc(NAME) + ' does not record or save your voice.</p>' +
'      <div class="vbtns"><button class="btn primary" id="vnoteOk" type="button">Let\'s talk!</button><button class="btn" id="vnoteNo" type="button">Not now</button></div>' +
'    </div>' +
'    <div class="pops me" id="me" hidden role="dialog" aria-label="About you">' +
'      <div class="sidehead">About you</div>' +
'      <label class="mlab" for="nick">Nickname</label>' +
'      <input id="nick" type="text" maxlength="20" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="A nickname, no last names">' +
'      <div class="mlab" id="gradeLab">Who\'s here?</div>' +
'      <div class="grades" id="grades" role="group" aria-labelledby="gradeLab"></div>' +
'      <button class="btn primary" id="meSave" type="button">Let\'s go!</button>' +
'      <p class="mfine">Saved only on this device. Your nickname and choice go along with your questions so ' + esc(NAME) + ' can say hi and match the tone.</p>' +
'    </div>' +
'  </div>' +
'</div>');

  var MAX_TURNS = 24;
  var turns = [];
  var busy = false;
  var ctl = null;
  var subject = "";

  var log = document.getElementById("log");
  var box = document.getElementById("box");
  var form = document.getElementById("form");
  var sendBtn = document.getElementById("send");
  var stopBtn = document.getElementById("stop");
  var banner = document.getElementById("banner");
  var micBtn = document.getElementById("mic");
  var voiceBtn = document.getElementById("voiceBtn");
  var vstate = document.getElementById("vstate");
  var vicon = document.getElementById("vicon");
  var vlabel = document.getElementById("vlabel");
  var vsub = document.getElementById("vsub");
  var vanim = document.getElementById("vanim");
  var vstop = document.getElementById("vstop");
  var vnote = document.getElementById("vnote");
  var voiceOn = true, lastViaVoice = false, micBlocked = "", dead = false, noteOk = false, unlocked = false;
  var recog = null, listening = false, heard = "", interim = "", micErr = "", cancelListen = false;
  var listenTimer = null, forceTimer = null, oopsTimer = null, speakGuard = null;
  var speaking = false, speakSeq = 0;
  var newChat = document.getElementById("newChat");

  var profile = { name: "", aud: "" };
  function cleanName(s) {
    return String(s || "").replace(/[^\p{L}\p{N} '\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 20);
  }
  function greeting() {
    if (typeof B.greeting === "function") { try { return String(B.greeting(profile.name, profile.aud)); } catch (e) {} }
    return "Hi" + (profile.name ? ", " + profile.name : "") + "! How can I help?";
  }
  var TIPS = (B.tips && B.tips.length) ? B.tips : ["Take a slow breath and try one small step."];
  var tipIdx = Math.floor(Math.random() * TIPS.length);
  function nextTip() { var t = TIPS[tipIdx % TIPS.length]; tipIdx++; return t; }

  // ---- small safe text renderer (escape first, then add light formatting)
  function escT(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function inline(s) {
    s = escT(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return s;
  }
  function renderFence(lang, code) {
    if (lang === "svg") {
      var svg = code.trim();
      var ok = /^<svg[\s>]/i.test(svg) && /<\/svg>\s*$/i.test(svg) && svg.length <= 12000 &&
        !/<script|<foreignObject|<iframe|<image|<use[\s>]|javascript:|\son[a-z]+\s*=|href\s*=|<!ENTITY|<!DOCTYPE/i.test(svg);
      if (!ok) return '<p class="drawing">I could not draw that picture, but the steps above still work.</p>';
      if (!/^<svg[^>]*\sxmlns\s*=/i.test(svg)) svg = svg.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
      return '<div class="viz"><img alt="A picture drawn by ' + esc(NAME) + '" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '"></div>';
    }
    return '<pre class="art">' + escT(code) + '</pre>';
  }
  function render(t) {
    var lines = t.split("\n");
    var out = "";
    var list = null;
    var inFence = false, fenceLang = "", fenceBuf = [];
    function close() { if (list) { out += "</" + list + ">"; list = null; } }
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      var fm = raw.match(/^\s*```\s*([A-Za-z]*)\s*$/);
      if (fm) {
        if (!inFence) { close(); inFence = true; fenceLang = fm[1].toLowerCase(); fenceBuf = []; }
        else { out += renderFence(fenceLang, fenceBuf.join("\n")); inFence = false; }
        continue;
      }
      if (inFence) { fenceBuf.push(raw); continue; }
      var l = raw.replace(/\s+$/, "");
      var m;
      if ((m = l.match(/^\s*(\d+)[.)]\s+(.*)$/))) {
        if (list !== "ol") { close(); out += '<ol start="' + m[1] + '">'; list = "ol"; }
        out += "<li>" + inline(m[2]) + "</li>";
      } else if ((m = l.match(/^\s*[-*•]\s+(.*)$/))) {
        if (list !== "ul") { close(); out += "<ul>"; list = "ul"; }
        out += "<li>" + inline(m[1]) + "</li>";
      } else if (!l.trim()) {
        close();
      } else {
        close();
        var h = l.match(/^#{1,4}\s+(.*)$/);
        out += h ? "<p><strong>" + inline(h[1]) + "</strong></p>" : "<p>" + inline(l) + "</p>";
      }
    }
    close();
    if (inFence) out += fenceLang === "svg" ? '<p class="drawing">Drawing a picture...</p>' : renderFence(fenceLang, fenceBuf.join("\n"));
    return out;
  }

  // ---- storage (device only, keys prefixed with the buddy id)
  function save(k, v) { try { localStorage.setItem(K(k), v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(K(k)); } catch (e) { return null; } }

  // ---- leading rules turn (the persona itself lives on the server)
  function rules(viaVoice) {
    var tone = profile.aud === "kid"
      ? "The person is a kid: use very simple words and very short replies, and for anything tricky or personal, suggest asking a parent or guardian."
      : profile.aud === "teen"
        ? "The person is a teen: keep it short and friendly."
        : profile.aud === "adult"
          ? "The person is a grown-up: use a normal tone."
          : "Who is here is not known yet: use a friendly, simple tone.";
    var nm = profile.name ? "Their nickname is '" + profile.name + "'. Use it now and then in a friendly way, and never ask for a last name." : "";
    var subj = subject ? "They picked this topic: " + subject + "." : "";
    var len = "Keep replies short: a few sentences, one idea at a time, ending with one simple question or next step.";
    var voiceRule = viaVoice ? "Voice: the person asked this out loud, so a word or number may have been misheard by speech recognition (similar-sounding words, or numbers written out). Quietly use the most likely meaning; if you are truly unsure, say in a few words what you understood. Your reply will also be read aloud, so keep it friendly and conversational and no longer than the length rule above." : "";
    return [tone + " " + nm + " " + subj, len, voiceRule].join("\n");
  }

  function trimmed() {
    var t = turns.slice(-MAX_TURNS);
    while (t.length && t[0].role !== "user") t.shift();
    return t;
  }

  // ---- UI helpers
  var DEFAULT_ICON = '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>';
  var TIP_ICON = '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.9.7 1.5 1.6 1.5 2.6V17h4v-.5c0-1 .6-1.9 1.5-2.6A6 6 0 0 0 12 3z"/>';
  var BOLT = '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>';
  var SUBJ = (B.subjects || []).map(function (x) {
    return { s: x.s, label: x.label || x.s, tip: !!x.tip, svg: ic(x.icon || (x.tip ? TIP_ICON : DEFAULT_ICON)) };
  });
  var POWER = (B.power || []).map(function (x) {
    return { label: x.label, desc: x.desc || "", p: x.p || "", svg: ic(x.icon || BOLT) };
  });
  var app = document.querySelector(".app");
  var mainEl = document.getElementById("main");
  var side = document.getElementById("side");
  var resizer = document.getElementById("resizer");
  var subjList = document.getElementById("subjList");
  var pops = document.getElementById("pops");
  var popsBtn = document.getElementById("popsBtn");
  var me = document.getElementById("me");
  var meBtn = document.getElementById("meBtn");
  var meLbl = document.getElementById("meLbl");
  var nick = document.getElementById("nick");
  var gradesEl = document.getElementById("grades");
  var meSave = document.getElementById("meSave");
  var SIDE_MIN = 56, SIDE_MAX = 320;
  var sideW = 190;

  function setSide(w, persist) {
    sideW = Math.max(SIDE_MIN, Math.min(SIDE_MAX, Math.round(w)));
    app.style.setProperty("--sidew", sideW + "px");
    side.classList.toggle("slim", sideW < 110);
    resizer.setAttribute("aria-valuenow", String(sideW));
    if (persist) save("sidew", String(sideW));
  }
  function buildSide() {
    SUBJ.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "sitem";
      b.setAttribute("data-s", x.s);
      b.title = x.label;
      b.setAttribute("aria-label", x.label);
      if (x.tip) b.setAttribute("data-tip", "1");
      b.setAttribute("aria-pressed", x.tip ? "false" : (subject === x.s ? "true" : "false"));
      b.innerHTML = x.svg + "<span>" + esc(x.label) + "</span>";
      b.addEventListener("click", function () {
        if (x.tip) { addBot("<p><strong>" + esc(x.label) + ":</strong> " + escT(nextTip()) + "</p>", "hint"); return; }
        subject = subject === x.s ? "" : x.s;
        save("subject", subject);
        syncIcons();
        box.focus();
      });
      subjList.appendChild(b);
    });
  }
  function setPops(open) {
    if (open) setMe(false);
    pops.hidden = !open;
    popsBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  var AUD = [
    { g: "kid", label: "Kid", desc: "Simple words", svg: ic('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>') },
    { g: "teen", label: "Teen", desc: "Short and friendly", svg: ic('<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>') },
    { g: "adult", label: "Grown-up", desc: "Normal detail", svg: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>') }
  ];
  var pendingAud = "";
  function audShort(g) {
    for (var i = 0; i < AUD.length; i++) if (AUD[i].g === g) return AUD[i].label;
    return "";
  }
  function syncAud() {
    gradesEl.querySelectorAll(".gitem").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-g") === pendingAud ? "true" : "false");
    });
  }
  function buildMe() {
    AUD.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pitem gitem";
      b.setAttribute("data-g", x.g);
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = x.svg + '<span class="ptxt"><strong>' + x.label + '</strong><em>' + x.desc + '</em></span>';
      b.addEventListener("click", function () { pendingAud = pendingAud === x.g ? "" : x.g; syncAud(); });
      gradesEl.appendChild(b);
    });
    meSave.addEventListener("click", saveMe);
    nick.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); saveMe(); } });
    meBtn.addEventListener("click", function () { setMe(me.hidden); });
  }
  function updateMeBtn() {
    var parts = [];
    if (profile.name) parts.push(profile.name);
    if (profile.aud) parts.push(audShort(profile.aud));
    meLbl.textContent = " " + (parts.length ? parts.join(" · ") : "Who's here?");
    meBtn.setAttribute("aria-label", "About you" + (parts.length ? ": " + parts.join(", ") : ""));
  }
  function setMe(open) {
    if (open) {
      pops.hidden = true;
      popsBtn.setAttribute("aria-expanded", "false");
      nick.value = profile.name;
      pendingAud = profile.aud;
      syncAud();
    }
    me.hidden = !open;
    meBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function saveMe() {
    profile.name = cleanName(nick.value);
    profile.aud = pendingAud;
    save("name", profile.name);
    save("aud", profile.aud);
    updateMeBtn();
    setMe(false);
    if (turns.length === 0 && !busy) reset();
    box.focus();
  }
  function buildPops() {
    var head = document.createElement("div");
    head.className = "sidehead";
    head.textContent = "Power-ups";
    pops.appendChild(head);
    POWER.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pitem";
      b.innerHTML = x.svg + '<span class="ptxt"><strong>' + esc(x.label) + '</strong><em>' + esc(x.desc) + '</em></span>';
      b.addEventListener("click", function () {
        box.value = x.p + box.value;
        autosize();
        setPops(false);
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      });
      pops.appendChild(b);
    });
  }
  function initPanels() {
    buildSide();
    buildPops();
    buildMe();
    var saved = parseInt(load("sidew"), 10);
    setSide(isNaN(saved) ? (window.innerWidth < 600 ? 56 : 190) : saved, false);
    var dragging = false;
    resizer.addEventListener("pointerdown", function (e) {
      dragging = true;
      resizer.classList.add("drag");
      try { resizer.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    resizer.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      setSide(e.clientX - mainEl.getBoundingClientRect().left, false);
    });
    function stopDrag() {
      if (!dragging) return;
      dragging = false;
      resizer.classList.remove("drag");
      save("sidew", String(sideW));
    }
    resizer.addEventListener("pointerup", stopDrag);
    resizer.addEventListener("pointercancel", stopDrag);
    resizer.addEventListener("dblclick", function () { setSide(window.innerWidth < 600 ? 56 : 190, true); });
    resizer.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { setSide(sideW - 16, true); e.preventDefault(); }
      else if (e.key === "ArrowRight") { setSide(sideW + 16, true); e.preventDefault(); }
      else if (e.key === "Home") { setSide(SIDE_MIN, true); e.preventDefault(); }
      else if (e.key === "End") { setSide(SIDE_MAX, true); e.preventDefault(); }
    });
    popsBtn.addEventListener("click", function () { setPops(pops.hidden); });
    document.addEventListener("click", function (e) {
      if (!pops.hidden && !pops.contains(e.target) && !popsBtn.contains(e.target)) setPops(false);
      if (!me.hidden && !me.contains(e.target) && !meBtn.contains(e.target)) setMe(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setPops(false); setMe(false); } });
  }
  function syncIcons() {
    document.querySelectorAll(".sitem").forEach(function (b) {
      if (!b.hasAttribute("data-tip")) b.setAttribute("aria-pressed", b.getAttribute("data-s") === subject ? "true" : "false");
    });
  }
  function toBottom() { log.scrollTop = log.scrollHeight; }
  function addUser(text) {
    var d = document.createElement("div");
    d.className = "msg user";
    d.textContent = text;
    log.appendChild(d);
    toBottom();
  }
  function addBot(html, cls) {
    var d = document.createElement("div");
    d.className = "msg bot" + (cls ? " " + cls : "");
    var w = document.createElement("span");
    w.className = "who";
    w.textContent = NAME;
    var b = document.createElement("div");
    b.className = "body";
    b.innerHTML = html || "";
    if (!cls) d.appendChild(w);
    d.appendChild(b);
    log.appendChild(d);
    toBottom();
    return b;
  }
  function dots() {
    return '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="thinking">Thinking it through...</span>';
  }
  function setBusy(v) {
    busy = v;
    sendBtn.hidden = v;
    stopBtn.hidden = !v;
    box.disabled = false;
    syncMicUi();
  }
  function disableAll(msg) {
    banner.textContent = msg;
    banner.hidden = false;
    box.disabled = true;
    sendBtn.disabled = true;
    dead = true;
    syncMicUi();
  }
  function copyFor(code) {
    switch (code) {
      case "rate_limited": return NAME + " needs a short break (too many messages). Wait a bit, then press Try again.";
      case "refused": return "I can't help with that one. Try asking it a different way.";
      case "empty_completion": return "I didn't come up with an answer. Try asking in a different way.";
      case "prompt_too_large": return "This chat got too long. Press New chat to start fresh.";
      default: return "Something went wrong on the way. Press Try again.";
    }
  }

  // ---- talk to the server
  function sample(input, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      var settled = false;
      function fail(code, message) { if (!settled) { settled = true; reject({ code: code, message: message }); } }
      if (opts.signal) {
        if (opts.signal.aborted) { fail("cancelled", "cancelled"); return; }
        opts.signal.addEventListener("abort", function () { fail("cancelled", "cancelled"); });
      }
      fetch(B.endpoint || "/api/public/buddy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buddy: ID, messages: input }),
        signal: opts.signal
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
      }).then(function (x) {
        if (settled) return;
        if (!x.ok || !x.j || typeof x.j.text !== "string") {
          var err = (x.j && x.j.error) || {};
          fail(x.status === 429 ? "rate_limited" : (err.code || "upstream_error"), err.message || ("HTTP " + x.status));
          return;
        }
        settled = true;
        if (opts.onText) { try { opts.onText({ text: x.j.text }); } catch (e) {} }
        resolve({ text: x.j.text, truncated: !!x.j.truncated });
      }).catch(function () { fail("upstream_error", "network error"); });
    });
  }

  async function ask() {
    setBusy(true);
    if (lastViaVoice) setVoice("thinking");
    var body = addBot(dots());
    ctl = new AbortController();
    var input = [{ role: "user", content: rules(lastViaVoice) }].concat(trimmed());
    try {
      var res = await sample(input, {
        signal: ctl.signal,
        onText: function (u) { body.innerHTML = render(u.text); toBottom(); }
      });
      body.innerHTML = render(res.text);
      turns.push({ role: "assistant", content: res.text });
      if (res.truncated) {
        var n = document.createElement("p");
        n.className = "note";
        n.textContent = "That answer was cut short. Ask me to continue or to go one step at a time.";
        body.appendChild(n);
      }
      decorateReply(body, res.text);
      speakReply(res.text, lastViaVoice);
    } catch (e) {
      setVoice("idle");
      var code = e && e.code;
      var partial = e && e.text ? e.text : "";
      if (code === "cancelled") {
        if (partial) {
          body.innerHTML = render(partial);
          var s = document.createElement("p");
          s.className = "note";
          s.textContent = "Stopped.";
          body.appendChild(s);
          turns.push({ role: "assistant", content: partial });
        } else {
          body.parentNode.remove();
          turns.pop();
        }
      } else {
        body.innerHTML = (partial ? render(partial) : "") + '<p class="err"></p>';
        body.querySelector(".err").textContent = copyFor(code);
        var r = document.createElement("button");
        r.type = "button";
        r.className = "btn retry";
        r.textContent = "Try again";
        r.addEventListener("click", function () {
          body.parentNode.remove();
          ask();
        });
        body.appendChild(r);
      }
    } finally {
      ctl = null;
      setBusy(false);
      if (!box.disabled && !lastViaVoice) box.focus();
    }
  }

  function submit(text, viaVoice) {
    text = (text || "").trim();
    if (!text || busy || dead) return false;
    cancelVoice();
    lastViaVoice = !!viaVoice;
    turns.push({ role: "user", content: text });
    addUser(text);
    ask();
    return true;
  }
  function send() {
    var text = box.value.trim();
    if (!text || busy || dead) return;
    box.value = "";
    autosize();
    submit(text, false);
  }
  function autosize() {
    box.style.height = "auto";
    box.style.height = Math.min(box.scrollHeight + 2, 140) + "px";
  }
  function reset() {
    if (ctl) ctl.abort();
    cancelVoice();
    turns = [];
    log.innerHTML = "";
    addBot(render(greeting()), "hint");
    box.value = "";
    autosize();
  }

  // ---- voice: browser SpeechRecognition in, speechSynthesis out
  var VBARS = '<span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
  var SPK_ON = ICON_SPK;
  var SPK_OFF = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>';
  var VCFG = {
    listening: { icon: ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>'), label: "I'm listening!", sub: "Say your question out loud", anim: VBARS },
    thinking: { icon: ic(TIP_ICON), label: "Thinking...", sub: "Working on it", anim: '<span class="vdots" aria-hidden="true"><i></i><i></i><i></i></span>' },
    answering: { icon: ic('<path d="M4 5h16v11h-9l-4 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>'), label: "Here's my answer!", sub: "Tap Stop any time", anim: VBARS, stop: true },
    oops: { icon: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>'), label: "Oops!", sub: "", anim: "" }
  };
  var OOPS = {
    silent: ["I didn't hear you", "Tap the mic and try again"],
    net: ["I can't hear right now", "Check your internet, then tap the mic"],
    blocked: ["The microphone is off", "Allow it in your browser, or just type"],
    nomic: ["No microphone found", "Plug one in, or just type"],
    unavailable: ["Voice isn't ready", "You can type your question instead"],
    insecure: ["Voice needs a safe address", "Use http://localhost or https, or just type"]
  };
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var synth = null;
  try { if ("speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function") synth = window.speechSynthesis; } catch (e) { synth = null; }

  function setVoice(state, label, sub) {
    clearTimeout(oopsTimer);
    app.setAttribute("data-voice", state);
    if (state === "idle") {
      vstate.hidden = true;
      vstate.className = "vstate";
      syncMicUi();
      return;
    }
    var c = VCFG[state];
    vstate.className = "vstate " + state;
    vicon.innerHTML = c.icon;
    vlabel.textContent = label || c.label;
    vsub.textContent = sub !== undefined ? sub : c.sub;
    vanim.innerHTML = c.anim;
    vstop.hidden = !c.stop;
    vstate.hidden = false;
    toBottom();
    syncMicUi();
    if (state === "oops") {
      oopsTimer = setTimeout(function () { if (app.getAttribute("data-voice") === "oops") setVoice("idle"); }, 6000);
    }
  }
  function oops(kind) {
    var o = OOPS[kind] || OOPS.unavailable;
    setVoice("oops", o[0], o[1]);
  }
  function syncMicUi() {
    if (!micBtn) return;
    micBtn.classList.toggle("listening", listening);
    micBtn.classList.toggle("blocked", !!micBlocked);
    micBtn.disabled = (busy || dead) && !listening;
    var lbl = micBtn.querySelector(".mlbl");
    if (lbl) lbl.textContent = listening ? "Done" : "Talk";
    var tip = listening ? "Done talking: send my question" : "Ask with your voice";
    micBtn.setAttribute("aria-label", tip);
    micBtn.title = tip;
  }

  function startListening() {
    if (!SR || listening || busy || dead) return;
    stopSpeaking();
    unlockSpeech();
    setPops(false);
    setMe(false);
    hideNote();
    heard = "";
    interim = "";
    micErr = "";
    cancelListen = false;
    var r;
    try {
      r = new SR();
      r.lang = "en-US";
      r.interimResults = true;
      r.continuous = false;
      r.maxAlternatives = 1;
    } catch (e) { micFail("unavailable"); return; }
    r.onresult = function (e) {
      var f = "", i = "";
      for (var k = 0; k < e.results.length; k++) {
        var res = e.results[k];
        var t = res && res[0] ? res[0].transcript : "";
        if (res.isFinal) f += t; else i += t;
      }
      heard = f;
      interim = i;
      var shown = (f + " " + i).replace(/\s+/g, " ").trim();
      if (shown && listening) vsub.textContent = "“" + shown + "”";
    };
    r.onerror = function (e) { micErr = (e && e.error) || "error"; };
    r.onend = function () { finishListening(r); };
    recog = r;
    listening = true;
    setVoice("listening");
    clearTimeout(listenTimer);
    listenTimer = setTimeout(stopListening, 20000);
    try { r.start(); } catch (e) { listening = false; recog = null; micFail("unavailable"); }
  }
  function stopListening() {
    if (!recog || !listening) return;
    var r = recog;
    try { r.stop(); } catch (e) {}
    clearTimeout(forceTimer);
    forceTimer = setTimeout(function () { finishListening(r); }, 2500);
  }
  function finishListening(r) {
    if (r !== recog) return;
    clearTimeout(listenTimer);
    clearTimeout(forceTimer);
    recog = null;
    listening = false;
    var text = (heard + " " + interim).replace(/\s+/g, " ").trim();
    if (cancelListen) { setVoice("idle"); return; }
    if (micErr === "not-allowed" || micErr === "service-not-allowed") { micFail("blocked"); return; }
    if (micErr === "audio-capture") { setVoice("idle"); oops("nomic"); return; }
    if (!text) { oops(micErr === "network" ? "net" : "silent"); return; }
    if (!submit(text, true)) {
      box.value = text;
      autosize();
      setVoice("idle");
    }
  }
  function micFail(kind) {
    micBlocked = kind;
    listening = false;
    recog = null;
    syncMicUi();
    oops(kind);
  }
  function cancelVoice() {
    var r = recog;
    if (listening && r) {
      cancelListen = true;
      try { r.abort(); } catch (e) {}
      clearTimeout(forceTimer);
      forceTimer = setTimeout(function () { finishListening(r); }, 800);
    }
    stopSpeaking();
    clearTimeout(oopsTimer);
    if (!busy && !listening) setVoice("idle");
  }
  function onMic() {
    if (micBtn.disabled) return;
    if (listening) { stopListening(); return; }
    if (micBlocked) { oops(micBlocked); return; }
    if (!(noteOk || load("voice-ok") === "1")) { showNote(); return; }
    startListening();
  }
  function showNote() {
    setPops(false);
    setMe(false);
    vnote.hidden = false;
    var ok = document.getElementById("vnoteOk");
    if (ok) ok.focus();
  }
  function hideNote() { vnote.hidden = true; }

  function unlockSpeech() {
    if (!synth || unlocked) return;
    unlocked = true;
    try { var u = new window.SpeechSynthesisUtterance(""); u.volume = 0; synth.speak(u); } catch (e) {}
  }
  function pickVoice() {
    if (!synth || !synth.getVoices) return null;
    var vs = synth.getVoices();
    if (!vs || !vs.length) return null;
    var en = vs.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || ""); });
    var pool = en.length ? en : vs;
    var pref = /(Samantha|Aria|Jenny|Ava|Allison|Susan|Zira|Google US English|Google UK English Female|Karen|Moira|Tessa|Serena|Natural)/i;
    var i;
    for (i = 0; i < pool.length; i++) if (pref.test(pool[i].name || "")) return pool[i];
    for (i = 0; i < pool.length; i++) if (/^en-US/i.test(pool[i].lang || "")) return pool[i];
    return pool[0];
  }
  function speakable(raw) {
    var t = String(raw || "");
    var pic = /```svg/i.test(t);
    t = t.replace(/```[\s\S]*?```/g, " ").replace(/```[\s\S]*$/, " ");
    t = t.replace(/[\p{Extended_Pictographic}️‍⃣]/gu, "");
    t = t.split("\n").map(function (l) {
      return l.replace(/^\s*#{1,4}\s+/, "").replace(/^\s*[-*•]\s+/, "").trim();
    }).filter(function (l) { return l; }).map(function (l) {
      return /[.!?:]["')\]]?$/.test(l) ? l : l + ".";
    }).join(" ");
    t = t.replace(/(\d)\s*[×*]\s*(\d)/g, "$1 times $2")
      .replace(/÷/g, " divided by ")
      .replace(/(\d+)\s*\/\s*(\d+)/g, "$1 over $2")
      .replace(/\^2\b/g, " squared")
      .replace(/\^3\b/g, " cubed")
      .replace(/\^(\w+)/g, " to the power of $1")
      .replace(/sqrt\(\s*([^)]+?)\s*\)/gi, "square root of $1")
      .replace(/\s*=\s*/g, " equals ")
      .replace(/(\d)\s*\+\s*(\d)/g, "$1 plus $2")
      .replace(/\s\+\s/g, " plus ")
      .replace(/(\d)\s[-–−]\s(\d)/g, "$1 minus $2")
      .replace(/(\d)\s*%/g, "$1 percent")
      .replace(/\s<\s/g, " is less than ")
      .replace(/\s>\s/g, " is greater than ");
    t = t.replace(/\*\*|__|~~|`/g, "").replace(/[*_#<>|]/g, " ").replace(/\s+/g, " ").trim();
    if (pic && t) t += " Look at the picture to see it.";
    if (t.length > 1200) {
      var cut = t.slice(0, 1200);
      var at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
      t = at > 200 ? cut.slice(0, at + 1) : cut;
    }
    return t;
  }
  function chunkText(t) {
    var parts = t.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [t];
    var out = [], cur = "";
    parts.forEach(function (p) {
      if (cur && (cur + p).length > 180) { out.push(cur.trim()); cur = ""; }
      cur += p;
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function speakText(raw) {
    if (!synth) return false;
    var text = speakable(raw);
    if (!text) return false;
    stopSpeaking();
    var chunks = chunkText(text);
    var seq = ++speakSeq;
    var voice = pickVoice();
    var young = profile.aud === "kid";
    speaking = true;
    setVoice("answering");
    var idx = 0;
    function next() {
      if (seq !== speakSeq) return;
      if (idx >= chunks.length) { endSpeaking(seq); return; }
      var u = new window.SpeechSynthesisUtterance(chunks[idx++]);
      u.lang = (voice && voice.lang) || "en-US";
      if (voice) u.voice = voice;
      u.rate = young ? 0.9 : 1;
      u.pitch = 1.1;
      u.onend = next;
      u.onerror = function (e) {
        var er = e && e.error;
        if (seq !== speakSeq || er === "canceled" || er === "interrupted") return;
        endSpeaking(seq);
      };
      try { synth.speak(u); } catch (e) { endSpeaking(seq); }
    }
    next();
    clearTimeout(speakGuard);
    speakGuard = setTimeout(function () { endSpeaking(seq); }, Math.max(8000, text.split(/\s+/).length * 600 + 4000));
    return true;
  }
  function endSpeaking(seq) {
    if (seq !== speakSeq) return;
    speaking = false;
    clearTimeout(speakGuard);
    if (app.getAttribute("data-voice") === "answering") setVoice("idle");
  }
  function stopSpeaking() {
    speakSeq++;
    clearTimeout(speakGuard);
    if (synth && (synth.speaking || synth.pending)) { try { synth.cancel(); } catch (e) {} }
    if (speaking) {
      speaking = false;
      if (app.getAttribute("data-voice") === "answering") setVoice("idle");
    }
  }
  function speakReply(text, viaVoice) {
    if (viaVoice && voiceOn && synth) {
      if (!speakText(text)) setVoice("idle");
    } else {
      setVoice("idle");
    }
  }
  function decorateReply(body, text) {
    if (!synth || !body) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "listen";
    b.setAttribute("aria-label", "Read this answer out loud");
    b.innerHTML = ic(SPK_ON) + "<span>Listen</span>";
    b.addEventListener("click", function () {
      if (listening) cancelVoice();
      unlockSpeech();
      speakText(text);
    });
    body.appendChild(b);
  }
  function setVoiceOn(on, persist) {
    voiceOn = on;
    var svg = voiceBtn.querySelector("svg");
    if (svg) svg.innerHTML = on ? SPK_ON : SPK_OFF;
    voiceBtn.setAttribute("aria-pressed", on ? "true" : "false");
    var tip = "Voice replies: " + (on ? "on" : "off");
    voiceBtn.setAttribute("aria-label", tip);
    voiceBtn.title = tip;
    var lbl = document.getElementById("voiceLbl");
    if (lbl) lbl.textContent = on ? " Voice on" : " Voice off";
    if (!on) stopSpeaking();
    if (persist) save("voice", on ? "on" : "off");
  }
  function initVoice() {
    micBtn.hidden = !SR;
    voiceBtn.hidden = !(SR && synth);
    if (SR && window.isSecureContext === false) micBlocked = "insecure";
    setVoiceOn(load("voice") !== "off", false);
    micBtn.addEventListener("click", onMic);
    voiceBtn.addEventListener("click", function () { unlockSpeech(); setVoiceOn(!voiceOn, true); });
    vstop.addEventListener("click", stopSpeaking);
    document.getElementById("vnoteOk").addEventListener("click", function () {
      noteOk = true;
      save("voice-ok", "1");
      hideNote();
      startListening();
    });
    document.getElementById("vnoteNo").addEventListener("click", hideNote);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { cancelVoice(); hideNote(); } });
    document.addEventListener("click", function (e) {
      if (!vnote.hidden && !vnote.contains(e.target) && !micBtn.contains(e.target)) hideNote();
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) cancelVoice(); });
    syncMicUi();
  }

  // ---- wiring
  form.addEventListener("submit", function (e) { e.preventDefault(); send(); });
  box.addEventListener("input", autosize);
  box.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  stopBtn.addEventListener("click", function () { if (ctl) ctl.abort(); });
  newChat.addEventListener("click", reset);
  initVoice();
  log.addEventListener("load", function (e) { if (e.target && e.target.tagName === "IMG") toBottom(); }, true);

  var savedSubject = load("subject");
  SUBJ.forEach(function (x) { if (x.s === savedSubject && !x.tip) subject = savedSubject; });
  profile.name = cleanName(load("name"));
  var savedAud = load("aud");
  profile.aud = (savedAud === "kid" || savedAud === "teen" || savedAud === "adult") ? savedAud : "";

  initPanels();
  updateMeBtn();
  addBot(render(greeting()), "hint");
  autosize();
  if (!/^https?:$/.test(location.protocol)) disableAll(NAME + " needs to be opened from its web address.");
})();
