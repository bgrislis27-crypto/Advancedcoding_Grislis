# Survive

A simple 2D top-down survival game for an advanced coding class.

The repo started empty (README only), so this project uses **HTML5 Canvas and vanilla JavaScript**. That keeps setup light: no engine install, and the game runs in a browser.

## How to run

Open `index.html` in a browser.

If the page does not load scripts correctly from a local file, start a tiny server from this folder:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Controls

- **W A S D** — move the player

## Project layout

| File | What it does |
| --- | --- |
| `index.html` | Page layout and canvas |
| `css/style.css` | Menu/HUD styling around the game |
| `js/input.js` | Tracks WASD key presses |
| `js/player.js` | Player position, movement, and drawing |
| `js/game.js` | Game loop and arena |
| `js/main.js` | Starts the game |

## Current progress

This first version only includes the **game screen** and **player movement**. Later pieces (enemies, shooting, score, health, and power-ups) can be added on top of this loop.
