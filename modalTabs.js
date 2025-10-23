// modalTabs.js

export function createTabs() {
  const tabContainer = document.createElement('div');
  tabContainer.className = 'modal-tabs';
  Object.assign(tabContainer.style, {
    display: 'flex',
    borderBottom: '2px solid #333',
    marginBottom: '0',
    marginTop: '0',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px'
  });

  const tabs = ['Settings', 'Details', 'Alerts'];
  const tabButtons = [];

  tabs.forEach((tabName, index) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'tab-btn' + (index === 0 ? ' active' : '');
    tabBtn.textContent = tabName;
    tabBtn.dataset.tab = tabName.toLowerCase();
    Object.assign(tabBtn.style, {
      flex: '1',
      padding: '12px 20px',
      background: index === 0 ? 'rgba(255,255,255,0.5)' : 'transparent',
      border: 'none',
      borderBottom: index === 0 ? '3px solid #000' : '3px solid transparent',
      cursor: 'pointer',
      fontSize: '1.1rem',
      fontWeight: index === 0 ? 'bold' : '500',
      color: index === 0 ? '#000' : '#333',
      transition: 'all 0.3s ease'
    });

    tabBtn.addEventListener('mouseenter', () => {
      if (!tabBtn.classList.contains('active')) {
        tabBtn.style.backgroundColor = 'rgba(255,255,255,0.3)';
        tabBtn.style.fontWeight = 'bold';
      }
    });

    tabBtn.addEventListener('mouseleave', () => {
      if (!tabBtn.classList.contains('active')) {
        tabBtn.style.backgroundColor = 'transparent';
        tabBtn.style.fontWeight = '500';
      }
    });

    tabContainer.appendChild(tabBtn);
    tabButtons.push(tabBtn);
  });

  return { tabContainer, tabButtons };
}