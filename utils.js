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

// グリッド座標が範囲内かどうかをチェック（ロジック専用、カメラ無関係）
// 引数: x, y = マップ座標（0-23, 0-17の範囲内かチェック）
//       debug = デバッグログを出力するか（デフォルト: true）
// 戻り値: 範囲内ならtrue、範囲外ならfalse
// 注意: GRID_WIDTH(24) x GRID_HEIGHT(18)のマップ次元のみを使用
function isInBounds(x, y, debug = true) {
  const result = x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
  if (debug) {
    console.log(`isInBounds(${x}, ${y}): ${result} (GRID: ${GRID_WIDTH}x${GRID_HEIGHT})`);
  }
  return result;
}

// カメラ座標を計算（描画専用、ロジックには影響しない）
// 引数: playerX, playerY = プレイヤーのマップ座標
// 戻り値: { camLeft, camTop } = カメラ左上のマップ座標
// 注意: この関数は描画時のみ使用。移動ロジックや衝突判定には絶対に使わない
function computeCameraLeftTop(playerX, playerY) {
  // プレイヤーを画面中央に配置
  let camLeft = playerX - Math.floor(VIEW_COLS / 2);
  let camTop = playerY - Math.floor(VIEW_ROWS / 2);

  // マップ境界内に制限
  camLeft = clamp(camLeft, 0, GRID_WIDTH - VIEW_COLS);
  camTop = clamp(camTop, 0, GRID_HEIGHT - VIEW_ROWS);

  return { camLeft, camTop };
}
