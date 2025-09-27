const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc'; // Replace with your actual anon key
const table = 'readings';
const container = document.getElementById('cardContainer');

console.log("JS loaded");

async function fetchReadings() {
  console.log('Fetching from Supabase...');
  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*&order=timestamp.desc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });

  const data = await response.json();
  console.log('Data received:', data);

  if (!Array.isArray(data)) {
    console.error("Supabase error:", data);
    document.getElementById('cardContainer').innerHTML = `<div class="card"><h3>API Error</h3><p>${data.message}</p></div>`;
    return;
  }

  const latestPerDevice = getLatestPerDevice(data);
  renderCards(latestPerDevice);
}

function getLatestPerDevice(data) {
  const seen = new Set();
  return data.filter(row => {
    if (seen.has(row.device_id)) return false;
    seen.add(row.device_id);
    return true;
  });
}

function renderCards(data) {
  const container = document.getElementById('cardContainer');
  container.innerHTML = '';

  data.forEach(row => {
    const card = document.createElement('div');
    card.className = 'card';

    const imageUrl = row.image_url || 'images/placeholder.png';
    const sensorLabel = row.label || row.device_id;
    const metadata = {
      location: row.location || '',
      status: row.status || ''
    };

    card.innerHTML = `
      <img src="${imageUrl}" alt="Sensor image">
      <div class="gear-icon"><i class="fas fa-cog"></i></div>
      <h3>${sensorLabel}</h3>
      <p>Time: ${new Date(row.timestamp).toLocaleString()}</p>
      ${row.moisture ? `<p>Moisture: ${row.moisture}</p>` : ''}
      ${row.temperature ? `<p>Temperature: ${row.temperature} °F</p>` : ''}
      ${row.humidity ? `<p>Humidity: ${row.humidity} %</p>` : ''}
      ${row.pressure ? `<p>Pressure: ${row.pressure} hPa</p>` : ''}
      ${metadata.location ? `<p>Location: ${metadata.location}</p>` : ''}
      ${metadata.status ? `<p>Status: ${metadata.status}</p>` : ''}
    `;

    // Gear icon click handler
    card.querySelector('.gear-icon').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.remove('hidden');
      document.getElementById('sensor-label').value = sensorLabel;
      document.getElementById('sensor-location').value = metadata.location;
      document.getElementById('sensor-status').value = metadata.status;
    });

    container.appendChild(card);
  });
}

// Modal close button
document.querySelector('.close-button').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('hidden');
});

// Kick off the fetch
fetchReadings();
