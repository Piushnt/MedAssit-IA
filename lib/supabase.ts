import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase-Debug] CRITICAL: Supabase URL or Anon Key is missing! App will likely hang.');
} else {
    console.log('[Supabase-Debug] Supabase client initialized with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
