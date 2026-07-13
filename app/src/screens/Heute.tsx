import { useState } from "react";
import { supabase } from "../lib/supabase";
import { pendingCount } from "../lib/store";
import { isDue } from "../../../pipeline/src/srs.ts";
import type { Bank } from "../../../pipeline/src/model.ts";

export function Heute({ bank, onStart }: { bank: Bank | null; onStart: (minutes: number) => void }) {
  const [minutes, setMinutes] = useState(10);

  if (!bank || bank.items.length === 0) {
    return (
      <div className="screen login">
        <div className="brand"><span className="tram">🚃</span>pendeln</div>
        <p>
          Noch keine Übungen. Sonntagsritual auf dem Laptop:
          <br />
          <code>npm run pendeln -- ingest …</code> dann <code>push</code>.
        </p>
        <button className="btn-quiet" onClick={() => supabase.auth.signOut()}>abmelden</button>
      </div>
    );
  }

  const now = new Date();
  const newestWeek = bank.weeks.at(-1);
  const due = bank.items.filter((i) => isDue(i.srs, now)).length;
  const weak = bank.items.filter((i) => i.recentFails >= 2).length;
  const pending = pendingCount();

  return (
    <div className="screen">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="brand"><span className="tram">🚃</span>pendeln</div>
        <button className="btn-quiet" onClick={() => supabase.auth.signOut()}>abmelden</button>
      </header>

      <div className="stat-row">
        <div className="card stat"><span className="n">{due}</span><span className="l">fällig</span></div>
        <div className="card stat"><span className="n">{weak}</span><span className="l">schwach</span></div>
        <div className="card stat"><span className="n">{bank.items.length}</span><span className="l">gesamt</span></div>
      </div>

      {newestWeek && (
        <div className="card">
          <div className="ex-type">aktuelle Woche</div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>{newestWeek.label}</div>
          <div style={{ color: "var(--ink-faint)", fontSize: "0.85rem", marginTop: 4 }}>
            {newestWeek.themes.join(" · ")}
          </div>
        </div>
      )}

      <div>
        <div className="ex-type" style={{ marginBottom: 8 }}>Sitzungslänge</div>
        <div className="minutes-picker">
          {[5, 10, 15].map((m) => (
            <button key={m} className={m === minutes ? "on" : ""} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={() => onStart(minutes)}>
        Einsteigen →
      </button>

      {pending > 0 && <div className="offline-note">{pending} Antworten warten auf Netz — synct automatisch</div>}
    </div>
  );
}
