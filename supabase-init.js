import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

window.supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
window.supabaseKey = 'sb_publishable_avHO7oiQBQijHQ7jW_dYTg_AgNxSTiw';

window.supabase = createClient(window.supabaseUrl, window.supabaseKey, {
  global: {
    headers: {
      Authorization: `Bearer ${window.supabaseKey}`,
    },
  },
});



