/**
 * Keyboard + mouse look. Clicking the game locks the pointer so the mouse can turn the camera.
 */
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.locked = false;
    this.lookX = 0;
    this.lookY = 0;
    this.drawing = false;

    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0) this.drawing = true;
    });

    window.addEventListener("mouseup", (event) => {
      if (event.button === 0) this.drawing = false;
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

  movingForward() {
    return this.isDown("KeyW") || this.isDown("ArrowUp");
  }

  movingBack() {
    return this.isDown("KeyS") || this.isDown("ArrowDown");
  }

  movingLeft() {
    return this.isDown("KeyA") || this.isDown("ArrowLeft");
  }

  movingRight() {
    return this.isDown("KeyD") || this.isDown("ArrowRight");
  }

  sprinting() {
    return this.isDown("ShiftLeft") || this.isDown("ShiftRight");
  }

  consumeLook() {
    const look = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return look;
  }

  lock() {
    this.canvas.requestPointerLock();
  }
}
