(function () {
  // 入力処理と移動ロジック
  window.Game = window.Game || {};

  const hungerScenes = new Set([Game.SCENE.FIELD, Game.SCENE.CAVE]);

  function handleKeyPressed(keyValue, keyCode) {
    const overlay = Game.ui.state.overlay;
    if (overlay) {
      handleOverlayInput(overlay, keyValue, keyCode);
      return;
    }

    if (isArrowKey(keyCode)) {
      const delta = arrowToDelta(keyCode);
      tryMove(delta.x, delta.y);
      return;
    }

    const upper = (keyValue || "").toUpperCase();
    switch (upper) {
      case "T":
        handleTalk();
        return;
      case "I":
        toggleInventoryOverlay();
        return;
      case "U":
        Game.pushMessage("インベントリを開いてから使用しよう。");
        return;
      case "S":
        openStatusOverlay();
        return;
      case "A":
      case "D":
      case "R":
        Game.pushMessage("戦闘コマンドはまだ実装されていない。");
        return;
      default:
        break;
    }

    if (keyCode === window.ESCAPE) {
      Game.pushMessage("閉じる対象がない。");
    } else if (keyCode === window.ENTER) {
      Game.pushMessage("今は何も起きない。");
    }
  }

  function handleOverlayInput(type, keyValue, keyCode) {
    switch (type) {
      case Game.ui.OVERLAY.SHOP:
        Game.shop.handleInput(keyValue, keyCode);
        break;
      case Game.ui.OVERLAY.INVENTORY:
        handleInventoryOverlayInput(keyValue, keyCode);
        break;
      case Game.ui.OVERLAY.STATUS:
        handleStatusOverlayInput(keyValue, keyCode);
        break;
      default:
        break;
    }
  }

  function handleInventoryOverlayInput(keyValue, keyCode) {
    const invState = Game.ui.state.inventory;
    const inventory = Game.state.player.inventory;
    const upper = (keyValue || "").toUpperCase();
    if (keyCode === window.ESCAPE || upper === "ESCAPE" || upper === "I") {
      Game.ui.close();
      return;
    }
    if (keyCode === window.UP_ARROW) {
      invState.selection = Game.utils.clamp(invState.selection - 1, 0, Math.max(0, inventory.length - 1));
      return;
    }
    if (keyCode === window.DOWN_ARROW) {
      invState.selection = Game.utils.clamp(invState.selection + 1, 0, Math.max(0, inventory.length - 1));
      return;
    }
    if (upper === "U") {
      useSelectedInventoryItem();
      return;
    }
    if (keyCode === window.ENTER) {
      describeSelectedItem();
    }
  }

  function handleStatusOverlayInput(keyValue, keyCode) {
    const upper = (keyValue || "").toUpperCase();
    if (keyCode === window.ESCAPE || upper === "ESCAPE" || upper === "S") {
      Game.ui.close();
    }
  }

  function toggleInventoryOverlay() {
    if (Game.ui.state.overlay === Game.ui.OVERLAY.INVENTORY) {
      Game.ui.close();
    } else {
      Game.ui.open(Game.ui.OVERLAY.INVENTORY);
    }
  }

  function openStatusOverlay() {
    if (Game.ui.state.overlay === Game.ui.OVERLAY.STATUS) {
      Game.ui.close();
    } else {
      Game.ui.open(Game.ui.OVERLAY.STATUS);
    }
  }

  function useSelectedInventoryItem() {
    const inventory = Game.state.player.inventory;
    if (!inventory.length) {
      Game.pushMessage("所持品が空だ。");
      return;
    }
    const index = Game.utils.clamp(
      Game.ui.state.inventory.selection,
      0,
      Math.max(0, inventory.length - 1)
    );
    const result = Game.useItemByIndex(index);
    Game.pushMessage(result.message);
    if (result.success && result.consumed) {
      const nextLength = Game.state.player.inventory.length;
      if (nextLength === 0) {
        Game.ui.state.inventory.selection = 0;
      } else if (Game.ui.state.inventory.selection >= nextLength) {
        Game.ui.state.inventory.selection = nextLength - 1;
      }
    }
  }

  function describeSelectedItem() {
    const inventory = Game.state.player.inventory;
    if (!inventory.length) {
      Game.pushMessage("所持品は空だ。");
      return;
    }
    const index = Game.utils.clamp(
      Game.ui.state.inventory.selection,
      0,
      Math.max(0, inventory.length - 1)
    );
    const itemId = inventory[index];
    Game.pushMessage(Game.describeItem(itemId));
  }

  function handleTalk() {
    Game.shop.tryOpen();
  }

  function tryMove(dx, dy) {
    if (!dx && !dy) return;
    const state = Game.state;
    const next = { x: state.playerPos.x + dx, y: state.playerPos.y + dy };
    if (!isInsideGrid(next)) {
      Game.pushMessage("これ以上は進めない。");
      return;
    }
    const map = Game.getCurrentMap();
    const tileId = map.tiles[next.y][next.x];
    if (Game.utils.isBlocked(tileId)) {
      if (tileId === Game.TILE.RUINS) {
        Game.pushMessage("大きな扉には鍵が必要だ。");
      } else {
        Game.pushMessage("そこは通れない。");
      }
      return;
    }

    Game.setPlayerPosition(next);
    handleFoodCost();
    handleTileEvent(tileId, next);
  }

  function handleFoodCost() {
    const state = Game.state;
    if (!hungerScenes.has(state.scene)) {
      state.walkCounter = 0;
      return;
    }
    if (state.player.food > 0) {
      state.flags.starvingNotified = false;
    }
    const starvingBefore = state.player.food === 0;
    state.walkCounter += 1;
    if (state.player.food > 0 && state.walkCounter % 2 === 0) {
      state.player.food = Math.max(0, state.player.food - 1);
      if (state.player.food === 0) {
        Game.pushMessage("Foodが尽きた。");
      }
    }
    if (state.player.food === 0) {
      if (starvingBefore) {
        state.player.hp = Math.max(0, state.player.hp - 1);
        Game.pushMessage("飢えでHPが減った。");
        if (state.player.hp === 0) {
          Game.pushMessage("力尽きそうだ…");
        }
      } else if (!state.flags.starvingNotified) {
        Game.pushMessage("急いで補給しよう。");
        state.flags.starvingNotified = true;
      }
    }
  }

  function handleTileEvent(tileId, position) {
    const map = Game.getCurrentMap();
    const entrances = map.entrances || [];
    const found = entrances.find((entry) =>
      Game.utils.posEq(entry.position, position)
    );
    if (found) {
      Game.switchScene(found.targetScene, found.targetSpawn);
      return;
    }
    if (tileId === Game.TILE.ENTRANCE_VIL) {
      Game.pushMessage("条件を満たせば通れるようだ。");
    }
  }

  function isInsideGrid(pos) {
    return (
      pos.x >= 0 &&
      pos.y >= 0 &&
      pos.x < Game.config.gridWidth &&
      pos.y < Game.config.gridHeight
    );
  }

  function isArrowKey(keyCode) {
    return (
      keyCode === window.LEFT_ARROW ||
      keyCode === window.RIGHT_ARROW ||
      keyCode === window.UP_ARROW ||
      keyCode === window.DOWN_ARROW
    );
  }

  function arrowToDelta(keyCode) {
    switch (keyCode) {
      case window.LEFT_ARROW:
        return { x: -1, y: 0 };
      case window.RIGHT_ARROW:
        return { x: 1, y: 0 };
      case window.UP_ARROW:
        return { x: 0, y: -1 };
      case window.DOWN_ARROW:
        return { x: 0, y: 1 };
      default:
        return { x: 0, y: 0 };
    }
  }

  Game.input = {
    handleKeyPressed,
  };
})();
