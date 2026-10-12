import * as THREE from "three";
import { neighbors } from "./maze.js";
import { lookingAt } from "./look.js";

// Doors between halls. Some open, some are locked, some drop you somewhere else,
// and a few vanish after you look away.

const KINDS = ["normal", "locked", "unexpected", "vanish"];

export class Doors {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.doors = [];
    this.build();
  }

  build() {
    const { level } = this.world;
    const material = new THREE.MeshStandardMaterial({
      map: woodTexture(),
      color: 0xffffff,
      roughness: 0.68,
      metalness: 0.04,
    });
    const lockedMat = new THREE.MeshStandardMaterial({
      color: 0x3a3330,
      roughness: 0.55,
      metalness: 0.12,
    });
    let made = 0;

    for (let r = 1; r < level.rows - 1 && made < 10; r++) {
      for (let c = 1; c < level.cols - 1 && made < 10; c++) {
        if (!level.floor[r][c]) continue;
        if ((c + r) % 4 !== 0) continue;
        const east = level.floor[r][c + 1];
        if (!east) continue;
        if (neighbors(level, c, r).length < 2 || neighbors(level, c + 1, r).length < 2) continue;

        const here = this.world.centerOf(c, r);
        const next = this.world.centerOf(c + 1, r);
        const x = (here.x + next.x) / 2;
        const z = here.z;
        let kind = KINDS[made % KINDS.length];
        if (kind === "locked" && (c === level.start.c || c + 1 === level.exit.c)) kind = "normal";

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.7, 3.4), kind === "locked" ? lockedMat : material);
        mesh.position.set(x, 1.25, z);
        this.scene.add(mesh);

        const block = { x, z, active: true };
        this.world.blocks.push(block);
        this.doors.push({
          kind,
          mesh,
          block,
          x,
          z,
          open: false,
          gone: false,
          wasSeen: false,
        });
        made += 1;
      }
    }
    this.world.doors = this.doors;
  }

  use(door, player) {
    if (door.gone || door.open) return "";
    if (door.kind === "locked") return "The door is locked";
    if (door.kind === "unexpected") {
      this.openMesh(door);
      this.dropPlayer(player);
      return "The room on the other side is wrong";
    }
    this.openMesh(door);
    return "The door opens";
  }

  openMesh(door) {
    door.open = true;
    door.block.active = false;
    door.mesh.position.z += 1.55;
    door.mesh.rotation.y = 0.8;
  }

  dropPlayer(player) {
    const { floor, cols, rows } = this.world.level;
    const here = this.world.zoneAt(player.x, player.z);
    for (let attempt = 0; attempt < 40; attempt++) {
      const c = 1 + Math.floor(Math.random() * (cols - 2));
      const r = 1 + Math.floor(Math.random() * (rows - 2));
      if (!floor[r][c]) continue;
      const spot = this.world.centerOf(c, r);
      if (this.world.zoneAt(spot.x, spot.z) === here) continue;
      player.x = spot.x;
      player.z = spot.z;
      return;
    }
  }

  update(player) {
    for (const door of this.doors) {
      if (door.kind !== "vanish" || door.gone) continue;
      const seen = lookingAt(player, door.x, door.z, 0.45);
      if (seen) door.wasSeen = true;
      else if (door.wasSeen) {
        door.gone = true;
        door.open = true;
        door.block.active = false;
        door.mesh.visible = false;
      }
    }
  }
}

function woodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6a4e2e";
  ctx.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y++) {
    const wobble = Math.sin(y * 0.22) * 3;
    ctx.strokeStyle = y % 9 === 0 ? "rgba(36, 20, 8, 0.35)" : "rgba(255, 214, 150, 0.06)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(64, y + wobble);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
