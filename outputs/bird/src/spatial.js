// Shared spatial math. The simulation does not depend on Three.js or the DOM.
export const AXES = ['x', 'y', 'z'];
export const distance = (a, b) => Math.hypot(...AXES.map(axis => (a[axis] ?? 0) - (b[axis] ?? 0)));

export function flightVector(yaw, pitch, forward, strafe, vertical) {
  const direction = {
    x: Math.sin(yaw) * Math.cos(pitch) * forward + Math.cos(yaw) * strafe,
    y: Math.sin(pitch) * forward + vertical,
    z: -Math.cos(yaw) * Math.cos(pitch) * forward + Math.sin(yaw) * strafe,
  };
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
  for (const axis of AXES) direction[axis] /= length;
  return direction;
}

export function spherePoint(random, radius) {
  const azimuth = random() * Math.PI * 2;
  const y = random() * 2 - 1;
  const horizontal = Math.sqrt(1 - y * y);
  return {x: Math.cos(azimuth) * horizontal * radius, y: y * radius, z: Math.sin(azimuth) * horizontal * radius};
}

// Swept hook collision prevents missing a small item between simulation frames.
export function segmentDistance(point, start, end) {
  const delta = AXES.map(axis => (end[axis] ?? 0) - (start[axis] ?? 0));
  const lengthSquared = delta.reduce((sum, value) => sum + value * value, 0);
  const t = lengthSquared ? Math.max(0, Math.min(1, AXES.reduce((sum, axis, i) => sum + ((point[axis] ?? 0) - (start[axis] ?? 0)) * delta[i], 0) / lengthSquared)) : 0;
  return Math.hypot(...AXES.map((axis, i) => (point[axis] ?? 0) - ((start[axis] ?? 0) + delta[i] * t)));
}

