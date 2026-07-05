# 01 — Vision & Problem

## The vision

A language app where **my real course drives the content**. Every week I upload what my class covered — slides, notes, vocab lists, a photo of the whiteboard, whatever — and the app builds practice sessions from it. Short enough for a commute, smart enough to feel like studying, personal enough that skipping it feels like skipping class.

Think of it like this: the class is the meal, pendeln is the digestion. 🥨

## Target user

**Primary (and honestly, the only one that matters for v1): me.**

But "me" is a real segment, so let's name it properly:

> **The Enrolled Learner.** Someone taking an actual structured language course (uni course, Volkshochschule, private school, company classes) who wants their self-study time to *reinforce* the course instead of running a parallel, disconnected curriculum.

Profile:
- Adult, busy, commutes 20–60 min each way
- Already paying for / committed to a real course with a real teacher
- Has tried Duolingo/Babbel/Memrise and quit each one at least twice
- Uneven skill profile (strong reading, weak speaking is classic)
- Motivated by *actual progress in class* — the dopamine hit is understanding the teacher, not a green owl's approval

**Explicit non-targets (for now):**
- Total beginners with no course (they need a curriculum, we don't provide one)
- Test-crammers (Goethe/TestDaF prep is a different product)
- Kids

## Pain points

1. **The placement problem.** Apps force you into a linear level system. Real learners are jagged — B1 grammar knowledge, A2 listening, panic-level speaking. Placement tests average this into a level that fits nobody.

2. **The parallel-curriculum problem.** The app's Unit 12 and your course's Kapitel 5 will never, ever align. So your 15 daily minutes of app time reinforce... the wrong material. It's not zero value, but it's not compounding either.

3. **The engagement-vs-learning problem.** Mainstream apps optimize retention metrics. Streak-freezes, leagues, hearts — mechanics that make you open the app, not learn the language. When the incentive is the streak, the content gets easier, not better.

4. **The dead-commute problem.** Commute time is the perfect study slot (recurring, bounded, low-distraction) and it mostly gets spent on Instagram because opening a textbook on a crowded train is not a thing.

## The gap in the market

| | Generic curriculum | YOUR course's content |
|---|---|---|
| **Long study sessions** | Textbooks, Anki power-users | Doing your actual homework |
| **Micro sessions (commute)** | Duolingo, Babbel, Memrise | **🕳️ nothing lives here** |

The bottom-left quadrant is a bloodbath of billion-dollar apps. The bottom-right is empty. Anki *could* live there but demands you build your own decks by hand (nobody's card-authoring on the U8 at 8am).

The unlock that makes this quadrant reachable *now*: **LLMs can turn messy lecture material into structured exercises automatically.** Five years ago this product required a content team. Today it requires a good pipeline prompt.

## The solution

**pendeln** — a mobile-first app with two loops:

1. **The weekly feed loop (sunday-evening ritual, ~2 min):** upload this week's class material. The app extracts vocab, grammar points, and themes, and generates a week of practice sessions from it — blended with spaced repetition of everything fed before.

2. **The daily commute loop (10–15 min, twice a day):** open the app, get *one* session, sized to your commute. Mix of recall, cloze, listening, sentence-building — all built from YOUR course material. Session ends, you're done. No infinite scroll of lessons. The app respects that you have a life.

The compounding effect: the more weeks you feed it, the better its spaced repetition gets, and the more the app becomes a mirror of *your* German — the words your teacher uses, the topics your class covers, the mistakes you personally keep making.

## Why me, why now

- I'm the target user. I will feel every rough edge personally within 24 hours.
- The core technical bet (LLM content pipeline) plays to what I want to demonstrate in a portfolio: product thinking + AI integration that's *structural*, not a chatbot bolted on.
- Worst case: no one else ever uses it, and I still learn German faster. That's a floor most side projects would kill for.

## Success, in one sentence

**I stop needing Duolingo, my commutes feel productive, and my Wednesday classes get noticeably easier — measured, not vibed (see [05 — PRD](05-prd.md) for the metrics).**
