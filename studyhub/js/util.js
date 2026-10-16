/* Shared date, text, and calculation helpers. No network calls. */
(function (SH) {
  const SUBJECT_COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#14b8a6", "#f59e0b", "#f472b6", "#818cf8", "#22c55e"];
  const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function uid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(iso) {
    const [year, month, day] = String(iso).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function isISODate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const date = parseISODate(value);
    return toISODate(date) === value;
  }

  function addDays(iso, days) {
    const date = parseISODate(iso);
    date.setDate(date.getDate() + days);
    return toISODate(date);
  }

  function todayISO(now) {
    return toISODate(now || new Date());
  }

  function dayDiff(fromISO, toISO) {
    const ms = parseISODate(toISO) - parseISODate(fromISO);
    return Math.round(ms / 86400000);
  }

  function formatLongDate(iso) {
    return parseISODate(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatMonthDay(iso) {
    return parseISODate(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function formatMonthYear(isoMonth) {
    const [year, month] = isoMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function formatMinutes(mins) {
    const n = Math.round(Number(mins) || 0);
    if (n < 60) return `${n} min`;
    const hours = Math.floor(n / 60);
    const minutes = n % 60;
    const hourLabel = hours === 1 ? "1 hr" : `${hours} hr`;
    return minutes === 0 ? hourLabel : `${hourLabel} ${minutes} min`;
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "—";
    const rounded = round1(value);
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return "—";
    return `${formatNumber(value)}%`;
  }

  function letterGrade(percent) {
    if (!Number.isFinite(percent)) return "—";
    if (percent >= 97) return "A+";
    if (percent >= 93) return "A";
    if (percent >= 90) return "A-";
    if (percent >= 87) return "B+";
    if (percent >= 83) return "B";
    if (percent >= 80) return "B-";
    if (percent >= 77) return "C+";
    if (percent >= 73) return "C";
    if (percent >= 70) return "C-";
    if (percent >= 67) return "D+";
    if (percent >= 63) return "D";
    if (percent >= 60) return "D-";
    return "F";
  }

  function greeting(date) {
    const hour = (date || new Date()).getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  function dueMeta(assignment, today) {
    if (assignment.completed) return { label: "Completed", tone: "done" };
    const diff = dayDiff(today, assignment.dueDate);
    if (diff === 0) return { label: "Due today", tone: "today" };
    if (diff === 1) return { label: "Due tomorrow", tone: "soon" };
    if (diff > 1) return { label: `Due in ${diff} days`, tone: "soon" };
    if (diff === -1) return { label: "1 day overdue", tone: "late" };
    return { label: `${Math.abs(diff)} days overdue`, tone: "late" };
  }

  function subjectColor(name) {
    let hash = 0;
    const text = String(name || "");
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
  }

  function compareDue(a, b) {
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    const rankA = PRIORITY_RANK[a.priority] ?? 1;
    const rankB = PRIORITY_RANK[b.priority] ?? 1;
    if (rankA !== rankB) return rankA - rankB;
    return a.title.localeCompare(b.title);
  }

  function sortAssignments(list) {
    return list.slice().sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return compareDue(a, b);
    });
  }

  function matchesStatus(assignment, status, today) {
    if (status === "active") return !assignment.completed;
    if (status === "completed") return assignment.completed;
    if (status === "upcoming") return !assignment.completed && assignment.dueDate >= today;
    if (status === "overdue") return !assignment.completed && assignment.dueDate < today;
    return true;
  }

  function filterAssignments(list, filters, today) {
    const subject = filters.subject || "all";
    const priority = filters.priority || "all";
    const status = filters.status || "all";
    return sortAssignments(
      list.filter((assignment) => {
        if (subject !== "all" && assignment.subject !== subject) return false;
        if (priority !== "all" && assignment.priority !== priority) return false;
        return matchesStatus(assignment, status, today);
      })
    );
  }

  function statusCounts(list, filters, today) {
    const subject = filters.subject || "all";
    const priority = filters.priority || "all";
    const base = list.filter((assignment) => {
      if (subject !== "all" && assignment.subject !== subject) return false;
      if (priority !== "all" && assignment.priority !== priority) return false;
      return true;
    });
    const counts = {};
    ["all", "active", "completed", "upcoming", "overdue"].forEach((status) => {
      counts[status] = base.filter((assignment) => matchesStatus(assignment, status, today)).length;
    });
    return counts;
  }

  function summarizeAssignments(assignments, today) {
    const list = assignments.slice();
    const completed = list.filter((assignment) => assignment.completed);
    const active = list.filter((assignment) => !assignment.completed);
    const overdue = active.filter((assignment) => assignment.dueDate < today);
    const weekEnd = addDays(today, 6);
    const dueThisWeek = active.filter(
      (assignment) => assignment.dueDate >= today && assignment.dueDate <= weekEnd
    );
    const upcoming = active.filter((assignment) => assignment.dueDate >= today);
    const minutesRemaining = active.reduce((sum, assignment) => sum + assignment.estimatedMinutes, 0);
    const minutesDone = completed.reduce((sum, assignment) => sum + assignment.estimatedMinutes, 0);
    const totalMinutes = minutesDone + minutesRemaining;
    const subjectMap = new Map();

    list.forEach((assignment) => {
      if (!subjectMap.has(assignment.subject)) {
        subjectMap.set(assignment.subject, { subject: assignment.subject, total: 0, completed: 0 });
      }
      const row = subjectMap.get(assignment.subject);
      row.total += 1;
      if (assignment.completed) row.completed += 1;
    });

    const bySubject = Array.from(subjectMap.values())
      .map((row) => ({ ...row, rate: round1((row.completed / row.total) * 100) }))
      .sort((a, b) => a.subject.localeCompare(b.subject));

    const byPriority = { high: 0, medium: 0, low: 0 };
    active.forEach((assignment) => {
      if (byPriority[assignment.priority] !== undefined) byPriority[assignment.priority] += 1;
    });

    const openSorted = sortAssignments(active);
    const upcomingSorted = upcoming.slice().sort(compareDue);

    return {
      total: list.length,
      active: active.length,
      completed: completed.length,
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      upcoming: upcoming.length,
      minutesRemaining,
      minutesDone,
      completionRate: list.length === 0 ? 0 : round1((completed.length / list.length) * 100),
      timeRate: totalMinutes === 0 ? 0 : round1((minutesDone / totalMinutes) * 100),
      bySubject,
      byPriority,
      nextUp: openSorted[0] || null,
      upcomingList: upcomingSorted.slice(0, 5),
      overdueList: overdue.slice().sort(compareDue),
      laterCount: Math.max(0, upcomingSorted.length - 5),
    };
  }

  function gradeSummary(grades) {
    if (!grades.length) {
      return { empty: true, rows: [], simple: null, weighted: null };
    }

    const rows = grades.map((grade) => ({
      ...grade,
      percent: round1((grade.earned / grade.possible) * 100),
    }));
    const simple = round1(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length);
    const weightedRows = rows.filter((row) => row.weight > 0);
    let weighted = null;
    let weightTotal = 0;
    if (weightedRows.length) {
      weightTotal = round1(weightedRows.reduce((sum, row) => sum + row.weight, 0));
      const raw = weightedRows.reduce((sum, row) => sum + row.percent * row.weight, 0) / weightTotal;
      weighted = round1(raw);
    }

    return {
      empty: false,
      rows,
      simple,
      simpleLetter: letterGrade(simple),
      weighted,
      weightedLetter: weighted === null ? null : letterGrade(weighted),
      weightTotal,
      unweightedNames: rows.filter((row) => !(row.weight > 0)).map((row) => row.name),
    };
  }

  function plural(count, singular, pluralLabel) {
    return `${count} ${count === 1 ? singular : pluralLabel || `${singular}s`}`;
  }

  function monthGrid(isoMonth) {
    const [year, month] = isoMonth.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const start = new Date(year, month - 1, 1 - first.getDay());
    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    while (days.length > 35 && days.slice(-7).every((date) => date.getMonth() !== month - 1)) {
      days.splice(-7, 7);
    }
    return days;
  }

  SH.TIMER_MODES = {
    focus: { id: "focus", label: "Focus", minutes: 25, hint: "Work on one assignment until the timer ends." },
    short: { id: "short", label: "Short break", minutes: 5, hint: "Stand up, stretch, and leave the assignment alone." },
    long: { id: "long", label: "Long break", minutes: 15, hint: "Take a real break. You finished a full focus cycle." },
  };

  SH.util = {
    escapeHtml,
    uid,
    toISODate,
    parseISODate,
    isISODate,
    addDays,
    todayISO,
    dayDiff,
    formatLongDate,
    formatMonthDay,
    formatMonthYear,
    formatMinutes,
    round1,
    formatNumber,
    formatPercent,
    letterGrade,
    greeting,
    dueMeta,
    subjectColor,
    compareDue,
    sortAssignments,
    matchesStatus,
    filterAssignments,
    statusCounts,
    summarizeAssignments,
    gradeSummary,
    plural,
    monthGrid,
  };
})(window.StudyHub = window.StudyHub || {});
