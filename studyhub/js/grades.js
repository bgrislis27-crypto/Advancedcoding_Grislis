/* Grade entries and a simple plus weighted average. */
(function (SH) {
  function scoreText(value) {
    if (Number.isInteger(value)) return String(value);
    return String(Math.round(value * 100) / 100);
  }

  function validate(data) {
    const errors = {};
    if (!data.name) errors.name = "Name this grade.";
    else if (data.name.length > 80) errors.name = "Keep the name under 80 characters.";
    if (!Number.isFinite(data.earned) || data.earned < 0 || data.earned > 10000) {
      errors.earned = "Enter points earned, from 0 up.";
    }
    if (!Number.isFinite(data.possible) || data.possible <= 0 || data.possible > 10000) {
      errors.possible = "Enter points possible, greater than 0.";
    }
    if (data.weight !== null && (!Number.isFinite(data.weight) || data.weight <= 0 || data.weight > 1000)) {
      errors.weight = "Enter a positive weight, or leave it blank.";
    }
    return errors;
  }

  function fieldValue(form, name) {
    const field = form.elements.namedItem(name);
    return field && "value" in field ? field.value : "";
  }

  function readForm(form) {
    const weightRaw = fieldValue(form, "weight").trim();
    return {
      name: fieldValue(form, "name").trim(),
      earned: Number(fieldValue(form, "earned")),
      possible: Number(fieldValue(form, "possible")),
      weight: weightRaw === "" ? null : Number(weightRaw),
    };
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
      const updated = SH.store.updateGrade(editing, data);
      if (!updated) {
        SH.toast.show("That grade could not be updated.", "warning");
        return;
      }
      SH.store.state.ui.gradeEditing = null;
      SH.toast.show(`Grade updated: ${updated.name}`, "success");
    } else {
      const created = SH.store.addGrade(data);
      if (!created) {
        SH.toast.show("That grade could not be added.", "warning");
        return;
      }
      SH.toast.show(`Grade added: ${created.name}`, "success");
    }
    SH.render({ preserveScroll: true });
  }

  function formula(summary) {
    if (summary.rows.length > 8) return `Average of ${summary.rows.length} grades.`;
    const parts = summary.rows.map((row) => SH.util.formatNumber(row.percent));
    return `(${parts.join(" + ")}) ÷ ${summary.rows.length} = ${SH.util.formatNumber(summary.simple)}`;
  }

  function weightedFormula(summary) {
    const rows = summary.rows.filter((row) => row.weight > 0);
    if (!rows.length || rows.length > 8) return "";
    const parts = rows.map(
      (row) => `${SH.util.formatNumber(row.percent)}×${SH.util.formatNumber(row.weight)}`
    );
    return `(${parts.join(" + ")}) ÷ ${SH.util.formatNumber(summary.weightTotal)} = ${SH.util.formatNumber(summary.weighted)}`;
  }

  function render() {
    const { escapeHtml, formatPercent, gradeSummary, formatNumber } = SH.util;
    const editing = SH.store.state.ui.gradeEditing
      ? SH.store.findGrade(SH.store.state.ui.gradeEditing)
      : null;
    if (SH.store.state.ui.gradeEditing && !editing) SH.store.state.ui.gradeEditing = null;
    const current = editing || { name: "", earned: "", possible: "", weight: null };
    const summary = gradeSummary(SH.store.state.grades);
    const weightValue = current.weight === null || current.weight === undefined ? "" : current.weight;

    let weightedNote = "Add a weight to any grade to see a weighted average.";
    if (!summary.empty && summary.weighted !== null) {
      const pieces = [];
      if (summary.unweightedNames.length) {
        pieces.push(
          `${summary.unweightedNames.join(", ")} ${summary.unweightedNames.length === 1 ? "has" : "have"} no weight, so ${summary.unweightedNames.length === 1 ? "it is" : "they are"} left out of the weighted average.`
        );
      }
      pieces.push(`Weights add up to ${formatNumber(summary.weightTotal)}. Each weighted grade counts for its share of that total.`);
      weightedNote = pieces.join(" ");
    }

    const results = summary.empty
      ? `
        <div class="empty compact">
          <h3>No average yet</h3>
          <p>Add a name, points earned, and points possible. The average updates as soon as you add a grade.</p>
        </div>
      `
      : `
        <div class="grade-results" id="grade-results">
          <article class="grade-score">
            <p class="stat-label">Simple average</p>
            <p class="grade-percent">${formatPercent(summary.simple)} <span>${summary.simpleLetter}</span></p>
            <p class="formula">${escapeHtml(formula(summary))}</p>
          </article>
          <article class="grade-score">
            <p class="stat-label">Weighted average</p>
            <p class="grade-percent">${summary.weighted === null ? "—" : formatPercent(summary.weighted)} <span>${summary.weightedLetter || ""}</span></p>
            <p class="formula">${escapeHtml(summary.weighted === null ? "Add a weight to calculate one." : weightedFormula(summary))}</p>
          </article>
        </div>
        <p class="field-hint">${escapeHtml(weightedNote)}</p>
        <p class="field-hint">Letter grades use a high school scale: A is 93–96, A− is 90–92, B+ is 87–89, B is 83–86, and F is below 60.</p>
      `;

    const cards = summary.rows
      .map((grade) => {
        const weight = grade.weight > 0 ? `Weight ${formatNumber(grade.weight)}` : "No weight";
        return `
          <article class="grade-row">
            <div>
              <h3>${escapeHtml(grade.name)}</h3>
              <p class="task-meta">${scoreText(grade.earned)} / ${scoreText(grade.possible)} · ${formatPercent(grade.percent)} · ${weight}</p>
            </div>
            <div class="task-actions">
              <button type="button" class="btn btn-quiet" data-action="edit-grade" data-id="${escapeHtml(grade.id)}" aria-label="Edit ${escapeHtml(grade.name)}">${SH.icon("edit")} Edit</button>
              <button type="button" class="btn btn-quiet danger" data-action="delete-grade" data-id="${escapeHtml(grade.id)}" aria-label="Delete ${escapeHtml(grade.name)}">${SH.icon("trash")} Delete</button>
            </div>
          </article>
        `;
      })
      .join("");

    return `
      <div class="grade-layout">
        <section class="panel">
          <h2>${editing ? "Edit grade" : "Add a grade"}</h2>
          ${editing ? `<p class="field-hint">Editing ${escapeHtml(editing.name)}.</p>` : ""}
          <form id="grade-form" data-id="${editing ? escapeHtml(editing.id) : ""}" novalidate>
            <p class="form-banner" data-form-error hidden></p>
            <div class="field">
              <label for="grade-name">Name</label>
              <input id="grade-name" name="name" type="text" maxlength="80" required value="${escapeHtml(current.name)}" placeholder="Biology unit test" />
              <p class="field-error" data-error-for="name" hidden></p>
            </div>
            <div class="form-grid">
              <div class="field">
                <label for="grade-earned">Points earned</label>
                <input id="grade-earned" name="earned" type="number" inputmode="decimal" min="0" max="10000" step="0.01" required value="${escapeHtml(current.earned)}" />
                <p class="field-error" data-error-for="earned" hidden></p>
              </div>
              <div class="field">
                <label for="grade-possible">Points possible</label>
                <input id="grade-possible" name="possible" type="number" inputmode="decimal" min="0.01" max="10000" step="0.01" required value="${escapeHtml(current.possible)}" />
                <p class="field-error" data-error-for="possible" hidden></p>
              </div>
            </div>
            <div class="field">
              <label for="grade-weight">Weight</label>
              <input id="grade-weight" name="weight" type="number" inputmode="decimal" min="0.01" max="1000" step="0.01" value="${escapeHtml(weightValue)}" placeholder="Optional, such as 20" />
              <p class="field-hint">Leave blank to include it only in the simple average. Extra credit can make earned higher than possible.</p>
              <p class="field-error" data-error-for="weight" hidden></p>
            </div>
            <div class="form-actions">
              ${editing ? `<button type="button" class="btn btn-ghost" data-action="cancel-grade-edit">Cancel</button>` : ""}
              <button type="submit" class="btn btn-primary">${editing ? "Save changes" : "Add grade"}</button>
            </div>
          </form>
        </section>
        <section class="panel" aria-live="polite">
          <h2>Your average</h2>
          ${results}
        </section>
      </div>
      <section class="panel">
        <h2>Grades</h2>
        ${
          summary.empty
            ? `<div class="empty compact"><h3>No grades yet</h3><p>Add your scores above. Nothing here is sent to a server.</p></div>`
            : `<p class="field-hint sample-note">These grades stay on this device. Edit or delete any row and the average updates. The first visit includes example scores you can change.</p><div class="grade-list">${cards}</div>`
        }
      </section>
    `;
  }

  SH.grades = { render, submit };
  SH.views = SH.views || {};
  SH.views.grades = render;
})(window.StudyHub = window.StudyHub || {});
