 (function () {
   // 描画周りの処理をまとめて管理
   const Game = (window.Game = window.Game || {});

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
     drawEventEntities(p, camera);
     if (Game.entities && Game.entities.drawEnemies) {
       Game.entities.drawEnemies(p, camera);
     }
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
     if (state.scene === state.innkeeper.scene) {
       Game.entities.drawEmoji(
         p,
         Game.entities.EMOJI_MAP.INNKEEPER,
         state.innkeeper.pos.x,
         state.innkeeper.pos.y,
         {
           offsetX: -camera.x,
           offsetY: -camera.y,
         }
       );
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
         Game.entities.drawEmoji(p, Game.entities.EMOJI_MAP.CHEST, pos.x, pos.y, {
           offsetX: -camera.x,
           offsetY: -camera.y,
         });
       });
     }
     if (events.ruins) {
       Game.entities.drawEmoji(p, Game.entities.EMOJI_MAP.RUINS, events.ruins.x, events.ruins.y, {
         offsetX: -camera.x,
         offsetY: -camera.y,
       });
     }
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
     messages.forEach((line, index) => {
       p.text(line, x + 12, y + 12 + index * 24);
     });
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

   function drawCommandPanel(p) {
     const y = layout.mapAreaHeight + layout.panelHeight;
     const height = layout.panelHeight;
     p.fill(10, 10, 10);
     p.stroke(80);
     p.rect(0, y, Game.config.canvasWidth, height);
     p.fill(220);
     p.textAlign(p.LEFT, p.TOP);
     p.textSize(16);
    const lines = [
      "矢印キー:移動  T:会話  I:所持品  U:使用  S:ステータス",
      "A/D/R:戦闘コマンド  B/S:ショップ  ESC:閉じる",
    ];
     lines.forEach((line, index) => {
       p.text(line, 12, y + 12 + index * 24);
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
     p.textSize(20);
     p.text(
       `Enemy: ${enemy.emoji}  HP ${enemy.hp}/${enemy.maxHp}`,
       overlayArea.x + 16,
       overlayArea.y + 18
     );
     p.textSize(16);
     p.text("A:攻撃  D:防御  R:逃げる", overlayArea.x + 16, overlayArea.y + 52);
     p.text(
       `プレイヤーHP: ${Game.state.player.hp}/${Game.state.player.maxHp}`,
       overlayArea.x + 16,
       overlayArea.y + 84
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
