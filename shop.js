 (function () {
   // ショップとのやり取りを管理
   const Game = (window.Game = window.Game || {});

   const SHOP_ITEMS = [
     Game.ITEM.FOOD10,
     Game.ITEM.POTION,
     Game.ITEM.BRONZE_SWORD,
     Game.ITEM.WOOD_SHIELD,
   ];

   function tryOpenShop() {
     const state = Game.state;
     if (state.scene !== state.merchant.scene) {
       Game.pushMessage("ここには商人がいない。");
       return false;
     }
     if (!Game.utils.isAdjacent(state.playerPos, state.merchant.pos)) {
       Game.pushMessage("もう一歩近づこう。");
       return false;
     }
     Game.pushMessage("商人: いらっしゃいませ。何をお探しですか？");
     Game.ui.open(Game.ui.OVERLAY.SHOP);
     return true;
   }

   function closeShop() {
     if (Game.ui.state.overlay === Game.ui.OVERLAY.SHOP) {
       Game.ui.close();
     }
   }

   function handleInput(keyValue, keyCode) {
     const shopState = Game.ui.state.shop;
     const upper = (keyValue || "").toUpperCase();
     if (keyCode === window.ESCAPE || upper === "ESCAPE") {
       closeShop();
       return;
     }
     if (upper === "B") {
       if (shopState.mode !== "BUY") {
         changeMode("BUY");
       } else {
         handleBuy();
       }
       return;
     }
     if (upper === "S") {
       if (shopState.mode !== "SELL") {
         changeMode("SELL");
       } else {
         handleSell();
       }
       return;
     }
     if (keyCode === window.UP_ARROW) {
       moveSelection(-1);
       return;
     }
     if (keyCode === window.DOWN_ARROW) {
       moveSelection(1);
       return;
     }
     if (keyCode === window.ENTER) {
       confirmSelection(shopState.mode);
     }
   }

   function changeMode(mode) {
     const shopState = Game.ui.state.shop;
     if (shopState.mode === mode) return;
     shopState.mode = mode;
     shopState.selection = 0;
   }

   function moveSelection(delta) {
     const shopState = Game.ui.state.shop;
     const list = shopState.mode === "SELL" ? getSellOptions() : SHOP_ITEMS;
     if (!list.length) return;
     const maxIndex = list.length - 1;
     shopState.selection = Game.utils.clamp(shopState.selection + delta, 0, maxIndex);
   }

   function confirmSelection(mode) {
     if (mode === "SELL") {
       handleSell();
     } else {
       handleBuy();
     }
   }

   function handleBuy() {
     const shopState = Game.ui.state.shop;
     const itemId = SHOP_ITEMS[shopState.selection];
     if (!itemId) return;
     const result = Game.buyItem(itemId);
     Game.pushMessage(result.message);
   }

   function handleSell() {
     const shopState = Game.ui.state.shop;
     const sellList = getSellOptions();
     if (!sellList.length) {
       Game.pushMessage("売れるアイテムがない。");
       return;
     }
     const index = Game.utils.clamp(shopState.selection, 0, sellList.length - 1);
     const target = sellList[index];
     if (!target.canSell) {
       Game.pushMessage(target.reason || "今は売却できない。");
       return;
     }
     const result = Game.sellItem(target.index);
     Game.pushMessage(result.message);
     const nextSellList = getSellOptions();
     if (nextSellList.length === 0) {
       shopState.selection = 0;
     } else if (shopState.selection >= nextSellList.length) {
       shopState.selection = Math.max(0, nextSellList.length - 1);
     }
   }

   function getBuyOptions() {
     return SHOP_ITEMS.map((id) => {
       const meta = Game.ITEM_META[id];
       return {
         id,
         name: meta ? meta.name : id,
         detail: meta ? meta.detail : "",
         price: Game.PRICE[id] || 0,
       };
     });
   }

   function getSellOptions() {
     const inventory = Game.state.player.inventory;
     return inventory.map((itemId, index) => {
       const meta = Game.ITEM_META[itemId];
       const price = Math.floor((Game.PRICE[itemId] || 0) / 2);
       const equipped = Game.isItemEquipped(index);
       let canSell = price > 0 && !equipped;
       let reason = null;
       if (equipped) reason = "装備中は売却できない。";
       if (price === 0) reason = "売値が設定されていない。";
       return {
         id: itemId,
         index,
         name: meta ? meta.name : itemId,
         detail: meta ? meta.detail : "",
         price,
         equipped,
         canSell,
         reason,
       };
     });
   }

   function getState() {
     return {
       mode: Game.ui.state.shop.mode,
       selection: Game.ui.state.shop.selection,
     };
   }

   Game.shop = {
     tryOpen: tryOpenShop,
     close: closeShop,
     handleInput,
     getBuyOptions,
     getSellOptions,
     getState,
   };
 })();
