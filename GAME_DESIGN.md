# Ultima-like RPG Design Document
Version: 0.3 / Target: Browser / Engine: p5.js / Canvas: 800x600 / Grid: 24x18 (tile 48px)

## 0. プロジェクト概要
- **世界観**: 小さな諸島を探索し、Ancient Key を入手して古代の扉を開く短編RPG。
- **MVPゴール**: FIELD で Ancient Key を見つけ、RUINS のイベントでゲームクリアメッセージを表示する。
- **ゲームループ**: 探索 → 戦闘 → 補給/装備 → 再探索。
- **失敗条件**: HP=0 で FIELD の安全な地点へ帰還 (HP 全回復)。Food=0 の状態で移動すると HP が減少。
- **成長要素**: Food/G​old を管理し、装備購入や経験値レベルアップで能力を上げる。

## 1. シーンとマップ
| Scene  | 目的                         | サイズ | 主なタイル種別                                               | 備考 |
|--------|------------------------------|--------|--------------------------------------------------------------|------|
| FIELD  | フィールド (屋外)            | 24x18 | GRASS, ROAD, WATER, MOUNTAIN, ROCK, TREE, RUINS, ENTRANCE_* | 街/洞窟入口、Ancient Key イベント、敵スポーン 3～5 体 |
| TOWN   | 街 (補給拠点)                | 24x18 | WALL, FLOOR_BUILD, ROAD, TREE, DOOR                         | 商人と宿屋が常駐。街内で敵は出現しない |
| CAVE   | 洞窟                         | 24x18 | FLOOR_CAVE, ROCK, STAIRS_UP, ENTRANCE_CAVE                  | 宝箱イベントと敵スポーン 2～4 体 |

### シーン遷移
- FIELD ↔ TOWN: `ENTRANCE_TOWN` / 街のドアを介して相互遷移。街からは南北 2 箇所の出口を用意。
- FIELD ↔ CAVE: `ENTRANCE_CAVE` と洞窟内の `STAIRS_UP` でリンク。

### イベント配置
- 洞窟: `{x:10, y:8}` に Treasure Chest。未開封なら Ancient Key を入手し `hasKey=true`。
- フィールド: `{x:5, y:5}` に RUINS。`hasKey` 取得済みで到達するとゲームクリア (フラグ `cleared=true`)。

## 2. グラフィックと UI
- **タイルサイズ**: 48px。表示用 `tiles.png` (1 タイル 48x48, 8 列) を使用。
- **スプライトシート**  
  - `actors.png`: プレイヤー、商人、宿屋 NPC の俯瞰スプライト (48x48 単体)。
  - `enemies.png`: SLIME/BAT/SPIDER/GHOST/VAMPIRE/TROLL/DRAGON の順に 48x48。  
  - `objects_interactable.png`: 宝箱 (CHEST) などインタラクト可能オブジェクトを配置。今後もここへ追加。
- **レイアウト**  
  - マップ領域: 800x480。カメラはプレイヤー中心で平行スクロール。  
  - 下部パネル: 幅 800、高さ 120。左側がステータス、右側がメッセージ (最大 4 行)。  
  - オーバーレイ (ショップ・インベントリ・ステータス・宿屋・バトル) はカメラ外の半透明パネルへ描画。
- **フォールバック**: スプライトが読み込めない場合は単色矩形で代替表示。

## 3. NPC / オブジェクト
- **商人**: TOWN `{x:13, y:3}`。`T` で会話しショップ UI を開く。
- **宿屋**: TOWN `{x:9, y:3}`。`T` で会話し宿泊選択 (10G で HP 全回復)。
- **プレイヤー**: 初期位置 `{x:2, y:2}` FIELD。アクションは矢印キー/ WASD / Enter / Esc。
- **宝箱 (CHEST)**: CAVE `{x:10, y:8}`。未開封なら Ancient Key を取得しフラグ管理。
- **RUINS**: FIELD `{x:5, y:5}`。Ancient Key 所持でゲームクリア演出を表示。
- **マップ遷移タイル**: `ENTRANCE_TOWN`, `ENTRANCE_CAVE`, `DOOR`, `STAIRS_UP/STAIRS_DOWN`。

## 4. プレイヤー成長とアイテム
- **初期ステータス**: HP30 / ATK5 / DEF3 / LV1 / EXP0 / Food50 / Gold50。装備枠は weapon/shield の 2 種。
- **レベル上限**: `LV_THRESH = [10, 30, 60, 100, 160]`。レベルアップで HP+5, ATK+1, DEF+1, HP 即時 +5。
- **アイテム**: インベントリ 6 スロット。 `FOOD10`, `POTION`, `BRONZE_SWORD`, `WOOD_SHIELD`, `ANCIENT_KEY`。
- **Food 消費**: FIELD/CAVE で 2 ターンに 1 減少 (0 で HP 毎ターン -1)。TOWN では消費なし。
- **敗北処理**: HP0 で FIELD の安全地点に復帰し、HP 全回復 (`resetPlayerToSafePoint`)。

## 5. 敵システム
- **敵種別**: SLIME, BAT, SPIDER, GHOST, VAMPIRE, TROLL, DRAGON。各種の HP/ATK/DEF/EXP/Gold はレンジ指定。
- **スポーン数**: FIELD で 3～5 体、CAVE で 2～4 体を維持。ドラゴンは FIELD の RUINS 周辺に 1 体固定スポーン。
- **リスポーン**: プレイヤーが 20 歩移動ごとに、上限数まで追加出現 (`RES​PAWN_STEP_THRESHOLD=20`)。
- **行動**: プレイヤーとの距離が 7 未満で追跡。隣接すると戦闘開始 (`Game.combat.startBattle`)。
- **戦闘**: バトル UI に敵スプライト + ステータスを表示。A 攻撃 / D 防御 / R 逃走。
- **討伐報酬**: EXP, Gold, HP +3。DRAGON 撃破で `dragonDefeated=true`。

## 6. メッセージ / UI ロジック
- `Game.pushMessage` は {text, icon} 形式の最大 4 件を保持。敵関連メッセージはスプライトアイコンを表示。
- オーバーレイ UI: SHOP, INVENTORY, STATUS, INN, BATTLE, CLEAR を `Game.renderer` が描画。
- メッセージ欄・戦闘画面はスプライトが使えない場合に単色矩形へフォールバック。

## 7. システム補足
- `Game.flags`: `hasKey`, `cleared`, `starvingNotified`, `dragonDefeated` を管理。
- `Game.occupancy`: マップ内の進入可否を再構築し、NPC/敵/イベントの重複を防止。  
- `Game.entities`: 敵スポーン、追跡、描画、宝箱などのインタラクト処理を一括管理。
- `Game.ui`: オーバーレイの状態制御 (ショップ、インベントリなど)。
- `Game.config`: キャンバス 800x600、tileSize 48、gridWidth 24、gridHeight 18 を定義。
- アセット読み込み: `sketch.js` の `preload` で `tiles.png`, `actors.png`, `enemies.png`, `objects_interactable.png` を取得。

## 8. 今後の拡張メモ
- `objects_interactable.png` に宝箱以外のインタラクトオブジェクト (看板、樽、祭壇など) を追加予定。
- プレイヤー/敵のアニメーション差し替え時はスプライトシートの列管理を `renderer`/`entities` で拡張する。
- UI アイコン シート (HP/Gold アイコン等) を別途用意し、メッセージ/パネル表示を強化する予定。
