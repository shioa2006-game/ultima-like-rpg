 (function () {
   // 描画周りの処理をまとめて管理
   const Game = (window.Game = window.Game || {});

   const tileSize = Game.config.tileSize;
   const mapAreaHeight = 480;

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

   // スプライトシート設定
   const SPRITE_SIZE = 48;
   const SPRITE_COLS = 8;

   // タイルIDからスプライトインデックスへのマッピング
   const TILE_TO_SPRITE_INDEX = {
     [Game.TILE.GRASS]: 0,
     [Game.TILE.ROAD]: 1,
     [Game.TILE.WATER]: 2,
     [Game.TILE.FLOOR_CAVE]: 3,
     [Game.TILE.FLOOR_BUILD]: 4,
     [Game.TILE.MOUNTAIN]: 5,
     [Game.TILE.ROCK]: 6,
     [Game.TILE.TREE]: 7,
     [Game.TILE.WALL]: 8,
     [Game.TILE.DOOR]: 9,
     [Game.TILE.ENTRANCE_VIL]: 10,
     [Game.TILE.ENTRANCE_CAVE]: 11,
     [Game.TILE.STAIRS_UP]: 12,
     [Game.TILE.STAIRS_DOWN]: 13,
     [Game.TILE.RUINS]: 14,
   };

   // スプライトを描画する関数
   function drawSprite(p, spriteIndex, screenX, screenY) {
     if (!Game.assets || !Game.assets.tilesSheet) return false;

     const col = spriteIndex % SPRITE_COLS;
     const row = Math.floor(spriteIndex / SPRITE_COLS);
     const sx = col * SPRITE_SIZE;
     const sy = row * SPRITE_SIZE;

     p.image(
       Game.assets.tilesSheet,
       screenX, screenY,
       tileSize, tileSize,
       sx, sy,
       SPRITE_SIZE, SPRITE_SIZE
     );
     return true;
   }

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
         const spriteIndex = TILE_TO_SPRITE_INDEX[tileId];

         // Phase 2: 全タイルをスプライトで描画
         if (spriteIndex !== undefined) {
           // スプライトで描画
           p.push();
           p.imageMode(p.CORNER);
           drawSprite(p, spriteIndex, screenX, screenY);
           p.pop();
        } else {
          const color = Game.TILE_COLOR[tileId] || "#333333";
          p.fill(color);
          p.rect(screenX, screenY, tileSize, tileSize);
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
     drawEventEntities(p, camera);
     if (Game.entities && Game.entities.drawEnemies) {
       Game.entities.drawEnemies(p, camera);
     }
    const actorDrawOptions = {
      offsetX: -camera.x,
      offsetY: -camera.y,
    };
    const drawActorOrFallback = (kind, position) => {
      const ok = Game.entities.drawActor(p, kind, position.x, position.y, actorDrawOptions);
      if (!ok) {
        p.push();
        p.noStroke();
        p.fill(240);
        p.rect(
          position.x * Game.config.tileSize + actorDrawOptions.offsetX,
          position.y * Game.config.tileSize + actorDrawOptions.offsetY,
          Game.config.tileSize,
          Game.config.tileSize
        );
        p.pop();
      }
    };
    drawActorOrFallback(Game.entities.ACTOR_KIND.PLAYER, state.playerPos);
    if (state.scene === state.merchant.scene) {
      drawActorOrFallback(Game.entities.ACTOR_KIND.MERCHANT, state.merchant.pos);
    }
    if (state.scene === state.innkeeper.scene) {
      drawActorOrFallback(Game.entities.ACTOR_KIND.INNKEEPER, state.innkeeper.pos);
    }
     p.pop();
   }

   function drawEventEntities(p, camera) {
     if (!Game.EVENTS) return;
     const scene = Game.state.scene;
     const events = Game.EVENTS[scene];
     if (!events) return;
    if (Array.isArray(events.chests)) {
      events.chests.forEach((pos) => {
        if (Game.hasOpened && Game.hasOpened(scene, pos.x, pos.y)) return;
        const options = {
          offsetX: -camera.x,
          offsetY: -camera.y,
        };
        if (
          !Game.entities.drawObject(
            p,
            Game.entities.OBJECT_KIND.CHEST,
            pos.x,
            pos.y,
            options
          )
        ) {
          const tileSize = Game.config.tileSize;
          const sx = pos.x * tileSize + options.offsetX;
          const sy = pos.y * tileSize + options.offsetY;
          p.push();
          p.noStroke();
          p.fill(200, 160, 60);
          p.rect(sx, sy, tileSize, tileSize);
          p.pop();
        }
      });
    }
     // RUINS はマップタイルとしてスプライト描画されるため、ここでの描画は不要
   }

   function drawPanels(p = window) {
     drawMessagePanel(p);
     drawStatusPanel(p);
   }

  function drawMessagePanel(p) {
    const x = layout.panelWidth;
    const y = layout.mapAreaHeight;
    p.fill(15, 15, 15);
    p.stroke(80);
    p.rect(x, y, layout.panelWidth, layout.panelHeight);
    p.fill(240);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    const messages = Game.state.messages.slice(-4);
    const lineHeight = 24;
    const iconSize = 20;
    messages.forEach((entryRaw, index) => {
      const entry =
        typeof entryRaw === "string" || entryRaw == null
          ? { text: entryRaw || "" }
          : entryRaw;
      const lineY = y + 12 + index * lineHeight;
      let textX = x + 12;
      if (
        entry.icon &&
        entry.icon.type === "enemy" &&
        entry.icon.kind &&
        Game.entities &&
        typeof Game.entities.drawEnemy === "function"
      ) {
        const iconY = lineY + (lineHeight - iconSize) / 2;
        const drawn = Game.entities.drawEnemy(
          p,
          entry.icon.kind,
          textX,
          iconY,
          {
            useScreenCoordinates: true,
            drawSize: iconSize,
          }
        );
        if (drawn) {
          textX += iconSize + 6;
        } else if (entry.icon.label) {
          const label = entry.icon.label;
          p.text(label, textX, lineY);
          textX += p.textWidth(label) + 6;
        }
      } else if (entry.icon && entry.icon.label) {
        const label = entry.icon.label;
        p.text(label, textX, lineY);
        textX += p.textWidth(label) + 6;
      }
      const text = entry.text != null ? String(entry.text) : "";
      p.text(text, textX, lineY);
    });
  }

   function drawStatusPanel(p) {
     const x = 0;
     const y = layout.mapAreaHeight;
     const player = Game.state.player;
     const stats = Game.getPlayerEffectiveStats();
     p.fill(15, 15, 20);
     p.stroke(80);
     p.rect(x, y, layout.panelWidth, layout.panelHeight);
     p.fill(240);
     p.textAlign(p.LEFT, p.TOP);
     p.textSize(16);
     const keyStatus = Game.flags && Game.flags.hasKey ? "あり" : "なし";
     const lines = [
       `HP: ${player.hp}/${player.maxHp}  LV: ${player.lv}  EXP: ${player.exp}`,
       `ATK/DEF: ${stats.atk} / ${stats.def}`,
       `Food: ${player.food}  Gold: ${player.gold}  Key: ${keyStatus}`,
       `Weapon: ${player.equip.weapon !== null ? "Bronze Sword" : "-"}  Shield: ${
         player.equip.shield !== null ? "Wood Shield" : "-"
       }`,
     ];
     lines.forEach((line, index) => {
       p.text(line, x + 12, y + 12 + index * 24);
     });
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
     } else if (overlay === Game.ui.OVERLAY.INN) {
       drawInnOverlay(p);
     }
   }

   function drawShopOverlay(p) {
     drawOverlayFrame(p);
     const state = Game.shop.getState();
     const buyOptions = Game.shop.getBuyOptions();
     const sellOptions = Game.shop.getSellOptions();
     const isSellMode = state.mode === "SELL";
     const list = isSellMode ? sellOptions : buyOptions;
     const selection = Math.min(state.selection, Math.max(list.length - 1, 0));
     p.fill(255);
     p.textAlign(p.LEFT, p.TOP);
     p.textSize(18);
     p.text("SHOP", overlayArea.x + 16, overlayArea.y + 14);
     p.textSize(16);
     p.text(
       `表示: ${isSellMode ? "Sell" : "Buy"} リスト`,
       overlayArea.x + 16,
       overlayArea.y + 44
     );
     let contentY = overlayArea.y + 68;
     if (!list.length) {
       const emptyText = isSellMode ? "売れるものがありません。" : "ただいま準備中です。";
       p.text(emptyText, overlayArea.x + 16, contentY);
     } else {
       list.forEach((item, index) => {
         const caret = index === selection ? ">" : " ";
         let line;
         if (isSellMode) {
           const equippedMark = item.equipped ? " (装備中)" : "";
           const detail = item.detail ? `(${item.detail})` : "";
           const priceText = item.canSell ? `Sell ${item.price}G` : "Sell不可";
           line = `${caret} ${item.name}${detail}${equippedMark}  ${priceText}`;
         } else {
           const detail = item.detail ? `(${item.detail})` : "";
           line = `${caret} ${item.name}${detail}  ${item.price}G`;
         }
         const y = contentY + index * 24;
         p.text(line, overlayArea.x + 16, y);
       });
     }
     p.text(
       "↑↓:選択 / Enter:決定 / B:買う / S:売る / ESC:閉じる",
       overlayArea.x + 16,
       overlayArea.y + overlayArea.height - 40
     );
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
     const selection = Math.min(Game.ui.state.inventory.selection, Math.max(items.length - 1, 0));
     const startY = overlayArea.y + 60;
     if (!items.length) {
       p.text("所持品は空です。", overlayArea.x + 16, startY);
       return;
     }
     items.forEach((itemId, index) => {
       const caret = index === selection ? ">" : " ";
       const meta = Game.ITEM_META[itemId];
       const equippedMark = Game.isItemEquipped(index) ? " (装備中)" : "";
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
       `Weapon: ${player.equip.weapon !== null ? "Bronze Sword" : "-"}`,
       `Shield: ${player.equip.shield !== null ? "Wood Shield" : "-"}`,
     ];
     lines.forEach((line, index) => {
       p.text(line, overlayArea.x + 16, overlayArea.y + 60 + index * 24);
     });
   }

   function drawInnOverlay(p) {
     drawOverlayFrame(p);
     p.fill(255);
     p.textAlign(p.LEFT, p.TOP);
     p.textSize(18);
     p.text("INN", overlayArea.x + 16, overlayArea.y + 14);
     p.textSize(16);
     const lines = [
       "",
       "宿泊料金: 10G",
       "効果: HP全回復",
       "",
       "Y:泊まる  N:やめる  ESC:閉じる",
     ];
     lines.forEach((line, index) => {
       p.text(line, overlayArea.x + 16, overlayArea.y + 50 + index * 24);
     });
   }

   function drawBattleOverlay(p = window) {
    if (!Game.combat.isActive()) return;
    drawOverlayFrame(p);
    const battle = Game.combat.getState();
    const enemy = battle.enemy;
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    const iconSize = 36;
    const iconX = overlayArea.x + 16;
    const iconY = overlayArea.y + 16;
    let textX = iconX;
    let enemyIconDrawn = false;
    if (
      enemy &&
      enemy.kind &&
      Game.entities &&
      typeof Game.entities.drawEnemy === "function"
    ) {
      enemyIconDrawn = Game.entities.drawEnemy(p, enemy.kind, iconX, iconY, {
        useScreenCoordinates: true,
        drawSize: iconSize,
      });
      if (enemyIconDrawn) {
        textX += iconSize + 12;
      }
    }
    if (!enemyIconDrawn) {
      p.push();
      p.noStroke();
      p.fill(200, 40, 40);
      p.rect(iconX, iconY, iconSize, iconSize);
      p.pop();
      textX += iconSize + 12;
    }
    const enemyName = enemy && enemy.name ? enemy.name : enemy && enemy.kind ? enemy.kind : "";
    p.textSize(20);
    p.text(`Enemy: ${enemyName}`, textX, overlayArea.y + 18);
    p.textSize(16);
    p.text(`HP ${enemy.hp}/${enemy.maxHp}`, textX, overlayArea.y + 48);
    p.text("A:攻撃  D:防御  R:逃走", textX, overlayArea.y + 72);
    p.text(
      `プレイヤーHP: ${Game.state.player.hp}/${Game.state.player.maxHp}`,
      textX,
      overlayArea.y + 96
    );
  }
  function drawClearOverlay(p = window) {
     if (!Game.flags || !Game.flags.cleared) return;
     p.push();
     p.noStroke();
     p.fill(0, 220);
     p.rect(0, 0, Game.config.canvasWidth, Game.config.canvasHeight);
     p.fill(255);
     p.textAlign(p.CENTER, p.CENTER);
     p.textSize(30);
     p.text("CONGRATULATIONS!", Game.config.canvasWidth / 2, Game.config.canvasHeight / 2 - 50);
     p.textSize(18);
     p.text(
       "Ancient Key で遺跡の門を開いた。Thanks for playing.",
       Game.config.canvasWidth / 2,
       Game.config.canvasHeight / 2
     );
     p.text(
       "Enter: 最初からやり直す",
       Game.config.canvasWidth / 2,
       Game.config.canvasHeight / 2 + 40
     );
     p.pop();
   }

   function drawOverlayFrame(p) {
     p.push();
     p.noStroke();
     p.fill(0, 200);
     p.rect(overlayArea.x, overlayArea.y, overlayArea.width, overlayArea.height, 10);
     p.stroke(220);
     p.noFill();
     p.rect(overlayArea.x, overlayArea.y, overlayArea.width, overlayArea.height, 10);
     p.pop();
   }

   Game.renderer = {
     layout,
     drawMap,
     drawEntities,
     drawUI: drawPanels,
     drawOverlays,
     drawBattleOverlay,
     drawClearOverlay,
   };
 })();






