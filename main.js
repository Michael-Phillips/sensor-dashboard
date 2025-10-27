// main.js
import { getLatestPerDevice, saveCardSettings } from './utils.js';
import { renderCards } from './renderCards.js';

const container = document.getElementById('cardContainer');
const supabase = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table = window.tableName;

const themeToggleButton = document.getElementById('themeToggle');
const locationFilterButton = document.getElementById('locationFilterButton');
const locationFilterMenu = document.getElementById('locationFilterMenu');
const activeFilterChip = document.getElementById('activeFilterChip');
const activeFilterLabel = document.getElementById('activeFilterLabel');

const THEME_STORAGE_KEY = 'dashboard-theme';
const UNASSIGNED_LOCATION_KEY = '__unassigned__';

let sensorData = [];
let metadataMap = new Map();
let activeLocationFilter = null;
let filterMenuOpen = false;

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

if (locationFilterButton) {
  locationFilterButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleFilterMenu();
  });
}

if (activeFilterChip) {
  activeFilterChip.addEventListener('click', () => {
    applyLocationFilter(null);
    closeFilterMenu();
  });
}

document.addEventListener('click', (event) => {
  if (
    filterMenuOpen &&
    locationFilterMenu &&
    locationFilterButton &&
    !locationFilterMenu.contains(event.target) &&
    !locationFilterButton.contains(event.target)
  ) {
    closeFilterMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && filterMenuOpen) {
    closeFilterMenu();
    locationFilterButton?.focus();
  }
});

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

function updateLocalCardSettings(cardId, updatedMetadata) {
  const deviceId = String(cardId).trim();
  metadataMap.set(deviceId, updatedMetadata);

  sensorData = sensorData.map(row => {
    if (String(row.device_id).trim() === deviceId) {
      return { ...row, metadata: updatedMetadata };
    }
    return row;
  });

  console.log('📦 Updated metadata for device:', cardId);
  renderDashboard();
}

function handleNewSensorData(newReading) {
  const deviceId = String(newReading.device_id).trim();
  const index = sensorData.findIndex(row => String(row.device_id).trim() === deviceId);

  const existingMetadata = metadataMap.get(deviceId) || {};

  if (index !== -1) {
    sensorData[index] = {
      ...newReading,
      metadata: existingMetadata
    };
  } else {
    sensorData.push({
      ...newReading,
      metadata: existingMetadata
    });
  }

  renderDashboard();
}

function deleteCard(cardId) {
  const deviceId = String(cardId).trim();

  sensorData = sensorData.filter(row => String(row.device_id).trim() !== deviceId);
  metadataMap.delete(deviceId);

  console.log('🗑️ Deleted card:', cardId);
  renderDashboard();
}

function saveCardSettingsWrapper(cardId, updatedMetadata) {
  saveCardSettings(cardId, updatedMetadata, supabase, table);
}

async function fetchReadings() {
  try {
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

    const metadataResponse = await fetch(`${supabaseUrl}/rest/v1/device_metadata?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    });

    const metadataArray = await metadataResponse.json();
    console.log('📋 Metadata entries fetched:', metadataArray.length);

    metadataMap.clear();
    metadataArray.forEach(row => {
      const deviceId = String(row.device_id).trim();
      metadataMap.set(deviceId, row);
    });

    const latestReadings = getLatestPerDevice(readings);
    console.log('🎯 Unique devices found:', latestReadings.length);

    sensorData = latestReadings.map(reading => {
      const deviceId = String(reading.device_id).trim();
      return {
        ...reading,
        metadata: metadataMap.get(deviceId) || {}
      };
    });

    console.log('✅ Sensor data prepared with', sensorData.length, 'devices');
    renderDashboard();
  } catch (err) {
    console.error('❌ Failed to fetch readings or metadata:', err);
    container.innerHTML = `<div class="card"><h3>Error</h3><p>Failed to load sensor data</p></div>`;
  }
}

function renderDashboard() {
  const dataToRender = getRenderableSensorData();
  renderCards(dataToRender, container, updateLocalCardSettings, deleteCard, saveCardSettingsWrapper);
  updateActiveFilterUI();
  updateLocationFilterOptions();
}

function getRenderableSensorData() {
  if (!activeLocationFilter) {
    return sensorData;
  }

  if (activeLocationFilter === UNASSIGNED_LOCATION_KEY) {
    return sensorData.filter(row => {
      const metadata = extractMetadata(row.metadata);
      return !getLocationFromMetadata(metadata);
    });
  }

  return sensorData.filter(row => {
    const metadata = extractMetadata(row.metadata);
    return getLocationFromMetadata(metadata) === activeLocationFilter;
  });
}

function extractMetadata(metadata) {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (err) {
      console.warn('⚠️ Failed to parse metadata JSON:', err);
      return {};
    }
  }

  return metadata;
}

function getLocationFromMetadata(metadata) {
  if (!metadata || typeof metadata.location === 'undefined' || metadata.location === null) {
    return '';
  }

  return String(metadata.location).trim();
}

function updateLocationFilterOptions() {
  if (!locationFilterMenu) {
    return;
  }

  const locationCounts = new Map();
  let unassignedCount = 0;

  sensorData.forEach(row => {
    const metadata = extractMetadata(row.metadata);
    const location = getLocationFromMetadata(metadata);

    if (location) {
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    } else {
      unassignedCount += 1;
    }
  });

  const sortedLocations = Array.from(locationCounts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { sensitivity: 'base' })
  );

  locationFilterMenu.innerHTML = '';

  const addOption = (label, value, count) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.locationValue = value ?? '';
    button.className = 'filter-option';
    button.textContent = typeof count === 'number' ? `${label} (${count})` : label;

    const isActive =
      (!value && !activeLocationFilter) ||
      (value === UNASSIGNED_LOCATION_KEY && activeLocationFilter === UNASSIGNED_LOCATION_KEY) ||
      (value && value === activeLocationFilter);

    if (isActive) {
      button.classList.add('is-active');
    }

    button.addEventListener('click', () => {
      applyLocationFilter(value);
      closeFilterMenu();
    });

    locationFilterMenu.appendChild(button);
  };

  addOption('All locations', null, sensorData.length);

  sortedLocations.forEach(([location, count]) => {
    addOption(location, location, count);
  });

  if (unassignedCount > 0) {
    addOption('Unassigned', UNASSIGNED_LOCATION_KEY, unassignedCount);
  }
}

function applyLocationFilter(value) {
  const normalized = value ? value : null;
  if (normalized === activeLocationFilter) {
    return;
  }

  activeLocationFilter = normalized;
  renderDashboard();
}

function updateActiveFilterUI() {
  if (!activeFilterChip || !activeFilterLabel) {
    return;
  }

  if (!activeLocationFilter) {
    activeFilterChip.hidden = true;
    activeFilterChip.setAttribute('aria-hidden', 'true');
    activeFilterChip.classList.remove('is-active');
    return;
  }

  const label =
    activeLocationFilter === UNASSIGNED_LOCATION_KEY ? 'Unassigned' : activeLocationFilter;

  activeFilterLabel.textContent = `Location: ${label}`;
  activeFilterChip.hidden = false;
  activeFilterChip.setAttribute('aria-hidden', 'false');
  activeFilterChip.classList.add('is-active');
}

function toggleFilterMenu() {
  if (!locationFilterMenu || !locationFilterButton) {
    return;
  }

  if (filterMenuOpen) {
    closeFilterMenu();
  } else {
    updateLocationFilterOptions();
    locationFilterMenu.hidden = false;
    locationFilterButton.setAttribute('aria-expanded', 'true');
    filterMenuOpen = true;
  }
}

function closeFilterMenu() {
  if (!locationFilterMenu || !locationFilterButton) {
    return;
  }

  locationFilterMenu.hidden = true;
  locationFilterButton.setAttribute('aria-expanded', 'false');
  filterMenuOpen = false;
}

document.addEventListener('DOMContentLoaded', fetchReadings);
