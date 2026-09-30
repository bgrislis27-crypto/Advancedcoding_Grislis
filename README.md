# Backrooms

A first-person 3D maze. The hallways are yellow, the lights flicker, and a creature searches for you. Find the green **EXIT** before it catches you.

This is a browser game made with **Three.js**. No extra install is needed.

## Link for class

Your teacher can open the game in a browser from this file on GitHub:

https://htmlpreview.github.io/?https://raw.githubusercontent.com/bgrislis27-crypto/Advancedcoding_Grislis/main/play.html

`play.html` is the same game packed into one file so that link can run it. The class code you read and edit is still the separate files below.

## How to run

From this folder:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) and click **Enter**.

## Controls

- **Mouse** — look around
- **W A S D** — move
- **Shift** — run (uses stamina)
- **E** — hide in a dark corner, step back out, or use the exit
- **Arrow left / right** — turn if the mouse is not locked

## Where the code goes

| File | What it does |
| --- | --- |
| `index.html` | Page, start screen, timer, stamina bar, win and lose screens |
| `css/style.css` | Yellow-and-black look of those screens |
| `js/main.js` | Starts the game |
| `js/game.js` | 3D scene, game loop, timer, win and lose checks |
| `js/maze.js` | Builds a new random hallway layout each visit |
| `js/world.js` | Yellow walls, carpet, flickering lights, exit door |
| `js/player.js` | Walking, running, stamina, hiding, and the exit |
| `js/creature.js` | The creature that wanders and chases |
| `js/input.js` | Keyboard and mouse |
| `js/audio.js` | Buzzing lights, footsteps, and distant noises |
| `js/hud.js` | Timer, stamina bar, and end screens |

Old pixel-art pictures in `assets/` are not used by this maze.
