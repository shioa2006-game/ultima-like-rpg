// renderer.js - 描画処理

// マップを描画
function drawMap() {
  const map = getCurrentMap();

  // カメラ座標を計算（プレイヤーを中心に配置）
  const camera = computeCameraLeftTop(Game.player.x, Game.player.y);

  // 可視範囲のタイルのみ描画（20x9グリッド、上部360pxに収める）
  for (let y = 0; y < VIEW_ROWS; y++) {
    for (let x = 0; x < VIEW_COLS; x++) {
      // 実際のマップ座標
      const mapX = camera.camLeft + x;
      const mapY = camera.camTop + y;

      // マップ範囲外チェック
      if (mapX < 0 || mapX >= GRID_WIDTH || mapY < 0 || mapY >= GRID_HEIGHT) {
        continue;
      }

      const tileId = map.tiles[mapY][mapX];
      const color = TILE_COLOR[tileId] || '#000000';

      // タイルの背景色を描画
      fill(color);
      noStroke();
      rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

// エンティティ（絵文字）を描画
function drawEntities() {
  const map = getCurrentMap();

  // カメラ座標を計算
  const camera = computeCameraLeftTop(Game.player.x, Game.player.y);

  // 可視範囲のエンティティのみ描画
  for (let y = 0; y < VIEW_ROWS; y++) {
    for (let x = 0; x < VIEW_COLS; x++) {
      // 実際のマップ座標
      const mapX = camera.camLeft + x;
      const mapY = camera.camTop + y;

      // マップ範囲外チェック
      if (mapX < 0 || mapX >= GRID_WIDTH || mapY < 0 || mapY >= GRID_HEIGHT) {
        continue;
      }

      const entityId = map.entities[mapY][mapX];
      if (entityId !== ENTITY.NONE) {
        const emoji = getEmojiForEntity(entityId);
        // 画面座標で描画
        drawEmoji(emoji, x, y);
      }
    }
  }

  // プレイヤーを画面中央に固定描画
  const centerCol = Math.floor(VIEW_COLS / 2);
  const centerRow = Math.floor(VIEW_ROWS / 2);
  drawEmoji(PLAYER_EMOJI, centerCol, centerRow);
}

// UIを描画（メッセージ、ステータス、コマンド）
function drawUI() {
  // メッセージパネル（左側、400x120）
  push();
  fill(50);
  stroke(200);
  strokeWeight(2);
  rect(0, MAP_HEIGHT, 400, PANEL_HEIGHT);

  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);

  // メッセージログを表示（最新3件）
  for (let i = 0; i < Game.messages.length; i++) {
    text(Game.messages[i], 10, MAP_HEIGHT + 10 + i * 30);
  }
  pop();

  // ステータスパネル（右側、400x120）
  push();
  fill(50);
  stroke(200);
  strokeWeight(2);
  rect(400, MAP_HEIGHT, 400, PANEL_HEIGHT);

  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);

  const s = Game.stats;
  const statusText = [
    `HP: ${s.hp}/${s.maxHp}  LV: ${s.lv}  EXP: ${s.exp}`,
    `Food: ${s.food}  Gold: ${s.gold}`,
    `ATK: ${s.atk}  DEF: ${s.def}`
  ];

  for (let i = 0; i < statusText.length; i++) {
    text(statusText[i], 410, MAP_HEIGHT + 10 + i * 30);
  }
  pop();

  // コマンドヒント（下部、800x120）
  push();
  fill(30);
  stroke(200);
  strokeWeight(2);
  rect(0, MAP_HEIGHT + PANEL_HEIGHT, CANVAS_WIDTH, COMMAND_HEIGHT);

  fill(200);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);

  const commands = [
    '矢印キー: 移動  |  T: トーク（商人の隣で）',
    'I: インベントリ（未実装） | U: 装備（未実装） | S: セーブ（未実装）',
    'A/D/R: 攻撃/防御/逃走（戦闘時のみ、Phase 1で実装予定）'
  ];

  for (let i = 0; i < commands.length; i++) {
    text(commands[i], 10, MAP_HEIGHT + PANEL_HEIGHT + 10 + i * 25);
  }
  pop();
}

// 全体を描画
function render() {
  background(0);

  push();
  // マップとエンティティを描画（カメラ追従システム適用）
  drawMap();
  drawEntities();
  pop();

  // UIを描画
  drawUI();

  // デバッグ情報を画面に表示
  push();
  fill(255, 255, 0);
  noStroke();
  textSize(10);
  textAlign(LEFT, TOP);
  const camera = computeCameraLeftTop(Game.player.x, Game.player.y);
  text(`Debug: Tile=${TILE_SIZE}px Camera=(${camera.camLeft},${camera.camTop}) Player=(${Game.player.x},${Game.player.y})`, 10, 5);
  pop();
}
