// modalAlerts.js v1.3 - Moved battery alert after sensor rules

export function createAlertsTab(cardId, existingData, sensorData) {
  const alertsSection = document.createElement('div');
  alertsSection.className = 'tab-content';
  alertsSection.dataset.tab = 'alerts';
  alertsSection.style.flex = '1';
  alertsSection.style.display = 'none';
  alertsSection.style.overflowY = 'auto';
  alertsSection.style.maxHeight = '500px';

  const alertsTitle = document.createElement('h3');
  alertsTitle.textContent = 'Alert Configuration';
  alertsTitle.style.marginBottom = '15px';
  alertsSection.appendChild(alertsTitle);

  // Notification Contacts Section
  const contactsSection = document.createElement('div');
  contactsSection.style.marginBottom = '25px';
  contactsSection.style.padding = '15px';
  contactsSection.style.backgroundColor = 'rgba(0,0,0,0.05)';
  contactsSection.style.borderRadius = '8px';

  const contactsTitle = document.createElement('h4');
  contactsTitle.textContent = 'Notification Contacts';
  contactsTitle.style.marginBottom = '10px';
  contactsSection.appendChild(contactsTitle);

  // Email input
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email Address';
  emailLabel.style.display = 'block';
  emailLabel.style.marginBottom = '4px';
  emailLabel.style.fontWeight = 'bold';
  
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.placeholder = 'your@email.com';
  emailInput.value = existingData.alert_email || '';
  emailInput.style.width = '100%';
  emailInput.style.padding = '8px';
  emailInput.style.marginBottom = '12px';
  emailInput.style.boxSizing = 'border-box';

  contactsSection.appendChild(emailLabel);
  contactsSection.appendChild(emailInput);
  alertsSection.appendChild(contactsSection);

  // Sensor Alerts Section
  const sensorAlertsTitle = document.createElement('h4');
  sensorAlertsTitle.textContent = 'Sensor Alert Rules';
  sensorAlertsTitle.style.marginBottom = '10px';
  alertsSection.appendChild(sensorAlertsTitle);

  const alertRules = [];

  // Get number of sensors
  const currentRow = sensorData.find(r => String(r.device_id).trim() === String(cardId).trim());
  const numSensors = currentRow?.numsens || currentRow?.sensor_count || 1;
  const maxSensors = Math.min(numSensors, 5);

  // Create alert rules for each sensor
  for (let i = 1; i <= maxSensors; i++) {
    const key = `sensor_${i}`;
    const meta = existingData.sensor_config?.[key] || existingData[key] || {};
    const existingAlerts = existingData.alerts?.[key] || {};

    const sensorAlertBox = document.createElement('div');
    sensorAlertBox.style.marginBottom = '20px';
    sensorAlertBox.style.padding = '12px';
    sensorAlertBox.style.border = '1px solid #ddd';
    sensorAlertBox.style.borderRadius = '8px';
    sensorAlertBox.style.backgroundColor = '#fafafa';

    const sensorLabel = document.createElement('h5');
    sensorLabel.textContent = `Sensor ${i}: ${meta.function || 'Unnamed'}`;
    sensorLabel.style.marginBottom = '10px';
    sensorAlertBox.appendChild(sensorLabel);

    // Enable alerts checkbox
    const enableLabel = document.createElement('label');
    enableLabel.style.display = 'flex';
    enableLabel.style.alignItems = 'center';
    enableLabel.style.marginBottom = '10px';
    enableLabel.style.cursor = 'pointer';

    const enableCheck = document.createElement('input');
    enableCheck.type = 'checkbox';
    enableCheck.checked = existingAlerts.enabled || false;
    enableCheck.style.marginRight = '8px';
    enableCheck.style.cursor = 'pointer';

    const enableText = document.createElement('span');
    enableText.textContent = 'Enable alerts for this sensor';
    enableText.style.fontWeight = 'bold';

    enableLabel.appendChild(enableCheck);
    enableLabel.appendChild(enableText);
    sensorAlertBox.appendChild(enableLabel);

    // Alert configuration container
    const alertConfig = document.createElement('div');
    alertConfig.style.display = enableCheck.checked ? 'block' : 'none';
    alertConfig.style.marginTop = '10px';

    if (meta.is_boolean) {
      // Boolean sensor alert
      const boolAlertLabel = document.createElement('label');
      boolAlertLabel.textContent = 'Alert when:';
      boolAlertLabel.style.display = 'block';
      boolAlertLabel.style.marginBottom = '4px';

      const boolSelect = document.createElement('select');
      boolSelect.style.padding = '8px';
      boolSelect.style.width = '100%';
      boolSelect.style.marginBottom = '10px';

      const options = [
        { value: 'true', text: `Changes to ${meta.true_label || 'On'}` },
        { value: 'false', text: `Changes to ${meta.false_label || 'Off'}` },
        { value: 'any', text: 'Any state change' }
      ];

      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        if (existingAlerts.condition === opt.value) option.selected = true;
        boolSelect.appendChild(option);
      });

      alertConfig.appendChild(boolAlertLabel);
      alertConfig.appendChild(boolSelect);

      alertRules.push({
        key,
        enabled: enableCheck,
        type: 'boolean',
        condition: boolSelect
      });

    } else {
      // Numeric sensor alert
      const alertTypeLabel = document.createElement('label');
      alertTypeLabel.textContent = 'Alert type:';
      alertTypeLabel.style.display = 'block';
      alertTypeLabel.style.marginBottom = '4px';

      const alertTypeSelect = document.createElement('select');
      alertTypeSelect.style.padding = '8px';
      alertTypeSelect.style.width = '100%';
      alertTypeSelect.style.marginBottom = '10px';

      ['threshold', 'range'].forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type === 'threshold' ? 'Min/Max Threshold' : 'Outside Range';
        if (existingAlerts.type === type) opt.selected = true;
        alertTypeSelect.appendChild(opt);
      });

      // Threshold inputs
      const thresholdDiv = document.createElement('div');
      thresholdDiv.style.display = 'grid';
      thresholdDiv.style.gridTemplateColumns = '1fr 1fr';
      thresholdDiv.style.gap = '10px';

      const minDiv = document.createElement('div');
      const minLabel = document.createElement('label');
      minLabel.textContent = 'Minimum:';
      minLabel.style.display = 'block';
      minLabel.style.marginBottom = '4px';
      minLabel.style.fontSize = '0.9rem';
      const minInput = document.createElement('input');
      minInput.type = 'number';
      minInput.step = '0.1';
      minInput.placeholder = 'Min value';
      minInput.value = existingAlerts.min || '';
      minInput.style.width = '100%';
      minInput.style.padding = '8px';
      minInput.style.boxSizing = 'border-box';
      minDiv.appendChild(minLabel);
      minDiv.appendChild(minInput);

      const maxDiv = document.createElement('div');
      const maxLabel = document.createElement('label');
      maxLabel.textContent = 'Maximum:';
      maxLabel.style.display = 'block';
      maxLabel.style.marginBottom = '4px';
      maxLabel.style.fontSize = '0.9rem';
      const maxInput = document.createElement('input');
      maxInput.type = 'number';
      maxInput.step = '0.1';
      maxInput.placeholder = 'Max value';
      maxInput.value = existingAlerts.max || '';
      maxInput.style.width = '100%';
      maxInput.style.padding = '8px';
      maxInput.style.boxSizing = 'border-box';
      maxDiv.appendChild(maxLabel);
      maxDiv.appendChild(maxInput);

      thresholdDiv.appendChild(minDiv);
      thresholdDiv.appendChild(maxDiv);

      alertConfig.appendChild(alertTypeLabel);
      alertConfig.appendChild(alertTypeSelect);
      alertConfig.appendChild(thresholdDiv);

      alertRules.push({
        key,
        enabled: enableCheck,
        type: 'numeric',
        alertType: alertTypeSelect,
        min: minInput,
        max: maxInput
      });
    }

    // Frequency selector
    const freqLabel = document.createElement('label');
    freqLabel.textContent = 'Alert frequency:';
    freqLabel.style.display = 'block';
    freqLabel.style.marginTop = '10px';
    freqLabel.style.marginBottom = '4px';
    freqLabel.style.fontSize = '0.9rem';

    const freqSelect = document.createElement('select');
    freqSelect.style.padding = '8px';
    freqSelect.style.width = '100%';

    ['immediate', 'hourly', 'daily'].forEach(freq => {
      const opt = document.createElement('option');
      opt.value = freq;
      opt.textContent = freq.charAt(0).toUpperCase() + freq.slice(1);
      if (existingAlerts.frequency === freq) opt.selected = true;
      freqSelect.appendChild(opt);
    });

    alertConfig.appendChild(freqLabel);
    alertConfig.appendChild(freqSelect);

    // Store frequency reference
    alertRules[alertRules.length - 1].frequency = freqSelect;

    // Toggle visibility on enable/disable
    enableCheck.addEventListener('change', () => {
      alertConfig.style.display = enableCheck.checked ? 'block' : 'none';
    });

    sensorAlertBox.appendChild(alertConfig);
    alertsSection.appendChild(sensorAlertBox);
  }

  // Battery Alert Section (after sensor alerts)
  const batteryAlertSection = document.createElement('div');
  batteryAlertSection.style.marginTop = '25px';
  batteryAlertSection.style.padding = '15px';
  batteryAlertSection.style.backgroundColor = 'rgba(255, 200, 100, 0.1)';
  batteryAlertSection.style.border = '2px solid rgba(255, 150, 0, 0.3)';
  batteryAlertSection.style.borderRadius = '8px';

  const batteryAlertTitle = document.createElement('h4');
  batteryAlertTitle.textContent = '🔋 Battery Voltage Alert';
  batteryAlertTitle.style.marginBottom = '10px';
  batteryAlertSection.appendChild(batteryAlertTitle);

  // Enable battery alert checkbox
  const batteryEnableLabel = document.createElement('label');
  batteryEnableLabel.style.display = 'flex';
  batteryEnableLabel.style.alignItems = 'center';
  batteryEnableLabel.style.marginBottom = '10px';
  batteryEnableLabel.style.cursor = 'pointer';

  const batteryEnableCheck = document.createElement('input');
  batteryEnableCheck.type = 'checkbox';
  batteryEnableCheck.checked = existingData.battery_alert?.enabled ?? true; // Default enabled
  batteryEnableCheck.style.marginRight = '8px';
  batteryEnableCheck.style.cursor = 'pointer';

  const batteryEnableText = document.createElement('span');
  batteryEnableText.textContent = 'Enable low battery alerts';
  batteryEnableText.style.fontWeight = 'bold';

  batteryEnableLabel.appendChild(batteryEnableCheck);
  batteryEnableLabel.appendChild(batteryEnableText);
  batteryAlertSection.appendChild(batteryEnableLabel);

  // Battery threshold input
  const batteryThresholdLabel = document.createElement('label');
  batteryThresholdLabel.textContent = 'Alert when voltage drops below:';
  batteryThresholdLabel.style.display = 'block';
  batteryThresholdLabel.style.marginBottom = '8px';
  batteryThresholdLabel.style.fontSize = '0.95rem';

  const batteryThresholdContainer = document.createElement('div');
  batteryThresholdContainer.style.display = 'flex';
  batteryThresholdContainer.style.alignItems = 'center';
  batteryThresholdContainer.style.gap = '10px';

  const batteryThresholdInput = document.createElement('input');
  batteryThresholdInput.type = 'number';
  batteryThresholdInput.step = '0.1';
  batteryThresholdInput.min = '0';
  batteryThresholdInput.max = '5';
  batteryThresholdInput.value = existingData.battery_alert?.threshold ?? 3.2; // Default 3.2V
  batteryThresholdInput.style.width = '100px';
  batteryThresholdInput.style.padding = '8px';
  batteryThresholdInput.style.fontSize = '1rem';

  const batteryUnit = document.createElement('span');
  batteryUnit.textContent = 'Volts';
  batteryUnit.style.fontWeight = 'bold';

  batteryThresholdContainer.appendChild(batteryThresholdInput);
  batteryThresholdContainer.appendChild(batteryUnit);

  batteryAlertSection.appendChild(batteryThresholdLabel);
  batteryAlertSection.appendChild(batteryThresholdContainer);
  alertsSection.appendChild(batteryAlertSection);

  return { 
    alertsSection, 
    emailInput,
    alertRules,
    batteryAlert: {
      enabled: batteryEnableCheck,
      threshold: batteryThresholdInput
    }
  };
}