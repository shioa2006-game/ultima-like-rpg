// p5.js のエントリポイント
function setup() {
  const canvas = createCanvas(Game.config.canvasWidth, Game.config.canvasHeight);
  canvas.parent("game-root");
  textFont("Segoe UI");
  textAlign(CENTER, CENTER);
  Game.initializeGame();
  background(0);
}

function draw() {
  background(0);
  Game.occupancy.rebuild();
  Game.renderer.drawMap();
  Game.renderer.drawEntities();
  Game.renderer.drawUI();
  Game.renderer.drawOverlays();
  Game.renderer.drawBattleOverlay();
  Game.renderer.drawClearOverlay();
}

function keyPressed() {
  if (Game.flags && Game.flags.cleared) {
    if (keyCode === ENTER) {
      Game.resetForNewGame();
    }
    return;
  }
  Game.input.handleKeyPressed(key, keyCode);
}
