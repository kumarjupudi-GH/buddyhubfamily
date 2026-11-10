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
    var res = await send(false);
    if (!res.ok) throw new Error(await res.text() || "Couldn't draw a picture this time.");
    var data = await res.json();
    var image = data && data.data && data.data[0];
    if (!image || !image.b64_json) throw new Error("No completed picture came back.");
    onFrame("data:image/png;base64," + image.b64_json, true);
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
