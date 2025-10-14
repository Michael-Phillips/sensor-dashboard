// Right column: image preview
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
modalContent.appendChild(formSection);
modalContent.appendChild(imageSection);
modal.appendChild(modalContent);
document.body.appendChild(modal);

// 🖼️ Image picker overlay
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