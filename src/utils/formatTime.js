/**
 * Formats seconds into HH:MM:SS or MM:SS string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Formats remaining seconds with a leading minus sign.
 * @param {number} current - Current time in seconds
 * @param {number} duration - Total duration in seconds
 * @returns {string}
 */
export function formatRemainingTime(current, duration) {
  const remaining = Math.max(0, (duration || 0) - (current || 0));
  return `-${formatTime(remaining)}`;
}
