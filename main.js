import { getLatestPerDevice, saveCardSettings } from './utils.js';
import { renderCards } from './renderCards.js';

const container = document.getElementById('cardContainer');
const supabase    = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table       = window.tableName;


let sensorData = []; // ✅ Global reference

function updateLocalCardSettings(cardId, updatedMetadata) {
  sensorData = sensorData.map(row =>
    String(row.device_id).trim() === String(cardId).trim()
      ? { ...row, metadata: { ...row.metadata, ...updatedMetadata } }
      : row
  );

  console.log('📦 Updating local card for:', cardId);
  console.log('📦 Metadata being applied:', updatedMetadata);
  console.log('📦 sensorData contents after update:', sensorData);

  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
}

function deleteCard(cardId) {
  sensorData = sensorData.filter(row => String(row.device_id).trim() !== String(cardId).trim());
  console.log('🗑️ Deleted card:', cardId);

  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
}

// ✅ Wrapper to pass supabase + table to utils version
function saveCardSettingsWrapper(cardId, updatedMetadata) {
  saveCardSettings(cardId, updatedMetadata, supabase, table);
}

async function fetchReadings() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=timestamp.desc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    });

    const data = await response.json();
    if (!Array.isArray(data)) {
      container.innerHTML = `<div class="card"><h3>API Error</h3><p>${data.message}</p></div>`;
      return;
    }

    sensorData = getLatestPerDevice(data);
    renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
  } catch (err) {
    console.error('❌ Failed to fetch readings:', err);
  }
}

document.addEventListener('DOMContentLoaded', fetchReadings);