# Backrooms

A first-person 3D maze. The hallways are yellow, the lights flicker, and a creature searches for you. Find the green **EXIT** before it catches you.

This is a browser game made with **Three.js**. No extra install is needed.

## Link for class

One scrolling page about the game:

https://htmlpreview.github.io/?https://raw.githubusercontent.com/bgrislis27-crypto/Advancedcoding_Grislis/main/about.html

Play the game from that page, or open it directly:

https://htmlpreview.github.io/?https://raw.githubusercontent.com/bgrislis27-crypto/Advancedcoding_Grislis/main/play.html

`play.html` is the same game packed into one file so that link can run it. The class code you read and edit is still the separate files below.

## How to run

From this folder:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) and click **Wake Up**.

## Controls

- **Mouse** — look around
- **W A S D** — move
- **Shift** — run (uses stamina, and the steps get louder)
- **F** — flashlight. The gold bar is the battery. It flickers when the battery is low.
- **E** — try a door, hide in a dark corner, step back out, or use the exit
- **Arrow left / right** — turn if the mouse is not locked

There is no map. A few signs name the kind of place you are in. The halls connect: yellow halls, offices, wet floors, maintenance, stairs, empty rooms, and stranger rooms.

## Where the code goes

| File | What it does |
| --- | --- |
| `index.html` | Page, start screen, timer, stamina bar, win and lose screens |
| `css/style.css` | Yellow-and-black look of those screens |
| `js/main.js` | Starts the game |
| `js/game.js` | 3D scene, game loop, timer, win and lose checks |
| `js/maze.js` | Builds a new random hallway layout each visit |
| `js/world.js` | Yellow walls, carpet, ceiling lights, exit door |
| `js/lighting.js` | Flicker and blackouts for each ceiling light |
| `js/player.js` | Walking, running, stamina, hiding, doors, and the exit |
| `js/camera.js` | Head bob, sway, and a small shake after a scare |
| `js/creature.js` | Entity states: hidden, watching, wandering, investigating, approaching, chasing |
| `js/watcher.js` | A rare shadow at the end of a hallway |
| `js/doors.js` | Doors that open, stay locked, lead somewhere else, or vanish |
| `js/flashlight.js` | Flashlight battery, flicker, and short malfunctions |
| `js/fear.js` | Hidden fear. Dark, sounds, and the entity raise it. A still room lowers it. |
| `js/hallucination.js` | A very short false figure |
| `js/timewarp.js` | Quiet changes after a long walk |
| `js/scare.js` | A rare close scare after fear is already high |
| `js/changes.js` | Boxes and lights that change behind you |
| `js/events.js` | Picks one quiet scare every 20–60 seconds |
| `js/look.js` | Checks whether you are looking at a spot |
| `js/input.js` | Keyboard and mouse |
| `js/audio.js` | Buzz, footsteps, directional noises, and stretches of silence |
| `js/hud.js` | Timer, stamina bar, battery bar, and end screens |

Old pixel-art pictures in `assets/` are not used by this maze.
