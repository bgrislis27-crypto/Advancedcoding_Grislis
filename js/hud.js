// Updates the timer, stamina bar, hint text, and the win / lose screens.

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export class Hud {
  constructor() {
    this.start = document.getElementById("start");
    this.hud = document.getElementById("hud");
    this.win = document.getElementById("win");
    this.lose = document.getElementById("lose");
    this.timer = document.getElementById("timer");
    this.stamina = document.getElementById("stamina-fill");
    this.battery = document.getElementById("battery-fill");
    this.prompt = document.getElementById("prompt");
    this.winTime = document.getElementById("win-time");
    this.loseTime = document.getElementById("lose-time");
  }

  show() {
    this.start.classList.add("is-hidden");
    this.hud.classList.remove("is-hidden");
  }

  update(player, time, prompt, battery = 100) {
    this.timer.textContent = formatTime(time);
    this.stamina.style.width = `${player.stamina}%`;
    if (this.battery) this.battery.style.width = `${battery}%`;
    this.prompt.textContent = prompt;
  }

  showWin(time) {
    this.hud.classList.add("is-hidden");
    this.win.classList.remove("is-hidden");
    this.winTime.textContent = `Escaped in ${formatTime(time)}`;
  }

  showLose(time) {
    this.hud.classList.add("is-hidden");
    this.lose.classList.remove("is-hidden");
    this.loseTime.textContent = `Survived ${formatTime(time)}`;
  }
}
