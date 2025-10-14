import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';
import { getCardSettings, createGearModal, closeModal } from './modal.js';
import mockSensors from './src/mocks/sensors.js';

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
    row.device_id === cardId
      ? { ...row, metadata: { ...row.metadata, ...updatedMetadata } }
      : row
  );

  sensorData = updatedSensorData; // ✅ update global reference

  // Re-render using unified argument order: (data, container, save, updateLocal, delete, sensorData)
  renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard, sensorData);
}

function deleteCard(cardId) {
  const index = sensorData.findIndex(r => r.device_id === cardId);
  if (index !== -1) {
    sensorData.splice(index, 1);
    renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard, sensorData);
  }
}

async function fetchReadings() {
  const urlParams = new URLSearchParams(window.location.search);
  const useMock = urlParams.get('mock') === '1';

  if (useMock) {
    console.log('🧪 Using mock sensor data (explicit ?mock=1)');
    sensorData = getLatestPerDevice(mockSensors);
    renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard, sensorData);
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=timestamp.desc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    });

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ API returned no array. Falling back to mock data.');
      sensorData = getLatestPerDevice(mockSensors);
      renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard, sensorData);
      return;
    }

    sensorData = getLatestPerDevice(data);
    renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard, sensorData);
  } catch (err) {
    console.error('❌ Fetch failed, falling back to mock data:', err);
    sensorData = getLatestPerDevice(mockSensors);
    renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, updateLocalCardSettings, deleteCard, sensorData);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchReadings();
});

