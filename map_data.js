(function () {
  // マップデータとワープ設定を定義
  window.Game = window.Game || {};

  const F = Game.TILE;
  const scenes = Game.SCENE;

  const palette = {
    ".": F.GRASS,
    "r": F.ROAD,
    "~": F.WATER,
    "#": F.MOUNTAIN,
    "s": F.ROCK,
    "t": F.TREE,
    "w": F.WALL,
    "d": F.DOOR,
    "i": F.FLOOR_IN,
    "c": F.FLOOR_CAVE,
    "f": F.FLOOR_SHOP,
    "v": F.ENTRANCE_VIL,
    "h": F.ENTRANCE_CAVE,
    "u": F.RUINS,
  };

  const reservedChars = new Set(["d", "v", "h", "u"]);

  function normalizeRows(rows) {
    return rows.map((row) => row.replace(/\s+/g, ""));
  }

  function createTiles(rows) {
    if (rows.length !== Game.config.gridHeight) {
      throw new Error("行数がグリッド高と一致しません");
    }
    return rows.map((row, y) => {
      if (row.length !== Game.config.gridWidth) {
        throw new Error(`行${y}の列数が不正です`);
      }
      return row.split("").map((ch) => palette[ch] || F.GRASS);
    });
  }

  function findPositions(rows, charCode) {
    const list = [];
    rows.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        if (ch === charCode) list.push({ x, y });
      });
    });
    return list;
  }

  function collectReservedPositions(rows) {
    const list = [];
    rows.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        if (reservedChars.has(ch)) {
          list.push({ x, y });
        }
      });
    });
    return list;
  }

  const FIELD_RAW = normalizeRows([
    "~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~",
    "~ . . . . . . . t t . . . # # . . . t t . . . ~",
    "~ . . . . . s . . . . . . . . . . . . . . . . ~",
    "~ . . ~ ~ ~ ~ ~ . . . . . t t . . . . . h . . ~",
    "~ . . ~ s s s ~ . # # . . . . . . . . . . . . ~",
    "~ . . ~ s u s ~ . # # . . t t . . s . . . . . ~",
    "~ . . ~ s . s ~ . . . . . . . . . . . . . . . ~",
    "~ . . ~ . . . ~ . . . t t . . . . . . . . . . ~",
    "~ . . ~ . . . ~ . . . . . . . . . . v . . . . ~",
    "~ . . ~ . . . ~ . . # # . . . . . . . . . . . ~",
    "~ . . ~ . . . ~ . . # # . . . . . . . . . . . ~",
    "~ . . ~ . . . ~ . . . . . . . . . . . . . . . ~",
    "~ . . . . . . . . . . . . . . . . . . . . . . ~",
    "~ . . t t . . . . . . . . . # # # # . . . . . ~",
    "~ . . . . . . . . . . . . . . . . . . . . . . ~",
    "~ . . s . . . . . . . . . . . . . . . . . . . ~",
    "~ . . . . . . . . . . . . . . . . . . . . . . ~",
    "~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~",
  ]);

  const VILLAGE_RAW = normalizeRows([
    "w w w w w w w w w w w w w w w w w w w w w w w w",
    "w . . . . . . w w w w r w w w w . . . . . . . w",
    "w . . . . . . w f f f r f f f w . . . . . . . w",
    "w . . t . . . w f f f r f f f w . . . . . . . w",
    "w . . . . . . w f f f r f f f w . . . . . . . w",
    "w . . . . . . w w w w r w w w w . . . . . . . w",
    "w . t t . . . . . . . r . . . . . . . . t t . w",
    "w . . . . . . . . . . r . . . . . . . . . . . w",
    "w r r r r r r r r r r r r r r r r r r r r r r w",
    "w . . . . . . . . . . r . . . . . . . . . . . w",
    "w . t t . . . . . . . r . . . . . . . . t t . w",
    "w . . . . . . . . . . r . . . . . . . . . . . w",
    "w . . . . . . . t t . r . . . . . t t . . . . w",
    "w . . . . . . . . . . r . . . . . . . . . . . w",
    "w . . . . . . . . t t r . . . . . . . . t t . w",
    "w . . . . . . . . . . r . . . . . . . . . . . w",
    "w . . . . . . . . . . r . . . . . . . . . . . w",
    "w w w w w w w w w w w d w w w w w w w w w w w w",
  ]);

  const CAVE_RAW = normalizeRows([
    "s s s s s s s s s s s s s s s s s s s s s s s s",
    "s c c c c c c c c c h c c c c c c c c c c c c s",
    "s c s s c c c c c c c c c c c c c c c c c c c s",
    "s c c c c c s c c c c c c c c c c c s s s c c s",
    "s c c c c c s c c c c c c c c c c c c c c c c s",
    "s c c c c c s c c s s c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c s s c c c c c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c c s c c c c c s s c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c s s c c c c c s",
    "s c c c c c c c s c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c c s s c c c c c c c s s c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s s s s s s s s s s s s s s s s s s s s s s s s",
  ]);

  const fieldTiles = createTiles(FIELD_RAW);
  const villageTiles = createTiles(VILLAGE_RAW);
  const caveTiles = createTiles(CAVE_RAW);

  const fieldVillageEntrances = findPositions(FIELD_RAW, "v");
  const fieldCaveEntrances = findPositions(FIELD_RAW, "h");
  const villageDoors = findPositions(VILLAGE_RAW, "d");
  const caveEntrances = findPositions(CAVE_RAW, "h");

  const fieldVillageEntry = fieldVillageEntrances[0] || { x: 10, y: 8 };
  const fieldCaveEntry = fieldCaveEntrances[0] || { x: 18, y: 3 };
  const caveEntry = caveEntrances[0] || { x: 10, y: 1 };
  const villageDoor = villageDoors[0] || { x: 11, y: 17 };

  const fieldReservedTiles = collectReservedPositions(FIELD_RAW);
  const villageReservedTiles = collectReservedPositions(VILLAGE_RAW);
  const caveReservedTiles = collectReservedPositions(CAVE_RAW);

  Game.mapData = {
    [scenes.FIELD]: {
      tiles: fieldTiles,
      reservedTiles: fieldReservedTiles,
      spawnPoints: {
        default: { x: 2, y: 2 },
        fromVillage: { x: fieldVillageEntry.x, y: fieldVillageEntry.y + 1 },
        fromCave: { x: fieldCaveEntry.x, y: fieldCaveEntry.y + 1 },
      },
      entrances: [
        {
          tile: F.ENTRANCE_VIL,
          position: fieldVillageEntry,
          targetScene: scenes.VILLAGE,
          targetSpawn: "fromField",
        },
        {
          tile: F.ENTRANCE_CAVE,
          position: fieldCaveEntry,
          targetScene: scenes.CAVE,
          targetSpawn: "fromField",
        },
      ],
    },
    [scenes.VILLAGE]: {
      tiles: villageTiles,
      reservedTiles: villageReservedTiles,
      spawnPoints: {
        default: { x: villageDoor.x, y: villageDoor.y - 1 },
        fromField: { x: villageDoor.x, y: villageDoor.y - 1 },
      },
      entrances: [
        {
          tile: F.DOOR,
          position: villageDoor,
          targetScene: scenes.FIELD,
          targetSpawn: "fromVillage",
        },
      ],
    },
    [scenes.CAVE]: {
      tiles: caveTiles,
      reservedTiles: caveReservedTiles,
      spawnPoints: {
        default: { x: caveEntry.x, y: caveEntry.y + 1 },
        fromField: { x: caveEntry.x, y: caveEntry.y + 1 },
      },
      entrances: [
        {
          tile: F.ENTRANCE_CAVE,
          position: caveEntry,
          targetScene: scenes.FIELD,
          targetSpawn: "fromCave",
        },
      ],
    },
  };

  Game.EVENTS = {
    [scenes.CAVE]: {
      chests: [{ x: 10, y: 8 }],
    },
    [scenes.FIELD]: {
      ruins: { x: 5, y: 5 },
    },
  };
})();