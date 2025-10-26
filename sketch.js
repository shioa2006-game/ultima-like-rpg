// sketch.js - p5.js メインスクリプト

// キーリピート防止用の変数
let lastKeyPressTime = 0;
const KEY_REPEAT_DELAY = 150; // ミリ秒

// 初期化処理
function setup() {
  // キャンバスを作成
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // テキストのデフォルト設定
  textFont('Courier New');
  textAlign(LEFT, TOP);

  // デバッグ情報をコンソールに出力
  console.log('=== Ultima-like RPG 初期化 ===');
  console.log(`タイルサイズ: ${TILE_SIZE}px`);
  console.log(`可視範囲: ${VIEW_COLS} x ${VIEW_ROWS} タイル`);
  console.log(`マップサイズ: ${GRID_WIDTH} x ${GRID_HEIGHT} タイル`);
  console.log(`プレイヤー初期位置: (${Game.player.x}, ${Game.player.y})`);
  console.log('カメラ追従システム: 有効');

  // マップデータの構造を検証
  console.log('\n=== マップデータ検証 ===');
  const map = getCurrentMap();
  console.log(`FIELD_TILES行数: ${map.tiles.length}`);
  console.log(`FIELD_TILES[0]列数: ${map.tiles[0] ? map.tiles[0].length : 'undefined'}`);
  console.log(`FIELD_ENTITIES行数: ${map.entities.length}`);
  console.log(`FIELD_ENTITIES[0]列数: ${map.entities[0] ? map.entities[0].length : 'undefined'}`);

  // プレイヤー初期位置のタイル・エンティティを確認
  console.log(`\nプレイヤー初期位置 (${Game.player.x}, ${Game.player.y}) の確認:`);
  // デバッグモードを一時的に有効化してマップアクセスログを確認
  window.DEBUG_MAP_ACCESS = true;
  console.log(`Tile: ${getTile(Game.player.x, Game.player.y)}`);
  console.log(`Entity: ${getEntity(Game.player.x, Game.player.y)}`);
  window.DEBUG_MAP_ACCESS = false;

  console.log('\n=== デバッグログ有効 ===');
  console.log('ブラウザのコンソールで詳細なログが確認できます。');
  console.log('キー入力、移動、ワープなどの詳細情報が表示されます。');
}

// 描画ループ
function draw() {
  // 全体を描画
  render();
}

// キー入力処理
function keyPressed() {
  // キーリピート防止: 前回のキー入力から一定時間経過していない場合は無視
  const currentTime = millis();
  if (currentTime - lastKeyPressTime < KEY_REPEAT_DELAY) {
    console.log(`⚠ Key repeat detected! Ignoring (${currentTime - lastKeyPressTime}ms since last key)`);
    return false;
  }

  // 最後のキー入力時刻を更新
  lastKeyPressTime = currentTime;

  // input.jsの処理を呼び出し
  handleKeyPressed(key, keyCode);

  // デフォルトのブラウザ動作を防ぐ（矢印キーでスクロールしないように）
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode)) {
    return false;
  }
}
