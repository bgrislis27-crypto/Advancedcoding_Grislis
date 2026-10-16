/* Assignment cards, filters, and the add/edit form. */
(function (SH) {
  const PRESET_SUBJECTS = [
    "Algebra II",
    "Art",
    "Biology",
    "Chemistry",
    "Computer Science",
    "English",
    "Geometry",
    "Physics",
    "Spanish",
    "U.S. History",
  ];
  const MINUTE_CHOICES = [15, 30, 45, 60, 90, 120];

  function subjectsFor(current) {
    const names = new Set(PRESET_SUBJECTS);
    SH.store.state.assignments.forEach((assignment) => names.add(assignment.subject));
    if (current) names.add(current);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  function card(assignment, options) {
    const dense = Boolean(options && options.dense);
    const today = SH.util.todayISO();
    const meta = SH.util.dueMeta(assignment, today);
    const { escapeHtml, formatMonthDay, formatMinutes, subjectColor } = SH.util;
    const title = escapeHtml(assignment.title);
    const when = assignment.completed
      ? `Completed · Due ${formatMonthDay(assignment.dueDate)}`
      : `${meta.label} · ${formatMonthDay(assignment.dueDate)}`;
    const flash = SH.store.state.ui.flashId === assignment.id ? " is-flash" : "";
    const description =
      !dense && assignment.description
        ? `<p class="task-desc">${escapeHtml(assignment.description)}</p>`
        : "";
    return `
      <article class="task${assignment.completed ? " is-done" : ""}${meta.tone === "late" ? " is-overdue" : ""}${flash}">
        <button
          type="button"
          class="check${assignment.completed ? " is-on" : ""}"
          data-action="toggle-assignment"
          data-id="${escapeHtml(assignment.id)}"
          aria-pressed="${assignment.completed ? "true" : "false"}"
          aria-label="${assignment.completed ? "Mark incomplete" : "Mark complete"}: ${title}"
        >${assignment.completed ? SH.icon("check") : ""}</button>
        <div class="task-body">
          <div class="task-title-row">
            <h3>${title}</h3>
            <span class="pill priority-${escapeHtml(assignment.priority)}">${escapeHtml(assignment.priority)}</span>
          </div>
          <p class="task-meta">
            <span class="subject-dot" style="background:${subjectColor(assignment.subject)}"></span>
            <span>${escapeHtml(assignment.subject)}</span>
            <span class="sep" aria-hidden="true">·</span>
            <span class="due due-${meta.tone}">${escapeHtml(when)}</span>
            <span class="sep" aria-hidden="true">·</span>
            <span>${escapeHtml(formatMinutes(assignment.estimatedMinutes))}</span>
          </p>
          ${description}
          <div class="task-actions">
            <button type="button" class="btn btn-quiet" data-action="edit-assignment" data-id="${escapeHtml(assignment.id)}" aria-label="Edit ${title}">${SH.icon("edit")} Edit</button>
            <button type="button" class="btn btn-quiet danger" data-action="delete-assignment" data-id="${escapeHtml(assignment.id)}" aria-label="Delete ${title}">${SH.icon("trash")} Delete</button>
          </div>
        </div>
      </article>
    `;
  }

  function defaultDueDate() {
    const selected = SH.store.state.ui.calendarSelected;
    if (SH.store.state.view === "calendar" && SH.util.isISODate(selected)) return selected;
    return SH.util.todayISO();
  }

  function formMarkup(assignment) {
    const { escapeHtml } = SH.util;
    const current = assignment || {
      title: "",
      subject: "",
      description: "",
      dueDate: defaultDueDate(),
      priority: "medium",
      estimatedMinutes: 30,
    };
    const editing = Boolean(assignment && assignment.id);
    const options = subjectsFor(current.subject)
      .map((subject) => `<option value="${escapeHtml(subject)}"></option>`)
      .join("");
    const minutes = MINUTE_CHOICES.map(
      (value) =>
        `<button type="button" class="chip" data-action="set-minutes" data-minutes="${value}">${value} min</button>`
    ).join("");
    const priority = (value, label) => `
      <label class="choice">
        <input type="radio" name="priority" value="${value}" ${current.priority === value ? "checked" : ""} />
        <span>${label}</span>
      </label>
    `;
    return `
      <form id="assignment-form" data-id="${editing ? escapeHtml(assignment.id) : ""}" novalidate>
        <p class="form-banner" data-form-error hidden></p>
        <div class="field">
          <label for="assignment-title">Title</label>
          <input id="assignment-title" name="title" type="text" maxlength="80" required value="${escapeHtml(current.title)}" placeholder="Example: Chapter 4 problem set" />
          <p class="field-error" data-error-for="title" hidden></p>
        </div>
        <div class="field">
          <label for="assignment-subject">Subject</label>
          <input id="assignment-subject" name="subject" type="text" maxlength="40" required list="subject-options" value="${escapeHtml(current.subject)}" placeholder="Algebra II" />
          <datalist id="subject-options">${options}</datalist>
          <p class="field-error" data-error-for="subject" hidden></p>
        </div>
        <div class="field">
          <label for="assignment-description">Description</label>
          <textarea id="assignment-description" name="description" maxlength="500" placeholder="What needs to be finished?">${escapeHtml(current.description)}</textarea>
          <p class="field-error" data-error-for="description" hidden></p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="assignment-due">Due date</label>
            <input id="assignment-due" name="dueDate" type="date" required value="${escapeHtml(current.dueDate)}" />
            <p class="field-error" data-error-for="dueDate" hidden></p>
          </div>
          <div class="field">
            <label for="estimated-minutes">Estimated completion time</label>
            <input id="estimated-minutes" name="estimatedMinutes" type="number" inputmode="numeric" min="1" max="600" step="1" required value="${escapeHtml(current.estimatedMinutes)}" />
            <div class="chips" aria-label="Common times">${minutes}</div>
            <p class="field-hint">Minutes you think this will take, from 1 to 600.</p>
            <p class="field-error" data-error-for="estimatedMinutes" hidden></p>
          </div>
        </div>
        <fieldset class="field">
          <legend>Priority</legend>
          <div class="choices">${priority("low", "Low")}${priority("medium", "Medium")}${priority("high", "High")}</div>
          <p class="field-error" data-error-for="priority" hidden></p>
        </fieldset>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">${editing ? "Save changes" : "Add assignment"}</button>
        </div>
      </form>
    `;
  }

  function validate(data) {
    const errors = {};
    if (!data.title) errors.title = "Add a title.";
    else if (data.title.length > 80) errors.title = "Keep the title under 80 characters.";
    if (!data.subject) errors.subject = "Add a subject.";
    else if (data.subject.length > 40) errors.subject = "Keep the subject under 40 characters.";
    if (data.description.length > 500) errors.description = "Keep the description under 500 characters.";
    if (!data.dueDate) errors.dueDate = "Choose a due date.";
    else if (!SH.util.isISODate(data.dueDate)) errors.dueDate = "Choose a valid due date.";
    if (!["low", "medium", "high"].includes(data.priority)) errors.priority = "Choose a priority.";
    if (!Number.isFinite(data.estimatedMinutes) || data.estimatedMinutes < 1 || data.estimatedMinutes > 600) {
      errors.estimatedMinutes = "Enter a time from 1 to 600 minutes.";
    }
    return errors;
  }

  function fieldValue(form, name) {
    const field = form.elements.namedItem(name);
    return field && "value" in field ? field.value : "";
  }

  function readForm(form) {
    return {
      title: fieldValue(form, "title").trim(),
      subject: fieldValue(form, "subject").trim(),
      description: fieldValue(form, "description").trim(),
      dueDate: fieldValue(form, "dueDate"),
      priority: fieldValue(form, "priority"),
      estimatedMinutes: Number(fieldValue(form, "estimatedMinutes")),
    };
  }

  function openForm(id) {
    const existing = id ? SH.store.findAssignment(id) : null;
    if (id && !existing) {
      SH.toast.show("That assignment is no longer on your list.", "warning");
      SH.render({ preserveScroll: true });
      return;
    }
    const draft = existing || {
      title: "",
      subject: "",
      description: "",
      dueDate: defaultDueDate(),
      priority: "medium",
      estimatedMinutes: 30,
    };
    SH.modal.open({
      title: existing ? "Edit assignment" : "New assignment",
      html: formMarkup(draft),
    });
  }

  function submit(form) {
    const data = readForm(form);
    const errors = validate(data);
    if (Object.keys(errors).length) {
      SH.forms.showErrors(form, errors);
      return;
    }
    const editing = form.dataset.id;
    if (editing) {
      const updated = SH.store.updateAssignment(editing, data);
      if (!updated) {
        SH.toast.show("That assignment could not be updated.", "warning");
        return;
      }
      SH.toast.show(`Assignment updated: ${updated.title}`, "success");
    } else {
      const created = SH.store.addAssignment(data);
      if (!created) {
        SH.toast.show("That assignment could not be added.", "warning");
        return;
      }
      SH.store.state.ui.flashId = created.id;
      SH.toast.show(`Assignment added: ${created.title}`, "success");
      if (!["dashboard", "assignments", "calendar"].includes(SH.store.state.view)) {
        SH.store.setView("assignments");
      }
    }
    SH.modal.close();
    SH.render({ preserveScroll: Boolean(editing) });
    window.setTimeout(() => {
      if (SH.store.state.ui.flashId) {
        SH.store.state.ui.flashId = null;
        document.querySelectorAll(".task.is-flash").forEach((cardNode) => cardNode.classList.remove("is-flash"));
      }
    }, 1600);
  }

  function confirmDelete(id) {
    const assignment = SH.store.findAssignment(id);
    if (!assignment) {
      SH.toast.show("That assignment is already gone.", "warning");
      return;
    }
    SH.modal.open({
      title: "Delete assignment?",
      html: `
        <p class="confirm-copy">“${SH.util.escapeHtml(assignment.title)}” will be removed from this browser.</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-action="close-modal">Keep</button>
          <button type="button" class="btn btn-danger" data-action="confirm-delete" data-id="${SH.util.escapeHtml(id)}">Delete</button>
        </div>
      `,
    });
  }

  function remove(id) {
    const assignment = SH.store.findAssignment(id);
    const removed = SH.store.deleteAssignment(id);
    SH.modal.close();
    if (!removed) {
      SH.toast.show("That assignment is already gone.", "warning");
      return;
    }
    SH.toast.show(`Assignment deleted: ${assignment.title}`, "success");
    SH.render({ preserveScroll: true });
  }

  function toggle(id) {
    const updated = SH.store.toggleAssignment(id);
    if (!updated) {
      SH.toast.show("That assignment is no longer on your list.", "warning");
      SH.render({ preserveScroll: true });
      return;
    }
    SH.toast.show(updated.completed ? `Marked complete: ${updated.title}` : `Marked incomplete: ${updated.title}`, "success");
    SH.render({ preserveScroll: true });
  }

  function render() {
    const { escapeHtml, filterAssignments, statusCounts, todayISO, plural } = SH.util;
    const state = SH.store.state;
    const today = todayISO();
    const filters = state.ui.filters;
    const all = state.assignments;
    if (!all.length) {
      return `
        <section class="panel empty-panel">
          <div class="empty">
            <div class="empty-icon">${SH.icon("inbox")}</div>
            <h2>No assignments yet</h2>
            <p>Add a title, subject, and due date. StudyHub keeps the list on this device after you refresh.</p>
            <button type="button" class="btn btn-primary" data-action="open-assignment-form">${SH.icon("plus")} Add assignment</button>
          </div>
        </section>
      `;
    }

    const subjects = subjectsFor();
    if (filters.subject !== "all" && !subjects.includes(filters.subject)) subjects.push(filters.subject);
    const subjectOptions = [`<option value="all" ${filters.subject === "all" ? "selected" : ""}>All subjects</option>`]
      .concat(
        subjects.map(
          (subject) =>
            `<option value="${escapeHtml(subject)}" ${filters.subject === subject ? "selected" : ""}>${escapeHtml(subject)}</option>`
        )
      )
      .join("");
    const priorities = [
      ["all", "All priorities"],
      ["high", "High"],
      ["medium", "Medium"],
      ["low", "Low"],
    ];
    const priorityOptions = priorities
      .map(
        ([value, label]) =>
          `<option value="${value}" ${filters.priority === value ? "selected" : ""}>${label}</option>`
      )
      .join("");
    const counts = statusCounts(all, filters, today);
    const statuses = [
      ["all", "All"],
      ["active", "Active"],
      ["completed", "Completed"],
      ["upcoming", "Upcoming"],
      ["overdue", "Overdue"],
    ];
    const statusButtons = statuses
      .map(([value, label]) => {
        const pressed = filters.status === value;
        return `<button type="button" class="${pressed ? "is-active" : ""}" data-action="set-status" data-status="${value}" aria-pressed="${pressed ? "true" : "false"}">${label} <span class="count">${counts[value]}</span></button>`;
      })
      .join("");
    const filtersOn = filters.subject !== "all" || filters.priority !== "all" || filters.status !== "all";
    const visible = filterAssignments(all, filters, today);
    const list = visible.length
      ? `<div class="task-list">${visible.map((assignment) => card(assignment)).join("")}</div>`
      : `
        <div class="empty">
          <div class="empty-icon">${SH.icon("inbox")}</div>
          <h2>No assignments match</h2>
          <p>Nothing fits these filters. Clear them to see the full list.</p>
          <button type="button" class="btn btn-primary" data-action="clear-filters">Clear filters</button>
        </div>
      `;

    return `
      <section class="panel">
        <div class="toolbar">
          <label class="field compact">
            <span>Subject</span>
            <select data-filter="subject" aria-label="Filter by subject">${subjectOptions}</select>
          </label>
          <label class="field compact">
            <span>Priority</span>
            <select data-filter="priority" aria-label="Filter by priority">${priorityOptions}</select>
          </label>
          ${filtersOn ? `<button type="button" class="btn btn-ghost" data-action="clear-filters">Clear filters</button>` : ""}
        </div>
        <div class="segmented" role="group" aria-label="Filter by status">${statusButtons}</div>
        <p class="result-count">Showing ${visible.length} of ${all.length}. Sorted by due date, with open work first.</p>
        ${list}
      </section>
    `;
  }

  SH.assignmentCard = card;
  SH.assignments = { render, openForm, submit, confirmDelete, remove, toggle };
  SH.views = SH.views || {};
  SH.views.assignments = render;
})(window.StudyHub = window.StudyHub || {});
