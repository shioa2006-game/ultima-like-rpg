(function () {
  // 絵文字を使った簡易描画ユーティリティ
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

  Game.entities = {
    EMOJI_MAP,
    drawEmoji,
    getTileOverlay,
  };
})();
