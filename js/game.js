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
import { Darkness } from "./darkness.js";

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
      this.creature,
      this.darkness
    );
    this.hud = new Hud();
    this.state = "menu";
    this.mode = "classic";
    this.difficulty = "normal";
    this.limit = 180;
    this.darkness = new Darkness();
    this.time = 0;
    this.last = 0;
    this.prepareMenu();

    window.addEventListener("resize", () => this.resize());
    document.getElementById("start-btn").addEventListener("click", () => this.enter());
    document.getElementById("settings-btn").addEventListener("click", () => this.showMenu("menu-settings"));
    document.getElementById("more-btn").addEventListener("click", () => this.showMenu("menu-more"));
    document.getElementById("settings-back").addEventListener("click", () => this.showMenu("menu-main"));
    document.getElementById("more-back").addEventListener("click", () => this.showMenu("menu-main"));
    document.getElementById("more-wake").addEventListener("click", () => this.enter());
    document.getElementById("more-settings").addEventListener("click", () => this.showMenu("menu-settings"));
    for (const button of document.querySelectorAll(".mode-btn")) {
      button.addEventListener("click", () => this.pickMode(button.dataset.mode));
    }
    for (const button of document.querySelectorAll(".diff-btn")) {
      button.addEventListener("click", () => this.pickDifficulty(button.dataset.difficulty));
    }
    document.getElementById("win-btn").addEventListener("click", () => location.reload());
    document.getElementById("lose-btn").addEventListener("click", () => location.reload());
    canvas.addEventListener("click", () => {
      if (this.state === "play") this.input.lock();
    });
  }

  // The menu sits on a brighter view of the same halls. Play starts dimmer.
  prepareMenu() {
    this.renderer.toneMappingExposure = 1.65;
    this.scene.fog.density = 0.018;
    this.scene.fog.color.set(0xc2b06a);
    this.scene.background.set(0xc2b06a);
    this.world.ambient.intensity = 0.62;
    this.lamp.intensity = 0;
    this.player.pitch = 0.16;
    this.player.syncCamera();
  }

  showMenu(id) {
    document.querySelector(".menu-wrap").classList.toggle("is-wide", id === "menu-more");
    for (const name of ["menu-main", "menu-settings", "menu-more"]) {
      document.getElementById(name).classList.toggle("is-hidden", name !== id);
    }
  }

  pickMode(mode) {
    this.mode = mode;
    const notes = {
      classic: "THE LIGHTS CUT OUT AT RANDOM.",
      deaf: "NO SOUND. THE LIGHTS STILL CUT OUT.",
      free: "FEWER FLASHES. THE CLOCK STILL RUNS.",
    };
    document.getElementById("mode-note").textContent = notes[mode];
    for (const button of document.querySelectorAll(".mode-btn")) {
      button.classList.toggle("is-picked", button.dataset.mode === mode);
    }
    this.showChoice();
  }

  pickDifficulty(difficulty) {
    this.difficulty = difficulty;
    const notes = {
      easy: "THE DARKNESS COMES LESS OFTEN.",
      normal: "THREE MINUTES. A FAIR PACE.",
      hard: "THE DARKNESS COMES MORE OFTEN.",
    };
    document.getElementById("diff-note").textContent = notes[difficulty];
    for (const button of document.querySelectorAll(".diff-btn")) {
      button.classList.toggle("is-picked", button.dataset.difficulty === difficulty);
    }
    this.showChoice();
  }

  showChoice() {
    const modes = { classic: "CLASSIC", deaf: "DEAF", free: "FREE" };
    const levels = { easy: "EASY", normal: "NORMAL", hard: "HARD" };
    document.getElementById("mode-label").textContent = `${modes[this.mode]} · ${levels[this.difficulty]}`;
  }

  applyDifficulty() {
    const tune = {
      easy: { chase: 2.0, anger: 0.9, catch: 0.9, lose: 2.2, chance: 0.07, deaf: 0.02, stamina: 16, battery: 2.1, fear: 2.2 },
      normal: { chase: 2.7, anger: 1.6, catch: 1.15, lose: 3.5, chance: 0.15, deaf: 0.04, stamina: 26, battery: 3.2, fear: 4 },
      hard: { chase: 3.5, anger: 2.5, catch: 1.35, lose: 5.5, chance: 0.28, deaf: 0.08, stamina: 38, battery: 4.8, fear: 6.5 },
    }[this.difficulty];
    this.creature.chaseSpeed = tune.chase;
    this.creature.angerGain = tune.anger;
    this.creature.catchDistance = tune.catch;
    this.creature.loseChase = tune.lose;
    this.creature.chaseChance = tune.chance;
    this.creature.deafChase = tune.deaf;
    this.player.sprintDrain = tune.stamina;
    this.flashlight.drainRate = tune.battery;
    this.fear.darkGain = tune.fear;
    const pace = { easy: 0.55, normal: 1, hard: 1.75 };
    this.darkness.rate = pace[this.difficulty] * (this.mode === "free" ? 0.45 : 1);
  }

  enter() {
    this.applyDifficulty();
    this.creature.mode = this.mode;
    this.scare.mode = this.mode;
    this.state = "play";
    this.renderer.toneMappingExposure = 1.22;
    this.scene.fog.density = 0.02;
    this.scene.fog.color.set(0xd2c07a);
    this.scene.background.set(0xd2c07a);
    this.world.ambient.intensity = this.world.baseAmbient;
    this.player.pitch = -0.08;
    this.player.syncCamera();
    this.hud.show();
    this.input.lock();
    if (this.mode !== "deaf") this.audio.start();
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
    const left = Math.max(0, this.limit - this.time);
    this.player.update(dt, this.input);
    this.flashlight.update(dt, this.input, this.player);
    this.doors.update(this.player);
    if (this.player.escaped) {
      this.finish("won");
      return;
    }
    if (left <= 0) {
      this.finish("lost");
      return;
    }

    this.events.update(dt, this.player);
    const fearLevel = this.fear.update(dt, this.player, this.flashlight, this.creature);
    this.cameraFx.update(dt, this.player, fearLevel);
    this.timewarp.update(this.player, this.changes, this.world);
    this.lighting.setFear(fearLevel);
    this.darkness.update(dt);
    this.hud.update(this.player, left, this.player.prompt, this.flashlight.battery);
    this.audio.setFear(fearLevel);
    this.audio.update(dt, this.player, this.lighting);
  }

  finish(result) {
    this.state = result;
    document.exitPointerLock();
    this.audio.stop();
    const left = Math.max(0, this.limit - this.time);
    if (result === "won") this.hud.showWin(left);
    else this.hud.showLose(left);
  }
}
