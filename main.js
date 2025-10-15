import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';
import { createLocationFilter } from './locationFilter.js';
import { getCardSettings, createGearModal, closeModal } from './modal.js';

export const BASE_PATH = 'https://michael-phillips.github.io/sensor-dashboard/';

const supabase = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table = 'readings';

let sensorData = []; // ✅ Global reference
let cardContainer;
let locationFilterControl;
let activeLocationFilter = null;

function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      console.warn('Unable to parse metadata JSON:', error);
      return {};
    }
  }
  return {};
}

function getLocationFromRow(row = {}) {
  const metadata = parseMetadata(row.metadata);
  const rawLocation = metadata.location || metadata.Location || row.location;
  return typeof rawLocation === 'string' ? rawLocation.trim() : '';
}

function getUniqueLocations(data = []) {
  const seen = new Map();

  data.forEach(row => {
    const location = getLocationFromRow(row);
    if (!location) return;

    const normalized = location.toLowerCase();
    if (!seen.has(normalized)) {
      seen.set(normalized, location);
    }
  });

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

function applyLocationFilter(data = [], location) {
  if (!location) return data;
  const normalized = location.toLowerCase();
  return data.filter(row => getLocationFromRow(row).toLowerCase() === normalized);
}

function refreshDashboard() {
  if (!cardContainer) return;

  if (locationFilterControl) {
    const locations = getUniqueLocations(sensorData);
    const nextSelection = locationFilterControl.updateOptions(locations, activeLocationFilter);

    if (nextSelection !== activeLocationFilter) {
      activeLocationFilter = nextSelection;
    }
  }

  const filteredData = applyLocationFilter(sensorData, activeLocationFilter);
  renderCards(filteredData, cardContainer, updateLocalCardSettings, deleteCard, saveCardSettings);
}

export async function saveCardSettings(cardId, updatedMetadata) {
  console.log('💾 Saving metadata for', cardId, updatedMetadata);

  const { data, error } = await supabase
    .from(table)
    .update({ metadata: updatedMetadata })
    .eq('device_id', String(cardId).trim());

  if (error) {
    console.error('❌ Supabase update failed:', error);
  } else {
    console.log('✅ Supabase update succeeded:', data);
  }
}

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

  refreshDashboard();
}

function deleteCard(cardId) {
  sensorData = sensorData.filter(row => String(row.device_id).trim() !== String(cardId).trim());
  console.log('🗑️ Deleted card:', cardId);

  refreshDashboard();
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
    refreshDashboard();
  } catch (err) {
    console.error('❌ Failed to fetch readings:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cardContainer = document.getElementById('cardContainer');

  const controlsRoot = document.getElementById('cardControls');
  if (controlsRoot) {
    locationFilterControl = createLocationFilter(controlsRoot, {
      onChange: value => {
        activeLocationFilter = value;
        refreshDashboard();
      }
    });
  }

  fetchReadings();
});
