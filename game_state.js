 (function () {
   // ゲーム全体の定数と状態を管理
   const Game = (window.Game = window.Game || {});

   const config = Object.freeze({
     canvasWidth: 800,
     canvasHeight: 600,
     tileSize: 40,
     gridWidth: 24,
     gridHeight: 18,
   });

   const SCENE = Object.freeze({
     FIELD: "FIELD",
     VILLAGE: "VILLAGE",
     CAVE: "CAVE",
   });

   const TILE = Object.freeze({
     GRASS: "GRASS",
     ROAD: "ROAD",
     WATER: "WATER",
     FLOOR_CAVE: "FLOOR_CAVE",
     FLOOR_SHOP: "FLOOR_SHOP",
     MOUNTAIN: "MOUNTAIN",
     ROCK: "ROCK",
     TREE: "TREE",
     WALL: "WALL",
     DOOR: "DOOR",
     ENTRANCE_VIL: "ENTRANCE_VIL",
     ENTRANCE_CAVE: "ENTRANCE_CAVE",
     STAIRS_UP: "STAIRS_UP",
     STAIRS_DOWN: "STAIRS_DOWN",
     RUINS: "RUINS",
   });

   const TILE_COLOR = Object.freeze({
     [TILE.GRASS]: "#7CCB5B",
     [TILE.ROAD]: "#B57A43",
     [TILE.WATER]: "#2F6DD5",
     [TILE.FLOOR_CAVE]: "#444444",
     [TILE.FLOOR_SHOP]: "#5A3A2A",
     [TILE.MOUNTAIN]: "#5B4E3A",
     [TILE.ROCK]: "#555555",
     [TILE.TREE]: "#5DA147",
     [TILE.WALL]: "#703737",
     [TILE.DOOR]: "#B57A43",
     [TILE.ENTRANCE_VIL]: "#7CCB5B",
     [TILE.ENTRANCE_CAVE]: "#444444",
     [TILE.STAIRS_UP]: "#444444",
     [TILE.STAIRS_DOWN]: "#444444",
     [TILE.RUINS]: "#6B4F4F",
   });

   const TILE_BLOCKED = Object.freeze({
     [TILE.WATER]: true,
     [TILE.MOUNTAIN]: true,
     [TILE.ROCK]: true,
     [TILE.WALL]: true,
   });

   const sceneLabels = Object.freeze({
     [SCENE.FIELD]: "フィールド",
     [SCENE.VILLAGE]: "村",
     [SCENE.CAVE]: "洞窟",
   });

   const ITEM = Object.freeze({
     FOOD10: "FOOD10",
     POTION: "POTION",
     BRONZE_SWORD: "BRONZE_SWORD",
     WOOD_SHIELD: "WOOD_SHIELD",
     ANCIENT_KEY: "ANCIENT_KEY",
   });

   const PRICE = Object.freeze({
     [ITEM.FOOD10]: 10,
     [ITEM.POTION]: 15,
     [ITEM.BRONZE_SWORD]: 40,
     [ITEM.WOOD_SHIELD]: 35,
   });

   const ITEM_META = Object.freeze({
     [ITEM.FOOD10]: { name: "Food 10", detail: "Food を 10 回復" },
     [ITEM.POTION]: { name: "Potion", detail: "HP を 20 回復" },
     [ITEM.BRONZE_SWORD]: { name: "Bronze Sword", detail: "ATK +2" },
     [ITEM.WOOD_SHIELD]: { name: "Wood Shield", detail: "DEF +2" },
     [ITEM.ANCIENT_KEY]: { name: "Ancient Key", detail: "遺跡の鍵" },
   });

   const INVENTORY_MAX = 6;
   const FOOD_CAP = 999;

   const EQUIP_BONUS = Object.freeze({
     weapon: 2,
     shield: 2,
   });

   const OVERLAY = Object.freeze({
     SHOP: "SHOP",
     INVENTORY: "INVENTORY",
     STATUS: "STATUS",
     INN: "INN",
   });

   const LAYER = Object.freeze({
     FLOOR: 0,
     DECOR: 1,
     STATIC: 2,
     NPC: 3,
     ENEMY: 4,
     PLAYER: 5,
   });

   const RESERVED_TILES = new Set([
     TILE.DOOR,
     TILE.ENTRANCE_VIL,
     TILE.ENTRANCE_CAVE,
     TILE.STAIRS_UP,
     TILE.STAIRS_DOWN,
     TILE.RUINS,
   ]);

   const NO_ENEMY_RADIUS = 1;
   const MAX_MESSAGES = 7;

   const ENEMY_DATA = Object.freeze({
     SLIME: {
       emoji: "🫠",
       hp: [8, 12],
       atk: [2, 3],
       def: [0, 0],
       exp: [3, 5],
       gold: [4, 8],
     },
     BAT: {
       emoji: "🦇",
       hp: [14, 18],
       atk: [3, 4],
       def: [0, 1],
       exp: [6, 8],
       gold: [8, 12],
     },
     SPIDER: {
       emoji: "🕷",
       hp: [20, 26],
       atk: [4, 6],
       def: [1, 2],
       exp: [9, 12],
       gold: [12, 16],
     },
     GHOST: {
       emoji: "👻",
       hp: [28, 34],
       atk: [6, 7],
       def: [2, 3],
       exp: [12, 16],
       gold: [16, 20],
     },
     VAMPIRE: {
       emoji: "🧛‍♂️",
       hp: [36, 44],
       atk: [7, 9],
       def: [3, 4],
       exp: [18, 24],
       gold: [22, 28],
     },
     TROLL: {
       emoji: "🧌",
       hp: [48, 58],
       atk: [9, 11],
       def: [4, 5],
       exp: [24, 32],
       gold: [28, 36],
     },
     DRAGON: {
       emoji: "🐉",
       hp: [60, 80],
       atk: [9, 11],
       def: [4, 5],
       exp: [30, 40],
       gold: [35, 50],
     },
   });

   const LV_THRESH = Object.freeze([10, 30, 60, 100, 160]);

   const progressFlags = {
     hasKey: false,
     openedChests: new Set(),
     cleared: false,
   };

   const battleState = {
     active: false,
     enemy: null,
     turn: "PLAYER",
     playerDefending: false,
     returnScene: null,
     returnPos: null,
   };

   const state = {
     scene: SCENE.FIELD,
     playerPos: { x: 0, y: 0 },
     walkCounter: 0,
     enemyRespawnSteps: 0,
     enemyIdSeq: 0,
     enemies: [],
     messages: [],
     player: createDefaultPlayer(),
     merchant: {
       scene: SCENE.VILLAGE,
       pos: { x: 13, y: 3 },
     },
     innkeeper: {
       scene: SCENE.VILLAGE,
       pos: { x: 9, y: 3 },
     },
     flags: {
       starvingNotified: false,
       dragonDefeated: false,
     },
     battle: battleState,
   };

   const uiState = {
     overlay: null,
     shop: {
       mode: "BUY",
       selection: 0,
     },
     inventory: {
       selection: 0,
     },
   };

   const occupancyMap = new Map();
   const enemyRestricted = new Set();
   let occupancyDirty = true;

   function keyOf(x, y) {
     return `${x},${y}`;
   }

   function createDefaultPlayer() {
     return {
       hp: 30,
       maxHp: 30,
       atk: 5,
       def: 3,
       lv: 1,
       exp: 0,
       food: 50,
       gold: 50,
       inventory: [],
       equip: {
         weapon: null,
         shield: null,
       },
     };
   }

   function resetProgressFlags() {
     progressFlags.hasKey = false;
     progressFlags.cleared = false;
     progressFlags.openedChests.clear();
   }

   function makePosKey(scene, x, y) {
     if (Game.utils && typeof Game.utils.makePosKey === "function") {
       return Game.utils.makePosKey(scene, x, y);
     }
     return `${scene}:${x},${y}`;
   }

   function hasOpenedChest(scene, x, y) {
     return progressFlags.openedChests.has(makePosKey(scene, x, y));
   }

   function markChestOpened(scene, x, y) {
     progressFlags.openedChests.add(makePosKey(scene, x, y));
   }

   function clearOccupancy() {
     occupancyMap.clear();
     enemyRestricted.clear();
   }

   function occupyCell(x, y, meta = {}) {
     if (x < 0 || y < 0 || x >= config.gridWidth || y >= config.gridHeight) return;
     const key = keyOf(x, y);
     const existing = occupancyMap.get(key) || { layer: LAYER.FLOOR };
     if (!occupancyMap.has(key)) {
       occupancyMap.set(key, existing);
     }
     if (meta.layer != null && meta.layer >= existing.layer) {
       existing.layer = meta.layer;
     }
     existing.reserved = existing.reserved || !!meta.reserved;
     existing.warp = existing.warp || !!meta.warp;
     if (meta.warpData) existing.warpData = meta.warpData;
     existing.npc = existing.npc || !!meta.npc;
     existing.enemy = existing.enemy || !!meta.enemy;
     existing.chest = existing.chest || !!meta.chest;
     existing.ruins = existing.ruins || !!meta.ruins;
     if (meta.enemyRef) existing.enemyRef = meta.enemyRef;
     existing.player = existing.player || !!meta.player;
     existing.tileId = meta.tileId || existing.tileId;
   }

   function markEnemyRestrictedArea(x, y, radius = NO_ENEMY_RADIUS) {
     for (let dy = -radius; dy <= radius; dy += 1) {
       for (let dx = -radius; dx <= radius; dx += 1) {
         const nx = x + dx;
         const ny = y + dy;
         if (nx < 0 || ny < 0 || nx >= config.gridWidth || ny >= config.gridHeight) continue;
         enemyRestricted.add(keyOf(nx, ny));
       }
     }
   }

   function getOccupancy(x, y) {
     return occupancyMap.get(keyOf(x, y)) || null;
   }

   function rebuildOccupancy() {
     clearOccupancy();
     const map = getCurrentMap();
     if (map) {
       for (let y = 0; y < config.gridHeight; y += 1) {
         for (let x = 0; x < config.gridWidth; x += 1) {
           const tileId = map.tiles[y][x];
           const reserved = RESERVED_TILES.has(tileId);
           occupyCell(x, y, { layer: LAYER.FLOOR, tileId, reserved });
           if (reserved) {
             markEnemyRestrictedArea(x, y);
           }
         }
       }

       const entrances = map.entrances || [];
       entrances.forEach((entry) => {
         occupyCell(entry.position.x, entry.position.y, {
           layer: LAYER.STATIC,
           reserved: true,
           warp: true,
           warpData: entry,
         });
         markEnemyRestrictedArea(entry.position.x, entry.position.y);
       });

       if (map.reservedTiles) {
         map.reservedTiles.forEach((pos) => {
           occupyCell(pos.x, pos.y, { layer: LAYER.STATIC, reserved: true });
           markEnemyRestrictedArea(pos.x, pos.y);
         });
       }

       const events = Game.EVENTS ? Game.EVENTS[state.scene] : null;
       if (events) {
         if (Array.isArray(events.chests)) {
           events.chests.forEach((pos) => {
             if (hasOpenedChest(state.scene, pos.x, pos.y)) return;
             occupyCell(pos.x, pos.y, {
               layer: LAYER.STATIC,
               reserved: true,
               chest: true,
             });
             markEnemyRestrictedArea(pos.x, pos.y);
           });
         }
         if (events.ruins) {
           const pos = events.ruins;
           occupyCell(pos.x, pos.y, {
             layer: LAYER.STATIC,
             reserved: true,
             ruins: true,
             warp: true,
           });
           markEnemyRestrictedArea(pos.x, pos.y);
         }
       }
     }

     if (state.merchant.scene === state.scene) {
       occupyCell(state.merchant.pos.x, state.merchant.pos.y, {
         layer: LAYER.NPC,
         npc: true,
       });
     }

     if (state.innkeeper.scene === state.scene) {
       occupyCell(state.innkeeper.pos.x, state.innkeeper.pos.y, {
         layer: LAYER.NPC,
         npc: true,
       });
     }

     state.enemies
       .filter((enemy) => enemy.scene === state.scene)
       .forEach((enemy) => {
         occupyCell(enemy.pos.x, enemy.pos.y, {
           layer: LAYER.ENEMY,
           enemy: true,
           enemyRef: enemy,
         });
       });

     occupyCell(state.playerPos.x, state.playerPos.y, {
       layer: LAYER.PLAYER,
       player: true,
     });

     occupancyDirty = false;
   }

   function ensureOccupancy() {
     if (occupancyDirty) {
       rebuildOccupancy();
     }
   }

   function markOccupancyDirty() {
     occupancyDirty = true;
   }

   function pushMessage(text) {
     state.messages.push(text);
     if (state.messages.length > MAX_MESSAGES) {
       state.messages.shift();
     }
   }

   function setPlayerPosition(pos) {
     state.playerPos = { x: pos.x, y: pos.y };
     markOccupancyDirty();
   }

   function getCurrentMap() {
     return Game.mapData ? Game.mapData[state.scene] : null;
   }

   function ensureSceneEnemies(scene) {
     if (!Game.entities) return;
     if (scene === SCENE.FIELD && typeof Game.entities.ensureFieldEnemies === "function") {
       Game.entities.ensureFieldEnemies();
     }
     if (scene === SCENE.CAVE && typeof Game.entities.ensureCaveEnemies === "function") {
       Game.entities.ensureCaveEnemies();
     }
   }

   function switchScene(nextScene, spawnKey) {
     const map = Game.mapData ? Game.mapData[nextScene] : null;
     if (!map) return;
     const spawn = (map.spawnPoints && map.spawnPoints[spawnKey]) || map.spawnPoints.default;
     setPlayerPosition(spawn);
     state.scene = nextScene;
     state.walkCounter = 0;
     pushMessage(`${sceneLabels[nextScene]}へ移動した。`);
     ensureSceneEnemies(nextScene);
     markOccupancyDirty();
     ensureOccupancy();
   }

   function initializeGame() {
     resetForNewGame();
   }

   function resetForNewGame() {
     resetProgressFlags();
     state.scene = SCENE.FIELD;
     state.walkCounter = 0;
     state.enemyRespawnSteps = 0;
     state.enemyIdSeq = 0;
     state.enemies = [];
     state.player = createDefaultPlayer();
     state.flags.starvingNotified = false;
     state.flags.dragonDefeated = false;
     state.messages = [];
     resetBattleState();
     resetUIState();
     const firstMap = Game.mapData ? Game.mapData[SCENE.FIELD] : null;
     if (firstMap && firstMap.spawnPoints) {
       setPlayerPosition(firstMap.spawnPoints.default);
     } else {
       setPlayerPosition({ x: 0, y: 0 });
     }
     pushMessage("島へようこそ。探索を始めよう。");
     markOccupancyDirty();
     if (Game.entities && typeof Game.entities.spawnInitialEnemies === "function") {
       Game.entities.spawnInitialEnemies();
     } else {
       ensureSceneEnemies(state.scene);
     }
     ensureOccupancy();
   }

   function resetBattleState() {
     battleState.active = false;
     battleState.enemy = null;
     battleState.turn = "PLAYER";
     battleState.playerDefending = false;
     battleState.returnScene = null;
     battleState.returnPos = null;
   }

   function resetUIState() {
     uiState.overlay = null;
     resetShopState();
     resetInventoryState();
   }

   function resetShopState() {
     uiState.shop.mode = "BUY";
     uiState.shop.selection = 0;
   }

   function resetInventoryState() {
     uiState.inventory.selection = 0;
   }

   function openOverlay(type) {
     uiState.overlay = type;
     if (type === OVERLAY.SHOP) {
       resetShopState();
     }
     if (type === OVERLAY.INVENTORY) {
       resetInventoryState();
     }
   }

   function closeOverlay() {
     uiState.overlay = null;
   }

   function isOverlayOpen() {
     return !!uiState.overlay;
   }

   function isInsideGrid(pos) {
     return (
       pos.x >= 0 &&
       pos.y >= 0 &&
       pos.x < config.gridWidth &&
       pos.y < config.gridHeight
     );
   }

   function isFreeForPlayer(x, y) {
     ensureOccupancy();
     if (x < 0 || y < 0 || x >= config.gridWidth || y >= config.gridHeight) {
       return { ok: false };
     }
     const map = getCurrentMap();
     if (!map) {
       return { ok: false };
     }
     const tileId = map.tiles[y][x];
     if (Game.utils.isBlocked(tileId)) {
       return { ok: false };
     }
     const occ = getOccupancy(x, y);
    if (occ) {
      if (occ.npc) {
        return { ok: false, npc: true };
      }
      if (occ.enemy) {
        return { ok: false, enemy: true, enemyRef: occ.enemyRef };
      }
      if (occ.chest || occ.ruins) {
        return {
          ok: true,
          chest: occ.chest,
          ruins: occ.ruins,
          warp: occ.warp,
          warpData: occ.warpData,
        };
      }
      if (occ.reserved || occ.player) {
        return {
          ok: false,
          reserved: occ.reserved,
          warp: occ.warp,
          warpData: occ.warpData,
        };
      }
      return {
        ok: true,
        warp: occ.warp,
        warpData: occ.warpData,
      };
    }
    return { ok: true };
   }

   function isFreeForEnemy(x, y, scene = state.scene) {
     if (x < 0 || y < 0 || x >= config.gridWidth || y >= config.gridHeight) {
       return false;
     }
     if (enemyRestricted.has(keyOf(x, y))) return false;
     const map = Game.mapData ? Game.mapData[scene] : null;
     if (!map) return false;
     const tileId = map.tiles[y][x];
     if (Game.utils.isBlocked(tileId)) return false;
     if (RESERVED_TILES.has(tileId)) return false;
     const hasEnemy = state.enemies.some(
       (enemy) => enemy.scene === scene && enemy.pos.x === x && enemy.pos.y === y
     );
     if (hasEnemy) return false;
     if (scene === state.scene) {
       ensureOccupancy();
       const occ = getOccupancy(x, y);
       if (occ && (occ.npc || occ.player || occ.enemy || occ.reserved)) {
         return false;
       }
     }
     if (state.merchant.scene === scene && state.merchant.pos.x === x && state.merchant.pos.y === y) {
       return false;
     }
     if (state.innkeeper.scene === scene && state.innkeeper.pos.x === x && state.innkeeper.pos.y === y) {
       return false;
     }
     if (scene === state.scene && state.playerPos.x === x && state.playerPos.y === y) {
       return false;
     }
     return true;
   }

   function resolveTileEvent(x, y) {
     ensureOccupancy();
     const occ = getOccupancy(x, y);
     if (!occ) return;
     if (occ.enemy && occ.enemyRef) {
       Game.combat.startBattle(occ.enemyRef);
       return;
     }
     if (occ.warp && occ.warpData) {
       switchScene(occ.warpData.targetScene, occ.warpData.targetSpawn);
       return;
     }
     if (occ.chest) {
       handleChestEvent(state.scene, x, y);
       return;
     }
     if (occ.ruins) {
       handleRuinsEvent(state.scene, x, y);
     }
   }

   function handleChestEvent(scene, x, y) {
     if (hasOpenedChest(scene, x, y)) {
       pushMessage("すでに開けた宝箱だ。");
       return;
     }
     markChestOpened(scene, x, y);
     progressFlags.hasKey = true;
     pushMessage("宝箱を開けた。Ancient Key を手に入れた。");
     markOccupancyDirty();
     ensureOccupancy();
   }

   function handleRuinsEvent(scene, x, y) {
     if (progressFlags.cleared) {
       pushMessage("扉はすでに開いている。");
       return;
     }
     if (!progressFlags.hasKey) {
       pushMessage("重い扉だ…鍵が必要だ。");
       return;
     }
     progressFlags.cleared = true;
     pushMessage("扉が開いた！");
     closeOverlay();
     resetBattleState();
   }

   function isInventoryFull() {
     return state.player.inventory.length >= INVENTORY_MAX;
   }

   function addItem(itemId) {
     if (isInventoryFull()) return false;
     state.player.inventory.push(itemId);
     return true;
   }

   function adjustEquipIndex(equipIndex, removedIndex) {
     if (equipIndex === null) return null;
     if (equipIndex === removedIndex) return null;
     if (equipIndex > removedIndex) return equipIndex - 1;
     return equipIndex;
   }

   function removeItemByIndex(index) {
     if (index < 0 || index >= state.player.inventory.length) return null;
     const [removed] = state.player.inventory.splice(index, 1);
     state.player.equip.weapon = adjustEquipIndex(state.player.equip.weapon, index);
     state.player.equip.shield = adjustEquipIndex(state.player.equip.shield, index);
     return removed || null;
   }

   function describeItem(itemId) {
     const meta = ITEM_META[itemId];
     if (!meta) return "詳細情報は未登録。";
     return `${meta.name} : ${meta.detail}`;
   }

   function addFood(amount) {
     const next = Game.utils.clamp(state.player.food + amount, 0, FOOD_CAP);
     state.player.food = next;
   }

   function canBuy(itemId) {
     const price = PRICE[itemId];
     if (price == null) return false;
     if (state.player.gold < price) return false;
     if (itemId === ITEM.FOOD10) return true;
     return !isInventoryFull();
   }

   function buyItem(itemId) {
     const price = PRICE[itemId];
     if (price == null) {
       return {
         success: false,
         reason: "UNAVAILABLE",
         message: "その商品はまだ扱っていない。",
       };
     }
     if (state.player.gold < price) {
       return { success: false, reason: "GOLD", message: "Gold が足りない。" };
     }
     if (itemId === ITEM.FOOD10) {
       state.player.gold -= price;
       addFood(10);
       return { success: true, itemId, message: "Food を 10 補給した。" };
     }
     if (isInventoryFull()) {
       return { success: false, reason: "FULL", message: "インベントリが一杯だ。" };
     }
     addItem(itemId);
     state.player.gold -= price;
     const meta = ITEM_META[itemId];
     return {
       success: true,
       itemId,
       message: `${meta ? meta.name : itemId} を購入した。`,
     };
   }

   function getSellPrice(itemId) {
     const price = PRICE[itemId];
     if (!price) return 0;
     return Math.floor(price / 2);
   }

   function isItemEquipped(index) {
     return state.player.equip.weapon === index || state.player.equip.shield === index;
   }

   function sellItem(index) {
     if (index < 0 || index >= state.player.inventory.length) {
       return {
         success: false,
         reason: "EMPTY",
         message: "売れるアイテムがない。",
       };
     }
     if (isItemEquipped(index)) {
       return {
         success: false,
         reason: "EQUIPPED",
         message: "装備中のままでは売れない。",
       };
     }
     const itemId = state.player.inventory[index];
     const price = getSellPrice(itemId);
     if (price === 0) {
       return {
         success: false,
         reason: "VALUE",
         message: "このアイテムは売却できない。",
       };
     }
     removeItemByIndex(index);
     state.player.gold += price;
     const meta = ITEM_META[itemId];
     return {
       success: true,
       itemId,
       message: `${meta ? meta.name : itemId} を売却し ${price}G を得た。`,
     };
   }

   function useItemByIndex(index) {
     if (index < 0 || index >= state.player.inventory.length) {
       return {
         success: false,
         reason: "EMPTY",
         message: "アイテムが選択されていない。",
         consumed: false,
       };
     }
     const itemId = state.player.inventory[index];
     switch (itemId) {
       case ITEM.POTION: {
         if (state.player.hp >= state.player.maxHp) {
           return {
             success: false,
             reason: "HP_FULL",
             message: "HP は既に最大だ。",
             consumed: false,
           };
         }
         const before = state.player.hp;
         state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20);
         removeItemByIndex(index);
         return {
           success: true,
           itemId,
           message: `Potion で HP が ${state.player.hp - before} 回復した。`,
           consumed: true,
         };
       }
       case ITEM.BRONZE_SWORD: {
         if (state.player.equip.weapon === index) {
           state.player.equip.weapon = null;
           return {
             success: true,
             itemId,
             message: "Bronze Sword を外した。",
             consumed: false,
           };
         }
         if (state.player.equip.weapon !== null) {
           return {
             success: false,
             reason: "SLOT_OCCUPIED",
             message: "既に武器を装備している。先に外してください。",
             consumed: false,
           };
         }
         state.player.equip.weapon = index;
         return {
           success: true,
           itemId,
           message: "Bronze Sword を装備した。",
           consumed: false,
         };
       }
       case ITEM.WOOD_SHIELD: {
         if (state.player.equip.shield === index) {
           state.player.equip.shield = null;
           return {
             success: true,
             itemId,
             message: "Wood Shield を外した。",
             consumed: false,
           };
         }
         if (state.player.equip.shield !== null) {
           return {
             success: false,
             reason: "SLOT_OCCUPIED",
             message: "既に防具を装備している。先に外してください。",
             consumed: false,
           };
         }
         state.player.equip.shield = index;
         return {
           success: true,
           itemId,
           message: "Wood Shield を装備した。",
           consumed: false,
         };
       }
       case ITEM.ANCIENT_KEY:
         return {
           success: false,
           reason: "LOCKED",
           message: "まだ使い道がわからない。",
           consumed: false,
         };
       default:
         return {
           success: false,
           reason: "UNKNOWN",
           message: "そのアイテムは使えない。",
           consumed: false,
         };
     }
   }

   function getPlayerEffectiveStats() {
     let atkBonus = 0;
     let defBonus = 0;

     if (state.player.equip.weapon !== null && state.player.equip.weapon < state.player.inventory.length) {
       const weaponItem = state.player.inventory[state.player.equip.weapon];
       if (weaponItem === ITEM.BRONZE_SWORD) {
         atkBonus = EQUIP_BONUS.weapon;
       }
     }

     if (state.player.equip.shield !== null && state.player.equip.shield < state.player.inventory.length) {
       const shieldItem = state.player.inventory[state.player.equip.shield];
       if (shieldItem === ITEM.WOOD_SHIELD) {
         defBonus = EQUIP_BONUS.shield;
       }
     }

     return {
       atk: state.player.atk + atkBonus,
       def: state.player.def + defBonus,
     };
   }

   function grantExp(amount) {
     state.player.exp += amount;
     let leveled = false;
     while (true) {
       const target = LV_THRESH[state.player.lv - 1];
       if (target == null) break;
       if (state.player.exp < target) break;
       state.player.lv += 1;
       state.player.maxHp += 5;
       state.player.atk += 1;
       state.player.def += 1;
       state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5);
       leveled = true;
       pushMessage(`レベル ${state.player.lv} に上がった！`);
     }
     return leveled;
   }

   function resetPlayerToSafePoint() {
     const map = Game.mapData ? Game.mapData[SCENE.FIELD] : null;
     if (map && map.spawnPoints && map.spawnPoints.default) {
       setPlayerPosition(map.spawnPoints.default);
     } else {
       setPlayerPosition({ x: 2, y: 2 });
     }
     state.scene = SCENE.FIELD;
     state.player.hp = state.player.maxHp;
     pushMessage("安全な場所で目を覚ました。");
     ensureSceneEnemies(state.scene);
     markOccupancyDirty();
     ensureOccupancy();
   }

   function nextEnemyInstanceId() {
     state.enemyIdSeq += 1;
     return `enemy-${state.enemyIdSeq}`;
   }

   Game.config = config;
   Game.SCENE = SCENE;
   Game.TILE = TILE;
   Game.TILE_COLOR = TILE_COLOR;
   Game.TILE_BLOCKED = TILE_BLOCKED;
   Game.sceneLabels = sceneLabels;
   Game.state = state;
   Game.flags = progressFlags;
   Game.pushMessage = pushMessage;
   Game.setPlayerPosition = setPlayerPosition;
   Game.getCurrentMap = getCurrentMap;
   Game.switchScene = switchScene;
   Game.initializeGame = initializeGame;
   Game.ITEM = ITEM;
   Game.PRICE = PRICE;
   Game.ITEM_META = ITEM_META;
   Game.INVENTORY_MAX = INVENTORY_MAX;
   Game.LAYER = LAYER;
   Game.RESERVED_TILES = RESERVED_TILES;
   Game.NO_ENEMY_RADIUS = NO_ENEMY_RADIUS;
   Game.addItem = addItem;
   Game.removeItemByIndex = removeItemByIndex;
   Game.describeItem = describeItem;
   Game.addFood = addFood;
   Game.canBuy = canBuy;
   Game.buyItem = buyItem;
   Game.sellItem = sellItem;
   Game.useItemByIndex = useItemByIndex;
   Game.getPlayerEffectiveStats = getPlayerEffectiveStats;
   Game.isItemEquipped = isItemEquipped;
   Game.grantExp = grantExp;
   Game.resetPlayerToSafePoint = resetPlayerToSafePoint;
   Game.resetForNewGame = resetForNewGame;
   Game.makePosKey = makePosKey;
   Game.hasOpened = hasOpenedChest;
   Game.markOpened = markChestOpened;
   Game.nextEnemyInstanceId = nextEnemyInstanceId;
   Game.ENEMY_DATA = ENEMY_DATA;
   Game.LV_THRESH = LV_THRESH;
   Game.battle = battleState;
   Game.ui = {
     state: uiState,
     OVERLAY,
     open: openOverlay,
     close: closeOverlay,
     isOpen: isOverlayOpen,
     resetShop: resetShopState,
     resetInventory: resetInventoryState,
   };
   Game.occupancy = {
     clear: clearOccupancy,
     occupy: occupyCell,
     rebuild: rebuildOccupancy,
     ensure: ensureOccupancy,
     markDirty: markOccupancyDirty,
     get: getOccupancy,
     markEnemyRestrictedArea,
     isFreeForPlayer,
     isFreeForEnemy,
     resolveTileEvent,
   };
 })();
