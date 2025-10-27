(function () {
  // ゲーム共通の定数と状態を定義
  window.Game = window.Game || {};

  // ------------------------------------------------------------------
  // 基本設定
  // ------------------------------------------------------------------
  const config = {
    canvasWidth: 800,
    canvasHeight: 600,
    tileSize: 40,
    gridWidth: 24,
    gridHeight: 18,
  };

  const SCENE = {
    FIELD: "FIELD",
    VILLAGE: "VILLAGE",
    CAVE: "CAVE",
  };

  const TILE = {
    GRASS: "GRASS",
    ROAD: "ROAD",
    WATER: "WATER",
    FLOOR_IN: "FLOOR_IN",
    FLOOR_CAVE: "FLOOR_CAVE",
    MOUNTAIN: "MOUNTAIN",
    ROCK: "ROCK",
    TREE: "TREE",
    WALL: "WALL",
    DOOR: "DOOR",
    ENTRANCE_VIL: "ENTRANCE_VIL",
    ENTRANCE_CAVE: "ENTRANCE_CAVE",
    RUINS: "RUINS",
  };

  const TILE_COLOR = {
    [TILE.GRASS]: "#7CCB5B",
    [TILE.ROAD]: "#B57A43",
    [TILE.WATER]: "#2F6DD5",
    [TILE.FLOOR_IN]: "#8B4B4B",
    [TILE.FLOOR_CAVE]: "#444444",
    [TILE.MOUNTAIN]: "#5B4E3A",
    [TILE.ROCK]: "#555555",
    [TILE.TREE]: "#5DA147",
    [TILE.WALL]: "#703737",
    [TILE.DOOR]: "#B57A43",
    [TILE.ENTRANCE_VIL]: "#7CCB5B",
    [TILE.ENTRANCE_CAVE]: "#444444",
    [TILE.RUINS]: "#6B4F4F",
  };

  const TILE_BLOCKED = {
    [TILE.WATER]: true,
    [TILE.MOUNTAIN]: true,
    [TILE.ROCK]: true,
    [TILE.WALL]: true,
    [TILE.RUINS]: true,
  };

  const sceneLabels = {
    [SCENE.FIELD]: "フィールド",
    [SCENE.VILLAGE]: "村",
    [SCENE.CAVE]: "洞窟",
  };

  // ------------------------------------------------------------------
  // アイテム関連
  // ------------------------------------------------------------------
  const ITEM = {
    FOOD10: "FOOD10",
    POTION: "POTION",
    BRONZE_SWORD: "BRONZE_SWORD",
    WOOD_SHIELD: "WOOD_SHIELD",
    ANCIENT_KEY: "ANCIENT_KEY",
  };

  const PRICE = {
    [ITEM.FOOD10]: 10,
    [ITEM.POTION]: 15,
    [ITEM.BRONZE_SWORD]: 40,
    [ITEM.WOOD_SHIELD]: 35,
  };

  const ITEM_META = {
    [ITEM.FOOD10]: { name: "Food×10", detail: "+Food10" },
    [ITEM.POTION]: { name: "Potion", detail: "+20HP" },
    [ITEM.BRONZE_SWORD]: { name: "Bronze Sword", detail: "+2 ATK" },
    [ITEM.WOOD_SHIELD]: { name: "Wood Shield", detail: "+2 DEF" },
    [ITEM.ANCIENT_KEY]: { name: "Ancient Key", detail: "遺跡の鍵" },
  };

  const INVENTORY_MAX = 6;
  const FOOD_CAP = 999;
  const EQUIP_BONUS = {
    weapon: 2,
    shield: 2,
  };

  const OVERLAY = {
    SHOP: "SHOP",
    INVENTORY: "INVENTORY",
    STATUS: "STATUS",
  };

  const LAYER = {
    FLOOR: 0,
    DECOR: 1,
    STATIC: 2,
    NPC: 3,
    ENEMY: 4,
    PLAYER: 5,
  };

  const RESERVED_TILES = new Set([
    TILE.DOOR,
    TILE.ENTRANCE_VIL,
    TILE.ENTRANCE_CAVE,
    TILE.RUINS,
  ]);
  const NO_ENEMY_RADIUS = 1;

  const occupancyMap = new Map();
  const enemyRestricted = new Set();
  let occupancyDirty = true;

  // ------------------------------------------------------------------
  // 敵とレベル情報
  // ------------------------------------------------------------------
  const ENEMY_DATA = {
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
  };

  const LV_THRESH = [10, 30, 60, 100, 160];

  const battleState = {
    active: false,
    enemy: null,
    turn: "PLAYER",
    playerDefending: false,
    returnScene: null,
    returnPos: null,
  };

  // ------------------------------------------------------------------
  // グローバル状態
  // ------------------------------------------------------------------
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
      pos: { x: 12, y: 9 },
    },
    flags: {
      hasKey: false,
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

  function keyOf(x, y) {
    return `${x},${y}`;
  }

  function clearOccupancy() {
    occupancyMap.clear();
    enemyRestricted.clear();
  }

  function occupyCell(x, y, meta = {}) {
    if (x < 0 || y < 0 || x >= config.gridWidth || y >= config.gridHeight) return;
    const key = keyOf(x, y);
    const existing = occupancyMap.get(key) || {
      layer: LAYER.FLOOR,
    };
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
      const reservedEntries = map.entrances || [];
      reservedEntries.forEach((entry) => {
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
    }
    if (state.merchant.scene === state.scene) {
      occupyCell(state.merchant.pos.x, state.merchant.pos.y, {
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
        weapon: false,
        shield: false,
      },
    };
  }

  // ------------------------------------------------------------------
  // 共通ユーティリティ
  // ------------------------------------------------------------------
  function pushMessage(text) {
    state.messages.push(text);
    if (state.messages.length > 3) {
      state.messages.shift();
    }
  }

  function setPlayerPosition(pos) {
    state.playerPos = { x: pos.x, y: pos.y };
    markOccupancyDirty();
  }

  function getCurrentMap() {
    return Game.mapData[state.scene];
  }

  function switchScene(nextScene, spawnKey) {
    const map = Game.mapData[nextScene];
    if (!map) return;
    const spawn =
      (map.spawnPoints && map.spawnPoints[spawnKey]) || map.spawnPoints.default;
    setPlayerPosition(spawn);
    state.scene = nextScene;
    state.walkCounter = 0;
    pushMessage(`${sceneLabels[nextScene]}へ移動した。`);
    if (nextScene === SCENE.FIELD && Game.entities && Game.entities.ensureFieldEnemies) {
      Game.entities.ensureFieldEnemies();
    }
    if (nextScene === SCENE.CAVE && Game.entities && Game.entities.ensureCaveEnemies) {
      Game.entities.ensureCaveEnemies();
    }
    markOccupancyDirty();
  }

  function initializeGame() {
    state.scene = SCENE.FIELD;
    state.walkCounter = 0;
    state.enemyRespawnSteps = 0;
    state.enemyIdSeq = 0;
    state.enemies = [];
    state.player = createDefaultPlayer();
    state.flags.hasKey = false;
    state.flags.starvingNotified = false;
    state.flags.dragonDefeated = false;
    state.messages = [];
    resetUIState();
    resetBattleState();
    const firstMap = Game.mapData[SCENE.FIELD];
    if (firstMap) {
      setPlayerPosition(firstMap.spawnPoints.default);
    }
    pushMessage("島へようこそ。探索を始めよう。");
    markOccupancyDirty();
    if (Game.entities && Game.entities.spawnInitialEnemies) {
      Game.entities.spawnInitialEnemies();
    }
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
    if (occ && occ.npc) {
      return { ok: false, npc: true };
    }
    if (occ && occ.enemy) {
      return { ok: false, enemy: true, enemyRef: occ.enemyRef };
    }
    return { ok: true, warp: occ?.warp, warpData: occ?.warpData, reserved: occ?.reserved };
  }

  function isFreeForEnemy(x, y, scene = state.scene) {
    if (x < 0 || y < 0 || x >= config.gridWidth || y >= config.gridHeight) {
      return false;
    }
    if (enemyRestricted.has(keyOf(x, y))) return false;
    const map = Game.mapData[scene];
    if (!map) return false;
    const tileId = map.tiles[y][x];
    if (Game.utils.isBlocked(tileId)) {
      return false;
    }
    if (RESERVED_TILES.has(tileId)) {
      return false;
    }
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
      Game.switchScene(occ.warpData.targetScene, occ.warpData.targetSpawn);
    }
  }

  // ------------------------------------------------------------------
  // アイテム／ステータス処理
  // ------------------------------------------------------------------
  function isInventoryFull() {
    return state.player.inventory.length >= INVENTORY_MAX;
  }

  function addItem(itemId) {
    if (isInventoryFull()) return false;
    state.player.inventory.push(itemId);
    return true;
  }

  function removeItemByIndex(index) {
    if (index < 0 || index >= state.player.inventory.length) return null;
    const [removed] = state.player.inventory.splice(index, 1);
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
      return { success: false, reason: "GOLD", message: "Goldが足りない。" };
    }
    if (itemId === ITEM.FOOD10) {
      state.player.gold -= price;
      addFood(10);
      return { success: true, itemId, message: "Foodを10補給した。" };
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
      message: `${meta ? meta.name : itemId}を購入した。`,
    };
  }

  function getSellPrice(itemId) {
    const price = PRICE[itemId];
    if (!price) return 0;
    return Math.floor(price / 2);
  }

  function isItemEquipped(itemId) {
    if (itemId === ITEM.BRONZE_SWORD) return !!state.player.equip.weapon;
    if (itemId === ITEM.WOOD_SHIELD) return !!state.player.equip.shield;
    return false;
  }

  function sellItem(index) {
    if (index < 0 || index >= state.player.inventory.length) {
      return {
        success: false,
        reason: "EMPTY",
        message: "売れるアイテムがない。",
      };
    }
    const itemId = state.player.inventory[index];
    if (isItemEquipped(itemId)) {
      return {
        success: false,
        reason: "EQUIPPED",
        message: "装備中のままでは売れない。",
      };
    }
    const price = getSellPrice(itemId);
    if (price === 0) {
      return {
        success: false,
        reason: "VALUE",
        message: "これは売却できない。",
      };
    }
    removeItemByIndex(index);
    state.player.gold += price;
    const meta = ITEM_META[itemId];
    return {
      success: true,
      itemId,
      message: `${meta ? meta.name : itemId}を売却し${price}Gを得た。`,
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
      case ITEM.POTION:
        if (state.player.hp >= state.player.maxHp) {
          return {
            success: false,
            reason: "HP_FULL",
            message: "HPは既に最大だ。",
            consumed: false,
          };
        }
        const before = state.player.hp;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20);
        removeItemByIndex(index);
        return {
          success: true,
          itemId,
          message: `PotionでHPを${state.player.hp - before}回復した。`,
          consumed: true,
        };
      case ITEM.BRONZE_SWORD: {
        state.player.equip.weapon = !state.player.equip.weapon;
        const status = state.player.equip.weapon ? "装備した" : "外した";
        return {
          success: true,
          itemId,
          message: `Bronze Swordを${status}。`,
          consumed: false,
        };
      }
      case ITEM.WOOD_SHIELD: {
        state.player.equip.shield = !state.player.equip.shield;
        const status = state.player.equip.shield ? "装備した" : "外した";
        return {
          success: true,
          itemId,
          message: `Wood Shieldを${status}。`,
          consumed: false,
        };
      }
      case ITEM.ANCIENT_KEY:
        return {
          success: false,
          reason: "LOCKED",
          message: "まだ使い道が分からない。",
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
    const atkBonus = state.player.equip.weapon ? EQUIP_BONUS.weapon : 0;
    const defBonus = state.player.equip.shield ? EQUIP_BONUS.shield : 0;
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
      pushMessage(`レベル${state.player.lv}に上がった！`);
    }
    return leveled;
  }

  function resetPlayerToSafePoint() {
    const map = Game.mapData[SCENE.FIELD];
    if (map && map.spawnPoints && map.spawnPoints.default) {
      setPlayerPosition(map.spawnPoints.default);
    } else {
      setPlayerPosition({ x: 2, y: 2 });
    }
    state.scene = SCENE.FIELD;
    state.player.hp = state.player.maxHp;
    pushMessage("安全な場所で目を覚ました。");
    if (Game.entities && Game.entities.ensureFieldEnemies) {
      Game.entities.ensureFieldEnemies();
    }
  }

  function nextEnemyInstanceId() {
    state.enemyIdSeq += 1;
    return `enemy-${state.enemyIdSeq}`;
  }

  // ------------------------------------------------------------------
  // 公開
  // ------------------------------------------------------------------
  Game.config = config;
  Game.SCENE = SCENE;
  Game.TILE = TILE;
  Game.TILE_COLOR = TILE_COLOR;
  Game.TILE_BLOCKED = TILE_BLOCKED;
  Game.sceneLabels = sceneLabels;
  Game.state = state;
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
