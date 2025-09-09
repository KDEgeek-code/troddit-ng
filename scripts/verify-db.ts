import { query } from "../src/server/db";

async function main() {
  try {
    const res = await query<{ to_regclass: string | null }>(
      "SELECT to_regclass('public.user_prefs')"
    );
    const exists = res.rows[0]?.to_regclass !== null;
    if (exists) {
      console.log("OK: table 'public.user_prefs' exists.");
      process.exit(0);
    } else {
      console.error("ERROR: table 'public.user_prefs' not found.");
      process.exit(1);
    }
  } catch (err) {
    console.error("DB check failed:", err);
    process.exit(2);
  }
}

main();

