/* Pomodoro timer: 25 minute focus, 5 minute short break, 15 minute long break. */
(function (SH) {
  let loopId = null;
  let audioCtx = null;

  function modeInfo(mode) {
    return SH.TIMER_MODES[mode] || SH.TIMER_MODES.focus;
  }

  function duration(mode) {
    return modeInfo(mode).minutes * 60 * 1000;
  }

  function formatClock(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function resumeAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function chime() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02 + index * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38 + index * 0.11);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + index * 0.11);
      osc.stop(now + 0.42 + index * 0.11);
    });
  }

  function cycleState(timer) {
    let dots = timer.completedFocusSessions % 4;
    let label = `${dots} of 4 toward a long break`;
    if (dots === 0 && timer.completedFocusSessions > 0 && timer.mode === "long") {
      dots = 4;
      label = "4 of 4 focus sessions done";
    }
    return { dots, label };
  }

  function paint() {
    const timer = SH.store.state.timer;
    const clock = document.getElementById("timer-clock");
    const ring = document.getElementById("timer-ring");
    if (clock) clock.textContent = formatClock(timer.remainingMs);
    if (ring) {
      const length = Number(ring.dataset.length);
      const total = duration(timer.mode);
      const remaining = Math.max(0, Math.min(total, timer.remainingMs));
      ring.style.strokeDashoffset = String(length * (1 - remaining / total));
    }
    if (timer.running) {
      document.title = `${formatClock(timer.remainingMs)} · ${modeInfo(timer.mode).label} · StudyHub`;
    }
  }

  function syncControls() {
    const timer = SH.store.state.timer;
    const start = document.getElementById("timer-start");
    const pause = document.getElementById("timer-pause");
    const card = document.getElementById("timer-card");
    if (!start || !pause) {
      paint();
      return;
    }
    const full = duration(timer.mode);
    start.hidden = timer.running;
    pause.hidden = !timer.running;
    start.textContent = timer.remainingMs < full - 400 ? "Resume" : "Start";
    if (card) card.classList.toggle("is-running", timer.running);
    const status = document.getElementById("timer-status");
    if (status) {
      status.textContent = timer.running ? "Running" : timer.remainingMs < full - 400 ? "Paused" : "Ready";
    }
    const modeLabel = document.getElementById("timer-mode-label");
    if (modeLabel) modeLabel.textContent = modeInfo(timer.mode).label;
    const hint = document.getElementById("timer-hint");
    if (hint) hint.textContent = modeInfo(timer.mode).hint;
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const on = button.dataset.mode === timer.mode;
      button.classList.toggle("is-active", on);
      button.setAttribute("aria-selected", on ? "true" : "false");
    });
    const ring = document.getElementById("timer-ring");
    if (ring) {
      const stroke = { focus: "url(#timer-focus)", short: "url(#timer-short)", long: "url(#timer-long)" };
      ring.setAttribute("stroke", stroke[timer.mode] || stroke.focus);
    }
    const cycle = cycleState(timer);
    const cycleLabel = document.getElementById("timer-cycle");
    if (cycleLabel) cycleLabel.textContent = cycle.label;
    const dots = document.getElementById("timer-dots");
    if (dots) {
      dots.innerHTML = [0, 1, 2, 3]
        .map((index) => `<span class="${index < cycle.dots ? "is-on" : ""}"></span>`)
        .join("");
    }
    paint();
    if (!timer.running) {
      const titles = {
        dashboard: "Dashboard",
        assignments: "Assignments",
        calendar: "Calendar",
        timer: "Study Timer",
        grades: "Grade Calculator",
      };
      document.title = `${titles[SH.store.state.view] || "StudyHub"} · StudyHub`;
    }
  }

  function complete(duringLoad) {
    const timer = SH.store.state.timer;
    const finished = timer.mode;
    timer.running = false;
    timer.endsAt = null;
    let message;
    if (finished === "focus") {
      timer.completedFocusSessions += 1;
      const useLong = timer.completedFocusSessions % 4 === 0;
      timer.mode = useLong ? "long" : "short";
      message = useLong
        ? "Four focus sessions done. Take a long break."
        : "Focus session complete. Time for a short break.";
    } else {
      timer.mode = "focus";
      message = finished === "long" ? "Long break finished. Ready to focus?" : "Short break finished. Ready to focus?";
    }
    timer.remainingMs = duration(timer.mode);
    SH.store.persist();
    if (!duringLoad) chime();
    if (duringLoad) message = `A session finished while this page was closed. ${message}`;
    SH.toast.show(message, "success");
    if (document.getElementById("timer-clock")) syncControls();
  }

  function catchUp(duringLoad) {
    const timer = SH.store.state.timer;
    if (!timer.running || !timer.endsAt) return;
    const left = timer.endsAt - Date.now();
    if (left <= 0) complete(Boolean(duringLoad));
    else {
      timer.remainingMs = left;
      paint();
    }
  }

  function tick() {
    const timer = SH.store.state.timer;
    if (!timer.running || !timer.endsAt) return;
    const left = timer.endsAt - Date.now();
    if (left <= 0) {
      complete(false);
      return;
    }
    timer.remainingMs = left;
    paint();
  }

  function startLoop() {
    if (loopId) window.clearInterval(loopId);
    loopId = window.setInterval(tick, 250);
  }

  function start() {
    const timer = SH.store.state.timer;
    if (timer.running) return;
    if (timer.remainingMs <= 0) timer.remainingMs = duration(timer.mode);
    timer.running = true;
    timer.endsAt = Date.now() + timer.remainingMs;
    SH.store.persist();
    resumeAudio();
    syncControls();
    SH.toast.show(`${modeInfo(timer.mode).label} started.`, "success");
  }

  function pause() {
    const timer = SH.store.state.timer;
    if (!timer.running) return;
    timer.remainingMs = Math.max(0, timer.endsAt - Date.now());
    timer.running = false;
    timer.endsAt = null;
    SH.store.persist();
    syncControls();
    SH.toast.show("Timer paused.", "success");
  }

  function reset() {
    const timer = SH.store.state.timer;
    const full = duration(timer.mode);
    const changed = timer.running || Math.abs(timer.remainingMs - full) > 400;
    timer.running = false;
    timer.endsAt = null;
    timer.remainingMs = full;
    SH.store.persist();
    syncControls();
    if (changed) SH.toast.show("Timer reset.", "success");
  }

  function setMode(mode) {
    if (!SH.TIMER_MODES[mode]) return;
    const timer = SH.store.state.timer;
    const full = duration(mode);
    if (timer.mode === mode && !timer.running && Math.abs(timer.remainingMs - full) < 400) return;
    timer.running = false;
    timer.endsAt = null;
    timer.mode = mode;
    timer.remainingMs = full;
    SH.store.persist();
    syncControls();
    SH.toast.show(`${modeInfo(mode).label} ready. Press start when you are.`, "success");
  }

  function render() {
    const timer = SH.store.state.timer;
    const radius = 86;
    const length = 2 * Math.PI * radius;
    const remaining = Math.max(0, Math.min(duration(timer.mode), timer.remainingMs));
    const offset = length * (1 - remaining / duration(timer.mode));
    const modes = ["focus", "short", "long"]
      .map((id) => {
        const info = SH.TIMER_MODES[id];
        const on = timer.mode === id;
        return `<button type="button" role="tab" class="${on ? "is-active" : ""}" data-action="timer-mode" data-mode="${id}" aria-selected="${on ? "true" : "false"}">${info.label}<span>${info.minutes} min</span></button>`;
      })
      .join("");
    return `
      <section class="panel timer-card" id="timer-card">
        <div class="timer-layout">
          <div class="timer-face">
            <svg class="timer-ring" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <linearGradient id="timer-focus" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#7c3aed"></stop>
                  <stop offset="100%" stop-color="#2563eb"></stop>
                </linearGradient>
                <linearGradient id="timer-short" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#14b8a6"></stop>
                  <stop offset="100%" stop-color="#0ea5e9"></stop>
                </linearGradient>
                <linearGradient id="timer-long" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#60a5fa"></stop>
                  <stop offset="100%" stop-color="#1d4ed8"></stop>
                </linearGradient>
              </defs>
              <circle class="ring-track" cx="100" cy="100" r="${radius}"></circle>
              <circle id="timer-ring" class="ring-value" cx="100" cy="100" r="${radius}" data-length="${length.toFixed(2)}" stroke-dasharray="${length.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>
            </svg>
            <div class="timer-readout">
              <p id="timer-mode-label" class="timer-kicker">${modeInfo(timer.mode).label}</p>
              <p id="timer-clock" class="timer-clock">${formatClock(timer.remainingMs)}</p>
              <p id="timer-status" class="timer-status">Ready</p>
            </div>
          </div>
          <div class="timer-controls">
            <div class="mode-switch" role="tablist" aria-label="Timer mode">${modes}</div>
            <div class="timer-actions">
              <button type="button" class="btn btn-primary btn-lg" id="timer-start" data-action="timer-start">Start</button>
              <button type="button" class="btn btn-primary btn-lg" id="timer-pause" data-action="timer-pause" hidden>Pause</button>
              <button type="button" class="btn btn-ghost btn-lg" id="timer-reset" data-action="timer-reset">Reset</button>
            </div>
            <div class="cycle">
              <div id="timer-dots" class="cycle-dots" aria-hidden="true"></div>
              <p id="timer-cycle"></p>
            </div>
            <p id="timer-hint" class="timer-hint"></p>
            <p class="field-hint">Focus is 25 minutes. A short break is 5, and every fourth focus session sets up a 15 minute long break. The countdown stays saved if you refresh.</p>
          </div>
        </div>
      </section>
    `;
  }

  SH.timer = { render, start, pause, reset, setMode, catchUp, startLoop, syncControls, formatClock, duration };
  SH.views = SH.views || {};
  SH.views.timer = render;
})(window.StudyHub = window.StudyHub || {});
