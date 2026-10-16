/* Today, deadlines, and progress for the open homework list. */
(function (SH) {
  function meter(label, percent, note) {
    const width = Math.max(0, Math.min(100, Number(percent) || 0));
    const shown = SH.util.formatPercent(width);
    return `
      <div class="meter">
        <div class="meter-top">
          <span>${SH.util.escapeHtml(label)}</span>
          <span>${shown}</span>
        </div>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(width)}" aria-label="${SH.util.escapeHtml(label)}">
          <span style="--target:${width}%"></span>
        </div>
        ${note ? `<p class="meter-note">${SH.util.escapeHtml(note)}</p>` : ""}
      </div>
    `;
  }

  function ring(percent) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const bounded = Math.max(0, Math.min(100, Number(percent) || 0));
    const hideArc = bounded <= 0;
    const offset = circumference * (1 - bounded / 100);
    return `
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="progress-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#7c3aed"></stop>
              <stop offset="100%" stop-color="#2563eb"></stop>
            </linearGradient>
          </defs>
          <circle class="ring-track" cx="60" cy="60" r="${radius}"></circle>
          <circle class="ring-value" cx="60" cy="60" r="${radius}" stroke="${hideArc ? "none" : "url(#progress-gradient)"}" stroke-dasharray="${hideArc ? "0" : circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>
        </svg>
        <div class="ring-label">
          <strong>${SH.util.formatPercent(bounded)}</strong>
          <span>done</span>
        </div>
      </div>
    `;
  }

  function listOrEmpty(items, emptyTitle, emptyCopy) {
    if (!items.length) {
      return `
        <div class="empty compact">
          <h3>${emptyTitle}</h3>
          <p>${emptyCopy}</p>
        </div>
      `;
    }
    return `<div class="task-list">${items.map((item) => SH.assignmentCard(item, { dense: true })).join("")}</div>`;
  }

  function render() {
    const today = SH.util.todayISO();
    const stats = SH.util.summarizeAssignments(SH.store.state.assignments, today);
    const dateLabel = SH.util.formatLongDate(today);
    let message = "Add your first assignment and StudyHub will track what is due.";
    if (stats.total > 0 && stats.active === 0) {
      message = "You're caught up. Every assignment on this list is complete.";
    } else if (stats.overdue > 0) {
      message = `${SH.util.plural(stats.overdue, "assignment is", "assignments are")} overdue. Finish that work first, then take the next due item.`;
      if (stats.overdue === 1) {
        message = "1 assignment is overdue. Finish it first, then take the next due item.";
      }
    } else if (stats.nextUp) {
      const due = SH.util.dueMeta(stats.nextUp, today).label.toLowerCase();
      message = `Next up is ${stats.nextUp.title}, ${due}.`;
    }

    const upcomingCopy =
      stats.total === 0
        ? "Add an assignment to fill the week."
        : stats.overdue
          ? "No upcoming deadlines. The open work is already overdue."
          : "No upcoming deadlines. Add an assignment to fill the week.";
    const overdueBlock = stats.overdue
      ? `<button type="button" class="btn btn-ghost" data-action="show-overdue">Review overdue</button>`
      : "";
    const subjectMeters = stats.bySubject.length
      ? stats.bySubject
          .map((row) =>
            meter(
              row.subject,
              row.rate,
              `${row.completed} of ${row.total} complete`
            )
          )
          .join("")
      : `<p class="meter-note">Subject progress will appear here after you add homework.</p>`;
    const openTotal = stats.active;
    const share = (count) => (openTotal === 0 ? 0 : SH.util.round1((count / openTotal) * 100));

    return `
      <section class="hero">
        <div>
          <p class="eyebrow">${SH.util.escapeHtml(SH.util.greeting(new Date()))}</p>
          <h2 class="hero-date" id="dashboard-date">${SH.util.escapeHtml(dateLabel)}</h2>
          <p class="hero-message">${SH.util.escapeHtml(message)}</p>
        </div>
        ${ring(stats.completionRate)}
      </section>
      <section class="stats" aria-label="Assignment statistics">
        <article class="stat" data-stat="active">
          <p class="stat-label">Active</p>
          <p class="stat-value">${stats.active}</p>
          <p class="stat-note">still open</p>
        </article>
        <article class="stat tone-late" data-stat="overdue">
          <p class="stat-label">Overdue</p>
          <p class="stat-value">${stats.overdue}</p>
          <p class="stat-note">${stats.overdue ? "need attention" : "none late"}</p>
        </article>
        <article class="stat tone-soon" data-stat="week">
          <p class="stat-label">Due this week</p>
          <p class="stat-value">${stats.dueThisWeek}</p>
          <p class="stat-note">today and the next 6 days</p>
        </article>
        <article class="stat tone-done" data-stat="completed">
          <p class="stat-label">Completed</p>
          <p class="stat-value">${stats.completed}</p>
          <p class="stat-note">finished</p>
        </article>
      </section>
      ${
        stats.total === 0
          ? `
            <section class="panel empty-panel">
              <div class="empty">
                <div class="empty-icon">${SH.icon("inbox")}</div>
                <h2>No assignments yet</h2>
                <p>Add homework, a quiz, or a project. You can edit it, mark it complete, or delete it later.</p>
                <button type="button" class="btn btn-primary" data-action="open-assignment-form">${SH.icon("plus")} Add assignment</button>
              </div>
            </section>
          `
          : `
            <div class="split">
              <section class="panel">
                <div class="panel-head">
                  <h2>Upcoming deadlines</h2>
                </div>
                ${listOrEmpty(stats.upcomingList, "Nothing coming up", upcomingCopy)}
                ${
                  stats.laterCount
                    ? `<p class="panel-foot">${stats.laterCount} more later. Open the calendar to see every date.</p>`
                    : ""
                }
              </section>
              <section class="panel">
                <div class="panel-head">
                  <h2>Overdue work</h2>
                  ${overdueBlock}
                </div>
                ${listOrEmpty(
                  stats.overdueList,
                  "Nothing overdue",
                  "You're on top of the late work."
                )}
              </section>
            </div>
          `
      }
      <section class="panel" aria-labelledby="progress-heading">
        <div class="panel-head">
          <h2 id="progress-heading">Progress</h2>
        </div>
        <div class="progress-grid">
          <div>
            ${meter(
              "Assignments complete",
              stats.completionRate,
              stats.total ? `${stats.completed} of ${stats.total} finished` : "No assignments yet"
            )}
            ${meter(
              "Estimated study time finished",
              stats.timeRate,
              stats.total
                ? `${SH.util.formatMinutes(stats.minutesDone)} finished · ${SH.util.formatMinutes(stats.minutesRemaining)} left`
                : "Time estimates will show up with your assignments"
            )}
          </div>
          <div>
            <h3 class="subhead">By subject</h3>
            ${subjectMeters}
          </div>
        </div>
        <h3 class="subhead">Open work by priority</h3>
        <div class="priority-meters">
          ${meter("High", share(stats.byPriority.high), SH.util.plural(stats.byPriority.high, "assignment"))}
          ${meter("Medium", share(stats.byPriority.medium), SH.util.plural(stats.byPriority.medium, "assignment"))}
          ${meter("Low", share(stats.byPriority.low), SH.util.plural(stats.byPriority.low, "assignment"))}
        </div>
      </section>
    `;
  }

  SH.views = SH.views || {};
  SH.views.dashboard = render;
})(window.StudyHub = window.StudyHub || {});
