/**
 * environment.js
 * Ground plane, tall grass patches, boulders, background hills, trees, and lighting.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.tallGrassPatches = [];  // { center: Vector3, radius: number }
    this.boulderBoxes = [];      // { min: Vector3, max: Vector3, center: Vector3 }

    this._buildGround();
    this._buildSkyAndLighting();
    this._buildBackgroundHills();
    this._buildBackgroundTrees();
    this._buildShortGrass();
    this._buildTallGrass();
    this._buildBoulders();
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(CONFIG.FIELD_SIZE, CONFIG.FIELD_SIZE);
    const mat = new THREE.MeshLambertMaterial({ color: 0x7CBA3F });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Subtle shadow base
    const shadowGeo = new THREE.PlaneGeometry(CONFIG.FIELD_SIZE, CONFIG.FIELD_SIZE);
    const shadowMat = new THREE.MeshLambertMaterial({ color: 0x69A831 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.01;
    this.scene.add(shadow);
  }

  _buildSkyAndLighting() {
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 200);

    // Sun sphere
    const sunGeo = new THREE.SphereGeometry(4, 8, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFFDE7 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(60, 80, -80);
    this.scene.add(sun);

    // Directional light (warm sunlight)
    const dirLight = new THREE.DirectionalLight(0xFFF8E1, 1.0);
    dirLight.position.set(60, 80, -80);
    this.scene.add(dirLight);

    // Ambient
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambLight);

    // Hemisphere
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x7CBA3F, 0.3);
    this.scene.add(hemiLight);
  }

  _buildBackgroundHills() {
    const hillColor = new THREE.MeshLambertMaterial({ color: 0x5B8C3E });
    const positions = [
      { x: -80, z: -100 }, { x: 0, z: -110 }, { x: 80, z: -105 },
      { x: -50, z: 110 }, { x: 50, z: 115 }
    ];
    positions.forEach(pos => {
      const geo = new THREE.SphereGeometry(40, 8, 4);
      const hill = new THREE.Mesh(geo, hillColor);
      hill.position.set(pos.x, -16, pos.z);
      hill.scale.set(1, 0.35, 1);
      this.scene.add(hill);
    });
  }

  _buildBackgroundTrees() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
    const canopyMat = new THREE.MeshLambertMaterial({ color: 0x388E3C });

    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 60 + Math.random() * 30;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 2, z);
      this.scene.add(trunk);

      // Canopy
      const canopyGeo = new THREE.IcosahedronGeometry(2.5, 0);
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(x, 6.5, z);
      this.scene.add(canopy);
    }
  }

  _buildShortGrass() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x5A9E2F });
    const bladeGeo = new THREE.BoxGeometry(0.05, 0.5, 0.05);

    for (let p = 0; p < CONFIG.SHORT_GRASS_PATCHES; p++) {
      const cx = (Math.random() - 0.5) * CONFIG.FIELD_SIZE * 0.8;
      const cz = (Math.random() - 0.5) * CONFIG.FIELD_SIZE * 0.8;

      const count = 20 + Math.floor(Math.random() * 20);
      for (let b = 0; b < count; b++) {
        const blade = new THREE.Mesh(bladeGeo, mat);
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 2;
        blade.position.set(
          cx + Math.cos(angle) * r,
          0.25,
          cz + Math.sin(angle) * r
        );
        blade.rotation.y = Math.random() * Math.PI;
        this.scene.add(blade);
      }
    }
  }

  _buildTallGrass() {
    // Place patches biased toward the area between player and elephant
    for (let p = 0; p < CONFIG.TALL_GRASS_PATCHES; p++) {
      // Bias toward center corridor
      const cx = (Math.random() - 0.5) * 60;
      const cz = (Math.random() - 0.5) * CONFIG.FIELD_SIZE * 0.6;
      const patchRadius = CONFIG.TALL_GRASS_RADIUS + Math.random() * 1.0;

      this.tallGrassPatches.push({
        center: new THREE.Vector3(cx, 0, cz),
        radius: patchRadius
      });

      this._buildTallGrassPatch(cx, cz, patchRadius);
    }
  }

  _buildTallGrassPatch(cx, cz, patchRadius) {
    const bladeCount = 60 + Math.floor(Math.random() * 40); // 60-100 blades

    // Shared geometry: wide flat blade, tapered at top
    // Use a custom PlaneGeometry with modified vertices for taper
    const bladeWidth = 0.15 + Math.random() * 0.15;  // 0.15-0.3
    const bladeHeight = 2.5 + Math.random() * 1.5;    // 2.5-4.0

    for (let b = 0; b < bladeCount; b++) {
      const geo = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 1, 4);

      // Taper top vertices to create pointed blade
      const pos = geo.attributes.position;
      for (let v = 0; v < pos.count; v++) {
        const y = pos.getY(v);
        if (y > 0) {
          // Scale X toward center as Y increases
          const x = pos.getX(v);
          const t = y / (bladeHeight / 2);
          pos.setX(v, x * (1 - t * 0.9));
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      // Random green color per blade
      const t = Math.random();
      const r1 = 0x8B, g1 = 0xC3, b1 = 0x4A; // bright yellow-green
      const r2 = 0x2E, g2 = 0x7D, b2 = 0x32; // deep green
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const bv = Math.round(b1 + (b2 - b1) * t);
      const color = (r << 16) | (g << 8) | bv;

      const mat = new THREE.MeshLambertMaterial({
        color,
        side: THREE.DoubleSide
      });

      const blade = new THREE.Mesh(geo, mat);

      const bladeAngle = Math.random() * Math.PI * 2;
      const bladeRadius = Math.random() * patchRadius;
      blade.position.set(
        cx + Math.cos(bladeAngle) * bladeRadius,
        bladeHeight / 2,
        cz + Math.sin(bladeAngle) * bladeRadius
      );

      // Random Y rotation
      blade.rotation.y = Math.random() * Math.PI * 2;
      // Random lean (5-15 degrees)
      const leanAngle = (5 + Math.random() * 10) * (Math.PI / 180);
      const leanDir = Math.random() * Math.PI * 2;
      blade.rotation.x = Math.cos(leanDir) * leanAngle;
      blade.rotation.z = Math.sin(leanDir) * leanAngle;

      this.scene.add(blade);
    }
  }

  _buildBoulders() {
    for (let i = 0; i < CONFIG.BOULDER_COUNT; i++) {
      const size = CONFIG.BOULDER_MIN_SIZE + Math.random() * (CONFIG.BOULDER_MAX_SIZE - CONFIG.BOULDER_MIN_SIZE);

      // Random warm gray-brown color
      const t = Math.random();
      const c1 = 0x8B8682, c2 = 0x9E9589;
      const r = Math.round(((c1 >> 16) & 0xff) + (((c2 >> 16) & 0xff) - ((c1 >> 16) & 0xff)) * t);
      const g = Math.round(((c1 >> 8) & 0xff) + (((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t);
      const b = Math.round((c1 & 0xff) + ((c2 & 0xff) - (c1 & 0xff)) * t);
      const color = (r << 16) | (g << 8) | b;

      const geo = new THREE.IcosahedronGeometry(size, 1);
      const mat = new THREE.MeshLambertMaterial({ color });
      const boulder = new THREE.Mesh(geo, mat);

      // Slightly flatten and randomize shape
      boulder.scale.set(
        0.9 + Math.random() * 0.4,
        0.7 + Math.random() * 0.3,
        0.9 + Math.random() * 0.4
      );
      boulder.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Position biased toward play area
      const bx = (Math.random() - 0.5) * CONFIG.FIELD_SIZE * 0.7;
      const bz = (Math.random() - 0.5) * CONFIG.FIELD_SIZE * 0.6;
      boulder.position.set(bx, size * 0.6, bz);
      this.scene.add(boulder);

      // AABB for collision
      const halfX = size * boulder.scale.x * 0.9;
      const halfZ = size * boulder.scale.z * 0.9;
      this.boulderBoxes.push({
        center: new THREE.Vector3(bx, size * 0.6, bz),
        min: new THREE.Vector3(bx - halfX, 0, bz - halfZ),
        max: new THREE.Vector3(bx + halfX, size * boulder.scale.y * 2, bz + halfZ),
        halfRadius: Math.max(halfX, halfZ)
      });
    }
  }

  /**
   * Returns true if the player is hidden inside a tall grass patch.
   * @param {THREE.Vector3} playerPos
   */
  isPlayerInTallGrass(playerPos) {
    for (const patch of this.tallGrassPatches) {
      const dx = playerPos.x - patch.center.x;
      const dz = playerPos.z - patch.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < patch.radius) return true;
    }
    return false;
  }

  /**
   * Returns true if the player is behind a boulder relative to the elephant.
   * Simplified: check if a boulder is between elephant and player.
   * @param {THREE.Vector3} elephantPos
   * @param {THREE.Vector3} playerPos
   */
  isPlayerBehindBoulder(elephantPos, playerPos) {
    for (const box of this.boulderBoxes) {
      // Check if boulder center is roughly between elephant and player
      const toPlayer = new THREE.Vector3().subVectors(playerPos, elephantPos);
      const toBoulder = new THREE.Vector3().subVectors(box.center, elephantPos);
      const distToPlayer = toPlayer.length();
      const distToBoulder = toBoulder.length();

      if (distToBoulder >= distToPlayer) continue;

      // Check angle
      const dot = toPlayer.normalize().dot(toBoulder.normalize());
      if (dot < 0.85) continue;

      // Check if boulder is wide enough to block
      const perp = new THREE.Vector3().crossVectors(toPlayer, new THREE.Vector3(0, 1, 0)).normalize();
      const lateralOffset = Math.abs(toBoulder.dot(perp));
      if (lateralOffset < box.halfRadius * 0.8) return true;
    }
    return false;
  }
}
