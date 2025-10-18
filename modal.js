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
    display: 'flex',
    gap: '20px',
    maxWidth: '800px',
    width: '90%'
  });

  const formSection = document.createElement('div');
  formSection.style.flex = '1';

  const title = document.createElement('h2');
  title.textContent = `Sensor ${cardId} Settings`;
  formSection.appendChild(title);

  const createLabeledInput = (labelText, value = '') => {
    const label = document.createElement('label');
    label.textContent = labelText;
    Object.assign(label.style, { display: 'block', marginBottom: '4px' });

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.style.marginBottom = '16px';

    formSection.appendChild(label);
    formSection.appendChild(input);
    return input;
  };

  const descInput = createLabeledInput('Description', existingData.description || '');
  const locInput = createLabeledInput('Location', existingData.location || '');

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
  formSection.appendChild(colorLabel);
  formSection.appendChild(colorSelect);

  const failureLabel = document.createElement('label');
  failureLabel.textContent = 'Failure to Report Time';
  Object.assign(failureLabel.style, { display: 'block', marginBottom: '4px' });

  const failureContainer = document.createElement('div');
  ['Days', 'Hours', 'Minutes'].forEach(unit => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = unit;
    input.style.width = '60px';
    failureContainer.appendChild(input);
  });

  failureLabel.style.marginBottom = '16px';
  formSection.appendChild(failureLabel);
  formSection.appendChild(failureContainer);

  const sensorInfo = document.createElement('p');
  sensorInfo.textContent = `Sensors: ${existingData.sensor_count || 1}`;
  formSection.appendChild(sensorInfo);

  const buttonRow = document.createElement('div');
  buttonRow.style.marginTop = '20px';

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

  const btnDone = document.createElement('button');
  btnDone.textContent = 'Done';
  btnDone.style.marginRight = '10px';
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
    const result = await saveCardSettings(cardId, updatedMetadata, supabase, window.tableName);

    if (result?.error) {
      alert('❌ Failed to save settings. Please try again.');
      console.error('❌ Supabase update failed:', result.error);
      return;
    }

    updateLocalCardSettings(cardId, updatedMetadata);
    modal.remove();
  } catch (err) {
    console.error('❌ Unexpected error during save:', err.message || err);
  }
  };

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancel';
  btnCancel.style.marginRight = '10px';
  btnCancel.onclick = () => {
    modal.remove();
  };

  const btnDelete = document.createElement('button');
  btnDelete.textContent = 'Delete';
  btnDelete.style.marginRight = '10px';
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
  formSection.appendChild(buttonRow);

  modalContent.appendChild(formSection);
  modalContent.appendChild(imageSection);
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
