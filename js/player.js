// First-person movement. WASD walks, Shift runs, E hides or uses the exit.

import { neighbors } from "./maze.js";

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    const start = world.centerOf(world.level.start.c, world.level.start.r);
    this.x = start.x;
    this.z = start.z;
    this.yaw = this.yawTowardHall();
    this.pitch = -0.08;
    this.eye = 1.65;
    this.walkSpeed = 3.3;
    this.runSpeed = 6.1;
    this.stamina = 100;
    this.sprintDrain = 26;
    this.hiding = false;
    this.moving = false;
    this.running = false;
    this.speed = 0;
    this.stillTime = 0;
    this.distance = 0;
    this.inSafe = false;
    this.inDark = false;
    this.escaped = false;
    this.prompt = "";
    this.syncCamera();
  }

  // Face the long starting hallway so the first view shows the corridor.
  yawTowardHall() {
    const facing = this.world.level.facing;
    if (facing) return Math.atan2(-facing.dc, -facing.dr);

    const start = this.world.level.start;
    const open = neighbors(this.world.level, start.c, start.r);
    if (open.length === 0) return 0;

    let best = open[0];
    let bestLen = -1;
    for (const cell of open) {
      const stepC = cell.c - start.c;
      const stepR = cell.r - start.r;
      let len = 1;
      let c = cell.c;
      let r = cell.r;
      const floor = this.world.level.floor;
      while (floor[r + stepR] && floor[r + stepR][c + stepC]) {
        len += 1;
        c += stepC;
        r += stepR;
      }
      if (len > bestLen) {
        bestLen = len;
        best = cell;
      }
    }

    const dx = best.c - start.c;
    const dz = best.r - start.r;
    return Math.atan2(-dx, -dz);
  }

  update(dt, input) {
    const look = input.consumeLook();
    this.yaw -= look.x * 0.0022;
    this.pitch -= look.y * 0.002;
    this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch));

    if (!input.locked) {
      if (input.isDown("ArrowLeft")) this.yaw += 1.6 * dt;
      if (input.isDown("ArrowRight")) this.yaw -= 1.6 * dt;
    }

    const pressedE = input.consumePress("KeyE");
    const door = this.world.nearestDoor(this.x, this.z);
    const closedDoor = door && !door.open && !door.gone ? door : null;
    let doorNote = "";
    if (pressedE && closedDoor && !this.hiding && this.doorSystem) {
      doorNote = this.doorSystem.use(closedDoor, this);
    } else if (pressedE && this.world.isExit(this.x, this.z) && !this.hiding) {
      this.escaped = true;
    } else if (pressedE && this.world.isHide(this.x, this.z)) {
      this.hiding = !this.hiding;
    } else if (pressedE && this.hiding) {
      this.hiding = false;
    }

    this.moving = false;
    this.running = false;
    this.speed = 0;

    if (!this.hiding) {
      let dx = 0;
      let dz = 0;
      if (input.movingForward()) dz -= 1;
      if (input.movingBack()) dz += 1;
      if (input.movingLeft()) dx -= 1;
      if (input.movingRight()) dx += 1;

      const trying = dx !== 0 || dz !== 0;
      const sprint = trying && input.running() && this.stamina > 1;
      const zone = this.world.zoneAt(this.x, this.z);
      const drag = zone === "flood" ? 0.58 : 1;
      const speed = (sprint ? this.runSpeed : this.walkSpeed) * drag;

      if (trying) {
        const length = Math.hypot(dx, dz);
        dx /= length;
        dz /= length;
        const sin = Math.sin(this.yaw);
        const cos = Math.cos(this.yaw);
        const worldX = dx * cos + dz * sin;
        const worldZ = dz * cos - dx * sin;
        this.tryMove(worldX * speed * dt, worldZ * speed * dt);
        this.moving = true;
        this.running = sprint;
        this.speed = speed;
        this.stillTime = 0;
        this.distance += speed * dt;
        this.stamina = Math.max(0, this.stamina - (sprint ? this.sprintDrain : 6) * dt);
      } else {
        this.stillTime += dt;
        this.stamina = Math.min(100, this.stamina + 16 * dt);
      }
    } else {
      this.stillTime += dt;
    }

    this.inSafe = this.world.isSafe(this.x, this.z);

    if (doorNote) this.prompt = doorNote;
    else if (closedDoor && !this.hiding) this.prompt = "Press E to try the door";
    else if (this.hiding) this.prompt = "Press E to step out of hiding";
    else if (this.world.isExit(this.x, this.z)) this.prompt = "Press E to escape";
    else if (this.world.isHide(this.x, this.z)) this.prompt = "Press E to hide in the dark";
    else if (this.inSafe) this.prompt = "This room feels still";
    else this.prompt = "";

    this.syncCamera();
  }

  tryMove(dx, dz) {
    const radius = 0.45;
    if (this.fits(this.x + dx, this.z)) this.x += dx;
    if (this.fits(this.x, this.z + dz)) this.z += dz;
    // radius is checked inside fits
    void radius;
  }

  fits(x, z) {
    const radius = 0.45;
    return (
      this.world.isOpen(x, z) &&
      this.world.isOpen(x + radius, z) &&
      this.world.isOpen(x - radius, z) &&
      this.world.isOpen(x, z + radius) &&
      this.world.isOpen(x, z - radius) &&
      !this.world.blocked(x, z)
    );
  }

  syncCamera() {
    const crouch = this.hiding ? 0.55 : 0;
    this.camera.position.set(this.x, this.eye - crouch, this.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
