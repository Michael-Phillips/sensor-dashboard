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

// Make sensorData available globally for debugging
window.debugSensorData = () => {
  console.log('Current sensorData:', sensorData);
  console.log('Device IDs:', sensorData.map(s => s.device_id));
  return sensorData;
};

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
    sensorData[index] = {
      ...sensorData[index],
      ...newRow,
      metadata: {
        ...sensorData[index].metadata,
        ...newRow.metadata,
      },
    };
  } else {
    sensorData.push({ ...newRow, metadata: {} });
  }

  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettings);
}

function deleteCard(cardId) {
  sensorData = sensorData.filter(row => String(row.device_id).trim() !== String(cardId).trim());
  console.log('🗑️ Deleted card:', cardId);

  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
}

function saveCardSettingsWrapper(cardId, updatedMetadata) {
  saveCardSettings(cardId, updatedMetadata, supabase, table);
}

async function fetchReadings() {
  try {
    // Fetch sensor readings
    console.log('🔍 Fetching readings from table:', table);
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
    
    // Get unique device IDs from readings
    const uniqueDeviceIds = [...new Set(readings.map(r => String(r.device_id).trim()))];
    console.log('🔢 Unique device_ids in readings:', uniqueDeviceIds);
    console.log('🔢 Total unique devices:', uniqueDeviceIds.length);

    // Fetch metadata
    const metadataResponse = await fetch(`${supabaseUrl}/rest/v1/device_metadata?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    });

    const metadata = await metadataResponse.json();
    console.log('📋 Metadata entries fetched:', metadata.length);
    
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

    console.log('✨ Enriched readings count:', enrichedReadings.length);

    // Deduplicate and render
    sensorData = getLatestPerDevice(enrichedReadings);
    
    console.log('🎯 Final sensorData count:', sensorData.length);
    console.log('🎯 Final device_ids:', sensorData.map(s => s.device_id));
    
    // Verify all devices made it through
    const finalDeviceIds = sensorData.map(s => String(s.device_id).trim());
    const missingDevices = uniqueDeviceIds.filter(id => !finalDeviceIds.includes(id));
    
    if (missingDevices.length > 0) {
      console.warn('⚠️ MISSING DEVICES:', missingDevices);
      console.warn('⚠️ These device_ids are in readings but not in final sensorData!');
    } else {
      console.log('✅ All devices accounted for!');
    }

    renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
  } catch (err) {
    console.error('❌ Failed to fetch readings or metadata:', err);
  }
}

document.addEventListener('DOMContentLoaded', fetchReadings);