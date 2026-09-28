# Survive

A first-person wilderness survival game for an advanced coding class.

You start in a forest meadow, look around with the mouse, and walk toward snowy mountains. Your hands hold a bow, and the screen shows health, hunger, thirst, and stamina.

The game runs in the browser with **Three.js**. There is no game engine to install.

## How to run

Open a terminal in this folder and start a small local server. A server is required because the game loads JavaScript as modules.

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) and click **Enter the forest**.

## Controls

- **Mouse** — look around. Click the game if the cursor is still showing.
- **W A S D** or the **arrow keys** — walk
- **Shift** — sprint. This uses stamina.
- **Q / E** — turn left or right if the mouse is not locked
- **Hold the left mouse button** — draw the bow
- **Esc** — show the mouse again

## What is on the screen

The circles on the left are survival meters:

- lightning bolt — stamina
- fork and knife — hunger
- water drop — thirst
- heart — health

The thin bar at the bottom shows how far the bow is drawn. The numbers on the right are the arrow count.

## How the code is organized

Start with `index.html`, then `js/main.js`. Comments in each file explain what that file does.

| File | What it does |
| --- | --- |
| `index.html` | Page, start screen, and survival HUD |
| `css/style.css` | Look of the start screen and HUD |
| `js/main.js` | Starts the game |
| `js/game.js` | 3D scene, sky, lights, fog, and the game loop |
| `js/world.js` | Ground, trees, rocks, flowers, mountains, and snow |
| `js/player.js` | Walking, looking around, and survival stats |
| `js/viewmodel.js` | Hands, bow, and arrow |
| `js/input.js` | Keyboard and mouse |
| `js/hud.js` | Updates the on-screen meters |
| `js/noise.js` | Random-looking hills so the ground is not flat |

## Extra images

`assets/` has pixel-art pictures of a player, a monster, and food. Those images are concept art. The 3D scene does not draw them yet.

## What is not in the game yet

Enemies, shooting arrows, collecting food, and a real win or lose condition are not built yet. Hunger and thirst go down over time, but they do not end the game.
