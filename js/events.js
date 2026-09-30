// A slow dice roll. Every 20–60 seconds one quiet scare happens.
// The same kind of scare does not play twice in a row.

const KINDS = ["light", "sound", "door", "object", "shadow", "patch"];

export class HorrorEvents {
  constructor(audio, changes, watcher, cameraFx) {
    this.audio = audio;
    this.changes = changes;
    this.watcher = watcher;
    this.cameraFx = cameraFx;
    this.wait = 20 + Math.random() * 20;
    this.last = "";
  }

  nextKind() {
    const choices = KINDS.filter((kind) => kind !== this.last);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  run(kind, player) {
    if (kind === "light") return this.changes.extinguishBehind(player);
    if (kind === "sound") {
      this.audio.playDistant(player);
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
  }
}
