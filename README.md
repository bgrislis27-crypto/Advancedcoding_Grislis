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

- **Arrow keys** — move the player

## Project layout

| File | What it does |
| --- | --- |
| `index.html` | Page layout and canvas |
| `css/style.css` | Menu/HUD styling around the game |
| `js/input.js` | Tracks arrow key presses |
| `js/player.js` | Player position, movement, and drawing |
| `js/game.js` | Game loop and arena |
| `js/main.js` | Starts the game |
| `assets/player.png` | Pixel-art player sprite (backpack and flashlight) |
| `assets/monster.png` | Pixel-art monster sprite (glowing eyes) |
| `assets/food_collection.png` | Pixel-art food item set |
| `assets/apple.png` | Apple pickup sprite |
| `assets/berries.png` | Berry pickup sprite |
| `assets/canned_food.png` | Canned food pickup sprite |
| `assets/water_bottle.png` | Water bottle pickup sprite |

## Current progress

This first version only includes the **game screen** and **player movement**. Later pieces (enemies, shooting, score, health, and power-ups) can be added on top of this loop.
