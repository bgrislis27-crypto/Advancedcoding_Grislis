// This file is the player: where you are, how you look around, and your survival stats.
// The camera is your eyes, so moving this class is what walks you through the forest.

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;

    // Start in the open meadow, looking toward the mountains.
    this.x = 0;
    this.z = 24;
    this.yaw = 0; // left / right look
    this.pitch = -0.04; // up / down look
    this.eyeHeight = 1.7;

    this.walkSpeed = 6.2; // units per second
    this.sprintSpeed = 10.5;

    // These numbers are shown on the HUD circles (0 to 100).
    this.stamina = 100;
    this.health = 100;
    this.hunger = 86;
    this.thirst = 74;

    this.bob = 0; // used to bounce the bow a little while walking
    this.speed = 0;

    this.syncCamera();
  }

  update(dt, input) {
    // Turn the camera with the mouse.
    const look = input.consumeLook();
    this.yaw -= look.x * 0.0022;
    this.pitch -= look.y * 0.0022;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch)); // don't flip the camera upside down

    // Q and E turn you if the mouse is not locked yet.
    if (!input.locked) {
      if (input.isDown("KeyQ")) this.yaw += 1.3 * dt;
      if (input.isDown("KeyE")) this.yaw -= 1.3 * dt;
    }

    // Build a movement direction from WASD / arrow keys.
    let dx = 0;
    let dz = 0;
    if (input.movingForward()) dz -= 1;
    if (input.movingBack()) dz += 1;
    if (input.movingLeft()) dx -= 1;
    if (input.movingRight()) dx += 1;

    const tryingToMove = dx !== 0 || dz !== 0;
    const sprint = tryingToMove && input.sprinting() && this.stamina > 1; // Shift + moving, and still have stamina
    const speed = sprint ? this.sprintSpeed : this.walkSpeed;

    if (tryingToMove) {
      // Keep diagonal movement the same speed as walking straight.
      const length = Math.hypot(dx, dz);
      dx /= length;
      dz /= length;

      // Rotate that direction so forward is the way the camera is facing.
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const worldX = dx * cos + dz * sin;
      const worldZ = dz * cos - dx * sin;
      const nextX = this.x + worldX * speed * dt;
      const nextZ = this.z + worldZ * speed * dt;

      // Only move if the next spot is inside the map and not inside a tree.
      if (!this.world.blocked(nextX, nextZ) && this.world.inBounds(nextX, nextZ)) {
        this.x = nextX;
        this.z = nextZ;
      }

      this.speed = speed;
      this.bob += dt * (sprint ? 11 : 8); // faster bob when sprinting
      this.stamina = Math.max(0, this.stamina - (sprint ? 18 : 4) * dt); // sprint uses stamina faster
    } else {
      this.speed = 0;
      this.stamina = Math.min(100, this.stamina + 14 * dt); // stamina comes back while standing
    }

    // Hunger and thirst go down slowly over time.
    this.hunger = Math.max(8, this.hunger - 0.35 * dt);
    this.thirst = Math.max(8, this.thirst - 0.45 * dt);

    this.syncCamera();
  }

  // Put the camera at the player's eyes, on top of the ground.
  syncCamera() {
    const ground = this.world.heightAt(this.x, this.z);
    this.camera.position.set(this.x, ground + this.eyeHeight, this.z);
    this.camera.rotation.order = "YXZ"; // turn left/right first, then look up/down
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
