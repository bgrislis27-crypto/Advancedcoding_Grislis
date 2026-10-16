/* Short status messages for adds, edits, deletes, and the timer. */
(function (SH) {
  const timers = new WeakMap();

  function removeToast(toast) {
    const timeout = timers.get(toast);
    if (timeout) window.clearTimeout(timeout);
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 180);
  }

  function show(message, tone) {
    const root = document.getElementById("toast-root");
    if (!root) return;
    while (root.children.length >= 3) {
      const oldest = root.firstElementChild;
      const pending = timers.get(oldest);
      if (pending) window.clearTimeout(pending);
      oldest.remove();
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${tone === "warning" ? "warning" : "success"}`;
    toast.setAttribute("role", "status");

    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.innerHTML = SH.icon(tone === "warning" ? "alert" : "check");

    const text = document.createElement("p");
    text.textContent = message;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "icon-btn toast-close";
    close.setAttribute("aria-label", "Dismiss message");
    close.innerHTML = SH.icon("close");
    close.addEventListener("click", () => removeToast(toast));

    toast.append(icon, text, close);
    root.append(toast);

    const schedule = () => {
      const existing = timers.get(toast);
      if (existing) window.clearTimeout(existing);
      timers.set(
        toast,
        window.setTimeout(() => removeToast(toast), 4200)
      );
    };
    schedule();
    toast.addEventListener("mouseenter", () => {
      const existing = timers.get(toast);
      if (existing) window.clearTimeout(existing);
    });
    toast.addEventListener("mouseleave", schedule);
  }

  SH.toast = { show };
})(window.StudyHub = window.StudyHub || {});
