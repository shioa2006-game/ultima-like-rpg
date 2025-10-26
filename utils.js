(function () {
  // 共通ユーティリティ
  window.Game = window.Game || {};

  const utils = {
    // 数値を最小値と最大値の範囲に収める
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    // 座標の一致判定
    posEq(a, b) {
      return a && b && a.x === b.x && a.y === b.y;
    },
    // 通行不可タイルか判定
    isBlocked(tileId) {
      if (!window.Game || !Game.TILE_BLOCKED) return false;
      return !!Game.TILE_BLOCKED[tileId];
    },
    // 上下左右の隣接判定
    isAdjacent(a, b) {
      if (!a || !b) return false;
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
    },
    // 距離（マンハッタン距離）
    distance(a, b) {
      if (!a || !b) return Infinity;
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    },
    // 整数乱数（包含範囲）
    randInt(min, max) {
      const low = Math.ceil(min);
      const high = Math.floor(max);
      return Math.floor(Math.random() * (high - low + 1)) + low;
    },
    // 配列からランダムに選択
    choice(list) {
      if (!list || !list.length) return null;
      const index = utils.randInt(0, list.length - 1);
      return list[index];
    },
  };

  Game.utils = utils;
})();
