/**
 * collision.js
 * AABB and sphere-based collision detection utilities.
 */

import * as THREE from 'three';

/**
 * Push a sphere out of an AABB box.
 * Returns a correction vector to add to spherePos, or null if no collision.
 */
export function sphereVsAABB(spherePos, sphereRadius, boxMin, boxMax) {
  // Closest point on AABB to sphere center
  const closest = new THREE.Vector3(
    Math.max(boxMin.x, Math.min(spherePos.x, boxMax.x)),
    Math.max(boxMin.y, Math.min(spherePos.y, boxMax.y)),
    Math.max(boxMin.z, Math.min(spherePos.z, boxMax.z))
  );

  const diff = new THREE.Vector3().subVectors(spherePos, closest);
  const dist = diff.length();

  if (dist < sphereRadius && dist > 0.0001) {
    const penetration = sphereRadius - dist;
    return diff.normalize().multiplyScalar(penetration);
  }
  return null;
}

/**
 * Simple 2D (XZ) circle overlap test.
 * Returns true if two circles overlap.
 */
export function circlesOverlapXZ(ax, az, ar, bx, bz, br) {
  const dx = ax - bx;
  const dz = az - bz;
  const dist2 = dx * dx + dz * dz;
  const radSum = ar + br;
  return dist2 < radSum * radSum;
}

/**
 * Distance in XZ plane only.
 */
export function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Clamp a Vector3 position within a square field.
 */
export function clampToField(pos, halfSize, radius) {
  pos.x = Math.max(-halfSize + radius, Math.min(halfSize - radius, pos.x));
  pos.z = Math.max(-halfSize + radius, Math.min(halfSize - radius, pos.z));
}
