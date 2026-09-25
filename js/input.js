// This file watches the keyboard and mouse.
// The rest of the game asks this file "is W held down?" instead of
// listening to keys in many different places.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set(); // every key that is currently held down
    this.locked = false; // true after you click, so the mouse can turn the camera
    this.lookX = 0; // leftover mouse movement, used once then reset
    this.lookY = 0;
    this.drawing = false; // true while the left mouse button is held (draw the bow)

    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      // Stop arrow keys from scrolling the page.
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code); // the key is no longer held
    });

    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0) this.drawing = true; // 0 = left mouse button
    });

    window.addEventListener("mouseup", (event) => {
      if (event.button === 0) this.drawing = false;
    });

    document.addEventListener("mousemove", (event) => {
      if (!this.locked) return; // ignore mouse look until the cursor is hidden
      this.lookX += event.movementX;
      this.lookY += event.movementY;
    });

    document.addEventListener("pointerlockchange", () => {
      // Esc unlocks the mouse. This keeps our flag in sync with the browser.
      this.locked = document.pointerLockElement === canvas;
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  // These helpers let the player use WASD or the arrow keys.
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

  // Read how far the mouse moved, then reset so we don't reuse old movement.
  consumeLook() {
    const look = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return look;
  }

  // Hide the cursor and let the mouse turn the camera.
  lock() {
    this.canvas.requestPointerLock();
  }
}
