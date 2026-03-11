/**
 * camera.js
 * Third-person camera controller. Orbits around the player scat.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.azimuth = 0;           // horizontal orbit angle (radians)
    this.elevation = 0.4;       // vertical angle (radians), positive = looking down
    this.distance = CONFIG.CAMERA_DISTANCE;

    this.minElevation = 0.17;   // ~10 degrees
    this.maxElevation = 1.4;    // ~80 degrees
    this.minDistance = 4;
    this.maxDistance = 20;

    this.sensitivity = 0.002;
    this.scrollSensitivity = 0.05;

    // Smoothed position target
    this._targetPos = new THREE.Vector3();
    this._currentPos = new THREE.Vector3();
  }

  /**
   * Update camera based on player position and input deltas.
   * @param {THREE.Vector3} playerPos
   * @param {number} mouseDX - mouse X delta (pixels)
   * @param {number} mouseDY - mouse Y delta (pixels)
   * @param {number} scrollDelta
   */
  update(playerPos, mouseDX, mouseDY, scrollDelta) {
    // Orbit controls
    this.azimuth -= mouseDX * this.sensitivity;
    this.elevation += mouseDY * this.sensitivity;
    this.elevation = Math.max(this.minElevation, Math.min(this.maxElevation, this.elevation));

    // Zoom
    this.distance += scrollDelta * this.scrollSensitivity;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));

    // Calculate target camera position
    const x = playerPos.x + Math.sin(this.azimuth) * Math.cos(this.elevation) * this.distance;
    const y = playerPos.y + Math.sin(this.elevation) * this.distance + CONFIG.CAMERA_HEIGHT;
    const z = playerPos.z + Math.cos(this.azimuth) * Math.cos(this.elevation) * this.distance;

    this._targetPos.set(x, y, z);

    // Smooth lerp
    this._currentPos.lerp(this._targetPos, CONFIG.CAMERA_SMOOTHING);
    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
  }

  /** Returns the horizontal (XZ) forward direction the camera is facing. */
  getForwardXZ() {
    const dir = new THREE.Vector3(
      -Math.sin(this.azimuth),
      0,
      -Math.cos(this.azimuth)
    );
    return dir.normalize();
  }

  /** Returns the camera's right vector in XZ plane. */
  getRightXZ() {
    const fwd = this.getForwardXZ();
    return new THREE.Vector3(fwd.z, 0, -fwd.x);
  }

  /** Instantly snap to position (used on game start). */
  snapTo(playerPos) {
    const x = playerPos.x + Math.sin(this.azimuth) * Math.cos(this.elevation) * this.distance;
    const y = playerPos.y + Math.sin(this.elevation) * this.distance + CONFIG.CAMERA_HEIGHT;
    const z = playerPos.z + Math.cos(this.azimuth) * Math.cos(this.elevation) * this.distance;
    this._currentPos.set(x, y, z);
    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
  }
}
