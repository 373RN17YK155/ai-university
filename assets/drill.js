/* ============================================================
   drill.js — the careful trainer, shared by every subject.
   Classic script → window.TEACH. Styles: teach.css (.t-drill).

   TEACH.runDrill(stage, {
     title: "optional heading",
     items: [
       { id: "sig-total",               // stable string id
         prompt: "HTML shown as the question",
         options: ["…", "…", "…"],      // HTML allowed
         answer: 0,                     // index into options AS WRITTEN
         why: "optional HTML shown after a miss" }
     ],
     rounds: 10                         // optional: cap per run (default: all)
   })

   · Item mode, choice input. Items and options are shuffled each run.
   · A miss is requeued a few cards later, so every run ends with
     each item answered right once. The score counts FIRST tries.
   · Keys: 1–9 pick an option, Enter goes on. One keyboard, one owner:
     the drill takes TEACH._active while it runs, and ignores keys
     while another engine holds it.
   · Returns { stop } — closing the trainer must call it (toolpage.js
     does), or the hidden drill keeps its key listener.
   ============================================================ */
(function () {
  var TEACH = (window.TEACH = window.TEACH || {});

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  TEACH.runDrill = function (stage, cfg) {
    var token = {};
    var queue, current, firstTry, missed, done, total, awaitingNext, onNext;

    function start() {
      TEACH._active = token;
      var items = shuffle(cfg.items);
      if (cfg.rounds && cfg.rounds < items.length) items = items.slice(0, cfg.rounds);
      queue = items;
      total = items.length;
      firstTry = 0;
      done = 0;
      missed = {};
      next();
    }

    function next() {
      awaitingNext = false;
      onNext = null;
      if (!queue.length) return finish();
      current = queue.shift();
      render();
    }

    function render() {
      stage.innerHTML = "";
      var box = el("div", "t-drill");
      if (cfg.title) box.appendChild(el("p", "t-drill-title", cfg.title));
      box.appendChild(el("p", "t-drill-progress", "Верно: " + done + " из " + total));
      box.appendChild(el("div", "t-drill-prompt", current.prompt));

      var opts = el("div", "t-drill-opts");
      var order = shuffle(current.options.map(function (_, i) { return i; }));
      var buttons = [];
      order.forEach(function (oi, pos) {
        var b = el("button", "t-drill-opt", "<span class=\"t-drill-key\">" + (pos + 1) + "</span>" + current.options[oi]);
        b.type = "button";
        b.addEventListener("click", function () { pick(oi); });
        buttons.push({ el: b, oi: oi });
        opts.appendChild(b);
      });
      box.appendChild(opts);
      var feedback = el("div", "t-drill-feedback");
      box.appendChild(feedback);
      stage.appendChild(box);

      function pick(oi) {
        if (awaitingNext) return;
        TEACH._active = token;
        buttons.forEach(function (x) {
          x.el.disabled = true;
          if (x.oi === current.answer) x.el.classList.add("is-right");
        });
        var right = oi === current.answer;
        if (right) {
          if (!missed[current.id]) firstTry++;
          done++;
          feedback.innerHTML = "<b>Верно.</b>";
        } else {
          buttons.forEach(function (x) { if (x.oi === oi) x.el.classList.add("is-wrong"); });
          missed[current.id] = true;
          var at = Math.min(queue.length, 2 + Math.floor(Math.random() * 2));
          queue.splice(at, 0, current);
          feedback.innerHTML = "<b>Нет.</b> " + (current.why || "") + " Карточка вернётся чуть позже.";
        }
        var go = el("button", "t-drill-next", "Дальше ⏎");
        go.type = "button";
        go.addEventListener("click", next);
        feedback.appendChild(go);
        awaitingNext = true;
        onNext = next;
        go.focus();
      }
      current._pick = function (pos) { if (buttons[pos]) pick(buttons[pos].oi); };
    }

    function finish() {
      stage.innerHTML = "";
      var box = el("div", "t-drill");
      box.appendChild(el("p", "t-drill-score",
        "С первой попытки: " + firstTry + " из " + total));
      var again = el("button", "t-drill-next", "Ещё раз");
      again.type = "button";
      again.addEventListener("click", start);
      box.appendChild(again);
      stage.appendChild(box);
      current = null;
    }

    function onKey(e) {
      if (TEACH._active !== token || !stage.isConnected) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "Enter" && awaitingNext && onNext) {
        e.preventDefault();
        onNext();
        return;
      }
      var n = parseInt(e.key, 10);
      if (!awaitingNext && current && n >= 1 && n <= 9) {
        e.preventDefault();
        current._pick(n - 1);
      }
    }

    document.addEventListener("keydown", onKey);
    start();

    return {
      stop: function () {
        document.removeEventListener("keydown", onKey);
        if (TEACH._active === token) TEACH._active = null;
      },
      restart: start
    };
  };
})();
