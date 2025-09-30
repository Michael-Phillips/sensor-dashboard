import { getRelativeTime } from './utils.js';
import { getCardSettings, createGearModal } from './modal.js';

export function renderCards(data, container, saveCardSettings, deleteCard) {
  container.innerHTML = '';

  data.forEach(row => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardId = row.device_id;

    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};

    const gear = document.createElement('div');
    gear.className = 'gear-icon';
    gear.dataset.id = row.device_id;
    gear.innerHTML = '<i class="fas fa-cog"></i>';
    card.appendChild(gear);

    const imageUrl = metadata.image?.trim() || row.image_url?.trim();
    const img = document.createElement('img');
    img.src = imageUrl && imageUrl.length > 0 ? imageUrl : 'images/default-plant.jpg';
    img.alt = 'Sensor image';
    img.onerror = () => {
      console.warn('Image failed to load:', img.src);
      img.src = 'images/default-plant.jpg';
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
  const cardId = gear.dataset.id;
  console.log('Gear clicked for', cardId); // ✅ now it's defined
  const existingData = getCardSettings(cardId, data);
  createGearModal(cardId, existingData, saveCardSettings, deleteCard);
});


    container.appendChild(card);
  });
}
