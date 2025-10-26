// p5.js エントリポイント
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
  Game.renderer.drawMap();
  Game.renderer.drawEntities();
  Game.renderer.drawUI();
  Game.renderer.drawOverlays();
}

function keyPressed() {
  Game.input.handleKeyPressed(key, keyCode);
}
