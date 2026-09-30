import * as THREE from "three";
import { lookingAt } from "./look.js";

// A still shadow at the end of a hallway.
// It is rare, it stays far away, and it leaves if you get close or look away.

export class Watcher {
  constructor(scene, world) {
    this.world = world;
    this.mesh = this.buildMesh();
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.active = false;
    this.lookAway = 0;
    this.cooldown = 12;
  }

  buildMesh() {
    const group = new THREE.Group();
    const skin = new THREE.MeshBasicMaterial({ color: 0x070605 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.9, 0.28), skin);
    body.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.28), skin);
    head.position.y = 2.2;
    group.add(body, head);
    return group;
  }

  // Stand at the far end of the hall the player is facing. Returns false if no hall is long enough.
  tryAppear(player) {
    if (this.active || this.cooldown > 0) return false;
    if (Math.random() > 0.55) return false;

    const stepX = -Math.sin(player.yaw) * this.world.cell * 0.85;
    const stepZ = -Math.cos(player.yaw) * this.world.cell * 0.85;
    let x = player.x;
    let z = player.z;
    let far = null;

    for (let i = 0; i < 14; i++) {
      const nextX = x + stepX;
      const nextZ = z + stepZ;
      if (!this.world.isOpen(nextX, nextZ)) break;
      x = nextX;
      z = nextZ;
      if (Math.hypot(x - player.x, z - player.z) > 9) far = { x, z };
    }

    if (!far) return false;

    this.mesh.visible = true;
    this.mesh.position.set(far.x, 0, far.z);
    this.active = true;
    this.lookAway = 0;
    return true;
  }

  hide() {
    this.active = false;
    this.mesh.visible = false;
    this.cooldown = 18 + Math.random() * 20;
  }

  update(dt, player) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (!this.active) return;

    const dx = this.mesh.position.x - player.x;
    const dz = this.mesh.position.z - player.z;
    const distance = Math.hypot(dx, dz);
    this.mesh.rotation.y = Math.atan2(dx, dz);

    if (distance < 7) {
      this.hide();
      return;
    }

    const seen = lookingAt(player, this.mesh.position.x, this.mesh.position.z, 0.2);
    this.lookAway = seen ? 0 : this.lookAway + dt;
    if (this.lookAway > 2.2) this.hide();
  }
}
