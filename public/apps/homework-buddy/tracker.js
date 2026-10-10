// Shared kid tracker for BrainBoost Buddy and ArtBuddy — stores each child's activity on this device for 7 days (parent /parent, teacher /teacher).
(function () {
  var KEY = "bb_progress_v1";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  var WEEK = 7 * 24 * 3600 * 1000;
  function prune(d) {
    var cut = Date.now() - WEEK;
    Object.keys(d.log || {}).forEach(function (k) { d.log[k] = d.log[k].filter(function (e) { return e.t >= cut; }); });
  }
  function save(d) {
    prune(d);
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) {
      // storage full: drop the oldest drawings first
      Object.keys(d.log).forEach(function (k) { var i = d.log[k].findIndex(function (x) { return x.img; }); if (i >= 0) d.log[k].splice(i, 1); });
      try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e2) {}
    }
  }
  function data() {
    var d = load();
    d.children = d.children || [];
    d.log = d.log || {};
    return d;
  }
  var active = null;
  try { active = sessionStorage.getItem("bb_active_child"); } catch (e) {}

  window.BBTrack = {
    child: function () {
      var d = data();
      return d.children.filter(function (c) { return c.id === active; })[0] || null;
    },
    record: function (role, text, subject) {
      if (!active) return;
      var d = data();
      (d.log[active] = d.log[active] || []).push({ t: Date.now(), app: "brainboost", role: role, text: String(text || "").slice(0, 8000), subject: subject || "" });
      save(d);
    },
    drawing: function (name, img) {
      if (!active) return;
      var d = data();
      (d.log[active] = d.log[active] || []).push({ t: Date.now(), app: "artbuddy", role: "drawing", text: String(name || "Drawing"), subject: "Art", img: img });
      save(d);
    }
  };

  function css() {
    var s = document.createElement("style");
    s.textContent =
      "#bbPick{position:fixed;inset:0;z-index:9999;background:rgba(20,20,40,.75);display:flex;align-items:center;justify-content:center;font-family:inherit}" +
      "#bbPick .card{background:#fff;color:#222;border-radius:20px;padding:28px;max-width:420px;width:92%;text-align:center}" +
      "#bbPick h2{margin:0 0 6px;font-size:24px}#bbPick p{margin:0 0 18px;color:#555}" +
      "#bbPick .kids{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}" +
      "#bbPick button{padding:16px 10px;border-radius:14px;border:2px solid #ddd;background:#f7f7fb;font-size:17px;font-weight:600;cursor:pointer}" +
      "#bbPick button:hover{border-color:#6c5ce7}#bbPick a{display:inline-block;margin-top:18px;color:#6c5ce7;font-size:14px}" +
      "#bbWho{position:fixed;right:12px;bottom:12px;z-index:9998;background:#fff;border:1px solid #ddd;border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer}";
    document.head.appendChild(s);
  }
  function pick() {
    var d = data();
    var o = document.createElement("div");
    o.id = "bbPick";
    var html = '<div class="card"><h2>Who\'s learning today?</h2>';
    if (!d.children.length) {
      html += "<p>No profiles yet. Ask a parent or teacher to add you.</p>";
    } else {
      html += "<p>Tap your name to start.</p><div class=\"kids\"></div>";
    }
    html += '<a href="/parent" target="_top">Parent Dashboard</a> · <a href="/teacher" target="_top">Teacher Dashboard</a></div>';
    o.innerHTML = html;
    var kids = o.querySelector(".kids");
    d.children.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = c.name;
      b.onclick = function () {
        active = c.id;
        try { sessionStorage.setItem("bb_active_child", c.id); } catch (e) {}
        try { if (window.BB_RELOAD_ON_NAME !== false && localStorage.getItem("bb-name") !== c.name) { localStorage.setItem("bb-name", c.name); if (window.BB_RELOAD_ON_NAME !== false) { location.reload(); return; } } } catch (e) {}
        o.remove();
        badge();
      };
      kids.appendChild(b);
    });
    document.body.appendChild(o);
  }
  function badge() {
    var c = window.BBTrack.child();
    var old = document.getElementById("bbWho");
    if (old) old.remove();
    if (!c) return;
    var b = document.createElement("button");
    b.id = "bbWho";
    b.type = "button";
    b.textContent = "👤 " + c.name + " · switch";
    b.onclick = function () {
      active = null;
      try { sessionStorage.removeItem("bb_active_child"); } catch (e) {}
      b.remove();
      pick();
    };
    document.body.appendChild(b);
  }
  document.addEventListener("DOMContentLoaded", function () {
    css();
    if (window.BBTrack.child()) badge(); else pick();
  });
})();
