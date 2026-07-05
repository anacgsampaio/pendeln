# 06 — Handoff Notes

*Read this first if you're a human collaborator, Claude, a design tool, or any other model picking up this project. It exists so the project keeps its soul across sessions.*

## Who owns this

Ana Sampaio ([@anacgsampaio](https://github.com/anacgsampaio)). Portuguese native speaker, learning German through a structured course, commutes daily. She is simultaneously the PM, the designer-of-record, the (future) developer, and **the target user**. When in doubt about a product decision, the question is never "what would users want" — it's "would Ana actually do this on the U-Bahn at 8am." Ask her.

## Voice & vibe rules (for docs, UI copy, everything)

- **Warm, direct, a little funny — but never at the expense of clarity.** One good joke per section beats five winks per paragraph.
- **Honest about tradeoffs.** These docs say "this will be flaky" and "worst case" out loud. Keep doing that. No startup-pitch varnish.
- **Concrete over abstract.** "Trotzdem has beaten you 3 times" > "personalized insights." Real German words in examples, real scenarios (train arrives mid-exercise), real times of day.
- **English docs, with German seasoning where it's natural** (screen names like Heute/Bibliothek, U-Bahn references). Portuguese shows up in translations and in Ana's head — the app is trilingual-hearted.
- Moderate emoji, purposeful (🚃 is basically the mascot). CAPS for emphasis occasionally. No corporate "leverage/synergy/delight" vocabulary — if a sentence could appear in any SaaS deck, rewrite it.
- **The anti-Duolingo stance is identity, not just strategy.** No guilt mechanics, no engagement theater, sessions END. Any feature proposal that smells like a streak gets the Wednesday question (below).

## The one decision filter

> **Does this make Wednesday's class easier?**

Every feature, every screen, every notification passes or dies by this. It's in the docs multiple times on purpose.

## State of the project (July 2026)

- Phase 0. Docs complete (this set). No code, no designs yet — deliberate.
- Next up, in rough order:
  1. **Design exploration** — hand doc 03 (+ this file) to a design tool/model. The transit-line-as-progress motif is the strongest visual idea; explore it first.
  2. **Pipeline CLI spike** — doc 04 has the schemas. Build extraction+generation as a CLI before any UI exists. Test with Ana's real course PDFs.
  3. Schema hardening → then the Expo app.

## For a design model/tool specifically

- Start from [03 — UX & Design](03-ux-and-design.md). Direction: transit-system clarity, warm off-white/ink, ONE accent color (explore signal-yellow/mustard family), big type, line icons, stations-on-a-line progress.
- Design mobile portrait only. One-thumb reachability is a hard constraint, not a preference.
- Deliver the session player first — it's 90% of time-in-app. Home screen second. Upload/review flow third.
- Show real German content in mockups (doc 04 has authentic examples), never lorem ipsum, never "Word 1 / Word 2".

## For a coding model specifically

- The exercise JSON schema (doc 04) is the contract. Client renders it dumbly; pipeline produces it. Don't let logic leak across that line.
- Offline-first is architectural, not a feature flag added later. SQLite on device is the source of truth for SRS state.
- Build the pipeline as a testable module with fixture inputs (a sample PDF, a sample photo-OCR text) before wiring any UI.
- Stack decisions so far (changeable with a reason): React Native + Expo, SQLite, Claude API with structured outputs, platform TTS.

## For future-Ana specifically

You wrote all this on July 5, 2026, in one sitting, because Duolingo made you review colors again. The docs are deliberately opinionated so that tired-evening-you doesn't have to re-decide things. Trust past-you on the scope cuts. The Later list is not a promise. Feed the app your Woche 1 material the same week the CLI works — dogfooding is the whole plan. Viel Erfolg. 🚃
