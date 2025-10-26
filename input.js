// input.js - キー入力処理

// プレイヤーの移動を試みる
function tryMove(dx, dy) {
  const newX = Game.player.x + dx;
  const newY = Game.player.y + dy;

  // 範囲外チェック
  if (!isInBounds(newX, newY)) {
    Game.pushMsg('これ以上進めません。');
    return false;
  }

  // タイルの通行判定
  const tileId = getTile(newX, newY);
  if (isBlocked(tileId)) {
    Game.pushMsg('そこには進めません。');
    return false;
  }

  // エンティティの通行判定
  const entityId = getEntity(newX, newY);
  // 壁と岩と山は通れない
  if (entityId === ENTITY.WALL || entityId === ENTITY.MOUNTAIN || entityId === ENTITY.ROCK) {
    Game.pushMsg('障害物があります。');
    return false;
  }

  // 遺跡のチェック
  if (entityId === ENTITY.RUINS) {
    Game.pushMsg('鍵が必要です。（Phase 1で実装予定）');
    return false;
  }

  // 移動成功
  Game.player.x = newX;
  Game.player.y = newY;

  // 移動後の処理
  handleAfterMove();

  return true;
}

// 移動後の処理（Food消費、ワープなど）
function handleAfterMove() {
  // Food消費（FIELD/CAVEのみ、2歩ごとに1減少）
  if (Game.currentScene === SCENE.FIELD || Game.currentScene === SCENE.CAVE) {
    Game.stepCount++;

    if (Game.stepCount >= 2) {
      Game.stepCount = 0;

      if (Game.stats.food > 0) {
        Game.stats.food--;
        // Food消費のメッセージは表示しない（ステータスで確認できるため）
      } else {
        // Food=0の場合、HP減少
        Game.stats.hp--;
        Game.pushMsg('空腹でHPが減った！');

        if (Game.stats.hp <= 0) {
          Game.stats.hp = 0;
          Game.pushMsg('力尽きた... （ゲームオーバー）');
          // TODO: ゲームオーバー処理
        }
      }
    }
  }

  // ワープチェック
  checkWarp();
}

// ワープ処理
function checkWarp() {
  const map = getCurrentMap();

  if (map.warps) {
    for (const warp of map.warps) {
      if (posEq(Game.player, warp)) {
        // シーン切替
        Game.currentScene = warp.to;
        Game.player.x = warp.spawn.x;
        Game.player.y = warp.spawn.y;

        // メッセージ
        const sceneName = {
          [SCENE.FIELD]: 'フィールド',
          [SCENE.VILLAGE]: '村',
          [SCENE.CAVE]: '洞窟'
        };
        Game.pushMsg(`${sceneName[warp.to]}に移動しました。`);

        // 歩数カウントをリセット（シーン切替時）
        Game.stepCount = 0;

        return;
      }
    }
  }
}

// トーク処理（商人の隣でTキー）
function handleTalk() {
  const map = getCurrentMap();

  // 商人の隣にいるかチェック
  if (map.merchant) {
    const dx = Math.abs(Game.player.x - map.merchant.x);
    const dy = Math.abs(Game.player.y - map.merchant.y);

    // 隣接（マンハッタン距離1）ならショップ開く
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      Game.pushMsg('商人: いらっしゃい！');
      Game.pushMsg('Shop機能はPhase 1で実装予定です。');
      // 将来的に openShop() を呼ぶ
      return;
    }
  }

  Game.pushMsg('話しかける相手がいません。');
}

// キー入力のハンドラ
function handleKeyPressed(key, keyCode) {
  // 矢印キーで移動
  if (keyCode === UP_ARROW) {
    tryMove(0, -1);
  } else if (keyCode === DOWN_ARROW) {
    tryMove(0, 1);
  } else if (keyCode === LEFT_ARROW) {
    tryMove(-1, 0);
  } else if (keyCode === RIGHT_ARROW) {
    tryMove(1, 0);
  }
  // Tキーでトーク
  else if (key === 't' || key === 'T') {
    handleTalk();
  }
  // その他のキー（未実装機能の案内）
  else if (key === 'i' || key === 'I') {
    Game.pushMsg('インベントリはPhase 1で実装予定です。');
  } else if (key === 'u' || key === 'U') {
    Game.pushMsg('装備はPhase 1で実装予定です。');
  } else if (key === 's' || key === 'S') {
    Game.pushMsg('セーブはPhase 1で実装予定です。');
  } else if (key === 'a' || key === 'A') {
    Game.pushMsg('攻撃は戦闘中のみ使用できます。');
  } else if (key === 'd' || key === 'D') {
    Game.pushMsg('防御は戦闘中のみ使用できます。');
  } else if (key === 'r' || key === 'R') {
    Game.pushMsg('逃走は戦闘中のみ使用できます。');
  }
}
