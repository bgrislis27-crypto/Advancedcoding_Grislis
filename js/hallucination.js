import * as THREE from "three";

// A brief false image. It is not the real entity, and it does not stay.

export class Hallucination {
  constructor(scene) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 1.8, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x100c0a })
    );
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.timer = 25 + Math.random() * 20;
    this.show = 0;
  }

  update(dt, player, fear) {
    if (this.show > 0) {
      this.show -= dt;
      if (this.show <= 0) this.mesh.visible = false;
      return;
    }

    this.timer -= dt;
    if (this.timer > 0 || fear.level < 18) return;
    this.timer = 45 + Math.random() * 30;

    const reach = 7 + Math.random() * 4;
    const x = player.x - Math.sin(player.yaw) * reach;
    const z = player.z - Math.cos(player.yaw) * reach;
    if (!player.world.isOpen(x, z)) return;

    this.mesh.position.set(x, 0.9, z);
    this.mesh.lookAt(player.x, 1, player.z);
    this.mesh.visible = true;
    this.show = 0.35;
    fear.add(8);
  }
}
