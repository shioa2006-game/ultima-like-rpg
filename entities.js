// entities.js - エンティティ（絵文字）の描画

// 絵文字マッピング
const EMOJI_MAP = {
  [ENTITY.NONE]: '',
  [ENTITY.TREE]: '🌲',
  [ENTITY.MOUNTAIN]: '⛰️',
  [ENTITY.ROCK]: '🪨',
  [ENTITY.VILLAGE_ENTRANCE]: '🏘️',
  [ENTITY.CAVE_ENTRANCE]: '🕳️',
  [ENTITY.RUINS]: '🏛️',
  [ENTITY.WALL]: '🧱',
  [ENTITY.DOOR]: '🚪',
  [ENTITY.MERCHANT]: '🧙‍♂️'
};

// プレイヤーの絵文字
const PLAYER_EMOJI = '🧝';

// 絵文字を描画する関数
function drawEmoji(emoji, gridX, gridY) {
  if (!emoji) return;

  push();
  // フォントサイズを設定（40pxタイルに適したサイズ）
  textSize(34);
  textAlign(CENTER, CENTER);

  // グリッド座標をピクセル座標に変換
  const x = gridX * TILE_SIZE + TILE_SIZE / 2;
  const y = gridY * TILE_SIZE + TILE_SIZE / 2;

  // 絵文字を描画
  text(emoji, x, y);
  pop();
}

// エンティティIDから絵文字を取得
function getEmojiForEntity(entityId) {
  return EMOJI_MAP[entityId] || '';
}
