# NPC対話システム 設計書

## 1. システム概要
NPCとの対話をストーリー進行段階に応じて動的に変更するシステム。セリフデータをJSON外部化することで、プログラムコードとコンテンツを分離し、保守性と拡張性を確保する。

**設計方針**:
- **データ駆動型**: セリフデータは `assets/dialogues.json` で管理
- **ロジック分離**: 対話ロジックは `dialogue.js` モジュールで実装
- **段階管理**: ゲーム進行を明確な段階 (STORY_PHASE) で区分
- **フォールバック機能**: データロード失敗時やセリフ未定義時の対応

## 2. キャラクタータイプの分類

### 機能的キャラクター (Functional NPCs)
定型的な機能を提供するNPC。セリフは固定。
- **商人** (Merchant): アイテム売買UI提供 → `shop.js`
- **宿屋主人** (Innkeeper): HP回復サービス → `inn.js`
- (将来: 鍛冶屋、銀行、クエスト掲示板など)

### ストーリーキャラクター (Story NPCs)
ストーリー進行に応じてセリフが変化するNPC。`dialogue.js` で管理。
- **王様** (King): メインストーリーの進行役
- (将来: 大臣、兵士、村人、冒険者など)

## 3. ストーリー進行段階 (STORY_PHASE)

ゲームの進行状態を以下の5段階で管理：

| フェーズID | 名称 | 条件 | 説明 |
|-----------|------|------|------|
| 0 | START | ゲーム開始時・初回会話前 | クエスト説明、世界観導入 |
| 1 | QUEST_GIVEN | `progressFlags.questGiven === true` | クエスト受領後、鍵未入手時 |
| 2 | KEY_OBTAINED | `progressFlags.hasKey === true` | Ancient Key 入手後 |
| 3 | DRAGON_DEFEATED | `flags.dragonDefeated === true` | ドラゴン撃破後 |
| 4 | CLEARED | `progressFlags.cleared === true` | ゲームクリア後 |

**判定ロジック** (`dialogue.js::getCurrentPhase()`):
```javascript
if (state.progressFlags.cleared) return STORY_PHASE.CLEARED;
if (flags.dragonDefeated) return STORY_PHASE.DRAGON_DEFEATED;
if (state.progressFlags.hasKey) return STORY_PHASE.KEY_OBTAINED;
if (state.progressFlags.questGiven) return STORY_PHASE.QUEST_GIVEN;
return STORY_PHASE.START;
```

**フラグ管理の追加**:
- 初回会話後に `Game.state.progressFlags.questGiven = true` を設定
- これにより2回目以降の会話で異なるセリフを表示

## 4. JSONスキーマ設計

### ファイル構成
```
assets/
├─ dialogues.json    // 会話データ（日本語）
├─ actors.png        // 既存
├─ enemies.png       // 既存
└─ ...
```

### スキーマ構造 (`assets/dialogues.json`)
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

## 5. 王様のセリフ実装内容

TOWN `{x:18, y:2}` に配置されている王様のセリフ定義：

```json
{
  "king": {
    "name": "王様",
    "dialogues": {
      "0": [
        "王様: よく来た、若き冒険者よ。",
        "王様: 最近、東の遺跡に古代のドラゴンが現れたという報告がある。",
        "王様: 遺跡の扉は固く閉ざされているが、Ancient Key があれば開けられるはずだ。",
        "王様: この鍵は洞窟の奥深くに眠っていると言い伝えられている。探してきてくれないか？"
      ],
      "1": [
        "王様: Ancient Key はまだ見つからないか。",
        "王様: 洞窟は危険だが、そなたなら必ず見つけ出せるはずだ。",
        "王様: 宝箱の中に眠っているという噂もある。諦めずに探すのだ。"
      ],
      "2": [
        "王様: おお、Ancient Key を手に入れたか！",
        "王様: さすがだ。これで遺跡の扉を開けることができる。",
        "王様: だが、中には強大なドラゴンが待ち受けているだろう。",
        "王様: 十分に準備を整えてから向かうのだ。武器と防具を整え、体力を万全にしておけ。"
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
- **フェーズ0（初回訪問時）**: クエストの背景説明とゲーム目標の明示
  - ドラゴンの出現を報告
  - Ancient Keyが必要であることを伝える
  - 洞窟に鍵があることを示唆
- **フェーズ1（2回目以降、鍵未入手時）**: 進捗確認と励まし
  - プレイヤーの進捗を確認
  - 具体的なヒント（宝箱）を提供
  - 諦めずに探すよう励ます
- **フェーズ2（鍵入手後）**: 次の目標の提示と警告
  - 鍵入手を祝福
  - 遺跡への道が開けたことを伝える
  - ドラゴン戦への準備を促す
- **フェーズ3（ドラゴン撃破後）**: 称賛とさらなる探索の示唆
- **フェーズ4（ゲームクリア後）**: 最終的な勝利の祝福

## 6. dialogue.js モジュール仕様

### 責務
- JSONデータのロード・管理
- 現在のストーリー段階判定
- キャラクターとの対話実行
- フォールバック処理（データ不備時）

### 公開API
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

### 主要メソッド詳細

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

## 7. input.js への統合

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

## 8. 実装ファイル構成

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

## 9. 実装手順

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

## 10. 将来の拡張可能性

### 短期的な拡張
- 大臣、兵士、村人などのストーリーキャラクター追加
- フェーズ1 (QUEST_GIVEN) の実装とクエスト受諾システム
- ランダムセリフ（配列から1つを選択）

### 中期的な拡張
- 選択肢システム（Yes/No、複数選択）
- 条件付きセリフ（アイテム所持、レベル、Gold等）
- サブクエストフラグの追加

### 長期的な拡張
- 多言語対応 (`dialogues_en.json`, `dialogues_zh.json`)
- セリフのスキップ/早送り機能
- キャラクター表情・ポーズ変化
- ボイス再生対応（音声ファイルへのパス指定）

## 11. 注意事項とベストプラクティス

### セリフ記述ガイドライン
- 1行は50文字以内を推奨（メッセージパネルの幅制約）
- キャラクター名を接頭辞として明示 (`"王様: "`)
- 重要な情報は複数行に分割して強調
- プレイヤーの次の目標を明確に示す

### データ管理
- JSONファイルはUTF-8エンコーディングで保存
- バージョン管理でテキスト差分を追跡しやすくする
- 大規模化時は `assets/dialogues/` ディレクトリに分割も検討

### パフォーマンス
- JSONは`preload()`で一括ロード（遅延ロード不要）
- データサイズが大きくなる場合は圧縮版JSONも検討
- 現在の規模（数百行程度）では問題なし
