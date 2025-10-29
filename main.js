// main.js v2.1 - Added alert deduplication
import { getLatestPerDevice, saveCardSettings } from './utils.js';
import { renderCards } from './renderCards.js';

const container = document.getElementById('cardContainer');
const supabase = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table = window.tableName;

// Track recent alert checks to prevent duplicates
const recentAlertChecks = new Map(); // key: deviceId, value: timestamp
const ALERT_DEBOUNCE_MS = 5000; // 5 seconds

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
      //console.log('📡 New sensor data received:', payload.new);
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

async function handleNewSensorData(newReading) {
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

  // 🚨 Check alerts after updating sensor data
  await checkAndSendAlerts(newReading);

  renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
}

// 🚨 Function to check alerts and call Edge Function
async function checkAndSendAlerts(newReading) {
  try {
    const deviceId = String(newReading.device_id).trim();
    const now = Date.now();
    
    // Check if we recently checked alerts for this device
    const lastCheck = recentAlertChecks.get(deviceId);
    if (lastCheck && (now - lastCheck) < ALERT_DEBOUNCE_MS) {
      console.log(`⏭️ Skipping duplicate alert check for ${deviceId} (within ${ALERT_DEBOUNCE_MS}ms)`);
      return;
    }
    
    // Record this check
    recentAlertChecks.set(deviceId, now);
    
    console.log('🔔 Checking alerts for device:', newReading.device_id);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/sensor-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        type: 'pg_changes',
        table: 'readings',
        schema: 'public',
        record: newReading,  // Match webhook format that Edge Function expects
        old_record: null
      })
    });

    if (response.ok) {
      console.log('✅ Alert check completed');
    } else {
      const errorText = await response.text();
      console.error('❌ Alert check failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error checking alerts:', error);
  }
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