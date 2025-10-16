import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';
import { getCardSettings, createGearModal, closeModal } from './modal.js';

export const BASE_PATH = 'https://michael-phillips.github.io/sensor-dashboard/';

const supabase = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table = 'readings';

let sensorData = []; // ✅ Global reference

export async function saveCardSettings(cardId, updatedMetadata) {
  console.log('💾 Saving metadata for', cardId, updatedMetadata);

console.log('🧪 Updating device_id:', String(cardId).trim());
console.log('🧪 Supabase update using device_id:', JSON.stringify(String(cardId).trim()));

  const { data, error } = await supabase
    .from(table)
    .update({ metadata: updatedMetadata })
    .eq('device_id', String(cardId).trim());

  if (error) {
    console.error('❌ Supabase update failed:', error);
  } else {
    console.log('✅ Supabase update succeeded:', data);
  }
  return { data, error }; // 👈 This is the key addition
}

function updateLocalCardSettings(cardId, updatedMetadata) {
  //console.log('📦 sensorData BEFORE update:', JSON.stringify(sensorData, null, 2));

  const updatedSensorData = sensorData.map(row => {
    if (String(row.device_id).trim() !== String(cardId).trim()) return row;

    let existingMeta = {};
    try {
      existingMeta = typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : row.metadata || {};
    } catch (e) {
      console.warn('⚠️ Failed to parse metadata for', row.device_id, row.metadata);
    }

    const mergedMeta = { ...existingMeta, ...updatedMetadata };

    return {
      ...row,
      metadata: mergedMeta // ✅ always an object
    };
  });
  //console.log('📦 sensorData AFTER update:', JSON.stringify(sensorData, null, 2));

  sensorData = updatedSensorData;
  renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard);
  //renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard, saveCardSettings);
}

/*
function updateLocalCardSettings(cardId, updatedMetadata) {
  const updatedSensorData = sensorData.map(row =>
    String(row.device_id).trim() === String(cardId).trim()
      ? { ...row, metadata: { ...row.metadata, ...updatedMetadata } }
      : row
  );

  console.log('📦 Updating local card for:', cardId);
  console.log('📦 Metadata being applied:', updatedMetadata);

  sensorData = updatedSensorData; // ✅ update global reference
  console.log('📦 sensorData contents after update:', sensorData);
  console.log('🔄 Updated metadata for', cardId, updatedMetadata);

  renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard, saveCardSettings);
}
*/
function deleteCard(cardId) {
  sensorData = sensorData.filter(row => String(row.device_id).trim() !== String(cardId).trim());
  console.log('🗑️ Deleted card:', cardId);

  renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard);
  //renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard, saveCardSettings);
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
      document.getElementById('cardContainer').innerHTML = `<div class="card"><h3>API Error</h3><p>${data.message}</p></div>`;
      return;
    }

    sensorData = getLatestPerDevice(data);
    // 🔍 Add this here
    sensorData.forEach(row => {
      if (JSON.stringify(row).includes('git push')) {
        console.log('🧨 Found git push in:', row.device_id, row.metadata);
      }
    });

    renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard);
    //renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard, saveCardSettings);
  } catch (err) {
    console.error('❌ Failed to fetch readings:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchReadings();
});