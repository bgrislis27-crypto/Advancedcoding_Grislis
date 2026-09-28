import * as THREE from "three";

// Turns the maze numbers into yellow hallways, carpet, ceiling lights, and a green exit door.

export class World {
  constructor(scene, level) {
    this.scene = scene;
    this.level = level;
    this.cell = level.cell;
    this.flickerLights = [];
    this.flickerAmount = 0;
    this.time = 0;
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

  build() {
    const { level } = this;
    const S = level.cell;
    const height = 3.2;

    const wallpaper = new THREE.MeshLambertMaterial({ map: wallpaperTexture(), color: 0xffffff });
    const darkWall = new THREE.MeshLambertMaterial({ color: 0x6a5428 });
    const carpet = new THREE.MeshLambertMaterial({ map: carpetTexture(), color: 0xffffff });
    const darkCarpet = new THREE.MeshLambertMaterial({ color: 0x3a3120 });
    const ceiling = new THREE.MeshLambertMaterial({ color: 0xe4dece });
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

        const floorMesh = new THREE.Mesh(floorBox, hide ? darkCarpet : carpet);
        floorMesh.position.set(x, -0.1, z);
        this.scene.add(floorMesh);

        const ceilingMesh = new THREE.Mesh(ceilingBox, hide ? darkWall : ceiling);
        ceilingMesh.position.set(x, height, z);
        this.scene.add(ceilingMesh);

        this.addWalls(c, r, x, z, height, hide ? darkWall : wallpaper, wallX, wallZ);

        if (hide) continue;

        const lamp = new THREE.Mesh(lampBox, lampMaterial.clone());
        lamp.position.set(x, height - 0.08, z);
        this.scene.add(lamp);

        // A real light only in some halls, so the game stays smooth.
        if ((c + r) % 2 === 0 && lightCount < 18) {
          const light = new THREE.PointLight(0xfff1c2, 2.4, 22, 1.6);
          light.position.set(x, height - 0.45, z);
          this.scene.add(light);
          lightCount += 1;
          if (Math.random() < 0.45) {
            this.flickerLights.push({
              light,
              material: lamp.material,
              phase: Math.random() * 20,
            });
          }
        }
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

    this.scene.add(new THREE.AmbientLight(0xffe8b0, 0.85));
    this.scene.add(new THREE.HemisphereLight(0xfff8dc, 0x8a6840, 0.45));
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

  update(dt) {
    this.time += dt;
    let flicker = 0;

    for (const item of this.flickerLights) {
      const wave = Math.sin(this.time * 28 + item.phase);
      const dip = wave > 0.55 || Math.random() < 0.015 ? 0.12 : 1;
      item.light.intensity = 2.4 * dip;
      item.material.emissiveIntensity = dip;
      flicker += 1 - dip;
    }

    this.flickerAmount = this.flickerLights.length ? flicker / this.flickerLights.length : 0;
  }
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
