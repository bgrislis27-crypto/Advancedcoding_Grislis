// Subtle first-person camera motion.
// A small head bob while walking, a little more while sprinting, and a tiny shake after a scare.

export class CameraEffects {
  constructor() {
    this.phase = 0;
    this.swayTime = 0;
    this.shake = 0;
  }

  // Nearby scares call this. The shake fades out on its own.
  addShake(amount) {
    this.shake = Math.min(1, this.shake + amount);
  }

  update(dt, player, fearLevel = 0) {
    const moving = player.moving && !player.hiding;
    const fear = fearLevel / 100;
    const wobble = 1 + fear * 1.8;
    const pace = player.running ? 11 : 7.2;
    if (moving) this.phase += dt * pace;
    this.swayTime += dt;
    this.shake = Math.max(0, this.shake - dt * 1.3);

    const bob = moving ? Math.sin(this.phase) : 0;
    const lift = (player.running ? 0.055 : 0.022) * wobble;
    const sway = Math.sin(this.swayTime * 0.55) * 0.004 * wobble;
    const kickX = (Math.random() - 0.5) * this.shake * 0.012;
    const kickY = (Math.random() - 0.5) * this.shake * 0.01;

    player.camera.position.y += bob * lift;
    player.camera.rotation.z = bob * (player.running ? 0.014 : 0.005) * wobble + sway * 0.4;
    player.camera.rotation.y += sway + kickX;
    player.camera.rotation.x += kickY;
  }
}
