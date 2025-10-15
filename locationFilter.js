const SHOW_ALL_VALUE = '__show_all__';

export function createLocationFilter(root, { onChange } = {}) {
  if (!root) {
    throw new Error('A valid root element is required to create the location filter.');
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'location-filter';

  const label = document.createElement('label');
  label.className = 'visually-hidden';
  label.id = 'locationFilterLabel';
  label.setAttribute('for', 'locationFilterSelect');
  label.textContent = 'Filter cards by location';

  const select = document.createElement('select');
  select.id = 'locationFilterSelect';
  select.name = 'locationFilter';
  select.className = 'location-filter__select';
  select.setAttribute('aria-labelledby', 'locationFilterLabel');

  const makeOption = (text, value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
  };

  const showAllOption = makeOption('Show All Locations', SHOW_ALL_VALUE);
  select.appendChild(showAllOption);

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  root.appendChild(wrapper);

  let currentValue = null;

  select.addEventListener('change', event => {
    const selected = event.target.value === SHOW_ALL_VALUE ? null : event.target.value;
    currentValue = selected;
    if (typeof onChange === 'function') {
      onChange(selected);
    }
  });

  function updateOptions(locations = [], preferredValue = null) {
    const normalizedPreferred = typeof preferredValue === 'string'
      ? preferredValue.toLowerCase()
      : null;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(makeOption('Show All Locations', SHOW_ALL_VALUE));

    locations.forEach(location => {
      fragment.appendChild(makeOption(location, location));
    });

    select.innerHTML = '';
    select.appendChild(fragment);

    const nextValue = locations.find(location =>
      normalizedPreferred && location.toLowerCase() === normalizedPreferred
    );

    currentValue = nextValue || null;
    select.value = currentValue || SHOW_ALL_VALUE;

    return currentValue;
  }

  function setValue(value = null) {
    currentValue = value;
    select.value = value || SHOW_ALL_VALUE;

    if (select.value !== (value || SHOW_ALL_VALUE)) {
      select.value = SHOW_ALL_VALUE;
      currentValue = null;
    }
  }

  return {
    element: wrapper,
    select,
    updateOptions,
    setValue,
    getValue: () => currentValue,
    SHOW_ALL_VALUE
  };
}

export { SHOW_ALL_VALUE };
