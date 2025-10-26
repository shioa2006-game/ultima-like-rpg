(function () {
  // 共通ユーティリティをGame名前空間に登録
  window.Game = window.Game || {};

  const utils = {
    // 数値を最小値と最大値の範囲に収める
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    // 座標オブジェクトの一致判定
    posEq(a, b) {
      return a && b && a.x === b.x && a.y === b.y;
    },
    // 通行不可タイルか判定
    isBlocked(tileId) {
      if (!window.Game || !Game.TILE_BLOCKED) return false;
      return !!Game.TILE_BLOCKED[tileId];
    },
    // 上下左右いずれかに隣接しているか判定
    isAdjacent(a, b) {
      if (!a || !b) return false;
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
    },
  };

  Game.utils = utils;
})();
