# AI teaching workspaces (an extended teach skill)

A multi-subject learning system run by a coding agent. Each subject you're learning (music theory,
violin repair, reading, a language) is a folder the agent keeps up to date: a mission, lessons as
self-contained HTML, reference cards, practice tools, real-world projects, and private learning
records. The loop: you say what you want to learn, the agent builds a lesson, tool or task, you do
it and report back, and the agent updates the workspace. It's built on
[Matt Pocock's `teach` skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach)
and adds cross-subject state, a `lessons` CLI and terminal picker, projects, stateless tools and
skill pages, a shared library of drill engines, a password-protected mobile site that redeploys on
every push, and an anti-sycophancy calibration. It also includes optional extras from the author's
reading workspace: a "book club" debrief ritual that feeds a notes vault, and a Libby availability
checker for your reading list.

The author's subjects (music theory, violin making, books) appear throughout as examples, but the
system doesn't depend on them. _Fitting it to your subjects_ (inside the implementing-agent section)
maps each of the author's workspaces to a general pattern, so a Rust, Spanish or gardening
workspace gets the pieces that suit it.

**Stack:** Claude Code (any agent that loads `CLAUDE.md`/skills works), Python 3 standard library
only (no pip installs), plain HTML/CSS/JS with no build step or CDN, git + GitHub, and Netlify for
the mobile site. The author runs macOS with fish; nothing here depends on fish.

---

## Quick reference

### Starting a session

| You want to…                                          | Do this                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Learn inside a subject                                | `cd ~/teaching/<subject> && claude --add-dir ..` then `/teach` (with or without a topic)                               |
| Start a new subject                                   | `mkdir ~/teaching/<subject>`, cd in, `claude --add-dir ..`, `/teach`. It writes `MISSION.md` first by interviewing you |
| Work on the system itself (CLI, site, shared engines) | Start `claude` at `~/teaching` (the root), not in a subject                                                            |

### The `lessons` CLI

| Command                                          | What it does                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `lessons`                                        | Open every **active** item in the browser                                          |
| `lessons ui`                                     | Terminal picker: every subject, active items first                                 |
| `lessons ls`                                     | Print everything with status and the agent's notes (no browser)                    |
| `lessons set <frag> active\|done [--note "..."]` | Set status. `<frag>` is any unique path/title tokens: `reading/0002`, `rapid fire` |
| `lessons tools`                                  | List every subject's tools                                                         |
| `lessons tools <frag>`                           | Open one tool: `lessons tools rhythm`                                              |
| `lessons --help`                                 | Usage                                                                              |

**`lessons ui` keys:** `↑/↓` or `j/k` move · `space` toggles an item active/done or folds a subject ·
`←/→` or `h/l` fold/unfold · `o`/`Enter` open · `a` open all active · `r` reload · `q`/`Esc` quit.

You rarely run `set` yourself. **The agent keeps state from the conversation.** You never have to
mark anything done.

### The typical loops

| Loop                              | What you say                                                                       | What the agent does                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Next lesson                       | "next lesson" / "what should I learn next?"                                        | Reads mission + learning records, builds `lessons/000N-*.html`, opens it, marks the previous one done, commits and pushes |
| Report back                       | "did the drill, median 2.4 s, kept missing F♯"                                     | Writes a learning record, updates the active item's note, adjusts the next lesson                                         |
| New trainer                       | (happens with any lesson that has a drill)                                         | Copies it onto the subject's skill page in `tools/` in the same session                                                   |
| Project step                      | "did the glue test, photos in pictures/"                                           | Updates `projects/<date>-<name>/0000-plan.html`, writes the next step doc                                                 |
| Debrief (ideas subjects)          | "debrief me on _Dracula_" (or a paper, talk, course module), then talk from memory | Asks why, pushes back, searches your notes vault for connections, writes the notes itself                                 |
| Library check (reading, optional) | `./libby` in `reading/`                                                            | Shows what on your to-read list is borrowable now, the queue length, or not held                                          |
| Phone                             | Open your Netlify URL                                                              | Home = everything active; a page per subject with tabs Now / Tools / Reference / Projects / Lessons                       |

### Site

| Command                                              | What it does                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `python3 site/build.py`                              | Build to `site/dist/` (Netlify runs the same command)                            |
| `python3 site/build.py && open site/dist/index.html` | Local preview (`xdg-open` on Linux)                                              |
| `git push` to `main`                                 | Publishes. The agent does this at the end of every session that changed anything |

---

## What this is and why

**The problem.** A chat LLM is a teacher with amnesia. Every question gets answered as if a stranger
on the internet asked it: no idea of your level, your goal, what you did last week, or what you keep
getting wrong. And it answers from its own memory, which is unreliable in exactly the niche,
practitioner-held topics you'd most want help with.

**The fix from the original `teach` skill.** Keep the learning state in files the agent reads at the
start of every session, the way a codebase carries its own context:

- `MISSION.md`: why you're learning this and what success looks like. Every lesson is grounded in it.
- `learning-records/`: what you've learned, struggled with and decided, in the style of an ADR. The
  agent uses them to find your zone of proximal development.
- `RESOURCES.md`: vetted external sources. The skill forbids trusting its parametric knowledge, and
  lessons are "littered with citations", so you also end up discovering good primary sources.
- `lessons/`, `reference/`: short, beautiful, self-contained HTML lessons with feedback loops, plus
  print-and-keep cards.
- `NOTES.md`: the agent's scratchpad for your preferences.

**What this setup adds.** The original is a pedagogy document for one subject in one folder. Used
across several subjects for months, it needed:

1. **Cross-subject state and zero-friction opening.** `state.json` in the parent holds only
   active/done status. The `lessons` CLI and TUI answer "what do I open when I sit down?" across all
   subjects.
2. **Projects.** Real-world work, like restoring a violin, gets a standing plan doc plus numbered
   step docs, next to the lessons.
3. **Tools and skill pages.** Every replayable trainer a lesson builds is copied onto a
   per-skill practice page, so drills don't get buried in finished lessons.
4. **A shared engine library.** Generic drill, speed-drill, quiz, recall and spaced-mastery engines
   live in the parent `assets/` and are reused by every subject.
5. **A mobile site.** Everything is static HTML, so it's mirrored to a password-protected Netlify
   site that redeploys on every push. That's how you get project plans in the garage and trainers on
   your phone.
6. **An audience firewall.** Some files are agent-only because they hold predictions the method
   depends on you not reading. The site builder enforces this.
7. **An anti-sycophancy calibration.** Agreeable models give in on judgement calls as soon as you
   push back. A few rules in the root `CLAUDE.md` make the agent hold its ground where the
   disagreement is real, in every subject.
8. **Extras for ideas-heavy subjects (from the author's reading workspace).** A four-step debrief
   ritual that writes into your notes vault for you, a to-read list, and a Libby checker.

It works best for knowledge-heavy subjects (music theory, history, reading, a programming language's
concepts) and as a planner/coach for hands-on ones. It doesn't replace a human teacher for physical
technique.

---

## For the implementing agent (read this first)

> **Default: build this as specified, then check in about variations.**
> The reader most likely saw this demonstrated and wants the same thing. Reproduce it as
> described. The defaults encode decisions arrived at by hitting the problems in _Known gotchas_.
> Treat them as load-bearing.
>
> **Do not open with "so which parts would you like?"** That dumps design work on someone who
> just wants it working. Instead:
>
> 1. **State the plan and confirm it** in one question, phrased so "yes, all of it" is the easy
>    answer. For example:
>    _"I'll set up a teaching root at `~/teaching` with the extended teach skill, the `lessons` CLI,
>    the shared drill engines, and a git repo that publishes a password-protected mobile site on
>    Netlify. Then we'll start your first subject. What do you want to learn first?"_
>
>     You need the subject's name because install step 2 creates its folder. Everything else about the
>     subject (why, goals, level) comes from the `/teach` interview, not from you.
>
> 2. **Interview only where their environment forces a decision.** These are _compatibility_
>    questions, not preference questions:
>
>     - OS: the CLI calls macOS `open`. On Linux use `xdg-open`; on Windows, `os.startfile`/WSL.
>     - Shell: the global `lessons` command is a fish function for the author. Use a bash/zsh alias or
>       a symlink on `PATH` instead.
>     - Agent: if it isn't Claude Code, find its equivalent of `--add-dir` and of user-level skills.
>     - Hosting: does Netlify's site password protection fit their plan? If not, ask what they'd use.
>
>     Don't silently substitute. Ask, then adapt.
>
> 3. **Call out the genuinely optional pieces** so opting out is cheap and informed: the mobile site
>    (Module 5), the extras for ideas-heavy subjects (Module 6, offered when a subject fits the ideas
>    pattern below: do they want a reading list, and is their library on Libby?), and the notes vault
>    (Module 7: do they already keep one, or should one be created?).
> 4. **Then invite variations**, and build them if asked. Don't propose a redesign unprompted.
>
> Deviate when the user asks or their environment requires it, not because something looks tidier.
> That's how the gotchas get reintroduced.

The modules are independent, so a user who wants only part of this can have it. That's their call,
not your opening move.

**Do not write the user's `MISSION.md` for them.** The first `/teach` in a new subject should
interview them. The mission is the one thing that can't be templated.

### Fitting it to your subjects

The _system_ (Modules 1–5) is the same for every subject. What changes is which pieces a subject
leans on. Each of the author's workspaces is an instance of one general pattern:

| Pattern         | How to recognise it                                                                        | What it leans on                                                                                                    | The author's instance                                                                          | Other examples                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Skill-heavy** | Success means doing it fast, accurately and without thinking: recognition, recall, fluency | Short lessons that each introduce a **trainer**; skill pages in `tools/`; speed drills; spaced mastery (`store.js`) | Music theory: interval, rhythm and chord trainers, ear training, a fingerboard trainer         | Vocabulary, kana, conjugations; a language's syntax and standard library; vim or shortcuts; chess tactics; mental maths |
| **Hands-on**    | The learning is applied to a real thing, one step at a time                                | **Projects** (standing plan + step docs + pictures); lessons written to unblock the next step                       | Lutherie: each broken violin gets a project whose plan serves the mission, not just the repair | A side-project app, a homelab build, a garden bed, a renovation, a first PCB                                            |
| **Ideas-heavy** | The material is arguments, history, interpretation and trade-offs                          | **Debriefs** (Module 6), recall pads, a notes vault (Module 7), and the calibration does the most work here         | Reading: a book-club debrief after each book, with connections pulled from years of notes      | Papers, conference talks, system design, history, philosophy, a course's lecture series                                 |

- **Most subjects mix patterns.** Music theory is skill-heavy with a listening track that's closer
  to ideas. Lutherie is hands-on with a few lessons. Learning Rust might use all three: trainers for
  reading borrow-checker errors, a project building a real CLI, and debriefs on chapters of the book.
- **Decide per subject, right after the mission**, and write the choice into that subject's
  `NOTES.md` so later sessions keep to it. The root `CLAUDE.md` (1b) tells every `/teach` session to
  do this.
- **Don't copy the author's extras into subjects they don't fit.** A kana workspace doesn't need a
  to-read list, and a skill-heavy subject shouldn't be writing notes into a vault (Module 7).

---

## Known gotchas

All of these are **load-bearing. Don't simplify them away.** Each was hit in real use.

### G1. A subject session can't reach the parent unless you add it (Module 1)

- **Symptom:** the agent adds lessons fine but never marks old ones done, or can't fix a shared
  engine. `state.json` quietly stops tracking reality.
- **Cause:** `/teach` treats the **cwd** as the workspace, so sessions start inside the subject
  folder. But `state.json`, `lessons` and shared `assets/` live in the **parent**, and file access
  stops at the subtree. Project settings don't walk up either.
- **Fix:** always start with `claude --add-dir ..` from the subject folder. Put this in the root
  `CLAUDE.md`, which _does_ load from subfolders because memory files walk up. Never start a
  learning session at the root, because `/teach` would treat the root as a workspace.

### G2. The agent can't call `lessons` by name (Module 2)

- **Symptom:** `lessons: command not found` inside agent sessions, though it works in your terminal.
- **Cause:** shell functions and aliases aren't on the agent's non-interactive `PATH`.
- **Fix:** agents call it by path (`../lessons set …` from a subject folder). Say so in the root
  `CLAUDE.md`. A symlink into a `PATH` directory also works.

### G3. The filesystem is the source of truth; `state.json` holds only status (Module 2)

- **Symptom (if violated):** stale titles, ghost items, lists that drift.
- **Rule:** `state.json` is `{version, items: {"<subject>/<kind>/<file>": {status, updated, note}}, updated}`
  and nothing else. Titles come from each file's `<title>`, order from the numeric prefix, and
  existence from the directory scan. A new lesson shows up without registration and a deleted one
  disappears. Don't add titles, order or lists to state.

### G4. Defaults differ by kind, on purpose (Module 2)

- Lessons and projects are **active until marked done**. Reference is **done until marked active**.
  Tools have **no status at all**. Three answers for three lifecycles. It isn't an inconsistency to
  harmonise: a new lesson should appear live, and a new glossary shouldn't clutter "what's live".

### G5. Tools are stateless, deliberately (Modules 2, 3)

- Tools never appear in `state.json`, `lessons ls`, `lessons ui` or the site's Home feed. Only
  `lessons tools` knows them (the CLI keeps `tools` out of `KIND_DIRS` and has its own
  `scan_tools()`). This looks like an omission, but "active tool" was rejected as state nobody would
  maintain, and an always-active tool never clears. A lesson stays active while its drill is in
  rotation, and **the lesson's `note`** says what's being waited on.
- Number a new tool **from the directory listing**, not from `lessons tools`. Site-generated views
  share the numbering but aren't HTML files on disk.

### G6. Trainers are copied into tools, never shared (Module 3)

- **Temptation:** point the lesson and the skill page at one trainer definition to "remove
  duplication".
- **Why not:** a lesson's prose is written around specific parameters ("aim for a median under
  ~2 s"), and your reported results only stay comparable if the lesson never changes. Tools must be
  free to evolve. A shared definition means improving a tool silently rewrites old lessons. The heavy
  logic is already shared (engines in `assets/`), so the copy is only a few lines of config.

### G7. Frozen forks (Module 3)

- Once a generic engine is promoted to the shared `assets/`, **older lessons keep linking their local
  copies**. Those copies get bug fixes in place only, and lessons migrate only when rewritten anyway.
  Same principle as G6: a lesson records how something was taught.

### G8. Hidden trainers keep running unless `mount` returns `{stop}` (Module 3)

- **Symptom:** on a skill page, a speed drill you closed keeps timing out and recording misses. Enter
  and Space fire in two trainers at once. A hidden loop keeps playing audio.
- **Fix:** build skill pages with `toolpage.js`. It mounts lazily, keeps one trainer open, and calls
  the `{stop}` your `mount` returned when a trainer closes. Any trainer holding timers, loops or
  document-level key listeners **must** return `{stop}`. The shared engines' return value already is
  one. Trainer `id`s are public deep links (`…/0003-rhythm-reading.html#l09-gauntlet`), so never
  rename one.

### G9. The audience firewall: some files must never reach you (Modules 1, 5)

- `NOTES.md`, `learning-records/`, and the `note` fields in `state.json` are **agent-facing**. They
  hold recorded predictions ("he'll probably hear this as a half cadence") and do-not-spoil material.
  If you read them, the check stops working.
- **Enforced, not just documented:** `site/build.py` skips all `.md`, never emits notes, and lets a
  _view_ lift **only pipe-table rows**, only from a `.md` inside its own subject, and never from
  `NOTES.md`/`MISSION.md`/`RESOURCES.md`/`learning-records/` (`safe_source()`). Any new surface that
  publishes workspace content inherits this rule.
- `lessons ls` and `lessons ui` print notes. That's fine for the user at their own terminal. An agent
  checking CLI output in a session the user can see should compare hashes rather than dump it.

### G10. A page named like a sibling folder swallows it on Netlify (Module 5)

- **Symptom:** `/reading/` on the live site shows a stub page instead of the Reading subject page.
  Locally everything looks fine, including `netlify dev`.
- **Cause:** Netlify answers `/<name>/` with `<name>.html` if one exists next to the folder, so the
  folder's `index.html` becomes unreachable.
- **Fix:** never generate `<name>.html` beside a `<name>/` folder. `build.py` warns about this
  (`shadowed_folders()`). Keep the check.

### G11. Documents must be self-contained (Modules 1, 3, 5)

- No CDN scripts, no external stylesheets, no absolute paths, system fonts only. Every doc needs
  `<meta name="viewport" content="width=device-width, initial-scale=1">` and a meaningful `<title>`
  (the CLI and site read it). Only relative links into `assets/` are allowed. That's why the same
  file works from `file://` on the desktop and from the site on a phone, and why numbered filenames
  are enough to order everything.

### G12. The TUI's raw-input choices look odd but are correct (Module 2)

- It reads keys with `os.read`, not `sys.stdin.read`. The buffered reader swallows the rest of an
  arrow key's escape sequence, so every arrow reads as a bare Esc and quits.
- It uses `cbreak` with `TCSANOW`, not `tty.setraw`'s `TCSAFLUSH`. That would discard keys pressed
  during a redraw, and raw mode breaks `print()`'s carriage returns.
- It draws on the alternate screen and restores on every exit path, or the terminal is left looking
  frozen after a crash.

### G13. Agreeable models fold on judgement calls (Module 1)

- **Symptom:** the agent says "you're right, I was wrong" whenever you push. It holds ground on facts
  but gives in on claims that have nothing external to check them against: how to read a book, which
  design trade-off is better, which technique suits a job. From your side, you pushing and it
  conceding looks like a healthy system whether or not you were right.
- **Where it showed up:** the author's book debriefs. The same behaviour appears anywhere there's
  room for judgement, which in a dev's subjects is most architecture and style questions.
- **Fix:** the four-rule calibration in the root `CLAUDE.md` (1b). Don't overcorrect into manufactured
  disagreement over minutiae, which is worse than none. The drift check is **unresolved
  disagreements**, not pushback events. If everything converges, something's wrong.

### G14. The to-read table format is load-bearing (Module 6)

- `./libby` parses the 5-column tables in `to-read.md` directly. A malformed row **silently drops**
  out of the dashboard. The 3-column "Dropped" table is skipped by the width check on purpose, so
  dropped books never come back.
- Libby's search is fuzzy and returns unrelated books, so hits are filtered by title containment
  plus any author surname. The tool uses public catalogue data with no login. **It can't see your
  holds or loans**, and the agent must never claim it can.

### G15. The agent writes the notes, not you (Modules 6, 7)

- In the debrief, step 4 is "I write it up. You don't." The author's earlier note systems died
  because transcription was the only part the human did. Keep the inversion. Also: **ask before adding** to
  the to-read list or saving your own opinions as notes. An agent that inserts things unasked turns
  your list into someone else's homework.

### G16. Commit and push are part of the session, not an afterthought (Modules 1, 5)

- The phone only sees what's pushed. The root `CLAUDE.md` tells agents to commit and push at the end
  of any session that changed the repo, without asking. (The author also runs a hook that blocks
  commits on `main` for _root_ sessions that work on tooling. That's personal process, not part of
  this setup. If you add one, make sure subject sessions, which commit teaching content to `main`,
  don't load it.)

---

## Dependencies at a glance

| Component                                                                             | Hard dependencies                                                                                                                  | Alternatives                                                                                                   |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1. Extended teach skill + workspace contract (incl. subject patterns and calibration) | An agent that loads user skills and `CLAUDE.md` (Claude Code)                                                                      | Any agent with a system-prompt/rules file: paste `SKILL.md` into it                                            |
| 2. `state.json` + `lessons` CLI/TUI                                                   | Python 3.8+ (stdlib), a POSIX terminal for `ui`                                                                                    | Swap `open` for `xdg-open` on Linux                                                                            |
| 3. Shared engines + skill pages                                                       | A browser                                                                                                                          | none needed                                                                                                    |
| 4. Projects                                                                           | Module 1                                                                                                                           | none                                                                                                           |
| 5. Mobile site                                                                        | Python 3, git, a GitHub repo, a Netlify site with password protection                                                              | Any static host with auth (e.g. Cloudflare Pages + Cloudflare Access). Must honour the G10 check               |
| 6. Ideas-subject extras (debrief; for reading: to-read list, view, `libby`)           | Module 1. The debrief's connection hunt wants Module 7. `libby` needs internet + a library on OverDrive/Libby                      | The debrief works without a vault (it just skips step 3's search). Skip `libby` if your library isn't on Libby |
| 7. Notes vault + capture                                                              | A folder of markdown notes: your existing vault (Obsidian, zettelkasten, plain folder), or a new `vault/` inside the teaching root | A note-writing skill if you have one; otherwise conventions written into the root `CLAUDE.md`. Or skip         |

---

## The implementation

Suggested layout (the author's root is a git repo at `~/Dev/teaching`; use whatever you like, e.g.
`~/teaching`):

```
~/teaching/                  <- git repo, the parent/root
  CLAUDE.md                  root agent instructions (Module 1)
  state.json                 status only (Module 2)
  lessons                    executable CLI (Module 2)
  assets/                    SHARED engines: teach.css, toolpage.js, drill.js, … (Module 3)
  site/build.py              mobile site builder (Module 5)
  netlify.toml               (Module 5)
  .gitignore
  music-theory/              one folder per subject
    MISSION.md  NOTES.md  RESOURCES.md
    lessons/0001-*.html  reference/*.html  tools/0001-*.html  projects/<yyyymmdd>-<name>/
    assets/<subject>.css  assets/<domain-component>.js
    learning-records/0001-*.md
  reading/
    shelf.md  to-read.md  libby  tools/0001-reading-list.view.json   (Module 6)
  vault/                     only if the user has no notes vault elsewhere (Module 7)
~/.claude/skills/teach/      the extended skill (Module 1)
```

### Module 1: The extended teach skill and workspace contract

**1a. Install the skill.** Create `~/.claude/skills/teach/` (or wherever the user keeps user-level
skills). Copy the four format files **unchanged** from upstream: `MISSION-FORMAT.md`,
`LEARNING-RECORD-FORMAT.md`, `RESOURCES-FORMAT.md`, `GLOSSARY-FORMAT.md` from
<https://github.com/mattpocock/skills/tree/main/skills/productivity/teach>. The author's copies are
byte-identical to that import. Then write this `SKILL.md`, which **replaces** the upstream one. It
keeps all of Matt's pedagogy and adds state tracking, projects, tools/skill pages/views, shared
assets, notes-vault capture, and session-end push:

`~/.claude/skills/teach/SKILL.md`:

````markdown
---
name: teach
description: Teach the user a new skill or concept, within this workspace.
disable-model-invocation: true
argument-hint: "What would you like to learn about?"
---

The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.

## Teaching Workspace

Treat the current directory as a teaching workspace. The state of their learning is captured in this directory in several files:

- `MISSION.md`: A document capturing the _reason_ the user is interested in the topic. This should be used to ground all teaching. Use the format in [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `./reference/*.html`: A directory of reference materials. These are the compressed learnings from the lessons - cheat sheets, reference algorithms, syntax, yoga poses, glossaries. They are the raw units of learning. They should be beautiful documents which print out well, and are designed for quick reference.
- `RESOURCES.md`: A list of resources which can be explored to ground your teaching in contextual knowledge, or to acquire knowledge and wisdom. Use the format in [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- `./learning-records/*.md`: A directory of learning records, which capture what the user has learned. These are loosely equivalent to architectural decision records in software development - they capture non-obvious lessons and key insights that may need to be revised later, or drive future sessions. These should be used to calculate the zone of proximal development. They are titled `0001-<dash-case-name>.md`, where the number increments each time. Use the format in [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- `./lessons/*.html`: A directory of lessons. A **lesson** is a single, self-contained HTML output that teaches one tightly-scoped thing tied to the mission. This is the primary unit of teaching in this workspace.
- `./projects/*`: Real-world projects the learning is applied to. See [Projects](#projects).
- `./tools/*`: Standing pages that do a job for the user on demand — above all the **skill pages** that keep every trainer you build within reach after its lesson is done. See [Tools](#tools).
- `./assets/*`: Reusable **components** shared across lessons. See [Assets](#assets).
- `NOTES.md`: A scratchpad for you to jot down user preferences, or working notes.

The workspace's **parent** directory holds state shared across every subject the user is learning. See [Tracking Active Lessons](#tracking-active-lessons).

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant interactive lessons devised by you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before the `RESOURCES.md` is well-populated, your focus should be to find high-quality resources which will help the user acquire knowledge. Never trust your parametric knowledge.

Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.

### Fluency vs Storage Strength

You should be careful to split between two types of learning:

- **Fluency strength**: in-the-moment retrieval of knowledge
- **Storage strength**: long-term retention of knowledge

Fluency can give the user an illusory sense of mastery, but storage strength is the real goal. Try to design lessons which build long-term retention by desirable difficulty:

- Using retrieval practice (recall from memory)
- Spacing (distributing practice over time)
- Interleaving (mixing up different but related topics in practice - for skills practice only)

## Lessons

A lesson is the main thing you produce — the unit in which knowledge and skills reach the user. Each lesson is one self-contained HTML file, saved to `./lessons/` and titled `0001-<dash-case-name>.html` where the number increments each time.

A lesson should be **beautiful** — clean, readable typography and layout — since the user will return to these later to review. Think Tufte.

Self-contained means: no CDN scripts, no external stylesheets, no absolute paths — the only external references are relative links into `assets/`. Every lesson (and reference doc) carries `<meta name="viewport" content="width=device-width, initial-scale=1">` and a meaningful `<title>`; the `lessons` CLI and the user's mobile site both read the title, and the mobile mirror only works because documents follow these rules.

The lesson should be short, and completable very quickly. Learners' working memory is very small, and we need to stay within it. But each lesson should give the user a single tangible win that they can build on. It should be directly tied to the mission, and should be in the user's zone of proximal development.

If possible, open the lesson file for the user by running a CLI command. Then make sure it is marked active, and the lesson it supersedes marked done — see [Tracking Active Lessons](#tracking-active-lessons).

Each lesson should link via HTML anchors to other lessons and reference documents.

Each lesson should recommend a primary source for the user to read or watch. This should be the most high-quality, high-trust resource you found on the topic.

Each lesson should contain a reminder to ask followup questions to the agent. The agent is their teacher, and can assist with anything that's unclear.

## Capturing Knowledge Beyond the Workspace

Some of what a session produces belongs to the user's wider knowledge system rather than to this
workspace — an idea that will still matter when the topic is long finished, or one that connects to
something they learned elsewhere.

**When that happens, invoke `/skills:capture` rather than writing notes yourself.** It owns the note
conventions, the search for existing related notes, and duplicate handling, so those rules live in
one place instead of being restated in every workspace.

The division is: **this skill elicits, `capture` writes.** Getting knowledge out of the user's head is
the teaching work — questioning, retrieval practice, drawing out what they actually understood — and
it must not be replaced by a generic capture flow. Once the user has agreed what is worth keeping,
hand those ideas over. `capture` will skip its own interview when invoked this way.

Lessons, reference docs and learning records stay here. They are workspace artifacts, not knowledge
notes.

## Tracking Active Lessons

The user is likely learning several subjects at once, each in its own workspace directory. They must never have to remember which lesson they were on, and must never be asked to mark anything as started or finished. **You maintain that state for them.**

The parent directory of the workspace holds:

- `state.json` — which lessons and reference docs are currently **active**
- `lessons` — an executable that reads it (also aliased globally, so `lessons` works from anywhere)

```
teaching/
  state.json
  lessons          <- executable
  music-theory/
  reading/
```

**Active** means "open this when I sit down to study." It applies to lessons and to reference documents equally — anything the user would want in front of them.

### Your obligation

Keep `state.json` current from the conversation alone, without being asked:

- **You build a new lesson** → it becomes active. (New lessons default to active, so this needs no action, but set a `note` saying what you're waiting on.)
- **The user asks for the next lesson** → the previous one is done. Mark it. This is implied unless they say they're still working on it.
- **The user says they've finished, mastered, or is bored of something** → done.
- **The user reports back on a drill, or says they're still practising** → keep it active, and update its `note`.
- **A reference doc becomes relevant to current work** (a checklist for a project they're mid-way through) → active. When the project ends → done.

Prefer the CLI over hand-editing the JSON — it writes atomically and validates:

```
lessons set <fragment> active --note "why this is live / what's pending"
lessons set <fragment> done
```

`<fragment>` is any set of path or title tokens that uniquely identifies an item — `reading/0002`, `rapid fire`. It errors rather than guessing if ambiguous.

The `note` is what you were waiting on or what comes next. It shows in the picker, and it is what lets a future session pick the thread back up. Write it for the you that has forgotten this conversation.

### Setting up a new workspace

If `state.json` and `lessons` don't exist in the parent directory yet, create them — copy the script from an existing sibling workspace's parent if there is one. The script discovers subjects and lesson titles from the filesystem, so a new subject directory needs no registration. Then check the user has the global alias; if not, offer to add it (`~/.config/fish/functions/lessons.fish` for fish, or a shell rc alias otherwise).

## Assets

Components live at two levels:

- **The parent directory's `assets/`** holds the generic engines shared by every subject — drill,
  speeddrill, quiz, recall, store, and the toolpage helper for skill pages. Check here FIRST. New lessons link these via
  `../../assets/<engine>.js`, and improvements to a generic engine land in this shared copy — never
  in a local fork. Its README documents each engine.
- **The workspace's `./assets/`** holds domain-specific components (notation renderers, domain data
  files, simulators) and the subject stylesheet.

Reuse is the default, not the exception. Before authoring a lesson, read the shared `assets/` and
`./assets/` and build from the components already there. When a lesson needs something new and
reusable, write it as a component in `./assets/` and link to it — never inline code a future lesson
would duplicate. When a second subject wants a component, promote it to the shared library and link
it there from then on.

Older lessons may link a local copy of a generic engine (`./assets/drill.js`) predating the shared
library. Those copies are frozen forks: leave them and the lessons linking them alone (bugfixes in
place excepted), and use the shared copy for new lessons.

A subject stylesheet is the first component every workspace earns: every lesson links it, so the lessons look like one consistent course rather than a pile of one-offs. As the workspace grows, so should the component library.

## Projects

A **project** is real-world work the learning is applied to — a repair, a build, a composition. When
one exists, it lives in `./projects/<yyyymmdd>-<dash-case-name>/`:

- `0000-plan.html` — the standing plan: status, route, decisions, standing rules, open questions,
  log. Keep it current after every step; it is the doc the user opens to see where the project
  stands, and it stays active for the life of the project.
- `0001-...html`, `0002-...html` — numbered step documents, each marked done as it completes.
- `pictures/` — photos and other captures, referenced relatively.

Projects are tracked in `state.json` exactly like lessons (they default to active).

## Tools

A **tool** is a standing page that does a job for the user on demand — practise, explore, choose —
and is not tied to any lesson. (A reference document holds knowledge and would still be useful
printed; a tool does a job.) Tools live in `./tools/`, numbered like lessons
(`0001-<dash-case-name>.html`), and follow the same self-contained authoring rules. Number a new tool
from the directory listing: newest sits on top of the shelf.

Tools are **stateless**. They are never tracked in `state.json` and are never active or done — a tool
is simply always there. `lessons tools` lists them; `lessons tools <fragment>` opens one. Because a
tool cannot be marked active, a lesson stays active while its drill is still in rotation, and the
lesson's `note` still carries what you are waiting on.

### Skill pages

The usual tool is a **skill page**: one page per skill, holding every **trainer** the lessons have
used for that skill, newest first. A trainer is any _replayable_ practice widget — a drill, speed
drill, tap or ear trainer, a sandbox, an explorer. The test: could the user run it again tomorrow and
get fresh practice? A quiz or recall pad about one lesson's content is not a trainer; it stays in its
lesson.

**Whenever you build a lesson that contains a trainer, copy that trainer onto the matching skill page
in the same session** — or start a new skill page if the skill has none. There is no gate and no
judgement about whether it is "worth" keeping: every trainer gets a home, so nothing the user might
want to practise is ever buried in a finished lesson.

- The copy is **exact** — same engine, same generators, same parameters — and it names and links the
  lesson it came from. The new lesson links forward to its skill page.
- **Copy, never share.** Do not point a lesson and a tool at one shared definition. A lesson stays
  exactly as it was taught; a tool is free to evolve. The engines and generators are the shared part.
- Skill pages link the shared engines in the parent `assets/` (never a subject's frozen fork) and
  build each trainer with the shared `toolpage.js` helper, which keeps one trainer live at a time.
  If a trainer holds timers, loops or document-level key listeners, its mount must return `{stop}`.

### Views

A **view** is a tool the user's site generates from tables you maintain in the workspace — a reading
list, a watchlist. Add `./tools/0001-<name>.view.json`:

```json
{ "title": "Reading list",
  "sources": [ { "file": "to-read.md", "headings": ["wanted"] } ] }
```

`file` is relative to the workspace; `headings` matches the heading above a table by case-insensitive
substring (omit it to lift every table in the file). Only table rows and their heading are published
— never the prose around them — so **only list tables whose every cell is fine for the user to read**.

## Session End

If the workspace's parent directory is a git repository, commit and push at the end of any session
that changed it — new lesson, state change, project update. The user's read-only mobile site deploys
from it, so pushing is what keeps their phone current. Do this without being asked.

## The Mission

Every lesson should be tied into the mission - the reason that the user is interested in learning about the topic.

If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.

Missions may change as the user develops more skills and knowledge. This is normal - make sure to update the `MISSION.md` and add a learning record to capture the change. Confirm with the user before changing the mission.

## Zone Of Proximal Development

Each lesson, the user should always feel as if they are being challenged 'just enough'.

The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:

- Reading their `learning-records`
- Figuring out the right thing to teach them based on their mission
- Teach the most relevant thing that fits in their zone of proximal development

## Knowledge

Lessons should be designed around a skill the user is going to learn. The knowledge in the lesson should be only what's required to acquire that skill. You teach the knowledge first, then get the user to practice the skills via an interactive feedback loop.

Knowledge should first be gathered from trusted resources. Use `RESOURCES.md` to keep track of them. Lessons should be littered with citations - links to external resources to back up any claim made. This increases the trustworthiness of the lesson.

For acquiring knowledge, difficulty is the enemy. It eats working memory you need for understanding.

## Skills

If knowledge is all about acquisition, skills are about durability and flexibility. Make the knowledge stick.

For skill acquisition, difficulty is the tool. Effortful retrieval is what builds storage strength. Skills should be taught through interactive lessons. There are several tools at your disposal:

- Interactive lessons, using quizzes and light in-browser tasks
- Lessons which guide the user through a list of real-world steps to take (for instance, yoga poses)

Each of these should be based on a **feedback loop**, where the user receives feedback on their performance. This feedback loop should be as tight as possible, giving feedback immediately - and ideally automatically.

For quizzes, each answer should be exactly the same number of words (and characters, if possible). Don't give the user any clues about the answer through formatting.

## Acquiring Wisdom

Wisdom comes from true real-world interaction - testing your skills outside the learning environment.

When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer - but to ultimately delegate to a **community**.

A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.

You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.

## Reference Documents

While creating lessons, you should also create reference documents. Lessons can reference these documents - they are useful for tracking raw units of knowledge useful across lessons.

Lessons will rarely be revisited later - reference documents will be. They should be the compressed essence of the lesson, in a format designed for quick reference.

Some learning topics lend themselves to reference:

- Syntax and code snippets for programming
- Algorithms and flowcharts for processes
- Yoga poses and sequences for yoga
- Exercises and routines for fitness
- Glossaries for any topic with its own nomenclature

Glossaries, in particular, are an essential reference. Once one is created, it should be adhered to in every lesson.

## `NOTES.md`

The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. This is the place to record those preferences, so you can refer back to them when designing lessons or working with the user.
````

Notes on the skill:

- `disable-model-invocation: true` means it only runs when the user types `/teach`. Keep it.
- The "Capturing Knowledge Beyond the Workspace" section names `/skills:capture`, the author's own
  note-writing skill. If the user has their own note skill, rename the reference. If not, replace
  the invocation with "write the notes following the Notes vault section of the root `CLAUDE.md`"
  (Module 7). If they skip Module 7 entirely, delete the section.
- The "Setting up a new workspace" section mentions a fish function for the alias. Adapt it to their
  shell.

**1b. Root `CLAUDE.md`.** This is what makes the system coherent across sessions. Memory files walk
up from the cwd, so it loads in every subject session too. It's condensed from the author's, with
two sections moved or added so they apply to every subject:

- **Subject patterns** is new. The author's workspaces grew their shapes without anything written
  down. This section writes the three patterns down (see _Fitting it to your subjects_) so a new
  subject gets a deliberate choice.
- **Calibration** is the author's anti-sycophancy calibration. The author keeps it in the reading
  workspace's `NOTES.md`, where the problem first showed up. It's placed at the root here because
  the failure isn't specific to books (G13). Rule 3 was reworded from "when a book will settle it"
  to cover any subject.

The template:

```markdown
# Teaching Workspaces

This folder holds my learning workspaces, one folder per subject. Each is a stateful `/teach`
workspace: agents design lessons, track progress and maintain state so I never have to.

## Starting a session
Learning happens INSIDE a subject folder: `cd <subject> && claude --add-dir ..`. /teach treats the
cwd as the workspace. `--add-dir ..` is what lets the session update ../state.json and the shared
../assets/. Without it, lessons get added but old ones never get marked done.
Start at the root only for work on the system itself (the lessons CLI, site/, shared assets/).

- `lessons` is a shell function for me and not on your PATH: call it by path (`../lessons ls`).

## Anatomy (every subject)
  lessons/           0001-<dash-case>.html: the unit of teaching, numbered, one thing each
  reference/         print-and-keep cards, glossaries (.html; .pdf allowed)
  projects/          <yyyymmdd>-<name>/0000-plan.html + 0001-step.html… + pictures/
  tools/             0001-<dash-case>.html standing pages (skill pages); *.view.json views
  assets/            subject components + the subject stylesheet
  learning-records/  0001-<dash-case>.md
  MISSION.md  NOTES.md  RESOURCES.md
Parent: state.json (status only), lessons (CLI), assets/ (SHARED engines), site/ (mobile build).

lessons/reference/projects are STATEFUL. Defaults: lessons + projects ACTIVE until marked done,
reference DONE until marked active. tools are STATELESS: never in state.json.
Keep state.json current from conversation alone. Never ask me to mark anything. Set a `note` on
active items saying what you're waiting on, written for the agent that has forgotten this session.

## Subject patterns
Once a new subject's mission is written, decide which patterns fit it, tell me in one line, and
record the choice in that subject's NOTES.md. Most subjects mix them.
- Skill-heavy (success = fast, accurate, automatic): short lessons that each introduce a trainer;
  skill pages in tools/; speed drills; spaced mastery.
- Hands-on (learning applied to a real thing): projects/ with a standing plan and step docs;
  lessons written to unblock the next step.
- Ideas-heavy (arguments, history, interpretation, trade-offs): debriefs (talk from memory → why →
  connections → I write the notes), recall pads, notes into the vault. The calibration below
  matters most here.
Don't add a pattern's machinery to a subject it doesn't fit.

## Tools
A tool does a job on demand (a reference holds knowledge; test: still useful printed?). Whenever a
lesson introduces a replayable trainer, the SAME session copies it exactly onto the matching skill
page in tools/ (or starts one), built with ../../assets/toolpage.js, naming and linking its lesson.
Copy, never share a definition between lesson and tool. Trainer ids are public deep links: never
rename. Number new tools from the directory listing.

## Shared assets
New lessons link generic engines from ../../assets/. Improvements land there. Older lessons keep the
local copies they link (frozen forks: bug fixes only). Promote a subject component to shared when a
second subject wants it. See assets/README.md.

## Authoring rules (the mobile site depends on these)
Self-contained HTML apart from relative links into assets/: no CDN, no external CSS, no absolute
paths, system fonts. Every doc has the viewport meta and a meaningful <title>.

## Audience rule: do not spoil
NOTES.md, learning-records/ and state.json `note` fields are agent-facing: they hold predictions
the method depends on me not reading. Never surface them unprompted, never publish them.

## Calibration: pushback, and why agreement is nearly worthless
Me pushing back and you conceding is NOT evidence the system is healthy: an agreeable model
produces that pattern whether or not I was right. I don't want manufactured disagreement over
minutiae ("rigour" performed for its own sake is worse than none). I want pushback where it's real.

The known error: models hold ground on factual claims, which have an external referent, and FOLD
TOO FAST ON JUDGEMENT CALLS (interpretation, design trade-offs, technique, taste), which have
nothing pushing back against the agreeableness gradient.

1. Don't concede a judgement call in the same turn it's raised. State what would have to be true
   for your original position to hold, then let it stand or fall on that.
2. Say which kind of claim is in play. Checkable now (dates, docs, what a source says, what the
   code does): just be right, and go and look when we disagree. Checkable later: make it a
   prediction. Not checkable (interpretation, intent, taste): agreement AND disagreement are both
   near-worthless signals, so give the best case for each side and what would separate them, not a
   verdict.
3. When something later will settle a dispute (the next chapter, an experiment, a benchmark, a
   real attempt at the task), write both positions down, dated, before it's settled. A recorded
   prediction can come out wrong, and neither of us can soften it afterwards.
4. Cut default praise. Evaluate only when the evaluation carries information. The failure is
   rate: when every answer gets an upgrade adjective, none of them mean anything. Assume this is
   drifting back.

Drift check: track UNRESOLVED disagreements, not pushback events. If everything we discuss
converges, that is the signal. Record open disputes as open. Push back on my hedges, not just my
errors.

## Session end
At the end of any session that changed this repo, commit with a short message and push. Pushing
is what updates my phone. Don't ask.

## Mobile site
`python3 site/build.py` → site/dist/. Every push to main redeploys (Netlify). Never let a page share
its name with a sibling folder (reading.html beside reading/): Netlify serves the page and the
folder's index becomes unreachable. The build warns about this.
```

**1c. `.gitignore`** at the root:

```gitignore
.DS_Store
__pycache__/
site/dist/
.netlify
.state-*.json
```

### Module 2: `state.json` and the `lessons` CLI/TUI

`state.json` starts as:

```json
{
  "version": 1,
  "items": {}
}
```

Items are added lazily by `lessons set`, keyed `"<subject>/<kind-dir>/<file>"` (projects:
`"<subject>/projects/<folder>/<file>"`), each `{ "status": "active"|"done", "updated": "YYYY-MM-DD",
"note": "…" }`. A top-level `updated` is stamped on every write. Don't add anything else (G3).

`lessons` at the root, `chmod +x lessons`. It's pure stdlib and verbatim from the author:

```python
#!/usr/bin/env python3
"""
lessons — track and open whatever teaching material is currently live.

Every subject under ./teaching/ (music-theory, reading, …) holds lessons and
reference docs as HTML. This tracks which of them are ACTIVE — meaning "open
this when I sit down to study" — so you never have to remember which file to
dig out of which folder.

Usage
-----
  lessons                 open every active item in the browser
  lessons ls              list everything, no browser
  lessons ui              interactive picker — toggle, open, browse
  lessons set <frag> <active|done> [--note "..."]
                          set status; <frag> is any unique path fragment,
                          e.g. `lessons set reading/0001 done`
  lessons tools           list every subject's tools
  lessons tools <frag>    open one tool, e.g. `lessons tools rhythm`
  lessons --help

State lives in ./teaching/state.json and holds nothing but status. Titles and
the item list are read from the filesystem every run, so new lessons appear
automatically and deleted ones disappear — the state file can never drift out
of sync with reality.

Items not mentioned in state.json default to: lessons ACTIVE (a lesson that
exists but was never marked is assumed to be the live one), references DONE.

Tools (./<subject>/tools/) are stateless: always there to reach for, never
active or done, never in state.json. Only `lessons tools` knows about them.
"""

import html
import json
import os
import re
import select
import subprocess
import sys
import tempfile
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
STATE_PATH = os.path.join(HERE, "state.json")
KIND_DIRS = (("lessons", "lesson"), ("reference", "ref"), ("projects", "project"))
# Deliberately NOT a KIND_DIR: tools carry no state (docs/adr/0002-tools-are-stateless.md).
TOOLS_DIR = "tools"

ACTIVE, DONE = "active", "done"

# ---------------------------------------------------------------- colour ----

_TTY = sys.stdout.isatty()


def c(code, s):
    return f"\033[{code}m{s}\033[0m" if _TTY else s


def dim(s):
    return c("2", s)


def bold(s):
    return c("1", s)


def green(s):
    return c("32", s)


def cyan(s):
    return c("36", s)


# ----------------------------------------------------------------- model ----


class Item:
    __slots__ = ("subject", "rel", "kind", "title", "status", "note", "sort")

    def __init__(self, subject, rel, kind, title, status, note, sort):
        self.subject = subject
        self.rel = rel
        self.kind = kind
        self.title = title
        self.status = status
        self.note = note
        self.sort = sort

    @property
    def key(self):
        return f"{self.subject}/{self.rel}"

    @property
    def path(self):
        return os.path.join(HERE, self.subject, self.rel)


def load_state():
    try:
        with open(STATE_PATH, encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        return {"version": 1, "items": {}}
    except (json.JSONDecodeError, OSError) as exc:
        sys.stderr.write(f"lessons: could not read state.json ({exc})\n")
        sys.stderr.write("lessons: continuing with defaults; nothing was overwritten.\n")
        return {"version": 1, "items": {}, "_readonly": True}
    data.setdefault("version", 1)
    data.setdefault("items", {})
    return data


def save_state(state):
    if state.get("_readonly"):
        sys.stderr.write("lessons: refusing to overwrite an unreadable state.json\n")
        return False
    payload = {k: v for k, v in state.items() if not k.startswith("_")}
    payload["updated"] = date.today().isoformat()
    # Write to a temp file in the same dir, then rename — an interrupted run
    # can never leave a half-written state.json behind.
    fd, tmp = tempfile.mkstemp(dir=HERE, prefix=".state-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp, STATE_PATH)
    except OSError as exc:
        sys.stderr.write(f"lessons: could not write state.json ({exc})\n")
        if os.path.exists(tmp):
            os.unlink(tmp)
        return False
    return True


TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)


def read_title(path, fallback):
    if not path.endswith(".html"):
        return fallback
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            head = fh.read(4096)
    except OSError:
        return fallback
    m = TITLE_RE.search(head)
    if not m:
        return fallback
    return html.unescape(" ".join(m.group(1).split()))


def subjects():
    out = []
    for name in sorted(os.listdir(HERE)):
        full = os.path.join(HERE, name)
        if not os.path.isdir(full) or name.startswith("."):
            continue
        dirs = [d for d, _ in KIND_DIRS] + [TOOLS_DIR]
        if any(os.path.isdir(os.path.join(full, d)) for d in dirs):
            out.append(name)
    return out


ITEM_EXTS = (".html", ".pdf")


def html_files(base):
    """(path relative to base, absolute path) for .html/.pdf files directly
    inside base, plus one level down. The nesting is what lets a kind dir hold
    a folder per project: projects/<slug>/0001-step.html"""
    out = []
    for entry in sorted(os.listdir(base)):
        if entry.startswith("."):
            continue
        full = os.path.join(base, entry)
        if os.path.isfile(full) and entry.endswith(ITEM_EXTS):
            out.append((entry, full))
        elif os.path.isdir(full):
            for sub in sorted(os.listdir(full)):
                if sub.startswith(".") or not sub.endswith(ITEM_EXTS):
                    continue
                subfull = os.path.join(full, sub)
                if os.path.isfile(subfull):
                    out.append((entry + "/" + sub, subfull))
    return out


def scan(state):
    """Filesystem is the source of truth for what exists; state.json only says
    which of those things are live."""
    items = state.get("items", {})
    found = []
    for subject in subjects():
        for dirname, kind in KIND_DIRS:
            d = os.path.join(HERE, subject, dirname)
            if not os.path.isdir(d):
                continue
            for relname, full in html_files(d):
                rel = f"{dirname}/{relname}"
                key = f"{subject}/{rel}"
                rec = items.get(key, {})
                default = DONE if kind == "ref" else ACTIVE
                status = rec.get("status", default)
                if status not in (ACTIVE, DONE):
                    status = default
                fname = os.path.basename(relname)
                title = read_title(full, fname)
                # Numeric prefix sorts lessons newest-first; refs sort by name.
                m = re.match(r"(\d+)", fname)
                sort = int(m.group(1)) if m else 0
                found.append(
                    Item(subject, rel, kind, title, status, rec.get("note", ""), sort)
                )
    return found


def scan_tools():
    """Every subject's tools, newest first. Tools are stateless, so this never
    reads state.json and nothing here ever shows up in scan()."""
    found = []
    for subject in subjects():
        d = os.path.join(HERE, subject, TOOLS_DIR)
        if not os.path.isdir(d):
            continue
        for relname, full in html_files(d):
            fname = os.path.basename(relname)
            m = re.match(r"(\d+)", fname)
            found.append(
                Item(subject, f"{TOOLS_DIR}/{relname}", "tool", read_title(full, fname),
                     "", "", int(m.group(1)) if m else 0)
            )
    found.sort(key=lambda t: (t.subject, -t.sort, t.title))
    return found


def order(items):
    """Active first, then newest lesson number first. Subjects are ordered by
    whichever has live work, so what you're studying floats to the top."""
    by_subject = {}
    for it in items:
        by_subject.setdefault(it.subject, []).append(it)
    for group in by_subject.values():
        group.sort(key=lambda i: (i.status != ACTIVE, i.kind != "lesson", -i.sort, i.title))

    def subject_rank(name):
        group = by_subject[name]
        live = sum(1 for i in group if i.status == ACTIVE)
        newest = max((i.sort for i in group if i.status == ACTIVE), default=0)
        return (0 if live else 1, -newest, name)

    out = []
    for name in sorted(by_subject, key=subject_rank):
        out.append((name, by_subject[name]))
    return out


def open_paths(paths):
    existing = [p for p in paths if os.path.exists(p)]
    if not existing:
        return 0
    try:
        subprocess.run(["open"] + existing, check=True)
    except (OSError, subprocess.CalledProcessError) as exc:
        sys.stderr.write(f"lessons: could not open files ({exc})\n")
        return 0
    return len(existing)


# -------------------------------------------------------------- commands ----


def cmd_open(_args):
    state = load_state()
    items = scan(state)
    active = [i for i in items if i.status == ACTIVE]
    if not active:
        print("No active lessons.")
        print(dim("  Mark something active with:  lessons ui"))
        return 0
    for subject, group in order(active):
        print(bold(subject))
        for it in group:
            print(f"  {green('●')} {it.title}")
    n = open_paths([i.path for i in active])
    print()
    print(dim(f"opened {n} item{'s' if n != 1 else ''}"))
    return 0


def cmd_ls(_args):
    state = load_state()
    items = scan(state)
    if not items:
        print("No lessons found under", HERE)
        return 0
    total = sum(1 for i in items if i.status == ACTIVE)
    print(bold("Lessons"), dim(f"— {total} active"))
    for subject, group in order(items):
        print()
        print(bold(subject.upper()))
        for it in group:
            mark = green("●") if it.status == ACTIVE else dim("○")
            title = it.title if it.status == ACTIVE else dim(it.title)
            tag = dim(f"[{it.kind}]")
            print(f"  {mark} {title} {tag}")
            if it.note:
                print(f"    {dim('↳ ' + it.note)}")
    print()
    print(dim("lessons        open all active     lessons ui     toggle / browse"))
    return 0


def resolve(items, frag):
    """Match on all whitespace/slash-separated tokens, so `reading/0002`,
    `reading 0002` and `residue` all find the same thing."""
    tokens = [t for t in re.split(r"[\s/]+", frag.strip().lower()) if t]
    if not tokens:
        return []

    def hit(hay):
        return all(t in hay for t in tokens)

    found = [i for i in items if hit(i.key.lower())]
    if not found:
        found = [i for i in items if hit(i.title.lower())]
    return found


def cmd_set(args):
    if len(args) < 2:
        sys.stderr.write("usage: lessons set <fragment> <active|done> [--note \"...\"]\n")
        return 2
    frag, status = args[0], args[1].lower()
    if status not in (ACTIVE, DONE):
        sys.stderr.write(f"lessons: status must be 'active' or 'done', got '{status}'\n")
        return 2
    note = None
    if "--note" in args:
        idx = args.index("--note")
        if idx + 1 < len(args):
            note = args[idx + 1]

    state = load_state()
    items = scan(state)
    hits = resolve(items, frag)
    if not hits:
        sys.stderr.write(f"lessons: nothing matches '{frag}'\n")
        return 1
    if len(hits) > 1:
        sys.stderr.write(f"lessons: '{frag}' is ambiguous:\n")
        for h in hits:
            sys.stderr.write(f"  {h.key}\n")
        return 1

    it = hits[0]
    rec = state["items"].setdefault(it.key, {})
    rec["status"] = status
    rec["updated"] = date.today().isoformat()
    if note is not None:
        if note:
            rec["note"] = note
        else:
            rec.pop("note", None)
    if not save_state(state):
        return 1
    mark = green("● active") if status == ACTIVE else dim("○ done")
    print(f"{mark}  {it.title}")
    return 0


def cmd_tools(args):
    tools = scan_tools()
    if not args:
        if not tools:
            print("No tools found under", HERE)
            return 0
        print(bold("Tools"), dim(f"— {len(tools)}"))
        subject = None
        for it in tools:
            if it.subject != subject:
                subject = it.subject
                print()
                print(bold(subject.upper()))
            print(f"  {cyan('◆')} {it.title}")
        print()
        print(dim("lessons tools <frag>    open one"))
        return 0

    frag = " ".join(args)
    hits = resolve(tools, frag)
    if not hits:
        sys.stderr.write(f"lessons: no tool matches '{frag}'\n")
        return 1
    if len(hits) > 1:
        sys.stderr.write(f"lessons: '{frag}' is ambiguous:\n")
        for h in hits:
            sys.stderr.write(f"  {h.key}\n")
        return 1
    if not open_paths([hits[0].path]):
        return 1
    print(f"{cyan('◆')} {hits[0].title}")
    return 0


# ------------------------------------------------------------------- TUI ----


class AltScreen:
    """Draw on the alternate screen buffer so the terminal's scrollback is
    left exactly as it was. Restored on any exit path, including a crash —
    otherwise the terminal is left looking frozen."""

    def __enter__(self):
        sys.stdout.write("\033[?1049h\033[?25l")  # alt screen, hide cursor
        sys.stdout.flush()
        return self

    def __exit__(self, *_exc):
        sys.stdout.write("\033[?25h\033[?1049l")  # show cursor, restore screen
        sys.stdout.flush()
        return False


class RawInput:
    """Put the terminal in cbreak for the whole session, not per keystroke.

    Two things matter here. Use TCSANOW, not the TCSAFLUSH that tty.setraw
    defaults to — TCSAFLUSH *discards* pending input, so any key pressed while
    the screen was redrawing would be silently swallowed. And use cbreak rather
    than raw, so output post-processing stays on and plain print() still
    returns the carriage.
    """

    def __enter__(self):
        import termios
        import tty

        self.termios = termios
        self.fd = sys.stdin.fileno()
        self.old = termios.tcgetattr(self.fd)
        tty.setcbreak(self.fd, termios.TCSANOW)
        return self

    def __exit__(self, *_exc):
        self.termios.tcsetattr(self.fd, self.termios.TCSADRAIN, self.old)
        return False


ARROWS = {"[A": "up", "[B": "down", "[C": "right", "[D": "left"}


def getkey():
    """Read one keypress.

    Deliberately uses os.read rather than sys.stdin.read: the buffered reader
    would swallow the rest of an escape sequence into its own buffer, leaving
    select() looking at an empty file descriptor and every arrow key
    misreported as a bare Escape (i.e. quit).
    """
    fd = sys.stdin.fileno()
    ch = os.read(fd, 1)
    if not ch:
        return "q"  # stdin closed — don't spin
    if ch != b"\033":
        return ch.decode("utf-8", "replace")
    # An arrow sends all its bytes at once, so nothing waiting means a real Escape.
    if not select.select([fd], [], [], 0.05)[0]:
        return "esc"
    return ARROWS.get(os.read(fd, 2).decode("latin-1"), "esc")


class Group:
    """A collapsible subject heading within one of the two sections."""

    __slots__ = ("section", "subject", "count")

    def __init__(self, section, subject, count):
        self.section = section
        self.subject = subject
        self.count = count

    @property
    def key(self):
        return (self.section, self.subject)


# Active groups start open (that's the list you came to see); done groups start
# collapsed, so the archive stays out of the way however large it grows.
SECTIONS = ((ACTIVE, "ACTIVE", False), (DONE, "DONE", True))


def build_rows(items, collapsed):
    """Flatten into ('section'|'group'|'item', payload) rows.

    Sections come first and hold every subject, so all live work sits together
    at the top rather than being buried under each subject's archive.
    """
    rows = []
    for status, label, default_collapsed in SECTIONS:
        subset = [i for i in items if i.status == status]
        if not subset:
            continue
        rows.append(("section", (label, len(subset))))
        for subject, group in order(subset):
            grp = Group(label, subject, len(group))
            is_collapsed = collapsed.setdefault(grp.key, default_collapsed)
            rows.append(("group", grp))
            if not is_collapsed:
                for it in group:
                    rows.append(("item", it))
    return rows


def navigable(rows, idx):
    return 0 <= idx < len(rows) and rows[idx][0] in ("group", "item")


def seek(rows, start, step):
    """Next navigable row in a direction, or None if there isn't one."""
    i = start + step
    while 0 <= i < len(rows):
        if navigable(rows, i):
            return i
        i += step
    return None


def first_nav(rows):
    return next((i for i in range(len(rows)) if navigable(rows, i)), 0)


def cmd_ui(_args):
    if not sys.stdin.isatty():
        sys.stderr.write("lessons: 'ui' needs an interactive terminal.\n")
        return 2

    state = load_state()
    collapsed = {}  # (section, subject) -> bool. Session-only; not persisted.
    items = scan(state)
    if not items:
        print("No lessons found under", HERE)
        return 0

    rows = build_rows(items, collapsed)
    cursor = first_nav(rows)
    message = ""

    def refresh(keep_key=None):
        """Rebuild after a change, keeping the cursor somewhere sensible."""
        nonlocal rows, cursor, items
        items = scan(state)
        rows = build_rows(items, collapsed)
        if keep_key is not None:
            for i, (kind, payload) in enumerate(rows):
                if kind == "item" and payload.key == keep_key:
                    cursor = i
                    return
                if kind == "group" and payload.key == keep_key:
                    cursor = i
                    return
        if not navigable(rows, cursor):
            prev = seek(rows, cursor, -1)
            cursor = prev if prev is not None else first_nav(rows)

    with AltScreen(), RawInput():
        while True:
            sys.stdout.write("\033[2J\033[H")
            live = sum(1 for i in items if i.status == ACTIVE)
            print(bold("  Lessons"), dim(f"— {live} active"))

            for i, (kind, payload) in enumerate(rows):
                sel = i == cursor
                cur = cyan("❯") if sel else " "

                if kind == "section":
                    label, count = payload
                    print()
                    tint = bold if label == "ACTIVE" else dim
                    print(f"  {tint(label)} {dim(str(count))}")

                elif kind == "group":
                    caret = "▸" if collapsed.get(payload.key) else "▾"
                    name = payload.subject.upper()
                    name = bold(name) if payload.section == "ACTIVE" else dim(name)
                    print(f" {cur} {dim(caret)} {name} {dim(str(payload.count))}")

                else:
                    it = payload
                    mark = green("●") if it.status == ACTIVE else dim("○")
                    title = it.title if it.status == ACTIVE else dim(it.title)
                    print(f" {cur}     {mark} {title} {dim('[' + it.kind + ']')}")
                    if it.note and sel:
                        print(f"          {dim('↳ ' + it.note)}")

            print()
            print(dim("  ↑/↓ j/k  move   space  toggle / collapse   ←/→ h/l  fold"))
            print(dim("  o  open   a  open all active   r  reload   q  quit"))
            if message:
                print()
                print("  " + message)
            sys.stdout.flush()

            try:
                key = getkey()
            except (KeyboardInterrupt, EOFError):
                break
            message = ""

            kind, payload = rows[cursor] if navigable(rows, cursor) else (None, None)

            if key in ("q", "esc", "\x03"):
                break

            elif key in ("j", "down"):
                nxt = seek(rows, cursor, 1)
                if nxt is not None:
                    cursor = nxt

            elif key in ("k", "up"):
                prv = seek(rows, cursor, -1)
                if prv is not None:
                    cursor = prv

            elif key == " ":
                if kind == "group":
                    collapsed[payload.key] = not collapsed.get(payload.key)
                    refresh(keep_key=payload.key)
                elif kind == "item":
                    new = DONE if payload.status == ACTIVE else ACTIVE
                    rec = state["items"].setdefault(payload.key, {})
                    rec["status"] = new
                    rec["updated"] = date.today().isoformat()
                    save_state(state)
                    verb = green("→ active") if new == ACTIVE else dim("→ done")
                    message = f"{payload.title}  {verb}"
                    # Re-section it immediately; if the destination group is
                    # collapsed the row vanishes, which is why we echo above.
                    refresh(keep_key=payload.key)
                    if not navigable(rows, cursor) or rows[cursor][0] != "item":
                        nxt = seek(rows, cursor - 1, 1)
                        cursor = nxt if nxt is not None else first_nav(rows)

            elif key in ("l", "right"):
                if kind == "group" and collapsed.get(payload.key):
                    collapsed[payload.key] = False
                    refresh(keep_key=payload.key)

            elif key in ("h", "left"):
                if kind == "group":
                    collapsed[payload.key] = True
                    refresh(keep_key=payload.key)
                elif kind == "item":
                    # Fold the group this item belongs to and jump to its header.
                    for i in range(cursor, -1, -1):
                        if rows[i][0] == "group":
                            collapsed[rows[i][1].key] = True
                            refresh(keep_key=rows[i][1].key)
                            break

            elif key in ("o", "\r", "\n"):
                if kind == "item":
                    open_paths([payload.path])
                    message = dim(f"opened {payload.title}")
                elif kind == "group":
                    collapsed[payload.key] = not collapsed.get(payload.key)
                    refresh(keep_key=payload.key)

            elif key == "a":
                paths = [i.path for i in items if i.status == ACTIVE]
                n = open_paths(paths)
                message = dim(f"opened {n} active item{'s' if n != 1 else ''}")

            elif key == "r":
                state = load_state()
                refresh()
                message = dim("reloaded")
    return 0


# ------------------------------------------------------------------ main ----

COMMANDS = {"ls": cmd_ls, "list": cmd_ls, "ui": cmd_ui, "set": cmd_set, "open": cmd_open,
            "tools": cmd_tools}


def main(argv):
    if argv and argv[0] in ("-h", "--help", "help"):
        print(__doc__.strip())
        return 0
    if not argv:
        return cmd_open([])
    cmd = COMMANDS.get(argv[0])
    if cmd is None:
        sys.stderr.write(f"lessons: unknown command '{argv[0]}'\n")
        sys.stderr.write("try: lessons --help\n")
        return 2
    return cmd(argv[1:])


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except KeyboardInterrupt:
        sys.stdout.write("\033[?25h\033[?1049l")
        sys.exit(130)
```

- **Linux:** change `open_paths` to call `["xdg-open", p]` once per path, since `xdg-open` takes a
  single argument.
- **Global command:** fish: `~/.config/fish/functions/lessons.fish` containing
  `function lessons; ~/teaching/lessons $argv; end`. bash/zsh: `alias lessons="$HOME/teaching/lessons"`.
  Or symlink it into a `PATH` directory, which also makes it callable by agents (G2).
- The docstring says unmentioned items default to "lessons ACTIVE, references DONE". Projects also
  default to active (`default = DONE if kind == "ref" else ACTIVE`).
- `site/build.py` **imports this file** (`load_lessons_module`) for scanning and ordering. Keep
  `load_state`, `scan`, `scan_tools`, `subjects`, `order`, `Item`, `TOOLS_DIR` as they are.

### Module 3: Shared engines, tools and skill pages

The parent `assets/` holds generic engines under a `window.TEACH` namespace. They're **grown by the
agent on demand**, and the teach skill tells it to check `assets/` first and promote a component when
a second subject wants it. So you don't need to pre-write them. Seed the library with the helper
whose contract matters most (`toolpage.js`), a `README.md` stating the conventions below, and let
the agent write the engines as the first lessons need them. The author's library, for reference:

| File            | What                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store.js`      | Per-item mastery: weakness-weighted pick, stats, Leitner-ish. `localStorage` prefix `teach:`                                                                     |
| `drill.js`      | `TEACH.runDrill`, the careful trainer: choice or typed input, generator or item mode, optional deck, miss requeue, per-item-type stats, audio via `problem.play` |
| `speeddrill.js` | `TEACH.speedDrill`, beat the clock: countdown bar, streak ramp, median scoring                                                                                   |
| `quiz.js`       | `TEACH.renderQuiz`: inline retrieval quiz, options shuffled, **every answer the same length** so length can't leak the answer                                    |
| `recall.js`     | `TEACH.recallPad`: free recall (write → reveal → self-judge)                                                                                                     |
| `toolpage.js`   | `TEACH.trainer`: the skill-page helper (below)                                                                                                                   |
| `teach.css`     | Structural styles for the widgets, coloured by the subject stylesheet's tokens                                                                                   |

**Conventions to put in `assets/README.md`** (these are the engine contract):

- Link order in a lesson: `../assets/<subject>.css` (defines tokens
  `--accent --accent-2 --good --bad --ink --muted --bg --bg-sunk --rule --sans --serif`), then
  `../../assets/teach.css`, then the engine scripts. Tool pages sit at the same depth, so the
  paths are identical. They add `../../assets/toolpage.js` last.
- Items are plain objects with stable string `id`s. Resolve domain specs before handing them over.
- Audio is a function: `play: function () {…}` wrapping the subject's own player. Engines never
  import an audio library.
- One keyboard, one owner: `drill.js` and `speeddrill.js` share a `TEACH._active` token. Every engine
  returns an api with `stop()`.
- Closed means stopped (G8).

`assets/toolpage.js`, verbatim:

```javascript
/* ============================================================
   toolpage.js — the skill-page helper, shared by every subject.
   Classic script → window.TEACH. Styles: teach.css (.t-trainer).

   A skill page gathers every trainer for one skill. Each trainer
   is one call, written NEWEST FIRST (call order is page order):

   TEACH.trainer(containerElOrId, {
     id: "l13-speed",          // DOM id AND the #hash deep link —
                               // unique, and STABLE once published
     title: "The fifteen · beat the clock",
     origin: { label: "Lesson 13 · The Circle Closes",
               href:  "../lessons/0013-circle-of-fifths.html" },
     blurb: "one line of HTML",          // optional
     mount: function (stage) {           // called ONCE, on first open
       return TEACH.speedDrill(stage, { ... });
     }
   })

   Rules the helper enforces, and why:

   · Lazy. A trainer is built the first time it is opened, so a page
     of nine is a short menu on a phone rather than nine audio and
     keyboard widgets alive at once.
   · One at a time. Opening a trainer closes the others.
   · Closed means stopped. `mount` returns {stop} if the trainer
     holds timers, loops or document-level key listeners — every
     TEACH engine does. Closing a trainer calls it. Without this a
     hidden speed drill keeps timing out (recording misses into the
     deck), hidden Enter handlers keep firing, and a hidden loop
     keeps playing.
   Together: at most one trainer on a page is ever live, so they
   cannot fight over the keyboard — including the subject-specific
   ones that know nothing about TEACH._active.

   A page with a single trainer opens it; #<id> opens that trainer.

   Optional, in the page markup:
     <nav class="t-back" hidden><a href="../index.html#tools">← All tools</a></nav>
   The subject page it points at exists only on the built site, so
   the helper reveals it everywhere except file://.
   ============================================================ */
(function () {
  var TEACH = (window.TEACH = window.TEACH || {});
  var registry = [];

  TEACH.trainer = function (containerElOrId, o) {
    var host = typeof containerElOrId === "string" ? document.getElementById(containerElOrId) : containerElOrId;
    if (!host || !o || typeof o.mount !== "function") return;

    var el = document.createElement("details");
    el.className = "t-trainer";
    if (o.id) el.id = o.id;

    var summary = document.createElement("summary");
    var title = document.createElement("span");
    title.className = "t-trainer-title";
    title.textContent = o.title || o.id || "Trainer";
    summary.appendChild(title);
    if (o.origin && o.origin.label) {
      // Plain text here, the link lives in the body: a link inside a
      // <summary> is a mis-tap waiting to happen on a phone.
      var from = document.createElement("span");
      from.className = "t-trainer-origin";
      from.textContent = o.origin.label;
      summary.appendChild(from);
    }
    el.appendChild(summary);

    var body = document.createElement("div");
    body.className = "t-trainer-body";
    if (o.blurb) {
      var blurb = document.createElement("p");
      blurb.className = "t-trainer-blurb";
      blurb.innerHTML = o.blurb;
      body.appendChild(blurb);
    }
    if (o.origin && o.origin.href) {
      var p = document.createElement("p");
      p.className = "t-trainer-from";
      var a = document.createElement("a");
      a.href = o.origin.href;
      a.textContent = "From " + (o.origin.label || "the lesson") + " →";
      p.appendChild(a);
      body.appendChild(p);
    }
    var stage = document.createElement("div");
    stage.className = "t-stage";
    body.appendChild(stage);
    el.appendChild(body);
    host.appendChild(el);

    var entry = { el: el, handle: null, mounted: false };
    registry.push(entry);

    function mountOnce() {
      if (entry.mounted) return;
      entry.mounted = true;
      try {
        entry.handle = o.mount(stage) || null;
      } catch (err) {
        // No console on the phone — say so on the page.
        stage.innerHTML = '<p class="t-trainer-error">This trainer failed to start.</p>';
        if (window.console && console.error) console.error(err);
      }
    }

    // `toggle` is async and coalesced: trust el.open, not the event count.
    el.addEventListener("toggle", function () {
      if (el.open) {
        mountOnce();
        registry.forEach(function (other) { if (other !== entry && other.el.open) other.el.open = false; });
        // A focused <summary> toggles on Space/Enter — the same keys the
        // trainers use. Let go of it.
        if (document.activeElement === summary) summary.blur();
      } else if (entry.handle && typeof entry.handle.stop === "function") {
        entry.handle.stop();
      }
    });

    var api = { el: el, open: function () { mountOnce(); el.open = true; } };
    entry.api = api;
    return api;
  };

  function byHash() {
    var id = decodeURIComponent((location.hash || "").slice(1));
    if (!id) return null;
    for (var i = 0; i < registry.length; i++) {
      if (registry[i].el.id === id) return registry[i];
    }
    return null;
  }

  function openFromHash(scroll) {
    var hit = byHash();
    if (!hit) return false;
    hit.api.open();
    if (scroll && hit.el.scrollIntoView) hit.el.scrollIntoView();
    return true;
  }

  function ready() {
    if (!openFromHash(true) && registry.length === 1) registry[0].api.open();
    if (location.protocol !== "file:") {
      var back = document.querySelectorAll(".t-back[hidden]");
      for (var i = 0; i < back.length; i++) back[i].hidden = false;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
  window.addEventListener("hashchange", function () { openFromHash(true); });
})();
```

A skill page (`<subject>/tools/0003-rhythm-reading.html`) is then just:

```html
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rhythm reading · Music Theory</title>
<link rel="stylesheet" href="../assets/theory.css">
<link rel="stylesheet" href="../../assets/teach.css">
<script src="../../assets/speeddrill.js"></script>
<script src="../../assets/toolpage.js"></script>
</head><body><main>
<nav class="t-back" hidden><a href="../index.html#tools">← All tools</a></nav>
<h1>Rhythm reading</h1>
<div id="trainers"></div>
<script>
  // Newest lesson first; within a lesson, the lesson's own order.
  TEACH.trainer("trainers", {
    id: "l09-gauntlet",   // public deep link: never rename
    title: "The gauntlet · beat the clock",
    origin: { label: "Lesson 9 · Show the beats", href: "../lessons/0009-show-the-beats.html" },
    mount: function (stage) { return TEACH.speedDrill(stage, { /* exact copy of the lesson's config */ }); }
  });
</script>
</main></body></html>
```

(Needs a `.t-trainer` style block in `teach.css`: `details`/`summary` styling, `.t-trainer-origin`,
`.t-trainer-body`, `.t-stage`, `.t-trainer-error`. The agent can write it.)

**Views** are tools the site _generates_ from markdown tables the agent maintains. A reading list,
for example, is `reading/tools/0001-reading-list.view.json`:

```json
{
  "title": "Reading list",
  "sources": [
    { "file": "shelf.md", "headings": ["currently reading"] },
    { "file": "to-read.md" }
  ]
}
```

`file` is relative to the subject. `headings` matches the heading above a table by case-insensitive
substring; omit it to lift every table. Only rows are published, never prose, so only list tables
whose every cell is fine for the learner to read.

### Module 4: Projects

No code: it's a convention the skill and `CLAUDE.md` already describe, which the CLI and site
understand (they scan one folder level deep). It's the backbone of the hands-on pattern: any
real-world work like a repair, a build, a composition, a side-project app or a homelab. The
author's violin rebuild, for example:

```
<subject>/projects/20260823-enrico-full-size-rebuild/
  0000-plan.html        standing plan: status, route, decisions, standing rules, open questions, log
  0001-glue-test-and-dry-fit.html
  0002-hide-glue-and-the-linings.html
  pictures/
```

A dev's version might be `rust/projects/20261003-log-tailer-cli/` with `0001-arg-parsing.html`,
`0002-streaming-reads.html`, and screenshots or benchmark output in `pictures/`. The code itself
lives in its own repo. The project docs are the plan and the teaching around it.

- The plan is active for the life of the project and updated after **every** step. It's the doc you
  open at the workbench (or on your phone in the garage, via Module 5). Step docs are marked done as
  they complete.
- Title the plan `"<Project name> · Plan & Status"`. The site uses the part before `" · "` as the
  project's heading (title-casing the folder slug mangles acronyms).
- The typical flow: you do an initial assessment (photos, observations, what exists so far) → the
  agent writes a plan that serves the **mission**, not just the task → step docs → report back →
  plan log updated. The mission part matters: the question isn't only "how do I fix this?" but "what
  should I do with this to get closer to the mission?"

### Module 5: The mobile site

`site/build.py`, verbatim apart from the learner's name. It's pure stdlib and imports `../lessons`:

```python
#!/usr/bin/env python3
"""build.py — render the teaching workspaces into a static, read-only site.

    python3 site/build.py          (from the repo root; Netlify runs the same)

Output goes to site/dist/:
  - every subject's lessons/reference/projects/tools docs (html, pdf, pictures)
    plus subject and shared assets, mirrored so relative links keep working
  - index.html — Home: everything ACTIVE across all subjects, a chip per subject
  - <subject>/index.html — the subject page: that subject's shelves, one tab
    each: Now / Tools / Reference / Projects / Lessons
  - <subject>/tools/<name>.html for every view (tools/<name>.view.json): a tool
    generated from the TABLES of markdown files the view names (the reading list)

Deliberately excluded — agent-facing material the teaching method depends on
the learner not reading: state.json `note` fields, NOTES.md, MISSION.md, RESOURCES.md,
learning-records/, and every other .md file's prose. Only pipe-table rows are
ever lifted from markdown, and only from tables a view explicitly names.
"""

import html
import importlib.util
import json
import os
import re
import shutil
import sys
from datetime import date
from importlib.machinery import SourceFileLoader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "site", "dist")

# Never copied into the site.
SKIP_EXTS = (".md", ".mscz", ".view.json")
KIND_LABEL = {"lesson": "lesson", "ref": "reference", "project": "project", "tool": "tool"}

VIEW_SUFFIX = ".view.json"
# Never a view source, whatever a view file asks for: tables in these are agent-facing too.
AGENT_ONLY = ("notes.md", "mission.md", "resources.md")
AGENT_ONLY_DIRS = ("learning-records",)

# The subject page's shelves, in tab order. A tab exists only when its shelf is non-empty.
SHELVES = (("now", "Now"), ("tools", "Tools"), ("reference", "Reference"),
           ("projects", "Projects"), ("lessons", "Lessons"))


def load_lessons_module():
    """The `lessons` CLI owns scanning and ordering — reuse it, one implementation."""
    path = os.path.join(ROOT, "lessons")
    spec = importlib.util.spec_from_loader("lessons_cli", SourceFileLoader("lessons_cli", path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def warn(msg):
    sys.stderr.write("build: " + msg + "\n")


# ---------------------------------------------------------------- copy ----


def copy_tree(src, dst):
    """Copy a directory, skipping dotfiles and SKIP_EXTS. Returns file count."""
    n = 0
    for dirpath, dirnames, filenames in os.walk(src):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        rel = os.path.relpath(dirpath, src)
        for f in filenames:
            if f.startswith(".") or f.lower().endswith(SKIP_EXTS):
                continue
            out_dir = os.path.join(dst, rel) if rel != "." else dst
            os.makedirs(out_dir, exist_ok=True)
            shutil.copy2(os.path.join(dirpath, f), os.path.join(out_dir, f))
            n += 1
    return n


def copy_content(subjects):
    n = 0
    shared = os.path.join(ROOT, "assets")
    if os.path.isdir(shared):
        n += copy_tree(shared, os.path.join(DIST, "assets"))
    for subject in subjects:
        for d in ("lessons", "reference", "projects", "tools", "assets"):
            src = os.path.join(ROOT, subject, d)
            if os.path.isdir(src):
                n += copy_tree(src, os.path.join(DIST, subject, d))
    return n


# ------------------------------------------------------------ markdown ----

MD_JUNK = [
    (re.compile(r"\[\[([^\]]+)\]\]"), r"\1"),          # [[wikilink]] -> text
    (re.compile(r"\[([^\]]+)\]\([^)]*\)"), r"\1"),      # [text](url) -> text
    (re.compile(r"`([^`]*)`"), r"\1"),                  # `code` -> text
    (re.compile(r"\*\*([^*]+)\*\*"), r"\1"),            # **bold** -> text
    (re.compile(r"\*([^*]+)\*"), r"\1"),                # *em* -> text
]


def clean_cell(s):
    s = s.strip()
    for rx, rep in MD_JUNK:
        s = rx.sub(rep, s)
    return s


def md_tables(text):
    """Yield (heading, headers, rows) for every pipe table in `text`.

    Only table ROWS are ever extracted — surrounding prose (which may hold
    agent-facing analysis) is never emitted.
    """
    heading = ""
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = re.match(r"#{1,6}\s+(.*)", line)
        if m:
            heading = clean_cell(m.group(1))
            i += 1
            continue
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|$", lines[i + 1].strip()):
            headers = [clean_cell(c) for c in line.strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [clean_cell(c) for c in lines[i].strip().strip("|").split("|")]
                cells += [""] * (len(headers) - len(cells))
                rows.append(cells[: len(headers)])
                i += 1
            if rows:
                yield heading, headers, rows
            continue
        i += 1


# ----------------------------------------------------------------- html ----

PAGE_CSS = """
  :root {
    --bg:#faf8f4; --card:#fff; --ink:#1c1b18; --muted:#726d63; --rule:#e2ddd3;
    --accent:#3b5bdb; --good:#2f9e44; --chip:#f0ece4;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#161513; --card:#211f1c; --ink:#eae6de; --muted:#9c968a;
            --rule:#38352f; --accent:#7b96f2; --good:#69c779; --chip:#2b2925; }
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;
         -webkit-text-size-adjust:100%; }
  main { max-width:640px; margin:0 auto; padding:1.2rem 1rem 4rem; }
  h1 { font-size:1.5rem; margin:0.4rem 0 0.2rem; }
  .sub { color:var(--muted); font-size:0.85rem; margin:0 0 1.4rem; }
  .nav { display:flex; gap:0.5rem; flex-wrap:wrap; margin:0 0 1.6rem; }
  .nav a { color:var(--accent); text-decoration:none; font-weight:600; font-size:0.9rem;
           background:var(--chip); border:1px solid var(--rule); border-radius:999px;
           padding:0.35em 0.95em; }
  .tabs a { color:var(--muted); }
  .tabs a.on { color:var(--bg); background:var(--accent); border-color:var(--accent); }
  h2 { font-size:0.8rem; letter-spacing:0.12em; text-transform:uppercase;
       color:var(--muted); margin:1.8rem 0 0.6rem; }
  h2 a { color:inherit; text-decoration:none; }
  h2 a::after { content:" ›"; }
  h3 { font-size:0.95rem; margin:1.4rem 0 0.5rem; }
  .js .shelf { display:none; }
  .js .shelf.on { display:block; }
  .js .shelf > h2 { display:none; }
  .js .shelf > h3:first-of-type { margin-top:0; }
  .card { display:block; background:var(--card); border:1px solid var(--rule);
          border-radius:12px; padding:0.75rem 0.95rem; margin-bottom:0.55rem;
          text-decoration:none; color:var(--ink); }
  .card:active { border-color:var(--accent); }
  .card.done { opacity:0.6; }
  .card .t { font-weight:600; }
  .card .m { display:flex; gap:0.6em; align-items:center; color:var(--muted);
             font-size:0.75rem; margin-top:0.25rem; }
  .dot { color:var(--good); }
  .kind { background:var(--chip); border-radius:5px; padding:0.05em 0.5em; }
  .bookcard { background:var(--card); border:1px solid var(--rule); border-radius:12px;
              padding:0.75rem 0.95rem; margin-bottom:0.55rem; }
  .bookcard .t { font-weight:600; }
  .bookcard .row { color:var(--muted); font-size:0.8rem; margin-top:0.2rem; }
  .bookcard .row b { color:var(--ink); font-weight:600; }
  footer { color:var(--muted); font-size:0.75rem; margin-top:2.5rem; }
"""

# Subject-page tabs. Without JS every shelf is simply stacked and the tab bar
# works as jump links; with it, one shelf shows at a time and #tools-style
# hashes are stable, bookmarkable addresses.
TAB_JS = """
(function () {
  var tabs = [].slice.call(document.querySelectorAll(".tabs a")),
      shelves = [].slice.call(document.querySelectorAll(".shelf"));
  if (!tabs.length) return;
  // Drop the ids so arriving on #tools never scrolls past the tab bar.
  shelves.forEach(function (s) { s.setAttribute("data-shelf", s.id); s.removeAttribute("id"); });
  function show(id) {
    if (!tabs.some(function (a) { return a.hash === "#" + id; })) return false;
    tabs.forEach(function (a) { a.classList.toggle("on", a.hash === "#" + id); });
    shelves.forEach(function (s) { s.classList.toggle("on", s.getAttribute("data-shelf") === id); });
    return true;
  }
  function fromHash() { if (!show(location.hash.slice(1))) show(tabs[0].hash.slice(1)); }
  document.documentElement.classList.add("js");
  tabs.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      show(a.hash.slice(1));
      // replaceState, not a new entry: Back leaves the subject page in one step.
      try { history.replaceState(null, "", a.hash); } catch (err) {}
    });
  });
  window.addEventListener("hashchange", fromHash);
  fromHash();
  if (location.hash) window.scrollTo(0, 0);
})();
"""

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' "
           "viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8E%93%3C/text%3E%3C/svg%3E")


def page(title, body):
    return (
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
        "<meta name=\"robots\" content=\"noindex\">\n"
        "<title>" + html.escape(title) + "</title>\n"
        "<link rel=\"icon\" href=\"" + FAVICON + "\">\n"
        "<style>" + PAGE_CSS + "</style>\n</head>\n<body>\n<main>\n" + body + "\n</main>\n</body>\n</html>\n"
    )


def esc(s):
    return html.escape(str(s), quote=True)


def pretty(subject):
    return subject.replace("-", " ").title()


def display_title(it):
    """Prettify bare-filename titles (PDFs and title-less docs)."""
    t = it.title
    base = os.path.basename(it.rel)
    if t == base:
        stem, ext = os.path.splitext(base)
        stem = re.sub(r"^\d+-", "", stem).replace("-", " ").strip().title()
        t = stem + (" (" + ext[1:].upper() + ")" if ext.lower() == ".pdf" else "")
    return t


def shelf_title(it):
    """On its own subject's page an item needn't repeat the subject:
    'Kana · Japanese' -> 'Kana'. The document's <title> keeps it, for tabs and bookmarks."""
    t = display_title(it)
    for sep in (" · ", " — ", " - "):
        suffix = sep + pretty(it.subject)
        if len(t) > len(suffix) and t.lower().endswith(suffix.lower()):
            return t[: -len(suffix)]
    return t


def item_card(it, updated="", prefix="", show_kind=True, done=False, title=None):
    """`prefix` is the path from the page being built to the item's subject folder."""
    meta = []
    if it.status == "active":
        meta.append('<span class="dot">●</span>')
    if show_kind:
        meta.append('<span class="kind">' + esc(KIND_LABEL.get(it.kind, it.kind)) + "</span>")
    if updated:
        meta.append("<span>" + esc(updated) + "</span>")
    return (
        '<a class="card' + (" done" if done else "") + '" href="' + esc(prefix + it.rel) + '">'
        '<span class="t">' + esc(title or display_title(it)) + "</span>"
        + ('<span class="m">' + "".join(meta) + "</span>" if meta else "") + "</a>"
    )


# ----------------------------------------------------------------- home ----


def build_index(mod, items, state, pages):
    """Home answers one question: what is live right now, across every subject."""
    recs = state.get("items", {})
    active = [i for i in items if i.status == "active"]
    body = ["<h1>Teaching</h1>",
            '<p class="sub">' + str(len(active)) + " active · built " + date.today().isoformat() + "</p>"]

    chips = ['<a href="' + esc(s + "/index.html") + '">' + esc(pretty(s)) + "</a>" for s in pages]
    if chips:
        body.append('<div class="nav">' + "".join(chips) + "</div>")

    for subject, group in mod.order(active):
        name = esc(pretty(subject))
        if subject in pages:
            name = '<a href="' + esc(subject + "/index.html") + '">' + name + "</a>"
        body.append("<h2>" + name + "</h2>")
        for it in group:
            body.append(item_card(it, recs.get(it.key, {}).get("updated", ""), prefix=subject + "/"))

    body.append("<footer>Read-only mirror · state is managed from the desktop</footer>")
    return page("Teaching", "\n".join(body))


# --------------------------------------------------------- subject page ----


def project_groups(items):
    """[(label, [Item])] — one group per project folder, newest project first;
    inside a group the standing plan leads, then steps newest first."""
    groups = {}
    for it in items:
        parts = it.rel.split("/")
        groups.setdefault(parts[1] if len(parts) >= 3 else "", []).append(it)
    out = []
    for key in sorted(groups, reverse=True):
        group = sorted(groups[key], key=lambda i: (
            not os.path.basename(i.rel).startswith("0000-"), -i.sort, i.title))
        # The plan's own title names the project ("VSO Setup Bench · Plan & Status");
        # the folder slug is only the fallback, since title-casing it mangles "VSO".
        plan = display_title(group[0]) if os.path.basename(group[0].rel).startswith("0000-") else ""
        label = plan.split(" · ")[0].strip() if " · " in plan else ""
        label = label or re.sub(r"^\d{8}-", "", key).replace("-", " ").strip().title() or "Other"
        out.append((label, group))
    return out


def build_subject(mod, subject, items, tools, state):
    """The subject page answers the other question: where is that thing?
    Returns None when the subject has nothing to show."""
    recs = state.get("items", {})
    mine = [i for i in items if i.subject == subject]

    def card(it, **kw):
        return item_card(it, recs.get(it.key, {}).get("updated", ""), **kw)

    def is_done(it):
        return it.status != "active"

    ordered = mod.order([i for i in mine if i.status == "active"])
    now = ordered[0][1] if ordered else []
    refs = sorted((i for i in mine if i.kind == "ref"),
                  key=lambda i: (is_done(i), display_title(i).lower()))
    lessons = sorted((i for i in mine if i.kind == "lesson"), key=lambda i: (-i.sort, i.title))
    shelf_tools = sorted((t for t in tools if t.subject == subject),
                         key=lambda t: (-t.sort, display_title(t).lower()))

    projects = []
    for label, group in project_groups([i for i in mine if i.kind == "project"]):
        projects.append("<h3>" + esc(label) + "</h3>")
        projects.extend(card(it, show_kind=False, done=is_done(it)) for it in group)

    content = {
        "now": [card(it) for it in now],
        # Tools are stateless: no dot, no date, nothing to dim.
        "tools": [item_card(it, show_kind=False, title=shelf_title(it)) for it in shelf_tools],
        "reference": [card(it, show_kind=False, title=shelf_title(it)) for it in refs],
        "projects": projects,
        "lessons": [card(it, show_kind=False, done=is_done(it)) for it in lessons],
    }
    shelves = [(sid, label, content[sid]) for sid, label in SHELVES if content[sid]]
    if not shelves:
        return None

    title = pretty(subject)
    body = ['<div class="nav"><a href="../index.html">← Home</a></div>',
            "<h1>" + esc(title) + "</h1>",
            '<p class="sub">built ' + date.today().isoformat() + "</p>"]
    if len(shelves) > 1:
        body.append('<div class="nav tabs">' + "".join(
            '<a href="#' + sid + '">' + esc(label) + "</a>" for sid, label, _ in shelves) + "</div>")
    for sid, label, cards in shelves:
        body.append('<section class="shelf" id="' + sid + '">')
        body.append("<h2>" + esc(label) + "</h2>")
        body.extend(cards)
        body.append("</section>")
    if len(shelves) > 1:
        body.append("<script>" + TAB_JS + "</script>")
    return page(title, "\n".join(body))


# ---------------------------------------------------------------- views ----


def safe_source(subject, rel):
    """Absolute path of a view's markdown source, or None if it may not be read.

    A view can only ever lift tables from a .md file inside its own subject
    folder — and never from the agent-only files, whose tables are as
    do-not-spoil as their prose.
    """
    if not isinstance(rel, str) or not rel.strip():
        return None
    if os.path.isabs(rel) or rel.startswith("~"):
        return None
    parts = [p.lower() for p in rel.replace("\\", "/").split("/")]
    if ".." in parts or any(p in AGENT_ONLY_DIRS for p in parts):
        return None
    if not parts[-1].endswith(".md") or parts[-1] in AGENT_ONLY:
        return None
    base = os.path.realpath(os.path.join(ROOT, subject))
    full = os.path.realpath(os.path.join(base, rel))
    try:
        if os.path.commonpath([base, full]) != base:
            return None
    except ValueError:
        return None
    if os.path.basename(full).lower() in AGENT_ONLY or not os.path.isfile(full):
        return None
    return full


def book_cards(headers, rows):
    out = []
    for row in rows:
        first = row[0] if row else ""
        lines = []
        for h, c in list(zip(headers, row))[1:]:
            if c and c not in ("—", "-"):
                lines.append('<div class="row"><b>' + esc(h) + ":</b> " + esc(c) + "</div>")
        out.append('<div class="bookcard"><div class="t">' + esc(first) + "</div>" + "".join(lines) + "</div>")
    return out


def view_sections(subject, spec, name):
    """Table rows only — never the prose around them."""
    sections = []
    sources = spec.get("sources")
    for src in sources if isinstance(sources, list) else []:
        rel = src.get("file") if isinstance(src, dict) else None
        path = safe_source(subject, rel)
        if not path:
            warn("%s: source %r is not allowed or not found — skipped" % (name, rel))
            continue
        heads = src.get("headings")  # None = every table; a list = substring match; [] = none
        try:
            with open(path, encoding="utf-8") as fh:
                text = fh.read()
        except OSError:
            continue
        for heading, headers, rows in md_tables(text):
            if heads is not None and not any(str(w).lower() in heading.lower() for w in heads):
                continue
            sections.append("<h2>" + esc(heading or os.path.basename(path)) + "</h2>")
            sections.extend(book_cards(headers, rows))
    return sections


def build_views(mod, subjects):
    """Render every tools/*.view.json into dist. Returns {subject: [Item]} so the
    views sit on the Tools shelf beside the authored tools. A broken view is
    skipped with a warning — it must never fail the deploy."""
    out = {}
    for subject in subjects:
        d = os.path.join(ROOT, subject, mod.TOOLS_DIR)
        if not os.path.isdir(d):
            continue
        for fname in sorted(os.listdir(d)):
            if fname.startswith(".") or not fname.lower().endswith(VIEW_SUFFIX):
                continue
            name = subject + "/" + mod.TOOLS_DIR + "/" + fname
            stem = fname[: -len(VIEW_SUFFIX)]
            try:
                with open(os.path.join(d, fname), encoding="utf-8") as fh:
                    spec = json.load(fh)
            except (OSError, ValueError) as exc:
                warn("%s: unreadable (%s) — skipped" % (name, exc))
                continue
            if not isinstance(spec, dict):
                warn("%s: not a JSON object — skipped" % name)
                continue
            dest = os.path.join(DIST, subject, mod.TOOLS_DIR, stem + ".html")
            if os.path.exists(dest):
                warn("%s: an authored tool already owns %s.html — skipped" % (name, stem))
                continue
            sections = view_sections(subject, spec, name)
            if not sections:
                warn("%s: no table rows matched — skipped" % name)
                continue

            m = re.match(r"(\d+)", stem)
            title = spec.get("title") if isinstance(spec.get("title"), str) else ""
            it = mod.Item(subject, mod.TOOLS_DIR + "/" + stem + ".html", "tool",
                          title.strip() or stem + ".html", "", "", int(m.group(1)) if m else 0)
            body = ['<div class="nav"><a href="../index.html#tools">← ' + esc(pretty(subject)) + "</a></div>",
                    "<h1>" + esc(display_title(it)) + "</h1>",
                    '<p class="sub">built ' + date.today().isoformat() + "</p>"]
            body.extend(sections)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8") as fh:
                fh.write(page(display_title(it), "\n".join(body)))
            out.setdefault(subject, []).append(it)
    return out


# ----------------------------------------------------------- collisions ----


def shadowed_folders():
    """Every `<name>.html` in dist that sits beside a folder `<name>/`.

    Netlify answers /<name>/ with <name>.html, not <name>/index.html — so the
    folder's index silently becomes unreachable, and no local server shows it.
    (A root-level reading.html once swallowed the whole Reading subject page.)
    Never generate a page named after a folder at the same level."""
    hits = []
    for dirpath, dirnames, filenames in os.walk(DIST):
        for f in filenames:
            stem, ext = os.path.splitext(f)
            if ext.lower() in (".html", ".htm") and stem in dirnames:
                hits.append(os.path.relpath(os.path.join(dirpath, f), DIST))
    return sorted(hits)


# ----------------------------------------------------------------- main ----


def main():
    mod = load_lessons_module()
    state = mod.load_state()
    items = mod.scan(state)
    tools = mod.scan_tools()
    subjects = mod.subjects()

    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST, exist_ok=True)

    copied = copy_content(subjects)

    views = build_views(mod, subjects)
    for group in views.values():
        tools.extend(group)

    pages = []
    for subject in subjects:
        subject_html = build_subject(mod, subject, items, tools, state)
        if not subject_html:
            continue
        os.makedirs(os.path.join(DIST, subject), exist_ok=True)
        with open(os.path.join(DIST, subject, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(subject_html)
        pages.append(subject)

    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(build_index(mod, items, state, pages))

    for hit in shadowed_folders():
        warn("%s shadows the folder of the same name on Netlify — its index.html is unreachable" % hit)

    with open(os.path.join(DIST, "robots.txt"), "w", encoding="utf-8") as fh:
        fh.write("User-agent: *\nDisallow: /\n")

    print("built %s: %d files copied, %d items indexed (%d active), %d tools (%d views), "
          "%d subject pages"
          % (DIST, copied, len(items), sum(1 for i in items if i.status == "active"),
             len(tools), sum(len(g) for g in views.values()), len(pages)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

`netlify.toml` at the root:

```toml
[build]
  command = "python3 site/build.py"
  publish = "site/dist"
```

**Deploy (do this with the user, since it needs their accounts):**

1. Push the repo to a **private** GitHub repo.
2. In Netlify, create a site from that repo. The build settings come from `netlify.toml`. (The author
   triggers builds with a GitHub push webhook calling a Netlify **build hook**
   (Site configuration → Build & deploy → Build hooks). Netlify's normal Git integration, which
   builds on every push to `main`, is equivalent. Either way, **pushing is publishing**.)
3. Turn on site-wide password protection (Site configuration → Access & security / Visitor access →
   Password protection). **Check the user's Netlify plan.** This has historically been a paid-tier
   feature; confirm on Netlify's current pricing page rather than assuming. If it isn't available,
   ask what they'd like instead (e.g. Cloudflare Pages + Cloudflare Access).
4. The password is chosen by the user. It never goes in the repo. If they want a local copy for
   reference, keep it in a gitignored file.
5. The builder already emits `robots.txt` (Disallow all) and `noindex` meta.

What gets published: all lessons/reference/projects/tools HTML, PDFs, pictures, subject + shared
assets, a Home page (everything active, a chip per subject) and a tabbed page per subject
(Now / Tools / Reference / Projects / Lessons, empty shelves omitted, `#tools`-style hashes
bookmarkable). What never gets published: any `.md`, `learning-records/`, `NOTES.md`/`MISSION.md`/
`RESOURCES.md`, `note` fields, `.view.json` sources (G9).

**If skipping this module:** drop `site/`, `netlify.toml`, and the "Mobile site" and push-related
lines of the root `CLAUDE.md` and skill ("Session End" can stay as commit-only, or go).

### Module 6: Extras for ideas-heavy subjects (the debrief; reading list and Libby)

This is what the author's `reading/` workspace runs on. 6a (the debrief) works for any ideas-heavy
subject: books, papers, conference talks, a lecture series, a documentary. 6b–6c are specific to
books. The design goal is **zero capture while consuming**: nothing is generated mid-book or
mid-talk. Everything happens in debriefs, after the fact.

**6a. The debrief ritual.** In each ideas-heavy subject, have the agent create
`<subject>/reference/the-debrief.html` (keep it active) describing these four steps, and then follow
them:

1. **You talk, I shut up (~2 min).** Free recall from memory, source closed, no order, nothing
   looked up. Retrieval is the mechanism: cite Roediger & Karpicke's testing-effect research.
2. **I ask why (~3 min).** Elaborative interrogation: why would that be true, what does it
   contradict, what would have to be false for the author to be wrong. "I don't know" is a real
   answer. The calibration in the root `CLAUDE.md` does most of its work here.
3. **We hunt connections (~3 min).** The agent searches the learner's notes vault (Module 7) for
   anything that rhymes: other books, old notes, other domains. Old notes that _contradict_ what you
   just said are the best finds. This is the step a human can't do across thousands of notes. With
   no vault yet, it searches earlier debriefs and learning records instead, and the step gets better
   as notes pile up.
4. **I write it up. You don't (0 min).** The agent writes a source note and atomic notes into the
   vault in the learner's conventions (Module 7). The learner never touches a file (G15).

Two modes: **curiosity mid-source** (chase a live tangent now, because the live thread decays
fastest) and **residue once cooled** (one to four weeks after finishing: delay improves recall,
immediacy improves ideas). Keep an ideas subject's curriculum **finite** (the author's reading
workspace targets about six lessons) and then it's just the loop. An endless course recreates the
chore that kills reading and note-taking habits.

**6b. `shelf.md` and `to-read.md` (books).** Agent-maintained. The learner never edits them. The
to-read tables use this exact format (G14):

```markdown
## Wanted

| Book | Author | Why it's here | Added | From |
|---|---|---|---|---|
| Everything Is Tuberculosis | John Green | follow-up to the Dracula debrief | 2026-08-01 | me |

## Dropped

| Book | Why it came off | Date |
|---|---|---|
```

`From` is who proposed it (the learner, or the agent). **The agent proposes a book with its reason
and adds it only after the learner agrees.** `shelf.md` has a `## Currently reading` table the view
lifts. Everything in those tables is published by the view (Module 3), so keep every cell
learner-safe.

For papers or talks, the same idea works as `to-watch.md` or `queue.md` with its own view.
`libby` is the only part that is book-specific.

**6c. `reading/libby`**, `chmod +x`. It checks every to-read title against the OverDrive public
catalogue API (`thunder.api.overdrive.com/v2/libraries/<key>/media`, no auth, verified working
2026-09). Set `LIBRARY` to the user's library key: the `<key>` in their
`https://libbyapp.com/library/<key>` URL. Ask them which library.

```python
#!/usr/bin/env python3
"""
libby — availability dashboard for the to-read list, against your public
        library's OverDrive/Libby collection (set LIBRARY below).

Reads the book tables in to-read.md (single source of truth — nothing to keep in
sync) and queries OverDrive's public catalogue API for each title. Reports what
can be borrowed right now, what has a queue and how long it is, and what the
library does not hold at all.

    ./libby              full dashboard
    ./libby --available  only what can be borrowed right now
    ./libby --ebook      only ebooks   (--audio for audiobooks)
    ./libby --raw        one tab-separated line per format, for piping

No authentication and no account access: copy counts and hold queues are public
catalogue data. Your own holds and checkouts are NOT visible here — Libby itself
is the only place to see those.

Written in Python rather than shell because the API returns JSON and the to-read
tables need parsing; both are miserable in bash. Runs the same way regardless.
"""

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

LIBRARY = "YOUR-LIBRARY-KEY"  # your library's key: the <key> in https://libbyapp.com/library/<key>
API = "https://thunder.api.overdrive.com/v2/libraries/{}/media"
TO_READ = Path(__file__).resolve().parent / "to-read.md"
TIMEOUT = 20
PAUSE = 0.3  # be polite to the API

C = {
    "reset": "\033[0m", "dim": "\033[2m", "bold": "\033[1m",
    "green": "\033[32m", "yellow": "\033[33m", "red": "\033[31m",
    "cyan": "\033[36m",
}
if not sys.stdout.isatty():
    C = {k: "" for k in C}


def norm(s):
    """Lowercase, strip punctuation and articles, collapse whitespace."""
    s = re.sub(r"[^\w\s]", " ", s.lower())
    s = re.sub(r"\b(the|a|an)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_to_read(path):
    """Pull (title, author) out of the 5-column book tables in to-read.md.

    The Dropped table has 3 columns and is skipped by the width check, so
    dropped books never come back as suggestions.
    """
    if not path.exists():
        sys.exit(f"can't find {path}")
    out, seen = [], set()
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line.startswith("|") or set(line) <= set("|- "):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 5 or cells[0].lower() in ("book", ""):
            continue
        raw_title, author = cells[0], cells[1]

        # "(Monk & Robot)" / "(essay)" are annotations, not part of the title
        raw_title = re.sub(r"\s*\([^)]*\)", "", raw_title)
        raw_title = raw_title.replace("**", "").replace("*", "")
        author = re.sub(r"\s*\([^)]*\)", "", author).replace("*", "").strip()

        # "A · B" is two books; "X or Y or Z" is an unresolved either/or
        parts = [p for chunk in raw_title.split("·") for p in re.split(r"\s+or\s+", chunk)]
        for title in (p.strip() for p in parts):
            if not title or title == "—":
                continue
            key = norm(title)
            if key and key not in seen:
                seen.add(key)
                out.append((title, author))
    return out


def surnames(author):
    """All surnames in the cell — 'Crockford / Simpson / Ferrantelli' is three
    different authors of three different books, so any of them counts."""
    out = []
    for part in re.split(r"[/&,]| and ", author):
        bits = [b for b in part.split() if len(b) > 2 and b.lower() != "eds"]
        if bits:
            out.append(bits[-1].lower())
    return out


def search(title, author):
    q = f"{title} {author}".strip()
    url = f"{API.format(LIBRARY)}?" + urllib.parse.urlencode(
        {"query": q, "perPage": 24}
    )
    req = urllib.request.Request(url, headers={"User-Agent": "libby-dashboard/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.load(r).get("items", [])
    except Exception as e:
        print(f"  {C['red']}! {title}: {e}{C['reset']}", file=sys.stderr)
        return None


def matches(items, title, author):
    """Keep only plausible hits — fuzzy search returns unrelated books."""
    t, sns = norm(title), surnames(author)
    hits = []
    for it in items:
        it_t = norm(it.get("title", ""))
        if not (t and it_t) or not (t in it_t or it_t in t):
            continue
        if sns:
            names = " ".join(
                [it.get("firstCreatorName", "")]
                + [c.get("name", "") for c in it.get("creators", [])]
            ).lower()
            if not any(s in names for s in sns):
                continue
        hits.append(it)
    return hits


def fmt_row(it):
    kind = (it.get("type") or {}).get("name", "?")
    avail = it.get("isAvailable")
    owned = it.get("ownedCopies") or 0
    free = it.get("availableCopies") or 0
    holds = it.get("holdsCount") or 0
    wait = it.get("estimatedWaitDays")
    return {
        "kind": kind, "avail": bool(avail), "owned": owned,
        "free": free, "holds": holds,
        "wait": wait if isinstance(wait, int) else None,
        "holdable": bool(it.get("isHoldable")),
    }


def main():
    args = set(sys.argv[1:])
    only_avail = "--available" in args
    want = None
    if "--ebook" in args:
        want = "ebook"
    elif "--audio" in args:
        want = "audiobook"
    raw = "--raw" in args

    books = parse_to_read(TO_READ)

    if "--list" in args:  # what was parsed out of to-read.md, no network
        for t, a in books:
            print(f"{t}  —  {a}")
        return

    if not raw:
        print(f"\n{C['bold']}LIBBY · {LIBRARY}{C['reset']}")
        print(f"{C['dim']}{len(books)} titles from to-read.md · public catalogue data, "
              f"not your account{C['reset']}\n")

    now, queued, absent, unsure = [], [], [], []

    for title, author in books:
        items = search(title, author)
        time.sleep(PAUSE)
        if items is None:
            unsure.append((title, author))
            continue
        hits = matches(items, title, author)
        if not hits:
            absent.append((title, author))
            continue
        for it in hits:
            row = fmt_row(it)
            if want and want.lower() not in row["kind"].lower():
                continue
            row.update(title=it.get("title", title),
                       author=it.get("firstCreatorName", author))
            (now if row["avail"] else queued).append(row)

    queued.sort(key=lambda r: (r["wait"] is None, r["wait"] or 0))
    now.sort(key=lambda r: r["title"].lower())

    if raw:
        for r in now + queued:
            print("\t".join([
                "AVAILABLE" if r["avail"] else "WAIT",
                r["title"], r["author"], r["kind"],
                # OverDrive still reports a wait on available titles; it's noise there
                "" if r["avail"] else str(r["wait"] or ""),
                str(r["holds"]), str(r["owned"]),
            ]))
        return

    if now:
        print(f"{C['green']}{C['bold']}BORROW NOW{C['reset']}")
        for r in now:
            print(f"  {C['green']}●{C['reset']} {r['title']} {C['dim']}— {r['author']}{C['reset']}")
            print(f"      {C['cyan']}{r['kind']:<10}{C['reset']} {r['free']} of {r['owned']} copies free")
        print()

    if queued and not only_avail:
        print(f"{C['yellow']}{C['bold']}WAITING LIST{C['reset']}")
        for r in queued:
            w = f"~{r['wait']} days" if r["wait"] is not None else "unknown wait"
            if r["holds"] == 0:
                # every copy is out but nobody is queued — a hold puts you first
                per = f" · no queue, you'd be next ({r['owned']} copies out)"
            else:
                per = (f" · {r['holds']} ahead of you on "
                       f"{r['owned']} cop{'y' if r['owned'] == 1 else 'ies'}")
            print(f"  {C['yellow']}○{C['reset']} {r['title']} {C['dim']}— {r['author']}{C['reset']}")
            print(f"      {C['cyan']}{r['kind']:<10}{C['reset']} {w}{C['dim']}{per}{C['reset']}")
        print()

    if absent and not only_avail:
        print(f"{C['dim']}{C['bold']}NOT IN THE COLLECTION{C['reset']}")
        for t, a in absent:
            print(f"  {C['dim']}·  {t} — {a}{C['reset']}")
        print(f"  {C['dim']}   (Libby can take a purchase suggestion for these){C['reset']}\n")

    if unsure:
        print(f"{C['red']}COULD NOT CHECK{C['reset']}")
        for t, a in unsure:
            print(f"  ?  {t} — {a}")
        print()


if __name__ == "__main__":
    main()
```

Flags: `--available`, `--ebook`, `--audio`, `--raw` (TSV), `--list` (show what was parsed, no
network).

**If skipping parts:** `libby` alone can go if their library isn't on Libby. Keep the table format
anyway, since the view uses it.

### Module 7: The notes vault and capture (optional)

The author keeps a large zettelkasten (markdown with `[[wikilinks]]`, years of notes) outside this
repo, and a separate `capture` skill that owns the note conventions, searches for existing notes to
link, and handles duplicates. The division of labour is **"teach elicits, capture writes"**: the
teaching agent does the questioning and retrieval, and once the learner agrees something is worth
keeping, the ideas are handed to the capture step.

These rules apply whichever vault is used:

- Only **ideas-heavy** subjects feed the vault. Skill-heavy and hands-on subjects (scales,
  woodworking, kana, syntax) produce trainers, project logs and learning records, **not** notes.
  Don't let an agent start capturing scale degrees or API signatures.
- The bar is high: important **and** not already known. An empty capture is a valid outcome. The
  learner's own opinions are opt-in, never swept up.
- Lessons, reference docs, project docs and learning records stay in the workspace. They're
  workspace artifacts, not knowledge notes.

**Pick the case that matches the user:**

1. **They already keep a vault** (Obsidian, Logseq, a folder of markdown): ask where it is and read
   a dozen notes to learn its conventions: filenames, frontmatter, link style, source-note format.
   Write those conventions into a `## Notes vault` section of the root `CLAUDE.md`. Grant sessions
   access: `claude --add-dir .. --add-dir ~/path/to/vault`, or add it to `additionalDirectories` in
   the user's Claude Code settings.
2. **They don't keep one:** create `vault/` inside the teaching root, which keeps it in git and
   reachable from every subject session through `--add-dir ..`. It's safe there: the `lessons` CLI
   only counts a folder as a subject if it has `lessons/`, `reference/`, `projects/` or `tools/`,
   and `site/build.py` never copies it (it copies only subjects' kind folders and never publishes
   `.md`). Add this to the root `CLAUDE.md`:

    ```markdown
    ## Notes vault
    `vault/` holds my atomic notes: one idea per file, named as the idea in dash-case
    (`tuberculosis-shaped-the-vampire-myth.md`), written in my voice, linking related notes with
    [[note-name]]. Each source (book, paper, talk) gets one source note, `source-<dash-case-title>.md`,
    listing the atomic notes that came from it. Before writing, search the vault for notes to link
    or update instead of duplicating. Only ideas-heavy subjects write here.
    ```

    If the user later adopts Obsidian, they can open `vault/` directly as a vault.

3. **They have a note-writing skill:** point the teach skill's "Capturing Knowledge Beyond the
   Workspace" section at it (1a). Otherwise that section should point at the `## Notes vault`
   conventions.

**If skipping this module:** delete the "Capturing Knowledge Beyond the Workspace" section of the
skill. The debrief then ends at step 3, and its connection hunt searches only the workspace.

---

## Install order

Install all of it unless the user said otherwise. Each step is demoable before the next.

1. **Root skeleton:** create the root folder, `git init`, root `CLAUDE.md` (1b, including Subject
   patterns and Calibration), `.gitignore` (1c), empty `state.json`. _Demo: nothing yet._
2. **Teach skill** (1a). Then `mkdir <first-subject>/{lessons,reference,assets,learning-records}`,
   `cd` in, `claude --add-dir ..`, `/teach`, and let it interview for `MISSION.md`. It should then
   name the subject's pattern(s) and record them in `NOTES.md`. _Demo: a mission and a pattern
   choice._
3. **`lessons` CLI** (Module 2) + global command. _Demo: after the first lesson, `lessons ui` lists it
   as active._
4. **Shared assets** (Module 3): `assets/README.md` with the conventions, `toolpage.js`. The engines
   and `teach.css` get written as the first lessons need them. _Demo: first lesson with a drill; its
   trainer appears on `tools/0001-*.html`; `lessons tools` lists it._
5. **Mobile site** (Module 5): `site/build.py`, `netlify.toml`, local preview, then
   GitHub + Netlify + password. _Demo: the lesson on a phone._
6. **Notes vault** (Module 7): connect their existing vault, or create `vault/`, or skip. Do this
   before Module 6 so the first debrief has somewhere to write. _Demo: the conventions section in the
   root `CLAUDE.md`._
7. **Ideas-subject extras** (Module 6), once a subject fits the ideas pattern: the debrief card, and
   for books the to-read list, view and `libby` if their library is on Libby. _Demo: a first debrief
   that ends with notes in the vault; `./libby --list`, then `./libby`._
8. Commit and push.

---

## Verification quick-checks

| Check                          | Run                                                                                         | Expect                                                                                                          | If not                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| CLI sees subjects              | `./lessons ls` at the root                                                                  | `Lessons — N active`, subjects listed, new lesson with `●`                                                      | "No lessons found": the subject lacks a `lessons/`/`reference/`/`projects/`/`tools/` dir                    |
| New lesson auto-active         | Create a lesson, run `./lessons ls`                                                         | Shows active with no `set` needed                                                                               | You changed the defaults (G4)                                                                               |
| `set` works                    | `./lessons set <subject>/0001 done`                                                         | `○ done  <title>`, `state.json` updated atomically                                                              | "ambiguous": add more tokens                                                                                |
| TUI arrows                     | `./lessons ui`, press ↓                                                                     | Cursor moves, doesn't quit                                                                                      | Arrows quitting = `sys.stdin.read` crept in (G12)                                                           |
| Tools stateless                | `./lessons tools` lists it; `./lessons ls` does **not**                                     | As described                                                                                                    | Someone added `tools` to `KIND_DIRS` (G5)                                                                   |
| Subject session reaches parent | In `<subject>/`: `claude --add-dir ..`, ask it to run `../lessons ls`                       | Works, and it can edit `../state.json`                                                                          | Missing `--add-dir ..` (G1)                                                                                 |
| Agent can call CLI             | Same session                                                                                | It uses `../lessons`, not `lessons`                                                                             | G2                                                                                                          |
| Trainers stop                  | Open a speed drill on a skill page, then open another                                       | First one's clock stops, no stray misses                                                                        | `mount` didn't return `{stop}` (G8)                                                                         |
| Build                          | `python3 site/build.py`                                                                     | `built …: N files copied, N items indexed (N active), N tools (N views), N subject pages`, no `build:` warnings | `shadows the folder` warning = G10. `source … not allowed` = a view pointing at an agent-only file (G9)     |
| Firewall                       | `grep -rli 'NOTES\|learning-records' site/dist --include=*.md; find site/dist -name '*.md'` | Nothing                                                                                                         | G9 violated                                                                                                 |
| Notes not leaked               | Pick a `note` string from `state.json`; `grep -r "<that text>" site/dist`                   | Nothing                                                                                                         | Home/subject page emitting notes                                                                            |
| Live site                      | Visit the Netlify URL on a phone                                                            | Password prompt, then Home with active items                                                                    | Build hook/Git integration not firing; check Netlify deploy log                                             |
| Folder routes                  | Visit `/<subject>/` on the **live** site                                                    | The tabbed subject page                                                                                         | Stub page = G10 (local servers won't show it)                                                               |
| Libby parse                    | `./libby --list` in `reading/`                                                              | Every wanted title, none from Dropped                                                                           | Missing titles = malformed rows (G14)                                                                       |
| Libby network                  | `./libby --available`                                                                       | A `BORROW NOW` section (or empty)                                                                               | `COULD NOT CHECK` = network/`LIBRARY` key wrong                                                             |
| Pattern recorded               | After the first `/teach` in a new subject, read its `NOTES.md`                              | Names the pattern(s) chosen and why                                                                             | Subject patterns section missing from the root `CLAUDE.md`                                                  |
| Calibration                    | In any subject, push back on a judgement call (an interpretation, a design trade-off)       | Agent states what would have to be true for its position to hold, and doesn't concede that turn                 | Calibration section missing from the root `CLAUDE.md`, or the session didn't start under the root (G1, G13) |
| Vault stays private            | `python3 site/build.py && ls site/dist`                                                     | No `vault/` folder, and `vault` not listed as a subject by `./lessons ls`                                       | Something inside `vault/` is named `lessons/`, `reference/`, `projects/` or `tools/`                        |

---

## Optional extensions

These are things the author has or has considered, which fit the shape without forking it:

- **More flavor files per subject**, each documented in that subject's `NOTES.md`: a skills
  `ladder.md`, a `syllabus.md`, a materials `stock.md` for a workshop, a `watchlist.md` for a
  language, a `terrain.md` mapping a notes-vault slice by how fast each topic goes stale. Any table
  that's safe for the learner can reach the phone through a view.
- **Subject `dev/` harnesses** for complex tools (the author's music theory workspace has
  plain-`node` tests and a headless-Chrome end-to-end run for a microphone pitch tool). Keep them out
  of the site.
- **Traffic from the vault back in:** scripts in the notes vault can write generated references (e.g.
  a practice book) straight into `<subject>/reference/`.
- **`CONTEXT.md` + ADRs** at the root once the system grows. Recording _why_ a rule exists is what
  stops future agents from "tidying" it away. G5 and G6 started as ADRs.
