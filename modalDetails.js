// modalDetails.js

async function fetchLatestBattery(deviceId) {
  const { data, error } = await supabase
    .from('readings')
    .select('battery')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Battery fetch error:', error);
    return null;
  }

  return data?.[0]?.battery ?? null;
}

export function createDetailsTab(cardId, existingData, sensorData) {
  const detailsSection = document.createElement('div');
  detailsSection.className = 'tab-content';
  detailsSection.dataset.tab = 'details';
  detailsSection.style.flex = '1';
  detailsSection.style.display = 'none';

  const deviceIdInfo = document.createElement('p');
  deviceIdInfo.textContent = `Device ID: ${cardId}`;
  deviceIdInfo.style.marginBottom = '20px';
  deviceIdInfo.style.fontWeight = 'bold';
  detailsSection.appendChild(deviceIdInfo);

  // Get number of sensors from the data
  const currentRow = sensorData.find(r => String(r.device_id).trim() === String(cardId).trim());
  const numSensors = currentRow?.numsens || currentRow?.sensor_count || 1;
  const maxSensors = Math.min(numSensors, 5);

  // Create sensor details table
  const sensorTableTitle = document.createElement('h3');
  sensorTableTitle.textContent = 'Sensor Configuration';
  sensorTableTitle.style.marginBottom = '10px';
  detailsSection.appendChild(sensorTableTitle);

  const sensorTable = document.createElement('div');
  sensorTable.style.display = 'grid';
  sensorTable.style.gridTemplateColumns = '60px 140px 90px 80px 80px';
  sensorTable.style.gap = '8px';
  sensorTable.style.marginBottom = '20px';

  // Headers
  const headers = ['Sensor', 'Function', 'Units', 'Boolean', 'Labels'];
  headers.forEach(headerText => {
    const header = document.createElement('div');
    header.textContent = headerText;
    header.style.fontWeight = 'bold';
    header.style.padding = '8px';
    header.style.backgroundColor = 'rgba(0,0,0,0.1)';
    header.style.borderRadius = '4px';
    header.style.textAlign = 'center';
    header.style.fontSize = '0.9rem';
    sensorTable.appendChild(header);
  });

  // Store input fields for saving later
  const sensorInputs = [];

  // Create rows for each sensor
  for (let i = 1; i <= maxSensors; i++) {
    const sensorKey = `sensor_${i}`;
    const sensorMeta = existingData.sensor_config?.[sensorKey] || existingData[sensorKey] || {};

    // Sensor label
    const sensorLabel = document.createElement('div');
    sensorLabel.textContent = `Sensor ${i}`;
    sensorLabel.style.padding = '8px';
    sensorLabel.style.textAlign = 'center';
    sensorLabel.style.fontWeight = 'bold';
    sensorTable.appendChild(sensorLabel);

    // Function input
    const functionInput = document.createElement('input');
    functionInput.type = 'text';
    functionInput.placeholder = 'e.g., Temperature, CO2';
    functionInput.value = sensorMeta.function || sensorMeta.type || '';
    functionInput.style.padding = '8px';
    functionInput.style.width = '100%';
    functionInput.style.boxSizing = 'border-box';
    sensorTable.appendChild(functionInput);

    // Units input
    const unitsInput = document.createElement('input');
    unitsInput.type = 'text';
    unitsInput.placeholder = 'e.g., °F, %, ppm';
    unitsInput.value = sensorMeta.unit || '';
    unitsInput.style.padding = '8px';
    unitsInput.style.width = '100%';
    unitsInput.style.boxSizing = 'border-box';
    sensorTable.appendChild(unitsInput);

    sensorInputs.push({
      key: sensorKey,
      functionInput,
      unitsInput
    });
  }

  detailsSection.appendChild(sensorTable);

  // Battery voltage section
  const batterySection = document.createElement('div');
  batterySection.style.marginTop = '20px';
  batterySection.style.padding = '15px';
  batterySection.style.backgroundColor = 'rgba(0,0,0,0.05)';
  batterySection.style.borderRadius = '8px';

  const batteryLabel = document.createElement('label');
  batteryLabel.textContent = 'Battery Voltage';
  batteryLabel.style.display = 'block';
  batteryLabel.style.marginBottom = '8px';
  batteryLabel.style.fontWeight = 'bold';

  const batteryValueContainer = document.createElement('div');
  batteryValueContainer.style.display = 'flex';
  batteryValueContainer.style.alignItems = 'center';

  const batteryValue = document.createElement('span');
  batteryValue.textContent = '—';
  batteryValue.style.padding = '8px';
  batteryValue.style.fontSize = '1rem';
  batteryValue.style.backgroundColor = 'rgba(0,0,0,0.05)';
  batteryValue.style.border = '1px solid rgba(0,0,0,0.2)';
  batteryValue.style.borderRadius = '4px';
  batteryValue.style.display = 'inline-block';
  batteryValue.style.minWidth = '80px';
  batteryValue.style.textAlign = 'center';

  const batteryUnit = document.createElement('span');
  batteryUnit.textContent = ' V';
  batteryUnit.style.marginLeft = '5px';
  batteryUnit.style.fontWeight = 'bold';

  batteryValueContainer.appendChild(batteryValue);
  batteryValueContainer.appendChild(batteryUnit);

  batterySection.appendChild(batteryLabel);
  batterySection.appendChild(batteryValueContainer);
  detailsSection.appendChild(batterySection);

  // Fetch and display battery voltage
  fetchLatestBattery(cardId).then(voltage => {
    if (voltage !== null) {
      batteryValue.textContent = voltage.toFixed(2);
    } else {
      batteryValue.textContent = '—';
    }
  });

  const sensorCountInfo = document.createElement('p');
  sensorCountInfo.textContent = `Total sensors: ${numSensors}`;
  sensorCountInfo.style.color = '#666';
  sensorCountInfo.style.fontSize = '0.9rem';
  sensorCountInfo.style.marginTop = '15px';
  detailsSection.appendChild(sensorCountInfo);

  return { detailsSection, sensorInputs };
}