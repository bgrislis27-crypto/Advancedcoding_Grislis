# StudyHub

StudyHub is a homework planner that runs in the browser. Assignments, grades, the study timer, and the light or dark theme stay in **localStorage** on this device. There is no account, no server, and no external API.

The maze game in the parent folder is a separate project. StudyHub is only the files in this folder.

## How to run

From this folder:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

From the repository root, the same server serves StudyHub at [http://localhost:8000/studyhub/](http://localhost:8000/studyhub/).

You can also open `index.html` directly. A local server is the more reliable option because some browsers limit storage on `file://` pages.

## What you can do

- **Dashboard** shows today's date, active assignments, overdue work, deadlines for the next 7 days, and progress bars by subject, time, and priority.
- **Assignments** adds a title, subject, description, due date, priority, and estimated completion time. You can edit a row, delete it, or mark it complete. Filters cover subject, priority, completed work, upcoming work, and overdue work.
- **Calendar** places each assignment on its due date. Select a day to complete, edit, or delete what is due.
- **Study Timer** is a Pomodoro timer: 25 minutes of focus, a 5 minute short break, and a 15 minute long break after every fourth focus session. Start, pause, resume, and reset all work, and a finished session is kept if you refresh.
- **Grade Calculator** turns points earned and points possible into a simple average. Add optional weights for a weighted average and a letter grade.
- **Light and dark mode** is in the sidebar. The choice is saved with your list.

The first visit includes sample assignments and sample grades. Edit or delete them like anything you add yourself. If you clear the saved data, the samples return on the next visit:

```js
localStorage.removeItem("studyhub.v1");
location.reload();
```

## Files

| File | What it does |
| --- | --- |
| `index.html` | Sidebar, top bar, and the screen container |
| `css/styles.css` | Dark navy theme, light theme, and the responsive layout |
| `js/util.js` | Dates, filters, progress math, and grade averages |
| `js/store.js` | Sample data and `localStorage` |
| `js/assignments.js` | Assignment list, form, edit, delete, and complete |
| `js/dashboard.js` | Today, deadlines, and progress bars |
| `js/calendar.js` | Month view |
| `js/timer.js` | Focus and break timer |
| `js/grades.js` | Grade form and averages |
| `js/app.js` | Navigation, theme, and button actions |

Saved data uses the key `studyhub.v1`.
