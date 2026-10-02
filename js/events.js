// A slow dice roll. Every 20–60 seconds one quiet scare happens.
// The same kind of scare does not play twice in a row.

const KINDS = ["light", "sound", "door", "object", "shadow", "patch"];

export class HorrorEvents {
  constructor(audio, changes, watcher, cameraFx, fear, flashlight, creature) {
    this.audio = audio;
    this.changes = changes;
    this.watcher = watcher;
    this.cameraFx = cameraFx;
    this.fear = fear;
    this.flashlight = flashlight;
    this.creature = creature;
    this.wait = 20 + Math.random() * 20;
    this.last = "";
    this.since = 999;
    this.lastSpot = null;
  }

  nextKind() {
    const choices = KINDS.filter((kind) => kind !== this.last);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  run(kind, player) {
    if (kind === "light") return this.changes.extinguishBehind(player);
    if (kind === "sound") {
      this.lastSpot = this.audio.playDistant(player);
      return true;
    }
    if (kind === "door") {
      const placed = this.changes.showDoor(player);
      if (placed) this.cameraFx.addShake(0.35);
      return placed;
    }
    if (kind === "object") {
      const moved = this.changes.nudgeObject(player);
      if (moved) this.cameraFx.addShake(0.25);
      return moved;
    }
    if (kind === "shadow") return this.watcher.tryAppear(player);
    if (kind === "patch") return this.changes.markHall(player);
    return false;
  }

  update(dt, player) {
    this.since += dt;
    this.wait -= dt;
    if (this.wait > 0) return;

    this.wait = 20 + Math.random() * 40;
    let kind = this.nextKind();
    if (!this.run(kind, player)) {
      const again = KINDS.filter((item) => item !== kind && item !== this.last);
      kind = again[Math.floor(Math.random() * again.length)];
      if (!kind || !this.run(kind, player)) return;
    }
    this.last = kind;
    this.since = 0;
    if (this.fear) this.fear.add(kind === "shadow" ? 10 : 5);
    if (kind === "sound" && this.lastSpot && this.creature) {
      this.creature.hear(this.lastSpot.x, this.lastSpot.z);
    }
    if (this.flashlight && Math.random() < 0.25) this.flashlight.malfunction(1.2);
  }
}
