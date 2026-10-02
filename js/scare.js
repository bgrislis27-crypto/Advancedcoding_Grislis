import * as THREE from "three";

// A rare close scare. It only fires after fear is already high and something odd just happened.

export class Jumpscare {
  constructor(camera, audio) {
    this.audio = audio;
    this.cooldown = 70;
    this.left = 0;
    this.ready = false;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.6),
      new THREE.MeshBasicMaterial({ color: 0x070605 })
    );
    this.mesh.position.set(0, 0, -0.55);
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2200 })
    );
    eye.position.set(-0.18, 0.25, 0.02);
    const other = eye.clone();
    other.position.x = 0.18;
    this.mesh.add(eye, other);
    this.mesh.visible = false;
    camera.add(this.mesh);
  }

  update(dt, fear, events, creature) {
    this.cooldown -= dt;
    if (this.left > 0) {
      this.left -= dt;
      if (this.left <= 0) {
        this.mesh.visible = false;
        creature.enter("hidden");
      }
      return;
    }

    if (this.cooldown > 0) return;
    if (fear.level < 58 || events.since > 6) {
      this.ready = true;
      return;
    }
    if (!this.ready) return;
    this.ready = false;
    if (Math.random() > 0.35) return;

    this.mesh.visible = true;
    this.left = 0.28;
    this.cooldown = 100;
    this.audio.sting();
    fear.add(18);
  }
}
