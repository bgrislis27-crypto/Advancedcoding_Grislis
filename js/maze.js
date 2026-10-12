// Builds a random hallway maze and answers questions about it:
// which cells connect, can the creature see the player, and what is the next step.

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function key(c, r) {
  return `${c},${r}`;
}

// Which kind of place this cell belongs to. There is no player map.
// The rooms themselves are the landmarks.
export function zoneName(level, c, r) {
  const { cols, rows } = level;
  if (r <= 3) return "yellow";
  if (r <= 6) return "office";
  if (r <= 8) return "flood";
  if (c >= cols - 4) return "maintenance";
  if (r >= rows - 4 && c <= 4) return "stairs";
  if (r >= rows - 3) return "strange";
  return "abandoned";
}

// Floor cells that share a side with this one.
export function neighbors(level, c, r) {
  const next = [];
  for (const [dc, dr] of DIRS) {
    const nc = c + dc;
    const nr = r + dr;
    if (nc < 0 || nr < 0 || nc >= level.cols || nr >= level.rows) continue;
    if (level.floor[nr][nc]) next.push({ c: nc, r: nr });
  }
  return next;
}

// True if every cell on the straight line between a and b is open hallway.
export function hasSight(level, a, b) {
  const steps = Math.max(Math.abs(b.c - a.c), Math.abs(b.r - a.r));
  if (steps === 0) return true;

  for (let i = 1; i <= steps; i++) {
    const c = Math.round(a.c + ((b.c - a.c) * i) / steps);
    const r = Math.round(a.r + ((b.r - a.r) * i) / steps);
    if (!level.floor[r][c]) return false;
  }
  return true;
}

// One step from "from" toward "to", walking only through hallways.
export function nextStep(level, from, to) {
  if (from.c === to.c && from.r === to.r) return from;

  const previous = new Map();
  const queue = [from];
  previous.set(key(from.c, from.r), null);

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current.c === to.c && current.r === to.r) break;

    for (const next of neighbors(level, current.c, current.r)) {
      const id = key(next.c, next.r);
      if (previous.has(id)) continue;
      previous.set(id, current);
      queue.push(next);
    }
  }

  if (!previous.has(key(to.c, to.r))) return from;

  let current = to;
  let before = previous.get(key(current.c, current.r));
  while (before && !(before.c === from.c && before.r === from.r)) {
    current = before;
    before = previous.get(key(current.c, current.r));
  }
  return current;
}

// Open a few 2 by 2 rooms that touch a hall, so the maze has small rooms.
function addRooms(floor, cols, rows) {
  let made = 0;
  for (let attempt = 0; attempt < 40 && made < 4; attempt++) {
    const c = 1 + Math.floor(Math.random() * (cols - 3));
    const r = 1 + Math.floor(Math.random() * (rows - 3));
    const touches = floor[r][c] || floor[r][c + 1] || floor[r + 1][c] || floor[r + 1][c + 1];
    if (!touches) continue;
    floor[r][c] = true;
    floor[r][c + 1] = true;
    floor[r + 1][c] = true;
    floor[r + 1][c + 1] = true;
    made += 1;
  }
}

// Punch a few extra connections so some halls loop instead of only dead-ending.
function addLoops(floor, cols, rows) {
  const spots = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (floor[r][c]) continue;
      let links = 0;
      if (floor[r - 1][c]) links += 1;
      if (floor[r + 1][c]) links += 1;
      if (floor[r][c - 1]) links += 1;
      if (floor[r][c + 1]) links += 1;
      if (links >= 2) spots.push([c, r]);
    }
  }
  shuffle(spots);
  const count = Math.min(spots.length, 6);
  for (let i = 0; i < count; i++) floor[spots[i][1]][spots[i][0]] = true;
}

function randomFloor(level, dist, minDist, maxDist) {
  const choices = [];
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (!level.floor[r][c]) continue;
      const d = dist[r][c];
      if (d >= minDist && d <= maxDist) choices.push({ c, r });
    }
  }
  if (choices.length === 0) return { c: 1, r: 1 };
  return choices[Math.floor(Math.random() * choices.length)];
}

// Carve a new maze every time the page loads, then pick a start, an exit, and dark corners.
export function generateLevel(cols = 13, rows = 13) {
  const floor = Array.from({ length: rows }, () => Array(cols).fill(false));

  function carve(c, r) {
    floor[r][c] = true;
    for (const [dc, dr] of shuffle(DIRS.map((dir) => dir.slice()))) {
      const nc = c + dc * 2;
      const nr = r + dr * 2;
      if (nc <= 0 || nr <= 0 || nc >= cols - 1 || nr >= rows - 1) continue;
      if (floor[nr][nc]) continue;
      floor[r + dr][c + dc] = true;
      carve(nc, nr);
    }
  }

  carve(1, 1);
  // Extra rooms and loops, so the maze is not one straight hall.
  // The pieces still look alike, which makes it easy to lose your place.
  addRooms(floor, cols, rows);
  addLoops(floor, cols, rows);

  const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const queue = [{ c: 1, r: 1 }];
  dist[1][1] = 0;
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const next of neighbors({ floor, cols, rows }, current.c, current.r)) {
      if (dist[next.r][next.c] !== -1) continue;
      dist[next.r][next.c] = dist[current.r][current.c] + 1;
      queue.push(next);
    }
  }

  let exit = { c: 1, r: 1 };
  let farthest = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dist[r][c] > farthest) {
        farthest = dist[r][c];
        exit = { c, r };
      }
    }
  }

  const hides = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!floor[r][c]) continue;
      if ((c === 1 && r === 1) || (c === exit.c && r === exit.r)) continue;
      // A dead end has only one open neighbor. Those become dark hiding spots.
      if (neighbors({ floor, cols, rows }, c, r).length === 1) hides.add(key(c, r));
    }
  }

  const safe = new Set();
  const offices = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!floor[r][c]) continue;
      if (zoneName({ cols, rows }, c, r) === "office") offices.push(key(c, r));
    }
  }
  shuffle(offices);
  for (let i = 0; i < Math.min(2, offices.length); i++) safe.add(offices[i]);

  const level = {
    cols,
    rows,
    cell: 4.2,
    floor,
    dist,
    start: { c: 1, r: 1 },
    exit,
    hides,
    safe,
  };
  level.creature = randomFloor(level, dist, 6, 10);
  return level;
}
