# Survive

A first-person wilderness survival game for an advanced coding class.

The project uses **Three.js** in the browser: a first-person camera, a forest valley, mountains, weather, and a bow in the player's hands.

## How to run

Start a local server from this folder (needed because the game loads JavaScript modules):

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000). Click **Enter the forest**.

## Controls

- **Mouse** — look around (click the game to lock the pointer)
- **W A S D** or **arrow keys** — walk
- **Shift** — sprint (uses stamina)
- **Q / E** — turn if the mouse is not locked
- **Hold left mouse** — draw the bow

## Project layout

| File | What it does |
| --- | --- |
| `index.html` | Full-screen canvas and survival HUD |
| `css/style.css` | HUD, start screen, and overlays |
| `js/main.js` | Starts the game |
| `js/game.js` | Scene, lighting, fog, sky, and loop |
| `js/world.js` | Terrain, trees, rocks, flowers, snow |
| `js/player.js` | First-person movement and stats |
| `js/viewmodel.js` | Hands, bow, and arrow |
| `js/input.js` | Keyboard and mouse |
| `js/hud.js` | Health, hunger, thirst, stamina meters |
| `js/noise.js` | Height and ground variation |

Pixel-art images in `assets/` are leftover concept art and are not used by this 3D scene.
