/**
 * player.js
 * Scat character class. Handles model construction, movement, rolling animation,
 * jumping, and noise generation.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Player {
  constructor(scene, scatType) {
    this.scatType = scatType;
    this.scene = scene;

    this.radius = scatType.size;
    this.speed = scatType.speed;
    this.agility = scatType.agility;
    this.stealth = scatType.stealth;

    // Physics state
    this.velocity = new THREE.Vector3();
    this.desiredVelocity = new THREE.Vector3();
    this.isGrounded = true;
    this.gravityVelocity = 0;

    // Noise
    this.noiseLevel = 0;
    this.noiseBurstTimer = 0;

    // Push state
    this.isPushed = false;
    this.pushVelocity = new THREE.Vector3();
    this.pushCount = 0; // tracks consecutive pushes for 3x multiplier

    // Build the mesh group
    this.group = new THREE.Group();
    this._buildModel();
    this.group.position.set(0, this.radius, CONFIG.PLAYER_START_Z);
    scene.add(this.group);

    // Track previous position for rolling
    this._prevPos = this.group.position.clone();
  }

  _buildModel() {
    const color = this.scatType.color;
    const mat = new THREE.MeshLambertMaterial({ color });

    if (this.scatType.shape === 'cluster') {
      this._buildCluster(mat);
    } else if (this.scatType.shape === 'oval') {
      this._buildOval(mat);
    } else {
      this._buildBlob(mat);
    }
  }

  _buildCluster(mat) {
    const count = 5 + Math.floor(Math.random() * 3); // 5-7
    for (let i = 0; i < count; i++) {
      const r = 0.15 + Math.random() * 0.1;
      const geo = new THREE.SphereGeometry(r, 6, 6);
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / count) * Math.PI * 2;
      const dist = 0.1 + Math.random() * 0.2;
      mesh.position.set(
        Math.cos(angle) * dist + (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.2,
        Math.sin(angle) * dist + (Math.random() - 0.5) * 0.1
      );
      this.group.add(mesh);
    }
  }

  _buildOval(mat) {
    const geo = new THREE.SphereGeometry(this.radius, 8, 8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1.0, 0.7, 1.3);
    this.group.add(mesh);

    // Small bumps
    for (let i = 0; i < 3; i++) {
      const bumpGeo = new THREE.SphereGeometry(0.15, 5, 5);
      const bump = new THREE.Mesh(bumpGeo, mat);
      const angle = (i / 3) * Math.PI * 2;
      bump.position.set(
        Math.cos(angle) * this.radius * 0.8,
        0.1,
        Math.sin(angle) * this.radius * 0.9
      );
      this.group.add(bump);
    }
  }

  _buildBlob(mat) {
    const geo = new THREE.SphereGeometry(this.radius, 8, 8);
    const mesh = new THREE.Mesh(geo, mat);
    this.group.add(mesh);

    const bumpCount = 3 + Math.floor(Math.random() * 3); // 3-5
    for (let i = 0; i < bumpCount; i++) {
      const r = 0.2 + Math.random() * 0.3;
      const bumpGeo = new THREE.SphereGeometry(r, 6, 6);
      const bump = new THREE.Mesh(bumpGeo, mat);
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      const dist = this.radius * 0.7;
      bump.position.set(
        Math.sin(phi) * Math.cos(theta) * dist,
        Math.cos(phi) * dist,
        Math.sin(phi) * Math.sin(theta) * dist
      );
      this.group.add(bump);
    }
  }

  /**
   * Update player each frame.
   * @param {number} dt - delta time in seconds
   * @param {Object} keys - key state from InputManager
   * @param {boolean} jumpPressed - single-fire jump flag
   * @param {CameraController} cam
   * @param {number} elephantDist - distance to elephant (for proximity boost)
   */
  update(dt, keys, jumpPressed, cam, elephantDist = 999) {
    // Proximity boost: scale up speed and jump when close to elephant
    const closeThreshold = 20;
    const proximityBoost = elephantDist < closeThreshold
      ? 1 + (1 - elephantDist / closeThreshold) * 0.7  // up to 1.7x at dist=0
      : 1.0;
    // Handle push state
    if (this.isPushed) {
      this.group.position.addScaledVector(this.pushVelocity, dt);
      this.pushVelocity.multiplyScalar(0.85); // friction
      if (this.pushVelocity.length() < 0.5) {
        this.isPushed = false;
        this.pushVelocity.set(0, 0, 0);
      }
    }

    // Build desired velocity from WASD + camera orientation
    const forward = cam.getForwardXZ();
    const right = cam.getRightXZ();
    this.desiredVelocity.set(0, 0, 0);

    if (keys.w) this.desiredVelocity.addScaledVector(forward, 1);
    if (keys.s) this.desiredVelocity.addScaledVector(forward, -1);
    if (keys.a) this.desiredVelocity.addScaledVector(right, 1);
    if (keys.d) this.desiredVelocity.addScaledVector(right, -1);

    const maxSpeed = this.speed * 0.5 * proximityBoost;
    if (this.desiredVelocity.length() > 0) {
      this.desiredVelocity.normalize().multiplyScalar(maxSpeed);
    }

    // Lerp current velocity toward desired (agility)
    const lerpFactor = Math.min(1, this.agility * 0.1 * dt * 60);
    this.velocity.lerp(this.desiredVelocity, lerpFactor);

    // Apply horizontal movement
    if (!this.isPushed) {
      this.group.position.x += this.velocity.x * dt;
      this.group.position.z += this.velocity.z * dt;
    }

    // Jumping — when close to elephant, guarantee enough height to reach the anus (y=7)
    if (jumpPressed && this.isGrounded) {
      const baseHeight = this.radius * 5 * proximityBoost;
      // Minimum of 8 units when within close range so all scat types can reach the goal
      const jumpHeight = elephantDist < closeThreshold ? Math.max(baseHeight, 8.0) : baseHeight;
      this.gravityVelocity = Math.sqrt(2 * 20 * jumpHeight); // v = sqrt(2*g*h)
      this.isGrounded = false;
      this.noiseBurstTimer = 0.5; // noise burst on jump
    }

    // Apply gravity
    const gravity = 20;
    if (!this.isGrounded) {
      this.gravityVelocity -= gravity * dt;
      this.group.position.y += this.gravityVelocity * dt;
    }

    // Ground clamp
    const groundY = this.radius;
    if (this.group.position.y <= groundY) {
      this.group.position.y = groundY;
      this.gravityVelocity = 0;
      this.isGrounded = true;
    }

    // Rolling animation
    const moved = new THREE.Vector3().subVectors(this.group.position, this._prevPos);
    const moveDist = moved.length();
    if (moveDist > 0.001) {
      // Axis of rotation is perpendicular to movement in XZ plane
      const axis = new THREE.Vector3(moved.z, 0, -moved.x).normalize();
      const angle = moveDist * 2.0;
      this.group.rotateOnWorldAxis(axis, angle);
    }
    this._prevPos.copy(this.group.position);

    // Noise level calculation
    const currentSpeed = this.velocity.length();
    if (this.noiseBurstTimer > 0) {
      this.noiseLevel = 1.0;
      this.noiseBurstTimer -= dt;
    } else {
      this.noiseLevel = currentSpeed / (this.speed * 0.5);
    }
  }

  /** Apply a push force from a given origin. Each push is 3x the previous. */
  applyPush(fromPos, force) {
    const dir = new THREE.Vector3()
      .subVectors(this.group.position, fromPos)
      .setY(0)
      .normalize();
    this.pushCount += 1;
    const multiplier = Math.pow(3, this.pushCount - 1); // 1x, 3x, 9x, ...
    this.isPushed = true;
    this.pushVelocity.copy(dir).multiplyScalar(force * multiplier);
  }

  resetPushCount() {
    this.pushCount = 0;
  }

  /** Flatten the scat (squish animation for lose state). */
  squish(progress) {
    // progress: 0 -> 1
    const scaleY = 1 - (1 - 0.05) * progress;
    this.group.scale.set(1 + progress * 0.5, scaleY, 1 + progress * 0.5);
  }

  /** Lerp toward a target position (used in win animation). */
  lerpToward(target, t) {
    this.group.position.lerp(target, t);
  }

  get position() {
    return this.group.position;
  }
}
