/**
 * First-person walker: mouse look, WASD/arrows, stamina sprint, and sticking to the terrain.
 */
export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.x = 2;
    this.z = 18;
    this.yaw = 0;
    this.pitch = -0.08;
    this.eyeHeight = 1.7;
    this.walkSpeed = 6.2;
    this.sprintSpeed = 10.5;
    this.stamina = 100;
    this.health = 100;
    this.hunger = 86;
    this.thirst = 74;
    this.bob = 0;
    this.speed = 0;

    this.syncCamera();
  }

  update(dt, input) {
    const look = input.consumeLook();
    this.yaw -= look.x * 0.0022;
    this.pitch -= look.y * 0.0022;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));

    if (!input.locked) {
      if (input.isDown("KeyQ")) this.yaw += 1.3 * dt;
      if (input.isDown("KeyE")) this.yaw -= 1.3 * dt;
    }

    let dx = 0;
    let dz = 0;
    if (input.movingForward()) dz -= 1;
    if (input.movingBack()) dz += 1;
    if (input.movingLeft()) dx -= 1;
    if (input.movingRight()) dx += 1;

    const tryingToMove = dx !== 0 || dz !== 0;
    const sprint = tryingToMove && input.sprinting() && this.stamina > 1;
    const speed = sprint ? this.sprintSpeed : this.walkSpeed;

    if (tryingToMove) {
      const length = Math.hypot(dx, dz);
      dx /= length;
      dz /= length;

      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const worldX = dx * cos + dz * sin;
      const worldZ = dz * cos - dx * sin;
      const nextX = this.x + worldX * speed * dt;
      const nextZ = this.z + worldZ * speed * dt;

      if (!this.world.blocked(nextX, nextZ) && this.world.inBounds(nextX, nextZ)) {
        this.x = nextX;
        this.z = nextZ;
      }

      this.speed = speed;
      this.bob += dt * (sprint ? 11 : 8);
      this.stamina = Math.max(0, this.stamina - (sprint ? 18 : 4) * dt);
    } else {
      this.speed = 0;
      this.stamina = Math.min(100, this.stamina + 14 * dt);
    }

    this.hunger = Math.max(8, this.hunger - 0.35 * dt);
    this.thirst = Math.max(8, this.thirst - 0.45 * dt);

    this.syncCamera();
  }

  syncCamera() {
    const ground = this.world.heightAt(this.x, this.z);
    this.camera.position.set(this.x, ground + this.eyeHeight, this.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
