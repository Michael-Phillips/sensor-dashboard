import { getRelativeTime } from './utils.js';
import { getCardSettings, createGearModal } from './modal.js';

import { BASE_PATH } from './main.js';

// 🔍 GitHub API image listing
async function listRepoImages() {
  console.log('📡 Starting GitHub API image fetch...');

  const user = 'michael-phillips';
  const repo = 'sensor-dashboard';
  const folder = 'images';
  const branch = 'main'; // Change to 'master' if needed

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

    console.log('📁 Available images in repo:', imageFiles);
    return imageFiles;
  } catch (error) {
    console.error('Error fetching image list:', error);
    return [];
  }
}

// New, stable argument order: data, container, saveCardSettings, updateLocalCardSettings, deleteCard, sensorData
export function renderCards(data, container, saveCardSettings, updateLocalCardSettings, deleteCard, sensorData = []) {
  container.innerHTML = '';

  // Load image list in background
  let availableImages = [];
  listRepoImages().then(images => {
    availableImages = images;
  });

  data.forEach(row => {
    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
    // Build card
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardId = row.device_id;

    // Apply background color from metadata
    const color = metadata.color || 'white';
    card.style.backgroundColor = color;

    const gear = document.createElement('div');
    gear.className = 'gear-icon';
    gear.dataset.id = row.device_id;
    gear.innerHTML = '<i class="fas fa-cog"></i>';
    card.appendChild(gear);

    const img = document.createElement('img');

    let imageUrl = (metadata.image && String(metadata.image).trim()) || (row.image_url && String(row.image_url).trim());

    if (!imageUrl || imageUrl === 'undefined' || imageUrl.length === 0) {
      imageUrl = 'images/default-plant.jpg';
    } else if (!imageUrl.startsWith('http') && !imageUrl.includes('images/')) {
      imageUrl = `images/${imageUrl}`;
    }

    img.src = imageUrl.startsWith('http') ? imageUrl : `${BASE_PATH}${imageUrl}`;

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
      if (!sensorKeys.length) {
        sensorValue.textContent = '—';
        sensorIndexDisplay.textContent = '';
        typeDisplay.textContent = '';
        return;
      }
      const key = sensorKeys[sensorIndex];
      const meta = (metadata[key] && typeof metadata[key] === 'object') ? metadata[key] : {};
      const unit = typeof meta.unit === 'string' ? meta.unit.trim() : '';
      const indexText = `(${sensorIndex + 1}/${sensorKeys.length})`;

      sensorValue.textContent = `${row[key]} ${unit}`;
      sensorIndexDisplay.textContent = indexText;
      typeDisplay.textContent = meta.type ? ` ${meta.type}` : '';
    };

    updateSensorDisplay();
    card.appendChild(typeDisplay);

    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = getRelativeTime(row.timestamp || row.ts || row.time);
    card.appendChild(timestamp);

    card.addEventListener('click', () => {
      if (sensorKeys.length === 0) return;
      sensorIndex = (sensorIndex + 1) % sensorKeys.length;
      updateSensorDisplay();
    });

    // ⚙️ Modal trigger
    gear.addEventListener('click', (event) => {
      event.stopPropagation();
      const cardId = gear.dataset.id;
      const existingData = getCardSettings(cardId, data);
      try {
        // pass sensorData along so modal can inspect current dataset if needed
        createGearModal(cardId, existingData, saveCardSettings, updateLocalCardSettings, deleteCard, availableImages, sensorData);
      } catch (err) {
        console.error('❌ Modal creation failed:', err);
      }
    });

    container.appendChild(card);
  });
}