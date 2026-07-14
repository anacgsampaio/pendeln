import { useEffect, useState } from "react";
import type { Session as AuthSession } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { cachedBank, refreshBank, flushPending } from "./lib/store";
import type { Bank } from "../../pipeline/src/model.ts";
import { Login } from "./screens/Login";
import { Heute } from "./screens/Heute";
import { Session } from "./screens/Session";

export default function App() {
  const [auth, setAuth] = useState<AuthSession | null | undefined>(undefined);
  const [bank, setBank] = useState<Bank | null>(() => cachedBank());
  const [ride, setRide] = useState<{ minutes: number; lines: string[] | null } | null>(null);

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
        onDone={() => {
          setRide(null);
          setBank(cachedBank());
        }}
      />
    );
  }

  return <Heute bank={bank} onStart={(minutes, lines) => setRide({ minutes, lines })} />;
}
