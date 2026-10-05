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

    const wallMap = wallpaperTexture();
    const floorMap = carpetTexture();
    const wallpaper = new THREE.MeshLambertMaterial({ map: wallMap, color: 0xffffff });
    const darkWall = new THREE.MeshLambertMaterial({ map: wallMap, color: 0x8a7a48 });
    const carpet = new THREE.MeshLambertMaterial({ map: floorMap, color: 0xffffff });
    const darkCarpet = new THREE.MeshLambertMaterial({ map: floorMap, color: 0x6a5a38 });
    const ceiling = new THREE.MeshLambertMaterial({ map: ceilingTexture(), color: 0xffffff });
    const walls = {
      yellow: wallpaper,
      office: new THREE.MeshLambertMaterial({ map: wallMap, color: 0xe4dcb8 }),
      flood: new THREE.MeshLambertMaterial({ map: wallMap, color: 0x9aa898 }),
      maintenance: new THREE.MeshLambertMaterial({ map: wallMap, color: 0xa8aea4 }),
      stairs: new THREE.MeshLambertMaterial({ map: wallMap, color: 0xb2aa98 }),
      abandoned: new THREE.MeshLambertMaterial({ map: wallMap, color: 0x9a907c }),
      strange: new THREE.MeshLambertMaterial({ map: wallMap, color: 0xc2a86a }),
    };
    const floors = {
      yellow: carpet,
      office: new THREE.MeshLambertMaterial({ map: floorMap, color: 0xc8c0aa }),
      flood: new THREE.MeshLambertMaterial({ map: floorMap, color: 0x7a8e86 }),
      maintenance: new THREE.MeshLambertMaterial({ map: floorMap, color: 0x8a8e86 }),
      stairs: new THREE.MeshLambertMaterial({ map: floorMap, color: 0xb0a898 }),
      abandoned: new THREE.MeshLambertMaterial({ map: floorMap, color: 0x8a8070 }),
      strange: new THREE.MeshLambertMaterial({ map: floorMap, color: 0xc2a868 }),
    };
    const lampMaterial = new THREE.MeshLambertMaterial({
      color: 0xfffbea,
      emissive: 0xfff4c8,
      emissiveIntensity: 2.2,
    });
    const panelMaterial = lampMaterial.clone();

    const floorBox = new THREE.BoxGeometry(S, 0.2, S);
    const ceilingBox = new THREE.BoxGeometry(S, 0.12, S);
    const wallX = new THREE.BoxGeometry(0.28, height, S);
    const wallZ = new THREE.BoxGeometry(S, height, 0.28);
    const lampBox = new THREE.BoxGeometry(1.15, 0.04, 0.48);

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

        // Fluorescent panels on the ceiling. A point light sits under some of them.
        const lit = !hide && (c + r) % 2 === 0 && lightCount < 36;
        const shade = lit ? lampMaterial.clone() : panelMaterial;
        this.addPanel(lampBox, shade, x - 0.72, height - 0.07, z - 0.72);
        this.addPanel(lampBox, shade, x + 0.72, height - 0.07, z - 0.72);
        this.addPanel(lampBox, shade, x - 0.72, height - 0.07, z + 0.72);
        this.addPanel(lampBox, shade, x + 0.72, height - 0.07, z + 0.72);
        if (!lit) continue;

        const light = new THREE.PointLight(0xfff6d2, 1.7, 18, 1.35);
        light.position.set(x, height - 0.4, z);
        this.scene.add(light);
        lightCount += 1;
        this.lamps.push({
          light,
          material: shade,
          base: 1.7,
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

    // A warm fill, so the rooms stay bright the way fluorescent halls do.
    this.baseAmbient = 0.72;
    this.ambient = new THREE.AmbientLight(0xfff3c8, this.baseAmbient);
    this.scene.add(this.ambient);
    this.scene.add(new THREE.HemisphereLight(0xfff6d8, 0xc2b48a, 0.38));
    this.placeLandmarks();
  }

  addPanel(geometry, material, x, y, z) {
    const lamp = new THREE.Mesh(geometry, material);
    lamp.position.set(x, y, z);
    this.scene.add(lamp);
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
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#d4be68";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(110, 100, 40, 0.06)" : "rgba(255, 236, 170, 0.07)";
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  const step = 32;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const flip = (x / step + y / step) % 2 === 0 ? 1 : -1;
      drawDamask(ctx, x + 16, y + 16, flip);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2.4);
  return texture;
}

function drawDamask(ctx, cx, cy, flip) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flip, 1);
  ctx.fillStyle = "#6f7638";
  ctx.strokeStyle = "#5f662e";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.bezierCurveTo(8, -8, 6, 0, 0, 1);
  ctx.bezierCurveTo(-6, 0, -8, -8, 0, -13);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.bezierCurveTo(7, 4, 5, 11, 0, 13);
  ctx.bezierCurveTo(-5, 11, -7, 4, 0, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.quadraticCurveTo(-12, -2, -11, 6);
  ctx.quadraticCurveTo(-8, 2, -3, 3);
  ctx.moveTo(3, 0);
  ctx.quadraticCurveTo(12, -2, 11, 6);
  ctx.quadraticCurveTo(8, 2, 3, 3);
  ctx.stroke();
  ctx.restore();
}

function carpetTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const speck = Math.random();
    let red = 198;
    let green = 168;
    let blue = 86;
    if (speck > 0.82) {
      red = 236;
      green = 214;
      blue = 140;
    } else if (speck < 0.16) {
      red = 132;
      green = 104;
      blue = 42;
    }
    data[i] = red;
    data[i + 1] = green;
    data[i + 2] = blue;
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

function ceilingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#efe3b4";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(120, 100, 50, 0.35)";
  ctx.lineWidth = 2;
  for (let n = 0; n <= 128; n += 32) {
    ctx.beginPath();
    ctx.moveTo(n, 0);
    ctx.lineTo(n, 128);
    ctx.moveTo(0, n);
    ctx.lineTo(128, n);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
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
