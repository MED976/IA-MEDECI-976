import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcgudzxbndvmqcoalqfz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZ3VkenhibmR2bXFjb2FscWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODY2NzMsImV4cCI6MjA5MDk2MjY3M30.IwEsVaXOBHiM8Z2IHhrhBo0AawH-22xaqBt__nbK-Qs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
