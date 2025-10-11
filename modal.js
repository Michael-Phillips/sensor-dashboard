import { BASE_PATH } from './main.js'; // Optional: if you centralize BASE_PATH
import { getRelativeTime } from './utils.js';

export function getCardSettings(cardId, data) {
  const match = data.find(row => row.device_id === cardId);
  return match ? match.metadata || {} : {};
}

export function createGearModal(cardId, existingData, saveCardSettings, deleteCard, availableImages = []) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'settingsModal';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.style.zIndex = '1000';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.style.background = '#fff';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.display = 'flex';
  modalContent.style.gap = '20px';
  modalContent.style.maxWidth = '800px';
  modalContent.style.width = '90%';

  // Left column
  const formSection = document.createElement('div');
  formSection.style.flex = '1';

  const title = document.createElement('h2');
  title.textContent = `Sensor ${cardId} Settings`;
  formSection.appendChild(title);

  const descLabel = document.createElement('label');
  descLabel.textContent = 'Description';
  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.value = existingData.description || '';
descLabel.style.display = 'block';
descLabel.style.marginBottom = '4px';
descInput.style.marginBottom = '16px';

  formSection.appendChild(descLabel);
  formSection.appendChild(descInput);

  const locLabel = document.createElement('label');
  locLabel.textContent = 'Location';
  const locInput = document.createElement('input');
  locInput.type = 'text';
  locInput.value = existingData.location || '';
  formSection.appendChild(locLabel);
  formSection.appendChild(locInput);

  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color';
  const colorSelect = document.createElement('select');
  ['Green', 'Yellow','Aqua','Blue','Red', 'orange','Orange','Purple','Gray'].forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    if (existingData.color === color) option.selected = true;
    colorSelect.appendChild(option);
  });
  formSection.appendChild(colorLabel);
  formSection.appendChild(colorSelect);

  // Failure to Report Time
  const failureLabel = document.createElement('label');
  failureLabel.textContent = 'Failure to Report Time';
  const failureContainer = document.createElement('div');
  ['Days', 'Hours', 'Minutes'].forEach(unit => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = unit;
    input.style.width = '60px';
    failureContainer.appendChild(input);
  });
  formSection.appendChild(failureLabel);
  formSection.appendChild(failureContainer);


  // Sensor count only (optional)
  const sensorInfo = document.createElement('p');
  sensorInfo.textContent = `Sensors: ${existingData.sensor_count || 1}`;
  formSection.appendChild(sensorInfo);

  // Buttons
  const buttonRow = document.createElement('div');
  buttonRow.style.marginTop = '20px';
  ['Done', 'Cancel', 'Delete'].forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.marginRight = '10px';
    btn.onclick = () => {
      if (label === 'Done') {
        const updated = {
          description: descInput.value.trim(),
          location: locInput.value.trim(),
          color: colorSelect.value,
          image: imagePreview.src.includes(BASE_PATH)
            ? imagePreview.src.replace(BASE_PATH, '')
            : imagePreview.src
        };
        saveCardSettings(cardId, updated);
      } else if (label === 'Delete') {
        deleteCard(cardId);
      }
      document.body.removeChild(modal);
    };
    buttonRow.appendChild(btn);
  });
  formSection.appendChild(buttonRow);

  // Right column: image preview
  const imageSection = document.createElement('div');
  imageSection.style.flex = '0 0 150px';

  const imagePreview = document.createElement('img');
  imagePreview.src = existingData.image
    ? existingData.image.startsWith('http') ? existingData.image : `${BASE_PATH}${existingData.image}`
    : `${BASE_PATH}images/default-plant.jpg`;
  imagePreview.style.width = '100%';
  imagePreview.style.borderRadius = '8px';
  imageSection.appendChild(imagePreview);

  modalContent.appendChild(formSection);
  modalContent.appendChild(imageSection);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}



// Optional: global closeModal function
export function closeModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    document.body.removeChild(modal);
  }
}

// Make closeModal globally accessible if needed in HTML
window.closeModal = closeModal;