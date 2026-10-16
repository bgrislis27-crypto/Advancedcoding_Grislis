/* Month calendar with assignments placed on their due dates. */
(function (SH) {
  function shiftMonth(delta) {
    const ui = SH.store.state.ui;
    const [year, month] = ui.calendarMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    ui.calendarMonth = SH.util.toISODate(next).slice(0, 7);
    SH.render({ preserveScroll: true });
  }

  function goToday() {
    const today = SH.util.todayISO();
    SH.store.state.ui.calendarMonth = today.slice(0, 7);
    SH.store.state.ui.calendarSelected = today;
    SH.render({ preserveScroll: true });
  }

  function selectDate(iso) {
    if (!SH.util.isISODate(iso)) return;
    SH.store.state.ui.calendarSelected = iso;
    SH.store.state.ui.calendarMonth = iso.slice(0, 7);
    SH.render({ preserveScroll: true });
    if (window.innerWidth <= 860) {
      const agenda = document.getElementById("agenda");
      if (agenda) agenda.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function render() {
    const { escapeHtml, todayISO, isISODate, formatMonthYear, formatLongDate, toISODate, monthGrid, plural } = SH.util;
    const state = SH.store.state;
    const today = todayISO();
    if (!/^\d{4}-\d{2}$/.test(state.ui.calendarMonth)) state.ui.calendarMonth = today.slice(0, 7);
    if (!isISODate(state.ui.calendarSelected)) state.ui.calendarSelected = today;

    const days = monthGrid(state.ui.calendarMonth);
    const [year, month] = state.ui.calendarMonth.split("-").map(Number);
    const byDate = new Map();
    state.assignments.forEach((assignment) => {
      if (!byDate.has(assignment.dueDate)) byDate.set(assignment.dueDate, []);
      byDate.get(assignment.dueDate).push(assignment);
    });

    const cells = days
      .map((date) => {
        const iso = toISODate(date);
        const items = (byDate.get(iso) || []).slice().sort(SH.util.compareDue);
        const outside = date.getMonth() !== month - 1;
        const selected = iso === state.ui.calendarSelected;
        const isToday = iso === today;
        const hasOverdue = items.some((item) => !item.completed && item.dueDate < today);
        const chips = items
          .slice(0, 2)
          .map(
            (item) =>
              `<span class="day-chip priority-${escapeHtml(item.priority)}${item.completed ? " is-done" : ""}">${escapeHtml(item.title)}</span>`
          )
          .join("");
        const more = items.length > 2 ? `<span class="day-more">+${items.length - 2}</span>` : "";
        const dots = items
          .slice(0, 3)
          .map((item) => `<span class="dot priority-${escapeHtml(item.priority)}"></span>`)
          .join("");
        const classes = [
          "day",
          outside ? "is-outside" : "",
          selected ? "is-selected" : "",
          isToday ? "is-today" : "",
          hasOverdue ? "has-overdue" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const names = items
          .slice(0, 2)
          .map((item) => item.title)
          .join(", ");
        const extra = items.length > 2 ? `, and ${items.length - 2} more` : "";
        const label = `${formatLongDate(iso)}, ${plural(items.length, "assignment")}${names ? `: ${names}${extra}` : ""}${isToday ? ", today" : ""}`;
        return `
          <button type="button" class="${classes}" data-action="calendar-select" data-date="${iso}" aria-pressed="${selected ? "true" : "false"}" aria-label="${escapeHtml(label)}">
            <span class="day-num">${date.getDate()}</span>
            <span class="day-chips">${chips}${more}</span>
            <span class="day-dots">${dots}</span>
          </button>
        `;
      })
      .join("");

    const selectedItems = (byDate.get(state.ui.calendarSelected) || []).slice().sort(SH.util.compareDue);
    const agenda = selectedItems.length
      ? `<div class="task-list">${selectedItems.map((item) => SH.assignmentCard(item)).join("")}</div>`
      : `
        <div class="empty compact">
          <h3>Nothing due this day</h3>
          <p>Pick another date or add an assignment for ${escapeHtml(formatLongDate(state.ui.calendarSelected))}.</p>
          <button type="button" class="btn btn-primary" data-action="open-assignment-form">${SH.icon("plus")} Add assignment</button>
        </div>
      `;

    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      .map((day) => `<span>${day}</span>`)
      .join("");

    return `
      <section class="calendar-layout">
        <div class="panel calendar-panel">
          <div class="calendar-head">
            <button type="button" class="icon-btn" data-action="calendar-prev" aria-label="Previous month">${SH.icon("chevronLeft")}</button>
            <h2 id="calendar-month">${escapeHtml(formatMonthYear(state.ui.calendarMonth))}</h2>
            <button type="button" class="icon-btn" data-action="calendar-next" aria-label="Next month">${SH.icon("chevronRight")}</button>
            <button type="button" class="btn btn-ghost" data-action="calendar-today">Today</button>
          </div>
          <div class="weekdays" aria-hidden="true">${weekday}</div>
          <div class="month-grid">${cells}</div>
        </div>
        <section class="panel agenda" id="agenda" aria-labelledby="agenda-title">
          <h2 id="agenda-title">${escapeHtml(formatLongDate(state.ui.calendarSelected))}</h2>
          <p class="result-count">${escapeHtml(plural(selectedItems.length, "assignment"))} due</p>
          ${agenda}
        </section>
      </section>
    `;
  }

  SH.calendar = { shiftMonth, goToday, selectDate };
  SH.views = SH.views || {};
  SH.views.calendar = render;
})(window.StudyHub = window.StudyHub || {});
