import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('FATAL: Supabase environment variables are missing! Check your .env.local or Vercel settings.');
  }
}

// Development logging for debugging key injection
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('Supabase initialized with URL:', supabaseUrl);
  console.log('Key type:', supabaseAnonKey?.startsWith('sb_') ? 'New Publishable' : 'Legacy JWT');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
