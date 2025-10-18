import { getRelativeTime, getCardSettings } from './utils.js';
import { createGearModal } from './modal.js';

const BASE_PATH = window.BASE_PATH;

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

    //console.log('📁 Available images in repo:', imageFiles);
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

  sensorData.forEach(row => {
    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
    console.log('🎨 Rendering card for:', row.device_id);
    //console.log('🎨 Metadata:', row.metadata);
    console.log('🎨 Image:', row.metadata?.image || row.image_url);

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardId = row.device_id;

    const color = metadata.color || 'white';
    card.style.backgroundColor = color;

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
    console.log('🖼️ Final image URL:', img.src);

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
      const meta = metadata[key] || {};
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
        //createGearModal(cardId, existingData, saveCardSettings, updateLocalCardSettings, deleteCard, 'readings', availableImages, sensorData);
      } catch (err) {
        console.error('❌ Modal creation failed:', err);
      }

      document.body.appendChild(testDiv);
    });

    container.appendChild(card);
  });
}