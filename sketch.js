// sketch.js - p5.js メインスクリプト

// 初期化処理
function setup() {
  // キャンバスを作成
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // テキストのデフォルト設定
  textFont('Courier New');
  textAlign(LEFT, TOP);
}

// 描画ループ
function draw() {
  // 全体を描画
  render();
}

// キー入力処理
function keyPressed() {
  // input.jsの処理を呼び出し
  handleKeyPressed(key, keyCode);

  // デフォルトのブラウザ動作を防ぐ（矢印キーでスクロールしないように）
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode)) {
    return false;
  }
}
