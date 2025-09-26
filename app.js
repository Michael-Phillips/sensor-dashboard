// Supabase config
const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co';
//const supabaseUrl = 'https://qvlluhoxehdpssdebzyi.supabase.co/rest/v1/readings';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bGx1aG94ZWhkcHNzZGVienlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDMwOTQsImV4cCI6MjA3NDQxOTA5NH0.4sJas3fvz_2z5iPY6yqL8W2X0NgZYjKUxxGNJX-JAMc';
const table = 'readings';

// ✅ DOM container
const container = document.getElementById('cardContainer');

// ✅ Fetch data from Supabase
async function fetchReadings() {
  console.log("Fetching from Supabase...");
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  const data = await response.json();
  console.log("Data received:", data);
  renderCards(data);
}

// ✅ Render cards from data
function renderCards(data) {
  container.innerHTML = ''; // Clear existing cards

  if (!data || data.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'card';
    msg.innerHTML = `<h3>No data found</h3><p>Check Supabase table or API key</p>`;
    container.appendChild(msg);
    return;
  }

  data.forEach(reading => {
    const card = document.createElement('div');
    card.className = 'card';

    const imageUrl = reading.image_url || 'images/default-plant.jpg';
    const timestamp = new Date(reading.timestamp).toLocaleString();

    card.innerHTML = `
      <img src="${imageUrl}" alt="Sensor image">
      <div class="gear-icon"><i class="fas fa-cog"></i></div>
      <h3>${reading.sensor_name || 'Unnamed Sensor'}</h3>
      <p>Value: ${reading.value}</p>
      <p>Time: ${timestamp}</p>
    `;

    container.appendChild(card);
  });
}

// ✅ Confirm JS is loading
console.log("JS loaded");

// ✅ Add test card to confirm rendering
const testCard = document.createElement('div');
testCard.className = 'card';
testCard.innerHTML = `
  <h3>Test Card</h3>
  <p>This confirms rendering works</p>
`;
container.appendChild(testCard);

// ✅ Fetch live data
fetchReadings();
