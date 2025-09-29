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

    const sensorIndexDisplay = document.createElement('span');
    sensorIndexDisplay.className = 'sensor-index';
    sensorDisplay.appendChild(sensorIndexDisplay);

    const typeDisplay = document.createElement('p');
    typeDisplay.className = 'sensor-type';
    card.appendChild(typeDisplay);

    const updateSensorDisplay = () => {
      const key = sensorKeys[sensorIndex];
      const meta = (metadata && metadata[key]) || {};
      const unit = typeof meta.unit === 'string' ? meta.unit.trim() : '';
      const indexText = `(${sensorIndex + 1}/${sensorKeys.length})`;

      sensorDisplay.textContent = `${row[key]} ${unit} `;
      sensorDisplay.appendChild(sensorIndexDisplay);
      sensorIndexDisplay.textContent = indexText;
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

    // Show sensor type from metadata
    const key = sensorKeys[sensorIndex];
    const meta = (metadata && metadata[key]) || {};
    const typeLabel = meta.type || '';

    if (typeLabel) {
      const type = document.createElement('p');
      type.textContent = ` ${typeLabel}`;
      card.appendChild(type);
    }

    container.appendChild(card);
  });
}

// Modal close
document.querySelector('.close-button').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('hidden');
});

// Modal save
document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const deviceId = e.target.dataset.deviceId;
  const label = document.getElementById('sensor-label').value;
  const location = document.getElementById('sensor-location').value;
  const status = document.getElementById('sensor-status').value;

  const row = sensorData.find(r => r.device_id === deviceId);
  if (row) {
    row.metadata.description = label;
    row.metadata.location = location;
    row.metadata.status = status;
    renderCards(sensorData);
  }

  document.getElementById('settings-modal').classList.add('hidden');
});

fetchReadings();
