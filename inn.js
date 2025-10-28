(function () {
  // 宿屋の操作とUIロジック
  window.Game = window.Game || {};

  const INN_COST = 10;

  function tryOpenInn() {
    const state = Game.state;
    if (state.scene !== state.innkeeper.scene) {
      Game.pushMessage("この場所には宿屋がない。");
      return false;
    }
    if (!Game.utils.isAdjacent(state.playerPos, state.innkeeper.pos)) {
      Game.pushMessage("もう一歩近づこう。");
      return false;
    }
    Game.pushMessage("宿屋の主人が話しかけてきた。");
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
      Game.pushMessage("また来てね。");
      return;
    }
    if (upper === "Y" || keyCode === window.ENTER) {
      stayAtInn();
      return;
    }
    if (upper === "N") {
      closeInn();
      Game.pushMessage("また来てね。");
      return;
    }
  }

  function stayAtInn() {
    const player = Game.state.player;

    if (player.hp >= player.maxHp) {
      Game.pushMessage("HPは既に最大だ。");
      return;
    }

    if (player.gold < INN_COST) {
      Game.pushMessage("Goldが足りない。");
      return;
    }

    player.gold -= INN_COST;
    player.hp = player.maxHp;
    Game.pushMessage(`${INN_COST}Gを支払った。`);
    Game.pushMessage("ぐっすり眠った。HPが全回復した！");
    closeInn();
  }

  Game.inn = {
    tryOpen: tryOpenInn,
    close: closeInn,
    handleInput,
  };
})();