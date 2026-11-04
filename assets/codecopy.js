/* ============================================================
   codecopy.js — a «Копировать» button on every code block.
   Classic script, no API: link it from any lesson, reference
   card or tool and every <pre> on the page gets the button.
   Styles: teach.css (.t-copy).

   · Copies the block's plain text: highlighting spans are
     dropped, line breaks kept.
   · Skips code inside TEACH widgets (a drill prompt is a
     question, not something to paste) and any <pre> under
     [data-no-copy].
   · Clipboard API where the page is a secure context (the site,
     and file:// in Chrome); falls back to execCommand otherwise.
   ============================================================ */
(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy refused"));
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }

  function decorate(pre) {
    if (pre.closest(".t-drill, .t-quiz, [data-no-copy]")) return;
    if (pre.parentNode.classList && pre.parentNode.classList.contains("t-copy-wrap")) return;

    var wrap = document.createElement("div");
    wrap.className = "t-copy-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "t-copy";
    button.textContent = "Копировать";
    button.setAttribute("aria-label", "Скопировать код");
    var reset = null;
    button.addEventListener("click", function () {
      copyText(pre.textContent).then(
        function () { flash("Скопировано"); },
        function () { flash("Не вышло"); }
      );
    });
    function flash(label) {
      button.textContent = label;
      button.classList.add("is-done");
      clearTimeout(reset);
      reset = setTimeout(function () {
        button.textContent = "Копировать";
        button.classList.remove("is-done");
      }, 1500);
    }
    wrap.appendChild(button);
  }

  function ready() {
    var blocks = document.querySelectorAll("pre");
    for (var i = 0; i < blocks.length; i++) decorate(blocks[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
