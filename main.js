import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';

const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
const supabaseKey = 'your-key-here';
const table = 'readings';
const container = document.getElementById('cardContainer');
let sensorData = [];

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
  renderCards(sensorData, container, saveCardSettings, deleteCard);
}

fetchReadings();
