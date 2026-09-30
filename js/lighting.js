// Horror lighting. Each ceiling light flickers on its own timer.
// A light can blink, or go fully dark for 1–4 seconds. They never all trip at once.

export class Lighting {
  constructor(world) {
    this.world = world;
    this.time = 0;
    this.flickerAmount = 0;

    for (const lamp of world.lamps) {
      lamp.nextRoll = 1 + Math.random() * 5;
      lamp.blackout = 0;
      lamp.flicker = 0;
      lamp.phase = Math.random() * 20;
    }
  }

  setLamp(lamp, brightness) {
    lamp.light.intensity = lamp.base * brightness;
    lamp.material.emissiveIntensity = 1.4 * brightness;
  }

  update(dt) {
    this.time += dt;
    let darkness = 0;

    for (const lamp of this.world.lamps) {
      if (lamp.blackout > 0) {
        lamp.blackout -= dt;
        this.setLamp(lamp, 0);
        darkness += 1;
        continue;
      }

      if (lamp.flicker > 0) {
        lamp.flicker -= dt;
        const blink = Math.sin(this.time * 46 + lamp.phase) > 0.15 ? 1 : 0.04;
        this.setLamp(lamp, blink);
        darkness += 1 - blink;
        continue;
      }

      lamp.nextRoll -= dt;
      if (lamp.nextRoll <= 0) {
        lamp.nextRoll = 2.5 + Math.random() * 5;
        const roll = Math.random();
        // Most rolls do nothing, so nearby lights stay calm while one misbehaves.
        if (roll < 0.16) lamp.blackout = 1 + Math.random() * 3;
        else if (roll < 0.5) lamp.flicker = 0.2 + Math.random() * 0.7;
      }

      this.setLamp(lamp, 1);
    }

    const count = this.world.lamps.length || 1;
    this.flickerAmount = darkness / count;
  }
}
