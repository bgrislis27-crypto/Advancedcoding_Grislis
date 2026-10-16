/* Inline validation messages for the assignment and grade forms. */
(function (SH) {
  function showErrors(form, errors) {
    const summary = form.querySelector("[data-form-error]");
    const keys = Object.keys(errors);
    if (summary) {
      summary.hidden = keys.length === 0;
      summary.textContent = keys.length ? "Check the highlighted fields and try again." : "";
    }
    form.querySelectorAll("[data-error-for]").forEach((slot) => {
      const message = errors[slot.dataset.errorFor];
      slot.hidden = !message;
      slot.textContent = message || "";
    });
    form.querySelectorAll("[name]").forEach((field) => {
      const invalid = Boolean(errors[field.name]);
      field.classList.toggle("is-invalid", invalid);
      field.setAttribute("aria-invalid", invalid ? "true" : "false");
    });
    if (keys.length) {
      const first = form.querySelector(`[name="${keys[0]}"]`);
      if (first) first.focus();
    }
  }

  function clearField(field) {
    if (!field || !field.form) return;
    field.classList.remove("is-invalid");
    field.setAttribute("aria-invalid", "false");
    const slot = field.form.querySelector(`[data-error-for="${field.name}"]`);
    if (slot) {
      slot.hidden = true;
      slot.textContent = "";
    }
  }

  SH.forms = { showErrors, clearField };
})(window.StudyHub = window.StudyHub || {});
