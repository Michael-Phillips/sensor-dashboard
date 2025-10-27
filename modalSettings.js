// modalSettings.js v1.1

const COLOR_OPTIONS = [
  { label: 'Green', token: 'green', fallback: '#CBE66E' },
  { label: 'Yellow', token: 'yellow', fallback: '#F2F187' },
  { label: 'Aqua', token: 'aqua', fallback: '#A1CBCD' },
  { label: 'Blue', token: 'blue', fallback: '#97D1E6' },
  { label: 'Red', token: 'red', fallback: '#F3797A' },
  { label: 'Orange', token: 'orange', fallback: '#F8C274' },
  { label: 'Purple', token: 'purple', fallback: '#B185BA' },
  { label: 'Gray', token: 'gray', fallback: '#B7B7B7' }
];

const HEX_TO_TOKEN = COLOR_OPTIONS.reduce((acc, option) => {
  acc[option.fallback.toLowerCase()] = option.token;
  return acc;
}, {});

export function resolveColorToken(colorValue) {
  if (!colorValue) {
    return null;
  }

  const trimmed = String(colorValue).trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  const directMatch = COLOR_OPTIONS.find(option => option.token === normalized);
  if (directMatch) {
    return directMatch.token;
  }

  return HEX_TO_TOKEN[normalized] || null;
}

export function createSettingsTab(existingData = {}) {
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
  const existingColorToken = resolveColorToken(existingData.color);
  const customColor = !existingColorToken && existingData.color ? String(existingData.color).trim() : '';

  COLOR_OPTIONS.forEach(({ label, token }) => {
    const option = document.createElement('option');
    option.value = token;
    option.textContent = label;
    option.style.backgroundColor = `var(--card-color-${token})`;
    colorSelect.appendChild(option);
  });

  if (customColor) {
    const customOption = document.createElement('option');
    customOption.value = customColor;
    customOption.textContent = 'Custom';
    customOption.selected = true;
    colorSelect.appendChild(customOption);
  }

  const selectedValue = existingColorToken || customColor || COLOR_OPTIONS[0].token;
  colorSelect.value = selectedValue;

  colorSelect.style.marginBottom = '16px';
  settingsSection.appendChild(colorLabel);
  settingsSection.appendChild(colorSelect);

  return { settingsSection, descInput, locInput, colorSelect };
}

export { COLOR_OPTIONS };
