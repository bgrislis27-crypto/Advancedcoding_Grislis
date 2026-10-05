// A flashlight on the F key. The battery runs down while it is on.
// Low battery makes the beam flicker. A scare can shut it off for a moment.

export class Flashlight {
  constructor(light) {
    this.light = light;
    this.on = true;
    this.battery = 100;
    this.deadTime = 0;
    this.base = light.intensity;
    this.drainRate = 3.2;
  }

  isLit() {
    return this.on && this.battery > 0 && this.deadTime <= 0;
  }

  malfunction(seconds) {
    this.deadTime = Math.max(this.deadTime, seconds);
  }

  update(dt, input, player) {
    if (input.consumePress("KeyF")) this.on = !this.on;

    if (this.deadTime > 0) {
      this.deadTime -= dt;
      this.light.intensity = 0;
      return;
    }

    if (this.on && this.battery > 0) {
      const drain = player.running ? this.drainRate * 1.56 : this.drainRate;
      this.battery = Math.max(0, this.battery - drain * dt);
      const low = this.battery < 28;
      const blink = low && Math.random() < 0.12 ? 0.12 : 1;
      this.light.intensity = this.battery <= 0 ? 0 : this.base * blink;
    } else {
      this.light.intensity = 0;
      if (!this.on) this.battery = Math.min(100, this.battery + 7 * dt);
    }

    if (player.inSafe) this.battery = Math.min(100, this.battery + 8 * dt);
  }
}
