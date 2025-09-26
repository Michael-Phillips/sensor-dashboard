const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc';
const table = 'readings';

async function fetchReadings() {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  renderCards(data);
}

function renderCards(data) {
  const container = document.getElementById('cardContainer');
  container.innerHTML = '';

  data.forEach(row => {
    const imageUrl = row.metadata?.image_url || '/images/default-plant.jpg';
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${imageUrl}" alt="Plant Image">
      <h3>${row.metadata?.description || 'Unnamed'}</h3>
      <p>Location: ${row.metadata?.location || 'Unknown'}</p>
      <p>Status: ${row.metadata?.status || 'Unknown'}</p>
      <p>Battery: ${row.battery} V</p>
      <p>RSSI: ${row.RSSI} dBm</p>
      <p>Updated: ${formatTimestamp(row.timestamp)}</p>
      ${renderSensors(row)}
      <div class="gear-icon" onclick="openSettings('${row.device_id}')">
        <i class="fas fa-cog"></i>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderSensors(row) {
  let html = '';
  for (let i = 1; i <= row.numsens; i++) {
    const value = row[`sensor_${i}`];
    const meta = row.metadata?.[`sensor_${i}`];
    if (value !== null && meta) {
      html += `<p>${meta.type}: ${value} ${meta.unit}</p>`;
    }
  }
  return html;
}

function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString();
}

function openSettings(deviceId) {
  alert(`Settings for device ${deviceId} coming soon!`);
}

fetchReadings();
