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
  return match ? match.metadata || {} : {};
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
  const payload = {
    device_id: String(cardId).trim(),
    ...updatedMetadata,
    meta_type: updatedMetadata.meta_type || 'door' // fallback if missing
  };

  console.log('🧪 Supabase insert payload:', payload);

  const { data, error } = await supabaseClient
    .from('device_metadata')
    .upsert(payload, { onConflict: 'device_id' }) // 👈 Explicit conflict target
    .select();

  if (error) {
    console.error('❌ Supabase metadata save failed:', error);
    return { error };
  }

  console.log('✅ Saved metadata:', data);
  return { error: null, data }; // 👈 Return the saved row here
}






