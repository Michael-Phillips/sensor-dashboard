import { saveCardSettings } from './utils.js';

const BASE_PATH = window.BASE_PATH;

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
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '90%'
  });

  // Title
  const title = document.createElement('h2');
  title.textContent = `Sensor ${cardId} Settings`;
  modalContent.appendChild(title);

  // 🔹 Create Tabs
  const tabContainer = document.createElement('div');
  tabContainer.className = 'modal-tabs';
  Object.assign(tabContainer.style, {
    display: 'flex',
    borderBottom: '2px solid #e0e0e0',
    marginBottom: '20px'
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
      background: 'none',
      border: 'none',
      borderBottom: index === 0 ? '3px solid #007bff' : '3px solid transparent',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      color: index === 0 ? '#007bff' : '#666',
      transition: 'all 0.3s ease'
    });

    tabBtn.addEventListener('mouseenter', () => {
      if (!tabBtn.classList.contains('active')) {
        tabBtn.style.color = '#333';
        tabBtn.style.backgroundColor = '#f5f5f5';
      }
    });

    tabBtn.addEventListener('mouseleave', () => {
      if (!tabBtn.classList.contains('active')) {
        tabBtn.style.color = '#666';
        tabBtn.style.backgroundColor = 'transparent';
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

  // Settings Tab Content
  const settingsSection = document.createElement('div');
  settingsSection.className = 'tab-content active';
  settingsSection.dataset.tab = 'settings';
  settingsSection.style.flex = '1';
  settingsSection.style.display = 'block';

  const createLabeledInput = (parent, labelText, value = '') => {
    const label = document.createElement('label');
    label.textContent = labelText;
    Object.assign(label.style, { display: 'block', marginBottom: '4px' });

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

  const sensorInfo = document.createElement('p');
  sensorInfo.textContent = `Sensors: ${existingData.sensor_count || 1}`;
  detailsSection.appendChild(sensorInfo);

  const deviceIdInfo = document.createElement('p');
  deviceIdInfo.textContent = `Device ID: ${cardId}`;
  detailsSection.appendChild(deviceIdInfo);

  // Add more details here as needed
  const detailsPlaceholder = document.createElement('p');
  detailsPlaceholder.textContent = 'Additional sensor details will appear here.';
  detailsPlaceholder.style.color = '#666';
  detailsPlaceholder.style.fontStyle = 'italic';
  detailsSection.appendChild(detailsPlaceholder);

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
        b.style.color = '#666';
        b.style.borderBottomColor = 'transparent';
      });
      
      // Hide all content sections
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Activate clicked tab
      btn.classList.add('active');
      btn.style.color = '#007bff';
      btn.style.borderBottomColor = '#007bff';
      
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