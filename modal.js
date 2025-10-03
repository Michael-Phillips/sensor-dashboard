import { BASE_PATH } from './main.js'; // Optional: if you centralize BASE_PATH
import { getRelativeTime } from './utils.js';

export function getCardSettings(cardId, data) {
  const match = data.find(row => row.device_id === cardId);
  return match ? match.metadata || {} : {};
}
export function createGearModal(cardId, existingData, saveCardSettings, deleteCard, availableImages = []) {
  console.log('🧪 createGearModal called for', cardId);

  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  modalContent.innerHTML = `
    <h2>Modal for ${cardId}</h2>
    <p>Description: ${existingData.description || 'N/A'}</p>
    <button id="closeModal">Close</button>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  document.getElementById('closeModal').onclick = () => {
    document.body.removeChild(modal);
  };
}

/*
export function createGearModal(cardId, existingData, saveCardSettings, deleteCard, availableImages = []) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.placeholder = 'Description';
  descInput.value = existingData.description || '';

  const locInput = document.createElement('input');
  locInput.type = 'text';
  locInput.placeholder = 'Location';
  locInput.value = existingData.location || '';

  const colorSelect = document.createElement('select');
  ['green', 'blue', 'orange', 'red'].forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    if (existingData.color === color) option.selected = true;
    colorSelect.appendChild(option);
  });

  const imagePreview = document.createElement('img');
  imagePreview.id = 'modalImagePreview';
  imagePreview.src = existingData.image
    ? existingData.image.startsWith('http') ? existingData.image : `${BASE_PATH}${existingData.image}`
    : `${BASE_PATH}images/default-plant.jpg`;
  imagePreview.className = 'modal-image-preview';

  // 🖼️ Thumbnail selector grid
  const thumbnailGrid = document.createElement('div');
  thumbnailGrid.className = 'thumbnail-grid';

  availableImages.forEach(filename => {
    const thumb = document.createElement('img');
    thumb.src = `${BASE_PATH}images/${filename}`;
    thumb.className = 'thumbnail';
    thumb.alt = filename;

    thumb.onclick = () => {
      imagePreview.src = thumb.src;
    };

    thumbnailGrid.appendChild(thumb);
  });

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => {
    const updated = {
      description: descInput.value.trim(),
      location: locInput.value.trim(),
      color: colorSelect.value,
      image: imagePreview.src.includes(BASE_PATH)
        ? imagePreview.src.replace(BASE_PATH, '')
        : imagePreview.src
    };
    saveCardSettings(cardId, updated);
    document.body.removeChild(modal);
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => {
    deleteCard(cardId);
    document.body.removeChild(modal);
  };

  const closeBtn = document.createElement('span');
  closeBtn.className = 'close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(descInput);
  modalContent.appendChild(locInput);
  modalContent.appendChild(colorSelect);
  modalContent.appendChild(imagePreview);
  modalContent.appendChild(thumbnailGrid);
  modalContent.appendChild(saveBtn);
  modalContent.appendChild(deleteBtn);

  modal.appendChild(modalContent);

  document.body.appendChild(modal);
}*/

// Optional: global closeModal function
export function closeModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Make closeModal globally accessible if needed in HTML
window.closeModal = closeModal;