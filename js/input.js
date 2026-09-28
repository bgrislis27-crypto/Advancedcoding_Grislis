// Watches the keyboard and mouse.
// WASD moves, Shift runs, E interacts, and the mouse looks around.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set(); // keys that went down this frame
    this.locked = false;
    this.lookX = 0;
    this.lookY = 0;

    window.addEventListener("keydown", (event) => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
      if (["Space", "KeyE"].includes(event.code)) event.preventDefault();
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    document.addEventListener("mousemove", (event) => {
      if (!this.locked) return;
      this.lookX += event.movementX;
      this.lookY += event.movementY;
    });

    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  // True once for the frame the key was pressed, then it resets.
  consumePress(code) {
    const pressed = this.pressed.has(code);
    this.pressed.delete(code);
    return pressed;
  }

  consumeLook() {
    const look = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return look;
  }

  movingForward() {
    return this.isDown("KeyW") || this.isDown("ArrowUp");
  }

  movingBack() {
    return this.isDown("KeyS") || this.isDown("ArrowDown");
  }

  movingLeft() {
    return this.isDown("KeyA");
  }

  movingRight() {
    return this.isDown("KeyD");
  }

  running() {
    return this.isDown("ShiftLeft") || this.isDown("ShiftRight");
  }

  lock() {
    this.canvas.requestPointerLock();
  }
}
