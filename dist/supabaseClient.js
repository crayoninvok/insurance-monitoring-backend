"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabase = getSupabase;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = require("dotenv");
let cachedSupabase = undefined;
// Catatan QA: jangan crash saat server start jika environment Supabase belum lengkap.
// Client Supabase dibuat lazily hanya saat dibutuhkan.
function getSupabase() {
    if (cachedSupabase)
        return cachedSupabase;
    // Load environment variables from .env file
    (0, dotenv_1.config)();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Set SUPABASE_URL dan SUPABASE_ANON_KEY (atau SUPABASE_KEY) di .env — dapat dari Project Settings → API di dashboard Supabase.');
    }
    cachedSupabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    return cachedSupabase;
}
