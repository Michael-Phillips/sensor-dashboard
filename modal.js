import { saveCardSettings } from './utils.js';

const BASE_PATH = window.BASE_PATH;

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

export function createGearModal(
  cardId,
  existingData,
  updateLocalCardSettings,
  deleteCard,
  supabase,
  availableImages = [],
  sensorData = []
) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'settingsModal';
  Object.assign(modal.style, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: '1000'
  });

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  Object.assign(modalContent.style, {
    backgroundColor: existingData.color || '#fff',
    padding: '0',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '90%',
    overflow: 'hidden'
  });

  // 🔹 Create Tabs (at the very top)
  const tabContainer = document.createElement('div');
  tabContainer.className = 'modal-tabs';
  Object.assign(tabContainer.style, {
    display: 'flex',
    borderBottom: '2px solid #333',
    marginBottom: '0',
    marginTop: '0',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px'
  });

  const tabs = ['Settings', 'Details', 'Alerts'];
  const tabButtons = [];

  tabs.forEach((tabName, index) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'tab-btn' + (index === 0 ? ' active' : '');
    tabBtn.textContent = tabName;
    tabBtn.dataset.tab = tabName.toLowerCase();
    Object.assign(tabBtn.style, {
      flex: '1',
      padding: '12px 20px',
      background: index === 0 ? 'rgba(255,255,255,0.5)' : 'transparent',
      border: 'none',
      borderBottom: index === 0 ? '3px solid #000' : '3px solid transparent',
      cursor: 'pointer',
      fontSize: '1.1rem',
      fontWeight: index === 0 ? 'bold' : '500',
      color: index === 0 ? '#000' : '#333',
      transition: 'all 0.3s ease'
    });

    tabBtn.addEventListener('mouseenter', () => {
      if (!tabBtn.classList.contains('active')) {
        tabBtn.style.backgroundColor = 'rgba(255,255,255,0.3)';
        tabBtn.style.fontWeight = 'bold';
      }
    });

    tabBtn.addEventListener('mouseleave', () => {
      if (!tabBtn.classList.contains('active')) {
        tabBtn.style.backgroundColor = 'transparent';
        tabBtn.style.fontWeight = '500';
      }
    });

    tabContainer.appendChild(tabBtn);
    tabButtons.push(tabBtn);
  });

  modalContent.appendChild(tabContainer);

  // 🔹 Create Content Sections
  const contentWrapper = document.createElement('div');
  contentWrapper.style.display = 'flex';
  contentWrapper.style.gap = '20px';
  contentWrapper.style.padding = '20px';

  // Settings Tab Content
  const settingsSection = document.createElement('div');
  settingsSection.className = 'tab-content active';
  settingsSection.dataset.tab = 'settings';
  settingsSection.style.flex = '1';
  settingsSection.style.display = 'block';

  const createLabeledInput = (parent, labelText, value = '') => {
    const label = document.createElement('label');
    label.textContent = labelText;
    Object.assign(label.style, { display: 'block', marginBottom: '4px', fontWeight: 'bold' });

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.style.marginBottom = '16px';

    parent.appendChild(label);
    parent.appendChild(input);
    return input;
  };

  const descInput = createLabeledInput(settingsSection, 'Description', existingData.description || '');
  const locInput = createLabeledInput(settingsSection, 'Location', existingData.location || '');

  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color';
  Object.assign(colorLabel.style, { display: 'block', marginBottom: '4px' });

  const colorSelect = document.createElement('select');
  const colorOptions = {
    Green: '#CBE66E',
    Yellow: '#F2F187',
    Aqua: '#A1CBCD',
    Blue: '#97D1E6',
    Red: '#F3797A',
    Orange: '#F8C274',
    Purple: '#B185BA',
    Gray: '#B7B7B7'
  };

  Object.entries(colorOptions).forEach(([name, hex]) => {
    const option = document.createElement('option');
    option.value = hex;
    option.textContent = name;
    if (existingData.color === hex) option.selected = true;
    colorSelect.appendChild(option);
  });

  colorSelect.style.marginBottom = '16px';
  settingsSection.appendChild(colorLabel);
  settingsSection.appendChild(colorSelect);

  // Details Tab Content
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
  const maxSensors = Math.min(numSensors, 5); // Cap at 5

  // Create sensor details table
  const sensorTableTitle = document.createElement('h3');
  sensorTableTitle.textContent = 'Sensor Configuration';
  sensorTableTitle.style.marginBottom = '10px';
  detailsSection.appendChild(sensorTableTitle);

  const sensorTable = document.createElement('div');
  sensorTable.style.display = 'grid';
  sensorTable.style.gridTemplateColumns = '80px 180px 120px';
  sensorTable.style.gap = '8px';
  sensorTable.style.marginBottom = '20px';

  // Headers
  const headers = ['Sensor', 'Function', 'Units'];
  headers.forEach(headerText => {
    const header = document.createElement('div');
    header.textContent = headerText;
    header.style.fontWeight = 'bold';
    header.style.padding = '8px';
    header.style.backgroundColor = 'rgba(0,0,0,0.1)';
    header.style.borderRadius = '4px';
    header.style.textAlign = 'center';
    sensorTable.appendChild(header);
  });

  // Store input fields for saving later
  const sensorInputs = [];

  // Create rows for each sensor
  for (let i = 1; i <= maxSensors; i++) {
    const sensorKey = `sensor_${i}`;
    // Read from sensor_config or fallback to top-level (for backward compatibility)
    const sensorMeta = existingData.sensor_config?.[sensorKey] || existingData[sensorKey] || {};

    // Sensor label (wider column)
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

  const batteryValue = document.createElement('span');
  batteryValue.textContent = '—'; // default placeholder
  batteryValue.style.padding = '8px';
  batteryValue.style.fontSize = '1rem';
  batteryValue.style.backgroundColor = '#fff';
  batteryValue.style.border = '1px solid #ccc';
  batteryValue.style.borderRadius = '4px';
  batteryValue.style.display = 'inline-block';
  batteryValue.style.minWidth = '80px';
  batteryValue.style.textAlign = 'center';

  const batteryUnit = document.createElement('span');
  batteryUnit.textContent = ' V';
  batteryUnit.style.marginLeft = '5px';
  batteryUnit.style.fontWeight = 'bold';

  batterySection.appendChild(batteryLabel);
  batterySection.appendChild(batteryValue);
  batterySection.appendChild(batteryUnit);
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

  // Alerts Tab Content
  const alertsSection = document.createElement('div');
  alertsSection.className = 'tab-content';
  alertsSection.dataset.tab = 'alerts';
  alertsSection.style.flex = '1';
  alertsSection.style.display = 'none';

  const failureLabel = document.createElement('label');
  failureLabel.textContent = 'Failure to Report Time';
  Object.assign(failureLabel.style, { display: 'block', marginBottom: '4px' });

  const failureContainer = document.createElement('div');
  failureContainer.style.display = 'flex';
  failureContainer.style.gap = '10px';
  
  ['Days', 'Hours', 'Minutes'].forEach(unit => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = unit;
    input.style.width = '80px';
    input.style.padding = '8px';
    failureContainer.appendChild(input);
  });

  alertsSection.appendChild(failureLabel);
  alertsSection.appendChild(failureContainer);

  // Add more alert settings here
  const alertsPlaceholder = document.createElement('p');
  alertsPlaceholder.textContent = 'Configure alert thresholds and notification settings here.';
  alertsPlaceholder.style.color = '#666';
  alertsPlaceholder.style.fontStyle = 'italic';
  alertsPlaceholder.style.marginTop = '20px';
  alertsSection.appendChild(alertsPlaceholder);

  // Image Section (shows on all tabs)
  const imageSection = document.createElement('div');
  imageSection.style.flex = '0 0 150px';

  const imagePreview = document.createElement('img');
  imagePreview.src = existingData.image
    ? existingData.image.startsWith('http')
      ? existingData.image
      : `${BASE_PATH}${existingData.image}`
    : `${BASE_PATH}images/default-plant.jpg`;

  Object.assign(imagePreview.style, {
    width: '100%',
    borderRadius: '8px',
    cursor: 'pointer'
  });

  imagePreview.onclick = () => {
    openImagePicker();
  };

  imageSection.appendChild(imagePreview);

  // Add sections to wrapper
  contentWrapper.appendChild(settingsSection);
  contentWrapper.appendChild(detailsSection);
  contentWrapper.appendChild(alertsSection);
  contentWrapper.appendChild(imageSection);
  modalContent.appendChild(contentWrapper);

  // Tab Click Handlers
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.style.color = '#333';
        b.style.borderBottomColor = 'transparent';
        b.style.backgroundColor = 'transparent';
        b.style.fontWeight = '500';
      });
      
      // Hide all content sections
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Activate clicked tab
      btn.classList.add('active');
      btn.style.color = '#000';
      btn.style.borderBottomColor = '#000';
      btn.style.backgroundColor = 'rgba(255,255,255,0.5)';
      btn.style.fontWeight = 'bold';
      
      // Show corresponding content
      const tabName = btn.dataset.tab;
      const targetSection = document.querySelector(`.tab-content[data-tab="${tabName}"]`);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
    });
  });

  // Button Row (at bottom, below tabs)
  const buttonRow = document.createElement('div');
  buttonRow.style.marginTop = '20px';
  buttonRow.style.display = 'flex';
  buttonRow.style.gap = '10px';
  buttonRow.style.padding = '0 20px 20px 20px';

  const btnDone = document.createElement('button');
  btnDone.textContent = 'Done';
  btnDone.onclick = async () => {
    if (!Array.isArray(sensorData)) {
      console.error('⛔ sensorData is undefined or not an array');
      return;
    }

    const currentRow = sensorData.find(r => String(r.device_id).trim() === String(cardId).trim());
    const fallbackMetadata = currentRow?.metadata || {};
    const imageSrc = imagePreview.src?.trim();
    const imagePath = imageSrc?.includes(BASE_PATH) ? imageSrc.replace(BASE_PATH, '') : imageSrc;
    const finalImage = imagePath || fallbackMetadata.image || 'default-plant.jpg';

    const updatedMetadata = {
      description: descInput.value.trim(),
      location: locInput.value.trim(),
      color: colorSelect.value,
      image: finalImage
    };

    // Add sensor configuration from Details tab
    sensorInputs.forEach(({ key, functionInput, unitsInput }) => {
      updatedMetadata[key] = {
        function: functionInput.value.trim(),
        type: functionInput.value.trim(), // Keep 'type' for backward compatibility
        unit: unitsInput.value.trim()
      };
    });

    try {
      const result = await saveCardSettings(cardId, updatedMetadata);

      if (result?.error) {
        alert('❌ Failed to save settings. Please try again.');
        console.error('❌ Supabase update failed:', result.error);
        return;
      }

      console.log('✅ Supabase saved row:', result.data);
      const confirmedRow = result.data?.[0] || updatedMetadata;
      updateLocalCardSettings(cardId, updatedMetadata);
      modal.remove();
    } catch (err) {
      console.error('❌ Unexpected error during save:', err.message || err);
    }
  };

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancel';
  btnCancel.onclick = () => {
    modal.remove();
  };

  const btnDelete = document.createElement('button');
  btnDelete.textContent = 'Delete';
  btnDelete.onclick = async () => {
    const confirmDelete = confirm(`Are you sure you want to delete all data for device ${cardId}?`);
    if (!confirmDelete) return;

    try {
      const { data, error } = await supabase
        .from(window.tableName)
        .delete()
        .eq('device_id', String(cardId).trim())
        .select();

      if (error) {
        console.error('❌ Supabase delete error:', error);
        alert('Failed to delete device data.');
        return;
      }

      console.log(`🗑️ Deleted ${data?.length || 0} rows for device_id ${cardId}`);
      deleteCard(cardId);
      modal.remove();
    } catch (err) {
      console.error('❌ Unexpected error during delete:', err);
      alert('Unexpected error while deleting.');
    }
  };

  buttonRow.appendChild(btnDone);
  buttonRow.appendChild(btnCancel);
  buttonRow.appendChild(btnDelete);
  modalContent.appendChild(buttonRow);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  function openImagePicker() {
    const picker = document.createElement('div');
    picker.className = 'image-picker';
    Object.assign(picker.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
      zIndex: '1100',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, 100px)',
      gap: '10px',
      maxHeight: '80vh',
      overflowY: 'auto'
    });

    availableImages.forEach(img => {
      const thumb = document.createElement('img');
      thumb.src = `${BASE_PATH}images/${img}`;
      Object.assign(thumb.style, {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '6px',
        cursor: 'pointer',
        border: imagePreview.src.includes(img) ? '2px solid #333' : 'none'
      });

      thumb.onclick = () => {
        imagePreview.src = thumb.src;
        document.body.removeChild(picker);
      };

      picker.appendChild(thumb);
    });

    document.body.appendChild(picker);
  }
}

export function closeModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.remove();
  }
}

window.closeModal = closeModal;