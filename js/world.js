import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createNoise, smoothstep } from "./noise.js";

/**
 * Builds the forest, meadow, rocks, mountains, flowers, and falling snow.
 */
export class World {
  constructor(scene) {
    this.scene = scene;
    this.noise = createNoise(904);
    this.treeSpots = [];
    this.snow = null;
    this.snowPositions = null;

    this.addTerrain();
    this.addMountains();
    this.addClouds();
    this.addForest();
    this.addRocks();
    this.addMeadow();
    this.addSnow();
  }

  heightAt(x, z) {
    const d = Math.hypot(x, z);
    const n1 = this.noise.fbm(x * 0.007, z * 0.007, 5);
    const n2 = this.noise.fbm(x * 0.028 + 40, z * 0.028, 3);
    const meadow = 1 - smoothstep(18, 62, d);
    const mountain = Math.pow(smoothstep(68, 175, d), 1.28) * (48 + n1 * 34);
    const hills = n1 * 6.5 + n2 * 2.2;
    return meadow * (0.6 + hills * 0.2) + (1 - meadow) * (hills + 1.5) + mountain;
  }

  inBounds(x, z) {
    return Math.hypot(x, z) < 132;
  }

  blocked(x, z) {
    for (const tree of this.treeSpots) {
      if (Math.hypot(x - tree.x, z - tree.z) < tree.radius) return true;
    }
    return false;
  }

  addTerrain() {
    const size = 420;
    const segs = 175;
    const geometry = new THREE.PlaneGeometry(size, size, segs, segs);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const grass = new THREE.Color(0x4d7a32);
    const bright = new THREE.Color(0x6e9a3d);
    const dry = new THREE.Color(0x7d8a45);
    const rock = new THREE.Color(0x8a8c86);
    const snow = new THREE.Color(0xf2f6fa);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.heightAt(x, z);
      pos.setY(i, y);

      const d = Math.hypot(x, z);
      const flower = this.noise.noise2(x * 0.12, z * 0.12);
      const color = new THREE.Color();
      if (y > 38) color.copy(snow);
      else if (y > 26) color.lerpColors(rock, snow, smoothstep(26, 40, y));
      else if (d < 55) {
        color.lerpColors(grass, bright, flower);
        if (flower > 0.62) color.lerp(new THREE.Color(0xd7c34a), 0.35);
      } else color.lerpColors(dry, rock, smoothstep(18, 34, y));

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.95,
        metalness: 0,
      })
    );
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  addMountains() {
    const rock = new THREE.Color(0x8d9094);
    const snow = new THREE.Color(0xf4f7fb);
    for (let i = 0; i < 18; i++) {
      const angle = -Math.PI * 0.72 + (i / 17) * Math.PI * 1.44;
      const dist = 148 + (i % 4) * 10;
      const x = Math.sin(angle) * dist;
      const z = -Math.abs(Math.cos(angle)) * dist - 10;
      const peak = new THREE.ConeGeometry(16 + (i % 5) * 3.5, 48 + (i % 6) * 8, 6);
      const colors = new Float32Array(peak.attributes.position.count * 3);
      for (let v = 0; v < peak.attributes.position.count; v++) {
        const y = peak.attributes.position.getY(v);
        const mix = smoothstep(4, 18, y);
        const color = rock.clone().lerp(snow, mix);
        colors[v * 3] = color.r;
        colors[v * 3 + 1] = color.g;
        colors[v * 3 + 2] = color.b;
      }
      peak.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mesh = new THREE.Mesh(
        peak,
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, flatShading: true })
      );
      mesh.position.set(x, this.heightAt(x, z) + 10, z);
      mesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(mesh);
    }
  }

  addClouds() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    gradient.addColorStop(0, "rgba(255,255,255,0.85)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(48 + Math.random() * 30, 18 + Math.random() * 10),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          opacity: 0.55,
        })
      );
      cloud.position.set((Math.random() - 0.5) * 220, 48 + Math.random() * 18, -40 - Math.random() * 140);
      cloud.lookAt(0, 40, 0);
      this.scene.add(cloud);
    }
  }

  addForest() {
    const pine = createPineGeometry();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0,
    });

    const count = 240;
    const mesh = new THREE.InstancedMesh(pine, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;

    while (placed < count && attempts < 2000) {
      attempts += 1;
      const x = (Math.random() - 0.5) * 280;
      const z = (Math.random() - 0.5) * 280;
      const d = Math.hypot(x, z);
      if (d < 22 || d > 138) continue;
      if (z < 8 && Math.abs(x) < 14 && d < 90) continue;
      if (this.treeSpots.some((t) => Math.hypot(t.x - x, t.z - z) < 4.2)) continue;

      const scale = 1.3 + Math.random() * 1.7;
      dummy.position.set(x, this.heightAt(x, z), z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      this.treeSpots.push({ x, z, radius: 0.9 * scale });
      placed += 1;
    }

    mesh.count = placed;
    this.scene.add(mesh);

    const heroPositions = [
      [9.5, -4, 2.1],
      [16, 8, 1.8],
      [-18, 6, 1.9],
      [22, -18, 2.2],
    ];
    for (const [x, z, scale] of heroPositions) {
      const tree = new THREE.Mesh(pine, material);
      tree.position.set(x, this.heightAt(x, z), z);
      tree.scale.setScalar(scale);
      tree.castShadow = true;
      tree.receiveShadow = true;
      this.scene.add(tree);
      this.treeSpots.push({ x, z, radius: 1.1 * scale });
    }
  }

  addRocks() {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b8d86,
      roughness: 0.95,
      flatShading: true,
    });
    const dummy = new THREE.Object3D();
    const mesh = new THREE.InstancedMesh(geo, material, 90);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    for (let i = 0; i < 90; i++) {
      const x = (Math.random() - 0.5) * 240;
      const z = (Math.random() - 0.5) * 240;
      dummy.position.set(x, this.heightAt(x, z) + 0.2, z);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.scale.set(0.4 + Math.random() * 1.8, 0.3 + Math.random() * 1.1, 0.4 + Math.random() * 1.6);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(mesh);

    const cliff = new THREE.Mesh(
      new THREE.BoxGeometry(18, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0x6f736c, roughness: 1, flatShading: true })
    );
    cliff.position.set(42, this.heightAt(42, -8) + 5, -8);
    cliff.rotation.y = 0.4;
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    this.scene.add(cliff);
  }

  addMeadow() {
    const flowerGeo = mergeGeometries([
      colored(new THREE.SphereGeometry(0.07, 6, 6), new THREE.Color(0xe6c14a)),
      colored(new THREE.CylinderGeometry(0.012, 0.016, 0.18, 4).translate(0, -0.12, 0), new THREE.Color(0x3f7a28)),
    ]);
    const flowerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, 700);
    const dummy = new THREE.Object3D();
    let n = 0;
    while (n < 700) {
      const x = (Math.random() - 0.5) * 90;
      const z = (Math.random() - 0.5) * 90;
      if (Math.hypot(x, z) > 48) continue;
      dummy.position.set(x, this.heightAt(x, z) + 0.16, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(1.1 + Math.random() * 1.1);
      dummy.updateMatrix();
      flowers.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
    this.scene.add(flowers);

    const grassGeo = colored(new THREE.ConeGeometry(0.05, 0.28, 4), new THREE.Color(0x3c6b28));
    const grass = new THREE.InstancedMesh(
      grassGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
      900
    );
    n = 0;
    while (n < 900) {
      const x = (Math.random() - 0.5) * 110;
      const z = (Math.random() - 0.5) * 110;
      dummy.position.set(x, this.heightAt(x, z) + 0.1, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.set(0.6 + Math.random(), 0.8 + Math.random() * 1.4, 0.6 + Math.random());
      dummy.updateMatrix();
      grass.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
    this.scene.add(grass);
  }

  addSnow() {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(16, 16, 1, 16, 16, 14);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    this.snow = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(canvas),
        color: 0xffffff,
        size: 0.12,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        alphaTest: 0.05,
      })
    );
    this.snowPositions = positions;
    this.scene.add(this.snow);
  }

  update(dt, player) {
    if (!this.snow) return;
    this.snow.position.set(player.x, player.camera.position.y, player.z);
    const pos = this.snowPositions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= dt * (1.4 + (i % 5) * 0.15);
      pos[i] += dt * 0.35;
      if (pos[i + 1] < -2) {
        pos[i] = (Math.random() - 0.5) * 40;
        pos[i + 1] = 16;
        pos[i + 2] = (Math.random() - 0.5) * 40;
      }
    }
    this.snow.geometry.attributes.position.needsUpdate = true;
  }
}

function colored(geometry, color) {
  const count = geometry.attributes.position.count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geometry;
}

function createPineGeometry() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.11, 0.2, 7.4, 7);
  trunk.translate(0, 3.7, 0);
  parts.push(colored(trunk, new THREE.Color(0x5b3b24)));

  const greens = [0x1e3f22, 0x27542a, 0x1b3a20, 0x234b26, 0x16341b, 0x1a3c1f, 0x214826];
  for (let i = 0; i < 7; i++) {
    const cone = new THREE.ConeGeometry(1.55 - i * 0.18, 2.35, 9);
    cone.translate(0, 4.1 + i * 1.05, 0);
    parts.push(colored(cone, new THREE.Color(greens[i])));
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}
