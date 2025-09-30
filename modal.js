// modal.js

export function getCardSettings(cardId, sensorData) {
  const row = sensorData.find(r => r.device_id === cardId);
  return row ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {}) : {};
}

export function saveCardSettings(cardId, updated, sensorData, renderCards, container) {
  const row = sensorData.find(r => r.device_id === cardId);
  if (row) {
    row.metadata = { ...row.metadata, ...updated };
    renderCards(sensorData, container, saveCardSettingsWrapper, deleteCardWrapper);
  }
}

export function deleteCard(cardId, sensorData, renderCards, container) {
  const index = sensorData.findIndex(r => r.device_id === cardId);
  if (index !== -1) {
    sensorData.splice(index, 1);
    renderCards(sensorData, container, saveCardSettingsWrapper, deleteCardWrapper);
  }
}

export function createGearModal(cardId, existingData, saveFn, deleteFn) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="gear-modal">
      <h2>Edit Sensor Settings</h2>

      <label>Description:
        <input type="text" id="desc-input" value="${existingData.description || ''}">
      </label><br>

      <label>Location:
        <input type="text" id="loc-input" value="${existingData.location || ''}">
      </label><br>

      <label>Color Tag:
        <select id="color-select">
          ${['green','yellow','aqua','blue','red','orange','purple','gray']
            .map(color => `<option value="${color}" ${existingData.color === color ? 'selected' : ''}>${color}</option>`)
            .join('')}
        </select>
      </label><br>

      <label>Image:
        <div id="image-panel" class="image-panel"></div>
        <div class="drop-zone">
          <p>Drag & drop an image here or click to upload</p>
          <input type="file" id="image-upload" accept="image/*">
        </div>
      </label>

      <div class="modal-actions">
        <button id="done-btn">Done</button>
        <button id="cancel-btn">Cancel</button>
        <button id="delete-btn">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setupModalLogic(modal, cardId, saveFn, deleteFn);
}

function setupModalLogic(modal, cardId, saveFn, deleteFn) {
  const doneBtn = modal.querySelector('#done-btn');
  const cancelBtn = modal.querySelector('#cancel-btn');
  const deleteBtn = modal.querySelector('#delete-btn');
  const imagePanel = modal.querySelector('#image-panel');
  const imageUpload = modal.querySelector('#image-upload');

  const imageNames = ['temp.png', 'humidity.png', 'light.png'];
  imageNames.forEach(name => {
    const img = document.createElement('img');
    img.src = `https://Michael-Phillips.github.io/sensor-dashboard/images/${name}`;
    img.alt = name;
    img.className = 'thumbnail';
    img.onclick = () => {
      imagePanel.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      modal.dataset.selectedImage = img.src;
    };
    imagePanel.appendChild(img);
  });

  imageUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        modal.dataset.selectedImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  doneBtn.onclick = () => {
    const updated = {
      description: modal.querySelector('#desc-input').value,
      location: modal.querySelector('#loc-input').value,
      color: modal.querySelector('#color-select').value,
      image: modal.dataset.selectedImage || null
    };
    saveFn(cardId, updated);
    modal.remove();
  };

  cancelBtn.onclick = () => modal.remove();

  deleteBtn.onclick = () => {
    if (confirm('Are you sure you want to delete this card and its associated data?')) {
      deleteFn(cardId);
      modal.remove();
    }
  };
}

// Optional: wrappers for use in renderCards.js
export function saveCardSettingsWrapper(cardId, updated) {
  saveCardSettings(cardId, updated, window.sensorData, window.renderCards, window.container);
}

export function deleteCardWrapper(cardId) {
  deleteCard(cardId, window.sensorData, window.renderCards, window.container);
}
