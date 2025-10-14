# Sensor Dashboard

Small client-side dashboard for visualizing sensor readings. Cards display the latest reading per device and include a gear icon to open a settings modal where metadata (description, location, color, image) can be edited.

Quick overview
- UI: index.html + style.css
- Logic: main.js, renderCards.js, modal.js, utils.js
- Mock data: `src/mocks/sensors.js` (useful for local development)
- Images: `images/` (the app will fallback to `images/default-plant.jpg`)

Run locally
1. Serve the folder with a static server (recommended):  
   - Python 3: `python -m http.server 8000`  
   - Node: `npx http-server -p 8000`  
2. Open `http://localhost:8000` in your browser.

Use mock data
- To force the app to use the included mock dataset open:
  `http://localhost:8000/?mock=1`
- The mock data file is `/src/mocks/sensors.js`. Edit that file to add/edit fake sensors.

Supabase / production notes
- `supabase-init.js` currently sets `window.supabaseUrl` and `window.supabaseKey`. Replace the anon key with your own for real backend access.
- The app fetches readings from Supabase in `main.js` (table: `readings`). If the API fails or returns no data the app falls back to mock data automatically.

Images
- Cards use `metadata.image` or `image_url`. Relative image paths are resolved against `BASE_PATH` (set in `main.js`).
- If an image fails to load the code falls back to `images/default-plant.jpg`.
- A background GitHub image lookup runs in `renderCards.js` (optional) to populate selectable images in the modal.

Editing card metadata locally (during development)
- Click the gear icon on a card to open the modal (modal is created dynamically by `modal.js`).
- "Done" updates metadata locally and attempts to save via `saveCardSettings()` (which uses Supabase). Use `?mock=1` for safe testing without touching the backend.

Troubleshooting
- If cards are empty or images missing, try `?mock=1` to verify UI behavior with known-good data.
- Check the browser console for fetch errors or CORS issues when connecting to Supabase or the GitHub API.

Security & best practices
- Do not commit real Supabase anon service keys to public repos.
- For production, secure API access and consider server-side functions for mutation operations.

Files of interest
- index.html — page and default modal markup
- style.css — layout & styles
- main.js — startup, fetch logic, and state
- renderCards.js — card rendering and GitHub image listing
- modal.js — dynamic modal creation for editing metadata
- src/mocks/sensors.js — mock sensor definitions

If you want, I can also add a short CONTRIBUTING or DEV_NOTES section explaining how to add sensors or wire up a personal Supabase project.
