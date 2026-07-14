import { useEffect, useState } from "react";
import type { Session as AuthSession } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { cachedBank, refreshBank, flushPending } from "./lib/store";
import type { Bank } from "../../pipeline/src/model.ts";
import { Login } from "./screens/Login";
import { Heute } from "./screens/Heute";
import { Session } from "./screens/Session";
import { Notizen } from "./screens/Notizen";
import { Dialoge } from "./screens/Dialoge";

export default function App() {
  const [auth, setAuth] = useState<AuthSession | null | undefined>(undefined);
  const [bank, setBank] = useState<Bank | null>(() => cachedBank());
  const [ride, setRide] = useState<{ minutes: number; lines: string[] | null; focus: string[] | null } | null>(null);
  const [view, setView] = useState<"heute" | "notizen" | "dialoge">("heute");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuth(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuth(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth) return;
    void flushPending();
    refreshBank().then((b) => b && setBank(b));
  }, [auth]);

  // dev-only UI preview: ?preview=1 skips auth and runs from the local cache
  const devPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview");

  if (!devPreview) {
    if (auth === undefined) return null; // resolving stored session
    if (!auth) return <Login />;
  }

  if (ride !== null && bank) {
    return (
      <Session
        bank={bank}
        minutes={ride.minutes}
        lines={ride.lines}
        focus={ride.focus}
        onDone={() => {
          setRide(null);
          setBank(cachedBank());
        }}
      />
    );
  }

  if (view === "notizen" && bank) return <Notizen bank={bank} onBack={() => setView("heute")} />;
  if (view === "dialoge" && bank) return <Dialoge bank={bank} onBack={() => setView("heute")} />;

  return (
    <Heute
      bank={bank}
      onStart={(minutes, lines, focus) => setRide({ minutes, lines, focus })}
      onNav={setView}
    />
  );
}
