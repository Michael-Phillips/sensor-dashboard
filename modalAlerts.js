// modalAlerts.js v1.0

export function createAlertsTab() {
  const alertsSection = document.createElement('div');
  alertsSection.className = 'tab-content';
  alertsSection.dataset.tab = 'alerts';
  alertsSection.style.flex = '1';
  alertsSection.style.display = 'none';

  const failureLabel = document.createElement('label');
  failureLabel.textContent = 'Failure to Report Time';
  Object.assign(failureLabel.style, { display: 'block', marginBottom: '4px' });

  const failureContainer = document.createElement('div');
  failureContainer.style.display = 'flex';
  failureContainer.style.gap = '10px';
  
  ['Days', 'Hours', 'Minutes'].forEach(unit => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = unit;
    input.style.width = '80px';
    input.style.padding = '8px';
    failureContainer.appendChild(input);
  });

  alertsSection.appendChild(failureLabel);
  alertsSection.appendChild(failureContainer);

  const alertsPlaceholder = document.createElement('p');
  alertsPlaceholder.textContent = 'Configure alert thresholds and notification settings here.';
  alertsPlaceholder.style.color = '#666';
  alertsPlaceholder.style.fontStyle = 'italic';
  alertsPlaceholder.style.marginTop = '20px';
  alertsSection.appendChild(alertsPlaceholder);

  return alertsSection;
}