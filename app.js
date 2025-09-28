const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc'; // Replace with your actual anon key
const table = 'readings';
const container = document.getElementById('cardContainer');

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

  const filteredData = getLatestPerDevice(data);
  renderCards(filteredData);
}

function getLatestPerDevice(data) {
  const seen = new Set();
  const latest = [];

  data.forEach(row => {
    const id = String(row.device_id).trim(); // normalize to string
    if (!seen.has(id)) {
      seen.add(id);
      latest.push(row);
    }
  });

  return latest;
}

function renderCards(data) {
  const container = document.getElementById('cardContainer');
  container.innerHTML = '';

  data.forEach(row => {
    const card = document.createElement('div');
    card.className = 'card';

    const imageUrl = row.image_url || 'images/default-plant.jpg';
    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
    const sensorLabel = metadata.description || row.label || row.device_id;

    // Build card content
    card.innerHTML = `
      <div class="gear-icon"><i class="fas fa-cog"></i></div>
      <img src="${imageUrl}" alt="Sensor image">
      <h3>${sensorLabel}</h3>
      <p>Time: ${new Date(row.timestamp).toLocaleString()}</p>
    `;

    // Dynamically add sensor readings
    Object.keys(row).forEach(key => {
      if (key.startsWith('sensor_') && typeof row[key] === 'number') {
        const meta = metadata[key] || {};
        const label = meta.type || key;
        const unit = meta.unit?.trim() || '';
        card.innerHTML += `<p>${label}: ${row[key]} ${unit}</p>`;
      }
    });

    // Optional metadata fields
    if (metadata.location) card.innerHTML += `<p>Location: ${metadata.location}</p>`;
    if (metadata.status) card.innerHTML += `<p>Status: ${metadata.status}</p>`;

    // Gear icon click handler
    card.querySelector('.gear-icon').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.remove('hidden');
      document.getElementById('sensor-label').value = sensorLabel;
      document.getElementById('sensor-location').value = metadata.location || '';
      document.getElementById('sensor-status').value = metadata.status || '';
    });

    container.appendChild(card);
  });
}

// Close modal
document.querySelector('.close-button').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('hidden');
});

// Save modal edits (optional logic)
document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const deviceId = e.target.dataset.deviceId;
  const label = document.getElementById('sensor-label').value;
  const location = document.getElementById('sensor-location').value;
  const status = document.getElementById('sensor-status').value;

  // Update local data (replace with Firestore/Supabase logic if needed)
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
