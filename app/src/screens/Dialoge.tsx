import { useMemo, useState } from "react";
import type { Bank } from "../../../pipeline/src/model.ts";
import type { Dialog } from "../../../pipeline/src/schema.ts";

/** Dialoge — survival German as playable chats: they talk, you pick your line. */
export function Dialoge({ bank, onBack }: { bank: Bank; onBack: () => void }) {
  const dialogs = useMemo(
    () => bank.items.filter((i) => i.kind === "dialog" && i.dialog).map((i) => i.dialog!),
    [bank],
  );
  const [playing, setPlaying] = useState<Dialog | null>(null);

  if (playing) return <DialogPlayer dialog={playing} onExit={() => setPlaying(null)} />;

  return (
    <div className="screen">
      <header className="notes-head">
        <button className="btn-quiet" onClick={onBack}>← zurück</button>
        <div className="brand"><span className="tram">💬</span>Dialoge</div>
      </header>
      {dialogs.length === 0 ? (
        <p style={{ color: "var(--ink-faint)" }}>
          Noch keine Dialoge — auf dem Laptop: <code>npx tsx scripts/generate-dialogs.ts</code> dann push.
        </p>
      ) : (
        <div className="card netz">
          <div className="line-list" style={{ maxHeight: "none" }}>
            {dialogs.map((d) => (
              <button key={d.id} className="line-row" onClick={() => setPlaying(d)}>
                <span className="dialog-icon">{d.icon}</span>
                <span className="line-name">
                  {d.title_de}
                  <span className="dialog-sub">{d.title_en}</span>
                </span>
                <span className="line-due">spielen →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Bubble = { speaker: "them" | "me"; de: string; en: string; missed?: boolean };

function DialogPlayer({ dialog, onExit }: { dialog: Dialog; onExit: () => void }) {
  // advance past leading them-turns immediately
  const firstMe = dialog.turns.findIndex((t) => t.speaker === "me");
  const [pos, setPos] = useState(firstMe === -1 ? dialog.turns.length : firstMe);
  const [bubbles, setBubbles] = useState<Bubble[]>(
    dialog.turns.slice(0, firstMe === -1 ? dialog.turns.length : firstMe).map((t) => ({ speaker: t.speaker, de: t.de, en: t.en })),
  );
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [revealed, setRevealed] = useState<number | null>(null); // bubble index showing EN

  const turn = dialog.turns[pos];
  const done = pos >= dialog.turns.length;

  const advance = (missed: boolean) => {
    // commit my correct line, then play through following them-turns
    const next: Bubble[] = [{ speaker: "me", de: turn.de, en: turn.en, missed }];
    let p = pos + 1;
    while (p < dialog.turns.length && dialog.turns[p].speaker === "them") {
      next.push({ speaker: "them", de: dialog.turns[p].de, en: dialog.turns[p].en });
      p++;
    }
    setBubbles((b) => [...b, ...next]);
    setPos(p);
    setWrongPick(null);
  };

  const pick = (deLine: string) => {
    const opt = turn.options!.find((o) => o.de === deLine)!;
    if (opt.correct) {
      advance(wrongPick !== null);
    } else {
      setWrongPick(deLine);
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="screen dialog-play">
      <header className="notes-head">
        <button className="btn-quiet" onClick={onExit}>← auflegen</button>
        <span className="dialog-scene">{dialog.icon} {dialog.scenario_en}</span>
      </header>

      <div className="chat">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className={`bubble ${b.speaker}${b.missed ? " missed" : ""}`}
            onClick={() => setRevealed(revealed === i ? null : i)}
          >
            {b.de}
            {revealed === i && <div className="bubble-en">{b.en}</div>}
          </div>
        ))}
      </div>

      {!done && turn.speaker === "me" && (
        <div className="dialog-options">
          <div className="ex-type">Was sagst du?</div>
          {turn.options!.map((o) => {
            const isWrong = wrongPick === o.de;
            return (
              <div key={o.de}>
                <button className={`opt${isWrong ? " wrong" : ""}`} disabled={isWrong} onClick={() => pick(o.de)}>
                  {o.de}
                </button>
                {isWrong && <div className="explain">{o.why}</div>}
              </div>
            );
          })}
        </div>
      )}

      {done && (
        <div className="done-screen" style={{ minHeight: "auto" }}>
          <h2>{mistakes === 0 ? "Fließend! 🎉" : "Geschafft"}</h2>
          <p style={{ color: "var(--ink-soft)" }}>
            {mistakes === 0 ? "Kein einziger Fehltritt." : `${mistakes} Umweg${mistakes > 1 ? "e" : ""} — tippe Blasen für die Übersetzung.`}
          </p>
          <button className="btn-primary" onClick={onExit}>fertig</button>
        </div>
      )}
    </div>
  );
}
