/* Assignments, grades, theme, and timer saved in localStorage. */
(function (SH) {
  const KEY = "studyhub.v1";
  const VIEWS = ["dashboard", "assignments", "calendar", "timer", "grades"];

  function durationMs(mode) {
    const minutes = SH.TIMER_MODES[mode] ? SH.TIMER_MODES[mode].minutes : 25;
    return minutes * 60 * 1000;
  }

  function defaultTimer() {
    return {
      mode: "focus",
      running: false,
      endsAt: null,
      remainingMs: durationMs("focus"),
      completedFocusSessions: 0,
    };
  }

  function defaultUI(today) {
    return {
      filters: { subject: "all", priority: "all", status: "all" },
      calendarMonth: today.slice(0, 7),
      calendarSelected: today,
      gradeEditing: null,
      flashId: null,
    };
  }

  function stamp(dayOffset, hour) {
    const date = SH.util.parseISODate(SH.util.addDays(SH.util.todayISO(), dayOffset));
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  }

  function seedAssignments() {
    return [
      {
        id: "spanish-vocab",
        title: "Vocabulary Quiz: Unit 5",
        subject: "Spanish",
        description: "Review the 25 unit words, preterite endings, and the two speaking prompts before class.",
        dueDate: SH.util.addDays(SH.util.todayISO(), 0),
        priority: "high",
        estimatedMinutes: 25,
        completed: false,
        completedAt: null,
        createdAt: stamp(-4, 16),
      },
      {
        id: "bio-lab",
        title: "Cell Division Lab Report",
        subject: "Biology",
        description: "Finish the mitosis observations, labeled diagrams, and the conclusion questions from Thursday's lab.",
        dueDate: SH.util.addDays(SH.util.todayISO(), -1),
        priority: "high",
        estimatedMinutes: 60,
        completed: false,
        completedAt: null,
        createdAt: stamp(-6, 15),
      },
      {
        id: "alg-quadratic",
        title: "Quadratic Functions Problem Set",
        subject: "Algebra II",
        description: "Complete problems 1–20 on vertex form, intercepts, and the quadratic formula. Show each step.",
        dueDate: SH.util.addDays(SH.util.todayISO(), 1),
        priority: "high",
        estimatedMinutes: 45,
        completed: false,
        completedAt: null,
        createdAt: stamp(-2, 18),
      },
      {
        id: "chem-stoich",
        title: "Stoichiometry Worksheet",
        subject: "Chemistry",
        description: "Balance the equations on page 1 and solve the mole-to-mole conversions on page 2.",
        dueDate: SH.util.addDays(SH.util.todayISO(), 3),
        priority: "medium",
        estimatedMinutes: 40,
        completed: false,
        completedAt: null,
        createdAt: stamp(-3, 11),
      },
      {
        id: "eng-hamlet",
        title: "Hamlet Act II Reading Response",
        subject: "English",
        description: "Write about 400 words on how Hamlet's soliloquies show his hesitation. Quote at least two lines.",
        dueDate: SH.util.addDays(SH.util.todayISO(), 4),
        priority: "medium",
        estimatedMinutes: 90,
        completed: false,
        completedAt: null,
        createdAt: stamp(-5, 19),
      },
      {
        id: "hist-reconstruction",
        title: "Reconstruction Section Review",
        subject: "U.S. History",
        description: "Answer the section review on the 13th, 14th, and 15th Amendments in complete sentences.",
        dueDate: SH.util.addDays(SH.util.todayISO(), 6),
        priority: "low",
        estimatedMinutes: 30,
        completed: false,
        completedAt: null,
        createdAt: stamp(-1, 9),
      },
      {
        id: "art-perspective",
        title: "Perspective Drawing Studies",
        subject: "Art",
        description: "Three one-point perspective sketches: a hallway, a classroom, and a street corner.",
        dueDate: SH.util.addDays(SH.util.todayISO(), 8),
        priority: "low",
        estimatedMinutes: 75,
        completed: false,
        completedAt: null,
        createdAt: stamp(-2, 14),
      },
      {
        id: "cs-loops",
        title: "Python Functions and Loops",
        subject: "Computer Science",
        description: "Finish the practice file with for-loops and two functions. Submit the .py file.",
        dueDate: SH.util.addDays(SH.util.todayISO(), -3),
        priority: "medium",
        estimatedMinutes: 50,
        completed: true,
        completedAt: stamp(-4, 20),
        createdAt: stamp(-8, 16),
      },
      {
        id: "alg-linear",
        title: "Linear Systems Review",
        subject: "Algebra II",
        description: "Solve the six systems by substitution and check each solution in both equations.",
        dueDate: SH.util.addDays(SH.util.todayISO(), -5),
        priority: "medium",
        estimatedMinutes: 35,
        completed: true,
        completedAt: stamp(-6, 17),
        createdAt: stamp(-9, 12),
      },
      {
        id: "eng-vocab",
        title: "Weekly Vocabulary Sentences",
        subject: "English",
        description: "Write an original sentence for each of the ten words assigned on Monday.",
        dueDate: SH.util.addDays(SH.util.todayISO(), -1),
        priority: "low",
        estimatedMinutes: 20,
        completed: true,
        completedAt: stamp(-1, 21),
        createdAt: stamp(-4, 8),
      },
    ];
  }

  function seedGrades() {
    return [
      { id: "grade-bio", name: "Biology unit test", earned: 82, possible: 100, weight: 30 },
      { id: "grade-alg", name: "Algebra quiz 4", earned: 18, possible: 20, weight: 20 },
      { id: "grade-eng", name: "Hamlet essay outline", earned: 44, possible: 50, weight: 25 },
      { id: "grade-span", name: "Spanish oral check", earned: 9, possible: 10, weight: null },
    ];
  }

  function roundScore(value) {
    return Math.round(value * 100) / 100;
  }

  function cleanAssignment(raw, previous) {
    const title = String(raw.title || "").trim().slice(0, 80);
    const subject = String(raw.subject || "").trim().slice(0, 40);
    const description = String(raw.description || "").trim().slice(0, 500);
    const dueDate = String(raw.dueDate || "");
    const priority = ["low", "medium", "high"].includes(raw.priority) ? raw.priority : "";
    const estimatedMinutes = Number(raw.estimatedMinutes);
    if (!title || !subject || !SH.util.isISODate(dueDate) || !priority) return null;
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 600) return null;
    return {
      id: previous ? previous.id : String(raw.id || SH.util.uid()),
      title,
      subject,
      description,
      dueDate,
      priority,
      estimatedMinutes: Math.round(estimatedMinutes),
      completed: previous ? previous.completed : Boolean(raw.completed),
      completedAt: previous ? previous.completedAt : raw.completedAt || null,
      createdAt: previous ? previous.createdAt : raw.createdAt || new Date().toISOString(),
    };
  }

  function cleanGrade(raw, previous) {
    const name = String(raw.name || "").trim().slice(0, 80);
    const earned = Number(raw.earned);
    const possible = Number(raw.possible);
    const weightBlank = raw.weight === null || raw.weight === undefined || raw.weight === "";
    const weight = weightBlank ? null : Number(raw.weight);
    if (!name || !Number.isFinite(earned) || earned < 0 || earned > 10000) return null;
    if (!Number.isFinite(possible) || possible <= 0 || possible > 10000) return null;
    if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 1000)) return null;
    return {
      id: previous ? previous.id : String(raw.id || SH.util.uid()),
      name,
      earned: roundScore(earned),
      possible: roundScore(possible),
      weight: weight === null ? null : roundScore(weight),
    };
  }

  function cleanTimer(raw) {
    const timer = defaultTimer();
    if (!raw || typeof raw !== "object") return timer;
    if (SH.TIMER_MODES[raw.mode]) timer.mode = raw.mode;
    const remaining = Number(raw.remainingMs);
    const max = durationMs(timer.mode);
    timer.remainingMs = Number.isFinite(remaining) ? Math.min(max, Math.max(0, remaining)) : max;
    timer.running = Boolean(raw.running);
    const endsAt = Number(raw.endsAt);
    timer.endsAt = Number.isFinite(endsAt) ? endsAt : null;
    const sessions = Number(raw.completedFocusSessions);
    timer.completedFocusSessions = Number.isFinite(sessions) ? Math.max(0, Math.floor(sessions)) : 0;
    if (timer.running && !timer.endsAt) timer.running = false;
    return timer;
  }

  function freshState() {
    const today = SH.util.todayISO();
    return {
      version: 1,
      seeded: true,
      theme: "dark",
      view: "dashboard",
      assignments: seedAssignments(),
      grades: seedGrades(),
      timer: defaultTimer(),
      ui: defaultUI(today),
    };
  }

  function readStorage() {
    try {
      return { available: true, raw: localStorage.getItem(KEY) };
    } catch (error) {
      return { available: false, raw: null };
    }
  }

  const store = {
    state: null,
    storageAvailable: true,
    key: KEY,

    init() {
      const today = SH.util.todayISO();
      const read = readStorage();
      this.storageAvailable = read.available;
      if (!read.raw) {
        this.state = freshState();
        this.persist();
        return;
      }
      try {
        const parsed = JSON.parse(read.raw);
        const assignments = Array.isArray(parsed.assignments)
          ? parsed.assignments.map((item) => cleanAssignment(item)).filter(Boolean)
          : [];
        const grades = Array.isArray(parsed.grades)
          ? parsed.grades.map((item) => cleanGrade(item)).filter(Boolean)
          : [];
        const theme = parsed.theme === "light" ? "light" : "dark";
        const view = VIEWS.includes(parsed.view) ? parsed.view : "dashboard";
        this.state = {
          version: 1,
          seeded: true,
          theme,
          view,
          assignments,
          grades,
          timer: cleanTimer(parsed.timer),
          ui: defaultUI(today),
        };
      } catch (error) {
        this.state = freshState();
        this.persist();
      }
    },

    persist() {
      if (!this.storageAvailable || !this.state) return;
      const snapshot = {
        version: 1,
        seeded: true,
        theme: this.state.theme,
        view: this.state.view,
        assignments: this.state.assignments,
        grades: this.state.grades,
        timer: this.state.timer,
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(snapshot));
      } catch (error) {
        this.storageAvailable = false;
        if (SH.toast) SH.toast.show("Could not save. Browser storage may be full.", "warning");
      }
    },

    setView(view) {
      if (!VIEWS.includes(view)) return;
      this.state.view = view;
      this.persist();
    },

    setTheme(theme) {
      this.state.theme = theme === "light" ? "light" : "dark";
      this.persist();
    },

    findAssignment(id) {
      return this.state.assignments.find((item) => item.id === id) || null;
    },

    addAssignment(data) {
      const assignment = cleanAssignment(data);
      if (!assignment) return null;
      assignment.completed = false;
      assignment.completedAt = null;
      assignment.createdAt = new Date().toISOString();
      this.state.assignments.push(assignment);
      this.persist();
      return assignment;
    },

    updateAssignment(id, data) {
      const current = this.findAssignment(id);
      if (!current) return null;
      const next = cleanAssignment(data, current);
      if (!next) return null;
      Object.assign(current, next);
      this.persist();
      return current;
    },

    deleteAssignment(id) {
      const before = this.state.assignments.length;
      this.state.assignments = this.state.assignments.filter((item) => item.id !== id);
      const removed = this.state.assignments.length !== before;
      if (removed) this.persist();
      return removed;
    },

    toggleAssignment(id) {
      const current = this.findAssignment(id);
      if (!current) return null;
      current.completed = !current.completed;
      current.completedAt = current.completed ? new Date().toISOString() : null;
      this.persist();
      return current;
    },

    findGrade(id) {
      return this.state.grades.find((item) => item.id === id) || null;
    },

    addGrade(data) {
      const grade = cleanGrade(data);
      if (!grade) return null;
      this.state.grades.push(grade);
      this.persist();
      return grade;
    },

    updateGrade(id, data) {
      const current = this.findGrade(id);
      if (!current) return null;
      const next = cleanGrade(data, current);
      if (!next) return null;
      Object.assign(current, next);
      this.persist();
      return current;
    },

    deleteGrade(id) {
      const before = this.state.grades.length;
      this.state.grades = this.state.grades.filter((item) => item.id !== id);
      const removed = this.state.grades.length !== before;
      if (removed) this.persist();
      return removed;
    },
  };

  SH.store = store;
  SH.STORAGE_KEY = KEY;
})(window.StudyHub = window.StudyHub || {});
