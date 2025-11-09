(function () {
  // キャラクターと敵・イベント管理
  const Game = (window.Game = window.Game || {});

  const ACTOR_KIND = Object.freeze({
    PLAYER: "PLAYER",
    MERCHANT: "MERCHANT",
    INNKEEPER: "INNKEEPER",
    KING: "KING",
  });

  const ACTOR_SPRITE = Object.freeze({
    [ACTOR_KIND.PLAYER]: 0,
    [ACTOR_KIND.MERCHANT]: 1,
    [ACTOR_KIND.INNKEEPER]: 2,
    [ACTOR_KIND.KING]: 3,
  });

  const ACTOR_SPRITE_SIZE = 48;

  const ENEMY_KIND = Object.freeze({
    SLIME: "SLIME",
    BAT: "BAT",
    SPIDER: "SPIDER",
    GHOST: "GHOST",
    VAMPIRE: "VAMPIRE",
    TROLL: "TROLL",
    DRAGON: "DRAGON",
  });

  const ENEMY_SPRITE = Object.freeze({
    [ENEMY_KIND.SLIME]: 0,
    [ENEMY_KIND.BAT]: 1,
    [ENEMY_KIND.SPIDER]: 2,
    [ENEMY_KIND.GHOST]: 3,
    [ENEMY_KIND.VAMPIRE]: 4,
    [ENEMY_KIND.TROLL]: 5,
    [ENEMY_KIND.DRAGON]: 6,
  });

  const ENEMY_SPRITE_SIZE = 48;

  const OBJECT_KIND = Object.freeze({
    CHEST: "CHEST",
  });

  const OBJECT_SPRITE = Object.freeze({
    [OBJECT_KIND.CHEST]: 0,
  });

  const OBJECT_SPRITE_SIZE = 48;

  const MIN_FIELD_ENEMIES = 3;
  const MAX_FIELD_ENEMIES = 5;
  const MIN_CAVE_ENEMIES = 2;
  const MAX_CAVE_ENEMIES = 4;
  const RESPAWN_STEP_THRESHOLD = 20;
  const SAFE_DISTANCE_FROM_PLAYER = 4;
  const ENEMY_CHASE_DISTANCE = 7;

  function isCaveScene(scene) {
    return scene === Game.SCENE.CAVE || scene === Game.SCENE.CAVE_B2;
  }

  let dragonSpawnSpot = null;

  function drawActor(g, actorType, gridX, gridY, options = {}) {
    // アクターをスプライトで描画
    if (!Game.assets || !Game.assets.actorsSheet) return false;
    const spriteIndex = ACTOR_SPRITE[actorType];
    if (spriteIndex == null) return false;
    const tileSize = Game.config.tileSize;
    const offsetX = options.offsetX || 0;
    const offsetY = options.offsetY || 0;
    const screenX = gridX * tileSize + offsetX;
    const screenY = gridY * tileSize + offsetY;
    const sx = spriteIndex * ACTOR_SPRITE_SIZE;
    g.push();
    g.imageMode(g.CORNER);
    g.image(
      Game.assets.actorsSheet,
      screenX,
      screenY,
      tileSize,
      tileSize,
      sx,
      0,
      ACTOR_SPRITE_SIZE,
      ACTOR_SPRITE_SIZE
    );
    g.pop();
    return true;
  }

  function drawEnemy(g, enemyKind, gridX, gridY, options = {}) {
    // 敵キャラクターをスプライトで描画
    if (!Game.assets || !Game.assets.enemiesSheet) return false;
    const spriteIndex = ENEMY_SPRITE[enemyKind];
    if (spriteIndex == null) return false;
    const tileSize = Game.config.tileSize;
    const drawSize = options.drawSize || tileSize;
    const offsetX = options.offsetX || 0;
    const offsetY = options.offsetY || 0;
    const useScreen = options.useScreenCoordinates === true;
    const baseX = useScreen ? gridX : gridX * tileSize;
    const baseY = useScreen ? gridY : gridY * tileSize;
    const screenX = baseX + offsetX;
    const screenY = baseY + offsetY;
    const sx = spriteIndex * ENEMY_SPRITE_SIZE;
    g.push();
    g.imageMode(g.CORNER);
    g.image(
      Game.assets.enemiesSheet,
      screenX,
      screenY,
      drawSize,
      drawSize,
      sx,
      0,
      ENEMY_SPRITE_SIZE,
      ENEMY_SPRITE_SIZE
    );
    g.pop();
    return true;
  }

  function drawObject(g, objectKind, gridX, gridY, options = {}) {
    // インタラクト可能なオブジェクトをスプライトで描画
    if (!Game.assets || !Game.assets.objectsSheet) return false;
    const spriteIndex = OBJECT_SPRITE[objectKind];
    if (spriteIndex == null) return false;
    const tileSize = Game.config.tileSize;
    const drawSize = options.drawSize || tileSize;
    const offsetX = options.offsetX || 0;
    const offsetY = options.offsetY || 0;
    const useScreen = options.useScreenCoordinates === true;
    const baseX = useScreen ? gridX : gridX * tileSize;
    const baseY = useScreen ? gridY : gridY * tileSize;
    const screenX = baseX + offsetX;
    const screenY = baseY + offsetY;
    const sx = spriteIndex * OBJECT_SPRITE_SIZE;
    g.push();
    g.imageMode(g.CORNER);
    g.image(
      Game.assets.objectsSheet,
      screenX,
      screenY,
      drawSize,
      drawSize,
      sx,
      0,
      OBJECT_SPRITE_SIZE,
      OBJECT_SPRITE_SIZE
    );
    g.pop();
    return true;
  }

  function spawnInitialEnemies() {
    if (dragonSpawnSpot == null) {
      dragonSpawnSpot = findDragonSpot();
    }
    ensureFieldEnemies();
    ensureCaveEnemies();
  }

  function ensureFieldEnemies() {
    const state = Game.state;
    if (!Game.mapData || !Game.mapData[Game.SCENE.FIELD]) return;

    spawnDragon();

    if (state.scene !== Game.SCENE.FIELD) return;

    Game.occupancy.markDirty();
    Game.occupancy.ensure();

    let guard = 0;
    while (countFieldNonDragon() < MIN_FIELD_ENEMIES && guard < 20) {
      if (!spawnFieldEnemy()) break;
      guard += 1;
    }

    guard = 0;
    while (countFieldNonDragon() < MAX_FIELD_ENEMIES && guard < 40) {
      if (!spawnFieldEnemy()) break;
      guard += 1;
    }
  }

  function ensureCaveEnemies() {
    const scene = Game.state.scene;
    if (!isCaveScene(scene)) return;
    if (!Game.mapData || !Game.mapData[scene]) return;

    Game.occupancy.markDirty();
    Game.occupancy.ensure();

    let guard = 0;
    while (countEnemiesForScene(scene) < MIN_CAVE_ENEMIES && guard < 20) {
      if (!spawnCaveEnemy(scene)) break;
      guard += 1;
    }

    guard = 0;
    while (countEnemiesForScene(scene) < MAX_CAVE_ENEMIES && guard < 40) {
      if (!spawnCaveEnemy(scene)) break;
      guard += 1;
    }
  }

  function countFieldNonDragon() {
    return Game.state.enemies.filter(
      (enemy) => enemy.scene === Game.SCENE.FIELD && enemy.kind !== ENEMY_KIND.DRAGON
    ).length;
  }

  function countEnemiesForScene(scene) {
    return Game.state.enemies.filter((enemy) => enemy.scene === scene).length;
  }

  function spawnFieldEnemy() {
    return spawnEnemyForScene(Game.SCENE.FIELD);
  }

  function spawnCaveEnemy(targetScene = Game.state.scene) {
    if (!isCaveScene(targetScene)) return false;
    return spawnEnemyForScene(targetScene);
  }

  function spawnEnemyForScene(scene) {
    const map = Game.mapData[scene];
    if (!map) return false;
    const position = findSpawnPositionForScene(map, scene);
    if (!position) return false;
    const kind = pickEnemyKind(position, map, scene);
    if (!kind) return false;
    const enemy = createEnemyInstance(kind, position, scene);
    Game.state.enemies.push(enemy);
    Game.occupancy.markDirty();
    return true;
  }

  function spawnDragon() {
    const state = Game.state;
    if (state.flags.dragonDefeated) return;
    if (!Game.mapData || !Game.mapData[Game.SCENE.FIELD]) return;
    if (state.enemies.some((enemy) => enemy.kind === ENEMY_KIND.DRAGON)) return;
    if (dragonSpawnSpot == null) {
      dragonSpawnSpot = findDragonSpot();
    }
    if (!dragonSpawnSpot) return;
    if (isOccupiedByEntity(dragonSpawnSpot.x, dragonSpawnSpot.y, Game.SCENE.FIELD)) return;
    const dragon = createEnemyInstance(ENEMY_KIND.DRAGON, dragonSpawnSpot, Game.SCENE.FIELD);
    state.enemies.push(dragon);
    Game.occupancy.markDirty();
  }

  function findDragonSpot() {
    const map = Game.mapData ? Game.mapData[Game.SCENE.FIELD] : null;
    if (!map) return null;
    for (let y = 0; y < Game.config.gridHeight; y += 1) {
      for (let x = 0; x < Game.config.gridWidth; x += 1) {
        if (map.tiles[y][x] === Game.TILE.RUINS) {
          return { x, y: Math.min(y + 1, Game.config.gridHeight - 1) };
        }
      }
    }
    return { x: 5, y: 6 };
  }

  function findSpawnPositionForScene(map, scene) {
    const attempts = 200;
    for (let i = 0; i < attempts; i += 1) {
      const x = Game.utils.randInt(1, Game.config.gridWidth - 2);
      const y = Game.utils.randInt(1, Game.config.gridHeight - 2);
      if (!Game.occupancy.isFreeForEnemy(x, y, scene)) continue;
      if (
        scene === Game.state.scene &&
        Game.utils.distance(Game.state.playerPos, { x, y }) < SAFE_DISTANCE_FROM_PLAYER
      ) {
        continue;
      }
      return { x, y };
    }
    return null;
  }

  function pickEnemyKind(position, map, scene) {
    const tile = map.tiles[position.y][position.x];
    if (scene === Game.SCENE.FIELD) {
      if (tile === Game.TILE.TREE || isNearTile(position, Game.TILE.TREE, 1, scene)) {
        return Game.utils.choice([ENEMY_KIND.BAT, ENEMY_KIND.SPIDER]);
      }
      if (
        tile === Game.TILE.MOUNTAIN ||
        tile === Game.TILE.ROCK ||
        isNearTile(position, Game.TILE.MOUNTAIN, 1, scene) ||
        isNearTile(position, Game.TILE.ROCK, 1, scene)
      ) {
        return ENEMY_KIND.SPIDER;
      }
      return Game.utils.choice([ENEMY_KIND.SLIME, ENEMY_KIND.BAT]);
    }
    if (isCaveScene(scene)) {
      return Game.utils.choice([ENEMY_KIND.GHOST, ENEMY_KIND.VAMPIRE, ENEMY_KIND.TROLL]);
    }
    return null;
  }

  function isNearTile(position, tileId, radius, scene) {
    const map = Game.mapData ? Game.mapData[scene] : null;
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
    const data = Game.ENEMY_DATA[kind] || {};
    const enemy = {
      id: Game.nextEnemyInstanceId(),
      kind,
      name: data.name || kind,
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
    const player = Game.state.playerPos;
    if (scene === Game.state.scene && player.x === x && player.y === y) return true;
    const merchant = Game.state.merchant;
    if (merchant.scene === scene && merchant.pos.x === x && merchant.pos.y === y) return true;
    const innkeeper = Game.state.innkeeper;
    if (innkeeper.scene === scene && innkeeper.pos.x === x && innkeeper.pos.y === y) return true;
    const king = Game.state.king;
    if (king && king.scene === scene && king.pos.x === x && king.pos.y === y) return true;
    return Game.state.enemies.some(
      (enemy) => enemy.scene === scene && enemy.pos.x === x && enemy.pos.y === y
    );
  }

  function moveEnemiesTowardPlayer() {
    const scene = Game.state.scene;
    if (scene !== Game.SCENE.FIELD && !isCaveScene(scene)) return;
    if (Game.combat.isActive()) return;
    const playerPos = Game.state.playerPos;
    const enemies = Game.state.enemies.filter(
      (enemy) => enemy.scene === scene && enemy.kind !== ENEMY_KIND.DRAGON
    );
    if (!enemies.length) return;

    Game.occupancy.ensure();

    const reserved = new Set();
    const reserveKey = (pos) => `${pos.x},${pos.y}`;

    for (let i = 0; i < enemies.length; i += 1) {
      const enemy = enemies[i];
      const dist = Game.utils.distance(enemy.pos, playerPos);
      if (dist >= ENEMY_CHASE_DISTANCE) continue;
      const path = Game.utils.findPath(enemy.pos, playerPos, {
        scene,
        allowGoalOccupied: true,
        canEnter(x, y) {
          if (x === enemy.pos.x && y === enemy.pos.y) return true;
          const key = `${x},${y}`;
          if (reserved.has(key)) return false;
          return Game.occupancy.isFreeForEnemy(x, y, scene);
        },
      });
      if (!path || path.length < 2) continue;
      const nextStep = path[1];
      if (nextStep.x === enemy.pos.x && nextStep.y === enemy.pos.y) continue;
      enemy.pos.x = nextStep.x;
      enemy.pos.y = nextStep.y;
      reserved.add(reserveKey(enemy.pos));
      if (enemy.pos.x === playerPos.x && enemy.pos.y === playerPos.y) {
        Game.combat.startBattle(enemy);
        break;
      }
    }
  }

  function onPlayerStep() {
    if (Game.combat.isActive()) return;
    const scene = Game.state.scene;
    const onField = scene === Game.SCENE.FIELD;
    const onCaveFloor = isCaveScene(scene);
    if (!onField && !onCaveFloor) {
      Game.state.enemyRespawnSteps = 0;
      return;
    }
    Game.state.enemyRespawnSteps += 1;
    if (Game.state.enemyRespawnSteps >= RESPAWN_STEP_THRESHOLD) {
      if (onField && countFieldNonDragon() < MAX_FIELD_ENEMIES) {
        spawnFieldEnemy();
      }
      if (onCaveFloor && countEnemiesForScene(scene) < MAX_CAVE_ENEMIES) {
        spawnCaveEnemy(scene);
      }
      Game.state.enemyRespawnSteps = 0;
    }
    moveEnemiesTowardPlayer();
  }

  function removeEnemyById(enemyId) {
    const idx = Game.state.enemies.findIndex((enemy) => enemy.id === enemyId);
    if (idx < 0) return;
    const [removed] = Game.state.enemies.splice(idx, 1);
    if (removed && removed.kind === ENEMY_KIND.DRAGON) {
      Game.state.flags.dragonDefeated = true;
    }
    Game.state.enemyRespawnSteps = 0;
    Game.occupancy.markDirty();
  }

  function drawEnemies(p, camera) {
    const enemies = Game.state.enemies.filter((enemy) => enemy.scene === Game.state.scene);
    enemies.forEach((enemy) => {
      const options = {
        offsetX: -camera.x,
        offsetY: -camera.y,
      };
      if (!drawEnemy(p, enemy.kind, enemy.pos.x, enemy.pos.y, options)) {
        const tileSize = Game.config.tileSize;
        const screenX = enemy.pos.x * tileSize + options.offsetX;
        const screenY = enemy.pos.y * tileSize + options.offsetY;
        p.push();
        p.noStroke();
        p.fill(200, 40, 40);
        p.rect(screenX, screenY, tileSize, tileSize);
        p.pop();
      }
    });
  }

  Game.entities = {
    ACTOR_KIND,
    ENEMY_KIND,
    OBJECT_KIND,
    drawActor,
    drawEnemy,
    drawObject,
    spawnInitialEnemies,
    ensureFieldEnemies,
    ensureCaveEnemies,
    onPlayerStep,
    removeEnemyById,
    drawEnemies,
  };
})();
