import * as THREE from "three";
import { hasSight, nextStep } from "./maze.js";
import { lookingAt } from "./look.js";

// The entity is usually out of sight.
// It hides, watches, wanders, checks sounds, creeps closer, and only rarely chases.

export class Creature {
  constructor(scene, level, world) {
    this.level = level;
    this.world = world;
    const start = world.centerOf(level.creature.c, level.creature.r);
    this.x = start.x;
    this.z = start.z;
    this.state = "hidden";
    this.timer = 5;
    this.agitation = 0;
    this.goal = null;
    this.lost = 0;
    this.distance = 99;
    this.caughtPlayer = false;
    this.mode = "classic";
    this.chaseSpeed = 2.7;
    this.angerGain = 1.6;
    this.catchDistance = 1.15;
    this.loseChase = 3.5;
    this.chaseChance = 0.15;
    this.deafChase = 0.04;
    this.mesh = this.buildMesh();
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  buildMesh() {
    const group = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0x14080c });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.8, 0.4), skin);
    body.position.y = 1.2;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.4), skin);
    head.position.y = 2.25;
    const eye = new THREE.MeshBasicMaterial({ color: 0xff2424 });
    const left = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eye);
    const right = left.clone();
    left.position.set(-0.12, 2.28, 0.18);
    right.position.set(0.12, 2.28, 0.18);
    group.add(body, head, left, right);
    return group;
  }

  enter(state) {
    this.state = state;
    this.timer = state === "hidden" ? 6 + Math.random() * 8 : 5 + Math.random() * 4;
    this.lost = 0;
    if (state === "hidden") this.mesh.visible = false;
    if (state === "wandering") this.goal = this.randomCell();
  }

  // A sound gives it a place to investigate. Deaf and free mode ignore sound.
  hear(x, z) {
    if (this.mode !== "classic") return;
    this.goal = this.world.cellAt(x, z);
    if (this.state === "hidden" || this.state === "wandering" || this.state === "watching") {
      this.enter("investigating");
    }
  }

  randomCell() {
    const { floor, cols, rows } = this.level;
    for (let attempt = 0; attempt < 20; attempt++) {
      const c = Math.floor(Math.random() * cols);
      const r = Math.floor(Math.random() * rows);
      if (floor[r][c]) return { c, r };
    }
    return { c: 1, r: 1 };
  }

  stepToward(cell, speed, dt) {
    const myCell = this.world.cellAt(this.x, this.z);
    const next = nextStep(this.level, myCell, cell);
    const target = this.world.centerOf(next.c, next.r);
    const dx = target.x - this.x;
    const dz = target.z - this.z;
    const length = Math.hypot(dx, dz);
    if (length > 0.12) {
      const step = Math.min(length, speed * dt);
      this.x += (dx / length) * step;
      this.z += (dz / length) * step;
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  watchFrom(player) {
    const stepX = -Math.sin(player.yaw) * this.world.cell;
    const stepZ = -Math.cos(player.yaw) * this.world.cell;
    let x = player.x;
    let z = player.z;
    for (let i = 0; i < 8; i++) {
      if (!this.world.isOpen(x + stepX, z + stepZ)) break;
      x += stepX;
      z += stepZ;
    }
    if (Math.hypot(x - player.x, z - player.z) > 8) {
      this.x = x;
      this.z = z;
    }
  }

  update(dt, player) {
    if (this.mode === "free") {
      this.state = "hidden";
      this.mesh.visible = false;
      this.caughtPlayer = false;
      return;
    }

    const deaf = this.mode === "deaf";
    const playerCell = this.world.cellAt(player.x, player.z);
    const myCell = this.world.cellAt(this.x, this.z);
    this.distance = Math.hypot(player.x - this.x, player.z - this.z);
    const sees = !player.hiding && this.distance < 16 && hasSight(this.level, myCell, playerCell);
    const looked = this.mesh.visible && lookingAt(player, this.x, this.z, 0.35);
    this.timer -= dt;

    if (!deaf && player.running && this.distance < 22) this.agitation = Math.min(12, this.agitation + dt * this.angerGain);
    else this.agitation = Math.max(0, this.agitation - dt * 0.35);

    // Looking at it can make it leave, unless it has already started a chase.
    if (looked && this.state !== "chasing" && Math.random() < dt * 0.7) {
      this.enter("hidden");
      return;
    }

    if (!deaf && this.state !== "chasing" && this.agitation > 7 && sees && Math.random() < dt * this.chaseChance) {
      this.enter("chasing");
    }
    if (deaf && this.state !== "chasing" && sees && this.distance < 8 && Math.random() < dt * this.deafChase) {
      this.enter("chasing");
    }

    if (this.state === "hidden") {
      this.mesh.visible = false;
      if (!deaf && player.running && this.distance < 18) this.enter("investigating");
      else if (this.timer <= 0) this.enter(Math.random() < 0.5 ? "watching" : "wandering");
    } else if (this.state === "watching") {
      this.watchFrom(player);
      this.mesh.visible = this.distance > 7 && this.distance < 20;
      if (player.stillTime > 2.8) this.enter("approaching");
      else if (this.timer <= 0) this.enter("hidden");
    } else if (this.state === "wandering") {
      this.mesh.visible = this.distance < 18;
      if (this.goal) this.stepToward(this.goal, 1.1, dt);
      if (!deaf && player.running) this.enter("investigating");
      else if (this.timer <= 0) this.enter("hidden");
    } else if (this.state === "investigating") {
      this.mesh.visible = this.distance < 20;
      const cell = this.goal || playerCell;
      this.stepToward(cell, 1.45, dt);
      if (this.timer <= 0) this.enter("wandering");
    } else if (this.state === "approaching") {
      this.mesh.visible = true;
      if (player.moving && !player.running) this.enter("watching");
      else this.stepToward(playerCell, 0.85, dt);
      if (this.distance < 3.5 || this.timer <= 0) this.enter("hidden");
    } else if (this.state === "chasing") {
      this.mesh.visible = true;
      if (sees) this.lost = 0;
      else this.lost += dt;
      this.stepToward(playerCell, this.chaseSpeed, dt);
      if (this.distance < this.catchDistance && !player.hiding) this.caughtPlayer = true;
      if (this.lost > this.loseChase) this.enter("hidden");
    }

    this.mesh.position.set(this.x, 0, this.z);
  }
}
