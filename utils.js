export function getLatestPerDevice(data) {
  const latestMap = new Map();

  data.forEach(row => {
    const id = String(row.device_id).trim();
    const existing = latestMap.get(id);

    if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
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

export async function saveCardSettings(cardId, updatedMetadata, supabaseClient = window.supabase, tableName = window.tableName) {
  console.log('💾 Saving metadata for', cardId, updatedMetadata);

  const { error } = await supabaseClient
    .from(tableName)
    .update({ metadata: updatedMetadata })
    .eq('device_id', String(cardId).trim());

  if (error) {
    console.error('❌ Supabase update failed:', error);
    return { error };
  }

  return { error: null };
}


