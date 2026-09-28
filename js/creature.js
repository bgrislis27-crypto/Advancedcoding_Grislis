import * as THREE from "three";
import { hasSight, nextStep } from "./maze.js";

// A slow dark figure. It wanders the halls, and chases when it can see you.

export class Creature {
  constructor(scene, level, world) {
    this.level = level;
    this.world = world;
    const start = world.centerOf(level.creature.c, level.creature.r);
    this.x = start.x;
    this.z = start.z;
    this.searchSpeed = 1.55;
    this.chaseSpeed = 2.75;
    this.mode = "search";
    this.goal = null;
    this.retarget = 1;
    this.lostSight = 0;
    this.caughtPlayer = false;
    this.mesh = this.buildMesh();
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

  randomCell() {
    const { floor, cols, rows } = this.level;
    for (let attempt = 0; attempt < 30; attempt++) {
      const c = Math.floor(Math.random() * cols);
      const r = Math.floor(Math.random() * rows);
      if (floor[r][c]) return { c, r };
    }
    return { c: 1, r: 1 };
  }

  update(dt, player) {
    const playerCell = this.world.cellAt(player.x, player.z);
    const myCell = this.world.cellAt(this.x, this.z);
    const dist = Math.hypot(player.x - this.x, player.z - this.z);
    const sees = !player.hiding && dist < 18 && hasSight(this.level, myCell, playerCell);

    if (sees) {
      this.mode = "chase";
      this.goal = playerCell;
      this.lostSight = 0;
    } else if (this.mode === "chase") {
      this.lostSight += dt;
      if (this.lostSight > 2.2) {
        this.mode = "search";
        this.goal = null;
      }
    }

    this.retarget -= dt;
    if (this.mode === "search" && (this.retarget <= 0 || !this.goal)) {
      this.goal = this.randomCell();
      this.retarget = 4 + Math.random() * 3;
    }

    if (this.goal) {
      const next = nextStep(this.level, myCell, this.goal);
      const target = this.world.centerOf(next.c, next.r);
      const dx = target.x - this.x;
      const dz = target.z - this.z;
      const length = Math.hypot(dx, dz);
      const speed = this.mode === "chase" ? this.chaseSpeed : this.searchSpeed;
      if (length > 0.15) {
        const step = Math.min(length, speed * dt);
        this.x += (dx / length) * step;
        this.z += (dz / length) * step;
        this.mesh.rotation.y = Math.atan2(dx, dz);
      } else if (next.c === this.goal.c && next.r === this.goal.r) {
        this.goal = null;
      }
    }

    this.mesh.position.set(this.x, 0, this.z);

    const close = Math.hypot(player.x - this.x, player.z - this.z);
    if (close < 1.2 && !player.hiding) this.caughtPlayer = true;
    if (close < 0.9) this.caughtPlayer = true;
  }
}
