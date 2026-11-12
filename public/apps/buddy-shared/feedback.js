(function () {
  'use strict';
  fetch('/api/public/feedback').then(function (r) { return r.json(); }).then(function (data) {
    var app = data.apps.find(function (a) { return a.href && a.href !== '/' && location.pathname.replace(/\/$/, '/index.html') === a.href; });
    if (!app) return;
    var style = document.createElement('style');
    style.textContent = '.family-feedback-link{position:fixed;right:14px;bottom:14px;z-index:1000;padding:8px 12px;border:1px solid var(--border,var(--line));border-radius:8px;background:var(--card,var(--paper));color:var(--foreground,var(--ink));font:600 13px system-ui;text-decoration:none}.family-quick-feedback{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.family-quick-feedback a{font:13px system-ui;color:inherit;text-decoration:none;border:1px solid var(--border,var(--line));border-radius:6px;padding:5px 9px}';
    document.head.appendChild(style);
    var link = document.createElement('a'); link.href = '/feedback?app=' + encodeURIComponent(app.slug); link.textContent = '💬 Feedback'; link.className = 'family-feedback-link'; document.body.appendChild(link);
    var pending = new WeakSet();
    function attach(node) {
      if (!node.isConnected || node.querySelector('.family-quick-feedback') || !node.textContent.trim() || node.querySelector('.dots,.err') || /thinking|let me think/i.test(node.textContent)) return;
      var group = document.createElement('div'); group.className = 'family-quick-feedback'; group.setAttribute('aria-label', 'Rate this response');
      [true, false].forEach(function (helpful) {
        var a = document.createElement('a'); a.href = '/feedback?app=' + encodeURIComponent(app.slug); a.textContent = helpful ? '👍 Helpful' : '👎 Not Helpful';
        a.addEventListener('click', function (event) {
          event.preventDefault();
          var iframe = document.createElement('iframe'); iframe.src = '/feedback-quick?app=' + encodeURIComponent(app.slug) + '&helpful=' + helpful; iframe.title = 'Quick feedback'; iframe.style.cssText = 'width:100%;height:220px;border:0'; group.replaceChildren(iframe);
        }); group.appendChild(a);
      }); node.appendChild(group);
    }
    function scan() {
      document.querySelectorAll('.msg.bot:not(.hint) .body, #bubble').forEach(function (node) {
        if (pending.has(node) || node.querySelector('.family-quick-feedback')) return;
        pending.add(node); setTimeout(function () { pending.delete(node); attach(node); }, 500);
      });
    }
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true }); scan();
  }).catch(function () {});
})();