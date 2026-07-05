# 03 — UX & Design

## Design direction

**The vibe:** a well-designed transit system, not a casino. Think Berlin U-Bahn signage energy — clear, warm, confident, a little bit graphic-design-nerdy. Calm surfaces, one bold accent, generous type. The app should feel like a tool made by someone with taste, for themselves.

**Anti-references (what we are NOT):**
- Duolingo's sugar-rush palette and guilt-trip mascot
- Anki's "engineer designed this in 2009 and never looked back"
- Generic AI-app gradient-purple-on-dark

**References to steal from:**
- Transit apps (Citymapper's clarity, actual U-Bahn wayfinding)
- Editorial reading apps (Readwise Reader's density done right)
- Physical flashcards + a nice notebook: the tactile, finite feeling of "this stack, then done"

### Visual language (starting point — evolve in design phase)
- **Palette:** warm off-white / deep ink base; one strong accent (U-Bahn signal yellow? BVG-ish mustard? — decide in design pass); semantic green/red used *sparingly* for right/wrong
- **Type:** a good grotesque for UI (e.g., Inter/General Sans class), with genuinely large type for exercise content — German words deserve room (Kraftfahrzeug-Haftpflichtversicherung says hi)
- **Motion:** fast, small, physical. Card flips and slides, not confetti explosions. One (1) satisfying session-complete moment.
- **Iconography:** line-based, transit-map inspired. Progress could literally render as stations on a line. 🚉 (This might be the signature visual. Explore it.)

## UI/UX principles

1. **One thumb, standing up, bag in the other hand.** Every interaction reachable in the bottom half of the screen. No typing-heavy exercises in v1 defaults (tap-to-build beats keyboard on a moving train).
2. **Sessions are finite.** A session has a visible end. When it's done, the app says done and *stops offering things*. Trust is the retention strategy.
3. **Interruptible everywhere.** Train arrives mid-exercise → app saves state instantly, resumes exactly there. Commutes are the environment; the environment wins.
4. **Zero decision fatigue at open.** Home screen = one big button: today's session. Everything else (library, stats, upload) is secondary navigation.
5. **The upload flow is sacred.** It's the weekly commitment ritual. Make it fast (share-sheet from Files/Photos → done), make the extraction review satisfying (like checking off a list, not proofreading a document).
6. **Errors are content.** Getting something wrong shows the correction *and why*, in one compact line, and quietly schedules the item for revenge. No hearts lost, no shame mechanics.

## Core screens (v1)

1. **Heute (Home):** big "Start session" button with session length + a one-line teaser ("Konjunktiv II + 12 words from Kapitel 5"). Below: class-readiness ring for the week.
2. **Session player:** full-screen, one exercise at a time, progress as stations on a line at top. Pause/exit always available, always safe.
3. **Session done:** what you practiced, what slipped, one insight ("'trotzdem' has beaten you 3 times — worth asking your teacher"). Then it lets you go.
4. **Einwurf (Upload):** drop zone + recent uploads; extraction review checklist per upload.
5. **Bibliothek (Library):** everything ever ingested, browsable by week/topic; item-level SRS state for the curious.
6. **Ich (Profile/Settings):** commute length, notification window, language pair, data export.

## User stories

- As a commuter, I want a session that fits exactly in my ride, so studying has a natural start and end.
- As a course student, I want Sunday's upload to shape Monday's practice, so my app time compounds with my class time.
- As a jagged learner, I want the app to notice *my* weak spots (die/der/das, word order) and drill those harder, so I stop fossilizing errors.
- As someone on a packed train, I want everything doable silently with one thumb, so I never have to be That Person speaking A2 German into a phone.
- As a person with a life, I want the app to never guilt me — miss three days and it just re-plans, no dead streak funeral.
- As the person feeding it content, I want extraction review to take under a minute, so the ritual survives contact with real Sundays.

## The user journey (one honest week)

**Sunday, 21:40** — Ana remembers the ritual. Opens pendeln, shares the week's PDF from the course portal + a photo of Tuesday's whiteboard. 40 seconds later: "Found 23 words, 2 grammar points (Konjunktiv II, wenn-Sätze), 3 themes." She kills one bad extraction (the app thought the teacher's name was vocabulary 💀), taps confirm. The week's sessions generate in the background. Done before the kettle boils.

**Monday, 08:12, U-Bahn** — One tap. 12-minute session: 6 new Konjunktiv II clozes, article drills on the new nouns, and — sneaky — two words from three weeks ago that were about to decay. Train arrives one exercise early; she pockets the phone mid-cloze. No penalty.

**Monday, 18:05, ride home** — The morning's leftover exercise is waiting exactly where she left it. Shorter session, heavier on the stuff she missed this morning.

**Wednesday, in class** — Teacher builds a wenn-Satz on the board. Ana has already fought that sentence structure eleven times on a train. She answers. *This is the moment the whole app exists for.*

**Friday** — Skipped. Life. The app sends nothing passive-aggressive. Saturday's session quietly redistributes.

**Sunday, 21:30** — Weekly recap: 84% class readiness, "trotzdem" is still winning, retention of old material holding at ~90%. New upload. The line extends by one more station. 🚃
