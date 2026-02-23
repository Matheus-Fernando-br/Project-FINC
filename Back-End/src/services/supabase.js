import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY; // fallback

if (!url || !key) {
  throw new Error("Supabase env faltando: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(url, key);