# Shared assets

Generic engines shared by every subject, under the `window.TEACH` namespace. They're grown on
demand: write an engine when the first lesson needs it, and promote a subject component here when a
second subject wants it. Planned/expected engines: `store.js` (per-item mastery, `localStorage`
prefix `teach:`), `drill.js` (`TEACH.runDrill`), `speeddrill.js` (`TEACH.speedDrill`), `quiz.js`
(`TEACH.renderQuiz`, every answer the same length), `recall.js` (`TEACH.recallPad`), `teach.css`
(widget structure incl. the `.t-trainer` block). Present today: `toolpage.js` (`TEACH.trainer`), `quiz.js` (`TEACH.renderQuiz`), `drill.js`
(`TEACH.runDrill`), `codecopy.js` (copy button on every `<pre>`, no API: just link it), `teach.css`.

## Engine contract

- Link order in a lesson: `../assets/<subject>.css` (defines tokens
  `--accent --accent-2 --good --bad --ink --muted --bg --bg-sunk --rule --sans --serif`), then
  `../../assets/teach.css`, then the engine scripts. Tool pages sit at the same depth, so the paths
  are identical; they add `../../assets/toolpage.js` last.
- Items are plain objects with stable string `id`s. Resolve domain specs before handing them over.
- Audio is a function: `play: function () {…}` wrapping the subject's own player. Engines never
  import an audio library.
- One keyboard, one owner: `drill.js` and `speeddrill.js` share a `TEACH._active` token. Every
  engine returns an api with `stop()`.
- Closed means stopped: a trainer's `mount` returns `{stop}` if it holds timers, loops or
  document-level key listeners, and `toolpage.js` calls it when the trainer closes.
- Improvements land here, never in a local fork. Older lessons keep the local copies they link
  (frozen forks: bug fixes only).
- Self-contained: no CDN, no external CSS, no absolute paths, system fonts.
