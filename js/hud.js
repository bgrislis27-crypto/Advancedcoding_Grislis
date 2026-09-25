// This file updates the circles on the screen (health, hunger, thirst, stamina).
// It does not draw the 3D world. It only changes the HTML overlay.

export class Hud {
  constructor() {
    this.stamina = document.getElementById("meter-stamina");
    this.hunger = document.getElementById("meter-hunger");
    this.thirst = document.getElementById("meter-thirst");
    this.health = document.getElementById("meter-health");
    this.draw = document.getElementById("draw-meter");
    this.hud = document.getElementById("hud");
    this.start = document.getElementById("start");
  }

  // Hide the start menu and show the in-game meters.
  show() {
    this.start.classList.add("is-hidden");
    this.hud.classList.remove("is-hidden");
  }

  update(player, drawAmount) {
    this.stamina.style.setProperty("--p", `${player.stamina}%`);
    this.hunger.style.setProperty("--p", `${player.hunger}%`);
    this.thirst.style.setProperty("--p", `${player.thirst}%`);
    this.health.style.setProperty("--p", `${player.health}%`);
    this.draw.style.setProperty("--draw", `${Math.round(drawAmount * 100)}%`);
  }
}
