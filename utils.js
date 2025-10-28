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
    // シーンと座標から占有管理用のキーを生成
    makePosKey(scene, x, y) {
      return `${scene}:${x},${y}`;
    },
    findPath(start, goal, options = {}) {
      if (!start || !goal) return null;
      const scene = options.scene || (Game.state && Game.state.scene);
      const allowGoalOccupied = options.allowGoalOccupied || false;
      const maxIterations = options.maxIterations || 2000;
      const canEnter =
        options.canEnter ||
        function (x, y) {
          if (!Game.occupancy || typeof Game.occupancy.isFreeForEnemy !== "function") {
            return true;
          }
          return Game.occupancy.isFreeForEnemy(x, y, scene);
        };
      const width = Game.config ? Game.config.gridWidth : 0;
      const height = Game.config ? Game.config.gridHeight : 0;
      const deltas = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      const keyOf = (x, y) => `${x},${y}`;
      const openList = [];
      const cameFrom = new Map();
      const gScore = new Map();
      const fScore = new Map();

      const startKey = keyOf(start.x, start.y);
      const goalKey = keyOf(goal.x, goal.y);
      const heuristic = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

      openList.push({ x: start.x, y: start.y, g: 0, f: heuristic(start.x, start.y) });
      gScore.set(startKey, 0);
      fScore.set(startKey, heuristic(start.x, start.y));

      let iterations = 0;

      while (openList.length > 0 && iterations < maxIterations) {
        iterations += 1;
        let bestIndex = 0;
        for (let i = 1; i < openList.length; i += 1) {
          if (openList[i].f < openList[bestIndex].f) {
            bestIndex = i;
          }
        }
        const current = openList.splice(bestIndex, 1)[0];
        const currentKey = keyOf(current.x, current.y);
        if (currentKey === goalKey) {
          const path = [];
          let traceKey = currentKey;
          while (traceKey) {
            const [tx, ty] = traceKey.split(",").map(Number);
            path.push({ x: tx, y: ty });
            traceKey = cameFrom.get(traceKey) || null;
          }
          return path.reverse();
        }
        if (gScore.get(currentKey) < current.g) {
          continue;
        }
        for (let i = 0; i < deltas.length; i += 1) {
          const nx = current.x + deltas[i].x;
          const ny = current.y + deltas[i].y;
          if (nx < 0 || ny < 0) continue;
          if (width && (nx >= width || ny >= height)) continue;
          const neighborKey = keyOf(nx, ny);
          const isGoal = neighborKey === goalKey;
          if (!isGoal) {
            const passable = canEnter(nx, ny);
            if (!passable) continue;
          } else if (!allowGoalOccupied && !canEnter(nx, ny)) {
            continue;
          }
          const tentativeG = current.g + 1;
          const prevG = gScore.has(neighborKey) ? gScore.get(neighborKey) : Infinity;
          if (tentativeG >= prevG) continue;
          cameFrom.set(neighborKey, currentKey);
          gScore.set(neighborKey, tentativeG);
          const f = tentativeG + heuristic(nx, ny);
          fScore.set(neighborKey, f);
          openList.push({ x: nx, y: ny, g: tentativeG, f });
        }
      }
      return null;
    },
  };

  Game.utils = utils;
})();
