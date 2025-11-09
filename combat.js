 (function () {
   // ターン制の簡易戦闘を管理
   const Game = (window.Game = window.Game || {});

   function isActive() {
     return !!Game.battle.active;
   }

  function startBattle(enemyInstance) {
    if (!enemyInstance || Game.battle.active) return;
    Game.battle.active = true;
    const enemyName = enemyInstance.name || enemyInstance.kind;
    Game.battle.enemy = {
      instanceId: enemyInstance.id,
      kind: enemyInstance.kind,
      name: enemyName,
      hp: enemyInstance.hp,
      maxHp: enemyInstance.maxHp,
      atk: enemyInstance.atk,
      def: enemyInstance.def,
       exp: enemyInstance.exp,
       gold: enemyInstance.gold,
     };
     Game.battle.turn = "PLAYER";
     Game.battle.playerDefending = false;
     Game.battle.returnScene = Game.state.scene;
     Game.battle.returnPos = { ...Game.state.playerPos };
    Game.pushMessage({
      text: `${enemyName} があらわれた！`,
      icon: {
        type: "enemy",
        kind: enemyInstance.kind,
        label: enemyName,
      },
    });
   }

   function playerAction(action) {
     if (!Game.battle.active || Game.battle.turn !== "PLAYER") return;
     switch (action) {
       case "ATTACK":
         handlePlayerAttack();
         break;
       case "DEFEND":
         handlePlayerDefend();
         break;
       case "RUN":
         handlePlayerRun();
         break;
       default:
         break;
     }
   }

   function handlePlayerAttack() {
     const playerStats = Game.getPlayerEffectiveStats();
     const enemy = Game.battle.enemy;
     const variance = Game.utils.randInt(0, 2);
     const dmg = Math.max(1, playerStats.atk + variance - enemy.def);
     enemy.hp = Math.max(0, enemy.hp - dmg);
     Game.pushMessage(`攻撃！ ${dmg} ダメージを与えた。`);
     if (enemy.hp <= 0) {
       handleVictory();
       return;
     }
     Game.battle.turn = "ENEMY";
     enemyTurn();
   }

   function handlePlayerDefend() {
     Game.battle.playerDefending = true;
     Game.pushMessage("身を固めた…");
     Game.battle.turn = "ENEMY";
     enemyTurn();
   }

   function handlePlayerRun() {
     const success = Math.random() < 0.5;
     if (success) {
       Game.pushMessage("うまく逃げ切った！");
       endBattle();
     } else {
       Game.pushMessage("逃げられなかった。");
       Game.battle.turn = "ENEMY";
       enemyTurn();
     }
   }

   function enemyTurn() {
     const enemy = Game.battle.enemy;
     const playerStats = Game.getPlayerEffectiveStats();
     const variance = Game.utils.randInt(0, 2);
     let dmg = Math.max(1, enemy.atk + variance - playerStats.def);
     if (Game.battle.playerDefending) {
       dmg = Math.ceil(dmg / 2);
     }
     Game.battle.playerDefending = false;
     Game.state.player.hp = Math.max(0, Game.state.player.hp - dmg);
    Game.pushMessage({
      text: `${enemy.name} の攻撃！ ${dmg} ダメージを受けた。`,
      icon: {
        type: "enemy",
        kind: enemy.kind,
        label: enemy.name,
      },
    });
     if (Game.state.player.hp <= 0) {
       handleDefeat();
       return;
     }
     Game.battle.turn = "PLAYER";
   }

   function handleVictory() {
     const enemy = Game.battle.enemy;
     Game.state.player.gold += enemy.gold;
     Game.grantExp(enemy.exp);
     Game.pushMessage(`勝利！ EXP +${enemy.exp} / Gold +${enemy.gold}`);
     Game.entities.removeEnemyById(enemy.instanceId);
     endBattle();
   }

   function handleDefeat() {
     Game.pushMessage("倒れてしまった…");
     Game.resetPlayerToSafePoint();
     endBattle();
   }

   function endBattle() {
     Game.battle.active = false;
     Game.battle.enemy = null;
     Game.battle.playerDefending = false;
     Game.battle.turn = "PLAYER";
     Game.occupancy.markDirty();
   }

   function getState() {
     return Game.battle;
   }

   Game.combat = {
     startBattle,
     playerAction,
     isActive,
     getState,
   };
 })();
