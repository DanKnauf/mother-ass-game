/**
 * config.js
 * All tunable game constants. Adjust these values to balance gameplay.
 */

export const CONFIG = {
  // World
  FIELD_SIZE: 200,
  UNIT_SCALE: 1,

  // Timer
  GAME_DURATION: 180,

  // Starting positions
  PLAYER_START_Z: 30,
  ELEPHANT_START_Z: 0,

  // Elephant
  ELEPHANT_BODY_LENGTH: 12,
  ELEPHANT_BODY_HEIGHT: 8,
  ELEPHANT_MOVE_SPEED: 1.5,
  ELEPHANT_TURN_SPEED: 1.2,
  ELEPHANT_DETECTION_RANGE: 60,
  ELEPHANT_PUSH_FORCE: 15,
  ELEPHANT_PUSH_RANGE: 12,
  ELEPHANT_CALM_DOWN_TIME: 3,

  // Anus goal zone
  ANUS_TRIGGER_DISTANCE: 3,
  ANUS_JUMP_REQUIRED: true,

  // Player scat types (ordered array for indexing)
  SCAT_TYPES: [
    {
      key: 'GIRAFFE',
      name: 'Giraffe',
      description: 'Small pellets. Fast and agile, but easy to detect.',
      speed: 10,
      agility: 9,
      stealth: 3,
      size: 0.4,
      color: 0x3B2F1B,
      shape: 'cluster'
    },
    {
      key: 'CAPYBARA',
      name: 'Capybara',
      description: 'Medium oval. Balanced stats across the board.',
      speed: 7,
      agility: 6,
      stealth: 6,
      size: 0.7,
      color: 0x5C4A2A,
      shape: 'oval'
    },
    {
      key: 'SLOTH',
      name: 'Sloth',
      description: 'Large and lumpy. Slow but nearly silent.',
      speed: 4,
      agility: 3,
      stealth: 9,
      size: 1.0,
      color: 0x2E1F0F,
      shape: 'blob'
    }
  ],

  // Environment object counts
  TALL_GRASS_PATCHES: 25,
  BOULDER_COUNT: 15,
  SHORT_GRASS_PATCHES: 20,

  // Grass and boulder sizing
  TALL_GRASS_HEIGHT: 3.5,
  TALL_GRASS_RADIUS: 2.5,
  BOULDER_MIN_SIZE: 2.0,
  BOULDER_MAX_SIZE: 4.0,

  // Audio
  MOVE_SOUND_INTERVAL: 0.3,
  JUMP_SOUND_PITCH: 0.5,

  // Camera
  CAMERA_DISTANCE: 6,
  CAMERA_HEIGHT: 2.5,
  CAMERA_SMOOTHING: 0.1,

  // Fireworks
  FIREWORK_DURATION: 10,
  FIREWORK_COUNT: 50
};
