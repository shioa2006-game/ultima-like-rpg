// p5.js のエントリポイント
function preload() {
  // スプライトシートを読み込み
  if (!window.Game) window.Game = {};
  if (!window.Game.assets) window.Game.assets = {};
  window.Game.assets.tilesSheet = loadImage("assets/tiles.png");
  window.Game.assets.actorsSheet = loadImage("assets/actors.png");
  window.Game.assets.enemiesSheet = loadImage("assets/enemies.png");
  window.Game.assets.objectsSheet = loadImage("assets/objects_interactable.png");

  // NPC対話データも事前に読み込む
  if (window.Game.dialogue && typeof window.Game.dialogue.loadDialogues === "function") {
    window.Game.dialogue.loadDialogues(this);
    console.log("dialogues.json を読み込みました");
  } else {
    console.warn("Game.dialogue が未定義のため対話データを読み込めませんでした");
  }
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

  // 連続移動を処理
  Game.input.update();
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

function keyReleased() {
  // キーが離されたときの処理
  Game.input.handleKeyReleased(keyCode);
}
