import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';
import { getCardSettings, createGearModal, closeModal } from './modal.js';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://qvlluhoxehdpssdebzyi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc'
);


const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc';
const table = 'readings';

let sensorData = [];

function saveCardSettings(cardId, updated) {
  const row = sensorData.find(r => r.device_id === cardId);
  if (row) {
    row.metadata = { ...row.metadata, ...updated };
    renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, deleteCard);
  }
}

function deleteCard(cardId) {
  const index = sensorData.findIndex(r => r.device_id === cardId);
  if (index !== -1) {
    sensorData.splice(index, 1);
    renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, deleteCard);
  }
}

async function fetchReadings() {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=timestamp.desc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }
  });

  const data = await response.json();
  if (!Array.isArray(data)) {
    document.getElementById('cardContainer').innerHTML = `<div class="card"><h3>API Error</h3><p>${data.message}</p></div>`;
    return;
  }

  sensorData = getLatestPerDevice(data);
  renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, deleteCard);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchReadings();
});

