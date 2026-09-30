import * as THREE from "three";
import { behindPlayer } from "./look.js";

// Quiet changes that only happen where the player is not looking.
// A light dies, a door shows up, a box shifts, or a dark patch appears on the ceiling.

export class Changes {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.door = this.makeDoor();
    this.patch = this.makePatch();
    this.props = this.makeProps();
    scene.add(this.door);
    scene.add(this.patch);
  }

  makeDoor() {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 2.4, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x4a3824 })
    );
    door.visible = false;
    return door;
  }

  makePatch() {
    const patch = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.05, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x1a140c })
    );
    patch.visible = false;
    return patch;
  }

  makeProps() {
    const props = [];
    const box = new THREE.BoxGeometry(0.5, 0.38, 0.42);
    const material = new THREE.MeshLambertMaterial({ color: 0x8a7044 });
    const { floor, cols, rows, start, exit } = this.world.level;

    for (let r = 1; r < rows - 1 && props.length < 7; r++) {
      for (let c = 1; c < cols - 1 && props.length < 7; c++) {
        if (!floor[r][c]) continue;
        if ((c === start.c && r === start.r) || (c === exit.c && r === exit.r)) continue;
        if ((c + r) % 5 !== 0) continue;
        const spot = this.world.centerOf(c, r);
        const mesh = new THREE.Mesh(box, material);
        mesh.position.set(spot.x + 0.7, 0.2, spot.z - 0.5);
        this.scene.add(mesh);
        props.push(mesh);
      }
    }
    return props;
  }

  lampBehind(player) {
    let best = null;
    let bestDist = 99;
    for (const lamp of this.world.lamps) {
      if (!behindPlayer(player, this.world, lamp.x, lamp.z)) continue;
      const distance = Math.hypot(lamp.x - player.x, lamp.z - player.z);
      if (distance < 3 || distance > 16 || distance >= bestDist) continue;
      best = lamp;
      bestDist = distance;
    }
    return best;
  }

  // Turn one light off behind the player for a few seconds.
  extinguishBehind(player) {
    const lamp = this.lampBehind(player);
    if (!lamp) return false;
    lamp.blackout = 1 + Math.random() * 3;
    lamp.flicker = 0;
    return true;
  }

  // Lean a door against a wall in a cell the player is not watching.
  showDoor(player) {
    const spot = this.spotBehind(player, 4, 14);
    if (!spot) return false;
    this.door.visible = true;
    this.door.position.set(spot.x, 1.2, spot.z);
    this.door.rotation.y = Math.random() > 0.5 ? 0 : Math.PI / 2;
    return true;
  }

  // Slide a box that is behind the player.
  nudgeObject(player) {
    for (const prop of this.props) {
      if (!behindPlayer(player, this.world, prop.position.x, prop.position.z)) continue;
      const nextX = prop.position.x + (Math.random() - 0.5) * 0.8;
      const nextZ = prop.position.z + (Math.random() - 0.5) * 0.8;
      if (!this.world.isOpen(nextX, nextZ)) continue;
      prop.position.x = nextX;
      prop.position.z = nextZ;
      return true;
    }
    return false;
  }

  // A dark ceiling patch appears in a hall the player already walked past.
  markHall(player) {
    const spot = this.spotBehind(player, 3, 12);
    if (!spot) return false;
    this.patch.visible = true;
    this.patch.position.set(spot.x, 3.05, spot.z);
    return true;
  }

  spotBehind(player, minDist, maxDist) {
    const { floor, cols, rows } = this.world.level;
    for (let attempt = 0; attempt < 24; attempt++) {
      const c = 1 + Math.floor(Math.random() * (cols - 2));
      const r = 1 + Math.floor(Math.random() * (rows - 2));
      if (!floor[r][c]) continue;
      const spot = this.world.centerOf(c, r);
      const distance = Math.hypot(spot.x - player.x, spot.z - player.z);
      if (distance < minDist || distance > maxDist) continue;
      if (!behindPlayer(player, this.world, spot.x, spot.z)) continue;
      return spot;
    }
    return null;
  }
}
