 (function () {
   // マップデータとエリア遷移を定義
   const Game = (window.Game = window.Game || {});

   const F = Game.TILE;
   const scenes = Game.SCENE;

   const palette = {
     ".": F.GRASS,
     r: F.ROAD,
     "~": F.WATER,
     "#": F.MOUNTAIN,
     s: F.ROCK,
     t: F.TREE,
     w: F.WALL,
     d: F.DOOR,
     c: F.FLOOR_CAVE,
     f: F.FLOOR_BUILD,
     v: F.ENTRANCE_VIL,
     h: F.ENTRANCE_CAVE,
     x: F.STAIRS_UP,
     y: F.STAIRS_DOWN,
     u: F.RUINS,
   };

   const reservedChars = new Set(["d", "v", "h", "x", "y", "u"]);

   function normalizeRows(rows) {
     return rows.map((row) => row.replace(/\s+/g, ""));
   }

   function createTiles(rows) {
     if (rows.length !== Game.config.gridHeight) {
       throw new Error("行数がグリッドの高さと一致しません。");
     }
     return rows.map((row, y) => {
       if (row.length !== Game.config.gridWidth) {
         throw new Error(`行 ${y} の列数が不正です。`);
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
     "w w w w w w w w w w w d w w w w w w w w w w w w",
     "w . . . . . . . . . . r t w f f f s s s f f f w",
     "w . . . . . . . . . . r t w f f f s f s f f f w",
     "w . . t . . . w w w w r t w f f f f f f f f f w",
     "w . . . . . . w f f f r t w f f f f f f f f f w",
     "w . . . . . . w f f f r t w f f f f f f f f f w",
     "w . t t . . . w f f f r t w w w w f f f w w w w",
     "w . . . . . . w w w w r t t t t t r r r t t t w",
     "w r r r r r r r r r r r r r r r r r r r r r r w",
     "w . . . . . . . . . . r w w w w . . . . . . . w",
     "w . t t . . . . . . . r f f f w . . . . t t . w",
     "w . . . . . . . . . . r f f f w . . . . . . . w",
     "w . . . . . . . t t . r f f f w . t t . . . . w",
     "w . . . . . . . . . . r w w w w . . . . . . . w",
     "w . . . . . . . . t t r . . . . . . . . t t . w",
     "w . . . . . . . . . . r . . . . . . . . . . . w",
     "w . . . . . . . . . . r . . . . . . . . . . . w",
     "w w w w w w w w w w w d w w w w w w w w w w w w",
   ]);

  const CAVE_B1_RAW = normalizeRows([
    "s s s s s s s s s s s s s s s s s s s s s s s s",
    "s c c c c c c c c c x c c c c c c c c c c c c s",
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
    "s c c c c c c c c c c c c c c c c c c c c c y s",
    "s s s s s s s s s s s s s s s s s s s s s s s s",
  ]);

  const CAVE_B2_RAW = normalizeRows([
    "s s s s s s s s s s s s s s s s s s s s s s s s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c s s c c c c c c c c s",
    "s c c c s s c c c c c c c c c c c c c c s s c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c c c c c c c c s s c c c c c c c c c c c s",
    "s c c c c c s c c c c c c c c c c c c c c c c s",
    "s c c s c c s c c c c c c c c c c c c c c c c s",
    "s c c s c c c c c c c c c c c s c c c c c c c s",
    "s c c c c c c c c s c c c c c s c c c c c c c s",
    "s c c c c c c c c c c c c c c c c s c c c c c s",
    "s c c c c s s c c c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c s c c c c c s c c c c c s",
    "s c c c c c s c c c c c c c c c c c c c c c c s",
    "s c c c c c c s s c c c c c c c c c c c c c c s",
    "s c c c c c c c c c c c c c c c c c c c c c x s",
    "s s s s s s s s s s s s s s s s s s s s s s s s",
  ]);

  const fieldTiles = createTiles(FIELD_RAW);
  const villageTiles = createTiles(VILLAGE_RAW);
  const caveB1Tiles = createTiles(CAVE_B1_RAW);
  const caveB2Tiles = createTiles(CAVE_B2_RAW);

  const fieldVillageEntrances = findPositions(FIELD_RAW, "v");
  const fieldCaveEntrances = findPositions(FIELD_RAW, "h");
  const villageDoors = findPositions(VILLAGE_RAW, "d");
  const caveUpStairs = findPositions(CAVE_B1_RAW, "x");
  const caveDownStairs = findPositions(CAVE_B1_RAW, "y");
  const caveB2UpStairs = findPositions(CAVE_B2_RAW, "x");

  const fieldVillageEntry = fieldVillageEntrances[0] || { x: 10, y: 8 };
  const fieldCaveEntry = fieldCaveEntrances[0] || { x: 18, y: 3 };
  const caveExit = caveUpStairs[0] || { x: 10, y: 1 };
  const caveDown =
    caveDownStairs[0] || {
      x: caveExit.x,
      y: Math.min(caveExit.y + 2, Game.config.gridHeight - 2),
    };
  const caveB2Entry =
    caveB2UpStairs[0] || {
      x: caveDown.x,
      y: Math.max(caveDown.y - 1, 0),
    };

   const defaultVillageDoor = { x: 11, y: 17 };
   // 村の扉座標を南北で抽出
   const villageDoorSouth =
     villageDoors.reduce((result, pos) => {
       if (!result || pos.y > result.y) {
         return { x: pos.x, y: pos.y };
       }
       return result;
     }, null) || defaultVillageDoor;
   const villageDoorNorth =
     villageDoors.reduce((result, pos) => {
       if (!result || pos.y < result.y) {
         return { x: pos.x, y: pos.y };
       }
       return result;
     }, null) || { x: villageDoorSouth.x, y: villageDoorSouth.y };

   // フィールドへ戻る際の出現位置を扉ごとに定義
  const fieldSpawnFromVillageSouth = {
    x: fieldVillageEntry.x,
    y: Math.min(fieldVillageEntry.y + 1, Game.config.gridHeight - 1),
  };
  const fieldSpawnFromVillageNorth = {
    x: fieldVillageEntry.x,
    y: Math.max(fieldVillageEntry.y - 1, 0),
  };
  const caveSpawnFromField = {
    x: caveExit.x,
    y: Math.min(caveExit.y + 1, Game.config.gridHeight - 1),
  };
  const caveSpawnFromLower = {
    x: caveDown.x,
    y: Math.max(caveDown.y - 1, 0),
  };
  const caveB2SpawnFromUpper = {
    x: caveB2Entry.x,
    y: Math.max(caveB2Entry.y - 1, 0),
  };

   // 村の扉ごとにフィールドへの移動設定を作成
   const villageEntrances = [
     {
       tile: F.DOOR,
       position: { x: villageDoorSouth.x, y: villageDoorSouth.y },
       targetScene: scenes.FIELD,
       targetSpawn: "fromVillageSouth",
     },
   ];
   if (villageDoorNorth.x !== villageDoorSouth.x || villageDoorNorth.y !== villageDoorSouth.y) {
     villageEntrances.push({
       tile: F.DOOR,
       position: { x: villageDoorNorth.x, y: villageDoorNorth.y },
       targetScene: scenes.FIELD,
       targetSpawn: "fromVillageNorth",
     });
   }

  const fieldReservedTiles = collectReservedPositions(FIELD_RAW);
  const villageReservedTiles = collectReservedPositions(VILLAGE_RAW);
  const caveB1ReservedTiles = collectReservedPositions(CAVE_B1_RAW);
  const caveB2ReservedTiles = collectReservedPositions(CAVE_B2_RAW);

   Game.mapData = {
     [scenes.FIELD]: {
       tiles: fieldTiles,
       reservedTiles: fieldReservedTiles,
       spawnPoints: {
         default: { x: 2, y: 2 },
         fromVillage: { x: fieldSpawnFromVillageSouth.x, y: fieldSpawnFromVillageSouth.y },
         fromVillageSouth: { x: fieldSpawnFromVillageSouth.x, y: fieldSpawnFromVillageSouth.y },
         fromVillageNorth: { x: fieldSpawnFromVillageNorth.x, y: fieldSpawnFromVillageNorth.y },
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
         default: {
           x: villageDoorSouth.x,
           y: Math.max(villageDoorSouth.y - 1, 0),
         },
         fromField: {
           x: villageDoorSouth.x,
           y: Math.max(villageDoorSouth.y - 1, 0),
         },
       },
       entrances: villageEntrances,
     },
    [scenes.CAVE]: {
      tiles: caveB1Tiles,
      reservedTiles: caveB1ReservedTiles,
      spawnPoints: {
        default: { x: caveSpawnFromField.x, y: caveSpawnFromField.y },
        fromField: { x: caveSpawnFromField.x, y: caveSpawnFromField.y },
        fromLower: { x: caveSpawnFromLower.x, y: caveSpawnFromLower.y },
      },
      entrances: [
        {
          tile: F.STAIRS_UP,
          position: caveExit,
          targetScene: scenes.FIELD,
          targetSpawn: "fromCave",
        },
        {
          tile: F.STAIRS_DOWN,
          position: caveDown,
          targetScene: scenes.CAVE_B2,
          targetSpawn: "fromUpper",
        },
      ],
    },
    [scenes.CAVE_B2]: {
      tiles: caveB2Tiles,
      reservedTiles: caveB2ReservedTiles,
      spawnPoints: {
        default: { x: caveB2SpawnFromUpper.x, y: caveB2SpawnFromUpper.y },
        fromUpper: { x: caveB2SpawnFromUpper.x, y: caveB2SpawnFromUpper.y },
      },
      entrances: [
        {
          tile: F.STAIRS_UP,
          position: caveB2Entry,
          targetScene: scenes.CAVE,
          targetSpawn: "fromLower",
        },
      ],
    },
  };

  Game.EVENTS = {
    [scenes.CAVE_B2]: {
      chests: [{ x: 1, y: 1 }],
    },
    [scenes.FIELD]: {
      ruins: { x: 5, y: 5 },
     },
   };
 })();
