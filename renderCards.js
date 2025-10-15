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
export function renderCards(sensorData, container, updateLocalCardSettings, deleteCard, saveCardSettings) {
  container.innerHTML = '';

  let availableImages = [];

  listRepoImages().then(images => {
    availableImages = images;
  });

  sensorData.forEach(row => {
    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
    console.log('🎨 Rendering card for:', row.device_id);
    console.log('🎨 Metadata:', row.metadata);
    console.log('🎨 Image:', row.metadata?.image || row.image_url);

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardId = row.device_id;

    const color = typeof metadata.color === 'string' ? metadata.color.trim() : '';
    if (color) {
      card.style.setProperty('--card-background', color);
    }

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'card-image-wrapper';

    const img = document.createElement('img');
    img.className = 'card-image';

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

    imageWrapper.appendChild(img);
    card.appendChild(imageWrapper);

    const sensorLabel = metadata.description || row.label || row.device_id;

    const sensorKeys = Object.keys(row).filter(k => k.startsWith('sensor_') && typeof row[k] === 'number');
    let sensorIndex = 0;

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const topRow = document.createElement('div');
    topRow.className = 'card-top-row';

    const textColumn = document.createElement('div');

    const cardNumber = document.createElement('p');
    cardNumber.className = 'card-number';

    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = sensorLabel;

    const timestamp = document.createElement('p');
    timestamp.className = 'card-timestamp';
    timestamp.textContent = getRelativeTime(row.timestamp);

    textColumn.append(cardNumber, title, timestamp);

    const status = document.createElement('p');
    status.className = 'card-status';
    status.hidden = true;

    topRow.append(textColumn, status);

    const typeDisplay = document.createElement('p');
    typeDisplay.className = 'card-type';

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'card-icon-wrapper';

    const gearButton = document.createElement('button');
    gearButton.type = 'button';
    gearButton.className = 'card-icon-button';
    gearButton.dataset.id = row.device_id;
    gearButton.setAttribute('aria-label', 'Open card settings');
    gearButton.innerHTML = '<i class="fas fa-cog" aria-hidden="true"></i>';

    iconWrapper.appendChild(gearButton);

    cardContent.append(topRow, typeDisplay, iconWrapper);
    card.appendChild(cardContent);

    const border = document.createElement('div');
    border.className = 'card-border';
    card.appendChild(border);

    const updateSensorDisplay = () => {
      if (!sensorKeys.length) {
        cardNumber.textContent = '--';
        status.textContent = '—';
        typeDisplay.textContent = '';
        return;
      }

      const key = sensorKeys[sensorIndex];
      const meta = metadata[key] || {};
      const unit = typeof meta.unit === 'string' ? meta.unit.trim() : '';
      const value = row[key];
      const formattedValue = typeof value === 'number'
        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : value;

      cardNumber.textContent = unit ? `${formattedValue} ${unit}` : `${formattedValue}`;
      const multipleSensors = sensorKeys.length > 1;
      status.textContent = multipleSensors ? `${sensorIndex + 1}/${sensorKeys.length}` : '';
      status.hidden = !multipleSensors;
      typeDisplay.textContent = meta.type || '';
    };

    updateSensorDisplay();

    if (sensorKeys.length) {
      card.addEventListener('click', () => {
        sensorIndex = (sensorIndex + 1) % sensorKeys.length;
        updateSensorDisplay();
      });
    }

    // ⚙️ Modal trigger
    gearButton.addEventListener('click', (event) => {
      event.stopPropagation();
      console.log('📎 Gear listener attached for', row.device_id);
      const cardId = gearButton.dataset.id;

      console.log('Gear clicked for', cardId);
      const existingData = getCardSettings(cardId, sensorData);
      console.log('📦 Existing metadata:', existingData);
      console.log('🖼️ Available images at click:', availableImages);

      try {
        createGearModal(cardId, existingData, saveCardSettings, updateLocalCardSettings, deleteCard, availableImages, sensorData);
      } catch (err) {
        console.error('❌ Modal creation failed:', err);
      }
    });

    container.appendChild(card);
  });
}
