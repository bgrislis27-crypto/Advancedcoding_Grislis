import * as THREE from "three";

// Painted textures. The 3D shapes stay simple, but these pictures
// add grass, bark, and wood grain so the scene is less flat.

const cache = {};

function makeCanvas(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function toTexture(canvas, repeatX, repeatY) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  return texture;
}

function once(name, build) {
  if (!cache[name]) cache[name] = build();
  return cache[name];
}

// Mostly white, with small dark marks. Multiplied by the ground colors
// so snow stays white and grass gets specks and blades.
export function createGroundDetail() {
  return once("ground", () => {
    const size = 256;
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f4f6f1";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2200; i++) {
      const shade = 120 + Math.floor(Math.random() * 100);
      ctx.strokeStyle = `rgb(${shade}, ${shade + 8}, ${shade - 10})`;
      ctx.lineWidth = 1;
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 3, y - (3 + Math.random() * 9));
      ctx.stroke();
    }

    return toTexture(canvas, 55, 55);
  });
}

// Light flecks so pine needles are not one flat green.
export function createNeedleDetail() {
  return once("needle", () => {
    const size = 128;
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3f6f2";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#8ea48a" : "#ffffff";
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 1 + Math.random() * 4);
    }

    return toTexture(canvas, 2, 3);
  });
}

export function createBarkTexture() {
  return once("bark", () => {
    const size = 128;
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#6a4630";
    ctx.fillRect(0, 0, size, size);

    for (let x = 0; x < size; x += 4) {
      const shade = 50 + Math.floor(Math.random() * 50);
      ctx.fillStyle = `rgb(${shade + 30}, ${shade}, ${Math.max(0, shade - 10)})`;
      ctx.fillRect(x, 0, 1 + Math.random() * 2, size);
    }

    return toTexture(canvas, 1, 3);
  });
}

export function createRockDetail() {
  return once("rock", () => {
    const size = 128;
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e7e8e4";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 700; i++) {
      const shade = 140 + Math.floor(Math.random() * 90);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade - 4})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 5, 2 + Math.random() * 4);
    }

    return toTexture(canvas, 2, 2);
  });
}

export function createWoodTexture() {
  return once("wood", () => {
    const size = 128;
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e6d3ae";
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 3) {
      const shade = 160 + Math.floor(Math.random() * 60);
      ctx.fillStyle = `rgb(${shade + 20}, ${shade}, ${shade - 40})`;
      ctx.fillRect(0, y, size, 1);
    }

    return toTexture(canvas, 1, 2);
  });
}

export function createSkinTexture() {
  return once("skin", () => {
    const size = 64;
    const canvas = makeCanvas(size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e7b892";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 180; i++) {
      const shade = 180 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgba(${shade}, ${shade - 30}, ${shade - 55}, 0.35)`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }

    return toTexture(canvas, 1, 1);
  });
}
