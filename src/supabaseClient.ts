import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

// If credentials are missing, we create a dummy/mock client so the app doesn't crash on boot,
// and we can show a nice configuration warning overlay to the user.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any); // fallback for typings when unconfigured
