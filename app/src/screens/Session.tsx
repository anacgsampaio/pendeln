import { useMemo, useRef, useState } from "react";
import { assembleSession, type SessionSlot } from "../../../pipeline/src/assemble.ts";
import { review } from "../../../pipeline/src/srs.ts";
import type { Bank } from "../../../pipeline/src/model.ts";
import type { Exercise } from "../../../pipeline/src/schema.ts";
import { recordReview } from "../lib/store";

type Grade = 0 | 1 | 2;

const TYPE_LABEL: Record<Exercise["type"], string> = {
  cloze: "Lücke füllen",
  recall: "Erinnern",
  scramble: "Satz bauen",
  mc_grammar: "Grammatik",
};

export function Session({
  bank,
  minutes,
  lines,
  focus,
  onDone,
}: {
  bank: Bank;
  minutes: number;
  lines: string[] | null;
  focus: string[] | null;
  onDone: () => void;
}) {
  const slots = useMemo(
    () => assembleSession(bank, minutes, new Date(), lines ?? undefined, focus ?? undefined),
    [bank, minutes, lines, focus],
  );
  const [idx, setIdx] = useState(0);
  const [good, setGood] = useState(0);

  const grade = (g: Grade) => {
    const { item } = slots[idx];
    item.srs = review(item.srs, g);
    item.recentFails = g === 0 ? item.recentFails + 1 : Math.max(0, item.recentFails - 1);
    recordReview(item);
    if (g === 2) setGood((n) => n + 1);
    setIdx((i) => i + 1);
  };

  if (slots.length === 0) {
    return (
      <div className="screen done-screen">
        <h2>Nichts fällig 🎉</h2>
        <button className="btn-primary" onClick={onDone}>zurück</button>
      </div>
    );
  }

  if (idx >= slots.length) {
    return (
      <div className="screen done-screen">
        <h2>Endstation</h2>
        <div className="score">{good}/{slots.length}</div>
        <p style={{ color: "var(--ink-soft)" }}>Bis morgen auf der U-Bahn. 🚃</p>
        <button className="btn-primary" onClick={onDone}>fertig</button>
      </div>
    );
  }

  return (
    <div className="screen">
      <LineTrack total={slots.length} current={idx} />
      <ExerciseView key={idx} slot={slots[idx]} onGrade={grade} />
      <button className="btn-quiet" onClick={onDone}>aussteigen</button>
    </div>
  );
}

function LineTrack({ total, current }: { total: number; current: number }) {
  // stations on a line — cap the drawn stations so 40-slot sessions still render
  const shown = Math.min(total, 16);
  const scale = (i: number) => Math.floor((i * total) / shown);
  return (
    <div className="line-track">
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} style={{ display: "contents" }}>
          {i > 0 && <span className={`seg${scale(i) <= current ? " done" : ""}`} />}
          <span
            className={`station${scale(i) < current ? " done" : ""}${
              scale(i) <= current && current < scale(i + 1) ? " now" : ""
            }`}
          />
        </span>
      ))}
    </div>
  );
}

function ExerciseView({ slot, onGrade }: { slot: SessionSlot; onGrade: (g: Grade) => void }) {
  const ex = slot.exercise;
  const isChoice = ex.type === "cloze" || ex.type === "mc_grammar" || (ex.type === "recall" && ex.distractors.length >= 2);
  if (isChoice) return <Choice ex={ex} onGrade={onGrade} />;
  if (ex.type === "scramble") return <Scramble ex={ex} onGrade={onGrade} />;
  // typed answers for short recall targets; long ones stay flip cards
  if (ex.answer.trim().length <= 40) return <Typed ex={ex} onGrade={onGrade} />;
  return <FlipCard ex={ex} onGrade={onGrade} />;
}

function Prompt({ ex }: { ex: Exercise }) {
  const parts = ex.prompt.split("___");
  return (
    <div className="ex-prompt">
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="gap">___</span>}
        </span>
      ))}
    </div>
  );
}

/** cloze / mc_grammar / article drills: tap the right option */
function Choice({ ex, onGrade }: { ex: Exercise; onGrade: (g: Grade) => void }) {
  const options = useMemo(
    () => [ex.answer, ...ex.distractors].sort(() => Math.random() - 0.5),
    [ex],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const done = picked !== null;
  const correct = picked === ex.answer;

  return (
    <div className="exercise">
      <div className="ex-type">{TYPE_LABEL[ex.type]}</div>
      <Prompt ex={ex} />
      <div className="options">
        {options.map((o) => (
          <button
            key={o}
            className={`opt${done && o === ex.answer ? " right" : ""}${done && o === picked && !correct ? " wrong" : ""}`}
            disabled={done}
            onClick={() => setPicked(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {done && !correct && <div className="explain">{ex.explanation}</div>}
      {done && (
        <button className="btn-primary" onClick={() => onGrade(correct ? 2 : 0)}>
          weiter →
        </button>
      )}
    </div>
  );
}

/** recall without distractors: flip, then honest self-grade */
function FlipCard({ ex, onGrade }: { ex: Exercise; onGrade: (g: Grade) => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="exercise">
      <div className="ex-type">{TYPE_LABEL.recall}</div>
      <Prompt ex={ex} />
      {!flipped ? (
        <button className="btn-primary" onClick={() => setFlipped(true)}>
          Antwort zeigen
        </button>
      ) : (
        <>
          <div className="ex-prompt" style={{ color: "var(--go)" }}>{ex.answer}</div>
          <div className="grade-row">
            <button className="g-fail" onClick={() => onGrade(0)}>nicht gewusst</button>
            <button className="g-hard" onClick={() => onGrade(1)}>schwer</button>
            <button className="g-good" onClick={() => onGrade(2)}>gewusst</button>
          </div>
        </>
      )}
    </div>
  );
}

/** typed recall: actually produce the answer, umlauts included */
const UMLAUTS = ["ä", "ö", "ü", "ß"] as const;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function stripArticle(s: string): { article: string | null; rest: string } {
  const m = s.match(/^(der|die|das)\s+(.+)$/);
  return m ? { article: m[1], rest: m[2] } : { article: null, rest: s };
}

/** Damerau-Levenshtein — adjacent swaps ("Umwlet") count as one typo */
function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

type Verdict = { grade: Grade; label: string };

function judge(typed: string, answer: string): Verdict {
  const t = normalize(typed);
  const a = normalize(answer);
  if (t === a) return { grade: 2, label: "Sauber! 🚃" };
  const ta = stripArticle(t);
  const aa = stripArticle(a);
  if (aa.article && ta.rest === aa.rest) {
    if (!ta.article) return { grade: 1, label: `Fast — der Artikel fehlt: ${aa.article}` };
    return { grade: 0, label: `Falscher Artikel — ${aa.article}, nicht ${ta.article}` };
  }
  const tolerance = Math.max(1, Math.floor(a.length / 8));
  if (editDistance(t, a) <= tolerance) return { grade: 1, label: "Fast richtig — Tippfehler zählt halb" };
  return { grade: 0, label: "Nicht ganz —" };
}

function Typed({ ex, onGrade }: { ex: Exercise; onGrade: (g: Grade) => void }) {
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = verdict !== null;

  const check = () => {
    if (!value.trim() || done) return;
    setVerdict(judge(value, ex.answer));
  };

  const insert = (ch: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  };

  return (
    <div className="exercise">
      <div className="ex-type">Tippen</div>
      <Prompt ex={ex} />
      <input
        ref={inputRef}
        className={`typed-input${done ? (verdict.grade === 2 ? " right" : verdict.grade === 1 ? " close" : " wrong") : ""}`}
        value={value}
        disabled={done}
        placeholder="auf Deutsch…"
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && check()}
      />
      {!done && (
        <div className="umlaut-row">
          {UMLAUTS.map((u) => (
            <button key={u} className="chip" type="button" onClick={() => insert(u)}>
              {u}
            </button>
          ))}
        </div>
      )}
      {!done ? (
        <button className="btn-primary" disabled={!value.trim()} onClick={check}>
          prüfen
        </button>
      ) : (
        <>
          <div className={`verdict v-${verdict.grade}`}>
            {verdict.label}
            {verdict.grade !== 2 && <div className="verdict-answer">{ex.answer}</div>}
          </div>
          {verdict.grade === 0 && ex.explanation && <div className="explain">{ex.explanation}</div>}
          <button className="btn-primary" onClick={() => onGrade(verdict.grade)}>
            weiter →
          </button>
        </>
      )}
    </div>
  );
}

/** scramble: tap the words in order */
function Scramble({ ex, onGrade }: { ex: Exercise; onGrade: (g: Grade) => void }) {
  const words = useMemo(() => ex.prompt.trim().split(/\s+/), [ex]);
  const shuffled = useMemo(
    () => words.map((w, i) => ({ w, i })).sort(() => Math.random() - 0.5),
    [words],
  );
  const [taken, setTaken] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const done = taken.length === words.length;

  const tap = (origIdx: number) => {
    // accept any chip carrying the expected word (sentences repeat words)
    if (words[origIdx] === words[taken.length]) {
      setTaken((t) => [...t, origIdx]);
    } else {
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="exercise">
      <div className="ex-type">{TYPE_LABEL.scramble}</div>
      <div className="built">{taken.map((i) => words[i]).join(" ")}</div>
      <div className="chips">
        {shuffled.map(({ w, i }) => (
          <button key={i} className="chip" disabled={taken.includes(i)} onClick={() => tap(i)}>
            {w}
          </button>
        ))}
      </div>
      {done && (
        <>
          {mistakes > 0 && <div className="explain">{ex.explanation}</div>}
          <button className="btn-primary" onClick={() => onGrade(mistakes === 0 ? 2 : mistakes <= 2 ? 1 : 0)}>
            weiter →
          </button>
        </>
      )}
    </div>
  );
}
