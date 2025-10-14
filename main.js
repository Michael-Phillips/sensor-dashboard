import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';
import { getCardSettings, createGearModal, closeModal } from './modal.js';

export const BASE_PATH = 'https://michael-phillips.github.io/sensor-dashboard/';

const supabase = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table = 'readings';

let sensorData = [];

export async function saveCardSettings(cardId, updatedMetadata) {
  const supabase = window.supabase;

  console.log('💾 Saving metadata for', cardId, updatedMetadata);

  const { data, error } = await supabase
    .from('readings')
    .update({ metadata: updatedMetadata })
    .eq('device_id', String(cardId).trim());

  if (error) {
    console.error('❌ Supabase update failed:', error);
  } else {
    console.log('✅ Supabase update succeeded:', data);
  }
}

function updateLocalCardSettings(cardId, updatedMetadata) {
  // Clone and update sensorData safely
  const updatedSensorData = sensorData.map(row =>
    String(row.device_id).trim() === String(cardId).trim()
      ? { ...row, metadata: { ...row.metadata, ...updatedMetadata } }
      : row
  );
console.log('📦 Updating local card for:', cardId);
console.log('📦 Metadata being applied:', updatedMetadata);

  sensorData = updatedSensorData; // ✅ update global reference
  console.log('📦 sensorData contents at Done click:', sensorData);
  console.log('🔄 Updated metadata for', cardId, updatedMetadata);

  renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard);
}

function deleteCard(cardId) {
  const index = sensorData.findIndex(r => r.device_id === cardId);
  if (index !== -1) {
    sensorData.splice(index, 1);
    //renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, deleteCard);
    renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard);

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

