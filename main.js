import { getLatestPerDevice, saveCardSettings } from './utils.js';
import { renderCards } from './renderCards.js';

const container = document.getElementById('cardContainer');
const supabase    = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table       = window.tableName;

supabase
  .channel('sensor-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT', // or 'UPDATE' if sensors overwrite
      schema: 'public',
      table: window.tableName,
    },
    (payload) => {
      console.log('📡 New sensor data received:', payload.new);
      handleNewSensorData(payload.new);
    }
  )
  .subscribe();
  


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

function handleNewSensorData(newRow) {
  const deviceId = String(newRow.device_id).trim();
  const index = sensorData.findIndex(row => String(row.device_id).trim() === deviceId);

  if (index !== -1) {
    // Merge new sensor values but preserve existing metadata
    sensorData[index] = {
      ...sensorData[index],
      ...newRow,
      metadata: {
        ...sensorData[index].metadata,
        ...newRow.metadata, // ✅ this line ensures meta_type is updated
      },
    };
  } else {
    // If it's a new device, initialize metadata to empty
    sensorData.push({ ...newRow, metadata: {} });
  }

  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettings);
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
    // Fetch sensor readings
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

    // Fetch metadata
    const metadataResponse = await fetch(`${supabaseUrl}/rest/v1/device_metadata?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    });

    const metadata = await metadataResponse.json();
    const metadataMap = new Map();
    metadata.forEach(row => {
      metadataMap.set(String(row.device_id).trim(), row);
    });

    // Merge metadata into readings
    const enrichedReadings = readings.map(reading => {
      const id = String(reading.device_id).trim();
      return {
        ...reading,
        metadata: metadataMap.get(id) || {},
      };
    });

    // Deduplicate and render
    sensorData = getLatestPerDevice(enrichedReadings);
    renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
  } catch (err) {
    console.error('❌ Failed to fetch readings or metadata:', err);
  }
}

document.addEventListener('DOMContentLoaded', fetchReadings);
