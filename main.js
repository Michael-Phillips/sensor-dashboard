import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';

const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc';
const table = 'readings';
const container = document.getElementById('cardContainer');
let sensorData = [];

function saveCardSettings(cardId, updated) {
  const row = sensorData.find(r => r.device_id === cardId);
  if (row) {
    row.metadata = { ...row.metadata, ...updated };
    renderCards(sensorData);
  }
}

async function fetchReadings() {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=timestamp.desc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  const data = await response.json();
  if (!Array.isArray(data)) {
    container.innerHTML = `<div class="card"><h3>API Error</h3><p>${data.message}</p></div>`;
    return;
  }

  sensorData = getLatestPerDevice(data);
  import { deleteCard } from './modal.js';

  //renderCards(sensorData, container, saveCardSettings, deleteCard);
  renderCards(sensorData, container, saveCardSettings);

}


fetchReadings();
