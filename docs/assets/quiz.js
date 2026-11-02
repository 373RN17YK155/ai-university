/* ============================================================
   quiz.js — inline retrieval quiz, shared by every subject.
   Classic script → window.TEACH. Styles: teach.css (.t-quiz).

   TEACH.renderQuiz(containerElOrId, {
     questions: [
       { id: "q1",                      // stable string id
         q: "Question text (HTML allowed)",
         options: ["…", "…", "…"],      // HTML allowed
         answer: 0,                     // index into options AS WRITTEN
         why: "Shown after answering (HTML allowed)" }
     ]
   })

   · Options are shuffled per render, so position never leaks the answer.
   · Every option should be the same length so length can't leak it
     either. The engine can't write your options, but it warns in the
     console when one is more than ~25% longer than the shortest.
   · One try per question: the first click locks it and explains.
   · Returns { stop, reset }. A quiz holds no timers or key listeners,
     so stop() is a no-op — present for the engine contract.
   ============================================================ */
(function () {
  var TEACH = (window.TEACH = window.TEACH || {});

  function shuffled(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function textLength(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    return (d.textContent || "").length;
  }

  TEACH.renderQuiz = function (containerElOrId, cfg) {
    var host = typeof containerElOrId === "string" ? document.getElementById(containerElOrId) : containerElOrId;
    if (!host || !cfg || !cfg.questions) return { stop: function () {}, reset: function () {} };
    var qs = cfg.questions;

    qs.forEach(function (item) {
      var lens = item.options.map(textLength);
      var min = Math.min.apply(null, lens), max = Math.max.apply(null, lens);
      if (min > 0 && max / min > 1.25 && window.console) {
        console.warn("quiz " + (item.id || item.q) + ": option lengths " + lens.join("/") + " leak the answer");
      }
    });

    function render() {
      host.innerHTML = "";
      var root = document.createElement("div");
      root.className = "t-quiz";
      var answered = 0, right = 0;
      var score = document.createElement("p");
      score.className = "t-quiz-score";
      score.hidden = true;

      qs.forEach(function (item, qi) {
        var box = document.createElement("div");
        box.className = "t-q";
        if (item.id) box.id = item.id;
        var text = document.createElement("p");
        text.className = "t-q-text";
        text.innerHTML = (qi + 1) + ". " + item.q;
        box.appendChild(text);

        var opts = document.createElement("div");
        opts.className = "t-q-opts";
        var buttons = [];
        shuffled(item.options.length).forEach(function (oi) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "t-q-opt";
          b.innerHTML = item.options[oi];
          b.addEventListener("click", function () {
            buttons.forEach(function (x) {
              x.el.disabled = true;
              if (x.oi === item.answer) x.el.classList.add("is-right");
            });
            if (oi !== item.answer) b.classList.add("is-wrong");
            else right++;
            answered++;
            if (item.why) {
              var why = document.createElement("p");
              why.className = "t-q-why";
              why.innerHTML = (oi === item.answer ? "<b>Верно.</b> " : "<b>Нет.</b> ") + item.why;
              box.appendChild(why);
            }
            if (answered === qs.length) {
              score.hidden = false;
              score.textContent = "Итог: " + right + " из " + qs.length;
              var again = document.createElement("button");
              again.type = "button";
              again.className = "t-quiz-retry";
              again.textContent = "Ещё раз";
              again.addEventListener("click", render);
              score.appendChild(again);
            }
          });
          buttons.push({ el: b, oi: oi });
          opts.appendChild(b);
        });
        box.appendChild(opts);
        root.appendChild(box);
      });

      root.appendChild(score);
      host.appendChild(root);
    }

    render();
    return { stop: function () {}, reset: render };
  };
})();
