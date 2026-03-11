/**
 * main.js
 * Entry point. Sets up Three.js scene, orchestrates all subsystems,
 * and runs the main game loop with full state machine.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { InputManager } from './input.js';
import { CameraController } from './camera.js';
import { Player } from './player.js';
import { Elephant, ElephantState } from './elephant.js';
import { Environment } from './environment.js';
import { AudioManager } from './audio.js';
import { HUD } from './hud.js';
import { FireworkSystem } from './particles.js';
import { sphereVsAABB, clampToField, distanceXZ } from './collision.js';

// ---- Game States ----
const GameState = {
  TITLE: 'TITLE',
  CHAR_SELECT: 'CHAR_SELECT',
  INSTRUCTIONS: 'INSTRUCTIONS',
  PLAYING: 'PLAYING',
  WIN: 'WIN',
  LOSE: 'LOSE'
};

// ---- Scene Setup ----
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Global Systems ----
const input = new InputManager();
const audio = new AudioManager();
const hud = new HUD();
const fireworks = new FireworkSystem(scene);

// ---- Game Variables ----
let gameState = GameState.TITLE;
let selectedScatIndex = 0;
let player = null;
let elephant = null;
let environment = null;
let camController = null;

let timeRemaining = CONFIG.GAME_DURATION;
let detectionScore = 0;
let playerHidden = false;

// Title orbit camera
let orbitAngle = 0;

// Win / Lose state
let winAnimTimer = 0;
let losePhase = 0; // 0=charging, 1=stomping, 2=done
let loseStompTimer = 0;
let squishProgress = 0;

// ---- UI References ----
const titleScreen = document.getElementById('title-screen');
const charSelect = document.getElementById('char-select');
const instructions = document.getElementById('instructions');
const winScreen = document.getElementById('win-screen');
const loseScreen = document.getElementById('lose-screen');
const winTimeEl = document.getElementById('win-time');
const instructionsDesc = document.getElementById('instructions-desc');
const panels = document.querySelectorAll('.scat-panel');

function showOnly(el) {
  [titleScreen, charSelect, instructions, winScreen, loseScreen].forEach(e => {
    e.classList.add('hidden');
  });
  if (el) el.classList.remove('hidden');
}

// ---- Character Select UI ----
panels.forEach((panel, i) => {
  panel.addEventListener('click', () => {
    selectedScatIndex = i;
    updatePanelSelection();
    audio.start();
  });
});

function updatePanelSelection() {
  panels.forEach((p, i) => {
    p.classList.toggle('selected', i === selectedScatIndex);
  });
}
updatePanelSelection();

// ---- Title Scene (background) ----
function initTitleScene() {
  // Create shared environment and elephant once
  if (!environment) environment = new Environment(scene);
  if (!elephant) elephant = new Elephant(scene);
}

// ---- Game Init ----
function startGame() {
  // Remove previous player if re-starting
  if (player) {
    scene.remove(player.group);
    player = null;
  }

  // Reset elephant to start position and patrol state
  elephant.group.position.set(0, 0, CONFIG.ELEPHANT_START_Z);
  elephant.group.rotation.set(0, 0, 0);
  elephant.state = ElephantState.PATROL;
  elephant.patrolPauseTimer = 0;
  elephant._pickNewPatrolTarget();

  timeRemaining = CONFIG.GAME_DURATION;
  detectionScore = 0;
  playerHidden = false;
  winAnimTimer = 0;
  losePhase = 0;
  loseStompTimer = 0;
  squishProgress = 0;

  const scatType = CONFIG.SCAT_TYPES[selectedScatIndex];

  player = new Player(scene, scatType);

  camController = new CameraController(camera);
  camController.azimuth = Math.PI; // Start facing toward elephant
  camController.snapTo(player.position);

  hud.show();
  hud.setScatInfo(scatType);

  requestPointerLock();
}

function requestPointerLock() {
  canvas.requestPointerLock();
}

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  hud.showPointerLockMsg(!locked && gameState === GameState.PLAYING);
});

canvas.addEventListener('click', () => {
  if (gameState === GameState.PLAYING && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
});

// ---- State Machine Transitions ----
function transitionTo(state) {
  gameState = state;

  switch (state) {
    case GameState.TITLE:
      showOnly(titleScreen);
      hud.hide();
      document.exitPointerLock();
      initTitleScene();
      break;

    case GameState.CHAR_SELECT:
      showOnly(charSelect);
      hud.hide();
      break;

    case GameState.INSTRUCTIONS: {
      showOnly(instructions);
      const scatType = CONFIG.SCAT_TYPES[selectedScatIndex];
      instructionsDesc.innerHTML =
        `You are a piece of <strong>${scatType.name}</strong> scat.<br>` +
        `Your mission: sneak into the elephant's rear end before time runs out.`;
      break;
    }

    case GameState.PLAYING:
      showOnly(null);
      startGame();
      break;

    case GameState.WIN: {
      document.exitPointerLock();
      const elapsed = CONFIG.GAME_DURATION - timeRemaining;
      const mins = Math.floor(elapsed / 60);
      const secs = Math.floor(elapsed % 60);
      winTimeEl.textContent = `Time: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      // Show win text after 3s so fireworks are clearly visible first
      setTimeout(() => showOnly(winScreen), 3000);
      audio.playTrumpet();
      // Auto-return to title after fireworks finish
      fireworks.start(() => transitionTo(GameState.TITLE));
      break;
    }

    case GameState.LOSE:
      document.exitPointerLock();
      setTimeout(() => showOnly(loseScreen), 3000);
      break;
  }
}

// ---- Detection System ----
function updateDetection(dt) {
  if (!player || !elephant) return;

  playerHidden = (
    environment.isPlayerInTallGrass(player.position) ||
    environment.isPlayerBehindBoulder(elephant.position, player.position)
  );

  if (playerHidden) {
    detectionScore = Math.max(0, detectionScore - dt * 0.5);
    return;
  }

  const dist = player.position.distanceTo(elephant.position);
  if (dist > CONFIG.ELEPHANT_DETECTION_RANGE) {
    detectionScore = Math.max(0, detectionScore - dt * 0.5);
    return;
  }

  // How much the elephant is facing the player (0 = facing away, 1 = facing directly)
  const elephantForward = elephant.getForward();
  const toPlayer = new THREE.Vector3().subVectors(player.position, elephant.position).normalize();
  const facingDot = elephantForward.dot(toPlayer); // -1 (away) to 1 (toward)
  // Convert to 0..1 range and apply a strong penalty for not looking
  // elephant facing away = near 0 awareness, side-on = 0.25, front = 1.0
  const facingFactor = Math.max(0, (facingDot + 1) / 2); // 0..1
  const awarenessMultiplier = facingFactor * facingFactor; // squared = steep falloff

  const newScore = player.noiseLevel
    * (1 - player.stealth / 10)
    * (1 - dist / CONFIG.ELEPHANT_DETECTION_RANGE)
    * awarenessMultiplier;

  // Reaction time: moderate build-up, still slower than original dt*3
  detectionScore = THREE.MathUtils.lerp(detectionScore, newScore, dt * 1.8);
  detectionScore = Math.max(0, Math.min(1, detectionScore));
}

// ---- Collision Resolution ----
function resolveCollisions() {
  if (!player || !environment) return;

  // Boulder collisions
  for (const box of environment.boulderBoxes) {
    const correction = sphereVsAABB(
      player.position,
      player.radius,
      box.min,
      box.max
    );
    if (correction) {
      player.group.position.add(correction);
    }
  }

  // Field boundary
  clampToField(player.group.position, CONFIG.FIELD_SIZE / 2, player.radius);

  // Elephant body collision (simplified AABB - block from sides and front)
  const eDist = distanceXZ(player.position, elephant.position);
  if (eDist < 7) {
    const anusPos = elephant.getAnusWorldPos();
    const distToAnus = player.position.distanceTo(anusPos);
    // Only block if not near anus
    if (distToAnus > CONFIG.ANUS_TRIGGER_DISTANCE + 1) {
      const pushDir = new THREE.Vector3()
        .subVectors(player.position, elephant.position)
        .setY(0)
        .normalize();
      player.group.position.x = elephant.position.x + pushDir.x * 7.5;
      player.group.position.z = elephant.position.z + pushDir.z * 7.5;
    }
  }
}

// ---- Win Condition Check ----
function checkWinCondition() {
  if (!player || !elephant) return false;

  const anusPos = elephant.getAnusWorldPos();
  const dist = player.position.distanceTo(anusPos);

  if (dist > CONFIG.ANUS_TRIGGER_DISTANCE) return false;

  // Must be behind elephant
  const forward = elephant.getForward();
  const toPlayer = new THREE.Vector3().subVectors(player.position, elephant.position).normalize();
  const dot = forward.dot(toPlayer);

  if (dot > -0.3) return false; // not behind

  // Must be jumping
  if (!player.isGrounded) return true;

  return false;
}

// ---- Main Update Functions per State ----
function updateTitle(dt) {
  // Orbit camera for title screen
  orbitAngle += dt * 0.3;
  camera.position.set(
    Math.sin(orbitAngle) * 40,
    15,
    Math.cos(orbitAngle) * 40
  );
  camera.lookAt(0, 5, 0);

  if (elephant) elephant.update(dt, new THREE.Vector3(999, 0, 999), 0, true);

  if (input.enterPressed) {
    transitionTo(GameState.CHAR_SELECT);
  }
}

function updateCharSelect(dt) {
  // Handle keyboard selection
  if (input.keys['1']) selectedScatIndex = 0;
  if (input.keys['2']) selectedScatIndex = 1;
  if (input.keys['3']) selectedScatIndex = 2;
  updatePanelSelection();

  if (input.enterPressed) {
    transitionTo(GameState.INSTRUCTIONS);
  }
}

function updateInstructions(dt) {
  if (input.enterPressed) {
    audio.start();
    transitionTo(GameState.PLAYING);
  }
}

function updatePlaying(dt) {
  if (!player || !elephant) return;

  // Timer
  timeRemaining -= dt;
  hud.updateTimer(Math.max(0, timeRemaining));

  if (timeRemaining <= 0) {
    transitionTo(GameState.LOSE);
    elephant.startCharge();
    audio.stopAmbient();
    return;
  }

  // Player update (pass elephant distance for proximity speed boost)
  const elephantDist = player.position.distanceTo(elephant.position);
  player.update(dt, input.keys, input.jumpPressed, camController, elephantDist);

  // Audio
  audio.update(dt, input.isMoving());
  if (input.jumpPressed) audio.playJump();

  // Detection
  updateDetection(dt);
  hud.updateStealthBar(detectionScore);

  // Elephant AI
  elephant.update(dt, player.position, detectionScore, playerHidden);

  // Check if elephant should push
  if (detectionScore > 0.3 && !playerHidden && elephant.state === ElephantState.ALERT) {
    const toPlayer = new THREE.Vector3().subVectors(player.position, elephant.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const forward = elephant.getForward();
    const dot = forward.dot(toPlayer.normalize());

    if (dot > 0.75 && dist < CONFIG.ELEPHANT_PUSH_RANGE) {
      player.applyPush(elephant.position, CONFIG.ELEPHANT_PUSH_FORCE);
      audio.playRumble();
    }
  }

  // Reset push count when player is safely hidden
  if (playerHidden && player.pushCount > 0) {
    player.resetPushCount();
  }

  // Resolve collisions
  resolveCollisions();

  // Camera
  camController.update(player.position, input.mouseX, input.mouseY, input.scrollDelta);

  // Win condition
  if (checkWinCondition()) {
    transitionTo(GameState.WIN);
    return;
  }

  // HUD arrow
  hud.updateElephantArrow(elephant.position, camera, window.innerWidth, window.innerHeight);
}

function updateWin(dt) {
  winAnimTimer += dt;

  // Animate scat toward anus
  if (winAnimTimer < 0.5 && elephant && player) {
    const anusPos = elephant.getAnusWorldPos();
    player.lerpToward(anusPos, 0.1);
  }

  fireworks.update(dt);

  // Enter skips fireworks early and returns to title
  if (input.enterPressed) {
    fireworks.stop();
    transitionTo(GameState.TITLE);
  }
  // Auto-transition happens via the fireworks completion callback
}

function updateLose(dt) {
  if (!elephant || !player) return;

  switch (losePhase) {
    case 0: // Charging
      elephant.update(dt, player.position, 1, false);
      if (elephant.hasReachedPlayer(player.position)) {
        losePhase = 1;
        loseStompTimer = 0;
        audio.playStormp();
      }
      break;

    case 1: // Stomping animation
      loseStompTimer += dt;
      const stompProgress = Math.min(1, loseStompTimer / 0.3);
      squishProgress = stompProgress;
      player.squish(squishProgress);

      // Elephant body bobs down then up
      if (elephant.body) {
        const bob = Math.sin(loseStompTimer * 15) * Math.exp(-loseStompTimer * 5);
        elephant.body.position.y = 8 - Math.abs(bob) * 2;
      }

      if (loseStompTimer > 1.5) losePhase = 2;
      break;

    case 2: // Done, waiting for input
      if (input.enterPressed) {
        transitionTo(GameState.TITLE);
      }
      break;
  }

  // Camera still tracks player during lose
  if (camController && player) {
    camController.update(player.position, 0, 0, 0);
  }
}

// ---- Render Loop ----
let lastTime = performance.now();

function loop() {
  requestAnimationFrame(loop);

  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = now;

  switch (gameState) {
    case GameState.TITLE:
      updateTitle(dt);
      break;
    case GameState.CHAR_SELECT:
      updateCharSelect(dt);
      // Keep orbit camera + title elephant running
      orbitAngle += dt * 0.3;
      camera.position.set(Math.sin(orbitAngle) * 40, 15, Math.cos(orbitAngle) * 40);
      camera.lookAt(0, 5, 0);
      if (elephant) elephant.update(dt, new THREE.Vector3(999, 0, 999), 0, true);
      break;
    case GameState.INSTRUCTIONS:
      updateInstructions(dt);
      orbitAngle += dt * 0.3;
      camera.position.set(Math.sin(orbitAngle) * 40, 15, Math.cos(orbitAngle) * 40);
      camera.lookAt(0, 5, 0);
      if (elephant) elephant.update(dt, new THREE.Vector3(999, 0, 999), 0, true);
      break;
    case GameState.PLAYING:
      updatePlaying(dt);
      break;
    case GameState.WIN:
      updateWin(dt);
      if (elephant) elephant.update(dt, new THREE.Vector3(999, 0, 999), 0, true);
      break;
    case GameState.LOSE:
      updateLose(dt);
      break;
  }

  renderer.render(scene, camera);
  input.flush();
}

// ---- Bootstrap ----
transitionTo(GameState.TITLE);
loop();
