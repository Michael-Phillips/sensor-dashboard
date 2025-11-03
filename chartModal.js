// chartModal.js v1.1 - Added battery voltage to chart

export async function openChartModal(deviceId, deviceName, supabaseUrl, supabaseKey, metadata) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'chart-modal';
  Object.assign(modal.style, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: '2000'
  });

  const modalContent = document.createElement('div');
  modalContent.className = 'chart-modal-content';
  Object.assign(modalContent.style, {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '1200px',
    width: '95%',
    maxHeight: '90vh',
    overflow: 'auto'
  });

  // Header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';

  const title = document.createElement('h2');
  title.textContent = `${deviceName || `Device ${deviceId}`} - Timeline Chart`;
  title.style.margin = '0';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.border = 'none';
  closeBtn.style.background = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => modal.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  modalContent.appendChild(header);

  // Time range selector
  const controlsDiv = document.createElement('div');
  controlsDiv.style.marginBottom = '20px';
  controlsDiv.style.display = 'flex';
  controlsDiv.style.gap = '15px';
  controlsDiv.style.alignItems = 'center';
  controlsDiv.style.flexWrap = 'wrap';

  const rangeLabel = document.createElement('label');
  rangeLabel.textContent = 'Time Range:';
  rangeLabel.style.fontWeight = 'bold';

  const rangeSelect = document.createElement('select');
  rangeSelect.style.padding = '8px';
  rangeSelect.style.fontSize = '1rem';
  
  const ranges = [
    { value: '1', label: 'Last 24 Hours' },
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: '365', label: 'Last Year' }
  ];

  ranges.forEach(range => {
    const option = document.createElement('option');
    option.value = range.value;
    option.textContent = range.label;
    rangeSelect.appendChild(option);
  });

  const resetZoomBtn = document.createElement('button');
  resetZoomBtn.textContent = '🔄 Reset Zoom';
  resetZoomBtn.style.padding = '8px 16px';
  resetZoomBtn.style.cursor = 'pointer';

  controlsDiv.appendChild(rangeLabel);
  controlsDiv.appendChild(rangeSelect);
  controlsDiv.appendChild(resetZoomBtn);
  modalContent.appendChild(controlsDiv);

  // Chart container
  const chartContainer = document.createElement('div');
  chartContainer.style.position = 'relative';
  chartContainer.style.height = '500px';
  chartContainer.style.marginBottom = '20px';

  const canvas = document.createElement('canvas');
  canvas.id = `chart-${deviceId}`;
  chartContainer.appendChild(canvas);
  modalContent.appendChild(chartContainer);

  // Legend/Sensor toggles
  const legendDiv = document.createElement('div');
  legendDiv.style.display = 'flex';
  legendDiv.style.flexWrap = 'wrap';
  legendDiv.style.gap = '15px';
  legendDiv.style.marginTop = '20px';
  modalContent.appendChild(legendDiv);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Fetch data and create chart
  let chart = null;
  
  async function fetchDataAndRender(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    console.log(`📊 Fetching ${days} days of data for device ${deviceId}`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/readings?device_id=eq.${deviceId}&timestamp=gte.${startDate.toISOString()}&order=timestamp.asc&limit=10000`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          }
        }
      );

      const data = await response.json();
      console.log(`📊 Fetched ${data.length} readings`);

      if (data.length === 0) {
        chartContainer.innerHTML = '<p style="text-align:center;padding:50px;">No data available for this time range.</p>';
        return;
      }

      // Clear previous chart
      if (chart) {
        chart.destroy();
      }

      // Prepare datasets for each sensor
      const sensorKeys = Object.keys(data[0]).filter(k => k.startsWith('sensor_'));
      const datasets = [];
      const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
      ];

      legendDiv.innerHTML = ''; // Clear legend

      // Add battery voltage first if it exists
      if (data[0].battery !== undefined && data[0].battery !== null) {
        const batteryColor = '#FF6B35'; // Orange-red for battery
        
        const batteryDataset = {
          label: 'Battery Voltage (V)',
          data: data.map(row => ({
            x: new Date(row.timestamp),
            y: row.battery
          })),
          borderColor: batteryColor,
          backgroundColor: batteryColor + '40',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 5,
          tension: 0.1,
          hidden: false,
          yAxisID: 'y'
        };

        datasets.push(batteryDataset);

        // Create battery legend toggle
        const batteryLegendItem = document.createElement('label');
        batteryLegendItem.style.display = 'flex';
        batteryLegendItem.style.alignItems = 'center';
        batteryLegendItem.style.cursor = 'pointer';
        batteryLegendItem.style.padding = '8px 12px';
        batteryLegendItem.style.border = `2px solid ${batteryColor}`;
        batteryLegendItem.style.borderRadius = '6px';
        batteryLegendItem.style.backgroundColor = '#fff';

        const batteryCheckbox = document.createElement('input');
        batteryCheckbox.type = 'checkbox';
        batteryCheckbox.checked = true;
        batteryCheckbox.style.marginRight = '8px';
        batteryCheckbox.style.cursor = 'pointer';

        const batteryColorBox = document.createElement('span');
        batteryColorBox.style.width = '20px';
        batteryColorBox.style.height = '20px';
        batteryColorBox.style.backgroundColor = batteryColor;
        batteryColorBox.style.marginRight = '8px';
        batteryColorBox.style.borderRadius = '3px';

        const batteryIcon = document.createElement('span');
        batteryIcon.textContent = '🔋 ';
        
        const batteryLabelText = document.createElement('span');
        batteryLabelText.textContent = 'Battery Voltage (V)';
        batteryLabelText.style.fontWeight = 'bold';

        batteryCheckbox.addEventListener('change', () => {
          const datasetIndex = datasets.indexOf(batteryDataset);
          chart.setDatasetVisibility(datasetIndex, batteryCheckbox.checked);
          chart.update();
        });

        batteryLegendItem.appendChild(batteryCheckbox);
        batteryLegendItem.appendChild(batteryColorBox);
        batteryLegendItem.appendChild(batteryIcon);
        batteryLegendItem.appendChild(batteryLabelText);
        legendDiv.appendChild(batteryLegendItem);
      }

      // Add sensor datasets
      sensorKeys.forEach((key, index) => {
        const sensorIndex = key.replace('sensor_', '');
        const sensorConfig = metadata?.sensor_config?.[key] || metadata?.[key] || {};
        const sensorName = sensorConfig.function || `Sensor ${sensorIndex}`;
        const unit = sensorConfig.unit || '';
        const isBoolean = sensorConfig.is_boolean || false;

        // Skip boolean sensors for now (could add as step chart later)
        if (isBoolean) return;

        const color = colors[index % colors.length];

        // Create dataset
        const dataset = {
          label: `${sensorName}${unit ? ` (${unit})` : ''}`,
          data: data.map(row => ({
            x: new Date(row.timestamp),
            y: row[key]
          })),
          borderColor: color,
          backgroundColor: color + '40',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 5,
          tension: 0.1,
          hidden: false
        };

        datasets.push(dataset);

        // Create legend toggle
        const legendItem = document.createElement('label');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.cursor = 'pointer';
        legendItem.style.padding = '8px 12px';
        legendItem.style.border = `2px solid ${color}`;
        legendItem.style.borderRadius = '6px';
        legendItem.style.backgroundColor = '#fff';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.style.marginRight = '8px';
        checkbox.style.cursor = 'pointer';

        const colorBox = document.createElement('span');
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';
        colorBox.style.backgroundColor = color;
        colorBox.style.marginRight = '8px';
        colorBox.style.borderRadius = '3px';

        const labelText = document.createElement('span');
        labelText.textContent = dataset.label;
        labelText.style.fontWeight = 'bold';

        checkbox.addEventListener('change', () => {
          const datasetIndex = datasets.indexOf(dataset);
          chart.setDatasetVisibility(datasetIndex, checkbox.checked);
          chart.update();
        });

        legendItem.appendChild(checkbox);
        legendItem.appendChild(colorBox);
        legendItem.appendChild(labelText);
        legendDiv.appendChild(legendItem);
      });

      // Create chart with zoom/pan
      const ctx = canvas.getContext('2d');
      
      // Import Chart.js with zoom plugin (using CDN)
      if (!window.Chart) {
        await loadChartJS();
      }

      chart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(1);
                  }
                  return label;
                },
                title: function(context) {
                  const date = new Date(context[0].parsed.x);
                  return date.toLocaleString();
                }
              }
            },
            legend: {
              display: false // We have custom legend
            },
            zoom: {
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true
                },
                mode: 'x',
              },
              pan: {
                enabled: true,
                mode: 'x',
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'hour',
                displayFormats: {
                  hour: 'MMM d, HH:mm',
                  day: 'MMM d'
                }
              },
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Value'
              }
            }
          }
        }
      });

      resetZoomBtn.onclick = () => {
        chart.resetZoom();
      };

    } catch (error) {
      console.error('❌ Failed to fetch chart data:', error);
      chartContainer.innerHTML = '<p style="text-align:center;padding:50px;color:red;">Failed to load chart data.</p>';
    }
  }

  // Load initial data (24 hours)
  await fetchDataAndRender(1);

  // Range selector change
  rangeSelect.addEventListener('change', () => {
    fetchDataAndRender(rangeSelect.value);
  });
}

async function loadChartJS() {
  return new Promise((resolve, reject) => {
    // Load Chart.js
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script1.onload = () => {
      // Load chartjs-adapter-date-fns for time scale
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js';
      script2.onload = () => {
        // Load zoom plugin
        const script3 = document.createElement('script');
        script3.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js';
        script3.onload = resolve;
        script3.onerror = reject;
        document.head.appendChild(script3);
      };
      script2.onerror = reject;
      document.head.appendChild(script2);
    };
    script1.onerror = reject;
    document.head.appendChild(script1);
  });
}