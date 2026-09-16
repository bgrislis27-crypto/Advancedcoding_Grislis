/**
 * Tracks whether the arrow keys are currently held down.
 * The game reads this each frame instead of moving the player inside key events.
 */
class Input {
  constructor() {
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    };

    window.addEventListener("keydown", (event) => this.setKey(event, true));
    window.addEventListener("keyup", (event) => this.setKey(event, false));
  }

  isDown(key) {
    return this.keys[key] === true;
  }

  setKey(event, isPressed) {
    if (event.key in this.keys) {
      event.preventDefault();
      this.keys[event.key] = isPressed;
    }
  }
}
