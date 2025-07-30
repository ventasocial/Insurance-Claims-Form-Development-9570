import { createClient } from '@supabase/supabase-js';

// Credenciales de Supabase
const SUPABASE_URL = 'https://zshawnoiwrqznqocxqrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzaGF3bm9pd3Jxem5xb2N4cXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTAxMDEsImV4cCI6MjA2OTQyNjEwMX0.0xNQW8K5nx09BdGxuFJyitl8bgmb3bb3fkwMifCobXA';

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;