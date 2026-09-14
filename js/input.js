/**
 * Tracks whether W, A, S, and D are currently held down.
 * The game reads this each frame instead of moving the player inside key events.
 */
class Input {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    window.addEventListener("keydown", (event) => this.setKey(event, true));
    window.addEventListener("keyup", (event) => this.setKey(event, false));
  }

  isDown(key) {
    return this.keys[key] === true;
  }

  setKey(event, isPressed) {
    const key = event.key.toLowerCase();

    if (key in this.keys) {
      event.preventDefault();
      this.keys[key] = isPressed;
    }
  }
}
