import * as THREE from "three";
import { zoneName } from "./maze.js";

// Turns the maze numbers into yellow hallways, carpet, ceiling lights, and a green exit door.

export class World {
  constructor(scene, level) {
    this.scene = scene;
    this.level = level;
    this.cell = level.cell;
    this.lamps = [];
    this.blocks = [];
    this.doors = [];
    this.ambient = null;
    this.build();
  }

  centerOf(c, r) {
    return {
      x: (c + 0.5) * this.cell,
      z: (r + 0.5) * this.cell,
    };
  }

  cellAt(x, z) {
    return {
      c: Math.floor(x / this.cell),
      r: Math.floor(z / this.cell),
    };
  }

  isOpen(x, z) {
    const { c, r } = this.cellAt(x, z);
    if (c < 0 || r < 0 || c >= this.level.cols || r >= this.level.rows) return false;
    return this.level.floor[r][c];
  }

  isHide(x, z) {
    const { c, r } = this.cellAt(x, z);
    return this.level.hides.has(`${c},${r}`);
  }

  isExit(x, z) {
    const { c, r } = this.cellAt(x, z);
    return c === this.level.exit.c && r === this.level.exit.r;
  }

  zoneAt(x, z) {
    const { c, r } = this.cellAt(x, z);
    return zoneName(this.level, c, r);
  }

  isSafe(x, z) {
    const { c, r } = this.cellAt(x, z);
    return this.level.safe.has(`${c},${r}`);
  }

  blocked(x, z) {
    for (const block of this.blocks) {
      if (!block.active) continue;
      if (Math.abs(x - block.x) < 0.55 && Math.abs(z - block.z) < 1.85) return true;
    }
    return false;
  }

  nearestDoor(x, z) {
    let best = null;
    let bestDistance = 1.35;
    for (const door of this.doors) {
      if (door.gone) continue;
      const distance = Math.hypot(x - door.x, z - door.z);
      if (distance < bestDistance) {
        best = door;
        bestDistance = distance;
      }
    }
    return best;
  }

  build() {
    const { level } = this;
    const S = level.cell;
    const height = 3.2;

    const wallpaper = new THREE.MeshLambertMaterial({ map: wallpaperTexture(), color: 0xffffff });
    const darkWall = new THREE.MeshLambertMaterial({ color: 0x6a5428 });
    const carpet = new THREE.MeshLambertMaterial({ map: carpetTexture(), color: 0xffffff });
    const darkCarpet = new THREE.MeshLambertMaterial({ color: 0x3a3120 });
    const ceiling = new THREE.MeshLambertMaterial({ color: 0xe4dece });
    const walls = {
      yellow: wallpaper,
      office: new THREE.MeshLambertMaterial({ color: 0xc9c3ae }),
      flood: new THREE.MeshLambertMaterial({ color: 0x6d7a72 }),
      maintenance: new THREE.MeshLambertMaterial({ color: 0x667068 }),
      stairs: new THREE.MeshLambertMaterial({ color: 0x6a6458 }),
      abandoned: new THREE.MeshLambertMaterial({ color: 0x5c5344 }),
      strange: new THREE.MeshLambertMaterial({ color: 0x8d7044 }),
    };
    const floors = {
      yellow: carpet,
      office: new THREE.MeshLambertMaterial({ color: 0x8d8474 }),
      flood: new THREE.MeshLambertMaterial({ color: 0x3e514c }),
      maintenance: new THREE.MeshLambertMaterial({ color: 0x4a4e48 }),
      stairs: new THREE.MeshLambertMaterial({ color: 0x5a5348 }),
      abandoned: new THREE.MeshLambertMaterial({ color: 0x3a342c }),
      strange: new THREE.MeshLambertMaterial({ color: 0x6a5830 }),
    };
    const lampMaterial = new THREE.MeshLambertMaterial({
      color: 0xfff6d2,
      emissive: 0xfff6d2,
      emissiveIntensity: 1.4,
    });

    const floorBox = new THREE.BoxGeometry(S, 0.2, S);
    const ceilingBox = new THREE.BoxGeometry(S, 0.12, S);
    const wallX = new THREE.BoxGeometry(0.28, height, S);
    const wallZ = new THREE.BoxGeometry(S, height, 0.28);
    const lampBox = new THREE.BoxGeometry(2.2, 0.1, 0.55);

    let lightCount = 0;

    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        if (!level.floor[r][c]) continue;

        const x = (c + 0.5) * S;
        const z = (r + 0.5) * S;
        const hide = level.hides.has(`${c},${r}`);
        const zone = zoneName(level, c, r);
        const lift = zone === "strange" ? ((c * 3 + r) % 3) * 0.4 : 0;

        const floorMesh = new THREE.Mesh(floorBox, hide ? darkCarpet : floors[zone] || carpet);
        floorMesh.position.set(x, -0.1, z);
        this.scene.add(floorMesh);

        const ceilingMesh = new THREE.Mesh(ceilingBox, hide ? darkWall : ceiling);
        ceilingMesh.position.set(x, height + lift, z);
        this.scene.add(ceilingMesh);

        this.addWalls(c, r, x, z, height + lift, hide ? darkWall : walls[zone] || wallpaper, wallX, wallZ);
        if (zone === "stairs") this.addSteps(x, z);

        // Skip some cells so the lights are spread out, with dark gaps between them.
        if (hide || (c + r) % 2 !== 0 || lightCount >= 20) continue;

        const shade = lampMaterial.clone();
        const lamp = new THREE.Mesh(lampBox, shade);
        lamp.position.set(x, height - 0.08, z);
        this.scene.add(lamp);

        // Short range, so a lit hall stays bright and the far end falls dark.
        const light = new THREE.PointLight(0xfff1c2, 2.1, 13, 2);
        light.position.set(x, height - 0.45, z);
        this.scene.add(light);
        lightCount += 1;
        this.lamps.push({
          light,
          material: shade,
          base: 2.1,
          x,
          z,
          blackout: 0,
          flicker: 0,
        });
      }
    }

    const exit = this.centerOf(level.exit.c, level.exit.r);
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.6, 0.18),
      new THREE.MeshLambertMaterial({
        map: exitSign(),
        emissive: 0x12331c,
        emissiveIntensity: 0.35,
      })
    );
    door.position.set(exit.x, 1.3, exit.z);
    this.scene.add(door);

    // Dim yellow fill. Ceiling lights and the flashlight do the real work nearby.
    this.ambient = new THREE.AmbientLight(0xffe2a0, 0.2);
    this.scene.add(this.ambient);
    this.scene.add(new THREE.HemisphereLight(0xfff1c4, 0x3a2c18, 0.16));
    this.placeLandmarks();
  }

  addSteps(x, z) {
    const step = new THREE.BoxGeometry(1.2, 0.18, 0.4);
    const material = new THREE.MeshLambertMaterial({ color: 0x74685a });
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(step, material);
      mesh.position.set(x - 0.6 + i * 0.35, 0.12 + i * 0.16, z);
      this.scene.add(mesh);
    }
  }

  placeLandmarks() {
    const labeled = new Set();
    const words = {
      yellow: "HALL",
      office: "OFFICE",
      flood: "WET",
      maintenance: "MAINT",
      stairs: "STAIRS",
      abandoned: "EMPTY",
      strange: "???",
    };
    for (let r = 0; r < this.level.rows; r++) {
      for (let c = 0; c < this.level.cols; c++) {
        if (!this.level.floor[r][c]) continue;
        const zone = zoneName(this.level, c, r);
        if (labeled.has(zone)) continue;
        labeled.add(zone);
        const spot = this.centerOf(c, r);
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.4, 0.08),
          new THREE.MeshBasicMaterial({ map: signTexture(words[zone] || zone) })
        );
        board.position.set(spot.x, 1.7, spot.z - 1.2);
        this.scene.add(board);
      }
    }
  }

  addWalls(c, r, x, z, height, material, wallX, wallZ) {
    const S = this.cell;
    const { floor } = this.level;
    const sides = [
      [1, 0, wallX, S / 2, 0],
      [-1, 0, wallX, -S / 2, 0],
      [0, 1, wallZ, 0, S / 2],
      [0, -1, wallZ, 0, -S / 2],
    ];

    for (const [dc, dr, geometry, ox, oz] of sides) {
      const nc = c + dc;
      const nr = r + dr;
      const open = floor[nr] && floor[nr][nc];
      if (open) continue;
      const wall = new THREE.Mesh(geometry, material);
      wall.position.set(x + ox, height / 2, z + oz);
      this.scene.add(wall);
    }
  }

}

function signTexture(word) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1a140c";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#e6d7a8";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(word, 128, 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wallpaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e6bc4e";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(110, 72, 18, 0.35)";
  for (let x = 8; x < 128; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 1, 128);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(90, 60, 20, 0.18)";
  ctx.fillRect(20, 30, 18, 46);
  ctx.fillRect(78, 12, 14, 28);
  ctx.fillStyle = "#b8903a";
  ctx.fillRect(0, 108, 128, 20);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function carpetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#a67c45";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#9a7c48" : "#6e5830";
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function exitSign() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#102016";
  ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = "#b6ffc4";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EXIT", 64, 136);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
