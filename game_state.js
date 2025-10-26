(function () {
  // ゲーム全体の定数と状態を定義
  window.Game = window.Game || {};

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

  const state = {
    scene: SCENE.FIELD,
    playerPos: { x: 0, y: 0 },
    walkCounter: 0,
    messages: [],
    player: createDefaultPlayer(),
    merchant: {
      scene: SCENE.VILLAGE,
      pos: { x: 12, y: 9 },
    },
    flags: {
      hasKey: false,
      starvingNotified: false,
    },
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

  function pushMessage(text) {
    state.messages.push(text);
    if (state.messages.length > 3) {
      state.messages.shift();
    }
  }

  function setPlayerPosition(pos) {
    state.playerPos = { x: pos.x, y: pos.y };
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
  }

  function initializeGame() {
    state.scene = SCENE.FIELD;
    state.walkCounter = 0;
    state.player = createDefaultPlayer();
    state.flags.hasKey = false;
    state.flags.starvingNotified = false;
    state.messages = [];
    resetUIState();
    const firstMap = Game.mapData[SCENE.FIELD];
    if (firstMap) {
      setPlayerPosition(firstMap.spawnPoints.default);
    }
    pushMessage("島へようこそ。探索を始めよう。");
  }

  function isInventoryFull() {
    return state.player.inventory.length >= INVENTORY_MAX;
  }

  function addItem(itemId) {
    if (isInventoryFull()) {
      return false;
    }
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
      return { success: false, reason: "UNAVAILABLE", message: "その商品はまだ扱っていない。" };
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
      return { success: false, reason: "EMPTY", message: "売れるアイテムがない。" };
    }
    const itemId = state.player.inventory[index];
    if (isItemEquipped(itemId)) {
      return { success: false, reason: "EQUIPPED", message: "装備中のままでは売れない。" };
    }
    const price = getSellPrice(itemId);
    if (price === 0) {
      return { success: false, reason: "VALUE", message: "これは売却できない。" };
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
  Game.ui = {
    state: uiState,
    OVERLAY,
    open: openOverlay,
    close: closeOverlay,
    isOpen: isOverlayOpen,
    resetShop: resetShopState,
    resetInventory: resetInventoryState,
  };
})();
