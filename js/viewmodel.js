import * as THREE from "three";

/**
 * First-person arms, wooden bow, and nocked arrow parented to the camera.
 */
export class Viewmodel {
  constructor(camera) {
    this.root = new THREE.Group();
    this.base = new THREE.Vector3(0.18, -0.32, -0.52);
    this.draw = 0;
    this.build();
    camera.add(this.root);
  }

  build() {
    const skin = new THREE.MeshStandardMaterial({
      color: 0xc48a62,
      roughness: 0.72,
      metalness: 0.02,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: 0xcbb48a,
      roughness: 0.82,
      metalness: 0.05,
    });
    const wrap = new THREE.MeshStandardMaterial({
      color: 0x6d5840,
      roughness: 0.9,
    });
    const rope = new THREE.MeshStandardMaterial({
      color: 0x4e4034,
      roughness: 1,
    });
    const iron = new THREE.MeshStandardMaterial({
      color: 0x6d7378,
      roughness: 0.4,
      metalness: 0.6,
    });

    const bow = new THREE.Group();
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, -0.62, 0.02),
      new THREE.Vector3(0.22, 0, 0.08),
      new THREE.Vector3(0, 0.62, 0.02)
    );
    const stave = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.022, 7, false), wood);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.16, 8), wrap);
    grip.position.set(0.05, 0, 0.04);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.18, 5), rope);
    string.position.set(-0.02, 0, 0.01);

    bow.add(stave, grip, string);
    bow.rotation.set(0.2, 0.55, -1.15);
    bow.position.set(0.12, 0.02, 0.08);
    this.root.add(bow);

    this.arrow = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.72, 6), wood);
    shaft.rotation.z = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.05, 6), iron);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 0.38;
    this.arrow.add(shaft, tip);
    this.arrow.position.set(-0.18, -0.02, -0.02);
    this.arrow.rotation.set(0.05, 0.1, 0.05);
    this.root.add(this.arrow);

    const leftArm = this.makeArm(skin);
    leftArm.position.set(-0.12, -0.16, 0.05);
    leftArm.rotation.set(0.4, 0.2, 1.15);
    this.root.add(leftArm);

    const rightHand = this.makeHand(skin);
    rightHand.position.set(0.16, -0.18, 0.1);
    rightHand.rotation.set(0.2, 0.4, -0.4);
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
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.05, 0.34, 8), skin);
    forearm.rotation.z = Math.PI / 2;
    forearm.position.x = -0.08;
    arm.add(forearm, this.makeHand(skin));
    return arm;
  }

  makeHand(skin) {
    const hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.035), skin);
    hand.add(palm);
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.05, 0.014), skin);
      finger.position.set(-0.02 + i * 0.016, 0.065, 0);
      hand.add(finger);
    }
    return hand;
  }

  update(dt, player, drawing) {
    this.draw += ((drawing ? 1 : 0.18) - this.draw) * Math.min(1, dt * 8);
    const bob = Math.sin(player.bob) * 0.018 * (player.speed > 0 ? 1 : 0.15);
    const sway = Math.cos(player.bob * 0.5) * 0.012 * (player.speed > 0 ? 1 : 0.15);
    this.root.position.set(this.base.x + sway, this.base.y + bob, this.base.z);
    this.root.rotation.z = sway * 0.4;
    this.arrow.position.x = -0.18 - this.draw * 0.12;
  }
}
