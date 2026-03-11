/**
 * particles.js
 * Fireworks particle system for the win celebration state.
 */

import * as THREE from 'three';

const FIREWORK_COLORS = [0xff4444, 0xFFD700, 0x44ff44, 0x4488ff, 0xffffff, 0xcc44ff];

class Particle {
  constructor(origin, scene) {
    const geo = new THREE.SphereGeometry(0.12, 4, 4);
    const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    this.mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.copy(origin);

    const speed = 3 + Math.random() * 5;
    const phi = Math.random() * Math.PI;
    const theta = Math.random() * Math.PI * 2;
    this.velocity = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.abs(Math.cos(phi)) * speed + 1,
      Math.sin(phi) * Math.sin(theta) * speed
    );

    this.life = 1.5 + Math.random() * 1.5;
    this.maxLife = this.life;
    scene.add(this.mesh);
    this.scene = scene;
    this.dead = false;
  }

  update(dt) {
    if (this.dead) return;
    const gravity = 3.5; // low gravity so particles stay in frame longer
    this.velocity.y -= gravity * dt;
    this.mesh.position.addScaledVector(this.velocity, dt);
    this.life -= dt;
    this.mat.opacity = Math.max(0, this.life / this.maxLife);
    if (this.life <= 0) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mat.dispose();
      this.dead = true;
    }
  }
}

export class FireworkSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.active = false;
    this.spawnTimer = 0;
    this.totalTimer = 0;
    this.spawnInterval = 0.2;
    this.duration = 10;
    this._onComplete = null;
  }

  start(onComplete, onBurst) {
    this.active = true;
    this.spawnTimer = 0;
    this.totalTimer = 0;
    this._onComplete = onComplete;
    this._onBurst = onBurst || null;
  }

  stop() {
    this.active = false;
    this.particles.forEach(p => {
      if (!p.dead) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        p.dead = true;
      }
    });
    this.particles = [];
  }

  update(dt) {
    if (!this.active) return;

    this.totalTimer += dt;

    // Spawn new bursts
    if (this.totalTimer < this.duration) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval;
        this._spawnBurst();
      }
    }

    // Update existing particles
    this.particles = this.particles.filter(p => {
      p.update(dt);
      return !p.dead;
    });

    // Done?
    if (this.totalTimer > this.duration && this.particles.length === 0) {
      this.active = false;
      if (this._onComplete) this._onComplete();
    }
  }

  _spawnBurst() {
    const x = (Math.random() - 0.5) * 20;
    const y = 5 + Math.random() * 7;   // low enough for ground-level camera to see
    const z = (Math.random() - 0.5) * 20;
    const origin = new THREE.Vector3(x, y, z);
    const count = 20 + Math.floor(Math.random() * 30);
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(origin, this.scene));
    }
    if (this._onBurst) this._onBurst();
  }
}
