import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Input } from "./input.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { Viewmodel } from "./viewmodel.js";
import { Hud } from "./hud.js";

// Game is the "director". It builds the 3D scene, then runs the loop
// that updates the player and draws each frame.

export class Game {
  constructor(canvas) {
    this.canvas = canvas;

    // The renderer draws the 3D scene onto the canvas.
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xc5d8ee, 70, 340); // far objects fade into the sky

    // The camera is the player's view. 68 is the field of view in degrees.
    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.08, 600);
    this.scene.add(this.camera);

    this.addSkyAndLights();

    this.world = new World(this.scene);
    this.input = new Input(canvas);
    this.player = new Player(this.camera, this.world);
    this.viewmodel = new Viewmodel(this.camera);
    this.hud = new Hud();
    this.lastTime = 0;
    this.started = false; // false until the player clicks "Enter the forest"

    window.addEventListener("resize", () => this.resize());
    document.getElementById("start-btn").addEventListener("click", () => this.enter());
    canvas.addEventListener("click", () => {
      if (this.started) this.input.lock();
    });
  }

  addSkyAndLights() {
    const sky = new Sky();
    sky.scale.setScalar(4500);
    this.scene.add(sky);

    // Place the sun in the sky. These numbers control how bright and blue it looks.
    const sunPos = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90 - 38);
    const theta = THREE.MathUtils.degToRad(175);
    sunPos.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms.sunPosition.value.copy(sunPos);
    sky.material.uniforms.turbidity.value = 2.2;
    sky.material.uniforms.rayleigh.value = 1.35;
    sky.material.uniforms.mieCoefficient.value = 0.003;
    sky.material.uniforms.mieDirectionalG.value = 0.82;

    // Soft light from the sky + a little extra brightness everywhere.
    this.scene.add(new THREE.HemisphereLight(0xd7ebff, 0x6a7b42, 0.7));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    // Main sunlight. This light is what makes tree shadows.
    this.sun = new THREE.DirectionalLight(0xfff3d8, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 160;
    this.sun.shadow.camera.left = -50;
    this.sun.shadow.camera.right = 50;
    this.sun.shadow.camera.top = 50;
    this.sun.shadow.camera.bottom = -50;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.sunDirection = sunPos.clone();
  }

  enter() {
    this.started = true;
    this.hud.show();
    this.input.lock();
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(time) {
    // dt = seconds since the last frame. We cap it so a lag spike
    // doesn't teleport the player.
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    if (this.started) {
      this.player.update(dt, this.input);
      this.viewmodel.update(dt, this.player, this.input.drawing);
      this.world.update(dt, this.player);
      this.hud.update(this.player, this.viewmodel.draw);
    }

    // Keep the sun (and its shadows) near the player as they walk.
    this.sun.position.set(
      this.player.x + this.sunDirection.x * 70,
      this.player.camera.position.y + 55,
      this.player.z + this.sunDirection.z * 70
    );
    this.sun.target.position.set(this.player.x, this.world.heightAt(this.player.x, this.player.z), this.player.z);
    this.sun.target.updateMatrixWorld();
  }
}
