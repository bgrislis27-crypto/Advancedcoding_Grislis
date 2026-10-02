import * as THREE from "three";
import { Input } from "./input.js";
import { generateLevel } from "./maze.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { Creature } from "./creature.js";
import { Soundscape } from "./audio.js";
import { Hud } from "./hud.js";
import { Lighting } from "./lighting.js";
import { CameraEffects } from "./camera.js";
import { Watcher } from "./watcher.js";
import { Changes } from "./changes.js";
import { HorrorEvents } from "./events.js";
import { Doors } from "./doors.js";
import { Fear } from "./fear.js";
import { Flashlight } from "./flashlight.js";
import { Hallucination } from "./hallucination.js";
import { TimeWarp } from "./timewarp.js";
import { Jumpscare } from "./scare.js";

// Builds the 3D Backrooms and runs the timer, creature, and win / lose checks.

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    // Fog thickens with distance, so the far end of a hall fades to dark yellow.
    this.scene.background = new THREE.Color(0x1a160e);
    this.scene.fog = new THREE.FogExp2(0x2a2416, 0.06);

    this.camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 50);
    this.scene.add(this.camera);

    this.level = generateLevel(17, 15);
    this.world = new World(this.scene, this.level);
    this.input = new Input(canvas);
    this.player = new Player(this.camera, this.world);
    this.lamp = new THREE.PointLight(0xfff0c8, 2.2, 16, 1.4);
    this.camera.add(this.lamp);
    this.flashlight = new Flashlight(this.lamp);
    this.doors = new Doors(this.scene, this.world);
    this.player.doorSystem = this.doors;
    this.lighting = new Lighting(this.world);
    this.creature = new Creature(this.scene, this.level, this.world);
    this.watcher = new Watcher(this.scene, this.world);
    this.changes = new Changes(this.scene, this.world);
    this.cameraFx = new CameraEffects();
    this.audio = new Soundscape();
    this.fear = new Fear(this.world);
    this.hallucination = new Hallucination(this.scene);
    this.timewarp = new TimeWarp();
    this.scare = new Jumpscare(this.camera, this.audio);
    this.events = new HorrorEvents(
      this.audio,
      this.changes,
      this.watcher,
      this.cameraFx,
      this.fear,
      this.flashlight,
      this.creature
    );
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
    this.lighting.update(dt);
    if (this.state !== "play") return;

    this.time += dt;
    this.player.update(dt, this.input);
    this.flashlight.update(dt, this.input, this.player);
    this.doors.update(this.player);
    if (this.player.escaped) {
      this.finish("won");
      return;
    }

    this.creature.update(dt, this.player);
    if (this.creature.caughtPlayer) {
      this.finish("lost");
      return;
    }

    this.watcher.update(dt, this.player);
    this.events.update(dt, this.player);
    const fearLevel = this.fear.update(dt, this.player, this.flashlight, this.creature);
    this.cameraFx.update(dt, this.player, fearLevel);
    this.hallucination.update(dt, this.player, this.fear);
    this.timewarp.update(this.player, this.changes, this.world);
    this.scare.update(dt, this.fear, this.events, this.creature);
    this.lighting.setFear(fearLevel);
    this.hud.update(this.player, this.time, this.player.prompt, this.flashlight.battery);
    this.audio.setFear(fearLevel);
    this.audio.update(dt, this.player, this.lighting);
  }

  finish(result) {
    this.state = result;
    document.exitPointerLock();
    this.audio.stop();
    if (result === "won") this.hud.showWin(this.time);
    else this.hud.showLose(this.time);
  }
}
