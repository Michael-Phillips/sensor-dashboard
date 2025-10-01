export function createGearModal(cardId, existingData, saveCardSettings, deleteCard) {
  console.log('Gear clicked for', cardId);

  const modal = document.getElementById('settingsModal');
  if (!modal) return console.warn('Modal not found');

  // Populate fields
  document.getElementById('modalDeviceId').textContent = cardId;

  const descInput = document.getElementById('modalDescriptionInput');
  const locInput = document.getElementById('modalLocationInput');
  const colorSelect = document.getElementById('modalColorSelect');
  const imagePreview = document.getElementById('modalImagePreview');

  if (descInput) descInput.value = existingData?.description || '';
  if (locInput) locInput.value = existingData?.location || '';
  if (colorSelect) colorSelect.value = existingData?.color || 'green';
  if (imagePreview) imagePreview.src = existingData?.image || 'images/default-plant.jpg';

  // Show modal
  modal.style.display = 'block';

  // Save handler
  const saveBtn = document.getElementById('saveModalBtn');
  if (saveBtn) {
    saveBtn.onclick = () => {
      const updated = {
        description: descInput?.value || '',
        location: locInput?.value || '',
        color: colorSelect?.value || 'green',
        image: imagePreview?.src || 'images/default-plant.jpg'
      };
      saveCardSettings(cardId, updated);
      closeModal();
    };
  }

  // Delete handler
  const deleteBtn = document.getElementById('deleteModalBtn');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      deleteCard(cardId);
      closeModal();
    };
  }

  async function fetchImageList() {
  const { data, error } = await supabase.storage
    .from('your-bucket-name')
    .list('images', { limit: 100 });

  if (error) {
    console.error('Error fetching image list:', error);
    return [];
  }

  return data.map(file =>
    supabase.storage
      .from('your-bucket-name')
      .getPublicUrl(`images/${file.name}`).data.publicUrl
  );
}

  // Image selector
  const changeImageBtn = document.getElementById('changeImageBtn');
  changeImageBtn.onclick = async () => {
    const imageUrls = await fetchImageList();
    showImageSelector(imageUrls, imagePreview);
  };

  //if (changeImageBtn) {
  //  changeImageBtn.onclick = () => {
  //    showImageSelector(cardId, imagePreview);
  //  };
  //}
}

export function getCardSettings(cardId, data) {
  const row = data.find(r => r.device_id === cardId);
  return row?.metadata || {};
}

export function closeModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'none';
}

// Optional: inline image selector
//function showImageSelector(cardId, previewElement) {
//  const imageOptions = [
//    'images/blank.png',
//    'images/fuchsia.png',
//    'images/garage_door.png',
//    'images/default-plant.jpg'
//    'images/kleenex.jpg'
//  ];

// Optional: inline image selector
  function showImageSelector(imageUrls, previewElement) {
  //const selector = document.createElement('div');
  selector.className = 'image-selector';
  selector.style.position = 'fixed';
  selector.style.top = '50%';
  selector.style.left = '50%';
  selector.style.transform = 'translate(-50%, -50%)';
  selector.style.background = '#fff';
  selector.style.padding = '10px';
  selector.style.border = '1px solid #ccc';
  selector.style.zIndex = '10000';
  selector.style.maxHeight = '80vh';
  selector.style.overflowY = 'auto';

  selector.innerHTML = imageUrls.map(url => {
    return `<img src="${url}" data-src="${url}" style="width:60px; margin:4px; cursor:pointer; border:1px solid gray;">`;
  }).join('');
  
  document.body.appendChild(selector);

  selector.querySelectorAll('img').forEach(img => {
    img.onclick = () => {
      previewElement.src = img.dataset.src;
      selector.remove();
    };
  });
}

}