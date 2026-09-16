/**
 * The player is a simple circle that can walk around the arena with the arrow keys.
 */
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = 240;
    this.facingX = 0;
    this.facingY = -1;
  }

  update(dt, input, bounds) {
    let dx = 0;
    let dy = 0;

    if (input.isDown("ArrowLeft")) dx -= 1;
    if (input.isDown("ArrowRight")) dx += 1;
    if (input.isDown("ArrowUp")) dy -= 1;
    if (input.isDown("ArrowDown")) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;

      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
      this.facingX = dx;
      this.facingY = dy;
    }

    this.x = Math.max(bounds.left + this.radius, Math.min(bounds.right - this.radius, this.x));
    this.y = Math.max(bounds.top + this.radius, Math.min(bounds.bottom - this.radius, this.y));
  }

  draw(ctx) {
    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 14, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const glow = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, 28);
    glow.addColorStop(0, "rgba(94, 234, 212, 0.35)");
    glow.addColorStop(1, "rgba(94, 234, 212, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5eead4";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#134e4a";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    const noseX = this.x + this.facingX * (this.radius + 6);
    const noseY = this.y + this.facingY * (this.radius + 6);
    ctx.fillStyle = "#ecfeff";
    ctx.beginPath();
    ctx.arc(noseX, noseY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
