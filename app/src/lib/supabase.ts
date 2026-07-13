import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// dev only: lets tooling drive auth (e.g. magic-link session injection)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).supabase = supabase;
}
