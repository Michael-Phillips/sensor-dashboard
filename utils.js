export function getLatestPerDevice(data) {
  const seen = new Set();
  const latest = [];
  data.forEach(row => {
    const id = String(row.device_id).trim();
    if (!seen.has(id)) {
      seen.add(id);
      latest.push(row);
    }
  });
  return latest;
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

export async function saveCardSettings(cardId, updatedMetadata) {
  console.log('💾 Saving metadata for', cardId, updatedMetadata);

  const { data, error } = await supabase
    .from(table)
    .update({ metadata: updatedMetadata })
    .eq('device_id', String(cardId).trim());

  if (error) {
    console.error('❌ Supabase update failed:', error);
  } else {
    console.log('✅ Supabase update succeeded:', data);
  }
}

