// After a long walk, a few things quietly shift.
// Lighting, a box, or the fog — not a popup, and not every minute.

export class TimeWarp {
  constructor() {
    this.mark = 0;
  }

  update(player, changes, world) {
    if (player.distance - this.mark < 28) return;
    this.mark = player.distance;
    if (Math.random() > 0.6) return;

    const roll = Math.random();
    if (roll < 0.4) changes.nudgeObject(player);
    else if (roll < 0.7) changes.extinguishBehind(player);
    else if (world.scene.fog) {
      world.scene.fog.color.offsetHSL(0.02, 0, (Math.random() - 0.5) * 0.08);
    }
  }
}
