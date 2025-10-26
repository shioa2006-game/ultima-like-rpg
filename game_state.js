// game_state.js - ゲーム状態管理と定数定義

// タイル種別定数
const TILE = {
  GRASS: 0,
  ROAD: 1,
  WATER: 2,
  INDOOR: 3,
  CAVE: 4,
  MOUNTAIN: 5,
  ROCK: 6,
  WALL: 7,
  RUINS: 8
};

// タイルの色
const TILE_COLOR = {
  [TILE.GRASS]: '#7CCB5B',
  [TILE.ROAD]: '#B57A43',
  [TILE.WATER]: '#2F6DD5',
  [TILE.INDOOR]: '#8B4B4B',
  [TILE.CAVE]: '#444444'
};

// 通行不可タイル
const TILE_BLOCKED = new Set([
  TILE.WATER,
  TILE.MOUNTAIN,
  TILE.ROCK,
  TILE.WALL,
  TILE.RUINS
]);

// シーン種別
const SCENE = {
  FIELD: 'FIELD',
  VILLAGE: 'VILLAGE',
  CAVE: 'CAVE'
};

// グリッドとタイルのサイズ
const GRID_WIDTH = 24;
const GRID_HEIGHT = 18;
const TILE_SIZE = 40;

// キャンバスサイズ
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// マップ表示領域
const MAP_HEIGHT = 360; // 800x360 (上3/5)
const PANEL_HEIGHT = 120; // メッセージとステータス各120px
const COMMAND_HEIGHT = 120; // コマンドヒント120px

// 可視範囲の定数（カメラシステム用）
const VIEW_W = 800;
const VIEW_H = 360;
const VIEW_COLS = Math.floor(VIEW_W / TILE_SIZE); // 20タイル
const VIEW_ROWS = Math.floor(VIEW_H / TILE_SIZE); // 9タイル

// ゲーム状態
const Game = {
  // 現在のシーン
  currentScene: SCENE.FIELD,

  // プレイヤー座標（グリッド単位）
  player: {
    x: 12,
    y: 9
  },

  // プレイヤーステータス
  stats: {
    hp: 30,
    maxHp: 30,
    atk: 5,
    def: 3,
    lv: 1,
    exp: 0,
    food: 50,
    gold: 50
  },

  // 歩数カウンター（Food消費用）
  stepCount: 0,

  // メッセージログ（最大3件）
  messages: ['ようこそ、冒険の世界へ！', '矢印キーで移動できます。', ''],

  // メッセージを追加する関数
  pushMsg: function(text) {
    this.messages.push(text);
    // 最新3件のみ保持
    if (this.messages.length > 3) {
      this.messages.shift();
    }
  }
};
