// modalSettings.js v1.0

export function createSettingsTab(existingData) {
  const settingsSection = document.createElement('div');
  settingsSection.className = 'tab-content active';
  settingsSection.dataset.tab = 'settings';
  settingsSection.style.flex = '1';
  settingsSection.style.display = 'block';

  const createLabeledInput = (parent, labelText, value = '') => {
    const label = document.createElement('label');
    label.textContent = labelText;
    Object.assign(label.style, { display: 'block', marginBottom: '4px', fontWeight: 'bold' });

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.style.marginBottom = '16px';

    parent.appendChild(label);
    parent.appendChild(input);
    return input;
  };

  const descInput = createLabeledInput(settingsSection, 'Description', existingData.description || '');
  const locInput = createLabeledInput(settingsSection, 'Location', existingData.location || '');

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
  settingsSection.appendChild(colorLabel);
  settingsSection.appendChild(colorSelect);

  return { settingsSection, descInput, locInput, colorSelect };
}