const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc'; // Replace with your actual anon key
const table = 'readings';
const container = document.getElementById('cardContainer');
let sensorData = []; // ✅ Declare globally

console.log("JS loaded");

async function fetchReadings() {
  console.log("Fetching from Supabase...");

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=timestamp.desc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  const data = await response.json();
  if (!Array.isArray(data)) {
    console.error("Supabase error:", data);
    container.innerHTML = `<div class="card"><h3>API Error</h3><p>${data.message}</p></div>`;
    return;
  }

  console.log("Data received:", data);

  sensorData = getLatestPerDevice(data);
console.log("Parsed sensorData:", sensorData);

  renderCards(sensorData);
}

function getLatestPerDevice(data) {
  const seen = new Set();
  const latest = [];

  data.forEach(row => {
    const id = String(row.device_id).trim();
    if (!seen.has(id)) {
      seen.add(id);
      latest.push(row);
    }
  });

  return latest;
}

function getRelativeTime(isoString) {
      const now = new Date();
      const then = new Date(isoString);
      const diffMs = now - then;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 60) return `${diffSec} seconds ago`;
      if (diffMin < 60) return `${diffMin} minutes ago`;
      if (diffHr < 24) return `${diffHr} hours ago`;
      if (diffDay < 7) return `${diffDay} days ago`;

      return then.toLocaleDateString(); // fallback to full date
}

function renderCards(data) {
  container.innerHTML = '';

  data.forEach(row => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cardId = row.device_id; // ✅ Needed for modal logic

    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};

    // Gear icon
    const gear = document.createElement('div');
    gear.className = 'gear-icon';
    gear.innerHTML = '<i class="fas fa-cog"></i>';
    card.appendChild(gear);

    // Image
    const imageUrl = row.image_url?.trim();
    const img = document.createElement('img');
    img.src = imageUrl && imageUrl.length > 0 ? imageUrl : 'images/default-plant.jpg';
    img.alt = 'Sensor image';
    img.onerror = () => {
      console.warn('Image failed to load:', img.src);
      img.src = 'images/default-plant.jpg';
    };
    card.appendChild(img);

    // Sensor label
    const sensorLabel = metadata.description || row.label || row.device_id;
    const label = document.createElement('h3');
    label.textContent = sensorLabel;
    card.appendChild(label);

    // Sensor value (number + unit only)
    const sensorKeys = Object.keys(row).filter(k => k.startsWith('sensor_') && typeof row[k] === 'number');
    let sensorIndex = 0;

    const sensorDisplay = document.createElement('p');
    sensorDisplay.className = 'sensor-reading';

    const sensorValue = document.createElement('span');
    sensorValue.className = 'sensor-value';

    const sensorIndexDisplay = document.createElement('span');
    sensorIndexDisplay.className = 'sensor-index';

    sensorDisplay.appendChild(sensorValue); // ← This was missing
    sensorDisplay.appendChild(sensorIndexDisplay);
    card.appendChild(sensorDisplay);

    const typeDisplay = document.createElement('p');
    typeDisplay.className = 'sensor-type';

  const updateSensorDisplay = () => {
  const key = sensorKeys[sensorIndex];

  // Re-parse metadata for this row to ensure fresh access
  const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
  const meta = metadata[key] || {};

  const unit = typeof meta.unit === 'string' ? meta.unit.trim() : '';
  const indexText = `(${sensorIndex + 1}/${sensorKeys.length})`;

  sensorValue.textContent = `${row[key]} ${unit}`;
  sensorIndexDisplay.textContent = indexText;
  typeDisplay.textContent = meta.type ? ` ${meta.type}` : '';
  
  // ✅ Rebind gear icon clicks after cards are rendered
  document.querySelectorAll('.gear-icon').forEach(icon => {
    icon.onclick = () => {
      const cardId = icon.closest('.card').dataset.cardId;
      const existingData = getCardSettings(cardId);
      createGearModal(cardId, existingData);
    };
  });
};

    updateSensorDisplay();
    card.appendChild(sensorDisplay);

    // Timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = getRelativeTime(row.timestamp);
    card.appendChild(timestamp);

    card.addEventListener('click', () => {
      sensorIndex = (sensorIndex + 1) % sensorKeys.length;
      updateSensorDisplay();
    });
    container.appendChild(card);

  });
}

function createGearModal(cardId, existingData = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="gear-modal">
      <h2>Edit Sensor Settings</h2>

      <label>Description:
        <input type="text" id="desc-input" value="${existingData.description || ''}">
      </label>

      <label>Location:
        <input type="text" id="loc-input" value="${existingData.location || ''}">
      </label>

      <label>Color Tag:
        <select id="color-select">
          ${['green','yellow','aqua','blue','red','orange','purple','gray']
            .map(color => `<option value="${color}" ${existingData.color === color ? 'selected' : ''}>${color}</option>`)
            .join('')}
        </select>
      </label>

      <label>Image:
        <div id="image-panel" class="image-panel"></div>
        <div class="drop-zone">
          <p>Drag & drop an image here or click to upload</p>
          <input type="file" id="image-upload" accept="image/*">
        </div>
      </label>

      <div class="modal-actions">
        <button id="done-btn">Done</button>
        <button id="cancel-btn">Cancel</button>
        <button id="delete-btn">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setupModalLogic(modal, cardId);
}

function setupModalLogic(modal, cardId) {
  const doneBtn = modal.querySelector('#done-btn');
  const cancelBtn = modal.querySelector('#cancel-btn');
  const deleteBtn = modal.querySelector('#delete-btn');
  const imagePanel = modal.querySelector('#image-panel');
  const imageUpload = modal.querySelector('#image-upload');

  // Load thumbnails from GitHub Pages
  const imageNames = ['temp.png', 'humidity.png', 'light.png']; // Add more as needed
  imageNames.forEach(name => {
    const img = document.createElement('img');
    img.src = `https://Michael-Phillips.github.io/sensor-dashboard/images/${name}`;
    img.alt = name;
    img.className = 'thumbnail';
    img.onclick = () => {
      imagePanel.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      modal.dataset.selectedImage = img.src;
    };
    imagePanel.appendChild(img);
  });

  // Drag-and-drop logic
  imageUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        modal.dataset.selectedImage = reader.result;
        // Optionally show preview
      };
      reader.readAsDataURL(file);
    }
  };

  doneBtn.onclick = () => {
    const updated = {
      description: modal.querySelector('#desc-input').value,
      location: modal.querySelector('#loc-input').value,
      color: modal.querySelector('#color-select').value,
      image: modal.dataset.selectedImage || null
    };
    saveCardSettings(cardId, updated);
    modal.remove();
  };

  cancelBtn.onclick = () => modal.remove();

  deleteBtn.onclick = () => {
    if (confirm('Are you sure you want to delete this card and its associated data?')) {
      deleteCard(cardId);
      modal.remove();
    }
  };
}


fetchReadings();
