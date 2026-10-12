// Random flashes of darkness. There is no monster.
// A flash blacks out the picture for a fraction of a second, then the halls come back.

export class Darkness {
  constructor() {
    this.left = 0;
    this.wait = 4 + Math.random() * 6;
    this.rate = 1;
    this.overlay = document.getElementById("blackout");
  }

  flash(seconds) {
    this.left = Math.max(this.left, seconds);
  }

  update(dt) {
    if (this.left > 0) {
      this.left -= dt;
      if (this.overlay) this.overlay.style.opacity = "1";
      return;
    }

    if (this.overlay) this.overlay.style.opacity = "0";
    this.wait -= dt * this.rate;
    if (this.wait > 0) return;

    this.flash(0.12 + Math.random() * 0.4);
    this.wait = 6 + Math.random() * 10;
  }
}
