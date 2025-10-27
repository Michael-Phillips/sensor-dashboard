export function getLatestPerDevice(data) {
  const latestMap = new Map();

  data.forEach(row => {
    const id = String(row.device_id).trim();
    const existing = latestMap.get(id);

    const currentTime = new Date(row.timestamp || row.created_at);
    const existingTime = existing ? new Date(existing.timestamp || existing.created_at) : null;

    if (!existing || currentTime > existingTime) {
      latestMap.set(id, row);
    }
  });

  return Array.from(latestMap.values());
}

export function getCardSettings(cardId, sensorData) {
  const match = sensorData.find(row => String(row.device_id).trim() === String(cardId).trim());
  if (!match) return {};
  
  // Merge sensor_config into metadata for easy access
  const metadata = match.metadata || {};
  if (metadata.sensor_config) {
    return { ...metadata, ...metadata.sensor_config };
  }
  return metadata;
}

export function getRelativeTime(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay < 7) return `${diffDay} days ago`;

  return then.toLocaleDateString();
}

export async function saveCardSettings(
  cardId,
  updatedMetadata,
  supabaseClient = window.supabase
) {
  // Separate sensor configs from basic metadata
  const sensorConfig = {};
  const basicMetadata = {
    device_id: String(cardId).trim(),
    description: updatedMetadata.description,
    location: updatedMetadata.location,
    color: updatedMetadata.color,
    image: updatedMetadata.image
  };

  // Extract sensor_N configs into sensor_config JSONB column
  Object.keys(updatedMetadata).forEach(key => {
    if (key.startsWith('sensor_')) {
      sensorConfig[key] = updatedMetadata[key];
    }
  });

  // Add sensor_config to payload if we have any
  if (Object.keys(sensorConfig).length > 0) {
    basicMetadata.sensor_config = sensorConfig;
  }

  console.log('🧪 Supabase insert payload:', basicMetadata);

  const { data, error } = await supabaseClient
    .from('device_metadata')
    .upsert(basicMetadata, { onConflict: 'device_id' })
    .select();

  if (error) {
    console.error('❌ Supabase metadata save failed:', error);
    return { error };
  }

  console.log('✅ Saved metadata:', data);
  return { error: null, data };
}