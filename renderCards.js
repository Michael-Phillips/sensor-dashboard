// renderCards.js
import { getRelativeTime, getCardSettings } from './utils.js';
import { createGearModal } from './modal.js';
import { resolveColorToken, COLOR_OPTIONS } from './modalSettings.js';

const BASE_PATH = window.BASE_PATH;
const COLOR_TOKENS = new Set(['white', 'green', 'yellow', 'aqua', 'blue', 'red', 'orange', 'purple', 'gray']);
const COLOR_FALLBACK_MAP = new Map(COLOR_OPTIONS.map(({ token, fallback }) => [token, fallback]));

// 🎨 Sort cards by color (hex value)
function sortByColor(sensorData) {
  return sensorData.slice().sort((a, b) => {
    const colorA = (typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata || {}).color || '#FFFFFF';
    const colorB = (typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata || {}).color || '#FFFFFF';
    return colorA.localeCompare(colorB);
  });
}

// 🔍 GitHub API image listing
async function listRepoImages() {
  console.log('📡 Starting GitHub API image fetch...');

  const user = 'michael-phillips';
  const repo = 'sensor-dashboard';
  const folder = 'images';
  const branch = 'main';

  const apiUrl = `https://api.github.com/repos/${user}/${repo}/git/trees/${branch}?recursive=1`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.tree) {
      console.warn('No tree data returned from GitHub API');
      return [];
    }

    const imageFiles = data.tree
      .filter(item => item.path.startsWith(`${folder}/`) && item.type === 'blob')
      .map(item => item.path.replace(`${folder}/`, ''));

    return imageFiles;
  } catch (error) {
    console.error('Error fetching image list:', error);
    return [];
  }
} 

export function renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettings) {
  container.innerHTML = '';

  let availableImages = [];

  listRepoImages().then(images => {
    availableImages = images;
  });

  // 🎨 Sort data by color before rendering
  const sortedData = sortByColor(sensorData);

  sortedData.forEach(row => {
    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
    //console.log('🎨 Rendering card for:', row.device_id);
    //console.log('🎨 Image:', row.metadata?.image || row.image_url);

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardId = row.device_id;

    const rawColor = (metadata.color || '').trim();
    const resolvedToken = resolveColorToken(rawColor) || (rawColor ? rawColor.toLowerCase() : '');
    const colorToken = COLOR_TOKENS.has(resolvedToken) ? resolvedToken : null;

    if (colorToken) {
      const fallbackColor = COLOR_FALLBACK_MAP.get(colorToken) || '';
      card.dataset.colorToken = colorToken;
      card.style.backgroundColor = `var(--card-color-${colorToken}${fallbackColor ? `, ${fallbackColor}` : ''})`;
    } else {
      delete card.dataset.colorToken;
      card.style.backgroundColor = rawColor || '';
    }

    const gear = document.createElement('div');
    gear.className = 'gear-icon';
    gear.dataset.id = row.device_id;
    gear.innerHTML = '<i class="fas fa-cog"></i>';
    card.appendChild(gear);

    const img = document.createElement('img');
    let imageUrl = metadata.image?.trim() || row.image_url?.trim();

    if (!imageUrl || imageUrl === 'undefined' || imageUrl.length === 0) {
      imageUrl = 'images/default-plant.jpg';
    } else if (!imageUrl.startsWith('http') && !imageUrl.includes('images/')) {
      imageUrl = `images/${imageUrl}`;
    }

    img.src = imageUrl.startsWith('http') ? imageUrl : `${BASE_PATH}${imageUrl}`;
    //console.log('🖼️ Final image URL:', img.src);

    img.onerror = () => {
      console.warn('Image failed to load:', img.src);
      if (!img.src.includes('default-plant.jpg')) {
        img.src = `${BASE_PATH}images/default-plant.jpg`;
      }
    };

    card.appendChild(img);

    const sensorLabel = metadata.description || row.label || row.device_id;
    const label = document.createElement('h3');
    label.textContent = sensorLabel;
    card.appendChild(label);

    const sensorKeys = Object.keys(row).filter(k => k.startsWith('sensor_') && typeof row[k] === 'number');
    let sensorIndex = 0;

    const sensorDisplay = document.createElement('p');
    sensorDisplay.className = 'sensor-reading';

    const sensorValue = document.createElement('span');
    sensorValue.className = 'sensor-value';

    const sensorIndexDisplay = document.createElement('span');
    sensorIndexDisplay.className = 'sensor-index';

    sensorDisplay.appendChild(sensorValue);
    sensorDisplay.appendChild(sensorIndexDisplay);
    card.appendChild(sensorDisplay);

    const typeDisplay = document.createElement('p');
    typeDisplay.className = 'sensor-type';

    const updateSensorDisplay = () => {
      const key = sensorKeys[sensorIndex];
      // Read from sensor_config or fallback to top-level
      const meta = metadata.sensor_config?.[key] || metadata[key] || {};
      
      const rawValue = row[key];
      const indexText = `(${sensorIndex + 1}/${sensorKeys.length})`;

      // Check if this is a boolean sensor
      if (meta.is_boolean) {
        // Convert to boolean (0 = false, non-zero = true)
        const boolValue = rawValue !== 0;
        const displayLabel = boolValue 
          ? (meta.true_label || 'On') 
          : (meta.false_label || 'Off');
        
        sensorValue.textContent = displayLabel;
      } else {
        // Regular numeric display
        const unit = meta.unit || (typeof meta.unit === 'string' ? meta.unit.trim() : '');
        sensorValue.textContent = unit 
          ? `${rawValue} ${unit}` 
          : `${rawValue}`;
      }
      
      sensorIndexDisplay.textContent = indexText;
      
      // Display function/type
      typeDisplay.textContent = meta.function || meta.type || '';
    };

    updateSensorDisplay();
    card.appendChild(typeDisplay);

    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = getRelativeTime(row.timestamp);
    card.appendChild(timestamp);

    card.addEventListener('click', () => {
      sensorIndex = (sensorIndex + 1) % sensorKeys.length;
      updateSensorDisplay();
    });

    // ⚙️ Modal trigger
    gear.addEventListener('click', (event) => {
      event.stopPropagation();
      console.log('📎 Gear listener attached for', row.device_id);
      const cardId = gear.dataset.id;

      const testDiv = document.createElement('div');

      console.log('Gear clicked for', cardId);
      const existingData = getCardSettings(cardId, sensorData);
      console.log('📦 Existing metadata:', existingData);
      console.log('🖼️ Available images at click:', availableImages);

      try {
        createGearModal(cardId, existingData, updateLocalCardSettings, deleteCard, window.supabase, availableImages, sensorData);
      } catch (err) {
        console.error('❌ Modal creation failed:', err);
      }

      document.body.appendChild(testDiv);
    });

    container.appendChild(card);
  });
}
