// Hidden fear. There is no fear bar.
// It rises in the dark, after strange sounds, and near the entity.
// A safe room lets it fall back down.

export class Fear {
  constructor(world) {
    this.world = world;
    this.level = 0;
    this.darkGain = 4;
    this.overlay = document.getElementById("fear");
    this.canvas = document.getElementById("game");
  }

  add(amount) {
    this.level = Math.min(100, this.level + amount);
  }

  nearLight(player) {
    for (const lamp of this.world.lamps) {
      if (lamp.blackout > 0) continue;
      if (Math.hypot(lamp.x - player.x, lamp.z - player.z) < 6) return true;
    }
    return false;
  }

  update(dt, player, flashlight, creature) {
    const dark = !flashlight.isLit() && !this.nearLight(player);
    player.inDark = dark;

    if (dark) this.level = Math.min(100, this.level + this.darkGain * dt);
    if (creature.mesh.visible && creature.distance < 12) this.level = Math.min(100, this.level + 5 * dt);
    if (player.inSafe) this.level = Math.max(0, this.level - 10 * dt);
    else this.level = Math.max(0, this.level - 0.35 * dt);

    const amount = this.level / 100;
    if (this.overlay) this.overlay.style.opacity = String(amount * 0.7);
    if (this.canvas) {
      const twist = Math.sin(performance.now() * 0.004) * amount * 0.6;
      this.canvas.style.filter = amount > 0.15
        ? `contrast(${1 + amount * 0.25}) saturate(${1 - amount * 0.35}) hue-rotate(${twist}deg)`
        : "";
    }

    const base = this.world.baseAmbient || 0.72;
    if (this.world.ambient) this.world.ambient.intensity = base * (1 - amount * 0.55);
    if (this.world.scene.fog) this.world.scene.fog.density = 0.02 + amount * 0.035;
    return this.level;
  }
}
