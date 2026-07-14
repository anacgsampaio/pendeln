import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { pendingCount } from "../lib/store";
import { isDue } from "../../../pipeline/src/srs.ts";
import type { Bank } from "../../../pipeline/src/model.ts";
import { metroLines, INTERSECTIONS, intersectionLines, type Intersection } from "../lib/lines";

export function Heute({
  bank,
  onStart,
  onNav,
}: {
  bank: Bank | null;
  onStart: (minutes: number, lines: string[] | null, focus: string[] | null) => void;
  onNav: (view: "notizen" | "dialoge") => void;
}) {
  const [minutes, setMinutes] = useState(10);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [crossing, setCrossing] = useState<Intersection | null>(null);
  const lines = useMemo(() => (bank ? metroLines(bank) : []), [bank]);
  const crossings = useMemo(
    () => (bank ? INTERSECTIONS.filter((x) => intersectionLines(bank, x)) : []),
    [bank],
  );

  const toggle = (label: string) => {
    setCrossing(null);
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const pickCrossing = (x: Intersection) => {
    if (crossing?.id === x.id) {
      setCrossing(null);
      setPicked(new Set());
      return;
    }
    setCrossing(x);
    setPicked(new Set(intersectionLines(bank!, x)!));
  };

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

      <div className="nav-row">
        <button className="nav-tile" onClick={() => onNav("notizen")}>📖 Notizen</button>
        <button className="nav-tile" onClick={() => onNav("dialoge")}>💬 Dialoge</button>
      </div>

      <div className="stat-row">
        <div className="card stat"><span className="n">{due}</span><span className="l">fällig</span></div>
        <div className="card stat"><span className="n">{weak}</span><span className="l">schwach</span></div>
        <div className="card stat"><span className="n">{bank.items.length}</span><span className="l">gesamt</span></div>
      </div>

      <div className="card netz">
        <div className="ex-type" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Netzplan — Linien wählen</span>
          {picked.size > 0 && (
            <button className="netz-clear" onClick={() => setPicked(new Set())}>
              alle Linien
            </button>
          )}
        </div>
        <div className="line-list">
          {lines.map((l) => {
            const on = picked.has(l.label);
            return (
              <button
                key={l.label}
                className={`line-row${on ? " on" : ""}${picked.size > 0 && !on ? " dim" : ""}`}
                onClick={() => toggle(l.label)}
              >
                <span className="line-badge" style={{ background: l.color }}>{l.badge}</span>
                <span className="line-name">{l.name}</span>
                <span className="line-due">{l.due > 0 ? `${l.due} fällig` : `${l.items} ✓`}</span>
              </button>
            );
          })}
        </div>
        {crossings.length > 0 && (
          <>
            <div className="ex-type" style={{ marginTop: 12 }}>Umsteigen — Kreuzungen</div>
            <div className="crossing-row">
              {crossings.map((x) => (
                <button
                  key={x.id}
                  className={`crossing${crossing?.id === x.id ? " on" : ""}`}
                  onClick={() => pickCrossing(x)}
                >
                  <span className="crossing-dot" />
                  {x.name}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="netz-hint">
          {crossing
            ? `Umsteigebahnhof ${crossing.name} — Übungen an der Kreuzung zuerst`
            : picked.size === 0
              ? `automatische Route — ${newestWeek?.label ?? ""}`
              : `${picked.size} Linie${picked.size > 1 ? "n" : ""} · fällige zuerst, dann Wiederholung`}
        </div>
      </div>

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

      <button
        className="btn-primary"
        onClick={() => onStart(minutes, picked.size > 0 ? [...picked] : null, crossing?.focus ?? null)}
      >
        Einsteigen →
      </button>

      {pending > 0 && <div className="offline-note">{pending} Antworten warten auf Netz — synct automatisch</div>}
    </div>
  );
}
