export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];

/**
 * @param {number} speed
 * @returns {number}
 */
export function snapSpeed(speed) {
  const clamped = Math.max(0.25, Math.min(4, speed));
  return SPEEDS.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  );
}

/**
 * @param {number} speed
 * @returns {string}
 */
export function formatSpeedBadge(speed) {
  const str = Number.isInteger(speed) ? String(speed) : speed.toFixed(2).replace(/\.?0+$/, '');
  return `${str}x`;
}
