// Scary sounds made in the browser. No sound files are needed.
// Buzzing lights, footsteps, and the occasional distant noise.

export class Soundscape {
  constructor() {
    this.ctx = null;
    this.buzzGain = null;
    this.stepTimer = 0;
    this.distantTimer = 6;
  }

  // Browsers only allow sound after the player clicks.
  start() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.buzz();
  }

  stop() {
    if (this.buzzGain) this.buzzGain.gain.value = 0;
  }

  buzz() {
    const { ctx } = this;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 160;
    filter.Q.value = 12;

    this.buzzGain = ctx.createGain();
    this.buzzGain.gain.value = 0.035;
    source.connect(filter);
    filter.connect(this.buzzGain);
    this.buzzGain.connect(ctx.destination);
    source.start();
  }

  footstep(running) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = running ? 90 : 70;
    gain.gain.setValueAtTime(running ? 0.08 : 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  distant() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 1.4);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.7);
  }

  update(dt, player, world) {
    if (!this.ctx || !this.buzzGain) return;

    const flicker = world.flickerAmount || 0;
    this.buzzGain.gain.value = 0.02 + flicker * 0.05;

    if (player.moving && !player.hiding) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.footstep(player.running);
        this.stepTimer = player.running ? 0.32 : 0.52;
      }
    }

    this.distantTimer -= dt;
    if (this.distantTimer <= 0) {
      this.distant();
      this.distantTimer = 8 + Math.random() * 9;
    }
  }
}
