(function () {
  // 画面描画全体を管理
  window.Game = window.Game || {};

  const tileSize = Game.config.tileSize;
  const mapAreaHeight = 360;

  const layout = {
    mapAreaWidth: Game.config.canvasWidth,
    mapAreaHeight,
    mapOffsetX: 0,
    mapOffsetY: 0,
    panelHeight: 120,
    panelWidth: Game.config.canvasWidth / 2,
  };

  const overlayArea = {
    x: 40,
    y: 50,
    width: Game.config.canvasWidth - 80,
    height: mapAreaHeight - 100,
  };

  function getCamera() {
    const player = Game.state.playerPos;
    const centerX = player.x * tileSize + tileSize / 2;
    const centerY = player.y * tileSize + tileSize / 2;
    return {
      x: centerX - layout.mapAreaWidth / 2,
      y: centerY - layout.mapAreaHeight / 2,
    };
  }

  function drawMap(p = window) {
    const map = Game.getCurrentMap();
    if (!map) return;
    const camera = getCamera();
    p.push();
    p.translate(layout.mapOffsetX, layout.mapOffsetY);
    p.noStroke();
    p.fill(0);
    p.rect(0, 0, layout.mapAreaWidth, layout.mapAreaHeight);
    for (let y = 0; y < Game.config.gridHeight; y += 1) {
      const screenY = y * tileSize - camera.y;
      if (screenY + tileSize < 0 || screenY > layout.mapAreaHeight) continue;
      for (let x = 0; x < Game.config.gridWidth; x += 1) {
        const screenX = x * tileSize - camera.x;
        if (screenX + tileSize < 0 || screenX > layout.mapAreaWidth) continue;
        const tileId = map.tiles[y][x];
        const color = Game.TILE_COLOR[tileId] || "#333333";
        p.stroke(20, 20, 20);
        p.strokeWeight(1);
        p.fill(color);
        p.rect(screenX, screenY, tileSize, tileSize);
        const overlay = Game.entities.getTileOverlay(tileId);
        if (overlay) {
          p.fill(255);
          Game.entities.drawEmoji(p, overlay, x, y, {
            offsetX: -camera.x,
            offsetY: -camera.y,
          });
        }
      }
    }
    p.pop();
  }

  function drawEntities(p = window) {
    const state = Game.state;
    const camera = getCamera();
    p.push();
    p.translate(layout.mapOffsetX, layout.mapOffsetY);
    p.fill(255);
    Game.entities.drawEmoji(
      p,
      Game.entities.EMOJI_MAP.PLAYER,
      state.playerPos.x,
      state.playerPos.y,
      {
        offsetX: -camera.x,
        offsetY: -camera.y,
      }
    );
    if (state.scene === state.merchant.scene) {
      Game.entities.drawEmoji(
        p,
        Game.entities.EMOJI_MAP.MERCHANT,
        state.merchant.pos.x,
        state.merchant.pos.y,
        {
          offsetX: -camera.x,
          offsetY: -camera.y,
        }
      );
    }
    p.pop();
  }

  function drawPanels(p = window) {
    drawMessagePanel(p);
    drawStatusPanel(p);
    drawCommandPanel(p);
  }

  function drawMessagePanel(p) {
    const x = 0;
    const y = layout.mapAreaHeight;
    p.fill(15, 15, 15);
    p.stroke(80);
    p.rect(x, y, layout.panelWidth, layout.panelHeight);
    p.fill(240);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    const messages = Game.state.messages.slice(-3);
    for (let i = 0; i < messages.length; i += 1) {
      p.text(messages[i], x + 12, y + 12 + i * 24);
    }
  }

  function drawStatusPanel(p) {
    const x = layout.panelWidth;
    const y = layout.mapAreaHeight;
    const player = Game.state.player;
    const stats = Game.getPlayerEffectiveStats();
    p.fill(15, 15, 20);
    p.stroke(80);
    p.rect(x, y, layout.panelWidth, layout.panelHeight);
    p.fill(240);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    const lines = [
      `HP: ${player.hp}/${player.maxHp}    LV: ${player.lv}    EXP: ${player.exp}`,
      `Food: ${player.food}    Gold: ${player.gold}`,
      `ATK/DEF: ${stats.atk} / ${stats.def}`,
      `Weapon: ${player.equip.weapon ? "Bronze Sword" : "-"}    Shield: ${
        player.equip.shield ? "Wood Shield" : "-"
      }`,
    ];
    for (let i = 0; i < lines.length; i += 1) {
      p.text(lines[i], x + 12, y + 12 + i * 24);
    }
  }

  function drawCommandPanel(p) {
    const y = layout.mapAreaHeight + layout.panelHeight;
    const h = layout.panelHeight;
    p.fill(10, 10, 10);
    p.stroke(80);
    p.rect(0, y, Game.config.canvasWidth, h);
    p.fill(220);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    const lines = [
      "矢印キー: 移動　T:Talk　I:Items　U:Use　S:Status",
      "B/S:ショップ操作　A/D/R:戦闘(未実装)　Esc:閉じる",
    ];
    for (let i = 0; i < lines.length; i += 1) {
      p.text(lines[i], 12, y + 12 + i * 24);
    }
  }

  function drawOverlays(p = window) {
    const overlay = Game.ui.state.overlay;
    if (!overlay) return;
    if (overlay === Game.ui.OVERLAY.SHOP) {
      drawShopOverlay(p);
    } else if (overlay === Game.ui.OVERLAY.INVENTORY) {
      drawInventoryOverlay(p);
    } else if (overlay === Game.ui.OVERLAY.STATUS) {
      drawStatusOverlay(p);
    }
  }

  function drawShopOverlay(p) {
    drawOverlayFrame(p);
    const header = "SHOP  B:Buy  S:Sell  ESC:Close";
    const state = Game.shop.getState();
    const buyOptions = Game.shop.getBuyOptions();
    const sellOptions = Game.shop.getSellOptions();
    const list = state.mode === "SELL" ? sellOptions : buyOptions;
    const selection = Math.min(
      state.selection,
      Math.max(list.length - 1, 0)
    );
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text(header, overlayArea.x + 16, overlayArea.y + 14);
    p.textSize(16);
    p.text(
      `表示: ${state.mode === "SELL" ? "Sell" : "Buy"}一覧`,
      overlayArea.x + 16,
      overlayArea.y + 44
    );
    const startY = overlayArea.y + 80;
    if (!list.length) {
      const emptyText =
        state.mode === "SELL" ? "売れるものがない。" : "商品が準備中。";
      p.text(emptyText, overlayArea.x + 16, startY);
      return;
    }
    list.forEach((item, index) => {
      const caret = index === selection ? ">" : " ";
      let line = "";
      if (state.mode === "SELL") {
        const equippedMark = item.equipped ? " (装備中)" : "";
        const detail = item.detail ? `(${item.detail})` : "";
        const priceText = item.canSell ? `Sell ${item.price}G` : "Sell不可";
        line = `${caret} ${item.name}${detail}${equippedMark} — ${priceText}`;
      } else {
        const detail = item.detail ? `(${item.detail})` : "";
        line = `${caret} ${item.name}${detail} — ${item.price}G`;
      }
      const y = startY + index * 24;
      p.text(line, overlayArea.x + 16, y);
    });
  }

  function drawInventoryOverlay(p) {
    drawOverlayFrame(p);
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text(
      "INVENTORY  ↑↓:移動  Enter:詳細  U:使用  ESC:閉じる",
      overlayArea.x + 16,
      overlayArea.y + 14
    );
    p.textSize(16);
    const items = Game.state.player.inventory;
    const selection = Math.min(
      Game.ui.state.inventory.selection,
      Math.max(items.length - 1, 0)
    );
    const startY = overlayArea.y + 60;
    if (!items.length) {
      p.text("所持品は空だ。", overlayArea.x + 16, startY);
      return;
    }
    items.forEach((itemId, index) => {
      const caret = index === selection ? ">" : " ";
      const meta = Game.ITEM_META[itemId];
      const equippedMark = Game.isItemEquipped(itemId) ? " (装備中)" : "";
      const name = meta ? meta.name : itemId;
      const detail = meta && meta.detail ? `(${meta.detail})` : "";
      const y = startY + index * 24;
      p.text(`${caret} ${name}${detail}${equippedMark}`, overlayArea.x + 16, y);
    });
  }

  function drawStatusOverlay(p) {
    drawOverlayFrame(p);
    const player = Game.state.player;
    const stats = Game.getPlayerEffectiveStats();
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text("STATUS  ESC/S:閉じる", overlayArea.x + 16, overlayArea.y + 14);
    p.textSize(16);
    const lines = [
      `HP: ${player.hp}/${player.maxHp}`,
      `LV: ${player.lv}    EXP: ${player.exp}`,
      `ATK: ${stats.atk}    DEF: ${stats.def}`,
      `Food: ${player.food}    Gold: ${player.gold}`,
      `Weapon: ${player.equip.weapon ? "Bronze Sword" : "-"}`,
      `Shield: ${player.equip.shield ? "Wood Shield" : "-"}`,
    ];
    for (let i = 0; i < lines.length; i += 1) {
      p.text(lines[i], overlayArea.x + 16, overlayArea.y + 60 + i * 24);
    }
  }

  function drawOverlayFrame(p) {
    p.push();
    p.noStroke();
    p.fill(0, 180);
    p.rect(
      overlayArea.x,
      overlayArea.y,
      overlayArea.width,
      overlayArea.height,
      10
    );
    p.stroke(220);
    p.noFill();
    p.rect(
      overlayArea.x,
      overlayArea.y,
      overlayArea.width,
      overlayArea.height,
      10
    );
    p.pop();
  }

  Game.renderer = {
    layout,
    drawMap,
    drawEntities,
    drawUI: drawPanels,
    drawOverlays,
  };
})();
