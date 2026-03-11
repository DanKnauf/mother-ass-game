/**
 * input.js
 * Keyboard and mouse input manager. Tracks key states and mouse deltas.
 */

export class InputManager {
  constructor() {
    this.keys = {
      w: false, a: false, s: false, d: false,
      space: false, enter: false,
      '1': false, '2': false, '3': false
    };

    this.jumpPressed = false;     // single-fire jump flag
    this.enterPressed = false;    // single-fire enter flag
    this.mouseX = 0;              // accumulated mouse delta X this frame
    this.mouseY = 0;              // accumulated mouse delta Y this frame
    this.scrollDelta = 0;         // scroll wheel delta this frame

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onWheel = this._onWheel.bind(this);

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('wheel', this._onWheel, { passive: true });
  }

  _onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (!this.keys.space) {
        this.jumpPressed = true;
      }
      this.keys.space = true;
    }
    if (key === 'enter') {
      this.enterPressed = true;
      this.keys.enter = true;
    }
    if (key === 'w') this.keys.w = true;
    if (key === 'a') this.keys.a = true;
    if (key === 's') this.keys.s = true;
    if (key === 'd') this.keys.d = true;
    if (key === '1') this.keys['1'] = true;
    if (key === '2') this.keys['2'] = true;
    if (key === '3') this.keys['3'] = true;
  }

  _onKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === ' ' || e.code === 'Space') {
      this.keys.space = false;
    }
    if (key === 'enter') this.keys.enter = false;
    if (key === 'w') this.keys.w = false;
    if (key === 'a') this.keys.a = false;
    if (key === 's') this.keys.s = false;
    if (key === 'd') this.keys.d = false;
    if (key === '1') this.keys['1'] = false;
    if (key === '2') this.keys['2'] = false;
    if (key === '3') this.keys['3'] = false;
  }

  _onMouseMove(e) {
    this.mouseX += e.movementX || 0;
    this.mouseY += e.movementY || 0;
  }

  _onWheel(e) {
    this.scrollDelta += e.deltaY;
  }

  /** Call at end of each frame to consume single-fire flags and deltas. */
  flush() {
    this.jumpPressed = false;
    this.enterPressed = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.scrollDelta = 0;
  }

  isMoving() {
    return this.keys.w || this.keys.a || this.keys.s || this.keys.d;
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('wheel', this._onWheel);
  }
}
