# 02 — Product Scope

## Scoping philosophy

Ship the smallest thing I'll actually use every day. Every feature has to survive one question: **"does this make Wednesday's class easier?"** If not, it's out — or it's parked in the Later list.

## MVP (v0.1 — "the thing I use on Monday")

### 1. Content ingestion
- Upload: PDF (slides/handouts), photos (whiteboard, textbook pages), pasted text, plain notes
- One upload = one "week" (or one class session — user labels it)
- LLM pipeline extracts: vocab (with article + plural, because German 🙃), grammar points, example sentences, themes
- **User reviews the extraction before it's committed** — a 30-second "yes/no/fix" screen. Garbage in, garbage lessons; this checkpoint is non-negotiable.

### 2. Session generation
- One session per request, sized by target length: **5 / 10 / 15 min** (default from onboarding: "how long is your commute?")
- Session composition (roughly): ~50% this week's material, ~35% spaced repetition of older material, ~15% weak-spot targeting
- Exercise types at launch:
  - **Cloze** (fill the gap in a real sentence from/inspired by class material)
  - **Recall cards** (DE→PT/EN and reverse; article drills for nouns)
  - **Sentence scramble** (word order — the eternal German boss fight)
  - **Multiple-choice grammar** (pick the right case/ending/verb form)
- All exercise content generated at ingestion time, not at quiz time (offline-friendly, cost-controlled, quality-reviewable)

### 3. Spaced repetition engine
- Simple SM-2-style scheduling per item (vocab item, grammar pattern)
- Items feed from every week ever ingested — this is the compounding moat
- "Weak spot" = item failed ≥2 times recently; gets priority slots

### 4. Progress that means something
- Not streaks. Instead: **"class readiness"** — % of this week's material practiced at least once, and retention estimate of older material
- A simple weekly recap: what you nailed, what keeps slipping, what to ask your teacher about (!!)

### 5. Offline-first sessions
- Commute = tunnels = no signal. Sessions are pre-generated and cached. Non-negotiable for the core use case.

## v0.2 — "the polish that makes it lovable"

- **Listening exercises**: TTS audio of class vocab/sentences (German voices are good now); "type what you hear"
- **Speaking practice (solo-safe)**: shadowing prompts with self-assessment — no speech grading on a crowded train, just "say it in your head / whisper it, then reveal"
- **Smart notifications**: one nudge, timed to the commute window the user set. ONE. We are not Duolingo's owl.
- Multi-course support (e.g., class + a grammar book being worked through in parallel)

## v0.3+ — "if this grows legs"

- Share a course: classmates subscribe to the same ingested content, each with their own SRS state
- Teacher mode: teacher uploads once, whole class gets sessions
- Other languages (nothing here is German-specific except the grammar exercise templates)
- Conversation practice with an LLM using *only* vocabulary you've learned (constrained generation — genuinely hard, genuinely valuable)

## Explicitly NOT building

| Not this | Why |
|---|---|
| A curriculum | The course is the curriculum. We are the practice layer. Period. |
| Streaks, leagues, hearts, gems | Engagement theater. The metric is class readiness, not app opens. |
| Social feed / friends | I want to learn German, not perform learning German. |
| Speech recognition grading (v1) | Hard to do well, embarrassing on public transport, fakeable anyway. |
| Web app first | This lives on a phone on a train. Mobile-first or nothing. |
| Accounts/teams/billing (v1) | Single-user local-first. Auth complexity when there are users beyond me. |

## Technical shape (decided enough to start, loose enough to change)

- **Client:** React Native + Expo (one codebase, fast iteration, I can show it on both platforms in a portfolio)
- **Pipeline:** Claude API for extraction + exercise generation (structured outputs → JSON exercise schema)
- **Storage:** local SQLite on device (SRS state, cached sessions); lightweight backend (or even none at first — pipeline can run on-device-triggered serverless) 
- **TTS (v0.2):** platform TTS to start, upgrade later if voices grate
- The exercise **JSON schema is the real API of this product** — pipeline writes it, client renders it. Defined in [04 — Content Pipeline](04-content-pipeline.md).
