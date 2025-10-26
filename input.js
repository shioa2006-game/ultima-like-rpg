(function () {
  // 入力処理と移動／戦闘の制御
  window.Game = window.Game || {};

  const hungerScenes = new Set([Game.SCENE.FIELD, Game.SCENE.CAVE]);

  function handleKeyPressed(keyValue, keyCode) {
    Game.occupancy.rebuild();
    if (Game.combat.isActive()) {
      handleBattleInput(keyValue, keyCode);
      return;
    }

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
        toggleStatusOverlay();
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

  function handleBattleInput(keyValue, keyCode) {
    const upper = (keyValue || "").toUpperCase();
    if (upper === "A") {
      Game.combat.playerAction("ATTACK");
      return;
    }
    if (upper === "D") {
      Game.combat.playerAction("DEFEND");
      return;
    }
    if (upper === "R") {
      Game.combat.playerAction("RUN");
      return;
    }
    if (keyCode === window.ENTER) {
      return;
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

  function toggleStatusOverlay() {
    if (Game.ui.state.overlay === Game.ui.OVERLAY.STATUS) {
      Game.ui.close();
    } else {
      Game.ui.open(Game.ui.OVERLAY.STATUS);
    }
  }

  function handleTalk() {
    if (isAdjacentToNpc(Game.state.playerPos)) {
      Game.shop.tryOpen();
    } else {
      Game.pushMessage("近くに話しかけられる相手がいない。");
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
      Game.occupancy.markDirty();
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

  function tryMove(dx, dy) {
    if (!dx && !dy) return;
    const state = Game.state;
    const next = { x: state.playerPos.x + dx, y: state.playerPos.y + dy };
    if (!isInsideGrid(next)) {
      Game.pushMessage("これ以上進めない。");
      return;
    }
    Game.occupancy.rebuild();
    const moveCheck = Game.occupancy.isFreeForPlayer(next.x, next.y);
    if (!moveCheck.ok) {
      if (moveCheck.enemy && moveCheck.enemyRef) {
        Game.combat.startBattle(moveCheck.enemyRef);
      } else if (moveCheck.warp && moveCheck.warpData) {
        Game.occupancy.resolveTileEvent(next.x, next.y);
      } else {
        Game.pushMessage("そこには進めない。");
      }
      return;
    }

    Game.setPlayerPosition(next);
    handleFoodCost();
    Game.entities.onPlayerStep();
    Game.occupancy.markDirty();
    Game.occupancy.rebuild();
    Game.occupancy.resolveTileEvent(next.x, next.y);
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

  function isAdjacentToNpc(pos) {
    const deltas = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    for (const delta of deltas) {
      const nx = pos.x + delta.x;
      const ny = pos.y + delta.y;
      const occ = Game.occupancy.get(nx, ny);
      if (occ && occ.npc) {
        return true;
      }
    }
    return false;
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
