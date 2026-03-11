/**
 * audio.js
 * All procedural sound effects and background music via Tone.js.
 * Audio context is started on first user interaction.
 */

import * as Tone from 'tone';

// Cheesy 16-step MIDI melody in C major (quarter notes @ 130 BPM ≈ 7.4s loop)
const MELODY_NOTES = [
  'C5', 'E5', 'G5', 'E5',
  'C5', 'G4', 'E4', 'G4',
  'F4', 'A4', 'C5', 'A4',
  'G4', 'E4', 'C4', null
];

// Walking bass line
const BASS_NOTES = [
  'C3', null, 'G3', null,
  'C3', null, 'F2', null,
  'F2', null, 'C3', null,
  'G2', null, 'C3', null
];

export class AudioManager {
  constructor() {
    this._started = false;
    this._moveSoundTimer = 0;
    this.moveInterval = 0.28;

    // Synths — all created lazily after user interaction
    this._moveSynth = null;
    this._bloopSynth = null;
    this._jumpSynth = null;
    this._trumpetSynth = null;
    this._rumbleSynth = null;
    this._stompSynth = null;
    this._fireworkSynth = null;
    this._ambientNoise = null;
    this._melSynth = null;
    this._bassSynth = null;
    this._melSeq = null;
    this._bassSeq = null;
    this._musicRunning = false;
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
    // --- Movement squelch (cheesy wet slap) ---
    const moveFilter = new Tone.Filter(700, 'lowpass').toDestination();
    this._moveSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.01 }
    }).connect(moveFilter);
    this._moveSynth.volume.value = -16;

    // Bloop pitch variation for extra cheesiness
    this._bloopSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.06, sustain: 0, release: 0.04 }
    }).toDestination();
    this._bloopSynth.volume.value = -30;

    // --- Jump (big squelchy thud) ---
    const jumpFilter = new Tone.Filter(450, 'lowpass').toDestination();
    this._jumpSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.005, decay: 0.25, sustain: 0, release: 0.05 }
    }).connect(jumpFilter);
    this._jumpSynth.volume.value = -10;

    // --- Elephant trumpet (win / anus entry) ---
    const vibrato = new Tone.Vibrato(5, 0.35).toDestination();
    const brassFilter = new Tone.Filter(600, 'bandpass').connect(vibrato);
    this._trumpetSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.04, decay: 0.1, sustain: 0.85, release: 0.6 }
    }).connect(brassFilter);
    this._trumpetSynth.volume.value = -4;

    // --- Elephant rumble (push) ---
    this._rumbleSynth = new Tone.Synth({
      oscillator: { type: 'sine', frequency: 55 },
      envelope: { attack: 0.04, decay: 0.35, sustain: 0, release: 0.15 }
    }).toDestination();
    this._rumbleSynth.volume.value = -18;

    // --- Stomp (elephant foot on scat) ---
    const stompFilter = new Tone.Filter(220, 'lowpass').toDestination();
    this._stompSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 }
    }).connect(stompFilter);
    this._stompSynth.volume.value = -4;

    // --- Firework pop (short bright crack) ---
    const popFilter = new Tone.Filter(2500, 'highpass').toDestination();
    this._fireworkSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.055, sustain: 0, release: 0.01 }
    }).connect(popFilter);
    this._fireworkSynth.volume.value = -12;

    // --- Ambient brown noise ---
    this._ambientNoise = new Tone.Noise('brown').toDestination();
    this._ambientNoise.volume.value = -40;
    this._ambientNoise.start();

    // --- Cheesy MIDI background music ---
    Tone.Transport.bpm.value = 130;

    this._melSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.12, sustain: 0.35, release: 0.25 }
    }).toDestination();
    this._melSynth.volume.value = -22;

    this._bassSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.28, sustain: 0.1, release: 0.12 }
    }).toDestination();
    this._bassSynth.volume.value = -26;

    this._melSeq = new Tone.Sequence((time, note) => {
      if (note) this._melSynth.triggerAttackRelease(note, '8n', time);
    }, MELODY_NOTES, '4n');

    this._bassSeq = new Tone.Sequence((time, note) => {
      if (note) this._bassSynth.triggerAttackRelease(note, '8n', time);
    }, BASS_NOTES, '4n');
  }

  // ---- Music control ----

  startMusic() {
    if (!this._started || this._musicRunning) return;
    try {
      if (Tone.Transport.state !== 'started') Tone.Transport.start();
      this._melSeq.start(0);
      this._bassSeq.start(0);
      this._musicRunning = true;
    } catch (e) {}
  }

  stopMusic() {
    if (!this._musicRunning) return;
    try {
      this._melSeq.stop();
      this._bassSeq.stop();
      this._musicRunning = false;
    } catch (e) {}
  }

  // ---- Per-frame update ----

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

  // ---- One-shot sounds ----

  playMove() {
    if (!this._moveSynth) return;
    try {
      this._moveSynth.triggerAttackRelease('16n');
      // Occasional cheesy bloop
      if (Math.random() < 0.3) {
        const pitch = 150 + Math.random() * 120;
        this._bloopSynth.triggerAttackRelease(pitch, '32n');
      }
    } catch (e) {}
  }

  playJump() {
    if (!this._jumpSynth) return;
    try { this._jumpSynth.triggerAttackRelease('8n'); } catch (e) {}
  }

  async playTrumpet() {
    if (!this._trumpetSynth) return;
    try {
      // Dramatic elephant call: C3 → G3 → C4 → slide down
      this._trumpetSynth.triggerAttack('C3');
      await new Promise(r => setTimeout(r, 200));
      this._trumpetSynth.frequency.rampTo('G3', 0.25);
      await new Promise(r => setTimeout(r, 300));
      this._trumpetSynth.frequency.rampTo('C4', 0.2);
      await new Promise(r => setTimeout(r, 400));
      this._trumpetSynth.frequency.rampTo('G3', 0.3);
      await new Promise(r => setTimeout(r, 400));
      this._trumpetSynth.triggerRelease();
    } catch (e) {}
  }

  playRumble() {
    if (!this._rumbleSynth) return;
    try { this._rumbleSynth.triggerAttackRelease(55, '8n'); } catch (e) {}
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
    this.stopMusic();
    const synths = [
      this._moveSynth, this._bloopSynth, this._jumpSynth, this._trumpetSynth,
      this._rumbleSynth, this._stompSynth, this._fireworkSynth, this._ambientNoise,
      this._melSynth, this._bassSynth
    ];
    synths.forEach(s => { if (s) try { s.dispose(); } catch (e) {} });
    if (this._melSeq) try { this._melSeq.dispose(); } catch (e) {}
    if (this._bassSeq) try { this._bassSeq.dispose(); } catch (e) {}
  }
}
