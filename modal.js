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
  modal.id = 'settingsModal';
  console.log('📦 Modal element created');

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  console.log('📦 Modal content created');

  modalContent.innerHTML = `<h2>Modal for ${cardId}</h2>`;
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
  modalContent.appendChild(descInput);
  modalContent.appendChild(locInput);
  modalContent.appendChild(colorSelect);

/*******************************************/
const closeModalBtn = document.createElement('button');
closeModalBtn.id = 'closeModal';
closeModalBtn.textContent = 'Close';
closeModalBtn.onclick = () => {
  console.log('❌ Modal closed');
  document.body.removeChild(modal);
};
modalContent.appendChild(closeModalBtn); // ✅ This was missing!

/*******************************************/

  const imagePreview = document.createElement('img');

  imagePreview.src = existingData.image
    ? existingData.image.startsWith('http') ? existingData.image : `${BASE_PATH}${existingData.image}`
    : `${BASE_PATH}images/default-plant.jpg`;
  imagePreview.className = 'modal-image-preview';

  const thumbnailGrid = document.createElement('div');
  thumbnailGrid.className = 'thumbnail-grid';

  availableImages.forEach(filename => {
    const thumb = document.createElement('img');
    thumb.src = `${BASE_PATH}images/${filename}`;
    thumb.className = 'thumbnail';
    thumb.alt = filename;

    thumb.onclick = () => {
      imagePreview.src = thumb.src;
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
      thumb.classList.add('selected');
    };

    thumbnailGrid.appendChild(thumb);
  });

  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  modal.style.display = 'flex'; // ✅ overrides the default 'none'
  console.log('✅ Modal appended to body');

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