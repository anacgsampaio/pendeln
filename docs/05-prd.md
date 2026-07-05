# 05 — PRD

**Product:** pendeln — commute-sized German practice generated from your own course material
**Owner:** Ana Sampaio
**Status:** Draft v1 · July 2026
**Living doc — intended to be iterated with AI tooling. See [06 — Handoff Notes](06-handoff-notes.md).**

## Problem statement

Enrolled language learners waste their best recurring study slot (the commute) on apps whose content is disconnected from their actual course, at the wrong level, and optimized for engagement rather than learning. Result: app time doesn't compound with class time, and both feel slower than they should.

## Goals

1. Make the user measurably more prepared for their weekly class.
2. Convert commute time into finite, high-signal practice sessions.
3. Compound: every fed week makes the app more personal and more useful.

## Non-goals

Teaching from zero without a course · gamified engagement maximization · social features · speech grading (v1) · any language other than German (v1) · monetization (v1).

## Requirements

### P0 — MVP doesn't ship without these
| ID | Requirement |
|---|---|
| R1 | Ingest PDF, image, and pasted text as weekly course material |
| R2 | LLM extraction of vocab (article+plural mandatory for nouns), grammar points, themes, with confidence flags |
| R3 | Human review checkpoint before content enters the item bank (<60s target) |
| R4 | Pre-generated exercises in 4 types: cloze, recall, scramble, MC-grammar (schema in doc 04) |
| R5 | SM-2-style spaced repetition across all ever-ingested material |
| R6 | Session assembler: target-length sessions (5/10/15 min), 50/35/15 new/review/weak-spot mix |
| R7 | Fully offline session play; instant save/resume mid-exercise |
| R8 | One-thumb, portrait, tap-first interaction for all v1 exercise types |
| R9 | Class-readiness metric + weekly recap (no streaks) |
| R10 | All user data exportable (JSON); ingested material never leaves user's account context |

### P1 — fast follows
TTS listening exercises · silent shadowing/speaking prompts · single smart notification in commute window · multi-source (course + book) ingestion · dedup-and-boost for re-taught items.

### P2 — someday
Shared courses / teacher mode · other languages · constrained-vocabulary conversation practice · Anki export.

## Success metrics

**North star: class readiness** — % of the current week's ingested material practiced to first-pass correctness before the next class.

| Metric | Target (8 weeks of self-use) | Why it matters |
|---|---|---|
| Weekly upload ritual completion | ≥ 7/8 weeks | If the ritual dies, the product is dead |
| Sessions per commute-day | ≥ 1 (of ~2 possible) | Honest usage, not inflated opens |
| Class readiness (weekly) | ≥ 80% | The core promise |
| 30-day retention of old items | ≥ 85% first-pass on SRS reviews | Proof of compounding |
| Extraction review edit rate | < 15% of items need edits | Pipeline quality proxy |
| Subjective: "did class feel easier?" | Weekly 1–5 self-rating, trending up | The metric behind the metric |
| **Anti-metric:** guilt notifications sent | 0 | Cultural constant, not a KPI |

Instrumented locally (it's my own device); a tiny analytics event log is fine.

## Phases

- **Phase 0 (now):** docs, design exploration (hand to design tooling with doc 03 + 06), schema finalization.
- **Phase 1 (build, ~3–4 wks of evenings):** pipeline CLI first (upload → JSON exercises, no UI) — validates the hard part cheapest. Then Expo app: session player + home + upload.
- **Phase 2 (dogfood, 8 weeks):** use it every commute for a real course term. Metrics above. Fix what hurts weekly.
- **Phase 3 (portfolio packaging):** case study write-up, demo video, README polish. Decide only *then* if it goes multi-user.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Extraction quality poor on messy inputs (whiteboard photos) | Review checkpoint absorbs errors; measure edit rate; improve prompts iteratively |
| I stop doing the Sunday ritual | Make it <2 min; app degrades gracefully to pure SRS mode on old material |
| Exercise generation is bland | Bias hard toward `example_from_material`; regenerate on user "boring" flag (P1) |
| Scope creep (this doc is already frisky) | The Wednesday question: does it make class easier? No → Later list |
| SRS + assembler complexity balloons | Ship dumb SM-2 first; fancy scheduling only after 8 weeks of real data |

## Open questions (for future sessions — with me or a model)

1. Session length: fixed picks (5/10/15) or "I have N minutes" slider?
2. Should grammar points be SRS items themselves, or only surface through exercises? (Leaning: items themselves.)
3. Translation direction defaults: DE↔PT, DE↔EN, or both shown? (I think in both, honestly.)
4. On-device pipeline trigger vs. tiny serverless function — decide when building Phase 1 CLI.
5. Name check: is "pendeln" available enough (App Store, domain)? Alternatives brainstormed: Mitschrift, Bahnhof, Zwischenstopp.
