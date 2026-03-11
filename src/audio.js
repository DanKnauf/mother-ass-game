/**
 * audio.js
 * All procedural sound effects via Tone.js.
 * Audio context is started on first user interaction.
 */

import * as Tone from 'tone';

export class AudioManager {
  constructor() {
    this._started = false;
    this._moveSoundTimer = 0;
    this.moveInterval = 0.3; // seconds between squelch sounds

    // All synths are created lazily after user interaction
    this._moveSynth = null;
    this._jumpSynth = null;
    this._trumpetSynth = null;
    this._rumbleSynth = null;
    this._stompSynth = null;
    this._fireworkSynth = null;
    this._ambientNoise = null;
  }

  async start() {
    if (this._started) return;
    try {
      await Tone.start();
      this._started = true;
      this._setupSynths();
    } catch (e) {
      console.warn('Audio failed to start:', e);
    }
  }

  _setupSynths() {
    // Movement squelch
    const moveFilter = new Tone.Filter(800, 'lowpass').toDestination();
    this._moveSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.01, decay: 0.12, sustain: 0, release: 0.01 }
    }).connect(moveFilter);
    this._moveSynth.volume.value = -18;

    // Jump squelch
    const jumpFilter = new Tone.Filter(500, 'lowpass').toDestination();
    this._jumpSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.01, decay: 0.22, sustain: 0, release: 0.01 }
    }).connect(jumpFilter);
    this._jumpSynth.volume.value = -12;

    // Elephant trumpet
    const vibrato = new Tone.Vibrato(6, 0.3).toDestination();
    const brassFilter = new Tone.Filter(500, 'bandpass').connect(vibrato);
    this._trumpetSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.5 }
    }).connect(brassFilter);
    this._trumpetSynth.volume.value = -8;

    // Elephant rumble
    this._rumbleSynth = new Tone.Synth({
      oscillator: { type: 'sine', frequency: 50 },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0, release: 0.1 }
    }).toDestination();
    this._rumbleSynth.volume.value = -20;

    // Stomp
    const stompFilter = new Tone.Filter(200, 'lowpass').toDestination();
    this._stompSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.1 }
    }).connect(stompFilter);
    this._stompSynth.volume.value = -6;

    // Firework pops
    const popFilter = new Tone.Filter(2000, 'highpass').toDestination();
    this._fireworkSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 }
    }).connect(popFilter);
    this._fireworkSynth.volume.value = -14;

    // Ambient
    this._ambientNoise = new Tone.Noise('brown').toDestination();
    this._ambientNoise.volume.value = -38;
    this._ambientNoise.start();
  }

  /** Update move sound timer and trigger if moving. */
  update(dt, isMoving) {
    if (!this._started) return;
    if (isMoving) {
      this._moveSoundTimer -= dt;
      if (this._moveSoundTimer <= 0) {
        this._moveSoundTimer = this.moveInterval;
        this.playMove();
      }
    } else {
      this._moveSoundTimer = 0;
    }
  }

  playMove() {
    if (!this._moveSynth) return;
    try { this._moveSynth.triggerAttackRelease('16n'); } catch (e) {}
  }

  playJump() {
    if (!this._jumpSynth) return;
    try { this._jumpSynth.triggerAttackRelease('8n'); } catch (e) {}
  }

  async playTrumpet() {
    if (!this._trumpetSynth) return;
    try {
      this._trumpetSynth.triggerAttack('C3');
      await new Promise(r => setTimeout(r, 300));
      this._trumpetSynth.frequency.rampTo('G3', 0.3);
      await new Promise(r => setTimeout(r, 500));
      this._trumpetSynth.triggerRelease();
    } catch (e) {}
  }

  playRumble() {
    if (!this._rumbleSynth) return;
    try { this._rumbleSynth.triggerAttackRelease(50, '8n'); } catch (e) {}
  }

  playStormp() {
    if (!this._stompSynth) return;
    try { this._stompSynth.triggerAttackRelease('4n'); } catch (e) {}
  }

  playFireworkPop() {
    if (!this._fireworkSynth) return;
    try { this._fireworkSynth.triggerAttackRelease('32n'); } catch (e) {}
  }

  stopAmbient() {
    if (this._ambientNoise) {
      try { this._ambientNoise.stop(); } catch (e) {}
    }
  }

  dispose() {
    this.stopAmbient();
    const synths = [
      this._moveSynth, this._jumpSynth, this._trumpetSynth,
      this._rumbleSynth, this._stompSynth, this._fireworkSynth, this._ambientNoise
    ];
    synths.forEach(s => { if (s) try { s.dispose(); } catch (e) {} });
  }
}
