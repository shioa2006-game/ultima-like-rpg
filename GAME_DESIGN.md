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

## 9. NPC対話システム

### 9.1 システム概要
NPCとの対話をストーリー進行段階に応じて動的に変更するシステム。セリフデータをJSON外部化することで、プログラムコードとコンテンツを分離し、保守性と拡張性を確保する。

**設計方針**:
- **データ駆動型**: セリフデータは `assets/dialogues.json` で管理
- **ロジック分離**: 対話ロジックは `dialogue.js` モジュールで実装
- **段階管理**: ゲーム進行を明確な段階 (STORY_PHASE) で区分
- **フォールバック機能**: データロード失敗時やセリフ未定義時の対応

### 9.2 キャラクタータイプの分類

#### 機能的キャラクター (Functional NPCs)
定型的な機能を提供するNPC。セリフは固定。
- **商人** (Merchant): アイテム売買UI提供 → `shop.js`
- **宿屋主人** (Innkeeper): HP回復サービス → `inn.js`
- (将来: 鍛冶屋、銀行、クエスト掲示板など)

#### ストーリーキャラクター (Story NPCs)
ストーリー進行に応じてセリフが変化するNPC。`dialogue.js` で管理。
- **王様** (King): メインストーリーの進行役
- (将来: 大臣、兵士、村人、冒険者など)

### 9.3 ストーリー進行段階 (STORY_PHASE)

ゲームの進行状態を以下の5段階で管理：

| フェーズID | 名称 | 条件 | 説明 |
|-----------|------|------|------|
| 0 | START | ゲーム開始時 | クエスト説明、世界観導入 |
| 1 | QUEST_GIVEN | クエスト受領後 | (将来的に実装予定) |
| 2 | KEY_OBTAINED | `progressFlags.hasKey === true` | Ancient Key 入手後 |
| 3 | DRAGON_DEFEATED | `flags.dragonDefeated === true` | ドラゴン撃破後 |
| 4 | CLEARED | `progressFlags.cleared === true` | ゲームクリア後 |

**判定ロジック** (`dialogue.js::getCurrentPhase()`):
```javascript
if (state.progressFlags.cleared) return STORY_PHASE.CLEARED;
if (flags.dragonDefeated) return STORY_PHASE.DRAGON_DEFEATED;
if (state.progressFlags.hasKey) return STORY_PHASE.KEY_OBTAINED;
return STORY_PHASE.START;
```

### 9.4 JSONスキーマ設計

#### ファイル構成
```
assets/
├─ dialogues.json    // 会話データ（日本語）
├─ actors.png        // 既存
├─ enemies.png       // 既存
└─ ...
```

#### スキーマ構造 (`assets/dialogues.json`)
```json
{
  "version": "1.0.0",
  "storyPhases": {
    "START": 0,
    "QUEST_GIVEN": 1,
    "KEY_OBTAINED": 2,
    "DRAGON_DEFEATED": 3,
    "CLEARED": 4
  },
  "characters": {
    "<キャラクターID>": {
      "name": "<表示名>",
      "dialogues": {
        "<フェーズID(数値文字列)>": [
          "<セリフ1>",
          "<セリフ2>",
          "..."
        ]
      }
    }
  }
}
```

**フィールド仕様**:
- `version`: スキーマバージョン（将来の互換性管理用）
- `storyPhases`: フェーズ定義（定数マッピング）
- `characters`: キャラクターごとのデータ
  - `name`: UI表示用の名前
  - `dialogues`: フェーズIDをキーとしたセリフ配列
    - キーは文字列型（JSONの制約）
    - 値は文字列配列（複数行のセリフを順次表示）

### 9.5 王様のセリフ実装内容

TOWN `{x:18, y:2}` に配置されている王様のセリフ定義：

```json
{
  "king": {
    "name": "王様",
    "dialogues": {
      "0": [
        "王様: よく来た、勇者よ。",
        "王様: 東の遺跡に古代のドラゴンが現れたという報告がある。",
        "王様: 遺跡の扉を開けるには Ancient Key が必要だ。",
        "王様: 洞窟の奥深くに眠っているらしい。探してきてくれないか？"
      ],
      "2": [
        "王様: Ancient Key を手に入れたか！",
        "王様: これで遺跡の扉を開けられるぞ。気をつけて向かうのだ。"
      ],
      "3": [
        "王様: ドラゴンを倒したと聞いた。よくやった！",
        "王様: まだ遺跡の奥に何かあるかもしれん。"
      ],
      "4": [
        "王様: 見事だ！この国の危機を救ってくれた。",
        "王様: そなたこそ真の勇者だ。ゆっくり休むと良い。"
      ]
    }
  }
}
```

**セリフ設計のポイント**:
- フェーズ0: クエスト説明とゲーム目標の明示
- フェーズ2: 鍵入手を祝福し、次の目標（遺跡）を示唆
- フェーズ3: ドラゴン撃破を称賛、さらなる探索を促す
- フェーズ4: 最終的な勝利を祝福、プレイヤーの功績を称える
- フェーズ1は未定義（将来的にクエスト受諾システムで使用予定）

### 9.6 dialogue.js モジュール仕様

#### 責務
- JSONデータのロード・管理
- 現在のストーリー段階判定
- キャラクターとの対話実行
- フォールバック処理（データ不備時）

#### 公開API
```javascript
Game.dialogue = {
  // JSONロード（preload()から呼び出し）
  loadDialogues(p5Instance): Promise<Object>

  // キャラクターとの会話実行
  talk(characterId: string): void

  // 現在のストーリー段階取得
  getCurrentPhase(): number

  // データロード状態確認
  isReady(): boolean

  // デバッグ用：キャラクターリスト取得
  getCharacterList(): string[]

  // フェーズ定数（読み取り専用）
  STORY_PHASE: Object
}
```

#### 主要メソッド詳細

**`loadDialogues(p5Instance)`**
- p5.jsの`loadJSON()`を使用してassets/dialogues.jsonをロード
- 成功時: `dialogueData`に格納、`STORY_PHASE`を初期化
- 失敗時: フォールバックデータ（最小限のセリフ）を生成
- Promiseで完了を通知

**`talk(characterId)`**
- 現在のフェーズを取得 (`getCurrentPhase()`)
- JSONから該当キャラクター・該当フェーズのセリフを検索
- セリフが存在する場合: すべてのセリフを`Game.pushMessage()`で表示
- セリフが未定義の場合: 前のフェーズのセリフを検索 (フォールバック)
- キャラクター自体が存在しない場合: "特に反応がない。"

**`getCurrentPhase()`**
- `Game.state.progressFlags`と`Game.state.flags`を評価
- 最も進んだフェーズIDを返す（優先順位: CLEARED > DRAGON_DEFEATED > KEY_OBTAINED > START）

### 9.7 input.js への統合

`handleTalk()` 関数に王様の対話処理を追加：

```javascript
// 既存の商人・宿屋チェックの後に追加
if (Game.utils.isAdjacent(pos, Game.state.king.pos) &&
    Game.state.scene === Game.state.king.scene) {
  Game.dialogue.talk('king');
  return;
}
```

**統合のポイント**:
- 隣接判定は既存の`Game.utils.isAdjacent()`を使用
- シーン一致チェックで別マップの誤作動を防止
- 機能的キャラクター（商人・宿屋）が優先処理される順序を維持

### 9.8 実装ファイル構成

```
ultima-like-rpg/
├─ index.html          // <script src="dialogue.js"></script> を追加
├─ dialogue.js         // 🆕 新規作成
├─ assets/
│  └─ dialogues.json  // 🆕 新規作成
├─ game_state.js       // 既存（王様の位置定義済み）
├─ input.js            // 修正（handleTalk()に王様処理追加）
└─ sketch.js           // 修正（preload()でJSONロード）
```

### 9.9 実装手順

1. **`assets/dialogues.json` 作成**
   - 王様のセリフデータを実装
   - JSONバリデーターで構文チェック

2. **`dialogue.js` モジュール作成**
   - JSONロード処理実装
   - `talk()`, `getCurrentPhase()` 実装
   - フォールバック機能実装

3. **`index.html` 修正**
   - `<script src="dialogue.js"></script>` を `input.js` の前に追加

4. **`sketch.js` 修正**
   - `preload()` 内で `Game.dialogue.loadDialogues(window)` を呼び出し
   - ロード完了確認ログ追加

5. **`input.js` 修正**
   - `handleTalk()` に王様判定処理を追加

6. **動作確認**
   - 各ストーリー段階でのセリフ変化をテスト
   - フラグを手動変更して全フェーズを確認
   - JSONロード失敗時のフォールバック動作確認

7. **ローカルサーバー起動**
   ```bash
   python -m http.server 8000
   # http://localhost:8000 でアクセス
   ```

### 9.10 将来の拡張可能性

**短期的な拡張**:
- 大臣、兵士、村人などのストーリーキャラクター追加
- フェーズ1 (QUEST_GIVEN) の実装とクエスト受諾システム
- ランダムセリフ（配列から1つを選択）

**中期的な拡張**:
- 選択肢システム（Yes/No、複数選択）
- 条件付きセリフ（アイテム所持、レベル、Gold等）
- サブクエストフラグの追加

**長期的な拡張**:
- 多言語対応 (`dialogues_en.json`, `dialogues_zh.json`)
- セリフのスキップ/早送り機能
- キャラクター表情・ポーズ変化
- ボイス再生対応（音声ファイルへのパス指定）

### 9.11 注意事項とベストプラクティス

**セリフ記述ガイドライン**:
- 1行は50文字以内を推奨（メッセージパネルの幅制約）
- キャラクター名を接頭辞として明示 (`"王様: "`)
- 重要な情報は複数行に分割して強調
- プレイヤーの次の目標を明確に示す

**データ管理**:
- JSONファイルはUTF-8エンコーディングで保存
- バージョン管理でテキスト差分を追跡しやすくする
- 大規模化時は `assets/dialogues/` ディレクトリに分割も検討

**パフォーマンス**:
- JSONは`preload()`で一括ロード（遅延ロード不要）
- データサイズが大きくなる場合は圧縮版JSONも検討
- 現在の規模（数百行程度）では問題なし
