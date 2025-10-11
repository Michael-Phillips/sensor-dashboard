import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

window.supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc';

window.supabase = createClient(window.supabaseUrl, window.supabaseKey);

