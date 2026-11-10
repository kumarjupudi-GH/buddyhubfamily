(function () {
  var iframe = document.createElement("iframe");
  iframe.src = "/ai-bridge"; iframe.hidden = true; iframe.title = "Private AI connection";
  var resolveReady;
  var ready = new Promise(function (resolve) { resolveReady = resolve; });
  var pending = new Map();
  window.addEventListener("message", function (event) {
    if (event.origin !== location.origin || event.source !== iframe.contentWindow) return;
    if (event.data && event.data.type === "buddy-ai-ready") resolveReady();
    if (event.data && event.data.type === "buddy-ai-result") {
      var callback = pending.get(event.data.id);
      if (callback) { pending.delete(event.data.id); callback(event.data); }
    }
  });
  document.body.appendChild(iframe);
  var current = null;
  try { current = JSON.parse(localStorage.getItem("family-ai-model") || "null"); } catch (_) {}
  function request(path, body, signal) {
    return ready.then(function () { return new Promise(function (resolve, reject) {
      if (signal && signal.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
      var id = crypto.randomUUID();
      function cancel() { pending.delete(id); iframe.contentWindow.postMessage({ type: "buddy-ai-cancel", id: id }, location.origin); reject(new DOMException("Cancelled", "AbortError")); }
      pending.set(id, function (data) {
        if (signal) signal.removeEventListener("abort", cancel);
        resolve(new Response(JSON.stringify(data.body), { status: data.status, headers: { "content-type": "application/json" } }));
      });
      if (signal) signal.addEventListener("abort", cancel, { once: true });
      iframe.contentWindow.postMessage({ type: "buddy-ai-request", id: id, path: path, body: body }, location.origin);
    }); });
  }
  window.BuddyAI = { fetch: function (path, options) {
    var body = JSON.parse(options.body || "{}");
    body.selection = current;
    return request(path, body, options.signal);
  } };
  var bar = document.createElement("div"); bar.className = "buddy-ai-picker";
  bar.innerHTML = '<label for="family-model">AI model</label><select id="family-model" aria-label="AI model"><option value="">Loading your models…</option></select><a href="/my-ai">My AI accounts ↗</a><span class="ai-account-status" role="status"></span>';
  var header = document.querySelector("header");
  if (header) header.insertAdjacentElement("afterend", bar); else document.body.insertBefore(bar, document.body.firstChild);
  var style = document.createElement("link"); style.rel = "stylesheet"; style.href = "/apps/buddy-shared/ai-picker.css"; document.head.appendChild(style);
  var select = bar.querySelector("select");
  select.addEventListener("change", function () {
    current = select.value ? JSON.parse(select.value) : null;
    localStorage.setItem("family-ai-model", JSON.stringify(current));
  });
  request("/api/public/ai-account", { action: "status" }).then(function (r) { return r.json().then(function (data) {
    select.replaceChildren();
    var empty = document.createElement("option"); empty.value = ""; empty.textContent = "Choose a model"; select.appendChild(empty);
    if (data.connections) data.connections.forEach(function (connection) {
      connection.models.forEach(function (model) {
        var option = document.createElement("option"); option.value = JSON.stringify({ provider: connection.provider, model: model });
        option.textContent = ({ chatgpt: "OpenAI", claude: "Claude", gemini: "Gemini" }[connection.provider]) + " · " + model;
        select.appendChild(option);
        if (current && current.provider === connection.provider && current.model === model) option.selected = true;
      });
    });
    if (select.options.length === 1) {
      current = null; empty.textContent = "Connect your AI account";
      bar.querySelector(".ai-account-status").textContent = r.status === 401 ? "Sign in to choose models" : "No models available";
    } else if (!select.value) current = null;
  }); }).catch(function () { select.options[0].textContent = "AI connection unavailable"; });
})();