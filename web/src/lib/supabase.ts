import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase is wired up but NOT yet the source of truth: the MVP reads festivals
// from the static seed (src/data/festivals.ts). Once the ingestion pipeline
// populates the `festivals` table (see supabase/migrations/0001_init.sql), the
// data-access functions in lib/festivals.ts can be swapped to read from here.

let client: SupabaseClient | null = null;

/**
 * Returns a browser/anon Supabase client, or null when env vars are not set
 * (the default during local MVP development).
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}
