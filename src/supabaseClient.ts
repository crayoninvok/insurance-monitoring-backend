import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

let cachedSupabase:
  | ReturnType<typeof createClient>
  | undefined = undefined;

// Catatan QA: jangan crash saat server start jika environment Supabase belum lengkap.
// Client Supabase dibuat lazily hanya saat dibutuhkan.
export function getSupabase() {
  if (cachedSupabase) return cachedSupabase;

  // Load environment variables from .env file
  config();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Set SUPABASE_URL dan SUPABASE_ANON_KEY (atau SUPABASE_KEY) di .env — dapat dari Project Settings → API di dashboard Supabase.',
    );
  }

  cachedSupabase = createClient(supabaseUrl, supabaseKey);
  return cachedSupabase;
}