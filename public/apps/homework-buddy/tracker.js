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
  // Independent app usage never inherits a student selected in an earlier session.
  var active = "__independent__";

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

})();
