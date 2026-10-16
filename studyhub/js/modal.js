/* Dialog used for the assignment form and delete confirmation. */
(function (SH) {
  let lastFocus = null;

  function close() {
    const root = document.getElementById("modal-root");
    if (!root || !root.childElementCount) return;
    root.innerHTML = "";
    document.body.classList.remove("modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }

  function open(options) {
    const root = document.getElementById("modal-root");
    if (!root) return;
    lastFocus = document.activeElement;
    const titleId = "modal-title";
    root.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop" data-action="close-modal">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
          <div class="modal-head">
            <h2 id="${titleId}"></h2>
            <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close dialog">${SH.icon("close")}</button>
          </div>
          <div class="modal-body"></div>
        </div>
      </div>
    `;
    root.querySelector("h2").textContent = options.title;
    root.querySelector(".modal-body").innerHTML = options.html;
    document.body.classList.add("modal-open");
    const focusTarget = root.querySelector(
      ".modal-body input, .modal-body textarea, .modal-body select, .modal-body button"
    );
    if (focusTarget) focusTarget.focus();
  }

  function trapTab(event) {
    if (event.key !== "Tab") return;
    const dialog = document.querySelector("#modal-root .modal");
    if (!dialog) return;
    const items = Array.from(dialog.querySelectorAll("button, input, textarea, select, a")).filter(
      (element) => !element.disabled && element.tabIndex !== -1 && !element.hidden
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  SH.modal = { open, close, trapTab };
})(window.StudyHub = window.StudyHub || {});
