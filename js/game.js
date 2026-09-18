import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Input } from "./input.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { Viewmodel } from "./viewmodel.js";
import { Hud } from "./hud.js";

/**
 * Sets up the 3D scene, lighting, fog, and the main loop.
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xb9cbe0, 48, 280);

    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.08, 600);
    this.scene.add(this.camera);

    this.addSkyAndLights();

    this.world = new World(this.scene);
    this.input = new Input(canvas);
    this.player = new Player(this.camera, this.world);
    this.viewmodel = new Viewmodel(this.camera);
    this.hud = new Hud();
    this.lastTime = 0;
    this.started = false;

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

    const sunPos = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90 - 22);
    const theta = THREE.MathUtils.degToRad(168);
    sunPos.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms.sunPosition.value.copy(sunPos);
    sky.material.uniforms.turbidity.value = 4.5;
    sky.material.uniforms.rayleigh.value = 1.15;
    sky.material.uniforms.mieCoefficient.value = 0.004;
    sky.material.uniforms.mieDirectionalG.value = 0.8;

    this.scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x5d6b3a, 0.55));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.15);
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

    this.sun.position.set(
      this.player.x + this.sunDirection.x * 70,
      this.player.camera.position.y + 55,
      this.player.z + this.sunDirection.z * 70
    );
    this.sun.target.position.set(this.player.x, this.world.heightAt(this.player.x, this.player.z), this.player.z);
    this.sun.target.updateMatrixWorld();
  }
}
