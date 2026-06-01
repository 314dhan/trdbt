import { createClient } from '@supabase/supabase-js';

// Fallback placeholders prevent crash when env vars are missing.
// All queries will fail silently — app still works via localStorage.
const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-key';

export const supabase = createClient(url, key);
