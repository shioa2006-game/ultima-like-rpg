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
     "s c c c c c c c c c c c c c c c c c c c c c c s",
     "s s s s s s s s s s s s s s s s s s s s s s s s",
   ]);

   const fieldTiles = createTiles(FIELD_RAW);
   const villageTiles = createTiles(VILLAGE_RAW);
   const caveTiles = createTiles(CAVE_RAW);

   const fieldVillageEntrances = findPositions(FIELD_RAW, "v");
   const fieldCaveEntrances = findPositions(FIELD_RAW, "h");
   const villageDoors = findPositions(VILLAGE_RAW, "d");
   const caveExits = findPositions(CAVE_RAW, "x");

   const fieldVillageEntry = fieldVillageEntrances[0] || { x: 10, y: 8 };
   const fieldCaveEntry = fieldCaveEntrances[0] || { x: 18, y: 3 };
   const caveExit = caveExits[0] || { x: 10, y: 1 };

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
   const caveReservedTiles = collectReservedPositions(CAVE_RAW);

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
       tiles: caveTiles,
       reservedTiles: caveReservedTiles,
       spawnPoints: {
         default: { x: caveExit.x, y: caveExit.y + 1 },
         fromField: { x: caveExit.x, y: caveExit.y + 1 },
       },
       entrances: [
         {
           tile: F.STAIRS_UP,
           position: caveExit,
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

