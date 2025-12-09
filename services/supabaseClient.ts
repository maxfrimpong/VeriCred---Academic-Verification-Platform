import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://pkqofvrinbmicyftipoa.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcW9mdnJpbmJtaWN5ZnRpcG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzQyNjUsImV4cCI6MjA4MDg1MDI2NX0.NRYBPNzoUwObyv6XPDom9s8iMcAGd_CMzTDyRpDHlkw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);