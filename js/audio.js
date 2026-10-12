// Procedural horror audio. No sound files.
// Footsteps follow the player's speed. Other noises come from random directions,
// and sometimes the building goes quiet.

export class Soundscape {
  constructor() {
    this.ctx = null;
    this.buzzGain = null;
    this.stepTimer = 0;
    this.ambientTimer = 7;
    this.silence = 0;
    this.quiet = false;
    this.fear = 0;
    this.master = null;
    this.muffle = null;
  }

  start() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.muffle = this.ctx.createBiquadFilter();
    this.muffle.type = "lowpass";
    this.muffle.frequency.value = 16000;
    this.master.connect(this.muffle);
    this.muffle.connect(this.ctx.destination);
    this.buzz();
  }

  // Fear muffles the building. 0 is clear, 100 is dull.
  setFear(amount) {
    this.fear = amount / 100;
  }

  connectOut(node, x, z) {
    const target = this.master || this.ctx.destination;
    if (x == null || !this.ctx) {
      node.connect(target);
      return;
    }
    const panner = this.ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 2;
    panner.maxDistance = 36;
    panner.rolloffFactor = 1.3;
    panner.positionX.value = x;
    panner.positionY.value = 1.2;
    panner.positionZ.value = z;
    node.connect(panner);
    panner.connect(target);
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
    filter.frequency.value = 140;
    filter.Q.value = 14;

    this.buzzGain = ctx.createGain();
    this.buzzGain.gain.value = 0.03;
    source.connect(filter);
    filter.connect(this.buzzGain);
    this.buzzGain.connect(this.master);
    source.start();
  }

  // Pan is -1 (left) to 1 (right), based on where the sound sits around the player.
  panFor(player, x, z) {
    const dx = x - player.x;
    const dz = z - player.z;
    const right = dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw);
    const side = Math.hypot(dx, dz) || 1;
    return Math.max(-1, Math.min(1, right / side));
  }

  blip(frequency, seconds, volume, type, x, z) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    this.connectOut(gain, x, z);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  noiseBurst(seconds, volume, frequency, x, z) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = frequency;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    source.connect(filter);
    filter.connect(gain);
    this.connectOut(gain, x, z);
    source.start(now);
    source.stop(now + seconds);
  }

  footstep(player) {
    const volume = player.running ? 0.16 : 0.05;
    const pitch = player.running ? 120 : 74;
    this.blip(pitch, 0.08, volume, "triangle", player.x, player.z);
  }

  sting() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(70, now);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  // A few steps from somewhere else. Nothing is drawn for them.
  distantFootsteps(player) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * 10;
    const x = player.x + Math.cos(angle) * distance;
    const z = player.z + Math.sin(angle) * distance;
    const steps = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < steps; i++) {
      setTimeout(() => this.blip(60, 0.12, 0.05, "sine", x, z), i * 480);
    }
    return { x, z };
  }

  creak(player) {
    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * 9;
    const z = player.z + Math.sin(angle) * 9;
    this.noiseBurst(1.3, 0.05, 400, x, z);
    this.blip(180, 1.1, 0.03, "sawtooth", x, z);
    return { x, z };
  }

  roomNoise(player) {
    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * 12;
    const z = player.z + Math.sin(angle) * 12;
    this.noiseBurst(1.8, 0.04, 220, x, z);
    return { x, z };
  }

  // Used by the event system. Picks a distant noise, not a jumpscare sting.
  playDistant(player) {
    const roll = Math.random();
    if (roll < 0.4) return this.distantFootsteps(player);
    if (roll < 0.7) return this.creak(player);
    return this.roomNoise(player);
  }

  update(dt, player, lighting) {
    if (!this.ctx || !this.buzzGain) return;

    const listener = this.ctx.listener;
    const forwardX = -Math.sin(player.yaw);
    const forwardZ = -Math.cos(player.yaw);
    listener.positionX.value = player.x;
    listener.positionY.value = 1.6;
    listener.positionZ.value = player.z;
    listener.forwardX.value = forwardX;
    listener.forwardY.value = 0;
    listener.forwardZ.value = forwardZ;
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
    if (this.muffle) this.muffle.frequency.value = 15000 - this.fear * 12000;

    if (this.silence > 0) {
      this.silence -= dt;
      this.buzzGain.gain.value = 0;
    } else {
      const flicker = lighting.flickerAmount || 0;
      this.buzzGain.gain.value = 0.018 + flicker * 0.06;
    }

    if (player.moving && !player.hiding) {
      this.stepTimer -= dt;
      // Faster movement means steps closer together.
      const gap = Math.max(0.28, 0.78 - player.speed * 0.07);
      if (this.stepTimer <= 0) {
        this.footstep(player);
        this.stepTimer = gap;
      }
    }

    this.ambientTimer -= dt;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 12 + Math.random() * 14;

    // Sometimes the buzz just stops. That quiet is the scare.
    if (Math.random() < 0.28) {
      this.silence = 3 + Math.random() * 3;
      return;
    }
    this.playDistant(player);
  }
}
