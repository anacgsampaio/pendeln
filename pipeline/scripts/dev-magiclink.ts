import "../src/env.ts";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

/**
 * Dev helper: mint a one-time magic sign-in link for PENDELN_USER_EMAIL and
 * write it to the given path (never printed). Lets you test the app before
 * (or without) Google SSO being configured.
 *
 *   npx tsx scripts/dev-magiclink.ts /tmp/link.txt [redirectTo]
 */

const [outPath, redirectTo = "http://localhost:5173"] = process.argv.slice(2);
if (!outPath) throw new Error("usage: dev-magiclink.ts <outPath> [redirectTo]");

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email: process.env.PENDELN_USER_EMAIL!,
  options: { redirectTo },
});
if (error) throw error;
fs.writeFileSync(outPath, data.properties.action_link);
console.log(`magic link written to ${outPath}`);
