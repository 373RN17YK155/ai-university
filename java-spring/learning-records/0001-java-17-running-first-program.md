# JDK 17 running; first program, records and var understood at recognition level

Corretto 17.0.21 installed and default; ran the lesson-1 program; quiz 5/5. Wrote a little Java ~10
years ago (forgot file-name and `main` conventions). Grasped `record` as "a lightweight class without
hand-written boilerplate" and `var` as local type inference, and liked it.

**Evidence:** `java -version` output, 5/5, own-words report (2026-11-02).

**Misconceptions corrected (in chat, 2026-11-02):**
- Called records "static data": conflated static with immutable. Records are immutable (private
  final fields); `static` means "belongs to the class, not an instance". Nested records are
  implicitly static, so `static record` is redundant.
- Expected `p.amount` like a TS property/getter: Java has no properties or getter syntax; every
  accessor is a method call. Record accessors are `amount()`, JavaBean classes use `getAmount()`.
  Kotlin restores property syntax (`p.amount` calls the getter) — use this as the Kotlin bridge.
- Thought modifier order (public/static/void) might matter: `void` is the return type, not a
  modifier, and always sits right before the name; modifier order is convention only (JLS).
- Connected `var` with TS `infer`: the right analogy is TS `const x = …` without an annotation;
  TS `infer` is a conditional-type feature.

**Implications:** return type before the name is the main TS-vs-Java syntax friction — Kotlin's
`fun f(): T` will feel like home. Lesson 2 should cover classes vs records (fields, constructors,
access modifiers, getters), static vs instance, interfaces — contrasting TS structural typing with
Java nominal typing.
