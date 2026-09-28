import * as THREE from "three";
import { Input } from "./input.js";
import { generateLevel } from "./maze.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { Creature } from "./creature.js";
import { Soundscape } from "./audio.js";
import { Hud } from "./hud.js";

// Builds the 3D Backrooms and runs the timer, creature, and win / lose checks.

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc6b07a);
    this.scene.fog = new THREE.Fog(0xc6b07a, 8, 32);

    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 50);
    this.scene.add(this.camera);

    this.level = generateLevel(13, 13);
    this.world = new World(this.scene, this.level);
    this.input = new Input(canvas);
    this.player = new Player(this.camera, this.world);
    this.lamp = new THREE.PointLight(0xfff0c8, 2.2, 16, 1.4);
    this.camera.add(this.lamp);
    this.creature = new Creature(this.scene, this.level, this.world);
    this.audio = new Soundscape();
    this.hud = new Hud();
    this.state = "menu";
    this.time = 0;
    this.last = 0;

    window.addEventListener("resize", () => this.resize());
    document.getElementById("start-btn").addEventListener("click", () => this.enter());
    document.getElementById("win-btn").addEventListener("click", () => location.reload());
    document.getElementById("lose-btn").addEventListener("click", () => location.reload());
    canvas.addEventListener("click", () => {
      if (this.state === "play") this.input.lock();
    });
  }

  enter() {
    this.state = "play";
    this.hud.show();
    this.input.lock();
    this.audio.start();
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.last = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(time) {
    const dt = Math.min((time - this.last) / 1000, 0.05);
    this.last = time;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    this.world.update(dt);
    if (this.state !== "play") return;

    this.time += dt;
    this.player.update(dt, this.input);
    if (this.player.escaped) {
      this.finish("won");
      return;
    }

    this.creature.update(dt, this.player);
    if (this.creature.caughtPlayer) {
      this.finish("lost");
      return;
    }

    this.hud.update(this.player, this.time, this.player.prompt);
    this.audio.update(dt, this.player, this.world);
  }

  finish(result) {
    this.state = result;
    document.exitPointerLock();
    this.audio.stop();
    if (result === "won") this.hud.showWin(this.time);
    else this.hud.showLose(this.time);
  }
}
