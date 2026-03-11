# Mother Ass: Game Design & Build Specification

## Overview

**Mother Ass** is a single-player 3D stealth game built entirely in the browser. The player controls a piece of animal scat and must sneak up behind a large African elephant to jump into its anus before a five-minute timer runs out. The elephant patrols an outdoor field and reacts to the player's noise, turning to face (and push back) the scat if detected. Tall grass patches and boulders provide cover. The tone is humorous and lighthearted.

---

## Visual Reference & Art Direction

The following description is based on a reference screenshot that defines the target look and feel for the game. Use this as the primary visual guide when building the environment, camera framing, and overall atmosphere.

**Reference Scene Description:**

The image shows a third-person view from ground level, looking through dense, tall grass blades that tower above the player character. The grass is vibrant, saturated green with individual pointed blades clearly visible, some catching sunlight and appearing bright yellow-green while others fall into darker green shadow. The blades are thick, wide, and spiky rather than thin and wispy. They fill the bottom two-thirds of the screen, creating a strong sense of being small and hidden within vegetation.

Beyond the grass, the middle ground opens into a flat, bright green field. A large gray African elephant stands in the field at moderate distance, clearly visible as a silhouette against the sky. The elephant's body is massive relative to the camera, reinforcing the scale difference between the tiny scat player and the enormous target. Scattered around the field are several large, rounded boulders with earthy gray-brown coloring, some as tall as the elephant's legs. A few sparse trees dot the landscape in the far background.

The background features rolling green hills or low mountains along the horizon, with a bright blue sky and soft white clouds above. The overall lighting is warm daylight with strong directional sunlight from above, casting visible highlights on the grass tips and the elephant's back.

A small brown, lumpy character (the player) is partially visible among the grass blades in the center of the frame, slightly obscured by the surrounding vegetation. This is exactly the intended gameplay perspective: the player peeks through cover toward the distant elephant, planning their next move.

The bottom-right corner of the screen shows a HUD element indicating position or rank, and there is a small identifier label floating above the player character.

**Key Art Direction Takeaways for Implementation:**

1. **Grass blade geometry matters.** The tall grass should not be thin hair-like strands. Each blade should be a flat, wide, pointed polygon (use `PlaneGeometry` or thin `BoxGeometry` with a triangular taper). Width of each blade should be 0.15 to 0.3 units, height 2.5 to 4.0 units. This gives the dense, spiky look seen in the reference.

2. **Grass density should be high within patches.** Each tall grass patch should contain 60 to 100 blades (more than the base spec of 30 to 50) to create the thick wall-of-grass effect. Blades should have slight random rotation around the Y axis and a gentle lean (5 to 15 degree tilt on X or Z) so they do not look like a uniform fence.

3. **Color variation in grass is critical.** Do not use a single green. Each blade should have a random color between bright yellow-green (`0x8BC34A`) and deep green (`0x2E7D32`). This variation, combined with the directional light, creates the lush, alive look from the reference.

4. **Camera height should feel low to the ground.** The default camera position should sit just above the scat character, roughly 2 to 3 units off the ground, so that tall grass fills much of the screen when the player is inside a patch. This creates the immersive "hiding in the weeds" perspective.

5. **The elephant should loom on the horizon.** When the player is at starting distance (30 units away), the elephant should be clearly visible but feel large and imposing against the sky. The scale of the elephant model relative to the scat should convey that the elephant is a massive, dangerous obstacle.

6. **Boulders should be rounded and large.** Use `IcosahedronGeometry` or `DodecahedronGeometry` with a subdivision level of 1 (slightly smoothed) to get the rounded-rock look from the reference rather than perfectly faceted crystals. Color them with warm gray-brown tones (`0x8B8682`, `0x9E9589`) rather than pure gray.

7. **Background hills add depth.** Add 3 to 5 large, distant, low-poly hill shapes along the edges of the field using scaled `SphereGeometry` halves (top hemisphere only) with a muted green color (`0x5B8C3E`). These are non-interactive scenery that frames the playfield and prevents the world from feeling like a flat empty plane.

8. **Lighting should be warm and directional.** The directional light should cast from a high angle (simulating midday sun) with a warm tint (`0xFFF8E1`). This creates bright highlights on forward-facing grass blades and the elephant's back, matching the sunlit outdoor feel of the reference.

---

## Technology Stack

Build this game using the following stack. **Do not use any external asset files.** All 3D models, textures, sounds, and visual effects must be generated procedurally in code.

| Layer | Technology | Notes |
|---|---|---|
| 3D Engine | **Three.js** (r128+) | Import via CDN or npm |
| Physics/Collision | Custom lightweight AABB + raycasting | No heavy physics engine needed |
| Audio | **Tone.js** | Procedural sound synthesis for all sound effects |
| UI/HUD | HTML/CSS overlay on the Three.js canvas | Timer, instructions, menus |
| Build Tool | Vite (or plain HTML if simpler) | Single-page app, no server required |
| Language | JavaScript (ES modules) | TypeScript optional but not required |

### Critical Constraint

**All visual assets and 3D models must be generated procedurally using Three.js geometry primitives** (BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, etc.). Do not reference or load any external image files, GLTF models, OBJ files, or texture images. Use `MeshLambertMaterial` or `MeshPhongMaterial` with flat hex colors for all surfaces. Low-poly aesthetic is intentional and desirable.

---

## Project Structure

```
mother-ass/
  index.html
  src/
    main.js            # Entry point, game loop, scene setup
    player.js          # Scat character class, movement, rolling animation
    elephant.js        # Elephant model, AI behavior, patrol, detection
    environment.js     # Ground plane, grass patches, boulders, skybox
    camera.js          # Third-person camera controller
    hud.js             # Timer, instructions overlay, win/lose screens
    audio.js           # All procedural sound effects via Tone.js
    input.js           # Keyboard + mouse input manager
    particles.js       # Fireworks particle system for win state
    config.js          # All tunable game constants (speeds, sizes, times)
    collision.js       # AABB and proximity-based collision detection
  style.css            # Minimal styles for HUD overlay
```

---

## Game Constants (config.js)

Define all tunable values in a single config file so balancing is easy. Use these starting values:

```js
export const CONFIG = {
  // World
  FIELD_SIZE: 200,             // Total field is 200x200 units
  UNIT_SCALE: 1,               // 1 unit = approx 1 foot

  // Timer
  GAME_DURATION: 300,          // 5 minutes in seconds

  // Starting positions
  PLAYER_START_Z: 30,          // Scat starts 30 units from elephant
  ELEPHANT_START_Z: 0,         // Elephant starts at origin

  // Elephant
  ELEPHANT_BODY_LENGTH: 12,
  ELEPHANT_BODY_HEIGHT: 8,
  ELEPHANT_MOVE_SPEED: 1.5,
  ELEPHANT_TURN_SPEED: 1.2,    // Radians per second when turning toward player
  ELEPHANT_DETECTION_RANGE: 60,
  ELEPHANT_PUSH_FORCE: 15,     // How hard player is pushed back
  ELEPHANT_PUSH_RANGE: 12,     // Distance at which push activates
  ELEPHANT_CALM_DOWN_TIME: 3,  // Seconds to lose interest when hidden

  // Anus goal zone
  ANUS_TRIGGER_DISTANCE: 3,    // Must be within 3 units of rear
  ANUS_JUMP_REQUIRED: true,    // Player must jump to trigger win

  // Player scat types
  SCAT_TYPES: {
    GIRAFFE: {
      name: "Giraffe",
      description: "Small pellets. Fast and agile, but easy to detect.",
      speed: 10,
      agility: 9,
      stealth: 3,
      size: 0.4,               // Radius of the scat sphere
      color: 0x3B2F1B,         // Dark brown
      shape: "cluster"         // Multiple small spheres clustered
    },
    CAPYBARA: {
      name: "Capybara",
      description: "Medium oval. Balanced stats across the board.",
      speed: 7,
      agility: 6,
      stealth: 6,
      size: 0.7,
      color: 0x5C4A2A,         // Medium brown
      shape: "oval"            // Elongated sphere
    },
    SLOTH: {
      name: "Sloth",
      description: "Large and lumpy. Slow but nearly silent.",
      speed: 4,
      agility: 3,
      stealth: 9,
      size: 1.0,
      color: 0x2E1F0F,         // Very dark brown
      shape: "blob"            // Irregular lumpy sphere
    }
  },

  // Environment object counts
  TALL_GRASS_PATCHES: 25,
  BOULDER_COUNT: 15,
  SHORT_GRASS_PATCHES: 20,

  // Grass and boulder sizing
  TALL_GRASS_HEIGHT: 3.5,      // Must be taller than largest scat; range 2.5-4.0 per blade
  TALL_GRASS_RADIUS: 2.5,
  BOULDER_MIN_SIZE: 2.0,
  BOULDER_MAX_SIZE: 4.0,

  // Audio
  MOVE_SOUND_INTERVAL: 0.3,    // Seconds between squelch sounds while moving
  JUMP_SOUND_PITCH: 0.5,       // Lower pitch = bigger squelch

  // Camera -- low angle per reference image
  CAMERA_DISTANCE: 6,
  CAMERA_HEIGHT: 2.5,          // Low to the ground so grass fills screen when hiding
  CAMERA_SMOOTHING: 0.1,

  // Fireworks
  FIREWORK_DURATION: 10,       // Seconds
  FIREWORK_COUNT: 50
};
```

---

## 3D Model Specifications

### The Scat (Player Character)

Build each scat type from primitive geometries. No textures. Solid color materials only.

**Giraffe Scat ("cluster")**
- Create 5 to 7 small `SphereGeometry` objects (radius 0.15 to 0.25 each)
- Group them into a `THREE.Group` so they form an irregular cluster
- Color: `0x3B2F1B` with `MeshLambertMaterial`
- Add slight random offset to each sphere's position so it looks organic

**Capybara Scat ("oval")**
- Use a single `SphereGeometry` with different X/Y/Z scale to create an elongated oval
- Scale roughly `(1.0, 0.7, 1.3)` applied to the mesh
- Color: `0x5C4A2A`
- Add 2 to 3 smaller bumps (tiny spheres) on the surface for texture

**Sloth Scat ("blob")**
- Use a base `SphereGeometry` (radius 1.0)
- Attach 3 to 5 additional smaller spheres at random surface points to create a lumpy, irregular shape
- Color: `0x2E1F0F`
- Make it visually the largest of the three

**Rolling Animation:**
When the scat moves, rotate the mesh group around the axis perpendicular to the movement direction. The rotation speed should be proportional to movement speed. This simulates the scat rolling across the ground.

---

### The Elephant (Target / Antagonist)

Build the elephant entirely from Three.js primitives. Aim for a recognizable low-poly elephant silhouette. Here is the construction breakdown:

**Body:**
- `BoxGeometry(12, 6, 7)` slightly rounded by using a large-radius sphere or just a box
- Color: `0x808080` (gray)
- Position at y = 5 (legs raise it off the ground)

**Head:**
- `SphereGeometry(3, 8, 8)` (low poly sphere)
- Attach to front of body
- Color: `0x909090` (slightly lighter gray)

**Ears (2x):**
- `CircleGeometry(2.5, 6)` or flattened `SphereGeometry`
- Attach to sides of head
- Color: `0x707070`
- Slight rotation outward

**Trunk:**
- Build from 4 to 5 `CylinderGeometry` segments, each slightly smaller, arranged in a gentle curve downward
- Attach to front-bottom of head
- Color: `0x808080`
- The trunk should sway gently using a sine wave animation on each segment's rotation

**Legs (4x):**
- `CylinderGeometry(1.2, 1.0, 5, 8)` for each leg
- Position at four corners under the body
- Color: `0x707070`
- Animate with a simple walk cycle: alternate pairs of legs move forward/back slightly using sine waves

**Tail:**
- Thin `CylinderGeometry(0.2, 0.1, 3, 6)`
- Attach to rear of body, angled slightly upward
- Small tuft at the end: a tiny `SphereGeometry(0.3)`

**Anus (Goal Zone):**
- `CircleGeometry(0.8, 8)` or `TorusGeometry(0.5, 0.2, 8, 8)`
- Color: `0x4A3030` (dark pinkish brown)
- Position directly beneath the tail at the rear of the body
- This is the goal hitbox. Make it visible but not obnoxiously prominent.
- Add a subtle pulsing scale animation so the player can identify it

**Eyes (2x):**
- Small `SphereGeometry(0.4)` on the head
- Color: `0x111111` (near black) with a white `SphereGeometry(0.5)` behind each
- Position on the front-facing side of the head

**Walking Animation:**
- Legs alternate in pairs (front-left + back-right, then front-right + back-left)
- Use sine-based oscillation on the leg rotation
- Trunk sways left to right gently
- Tail flicks occasionally (random interval, small rotation)

---

### Environment

**Ground Plane:**
- Large `PlaneGeometry(200, 200)` rotated to be horizontal
- Color: `0x7CBA3F` (grass green)
- Apply a second slightly darker plane underneath as a subtle shadow base

**Short Grass Patches (decorative, no gameplay function):**
- Clusters of thin `BoxGeometry(0.05, 0.5, 0.05)` objects (blades)
- 20 to 40 blades per patch, randomly positioned within a 2-unit radius
- Color: `0x5A9E2F` (slightly darker green)
- Height: 0.3 to 0.6 units (shorter than scat)
- Scatter 20 patches randomly across the field

**Tall Grass Patches (provide cover) -- see Visual Reference section for target look:**
- Use wide, flat, pointed blades: `PlaneGeometry(0.2, 3.0)` or thin `BoxGeometry(0.2, 3.0, 0.02)` with vertices tapered to a point at the top. Double-sided material so blades are visible from both sides.
- 60 to 100 blades per patch, randomly positioned within a 2.5-unit radius
- Each blade gets a slight random Y-axis rotation and a gentle lean (5 to 15 degrees tilt on X or Z axis) for an organic, non-uniform look
- Color: randomize each blade between bright yellow-green (`0x8BC34A`) and deep green (`0x2E7D32`). Do NOT use a single flat color.
- Height: 2.5 to 4.0 units (must be taller than the largest scat)
- Scatter 25 patches across the field, biased toward the area between player start and elephant
- Each patch has an invisible collision sphere for hide detection
- When the player is inside a tall grass patch, the blades should fill much of the screen from the low camera angle, creating the "peeking through cover" effect from the reference image

**Boulders (provide cover) -- see Visual Reference section for target look:**
- Use `IcosahedronGeometry(size, 1)` or `DodecahedronGeometry(size, 1)` with subdivision level 1 for a rounded, natural rock look (not sharp crystal facets)
- Random size between 2.0 and 4.0 units
- Color: warm gray-brown tones, randomize between `0x8B8682` and `0x9E9589` (not pure gray)
- Scatter 15 boulders across the field, biased toward the play area
- Each boulder has an AABB collision box for hide detection and physical blocking

**Skybox / Background:**
- Set `scene.background` to a light blue color: `0x87CEEB`
- Optionally add a large `SphereGeometry` inverted (normals facing inward) with a gradient from light blue (top) to white (horizon) using vertex colors
- Add a simple yellow `SphereGeometry` in the sky as the sun, with a `PointLight` at the same position

**Background Hills (non-interactive scenery):**
- Add 3 to 5 large, distant hill shapes along the edges of the field to frame the playfield
- Use the top half of `SphereGeometry(40, 8, 4)` scaled vertically to 0.3 to 0.5 to create low, rolling hill silhouettes
- Position them at Z distances of 80 to 120 units from center, spread along the horizon
- Color: muted green (`0x5B8C3E`) to distinguish from the brighter field grass
- These are purely visual. No collision. They prevent the world from feeling like a flat empty plane and match the rolling-hills backdrop in the reference image.

**Sparse Background Trees (non-interactive scenery):**
- Add 5 to 8 simple trees in the mid-to-far distance
- Trunk: `CylinderGeometry(0.3, 0.4, 4, 6)`, color `0x5D4037` (brown)
- Canopy: `SphereGeometry(2.5, 6, 6)` or `IcosahedronGeometry(2.5, 0)`, color `0x388E3C` (tree green)
- Scatter them at distances of 50 to 90 units from center
- No collision. Decorative only. Adds depth to the scene.

**Lighting:**
- One `DirectionalLight` angled from above-right (simulating midday sun), intensity 1.0, color `0xFFF8E1` (warm sunlight, per reference image)
- One `AmbientLight`, intensity 0.4, color `0xFFFFFF`
- Optional: `HemisphereLight` with sky color `0x87CEEB` and ground color `0x7CBA3F`

---

## Game States & Flow

The game progresses through these states:

```
TITLE_SCREEN -> CHARACTER_SELECT -> INSTRUCTIONS -> PLAYING -> WIN or LOSE
```

### State: TITLE_SCREEN

- Display the game title "MOTHER ASS" in large bold text, centered on screen
- Subtitle: "A Stealth Game of Questionable Dignity"
- Below: "Press ENTER to Begin"
- Background: Render the 3D scene with the elephant idly walking around. The camera slowly orbits the scene.

### State: CHARACTER_SELECT

- Display: "Choose Your Scat" as heading
- Show three panels side by side, each containing:
  - The scat type name (Giraffe, Capybara, Sloth)
  - A rotating 3D preview of that scat rendered in a small viewport or simply described with stats
  - Stat bars for Speed, Agility, Stealth (visual bars filled proportionally)
  - The description text from config
- Player clicks a panel or presses 1, 2, or 3 to select
- Highlight the selected scat. Display "Press ENTER to confirm" at the bottom.

### State: INSTRUCTIONS

- Display on screen overlay (semi-transparent dark background):

```
HOW TO PLAY
-----------
You are a piece of [selected animal] scat.
Your mission: sneak into the elephant's rear end before time runs out.

CONTROLS:
  W / A / S / D  -  Move (hold to keep moving)
  Mouse Move     -  Look around
  Scroll Wheel   -  Zoom in / out
  Space Bar      -  Jump (required to enter the goal)

TIPS:
  - The elephant hears you move. Stay hidden in tall grass or behind boulders.
  - If the elephant faces you, it will push you away. Back off or hide!
  - Approach from behind. Stealth is your friend.

Press ENTER to start.
```

### State: PLAYING

- The main gameplay loop. Details in sections below.
- Timer counts down from 5:00 in the top-center of the HUD.
- A small compass or arrow always points toward the elephant so the player knows which direction to go.

### State: WIN

- Triggered when the player jumps within `ANUS_TRIGGER_DISTANCE` of the elephant's rear while behind the elephant.
- Sequence:
  1. Freeze gameplay. Scat flies toward the anus in a short animation (lerp position over 0.5 seconds).
  2. Play the elephant trumpet sound (Tone.js).
  3. Screen text: "YOU DID IT!" in large text.
  4. Launch fireworks particle effect for 10 seconds.
  5. Display final time remaining.
  6. After fireworks: "Press ENTER to play again."

### State: LOSE

- Triggered when the timer reaches 0:00.
- Sequence:
  1. Timer flashes red at 0:00.
  2. The elephant turns toward the scat and charges (accelerated movement toward scat position).
  3. When the elephant reaches the scat, play a stomping animation (elephant body moves down then up quickly).
  4. Play a squish sound.
  5. Flatten the scat mesh (scale Y to 0.05 over 0.3 seconds).
  6. Screen text: "SQUISHED!" with a subtitle "The elephant wins this round."
  7. After 3 seconds: "Press ENTER to try again."

---

## Core Gameplay Mechanics

### Player Movement

- **WASD** keys move the scat relative to the camera's forward direction.
  - W = forward (toward where camera faces), S = backward, A = strafe left, D = strafe right.
  - Holding a key produces continuous movement. Releasing stops movement (with a tiny deceleration for feel).
- **Movement speed** is determined by the scat type's `speed` attribute. Multiply the base vector by `speed * 0.5` for the actual units-per-second velocity.
- **Agility** affects turning. When the player changes direction, the scat's actual velocity vector lerps toward the desired direction. Lerp factor = `agility * 0.1`. Low agility = sluggish turning. High agility = snappy turning.
- **Rolling:** As the scat moves, rotate the scat mesh around the axis perpendicular to the velocity vector. Rotation rate = `velocity.length() * 2.0` radians per second.
- **Jumping:** Pressing Space applies an upward velocity. The scat follows a simple parabolic arc (apply gravity each frame). Jump height should be about 2x the scat's radius. Only allow jumping when grounded (y position <= scat radius).
- **Ground clamping:** The scat's Y position should never go below its radius. After jump, when Y falls to radius, set vertical velocity to zero.

### Elephant AI Behavior

The elephant has these behavioral states:

**IDLE / PATROL:**
- The elephant wanders randomly within a central area (40x40 unit box around origin).
- Pick a random target point, walk toward it at `ELEPHANT_MOVE_SPEED * 0.5`, and when reached (within 2 units), pause for 1 to 3 seconds, then pick a new target.
- During patrol, the elephant's facing direction matches its movement direction.

**ALERT:**
- Triggered when the player moves and is within `ELEPHANT_DETECTION_RANGE` AND is not hidden.
- The elephant stops patrolling and turns toward the player's position.
- Turn speed: `ELEPHANT_TURN_SPEED` radians per second.
- The alert trigger has a delay based on the player's stealth: `delay = (player.stealth / 10) * 2.0` seconds. During this delay, the player can stop moving or hide to avoid detection.
- While alert, the elephant faces the player and does not move toward the player (it just stares).

**PUSH:**
- If the elephant is alert AND facing the player (dot product of elephant's forward vector and direction-to-player > 0.8) AND the player is within `ELEPHANT_PUSH_RANGE`:
  - Apply a push force to the player. The push direction is from the elephant toward the player. Push magnitude = `ELEPHANT_PUSH_FORCE`.
  - The player slides backward rapidly (lerp position away over 0.5 seconds).
  - Play a low rumble sound.

**CALM_DOWN:**
- If the player is hidden (behind tall grass or boulder) or has not moved for `ELEPHANT_CALM_DOWN_TIME` seconds:
  - The elephant gradually loses interest. Over 2 seconds, it returns to IDLE/PATROL.
  - The elephant turns away from the player's last known position and picks a new patrol point.

**CHARGE (Lose State only):**
- On game over, the elephant ignores all other behavior.
- It turns toward the scat and moves at 3x normal speed directly to the scat's position.
- On arrival, trigger the stomp animation.

### Noise & Detection System

- **Noise generation:** The player generates noise proportional to their movement speed.
  - `noiseLevel = currentSpeed / maxSpeed` (range 0 to 1)
  - Jumping generates a burst of noise: `noiseLevel = 1.0` for 0.5 seconds.
  - Standing still: `noiseLevel = 0`.

- **Detection calculation (each frame):**
  ```
  detectionScore = noiseLevel * (1 - (player.stealth / 10)) * (1 - (distance / DETECTION_RANGE))
  ```
  - If `detectionScore > 0.3`, the elephant enters ALERT state (after stealth delay).
  - If `detectionScore <= 0.1`, the elephant begins to calm down.

- **Hidden state:** The player is considered hidden if:
  - The player is within the radius of a tall grass patch AND the line of sight from the elephant's head to the player is occluded by the grass patch center. (Simplified: if distance from player to grass patch center < `TALL_GRASS_RADIUS`, player is hidden.)
  - OR the player is behind a boulder relative to the elephant. (Simplified: the angle from elephant to player passes through a boulder's AABB.)
  - When hidden, `detectionScore` is forced to 0 regardless of movement.

### Camera System

- Third-person camera positioned behind and above the scat.
- **Default position:** `CAMERA_DISTANCE` units behind the scat, `CAMERA_HEIGHT` units above, looking at the scat.
- **Mouse movement:** Horizontal mouse movement orbits the camera around the scat (changes the azimuth angle). Vertical mouse movement adjusts the camera's pitch (elevation angle), clamped between 10 degrees and 80 degrees above horizontal.
- **Scroll wheel:** Adjusts `CAMERA_DISTANCE` between 4 (close) and 20 (far).
- **Smoothing:** Camera position lerps toward its target each frame with factor `CAMERA_SMOOTHING` for smooth following.
- **Pointer lock:** On game start, request pointer lock so mouse movement is captured without the cursor leaving the window. Show a message if pointer lock fails.
- **Important:** The camera must keep the elephant visible at all times. If the elephant is not in the camera frustum, add a small UI arrow at the screen edge pointing toward the elephant.

### Collision Detection

- **Scat vs. Boulders:** Prevent the scat from passing through boulders. Use sphere-vs-AABB collision. On collision, push the scat out along the collision normal.
- **Scat vs. Field Boundary:** Keep the scat within the field. If scat position exceeds `FIELD_SIZE / 2` on any axis, clamp it.
- **Scat vs. Elephant body:** If the scat touches the elephant body from the side or front, block movement (treat elephant as a large AABB). The scat can only pass the anus hitbox at the rear.
- **Win condition hitbox:** A sphere trigger zone at the elephant's rear, radius `ANUS_TRIGGER_DISTANCE`. If the scat enters this zone AND:
  - The player is pressing Space (jumping) AND
  - The scat is behind the elephant (dot product of elephant's forward and direction from elephant to scat < -0.5)
  - Then trigger WIN state.

---

## Audio Specification (Tone.js)

Generate all sounds procedurally. Do not load any audio files.

### Movement Squelch

- Use a `Tone.NoiseSynth` with a very short envelope (attack: 0.01, decay: 0.1, sustain: 0).
- Filter with a `Tone.AutoFilter` or `BiquadFilter` set to lowpass around 800 Hz.
- Trigger every `MOVE_SOUND_INTERVAL` seconds while the scat is moving.
- Randomize the filter frequency slightly each trigger (700 to 900 Hz) for variation.

### Jump Squelch

- Same as movement squelch but louder (volume +6dB) and lower filter cutoff (400 to 600 Hz).
- Slightly longer decay (0.2 seconds).
- Single trigger on spacebar press.

### Elephant Trumpet (Win)

- Use `Tone.Synth` with a sawtooth oscillator.
- Play a note sequence: start at C3, bend up to G3 over 0.3 seconds, hold for 0.5 seconds.
- Add vibrato with `Tone.Vibrato` (frequency 6 Hz, depth 0.3).
- Apply a bandpass filter around 500 Hz for a brassy quality.

### Elephant Rumble (Push)

- Use `Tone.Synth` with a sine wave at very low frequency (40 to 60 Hz).
- Short burst, 0.3 seconds.
- Low volume, more felt than heard.

### Stomp Sound (Lose)

- Use `Tone.NoiseSynth` with a sharp attack and medium decay (attack: 0.001, decay: 0.5).
- Filter at 200 Hz lowpass for a deep thud.
- Follow with a shorter, higher-pitched squelch (the scat being squished).

### Firework Pops (Win Celebration)

- Use `Tone.NoiseSynth` with very short envelope (attack: 0.001, decay: 0.05).
- Filter at 2000 Hz highpass for a crackling pop.
- Trigger at random intervals (0.1 to 0.4 seconds) during the firework sequence.
- Vary pitch randomly.

### Ambient Background

- Optional: a very quiet, low-frequency `Tone.Noise("brown")` played continuously at low volume for outdoor ambience.

---

## Particle System: Fireworks (Win State)

- Create a simple particle system using `THREE.Points` or individual small `THREE.Mesh` objects.
- On win:
  1. Every 0.2 seconds, spawn a "firework" at a random position above the scene (y = 20 to 40, x/z random within 30 units).
  2. Each firework is a burst of 20 to 50 particles.
  3. Particles start at the burst origin and fly outward in random directions with initial velocity.
  4. Apply gravity (particles arc downward).
  5. Each particle is a small `SphereGeometry(0.1)` or a `Points` vertex with a random bright color (red, gold, green, blue, white, purple).
  6. Particles fade out over 1 to 2 seconds (reduce material opacity).
  7. Remove particles when opacity reaches 0.
- Run the firework loop for 10 seconds, then stop spawning new bursts. Let remaining particles fade out.

---

## HUD / UI Overlay

Build the HUD as HTML elements positioned over the Three.js canvas using CSS `position: absolute`. Do not use Three.js sprites for UI text.

### Timer Display

- Position: top center of screen.
- Format: `MM:SS` counting down from `05:00`.
- Font: monospace, white, with a subtle dark text shadow.
- When timer < 30 seconds, text color changes to red and pulses (opacity oscillation).
- When timer hits 0:00, flash the display.

### Elephant Direction Indicator

- A small arrow or chevron icon at the edge of the screen that points toward the elephant when the elephant is off-screen.
- Use a simple CSS triangle or Unicode arrow character.
- Calculate screen-space position of elephant; if outside viewport, show the arrow on the nearest screen edge.

### Stealth Indicator (optional but recommended)

- A small bar or icon showing current detection level.
- Position: bottom left.
- Green when undetected, yellow when alert is building, red when detected.

### Character Stats Display (during gameplay)

- Small, unobtrusive display in the top-left showing the selected scat type name and icon.
- Show Speed / Agility / Stealth as tiny bar indicators.

---

## Input System (input.js)

### Keyboard

- Use `keydown` and `keyup` event listeners.
- Track the pressed state of: W, A, S, D, Space, Enter.
- WASD keys are not mutually exclusive (player can press W + D simultaneously to move diagonally forward-right).
- Space triggers jump only once per press (track a `jumpPressed` flag, reset on keyup).
- Enter key is only active during menu/overlay states (TITLE, CHARACTER_SELECT, INSTRUCTIONS, WIN, LOSE).

### Mouse

- On game start (PLAYING state), request `document.pointerLockElement` via `canvas.requestPointerLock()`.
- Read `movementX` and `movementY` from the `mousemove` event to rotate the camera orbit.
- Sensitivity multiplier: 0.002 radians per pixel.
- Read `wheel` event `deltaY` to adjust zoom distance. Sensitivity: 0.01 units per delta unit.

### Input During Menus

- During non-PLAYING states, release pointer lock.
- Mouse clicks on character selection panels should work normally.
- Keyboard number keys 1/2/3 select scat type during CHARACTER_SELECT.

---

## Performance Guidelines

- Target 60 FPS on a mid-range laptop.
- Keep total triangle count under 10,000 for the entire scene.
- Use `BufferGeometry` for all geometries (default in modern Three.js).
- Reuse geometries and materials where possible (e.g., all grass blades share one geometry and one material).
- Use `Object3D.visible = false` instead of removing/adding objects for show/hide logic.
- Limit the number of lights to 3 maximum (one directional, one ambient, one hemisphere).
- Dispose of particle geometries and materials when fireworks end.

---

## Step-by-Step Build Order

Follow this sequence to build the game incrementally. Test after each step.

1. **Scaffold the project.** Create the folder structure, `index.html` with a canvas, import Three.js. Get a blank scene rendering with a colored background and the ground plane. Confirm it runs in the browser.

2. **Build the elephant model.** Construct the elephant from primitives in `elephant.js`. Place it at the origin. Add the walk animation. Confirm you can see a recognizable elephant in the scene.

3. **Build the scat models.** Create all three scat types in `player.js`. Place one in the scene to verify. Add the rolling animation.

4. **Implement the camera system.** Build the third-person camera in `camera.js`. Attach it to the scat. Implement mouse look (orbit) and scroll zoom. Confirm smooth camera behavior.

5. **Implement player movement.** Wire up WASD and Space in `input.js`. Move the scat with proper speed, agility, and jumping. Confirm the scat rolls as it moves.

6. **Build the environment.** Generate tall grass patches, boulders, and short grass in `environment.js`. Scatter them across the field. Confirm cover objects are taller than the scat.

7. **Implement collision detection.** Add scat-vs-boulder, scat-vs-boundary, and scat-vs-elephant collisions. Confirm the scat cannot pass through objects.

8. **Implement elephant AI.** Add patrol, alert, push, and calm-down states. Wire up the noise/detection system. Confirm the elephant reacts to player movement and ignores the player when hidden.

9. **Implement the hiding mechanic.** Detect when the scat is in tall grass or behind a boulder. Suppress detection score. Confirm the elephant calms down when the player hides.

10. **Implement the win condition.** Add the anus hitbox. Detect when the player jumps into it from behind. Trigger the win state.

11. **Implement the lose condition.** Add the countdown timer. On timeout, trigger elephant charge and stomp.

12. **Add all audio.** Implement every sound effect in `audio.js` using Tone.js. Wire them to gameplay events.

13. **Build the HUD.** Add the timer, direction indicator, and stealth meter as HTML overlay.

14. **Build the menu screens.** Implement title screen, character select, instructions, win screen, and lose screen.

15. **Add fireworks.** Implement the particle system for the win celebration.

16. **Polish and balance.** Playtest. Adjust config values for fun gameplay. Ensure the game is winnable but challenging. Confirm all states flow correctly.

---

## Testing Checklist

Before considering the game complete, verify each of the following:

- [ ] Title screen displays and Enter key proceeds to character select.
- [ ] All three scat types are selectable and display correct stats.
- [ ] Instructions screen displays and Enter key starts the game.
- [ ] WASD moves the scat in the correct directions relative to the camera.
- [ ] Holding WASD keys produces continuous movement.
- [ ] Mouse movement orbits the camera around the scat.
- [ ] Scroll wheel zooms the camera in and out.
- [ ] Space bar makes the scat jump.
- [ ] The scat rolls visually when moving.
- [ ] The elephant walks around the field during idle/patrol.
- [ ] The elephant detects the moving scat and turns toward it.
- [ ] Stealth stat affects how quickly the elephant detects movement.
- [ ] The elephant pushes the scat backward when facing it at close range.
- [ ] Hiding in tall grass stops the elephant from detecting the scat.
- [ ] Hiding behind a boulder stops detection.
- [ ] The elephant calms down and returns to patrol when the scat is hidden.
- [ ] The countdown timer counts from 5:00 to 0:00 and displays correctly.
- [ ] Reaching the elephant's rear and jumping triggers the win state.
- [ ] Win state plays trumpet sound, shows fireworks for 10 seconds, displays victory text.
- [ ] Timer reaching zero triggers the lose state.
- [ ] Lose state shows elephant charging and stomping the scat flat.
- [ ] Squish sound plays on stomp.
- [ ] Movement squelch sounds play while the scat moves.
- [ ] Jump squelch sounds play on jump.
- [ ] After win or lose, pressing Enter restarts the game at the title screen.
- [ ] Game runs at 60 FPS or close to it.
- [ ] Scat cannot leave the field boundaries.
- [ ] Scat cannot pass through boulders.
- [ ] Camera always shows the scat in view.
- [ ] Direction indicator shows where the elephant is when off-screen.
- [ ] Each scat type feels distinct: Giraffe is fast/detected easily, Sloth is slow/hard to detect, Capybara is balanced.

---

## Final Notes for Claude Code

- **Do not ask for any external assets.** Generate everything in code.
- **Do not use any deprecated Three.js APIs.** Stick to r128-compatible code.
- **Test in a browser after each major step.** Use `npx vite` or `npx http-server` to serve the project locally.
- **If a feature is too complex to implement cleanly, simplify it.** A working game with simpler mechanics is better than a broken game with ambitious mechanics.
- **Keep the code well-commented.** Each file should have a header comment explaining its purpose.
- **The game should work in Chrome, Firefox, and Safari.** Test pointer lock behavior across browsers.
- **Have fun with it.** The tone is silly and irreverent. Lean into the humor.
