// Minimal realistic mock sensor data — import this where you load sensors.
export default [
  {
    device_id: "sensor-01",
    label: "Office Temp Sensor",
    timestamp: "2025-10-14T09:12:00Z",
    metadata: {
      description: "Office Temp Sensor",
      location: "2nd Floor - Office",
      color: "#CBE66E",
      image: "images/thermometer-64.png"
    },
    image_url: "",
    sensor_temperature_c: 22.4,
    sensor_humidity_pct: 42,
    sensor_pressure_hpa: 1012.3,
    sensor_battery_pct: 86
  },
  {
    device_id: "sensor-02",
    label: "Warehouse Multi-Sensor",
    timestamp: "2025-10-14T09:05:20Z",
    metadata: {
      description: "Warehouse Multi-Sensor",
      location: "Warehouse A",
      color: "#97D1E6",
      image: "images/multi-64.png"
    },
    image_url: "",
    sensor_temperature_c: 18.7,
    sensor_humidity_pct: 55,
    sensor_pressure_hpa: 1009.8,
    sensor_battery_pct: 72
  },
  {
    device_id: "sensor-03",
    label: "Outdoor Weather Pod",
    timestamp: "2025-10-14T08:58:10Z",
    metadata: {
      description: "Outdoor Weather Pod",
      location: "Roof",
      color: "#A1CBCD",
      image: "images/weather-64.png"
    },
    image_url: "",
    sensor_temperature_c: 15.2,
    sensor_humidity_pct: 71,
    sensor_pressure_hpa: 1007.4,
    sensor_battery_pct: 94
  },
  {
    device_id: "sensor-04",
    label: "Fridge Monitor",
    timestamp: "2025-10-14T09:11:44Z",
    metadata: {
      description: "Fridge Monitor",
      location: "Lab Fridge",
      color: "#F2F187",
      image: "images/fridge-64.png"
    },
    image_url: "",
    sensor_temperature_c: 4.1,
    sensor_humidity_pct: 35,
    sensor_pressure_hpa: 1013.9,
    sensor_battery_pct: 58
  }
];
