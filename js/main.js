// This is the first file that runs.
// It finds the game canvas on the page, creates the game, and starts the loop.

import { Game } from "./game.js";

const canvas = document.getElementById("game");
const game = new Game(canvas);
game.start();
