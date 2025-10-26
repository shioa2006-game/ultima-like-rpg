// utils.js - 汎用関数

// 値を範囲内に制限
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// タイルIDが通行不可かどうかを判定
function isBlocked(tileId) {
  return TILE_BLOCKED.has(tileId);
}

// 2つの座標が同じかどうかを判定
function posEq(a, b) {
  return a.x === b.x && a.y === b.y;
}

// グリッド座標が範囲内かどうかをチェック
function isInBounds(x, y) {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

// カメラ座標を計算（プレイヤーを中心に配置、マップ端では制限）
function computeCameraLeftTop(playerX, playerY) {
  // プレイヤーを画面中央に配置
  let camLeft = playerX - Math.floor(VIEW_COLS / 2);
  let camTop = playerY - Math.floor(VIEW_ROWS / 2);

  // マップ境界内に制限
  camLeft = clamp(camLeft, 0, GRID_WIDTH - VIEW_COLS);
  camTop = clamp(camTop, 0, GRID_HEIGHT - VIEW_ROWS);

  return { camLeft, camTop };
}
