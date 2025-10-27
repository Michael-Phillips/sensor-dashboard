// main.js
import { getLatestPerDevice, saveCardSettings } from './utils.js';
import { renderCards } from './renderCards.js';

const container = document.getElementById('cardContainer');
const supabase = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table = window.tableName;

const themeToggleButton = document.getElementById('themeToggle');
const THEME_STORAGE_KEY = 'dashboard-theme';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);
  if (themeToggleButton) {
    themeToggleButton.setAttribute('aria-pressed', String(isDark));
  }
}

function getPreferredTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialTheme = getPreferredTheme();
applyTheme(initialTheme);

if (themeToggleButton) {
  themeToggleButton.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  if (prefersDark && typeof prefersDark.addEventListener === 'function') {
    prefersDark.addEventListener('change', (event) => {
      if (localStorage.getItem(THEME_STORAGE_KEY)) {
        return;
      }
      applyTheme(event.matches ? 'dark' : 'light');
    });
  }
}

// Subscribe to new sensor readings
supabase
  .channel('sensor-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: window.tableName,
    },
    (payload) => {
      console.log('📡 New sensor data received:', payload.new);
      handleNewSensorData(payload.new);
    }
  )
  .subscribe();

let sensorData = [];
let metadataMap = new Map();

function updateLocalCardSettings(cardId, updatedMetadata) {
  // Update the metadata map
  const deviceId = String(cardId).trim();
  metadataMap.set(deviceId, updatedMetadata);

  // Update sensorData with new metadata
  sensorData = sensorData.map(row => {
    if (String(row.device_id).trim() === deviceId) {
      return { ...row, metadata: updatedMetadata };
    }
    return row;
  });

  console.log('📦 Updated metadata for device:', cardId);
  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
}

function handleNewSensorData(newReading) {
  const deviceId = String(newReading.device_id).trim();
  const index = sensorData.findIndex(row => String(row.device_id).trim() === deviceId);

  // Get existing metadata for this device
  const existingMetadata = metadataMap.get(deviceId) || {};

  if (index !== -1) {
    // Update existing device with new reading data, preserve metadata
    sensorData[index] = {
      ...newReading,
      metadata: existingMetadata
    };
  } else {
    // New device - add with empty/existing metadata
    sensorData.push({
      ...newReading,
      metadata: existingMetadata
    });
  }

  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
}

function deleteCard(cardId) {
  const deviceId = String(cardId).trim();
  
  // Remove from sensorData
  sensorData = sensorData.filter(row => String(row.device_id).trim() !== deviceId);
  
  // Remove from metadata map
  metadataMap.delete(deviceId);
  
  console.log('🗑️ Deleted card:', cardId);
  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
}

function saveCardSettingsWrapper(cardId, updatedMetadata) {
  saveCardSettings(cardId, updatedMetadata, supabase, table);
}

async function fetchReadings() {
  try {
    //console.log('🔍 Fetching readings from table:', table);

    // Fetch all readings
    const readingsResponse = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=timestamp.desc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    });

    const readings = await readingsResponse.json();
    if (!Array.isArray(readings)) {
      container.innerHTML = `<div class="card"><h3>API Error</h3><p>${readings.message}</p></div>`;
      return;
    }

    console.log('📊 Total readings fetched:', readings.length);

    // Fetch device metadata
    const metadataResponse = await fetch(`${supabaseUrl}/rest/v1/device_metadata?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    });

    const metadataArray = await metadataResponse.json();
    console.log('📋 Metadata entries fetched:', metadataArray.length);

    // Build metadata map
    metadataMap.clear();
    metadataArray.forEach(row => {
      const deviceId = String(row.device_id).trim();
      metadataMap.set(deviceId, row);
    });

    // Get latest reading per device
    const latestReadings = getLatestPerDevice(readings);
    console.log('🎯 Unique devices found:', latestReadings.length);

    // Attach metadata to each reading
    sensorData = latestReadings.map(reading => {
      const deviceId = String(reading.device_id).trim();
      return {
        ...reading,
        metadata: metadataMap.get(deviceId) || {}
      };
    });

    console.log('✅ SensorData prepared with', sensorData.length, 'devices');
    renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);

  } catch (err) {
    console.error('❌ Failed to fetch readings or metadata:', err);
    container.innerHTML = `<div class="card"><h3>Error</h3><p>Failed to load sensor data</p></div>`;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', fetchReadings);
