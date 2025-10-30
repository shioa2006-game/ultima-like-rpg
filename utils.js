 (function () {
   // 共通ユーティリティを定義
   const Game = (window.Game = window.Game || {});

   const directions4 = Object.freeze([
     { x: 1, y: 0 },
     { x: -1, y: 0 },
     { x: 0, y: 1 },
     { x: 0, y: -1 },
   ]);

   function clamp(value, min, max) {
     return Math.min(Math.max(value, min), max);
   }

   function posEq(a, b) {
     return !!a && !!b && a.x === b.x && a.y === b.y;
   }

   function isBlocked(tileId) {
     const blocked = Game.TILE_BLOCKED || {};
     return !!blocked[tileId];
   }

   function isAdjacent(a, b) {
     if (!a || !b) return false;
     return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
   }

   function distance(a, b) {
     if (!a || !b) return Infinity;
     return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
   }

   function randInt(min, max) {
     const lower = Math.ceil(min);
     const upper = Math.floor(max);
     return Math.floor(Math.random() * (upper - lower + 1)) + lower;
   }

   function choice(list) {
     if (!Array.isArray(list) || list.length === 0) return null;
     const index = randInt(0, list.length - 1);
     return list[index];
   }

   function makePosKey(scene, x, y) {
     return `${scene}:${x},${y}`;
   }

   function defaultEnemyPassCheck(scene) {
     if (!Game.occupancy || typeof Game.occupancy.isFreeForEnemy !== "function") {
       return () => true;
     }
     return (x, y) => Game.occupancy.isFreeForEnemy(x, y, scene);
   }

   function findPath(start, goal, options = {}) {
     if (!start || !goal) return null;

     const scene = options.scene ?? (Game.state && Game.state.scene);
     const allowGoalOccupied = options.allowGoalOccupied ?? false;
     const maxIterations = options.maxIterations ?? 1500;
     const canEnter =
       options.canEnter ??
       defaultEnemyPassCheck(scene);

     const width = Game.config ? Game.config.gridWidth : 0;
     const height = Game.config ? Game.config.gridHeight : 0;

     const keyOf = (x, y) => `${x},${y}`;
     const heuristic = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

     const openList = [];
     const cameFrom = new Map();
     const gScore = new Map();
     const fScore = new Map();

     const startKey = keyOf(start.x, start.y);
     const goalKey = keyOf(goal.x, goal.y);

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

       if (current.g > (gScore.get(currentKey) ?? Infinity)) {
         continue;
       }

       for (let i = 0; i < directions4.length; i += 1) {
         const delta = directions4[i];
         const nextX = current.x + delta.x;
         const nextY = current.y + delta.y;

         if (nextX < 0 || nextY < 0) continue;
         if (width && (nextX >= width || nextY >= height)) continue;

         const neighborKey = keyOf(nextX, nextY);
         const reachingGoal = neighborKey === goalKey;

         if (!reachingGoal) {
           if (!canEnter(nextX, nextY)) continue;
         } else if (!allowGoalOccupied && !canEnter(nextX, nextY)) {
           continue;
         }

         const tentativeG = current.g + 1;
         if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) continue;

         cameFrom.set(neighborKey, currentKey);
         gScore.set(neighborKey, tentativeG);
         const score = tentativeG + heuristic(nextX, nextY);
         fScore.set(neighborKey, score);
         openList.push({ x: nextX, y: nextY, g: tentativeG, f: score });
       }
     }

     return null;
   }

   Game.utils = {
     clamp,
     posEq,
     isBlocked,
     isAdjacent,
     distance,
     randInt,
     choice,
     makePosKey,
     directions4,
     findPath,
   };
 })();

