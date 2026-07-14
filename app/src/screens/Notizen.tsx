import { useMemo, useState } from "react";
import type { Bank } from "../../../pipeline/src/model.ts";
import { metroLines } from "../lib/lines";
import { PendelnLogo } from "../components/Logo";

/** Notizen — the reading room: every chapter's grammar and vocab, no quiz, no timer. */
export function Notizen({ bank, onBack }: { bank: Bank; onBack: () => void }) {
  const lines = useMemo(() => metroLines(bank), [bank]);
  const [open, setOpen] = useState<string | null>(null);

  if (open) {
    const line = lines.find((l) => l.label === open)!;
    const grammar = bank.items.filter((i) => i.week === open && i.kind === "grammar" && i.grammar);
    const vocab = bank.items.filter((i) => i.week === open && i.kind === "vocab" && i.vocab);
    return (
      <div className="screen notes">
        <header className="notes-head">
          <button className="btn-quiet" onClick={() => setOpen(null)}>← Linien</button>
          <span className="line-badge" style={{ background: line.color }}>{line.badge}</span>
        </header>
        <h2 className="notes-title">{line.name}</h2>

        {grammar.length > 0 && (
          <>
            <div className="ex-type">Grammatik</div>
            {grammar.map((i) => (
              <div className="card note-card" key={i.id}>
                <div className="note-name">{i.grammar!.name}</div>
                <div className="note-summary">{i.grammar!.summary}</div>
                {i.grammar!.example_from_material && (
                  <div className="note-example">„{i.grammar!.example_from_material}“</div>
                )}
              </div>
            ))}
          </>
        )}

        {vocab.length > 0 && (
          <>
            <div className="ex-type">Vokabeln ({vocab.length})</div>
            <div className="card">
              <table className="vocab-table">
                <tbody>
                  {vocab.map((i) => (
                    <tr key={i.id}>
                      <td className="v-de">
                        {i.vocab!.lemma}
                        {i.vocab!.plural && <span className="v-plural">, {i.vocab!.plural}</span>}
                      </td>
                      <td className="v-en">{i.vocab!.translation_en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="notes-head">
        <button className="btn-quiet" onClick={onBack}>← zurück</button>
        <PendelnLogo fontSize={19} word="notizen" />
      </header>
      <div className="card netz">
        <div className="line-list" style={{ maxHeight: "none" }}>
          {lines.map((l) => (
            <button key={l.label} className="line-row" onClick={() => setOpen(l.label)}>
              <span className="line-badge" style={{ background: l.color }}>{l.badge}</span>
              <span className="line-name">{l.name}</span>
              <span className="line-due">lesen →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
