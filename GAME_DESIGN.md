# Ultima-like RPG Design (実装版)
Version: 0.2 / Target: Browser / Engine: p5.js / Canvas: 800x600 / Grid: 24x18 (tile 40px)

## 0. 開発方針
- **世界観**: 小さな島に拠点と遺跡が存在し、プレイヤーは古代の鍵を入手して遺跡を開放する。
- **MVPゴール**: Ancient Key を手に入れ、FIELD 上の遺跡で使用してゲームクリアメッセージを出す。
- **ゲームループ**: 探索 → 敵との遭遇 → 戦闘 → 村で準備 → 再出撃。
- **失敗条件**: HP=0 で自動的にフィールド最初の地点へ帰還（HPは最大まで回復）。Food=0 の歩行中は一定間隔で HP が減少。
- **収集要素**: Food と Gold を集め、装備や回復アイテムを購入する。

## 1. シーンとマップ
| Scene  | 概要                         | サイズ | 主なタイル / 特徴                                            | ハンガー | 備考 |
|--------|------------------------------|--------|--------------------------------------------------------------|---------|------|
| FIELD  | フィールド（島全体）         | 24x18 | Grass, Road, Water, Mountain, Rock, Tree, Ruins, Entrance   | 減少    | 遺跡(Ruins)と村/洞窟入口が存在。敵 3〜5 体を常時維持。
| VILLAGE| 村（商人・宿屋）              | 24x18 | Wall, Indoor Floor, Shop Floor, Road, Tree                  | なし    | 南北に 2 箇所の扉（DOOR）。北扉の床は Shop Floor。
| CAVE   | 洞窟                         | 24x18 | Cave Floor, Rock, Entrance                                  | 減少    | 敵 2〜4 体を常時維持。宝箱イベントが存在。

### マップ遷移
- FIELD → VILLAGE: タイル `ENTRANCE_VIL` に触れると遷移。スポーン: VILLAGE の南扉直上。
- VILLAGE → FIELD: 南扉は `fromVillageSouth`（FIELD 側は村タイルの 1 マス上）、北扉は `fromVillageNorth`（村タイルの 1 マス下）。
- FIELD → CAVE: タイル `ENTRANCE_CAVE` に触れると遷移。スポーン: 洞窟入口直下。
- CAVE → FIELD: 洞窟入口タイルから遷移。スポーン: FIELD の洞窟入口の 1 マス下。

### イベント配置
- CAVE: 宝箱 `{x:10, y:8}` を開くと Ancient Key を取得（フラグ管理）。
- FIELD: 遺跡 `{x:5, y:5}`。Ancient Key 所持でクリア演出。Enter キーでゲームを初期化。

## 2. 描画・レイアウト
- タイルサイズ: 40px。内部的に 24x18 のグリッドを持ち、カメラでプレイヤーを中心にスクロール。
- 画面構成
  - マップ領域: 800x360。
  - メッセージパネル: 400x120（最新 3 件を左下に表示）。
  - ステータスパネル: 400x120（右下）。
  - コマンドパネル: 800x120（下端、キー操作のヘルプ）。
- タイルカラー
  - Grass `#7CCB5B`, Road `#B57A43`, Water `#2F6DD5`
  - Indoor Floor `#8B4B4B`, Shop Floor `#5A3A2A`, Cave Floor `#444444`
  - Mountain `#5B4E3A`, Rock `#555555`, Tree `#5DA147`, Wall `#703737`, Door `#B57A43`, Ruins `#6B4F4F`
- メッセージログは `Game.state.messages` の最新 3 件のみ保持。

## 3. NPC / オブジェクト
- 商人: VILLAGE `{x:13, y:3}`。`T` で会話してショップを開く。
- 宿屋主人: VILLAGE `{x:9, y:3}`。`T` で会話すると宿屋 UI。
- 宝箱: CAVE `{x:10, y:8}`。開封するとフラグ `hasKey` が true。
- 遺跡: FIELD `{x:5, y:5}`。`hasKey` が true のときに接触するとエンディング。
- 入口タイル: `ENTRANCE_VIL`, `ENTRANCE_CAVE`。
- DOOR タイル: VILLAGE の南北 2 箇所。

## 4. プレイヤー情報
- 初期ステータス: HP30 / ATK5 / DEF3 / LV1 / EXP0 / Food50 / Gold50。
- 装備: weapon, shield をインデックスで管理（所持品 6 枠）。
- レベル閾値: `[10, 30, 60, 100, 160]`。レベルアップで HP+5, ATK+1, DEF+1, HP 追加回復+5。
- Food 消費: FIELD/CAVE で 2 歩ごとに Food-1（0 で HP-1）。VILLAGE では消費なし。
- HP0: メッセージ後、FIELD 初期地点に戻り HP/ステータスを立て直す。

## 5. アイテム
| ID            | 名前         | 説明      | 価格 | 備考                |
|---------------|--------------|-----------|------|---------------------|
| FOOD10        | Food×10      | Food +10  | 10G  | 所持数上限 999。
| POTION        | Potion       | HP +20    | 15G  | 使用で消費。
| BRONZE_SWORD  | Bronze Sword | ATK +2    | 40G  | 装備スロット weapon。
| WOOD_SHIELD   | Wood Shield  | DEF +2    | 35G  | 装備スロット shield。
| ANCIENT_KEY   | Ancient Key  | 進行用    | -    | `progressFlags.hasKey` で管理（インベントリ非表示）。

- 所持品枠は 6。使用はインベントリオーバーレイ内で `U` キー。
- アイテム説明は `Game.describeItem`、Enter で詳細メッセージを表示。

## 6. ショップ
- 起動: 商人に隣接して `T`。
- 操作: `B`=BUY / `S`=SELL でモード切替。`↑↓` で選択、`Enter` で購入/売却。`ESC` で閉じる。
- 表示: BUY/Sell リスト、説明文、下部に操作ヒント（B/S/ESC）。
- 売却: 装備中アイテムは売却不可。価格は購入価格の 50%（切り捨て）。

## 7. 宿屋
- 起動: 宿屋主人に隣接して `T`。
- UI: Y=泊まる / N=やめる / ESC=閉じる。
- 価格: 10G。HP が最大のときは宿泊不可メッセージ。
- 宿泊で HP=Max に回復、Gold を消費。

## 8. 操作入力 (ゲーム全体)
- 矢印キー: 移動。
- T: 会話（商人/宿屋主人）。
- I: インベントリオーバーレイを開閉。
- U: インベントリ表示中のみ使用。フィールド上では「インベントリを開いてから使用」メッセージ。
- S: ステータスオーバーレイを開閉。
- B/S: ショップ内でモード切替・購入/売却。
- Y/N: 宿屋の選択肢。
- ESC: オーバーレイの閉鎖、戦闘時は無効。
- Enter: ショップで決定 / インベントリで詳細表示 / クリア演出中の再開。
- 戦闘時: A=Attack / D=Defend / R=Run。

## 9. 敵データ
| ID      | 出現シーン | HP      | ATK   | DEF  | EXP  | Gold |
|---------|------------|---------|-------|------|------|------|
| SLIME   | FIELD      | 8〜12   | 2〜3  | 0    | 3〜5 | 4〜8 |
| BAT     | FIELD      | 14〜18  | 3〜4  | 0〜1 | 6〜8 | 8〜12|
| SPIDER  | FIELD      | 20〜26  | 4〜6  | 1〜2 | 9〜12| 12〜16|
| GHOST   | CAVE       | 28〜34  | 6〜7  | 2〜3 | 12〜16|16〜20|
| VAMPIRE | CAVE       | 36〜44  | 7〜9  | 3〜4 | 18〜24|22〜28|
| TROLL   | CAVE       | 48〜58  | 9〜11 | 4〜5 | 24〜32|28〜36|
| DRAGON  | FIELD 固定 | 60〜80  | 9〜11 | 4〜5 | 30〜40|35〜50|

- フィールド敵: 3〜5 体を維持（ドラゴン含む）。洞窟敵: 2〜4 体。
- 敵再出現: プレイヤー歩数カウンターが 20 に達すると補充判定。

## 10. 敵AI
- ドラゴン以外の敵は `Game.utils.distance` が 6 以下のとき A* で最短経路を検索し、1 マスずつプレイヤーへ接近。
- 距離が 7 以上のときは移動しない。
- 川・山・岩・壁など `Game.TILE_BLOCKED` は通行不可。占有済みマス（NPC/他敵/プレイヤー）は進入不可。
- 敵がプレイヤーのマスに到達すると即座に `Game.combat.startBattle`。

## 11. 戦闘
- ターン制。プレイヤー先攻で「A 攻撃 / D 防御 / R 逃走」。
- ダメージ計算: `damage = max(1, ATK + rand(0..2) - DEF)`。
- 防御: そのターンの被ダメージを 50%（切り上げ）に軽減。
- 逃走: 成功率 50%。失敗時は敵ターン。
- 勝利: HP+3（最大値まで）、EXP、Gold を獲得。アイテムドロップはなし。
- 敗北: メッセージ後に安全地点へ復帰し、HP 全快。

## 12. 進行フロー
1. FIELD で敵と戦いながら Gold/Food を稼ぐ。
2. VILLAGE で装備やアイテムを補充し、必要なら宿屋で回復。
3. CAVE の宝箱で Ancient Key を入手。
4. FIELD の遺跡へ向かい、鍵を所持した状態で接触してクリア。
5. Enter キーで新規ゲームを開始（状態リセット）。

## 13. データ / フラグ管理
- `Game.state` がシーン、プレイヤー座標、敵リスト、メッセージなどを保持。
- `Game.flags` は `hasKey`, `cleared`, `starvingNotified`, `dragonDefeated` を管理。
- `Game.occupancy` がタイル占有状態を構築し、NPC・敵・宝箱などの衝突を防ぐ。
- 敵生成は `Game.entities.ensureFieldEnemies` / `ensureCaveEnemies` が担当。
- メッセージは `Game.pushMessage` 経由で投入し、常に最新 3 件に丸め込む。

## 14. 今後の拡張候補
- Magic/MP、複数村、クエスト、音源などは未実装。`Gap.md` に差分と課題を記録。
