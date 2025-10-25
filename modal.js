// modal.js v1.1
import { saveCardSettings } from './utils.js';
import { createTabs } from './modalTabs.js';
import { createSettingsTab } from './modalSettings.js';
import { createDetailsTab } from './modalDetails.js';
import { createAlertsTab } from './modalAlerts.js';
import { openImagePicker } from './imagePicker.js';

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
    padding: '0',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '90%',
    overflow: 'hidden'
  });

  // Create tabs
  const { tabContainer, tabButtons } = createTabs();
  modalContent.appendChild(tabContainer);

  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.style.display = 'flex';
  contentWrapper.style.gap = '20px';
  contentWrapper.style.padding = '20px';

  // Create tab contents
  const { settingsSection, descInput, locInput, colorSelect } = createSettingsTab(existingData);
  const { detailsSection, sensorInputs } = createDetailsTab(cardId, existingData, sensorData);
  const { alertsSection, emailInput, alertRules } = createAlertsTab(cardId, existingData, sensorData);

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
    openImagePicker(availableImages, imagePreview, BASE_PATH);
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

  // Button Row
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
      image: finalImage,
      alert_email: emailInput.value.trim()
    };

    // Add sensor configuration from Details tab
    sensorInputs.forEach(({ key, functionInput, unitsInput, booleanCheckbox, trueLabel, falseLabel }) => {
      updatedMetadata[key] = {
        function: functionInput.value.trim(),
        type: functionInput.value.trim(),
        unit: unitsInput.value.trim(),
        is_boolean: booleanCheckbox.checked,
        true_label: booleanCheckbox.checked ? trueLabel.value.trim() : null,
        false_label: booleanCheckbox.checked ? falseLabel.value.trim() : null
      };
    });

    // Add alert configuration from Alerts tab
    updatedMetadata.alerts = {};
    alertRules.forEach(rule => {
      if (rule.type === 'boolean') {
        updatedMetadata.alerts[rule.key] = {
          enabled: rule.enabled.checked,
          type: 'boolean',
          condition: rule.condition.value,
          frequency: rule.frequency.value
        };
      } else {
        updatedMetadata.alerts[rule.key] = {
          enabled: rule.enabled.checked,
          type: rule.alertType.value,
          min: parseFloat(rule.min.value) || null,
          max: parseFloat(rule.max.value) || null,
          frequency: rule.frequency.value
        };
      }
    });

    try {
      const result = await saveCardSettings(cardId, updatedMetadata);

      if (result?.error) {
        alert('❌ Failed to save settings. Please try again.');
        console.error('❌ Supabase update failed:', result.error);
        return;
      }

      console.log('✅ Supabase saved row:', result.data);
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
}

export function closeModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.remove();
  }
}

window.closeModal = closeModal;