import * as THREE from "three";

// This file builds what you see in your hands: arms, a wooden bow, and an arrow.
// It is attached to the camera so it stays on the screen while you look around.

export class Viewmodel {
  constructor(camera) {
    this.root = new THREE.Group();
    this.base = new THREE.Vector3(0.08, -0.2, -0.32); // resting spot in the bottom of the view
    this.draw = 0; // 0 = relaxed bow, 1 = pulled back
    this.build();
    camera.add(this.root);
  }

  build() {
    const skin = new THREE.MeshStandardMaterial({
      color: 0xe0b089,
      roughness: 0.55,
      metalness: 0.02,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: 0xe4d2ae,
      roughness: 0.72,
      metalness: 0.04,
    });
    const wrap = new THREE.MeshStandardMaterial({
      color: 0x6a5643,
      roughness: 0.92,
    });
    const rope = new THREE.MeshStandardMaterial({
      color: 0x4a3f34,
      roughness: 1,
    });
    const iron = new THREE.MeshStandardMaterial({
      color: 0x8a9096,
      roughness: 0.35,
      metalness: 0.55,
    });

    const leftArm = this.makeArm(skin);
    leftArm.position.set(-0.09, -0.12, -0.02);
    leftArm.rotation.set(1.15, 0.05, 0.55);
    leftArm.scale.setScalar(1.15);
    this.root.add(leftArm);

    // Curve points that make the bow's wooden shape.
    const bow = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, -0.16, 0),
      new THREE.Vector3(0.07, -0.07, 0.01),
      new THREE.Vector3(0.09, 0, 0.012),
      new THREE.Vector3(0.07, 0.07, 0.01),
      new THREE.Vector3(-0.02, 0.16, 0),
    ]);
    const stave = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.007, 8, false), wood);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.05, 8), wrap);
    grip.position.set(0.04, 0, 0.008);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.3, 5), rope);
    string.position.set(-0.018, 0, 0);
    bow.add(stave, grip, string);
    bow.position.set(0.14, -0.04, -0.04);
    bow.rotation.set(0.05, 1.05, -0.35);
    this.root.add(bow);

    const rightHand = this.makeHand(skin);
    rightHand.position.set(0.11, -0.09, 0.01);
    rightHand.rotation.set(0.5, 0.9, 0.1);
    this.root.add(rightHand);

    this.arrow = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16, 6), wood);
    shaft.rotation.z = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.02, 6), iron);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 0.085;
    this.arrow.add(shaft, tip);
    this.arrow.position.set(-0.02, -0.05, -0.06);
    this.arrow.rotation.set(0.12, 0.35, 0.08);
    this.root.add(this.arrow);

    this.root.position.copy(this.base);
    this.root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        obj.renderOrder = 10; // draw the hands on top of nearby grass
      }
    });
  }

  makeArm(skin) {
    const arm = new THREE.Group();
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.16, 8), skin);
    forearm.rotation.z = Math.PI / 2;
    forearm.position.set(0.02, 0, 0);
    const hand = this.makeHand(skin);
    hand.position.set(0.1, 0.008, 0.004);
    arm.add(forearm, hand);
    return arm;
  }

  makeHand(skin) {
    const hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.046, 0.02), skin);
    hand.add(palm);
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.026, 0.007), skin);
      finger.position.set(-0.012 + i * 0.008, 0.032, 0);
      hand.add(finger);
    }
    return hand;
  }

  update(dt, player, drawing) {
    // Ease the bow toward drawn or relaxed.
    this.draw += ((drawing ? 1 : 0.16) - this.draw) * Math.min(1, dt * 8);

    // Small bounce while walking so the hands don't look frozen.
    const moving = player.speed > 0.1 ? 1 : 0.12;
    const bob = Math.sin(player.bob) * 0.01 * moving;
    const sway = Math.cos(player.bob * 0.5) * 0.008 * moving;
    this.root.position.set(this.base.x + sway, this.base.y + bob, this.base.z);
    this.root.rotation.z = sway * 0.3;
    this.arrow.position.x = -0.02 - this.draw * 0.05;
  }
}
