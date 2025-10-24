// imagePicker.js v1.0

export function openImagePicker(availableImages, imagePreview, BASE_PATH) {
  // Create backdrop overlay
  const backdrop = document.createElement('div');
  backdrop.className = 'image-picker-backdrop';
  Object.assign(backdrop.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: '1099',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });

  const pickerContainer = document.createElement('div');
  pickerContainer.style.position = 'relative';
  pickerContainer.style.maxWidth = '90%';
  pickerContainer.style.maxHeight = '90vh';

  const picker = document.createElement('div');
  picker.className = 'image-picker';
  Object.assign(picker.style, {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 100px)',
    gap: '10px',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative'
  });

  // Add cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '✕';
  cancelBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  cancelBtn.onmouseover = () => cancelBtn.style.background = '#cc0000';
  cancelBtn.onmouseout = () => cancelBtn.style.background = '#ff4444';
  cancelBtn.onclick = () => document.body.removeChild(backdrop);

  picker.appendChild(cancelBtn);

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
      document.body.removeChild(backdrop);
    };

    picker.appendChild(thumb);
  });

  pickerContainer.appendChild(picker);
  backdrop.appendChild(pickerContainer);
  
  // Close when clicking outside the picker
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      document.body.removeChild(backdrop);
    }
  };

  // Prevent clicks inside picker from closing
  picker.onclick = (e) => {
    e.stopPropagation();
  };

  document.body.appendChild(backdrop);
}