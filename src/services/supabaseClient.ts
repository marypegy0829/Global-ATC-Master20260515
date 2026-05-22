import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://gffpwwrkojfbzmdeslck.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZnB3d3Jrb2pmYnptZGVzbGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDY2NzksImV4cCI6MjA4NDgyMjY3OX0.rldNOeAsx6d2q-xEAo_uN5ElY94ZBC0dM7uqj5JiEnI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'app_eco' },
  auth: { autoRefreshToken: true, persistSession: true }
});
