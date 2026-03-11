/**
 * hud.js
 * HTML/CSS HUD overlay: timer, elephant direction arrow,
 * stealth bar, and scat stats.
 */

import * as THREE from 'three';

export class HUD {
  constructor() {
    this.timerEl = document.getElementById('timer-display');
    this.arrowEl = document.getElementById('elephant-arrow');
    this.stealthBarEl = document.getElementById('stealth-bar');
    this.scatNameEl = document.getElementById('scat-name');
    this.statSpeedEl = document.getElementById('stat-speed');
    this.statAgilityEl = document.getElementById('stat-agility');
    this.statStealthEl = document.getElementById('stat-stealth');
    this.hudEl = document.getElementById('hud');
    this.pointerLockMsg = document.getElementById('pointer-lock-msg');

    this._arrowAngle = 0;

    // Temp vectors for arrow calculation
    this._v3 = new THREE.Vector3();
    this._ndc = new THREE.Vector3();
  }

  show() { this.hudEl.classList.remove('hidden'); }
  hide() { this.hudEl.classList.add('hidden'); }

  /** Set scat info once at game start. */
  setScatInfo(scatType) {
    this.scatNameEl.textContent = scatType.name;
    this.statSpeedEl.style.width = `${scatType.speed * 10}%`;
    this.statAgilityEl.style.width = `${scatType.agility * 10}%`;
    this.statStealthEl.style.width = `${scatType.stealth * 10}%`;
  }

  /**
   * Update timer display.
   * @param {number} secondsRemaining
   */
  updateTimer(secondsRemaining) {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = Math.floor(secondsRemaining % 60);
    this.timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (secondsRemaining <= 30) {
      this.timerEl.classList.add('danger');
      this.timerEl.classList.add('pulse');
    } else {
      this.timerEl.classList.remove('danger');
      this.timerEl.classList.remove('pulse');
    }
  }

  /**
   * Update the stealth/detection bar.
   * @param {number} score - 0 to 1
   */
  updateStealthBar(score) {
    const pct = Math.min(1, Math.max(0, score));
    this.stealthBarEl.style.width = `${pct * 100}%`;

    if (pct < 0.3) {
      this.stealthBarEl.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
    } else if (pct < 0.7) {
      this.stealthBarEl.style.background = 'linear-gradient(90deg, #ff9800, #ffc107)';
    } else {
      this.stealthBarEl.style.background = 'linear-gradient(90deg, #e53935, #ff5722)';
    }
  }

  /**
   * Update the elephant direction arrow.
   * Shows arrow at screen edge when elephant is off-screen.
   * @param {THREE.Vector3} elephantPos
   * @param {THREE.Camera} camera
   * @param {number} screenW
   * @param {number} screenH
   */
  updateElephantArrow(elephantPos, camera, screenW, screenH) {
    this._v3.copy(elephantPos);
    this._v3.project(camera);

    const screenX = (this._v3.x + 1) / 2 * screenW;
    const screenY = (-this._v3.y + 1) / 2 * screenH;

    const margin = 40;
    const isOnScreen = (
      screenX > margin && screenX < screenW - margin &&
      screenY > margin && screenY < screenH - margin &&
      this._v3.z < 1
    );

    if (isOnScreen) {
      this.arrowEl.classList.add('hidden');
      return;
    }

    this.arrowEl.classList.remove('hidden');

    // Clamp to screen edge
    const cx = screenW / 2;
    const cy = screenH / 2;
    const dx = screenX - cx;
    const dy = screenY - cy;
    const angle = Math.atan2(dy, dx);

    const edgeMargin = 32;
    const halfW = screenW / 2 - edgeMargin;
    const halfH = screenH / 2 - edgeMargin;

    const absCos = Math.abs(Math.cos(angle));
    const absSin = Math.abs(Math.sin(angle));
    let ex, ey;
    if (halfW / absCos < halfH / absSin) {
      ex = cx + Math.sign(dx) * halfW;
      ey = cy + Math.sign(dx) * halfW * Math.tan(angle);
    } else {
      ex = cx + Math.sign(dy) * halfH / Math.tan(angle);
      ey = cy + Math.sign(dy) * halfH;
    }

    this.arrowEl.style.left = `${ex}px`;
    this.arrowEl.style.top = `${ey}px`;
    this.arrowEl.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`;
  }

  showPointerLockMsg(visible) {
    if (visible) {
      this.pointerLockMsg.classList.remove('hidden');
    } else {
      this.pointerLockMsg.classList.add('hidden');
    }
  }
}
