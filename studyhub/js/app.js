/* Navigation, theme, and the clicks that drive every screen. */
(function (SH) {
  const TITLES = {
    dashboard: ["Dashboard", "Today, what's due, and how you're doing."],
    assignments: ["Assignments", "Add homework, filter the list, and mark work complete."],
    calendar: ["Calendar", "See assignments on the day they are due."],
    timer: ["Study Timer", "Focus for 25 minutes, then take a break."],
    grades: ["Grade Calculator", "Enter scores and calculate your average."],
  };

  function syncSidebar() {
    const mobile = window.matchMedia("(max-width: 860px)").matches;
    if (!mobile) document.body.classList.remove("sidebar-open");
    const open = document.body.classList.contains("sidebar-open");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const menu = document.getElementById("menu-btn");
    if (sidebar) sidebar.toggleAttribute("inert", mobile && !open);
    if (backdrop) backdrop.hidden = !mobile || !open;
    if (menu) menu.setAttribute("aria-expanded", mobile && open ? "true" : "false");
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    syncSidebar();
  }

  function updateThemeButton() {
    const button = document.getElementById("theme-toggle");
    if (!button) return;
    const light = document.documentElement.getAttribute("data-theme") === "light";
    button.innerHTML = `${SH.icon(light ? "moon" : "sun")}<span>${light ? "Dark mode" : "Light mode"}</span>`;
    button.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    const themeColor = document.getElementById("theme-color");
    if (themeColor) themeColor.setAttribute("content", light ? "#f4f6fb" : "#0b1020");
  }

  function applyTheme(theme, save) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    if (save) SH.store.setTheme(next);
    updateThemeButton();
  }

  function render(options) {
    const preserve = Boolean(options && options.preserveScroll);
    const y = window.scrollY;
    const active = document.activeElement;
    const filterKey = active && active.dataset ? active.dataset.filter || "" : "";
    const statusKey = active && active.dataset ? active.dataset.status || "" : "";
    const state = SH.store.state;
    if (!TITLES[state.view]) state.view = "dashboard";
    const [title, subtitle] = TITLES[state.view];
    document.getElementById("view-title").textContent = title;
    document.getElementById("view-subtitle").textContent = subtitle;
    if (!state.timer.running) document.title = `${title} · StudyHub`;

    document.querySelectorAll("[data-nav]").forEach((button) => {
      const on = button.dataset.nav === state.view;
      button.classList.toggle("is-active", on);
      if (on) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    const overdue = SH.util.summarizeAssignments(state.assignments, SH.util.todayISO()).overdue;
    document.querySelectorAll("[data-badge='overdue']").forEach((badge) => {
      badge.hidden = overdue === 0;
      badge.textContent = String(overdue);
    });

    document.getElementById("main").innerHTML = `<div class="view view-enter">${SH.views[state.view]()}</div>`;
    if (state.view === "timer") SH.timer.syncControls();
    if (filterKey) document.querySelector(`[data-filter="${CSS.escape(filterKey)}"]`)?.focus();
    else if (statusKey) document.querySelector(`[data-action="set-status"][data-status="${CSS.escape(statusKey)}"]`)?.focus();
    if (preserve) window.scrollTo(0, y);
    else {
      window.scrollTo(0, 0);
      const main = document.getElementById("main");
      if (document.activeElement && document.activeElement.closest("[data-nav]")) {
        main.focus({ preventScroll: true });
      }
    }
    if (state.view === "grades" && state.ui.gradeEditing) {
      const form = document.getElementById("grade-form");
      if (form) form.scrollIntoView({ block: "center" });
    }
    syncSidebar();
  }

  function setView(view) {
    if (!TITLES[view] || SH.store.state.view === view) {
      closeSidebar();
      return;
    }
    SH.modal.close();
    SH.store.setView(view);
    closeSidebar();
    render();
  }

  function handleAction(element) {
    const action = element.dataset.action;
    const id = element.dataset.id;
    if (action === "open-menu") {
      document.body.classList.add("sidebar-open");
      syncSidebar();
      document.querySelector("#sidebar .nav-btn")?.focus();
      return;
    }
    if (action === "close-sidebar") {
      closeSidebar();
      document.getElementById("menu-btn")?.focus();
      return;
    }
    if (action === "toggle-theme") {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next, true);
      SH.toast.show(next === "light" ? "Light mode on." : "Dark mode on.", "success");
      return;
    }
    if (action === "close-modal") {
      if (element.id === "modal-backdrop") return;
      SH.modal.close();
      return;
    }
    if (action === "open-assignment-form") {
      SH.assignments.openForm();
      return;
    }
    if (action === "edit-assignment") {
      SH.assignments.openForm(id);
      return;
    }
    if (action === "delete-assignment") {
      SH.assignments.confirmDelete(id);
      return;
    }
    if (action === "confirm-delete") {
      SH.assignments.remove(id);
      return;
    }
    if (action === "toggle-assignment") {
      SH.assignments.toggle(id);
      return;
    }
    if (action === "set-minutes") {
      const input = document.getElementById("estimated-minutes");
      if (input) {
        input.value = element.dataset.minutes;
        SH.forms.clearField(input);
        input.focus();
      }
      return;
    }
    if (action === "set-status") {
      SH.store.state.ui.filters.status = element.dataset.status;
      render({ preserveScroll: true });
      return;
    }
    if (action === "clear-filters") {
      SH.store.state.ui.filters = { subject: "all", priority: "all", status: "all" };
      render({ preserveScroll: true });
      return;
    }
    if (action === "show-overdue") {
      SH.store.state.ui.filters = { subject: "all", priority: "all", status: "overdue" };
      SH.modal.close();
      SH.store.setView("assignments");
      closeSidebar();
      render();
      return;
    }
    if (action === "calendar-prev") {
      SH.calendar.shiftMonth(-1);
      return;
    }
    if (action === "calendar-next") {
      SH.calendar.shiftMonth(1);
      return;
    }
    if (action === "calendar-today") {
      SH.calendar.goToday();
      return;
    }
    if (action === "calendar-select") {
      SH.calendar.selectDate(element.dataset.date);
      return;
    }
    if (action === "timer-start") {
      SH.timer.start();
      return;
    }
    if (action === "timer-pause") {
      SH.timer.pause();
      return;
    }
    if (action === "timer-reset") {
      SH.timer.reset();
      return;
    }
    if (action === "timer-mode") {
      SH.timer.setMode(element.dataset.mode);
      return;
    }
    if (action === "edit-grade") {
      SH.store.state.ui.gradeEditing = id;
      render({ preserveScroll: true });
      return;
    }
    if (action === "cancel-grade-edit") {
      SH.store.state.ui.gradeEditing = null;
      render({ preserveScroll: true });
      return;
    }
    if (action === "delete-grade") {
      const grade = SH.store.findGrade(id);
      const removed = SH.store.deleteGrade(id);
      if (SH.store.state.ui.gradeEditing === id) SH.store.state.ui.gradeEditing = null;
      if (!removed) {
        SH.toast.show("That grade is already gone.", "warning");
      } else {
        SH.toast.show(`Grade removed: ${grade.name}`, "success");
      }
      render({ preserveScroll: true });
    }
  }

  function onClick(event) {
    if (event.target.id === "modal-backdrop") {
      SH.modal.close();
      return;
    }
    const actionEl = event.target.closest("[data-action]");
    if (actionEl) {
      handleAction(actionEl);
      return;
    }
    const navEl = event.target.closest("[data-nav]");
    if (navEl) setView(navEl.dataset.nav);
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id === "assignment-form") {
      event.preventDefault();
      SH.assignments.submit(form);
    } else if (form.id === "grade-form") {
      event.preventDefault();
      SH.grades.submit(form);
    }
  }

  function onChange(event) {
    const filter = event.target.closest("[data-filter]");
    if (!filter) return;
    const key = filter.dataset.filter;
    if (!["subject", "priority", "status"].includes(key)) return;
    SH.store.state.ui.filters[key] = filter.value;
    render({ preserveScroll: true });
  }

  function onInput(event) {
    SH.forms.clearField(event.target);
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      if (document.querySelector("#modal-root .modal")) {
        SH.modal.close();
        return;
      }
      if (document.body.classList.contains("sidebar-open")) {
        closeSidebar();
        document.getElementById("menu-btn")?.focus();
      }
      return;
    }
    SH.modal.trapTab(event);
  }

  function init() {
    SH.store.init();
    applyTheme(SH.store.state.theme, false);
    SH.timer.catchUp(true);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") SH.timer.catchUp(false);
    });
    document.body.addEventListener("click", onClick);
    document.body.addEventListener("submit", onSubmit);
    document.body.addEventListener("change", onChange);
    document.body.addEventListener("input", onInput);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", syncSidebar);
    render();
    SH.timer.startLoop();
    if (!SH.store.storageAvailable) {
      SH.toast.show("This browser isn't saving data. Your list will clear when you close the tab.", "warning");
    }
  }

  SH.render = render;
  SH.syncSidebar = syncSidebar;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window.StudyHub = window.StudyHub || {});
