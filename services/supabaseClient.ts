import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zykrgvvcdimxhapvnghj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3JndnZjZGlteGhhcHZuZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzI5ODQsImV4cCI6MjA4MDk0ODk4NH0.SUy3qUDZD2X75sjEUTlSANORZbiumkJIwVbVwg9ceG4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
