/* Shared "Show me a picture" button for all buddies. Streams a picture or
   diagram from /api/public/picture and reveals it as it sharpens. */
(function () {
  if (window.BuddyPicture) return;
  var css = document.createElement("style");
  css.textContent =
    ".pic-btn{margin-top:8px;font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;opacity:.85}" +
    ".pic-btn:hover{opacity:1}.pic-btn[disabled]{opacity:.5;cursor:wait}" +
    ".pic-wrap{margin-top:8px}.pic-wrap img{display:block;max-width:100%;width:420px;border-radius:12px;transition:filter .6s}" +
    ".pic-wrap img.partial{filter:blur(18px)}.pic-note{font-size:12.5px;opacity:.75;margin-top:4px}";
  document.head.appendChild(css);

  function strip(t) { return String(t || "").replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(); }

  async function request(question, answer, onFrame) {
    var send = function (stream) {
      return fetch("/api/public/picture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question, answer: answer, stream: stream })
      });
    };
    var res = await send(true);
    if (!res.ok || !res.body) throw new Error(res.status === 402 ? "Out of picture credits for now." : res.status === 429 ? "Too many pictures right now — try again in a minute." : "Couldn't draw a picture this time.");
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = "";
    var sawAny = false, done = false, err = null;
    function handle(block) {
      var ev = "", data = "";
      block.split("\n").forEach(function (l) {
        if (l.indexOf("event:") === 0) ev = l.slice(6).trim();
        else if (l.indexOf("data:") === 0) data += l.slice(5).trim();
      });
      if (!data) return;
      var p; try { p = JSON.parse(data); } catch (e) { return; }
      var type = ev || p.type;
      if (type === "error" || p.type === "error") { sawAny = true; err = (p.error && p.error.message) || "Couldn't draw a picture."; return; }
      if (type !== "image_generation.partial_image" && type !== "image_generation.completed") return;
      sawAny = true;
      if (!p.b64_json) { err = "No picture came back."; return; }
      var fin = type === "image_generation.completed";
      onFrame("data:image/png;base64," + p.b64_json, fin);
      if (fin) done = true;
    }
    for (;;) {
      var r = await reader.read();
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true }).replace(/\r\n/g, "\n");
      var i;
      while ((i = buf.indexOf("\n\n")) !== -1) { handle(buf.slice(0, i)); buf = buf.slice(i + 2); }
    }
    if (buf.trim()) handle(buf);
    if (err) throw new Error(err);
    if (!sawAny) {
      var rp = await send(false);
      if (!rp.ok) throw new Error("Couldn't draw a picture this time.");
      var j = await rp.json();
      var b64 = j && j.data && j.data[0] && j.data[0].b64_json;
      if (!b64) throw new Error("No picture came back.");
      onFrame("data:image/png;base64," + b64, true);
      return;
    }
    if (!done) throw new Error("The picture didn't finish. Try again.");
  }

  window.BuddyPicture = {
    add: function (body, question, answer) {
      if (!body || !answer) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pic-btn";
      btn.textContent = "🎨 Show me a picture";
      btn.addEventListener("click", async function () {
        btn.disabled = true;
        btn.textContent = "🎨 Drawing…";
        var wrap = document.createElement("div");
        wrap.className = "pic-wrap";
        var img = document.createElement("img");
        img.alt = "Picture explaining the answer";
        img.className = "partial";
        wrap.appendChild(img);
        body.appendChild(wrap);
        try {
          await request(strip(question).slice(0, 300), strip(answer).slice(0, 600), function (url, fin) {
            img.src = url;
            img.className = fin ? "" : "partial";
          });
          var n = document.createElement("p");
          n.className = "pic-note";
          n.textContent = "AI-drawn picture — labels can have mistakes.";
          wrap.appendChild(n);
          btn.remove();
        } catch (e) {
          wrap.remove();
          btn.disabled = false;
          btn.textContent = "🎨 Try the picture again";
          var m = document.createElement("p");
          m.className = "pic-note";
          m.textContent = e.message;
          body.appendChild(m);
        }
      });
      body.appendChild(btn);
    }
  };
})();
