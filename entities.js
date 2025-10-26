(function () {
  // 絵文字描画と敵シンボル管理
  window.Game = window.Game || {};

  const EMOJI_MAP = {
    PLAYER: "🧝",
    MERCHANT: "🧙‍♂️",
    MOUNTAIN: "⛰️",
    ROCK: "🪨",
    TREE: "🌲",
    VILLAGE: "🏘️",
    CAVE: "🕳️",
    DOOR: "🚪",
    WALL: "🧱",
    RUINS: "🏛️",
  };

  const tileOverlay = {
    [Game.TILE.MOUNTAIN]: EMOJI_MAP.MOUNTAIN,
    [Game.TILE.ROCK]: EMOJI_MAP.ROCK,
    [Game.TILE.TREE]: EMOJI_MAP.TREE,
    [Game.TILE.ENTRANCE_VIL]: EMOJI_MAP.VILLAGE,
    [Game.TILE.ENTRANCE_CAVE]: EMOJI_MAP.CAVE,
    [Game.TILE.DOOR]: EMOJI_MAP.DOOR,
    [Game.TILE.WALL]: EMOJI_MAP.WALL,
    [Game.TILE.RUINS]: EMOJI_MAP.RUINS,
  };

  const MIN_FIELD_ENEMIES = 3;
  const MAX_FIELD_ENEMIES = 5;
  const RESPAWN_STEP_THRESHOLD = 20;
  const SAFE_DISTANCE_FROM_PLAYER = 4;

  let dragonSpawnSpot = null;

  function drawEmoji(g, emoji, gridX, gridY, options = {}) {
    const size = Game.config.tileSize;
    const offsetX = options.offsetX || 0;
    const offsetY = options.offsetY || 0;
    const cx = gridX * size + size / 2 + offsetX;
    const cy = gridY * size + size / 2 + offsetY;
    g.textAlign(g.CENTER, g.CENTER);
    g.textSize(size * 0.8);
    g.text(emoji, cx, cy + size * 0.05);
  }

  function getTileOverlay(tileId) {
    return tileOverlay[tileId] || null;
  }

  // ------------------------------------------------------------------
  // 敵スポーン管理
  // ------------------------------------------------------------------
  function spawnInitialEnemies() {
    if (dragonSpawnSpot == null) {
      dragonSpawnSpot = findDragonSpot();
    }
    if (Game.state.scene === Game.SCENE.FIELD) {
      Game.occupancy.markDirty();
      Game.occupancy.rebuild();
      ensureFieldEnemies();
    }
  }

  function ensureFieldEnemies() {
    const state = Game.state;
    const current = state.enemies.filter((enemy) => enemy.scene === Game.SCENE.FIELD);
    if (!Game.mapData || !Game.mapData[Game.SCENE.FIELD]) return;

    if (!state.flags.dragonDefeated && !current.some((e) => e.kind === "DRAGON")) {
      spawnDragon();
    }

    if (state.scene !== Game.SCENE.FIELD) return;
    if (state.scene === Game.SCENE.FIELD) {
      Game.occupancy.markDirty();
      Game.occupancy.rebuild();
    }

    const minNeeded = MIN_FIELD_ENEMIES;
    const maxAllowed = MAX_FIELD_ENEMIES;
    while (state.enemies.filter((e) => e.scene === Game.SCENE.FIELD && e.kind !== "DRAGON").length < minNeeded) {
      if (!spawnFieldEnemy()) break;
    }
    while (state.enemies.filter((e) => e.scene === Game.SCENE.FIELD && e.kind !== "DRAGON").length < maxAllowed) {
      if (!spawnFieldEnemy()) break;
    }
  }

  function spawnFieldEnemy() {
    const map = Game.mapData[Game.SCENE.FIELD];
    if (!map) return false;
    const position = findSpawnPosition(map);
    if (!position) return false;
    const kind = pickEnemyKind(position, map);
    if (!kind) return false;
    const enemy = createEnemyInstance(kind, position, Game.SCENE.FIELD);
    Game.state.enemies.push(enemy);
    Game.occupancy.markDirty();
    return true;
  }

  function spawnDragon() {
    if (!dragonSpawnSpot) return;
    if (isOccupiedByEntity(dragonSpawnSpot.x, dragonSpawnSpot.y, Game.SCENE.FIELD)) return;
    const enemy = createEnemyInstance("DRAGON", dragonSpawnSpot, Game.SCENE.FIELD);
    Game.state.enemies.push(enemy);
    Game.occupancy.markDirty();
  }

  function findDragonSpot() {
    const map = Game.mapData[Game.SCENE.FIELD];
    if (!map) return { x: 5, y: 5 };
    for (let y = 0; y < Game.config.gridHeight; y += 1) {
      for (let x = 0; x < Game.config.gridWidth; x += 1) {
        if (map.tiles[y][x] === Game.TILE.RUINS) {
          const candidate = { x: Math.max(1, x - 1), y };
          if (!Game.TILE_BLOCKED[map.tiles[candidate.y][candidate.x]]) {
            return candidate;
          }
        }
      }
    }
    return { x: 5, y: 5 };
  }

  function findSpawnPosition(map) {
    const attempts = 200;
    for (let i = 0; i < attempts; i += 1) {
      const x = Game.utils.randInt(1, Game.config.gridWidth - 2);
      const y = Game.utils.randInt(1, Game.config.gridHeight - 2);
      if (!Game.occupancy.isFreeForEnemy(x, y, Game.SCENE.FIELD)) continue;
      if (Game.utils.distance(Game.state.playerPos, { x, y }) < SAFE_DISTANCE_FROM_PLAYER) continue;
      return { x, y };
    }
    return null;
  }

  function pickEnemyKind(position, map) {
    const tile = map.tiles[position.y][position.x];
    if (isNearTile(position, Game.TILE.RUINS, 2)) {
      return Game.utils.choice(["GHOST", "VAMPIRE"]);
    }
    if (tile === Game.TILE.TREE || isNearTile(position, Game.TILE.TREE, 1)) {
      return Game.utils.choice(["BAT", "SPIDER"]);
    }
    if (
      tile === Game.TILE.MOUNTAIN ||
      tile === Game.TILE.ROCK ||
      isNearTile(position, Game.TILE.MOUNTAIN, 1) ||
      isNearTile(position, Game.TILE.ROCK, 1)
    ) {
      return Game.utils.choice(["SPIDER", "TROLL"]);
    }
    if (tile === Game.TILE.RUINS) {
      return Game.utils.choice(["GHOST", "VAMPIRE"]);
    }
    return Game.utils.choice(["SLIME", "BAT"]);
  }

  function isNearTile(position, tileId, radius) {
    const map = Game.mapData[Game.SCENE.FIELD];
    if (!map) return false;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const nx = position.x + dx;
        const ny = position.y + dy;
        if (nx < 0 || ny < 0 || nx >= Game.config.gridWidth || ny >= Game.config.gridHeight) continue;
        if (map.tiles[ny][nx] === tileId) return true;
      }
    }
    return false;
  }

  function createEnemyInstance(kind, position, scene) {
    const data = Game.ENEMY_DATA[kind];
    const enemy = {
      id: Game.nextEnemyInstanceId(),
      kind,
      emoji: data.emoji,
      scene,
      pos: { x: position.x, y: position.y },
      hp: Game.utils.randInt(data.hp[0], data.hp[1]),
      maxHp: 0,
      atk: Game.utils.randInt(data.atk[0], data.atk[1]),
      def: Game.utils.randInt(data.def[0], data.def[1]),
      exp: Game.utils.randInt(data.exp[0], data.exp[1]),
      gold: Game.utils.randInt(data.gold[0], data.gold[1]),
    };
    enemy.maxHp = enemy.hp;
    return enemy;
  }

  function isOccupiedByEntity(x, y, scene) {
    const targetScene = scene || Game.state.scene;
    const player = Game.state.playerPos;
    if (targetScene === Game.state.scene && player.x === x && player.y === y) return true;
    if (Game.state.merchant.scene === targetScene) {
      if (Game.state.merchant.pos.x === x && Game.state.merchant.pos.y === y) return true;
    }
    return Game.state.enemies.some((enemy) => enemy.scene === targetScene && enemy.pos.x === x && enemy.pos.y === y);
  }

  function onPlayerStep() {
    if (Game.battle.active) return;
    if (Game.state.scene !== Game.SCENE.FIELD) {
      Game.state.enemyRespawnSteps = 0;
      return;
    }
    Game.state.enemyRespawnSteps += 1;
    if (Game.state.enemyRespawnSteps >= RESPAWN_STEP_THRESHOLD) {
      if (Game.state.enemies.filter((e) => e.scene === Game.SCENE.FIELD && e.kind !== "DRAGON").length < MAX_FIELD_ENEMIES) {
        spawnFieldEnemy();
        Game.occupancy.markDirty();
      }
      Game.state.enemyRespawnSteps = 0;
    }
  }

  function removeEnemyById(enemyId) {
    const idx = Game.state.enemies.findIndex((enemy) => enemy.id === enemyId);
    if (idx >= 0) {
      const [removed] = Game.state.enemies.splice(idx, 1);
      if (removed && removed.kind === "DRAGON") {
        Game.state.flags.dragonDefeated = true;
      }
      Game.state.enemyRespawnSteps = 0;
      Game.occupancy.markDirty();
    }
  }

  function drawEnemies(p, camera) {
    const enemies = Game.state.enemies.filter((enemy) => enemy.scene === Game.state.scene);
    enemies.forEach((enemy) => {
      drawEmoji(p, enemy.emoji, enemy.pos.x, enemy.pos.y, {
        offsetX: -camera.x,
        offsetY: -camera.y,
      });
    });
  }

  Game.entities = {
    EMOJI_MAP,
    drawEmoji,
    getTileOverlay,
    spawnInitialEnemies,
    ensureFieldEnemies,
    onPlayerStep,
    removeEnemyById,
    drawEnemies,
  };
})();
