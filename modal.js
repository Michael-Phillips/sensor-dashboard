export function getCardSettings(cardId, data) {
  const row = data.find(r => r.device_id === cardId);
  const metadata = typeof row?.metadata === 'string' ? JSON.parse(row.metadata) : row?.metadata || {};
  return metadata;
}

export function createGearModal(cardId, existingData, saveCardSettings, deleteCard) {
  const modal = document.getElementById('settingsModal');
console.log('Modal found:', modal);
  if (!modal) {
    console.warn('Modal element not found');
    return;
  }

  // Populate modal fields
  document.getElementById('modalDeviceId').textContent = cardId;
  document.getElementById('modalNameInput').value = existingData?.name || '';
  document.getElementById('modalNotesInput').value = existingData?.notes || '';

  // Show modal
  modal.style.display = 'block';
console.log('Modal display set to:', modal.style.display);
  // Save button handler
  const saveBtn = document.getElementById('saveModalBtn');
  saveBtn.onclick = () => {
    const updated = {
      name: document.getElementById('modalNameInput').value,
      notes: document.getElementById('modalNotesInput').value,
    };
    saveCardSettings(cardId, updated);
    closeModal();
  };

  // Delete button handler
  const deleteBtn = document.getElementById('deleteModalBtn');
  deleteBtn.onclick = () => {
    deleteCard(cardId);
    closeModal();
  };
}

// Optional: global closeModal function
export function closeModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Make closeModal globally accessible if needed in HTML
window.closeModal = closeModal;