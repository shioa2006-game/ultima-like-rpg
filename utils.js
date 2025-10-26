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
