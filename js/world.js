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
    // Standard materials pick up the ceiling lights, so a wall is brighter under a panel than in a corner.
    const wallpaper = surface(wallMap, 0xffffff, 0.78, 0.02);
    const darkWall = surface(wallMap, 0x8a7a48, 0.86, 0.02);
    const carpet = surface(floorMap, 0xffffff, 0.94, 0);
    const darkCarpet = surface(floorMap, 0x6a5a38, 0.96, 0);
    const ceiling = surface(ceilingTexture(), 0xffffff, 0.9, 0.02);
    this.trim = surface(null, 0xcbb98a, 0.62, 0.05);
    const walls = {
      yellow: wallpaper,
      office: surface(wallMap, 0xe4dcb8, 0.8, 0.02),
      flood: surface(wallMap, 0x9aa898, 0.84, 0.02),
      maintenance: surface(wallMap, 0xa8aea4, 0.84, 0.04),
      stairs: surface(wallMap, 0xb2aa98, 0.82, 0.02),
      abandoned: surface(wallMap, 0x9a907c, 0.88, 0.02),
      strange: surface(wallMap, 0xc2a86a, 0.8, 0.02),
    };
    const floors = {
      yellow: carpet,
      office: surface(floorMap, 0xc8c0aa, 0.92, 0),
      flood: surface(floorMap, 0x7a8e86, 0.55, 0.02),
      maintenance: surface(floorMap, 0x8a8e86, 0.9, 0.02),
      stairs: surface(floorMap, 0xb0a898, 0.88, 0.02),
      abandoned: surface(floorMap, 0x8a8070, 0.94, 0),
      strange: surface(floorMap, 0xc2a868, 0.9, 0),
    };
    const lampMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffbea,
      emissive: 0xfff6d2,
      emissiveIntensity: 2.6,
      roughness: 0.16,
      metalness: 0.02,
    });
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0xe4dcc4,
      emissive: 0xfff1c4,
      emissiveIntensity: 0.28,
      roughness: 0.24,
      metalness: 0.02,
    });
    const housingMaterial = new THREE.MeshStandardMaterial({
      color: 0xb7b09a,
      roughness: 0.42,
      metalness: 0.38,
    });

    const floorBox = new THREE.BoxGeometry(S, 0.2, S);
    const ceilingBox = new THREE.BoxGeometry(S, 0.12, S);
    const wallX = new THREE.BoxGeometry(0.28, height, S);
    const wallZ = new THREE.BoxGeometry(S, height, 0.28);
    this.trimZ = new THREE.BoxGeometry(0.08, 0.16, S * 0.94);
    this.trimX = new THREE.BoxGeometry(S * 0.94, 0.16, 0.08);
    const lampBox = new THREE.BoxGeometry(1.15, 0.035, 0.48);
    const housingBox = new THREE.BoxGeometry(1.32, 0.05, 0.66);
    const glowPlane = new THREE.PlaneGeometry(1.7, 0.9);

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
        const glowMaterial = lit
          ? new THREE.MeshBasicMaterial({
              color: 0xfff4c2,
              transparent: true,
              opacity: 0.22,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          : null;
        const spots = [
          [x - 0.72, z - 0.72],
          [x + 0.72, z - 0.72],
          [x - 0.72, z + 0.72],
          [x + 0.72, z + 0.72],
        ];
        const glows = [];
        for (const [px, pz] of spots) {
          const glow = this.addFixture(lampBox, housingBox, glowPlane, shade, housingMaterial, glowMaterial, px, height - 0.08, pz);
          if (glow) glows.push(glow);
        }
        if (!lit) continue;

        const light = new THREE.PointLight(0xfff7e4, 2.5, 16, 1.7);
        light.position.set(x, height - 0.42, z);
        this.scene.add(light);
        lightCount += 1;
        this.lamps.push({
          light,
          material: shade,
          glows,
          base: 2.5,
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
      new THREE.MeshStandardMaterial({
        map: exitSign(),
        emissive: 0x12331c,
        emissiveIntensity: 0.45,
        roughness: 0.4,
        metalness: 0.02,
      })
    );
    door.position.set(exit.x, 1.3, exit.z);
    this.scene.add(door);

    // A warm fill, so the rooms stay bright the way fluorescent halls do.
    // Fill light stays low so the ceiling panels, not a flat wash, do most of the work.
    this.baseAmbient = 0.42;
    this.ambient = new THREE.AmbientLight(0xfff3c8, this.baseAmbient);
    this.scene.add(this.ambient);
    this.scene.add(new THREE.HemisphereLight(0xfff6d8, 0xc2b48a, 0.38));
    this.placeLandmarks();
  }

  addFixture(panelBox, housingBox, glowPlane, panelMaterial, housingMaterial, glowMaterial, x, y, z) {
    const housing = new THREE.Mesh(housingBox, housingMaterial);
    housing.position.set(x, y + 0.03, z);
    this.scene.add(housing);

    const lamp = new THREE.Mesh(panelBox, panelMaterial);
    lamp.position.set(x, y, z);
    this.scene.add(lamp);

    if (!glowMaterial) return null;
    const glow = new THREE.Mesh(glowPlane, glowMaterial);
    glow.position.set(x, y - 0.06, z);
    glow.rotation.x = Math.PI / 2;
    this.scene.add(glow);
    return glow;
  }

  addSteps(x, z) {
    const step = new THREE.BoxGeometry(1.2, 0.18, 0.4);
    const material = new THREE.MeshStandardMaterial({ color: 0x74685a, roughness: 0.9, metalness: 0.02 });
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
          new THREE.BoxGeometry(1.1, 0.4, 0.06),
          new THREE.MeshStandardMaterial({
            map: signTexture(words[zone] || zone),
            roughness: 0.6,
            metalness: 0.05,
          })
        );
        // Hang the sign on a wall instead of leaving it in the middle of the hall.
        const northClosed = !(this.level.floor[r - 1] && this.level.floor[r - 1][c]);
        if (northClosed) {
          board.position.set(spot.x, 1.55, spot.z - this.cell / 2 + 0.2);
        } else {
          board.position.set(spot.x - this.cell / 2 + 0.2, 1.55, spot.z);
          board.rotation.y = Math.PI / 2;
        }
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

      // A baseboard sticks out where the wall meets the carpet.
      const trim = new THREE.Mesh(ox !== 0 ? this.trimZ : this.trimX, this.trim);
      const nudge = 0.18;
      trim.position.set(
        x + ox + (ox === 0 ? 0 : -Math.sign(ox) * nudge),
        0.09,
        z + oz + (oz === 0 ? 0 : -Math.sign(oz) * nudge)
      );
      this.scene.add(trim);
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

function surface(map, color, roughness, metalness) {
  return new THREE.MeshStandardMaterial({ map, color, roughness, metalness });
}

function wallpaperTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#c9b15a";
  ctx.fillRect(0, 0, size, size);
  // Paper grain, so the wall is not one flat color between the motifs.
  for (let i = 0; i < 7000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(90, 78, 28, 0.07)" : "rgba(255, 236, 180, 0.08)";
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  const step = 64;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const flip = (x / step + y / step) % 2 === 0 ? 1 : -1;
      drawDamask(ctx, x + 32, y + 32, flip);
    }
  }
  // A faint seam, like two sheets of wallpaper meeting.
  ctx.strokeStyle = "rgba(70, 58, 20, 0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(1.6, 1.35);
  return texture;
}

function drawDamask(ctx, cx, cy, flip) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flip, 1);
  ctx.fillStyle = "#5f6830";
  ctx.strokeStyle = "#4e5828";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(14, -14, 11, 0, 0, 2);
  ctx.bezierCurveTo(-11, 0, -14, -14, 0, -22);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(12, 8, 9, 20, 0, 24);
  ctx.bezierCurveTo(-9, 20, -12, 8, 0, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.quadraticCurveTo(-22, -3, -20, 11);
  ctx.quadraticCurveTo(-14, 4, -5, 5);
  ctx.moveTo(5, 0);
  ctx.quadraticCurveTo(22, -3, 20, 11);
  ctx.quadraticCurveTo(14, 4, 5, 5);
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
  const stains = [];
  for (let s = 0; s < 7; s++) {
    stains.push({
      x: Math.random() * size,
      y: Math.random() * size,
      radius: 22 + Math.random() * 46,
      dark: Math.random() > 0.45,
    });
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const speck = Math.random();
      let red = 176;
      let green = 146;
      let blue = 72;
      if (speck > 0.78) {
        red = 214;
        green = 186;
        blue = 108;
      } else if (speck < 0.2) {
        red = 128;
        green = 98;
        blue = 40;
      }
      const fiber = Math.sin(x * 0.37 + y * 0.11) * Math.cos(y * 0.29);
      red += fiber * 8;
      green += fiber * 6;
      for (const stain of stains) {
        const distance = Math.hypot(x - stain.x, y - stain.y);
        if (distance >= stain.radius) continue;
        const amount = (1 - distance / stain.radius) * 0.4;
        if (stain.dark) {
          red -= 48 * amount;
          green -= 34 * amount;
          blue -= 16 * amount;
        } else {
          red += 28 * amount;
          green += 20 * amount;
          blue += 8 * amount;
        }
      }
      const index = (y * size + x) * 4;
      data[index] = Math.max(0, Math.min(255, red));
      data[index + 1] = Math.max(0, Math.min(255, green));
      data[index + 2] = Math.max(0, Math.min(255, blue));
      data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(4, 4);
  return texture;
}

function ceilingTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#cfc6aa";
  ctx.fillRect(0, 0, size, size);
  const tile = 64;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const shade = 214 + Math.floor(Math.random() * 22);
      ctx.fillStyle = `rgb(${shade}, ${shade - 10}, ${shade - 32})`;
      ctx.fillRect(x + 4, y + 4, tile - 8, tile - 8);
      ctx.fillStyle = "rgba(80, 62, 28, 0.22)";
      ctx.fillRect(x + 4, y + 4, tile - 8, 3);
      ctx.fillRect(x + 4, y + 4, 3, tile - 8);
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = Math.random() > 0.55 ? "rgba(255, 250, 230, 0.28)" : "rgba(70, 52, 18, 0.14)";
        ctx.fillRect(x + 8 + Math.random() * (tile - 16), y + 8 + Math.random() * (tile - 16), 2, 2);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(2, 2);
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
