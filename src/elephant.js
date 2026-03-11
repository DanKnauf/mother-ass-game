/**
 * elephant.js
 * Elephant model (built from Three.js primitives), AI behavior states,
 * patrol, detection, push, and charge logic.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export const ElephantState = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  ALERT: 'ALERT',
  PUSH: 'PUSH',
  CALM_DOWN: 'CALM_DOWN',
  CHARGE: 'CHARGE'
};

export class Elephant {
  constructor(scene) {
    this.scene = scene;
    this.state = ElephantState.PATROL;
    this.group = new THREE.Group();

    this._buildModel();
    this.group.position.set(0, 0, CONFIG.ELEPHANT_START_Z);
    scene.add(this.group);

    // Patrol state
    this.patrolTarget = new THREE.Vector3();
    this.patrolPauseTimer = 0;
    this._pickNewPatrolTarget();

    // Animation timers
    this.walkTime = 0;
    this.trunkTime = 0;
    this.tailFlickTimer = 0;

    // Alert / calm state
    this.alertTimer = 0;
    this.calmTimer = 0;

    // Anus world position cache
    this._anusWorldPos = new THREE.Vector3();
  }

  _buildModel() {
    const grayMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const lightGrayMat = new THREE.MeshLambertMaterial({ color: 0x909090 });
    const darkGrayMat = new THREE.MeshLambertMaterial({ color: 0x707070 });
    const anusMat = new THREE.MeshStandardMaterial({
      color: 0xff6688,
      emissive: 0xff2255,
      emissiveIntensity: 1.2,
      side: THREE.DoubleSide
    });
    const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const eyeDarkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Body
    const bodyGeo = new THREE.BoxGeometry(7, 6, 12);
    this.body = new THREE.Mesh(bodyGeo, grayMat);
    this.body.position.set(0, 8, 0);
    this.group.add(this.body);

    // Head
    const headGeo = new THREE.SphereGeometry(3, 8, 8);
    this.head = new THREE.Mesh(headGeo, lightGrayMat);
    this.head.position.set(0, 8.5, 6.5);
    this.group.add(this.head);

    // Ears
    for (const side of [-1, 1]) {
      const earGeo = new THREE.SphereGeometry(2.2, 6, 6);
      const ear = new THREE.Mesh(earGeo, darkGrayMat);
      ear.scale.set(0.3, 1, 1);
      ear.position.set(side * 4.2, 8.5, 5.5);
      this.group.add(ear);
    }

    // Trunk (segmented)
    this.trunkSegments = [];
    const trunkParent = new THREE.Group();
    trunkParent.position.set(0, 7, 8.5);
    this.group.add(trunkParent);
    this.trunkParent = trunkParent;

    let prevGroup = trunkParent;
    for (let i = 0; i < 5; i++) {
      const r = 0.55 - i * 0.07;
      const segGeo = new THREE.CylinderGeometry(r * 0.8, r, 1.5, 7);
      const seg = new THREE.Mesh(segGeo, grayMat);
      const segGroup = new THREE.Group();
      segGroup.position.set(0, -1.5, 0);
      seg.position.set(0, -0.75, 0);
      segGroup.add(seg);
      prevGroup.add(segGroup);
      this.trunkSegments.push(segGroup);
      prevGroup = segGroup;
    }

    // Legs
    this.legs = [];
    const legPositions = [
      [-2.5, 0, -4], [2.5, 0, -4],
      [-2.5, 0, 4],  [2.5, 0, 4]
    ];
    legPositions.forEach((pos, i) => {
      const legGeo = new THREE.CylinderGeometry(1.0, 0.85, 5, 8);
      const leg = new THREE.Mesh(legGeo, darkGrayMat);
      leg.position.set(pos[0], 2.5, pos[2]);
      this.group.add(leg);
      this.legs.push(leg);
    });

    // Tail
    const tailGeo = new THREE.CylinderGeometry(0.2, 0.1, 3, 6);
    this.tail = new THREE.Mesh(tailGeo, grayMat);
    this.tail.position.set(0, 9, -6.5);
    this.tail.rotation.x = -0.5;
    this.group.add(this.tail);

    // Tail tuft
    const tuftGeo = new THREE.SphereGeometry(0.35, 6, 6);
    const tuft = new THREE.Mesh(tuftGeo, darkGrayMat);
    tuft.position.set(0, 10.5, -8.2);
    this.group.add(tuft);

    // Eyes
    for (const side of [-1, 1]) {
      const eyeWhiteGeo = new THREE.SphereGeometry(0.5, 6, 6);
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      eyeWhite.position.set(side * 1.8, 9.2, 9.0);
      this.group.add(eyeWhite);

      const eyeGeo = new THREE.SphereGeometry(0.3, 6, 6);
      const eye = new THREE.Mesh(eyeGeo, eyeDarkMat);
      eye.position.set(side * 1.85, 9.2, 9.3);
      this.group.add(eye);
    }

    // Anus (goal zone) - at the rear
    const anusGeo = new THREE.TorusGeometry(0.6, 0.25, 8, 8);
    this.anus = new THREE.Mesh(anusGeo, anusMat);
    this.anus.position.set(0, 7.0, -6.2);
    this.anus.rotation.x = Math.PI / 2;
    this.group.add(this.anus);
    this._anusLocalPos = new THREE.Vector3(0, 7.0, -6.2);

    // Glow light attached to anus
    this.anusLight = new THREE.PointLight(0xff2255, 3, 12);
    this.anusLight.position.set(0, 7.0, -6.2);
    this.group.add(this.anusLight);
  }

  _pickNewPatrolTarget() {
    const range = 40;
    this.patrolTarget.set(
      (Math.random() - 0.5) * range,
      0,
      (Math.random() - 0.5) * range
    );
  }

  /** Returns the anus position in world space. */
  getAnusWorldPos() {
    this._anusWorldPos.copy(this._anusLocalPos);
    this.group.localToWorld(this._anusWorldPos);
    return this._anusWorldPos;
  }

  /** Returns the forward direction vector of the elephant in world space. */
  getForward() {
    const fwd = new THREE.Vector3(0, 0, 1);
    fwd.applyQuaternion(this.group.quaternion);
    return fwd;
  }

  /**
   * Update elephant AI and animations.
   * @param {number} dt
   * @param {THREE.Vector3} playerPos
   * @param {number} detectionScore
   * @param {boolean} playerHidden
   */
  update(dt, playerPos, detectionScore, playerHidden) {
    this.walkTime += dt;
    this.trunkTime += dt;
    this.tailFlickTimer -= dt;

    this._updateAnimations();

    switch (this.state) {
      case ElephantState.PATROL:
        this._updatePatrol(dt, playerPos, detectionScore, playerHidden);
        break;
      case ElephantState.ALERT:
        this._updateAlert(dt, playerPos, detectionScore, playerHidden);
        break;
      case ElephantState.CALM_DOWN:
        this._updateCalmDown(dt, playerPos, detectionScore);
        break;
      case ElephantState.CHARGE:
        this._updateCharge(dt, playerPos);
        break;
    }
  }

  _updatePatrol(dt, playerPos, detectionScore, playerHidden) {
    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= dt;
      return;
    }

    // Check for detection
    if (detectionScore > 0.3 && !playerHidden) {
      this.alertTimer = 0;
      this.state = ElephantState.ALERT;
      return;
    }

    // Move toward patrol target
    const toTarget = new THREE.Vector3().subVectors(this.patrolTarget, this.group.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (dist < 2) {
      // Reached target, pause then pick new one
      this.patrolPauseTimer = 1 + Math.random() * 2;
      this._pickNewPatrolTarget();
      return;
    }

    // Slow way down when player is within 15 units (give them a chance)
    const distToPlayer = this.group.position.distanceTo(playerPos);
    const proximityFactor = distToPlayer < 15
      ? Math.max(0.1, distToPlayer / 15)
      : 1.0;

    const speed = CONFIG.ELEPHANT_MOVE_SPEED * 0.5 * proximityFactor;
    const dir = toTarget.normalize();

    // Smooth rotation toward movement direction
    this._rotateToward(dir, dt * CONFIG.ELEPHANT_TURN_SPEED * 0.55);
    this.group.position.addScaledVector(dir, speed * dt);
  }

  _updateAlert(dt, playerPos, detectionScore, playerHidden) {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const dir = toPlayer.normalize();

    // Slow turn when very close (to let player slip around), but otherwise responsive
    const proximityFactor = dist < 10 ? Math.max(0.2, dist / 10) : 0.75;
    this._rotateToward(dir, dt * CONFIG.ELEPHANT_TURN_SPEED * proximityFactor);

    // Check if facing player and close enough to push
    const forward = this.getForward();
    const dot = forward.dot(dir);

    if (dot > 0.75 && dist < CONFIG.ELEPHANT_PUSH_RANGE) {
      // Push
      return { push: true };
    }

    // Check calm down
    if (playerHidden || detectionScore <= 0.1) {
      this.calmTimer += dt;
      if (this.calmTimer >= CONFIG.ELEPHANT_CALM_DOWN_TIME) {
        this.calmTimer = 0;
        this.state = ElephantState.CALM_DOWN;
      }
    } else {
      this.calmTimer = 0;
    }
  }

  _updateCalmDown(dt, playerPos, detectionScore) {
    this.alertTimer += dt;
    if (this.alertTimer >= 2.0) {
      this.alertTimer = 0;
      this.state = ElephantState.PATROL;
      this._pickNewPatrolTarget();
    }
  }

  _updateCharge(dt, playerPos) {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist < 1.0) return; // reached

    const dir = toPlayer.normalize();
    this._rotateToward(dir, dt * CONFIG.ELEPHANT_TURN_SPEED * 3);
    this.group.position.addScaledVector(dir, CONFIG.ELEPHANT_MOVE_SPEED * 3 * dt);
  }

  _rotateToward(dir, maxAngle) {
    const currentAngle = this.group.rotation.y;
    const targetAngle = Math.atan2(dir.x, dir.z);
    let diff = targetAngle - currentAngle;
    // Normalize to [-PI, PI]
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), maxAngle);
    this.group.rotation.y += step;
  }

  _updateAnimations() {
    // Walk cycle for legs
    const walkFreq = 2.5;
    const walkAmp = 0.35;
    const isMoving = (
      this.state === ElephantState.PATROL ||
      this.state === ElephantState.CHARGE
    );
    const walkScale = isMoving ? 1 : 0.1;

    // Legs 0,3 (front-left, back-right) together; 1,2 together
    this.legs[0].rotation.x = Math.sin(this.walkTime * walkFreq) * walkAmp * walkScale;
    this.legs[3].rotation.x = Math.sin(this.walkTime * walkFreq) * walkAmp * walkScale;
    this.legs[1].rotation.x = Math.sin(this.walkTime * walkFreq + Math.PI) * walkAmp * walkScale;
    this.legs[2].rotation.x = Math.sin(this.walkTime * walkFreq + Math.PI) * walkAmp * walkScale;

    // Trunk sway
    const trunkSway = Math.sin(this.trunkTime * 1.5) * 0.15;
    if (this.trunkSegments.length > 0) {
      this.trunkSegments[0].rotation.z = trunkSway;
      this.trunkSegments[0].rotation.x = 0.2 + Math.sin(this.trunkTime * 0.8) * 0.1;
    }

    // Anus pulsing glow
    const pulseScale = 1 + Math.sin(this.walkTime * 3) * 0.15;
    this.anus.scale.set(pulseScale, pulseScale, pulseScale);
    this.anusLight.intensity = 2 + Math.sin(this.walkTime * 3) * 1.5;

    // Tail flick
    if (this.tailFlickTimer <= 0) {
      this.tailFlickTimer = 2 + Math.random() * 3;
    }
    const tailFlick = this.tailFlickTimer < 0.3
      ? Math.sin(this.tailFlickTimer * 20) * 0.4
      : 0;
    this.tail.rotation.z = tailFlick;
  }

  /** Start the charge behavior (lose state). */
  startCharge() {
    this.state = ElephantState.CHARGE;
  }

  /** Check if elephant has reached the player (for stomp). */
  hasReachedPlayer(playerPos) {
    const dist = this.group.position.distanceTo(playerPos);
    return dist < 3;
  }

  get position() {
    return this.group.position;
  }
}
