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
