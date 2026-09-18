import * as THREE from "three";

/**
 * First-person arms, wooden bow, and nocked arrow parented to the camera.
 */
export class Viewmodel {
  constructor(camera) {
    this.root = new THREE.Group();
    this.base = new THREE.Vector3(0.12, -0.28, -0.42);
    this.draw = 0;
    this.build();
    camera.add(this.root);
  }

  build() {
    const skin = new THREE.MeshStandardMaterial({
      color: 0xd0a07a,
      roughness: 0.62,
      metalness: 0.02,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: 0xd7c19a,
      roughness: 0.78,
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

    const bow = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, -0.38, 0),
      new THREE.Vector3(0.08, -0.18, 0.01),
      new THREE.Vector3(0.1, 0, 0.015),
      new THREE.Vector3(0.08, 0.18, 0.01),
      new THREE.Vector3(0.0, 0.38, 0),
    ]);
    const stave = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.011, 8, false), wood);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.1, 8), wrap);
    grip.position.set(0.05, 0, 0.01);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.74, 5), rope);
    string.position.set(-0.01, 0, 0);

    bow.add(stave, grip, string);
    bow.position.set(0.2, -0.02, -0.08);
    bow.rotation.set(0.15, 0.85, -0.55);
    this.root.add(bow);

    this.arrow = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.46, 6), wood);
    shaft.rotation.z = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.035, 6), iron);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 0.24;
    this.arrow.add(shaft, tip);
    this.arrow.position.set(-0.02, -0.04, -0.18);
    this.arrow.rotation.set(0.08, 0.12, 0.04);
    this.root.add(this.arrow);

    const leftArm = this.makeArm(skin);
    leftArm.position.set(-0.08, -0.18, -0.12);
    leftArm.rotation.set(1.05, 0.15, 0.35);
    this.root.add(leftArm);

    const rightHand = this.makeHand(skin);
    rightHand.position.set(0.16, -0.16, -0.02);
    rightHand.rotation.set(0.35, 0.7, -0.2);
    this.root.add(rightHand);

    this.root.position.copy(this.base);
    this.root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
  }

  makeArm(skin) {
    const arm = new THREE.Group();
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, 0.26, 8), skin);
    forearm.rotation.z = Math.PI / 2;
    forearm.position.set(-0.05, 0, 0);
    const hand = this.makeHand(skin);
    hand.position.set(0.1, 0.01, 0);
    arm.add(forearm, hand);
    return arm;
  }

  makeHand(skin) {
    const hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.028), skin);
    hand.add(palm);
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.04, 0.011), skin);
      finger.position.set(-0.018 + i * 0.013, 0.05, 0);
      hand.add(finger);
    }
    return hand;
  }

  update(dt, player, drawing) {
    this.draw += ((drawing ? 1 : 0.16) - this.draw) * Math.min(1, dt * 8);
    const moving = player.speed > 0.1 ? 1 : 0.12;
    const bob = Math.sin(player.bob) * 0.014 * moving;
    const sway = Math.cos(player.bob * 0.5) * 0.01 * moving;
    this.root.position.set(this.base.x + sway, this.base.y + bob, this.base.z);
    this.root.rotation.z = sway * 0.35;
    this.arrow.position.x = -0.02 - this.draw * 0.08;
  }
}
