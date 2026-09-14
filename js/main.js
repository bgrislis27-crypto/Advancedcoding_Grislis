/**
 * Starts the game once the page has finished loading.
 */
window.addEventListener("load", () => {
  const canvas = document.getElementById("game");
  const game = new Game(canvas);
  game.start();
});
