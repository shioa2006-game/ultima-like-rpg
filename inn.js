 (function () {
   // 宿屋での会話と宿泊を管理
   const Game = (window.Game = window.Game || {});

   const INN_COST = 10;

   function tryOpenInn() {
     const state = Game.state;
     if (state.scene !== state.innkeeper.scene) {
       Game.pushMessage("ここには宿屋がない。");
       return false;
     }
     if (!Game.utils.isAdjacent(state.playerPos, state.innkeeper.pos)) {
       Game.pushMessage("もう一歩近づこう。");
       return false;
     }
     Game.pushMessage("宿屋の主人: いらっしゃいませ。一晩 10G で泊まっていきますか？");
     Game.ui.open(Game.ui.OVERLAY.INN);
     return true;
   }

   function closeInn() {
     if (Game.ui.state.overlay === Game.ui.OVERLAY.INN) {
       Game.ui.close();
     }
   }

   function handleInput(keyValue, keyCode) {
     const upper = (keyValue || "").toUpperCase();
     if (keyCode === window.ESCAPE || upper === "ESCAPE") {
       closeInn();
       Game.pushMessage("またどうぞ。");
       return;
     }
     if (upper === "Y" || keyCode === window.ENTER) {
       stayAtInn();
       return;
     }
     if (upper === "N") {
       closeInn();
       Game.pushMessage("またどうぞ。");
       return;
     }
   }

   function stayAtInn() {
     const player = Game.state.player;
     if (player.hp >= player.maxHp) {
       Game.pushMessage("HP は既に最大だ。");
       return;
     }
     if (player.gold < INN_COST) {
       Game.pushMessage("Gold が足りない。");
       return;
     }
     player.gold -= INN_COST;
     player.hp = player.maxHp;
     Game.pushMessage(`${INN_COST}G を支払った。`);
     Game.pushMessage("ぐっすり眠り、HP が全回復した。");
     closeInn();
   }

   Game.inn = {
     tryOpen: tryOpenInn,
     close: closeInn,
     handleInput,
   };
 })();

