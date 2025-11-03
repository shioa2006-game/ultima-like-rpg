// p5.js のエントリポイント
function preload() {
  // スプライトシートの読み込み
  if (!window.Game) window.Game = {};
  if (!window.Game.assets) window.Game.assets = {};
  window.Game.assets.tilesSheet = loadImage('assets/tiles.png');
  window.Game.assets.actorsSheet = loadImage('assets/actors.png');
  window.Game.assets.enemiesSheet = loadImage('assets/enemies.png');
  window.Game.assets.objectsSheet = loadImage('assets/objects_interactable.png');
}

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
  Game.occupancy.ensure();
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
