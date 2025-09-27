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
  container.innerHTML = ''; // Clear existing cards

  const filteredData = getLatestPerDevice(data); // ✅ Only latest per device

  if (!filteredData || filteredData.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'card';
    msg.innerHTML = `<h3>No data found</h3><p>Check Supabase table or API key</p>`;
    container.appendChild(msg);
    return;
  }

  filteredData.forEach(reading => {
    const card = document.createElement('div');
    card.className = 'card';

    const imageUrl = reading.image_url || 'images/default-plant.jpg';
    const timestamp = new Date(reading.timestamp).toLocaleString();
    const metadata = reading.metadata || {};
    const sensorLabel = metadata.description || 'Unnamed Sensor';

    card.innerHTML = `
      <img src="${imageUrl}" alt="Sensor image">
      <div class="gear-icon"><i class="fas fa-cog"></i></div>
      <h3>${sensorLabel}</h3>
      <p>Time: ${timestamp}</p>
    `;

    if (metadata.location) {
      card.innerHTML += `<p><strong>Location:</strong> ${metadata.location}</p>`;
    }
    if (metadata.status) {
      card.innerHTML += `<p><strong>Status:</strong> ${metadata.status}</p>`;
    }

    const count = reading.numsens || 0;

    for (let i = 1; i <= count; i++) {
      const value = reading[`sensor_${i}`];
      const meta = metadata[`sensor_${i}`] || {};
      const label = meta.type || `Sensor ${i}`;
      const unit = meta.unit || '';
      card.innerHTML += `<p>${label}: ${value ?? 'N/A'} ${unit}</p>`;
    }

    container.appendChild(card);
  });
}

fetchReadings();
