/**
 * Owns the canvas, game loop, arena drawing, and player updates.
 */
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new Input();
    this.player = new Player(canvas.width / 2, canvas.height / 2);
    this.lastTime = 0;
    this.padding = 28;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(dt) {
    this.player.update(dt, this.input, this.getBounds());
  }

  getBounds() {
    return {
      left: this.padding,
      top: this.padding,
      right: this.canvas.width - this.padding,
      bottom: this.canvas.height - this.padding,
    };
  }

  draw() {
    const { ctx, canvas } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawArena();
    this.player.draw(ctx);
    this.drawVignette();
  }

  drawArena() {
    const { ctx, canvas } = this;
    const tileSize = 40;

    ctx.fillStyle = "#101820";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += tileSize) {
      for (let x = 0; x < canvas.width; x += tileSize) {
        const isDark = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isDark ? "#121c26" : "#15202b";
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    ctx.strokeStyle = "rgba(90, 120, 145, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += tileSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += tileSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#2f4a5c";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      this.padding,
      this.padding,
      canvas.width - this.padding * 2,
      canvas.height - this.padding * 2
    );
  }

  drawVignette() {
    const { ctx, canvas } = this;
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.height * 0.25,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.7
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(4, 8, 12, 0.55)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
