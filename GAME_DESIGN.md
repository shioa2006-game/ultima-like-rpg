# NPC対話システム 設計書

## 1. システム概要
p5.js を用いたブラウザRPGで、NPCとの会話内容をゲーム進行に応じて動的に切り替える。セリフは `assets/dialogues.json` に外部化し、ロジックは `dialogue.js` モジュールに集約することで、実装とコンテンツを明確に分離する。

- **データ管理**: すべての台詞は JSON に保存し、バージョン管理で差分を追跡。
- **ロジック分離**: 会話制御は `dialogue.js`、入力検出は `input.js`、UI描画は `renderer.js` が担当。
- **フェーズ制御**: STORY_PHASE で進行度を明示化し、フラグ値に応じて適切な台詞を選択。
- **フォールバック**: セリフが存在しない場合は前フェーズの内容で補完し、空欄を防止。

## 2. キャラクタータイプ
### 機能NPC (Functional NPCs)
定型機能を持つNPC。セリフは基本的に固定。
- **商人 (Merchant)**: アイテム売買。`shop.js`
- **宿屋 (Innkeeper)**: HP回復。`inn.js`
- 追加予定: 鍛冶屋、船頭、掲示板など

### ストーリーNPC (Story NPCs)
進行度に応じて台詞が変化。`dialogue.js` で管理。
- **王様 (King)**: メインクエストの案内役
- 今後: 大臣、兵士、村人 など

## 3. STORY_PHASE とフラグ

| フェーズID | 名称 | 条件 | 目的 |
|-----------|------|------|------|
| 0 | START | 初期状態 | 世界観説明、クエスト依頼 |
| 1 | QUEST_GIVEN | `progressFlags.questGiven === true` | クエスト受領後、鍵未入手 |
| 2 | KEY_OBTAINED | `progressFlags.hasKey === true` | Ancient Key 入手後 |

**判定ロジック (`dialogue.js::getCurrentPhase`)**
```javascript
if (progressFlags.hasKey) return STORY_PHASE.KEY_OBTAINED;
if (progressFlags.questGiven) return STORY_PHASE.QUEST_GIVEN;
return STORY_PHASE.START;
```

**フラグ管理**
- 初回会話を最後まで読むと `progressFlags.questTalked = true` をセット（依頼内容を聞いた状態）。
- プレイヤーが TOWN を離れて他シーンへ移動した瞬間、`questTalked && !questGiven` を確認し `questGiven = true` を自動設定。これにより王様の周囲で T キーを連打してもフェーズ0のまま留まり、街の外へ出た段階で `dialogues1` に遷移する。
- 以降は `hasKey` や `cleared` など既存フラグで追加フェーズを制御。

## 4. JSONスキーマ
```
assets/
├─ dialogues.json  // 会話データ (UTF-8)
├─ actors.png
├─ enemies.png
└─ ...
```

```json
{
  "version": "1.0.0",
  "storyPhases": {
    "START": 0,
    "QUEST_GIVEN": 1,
    "KEY_OBTAINED": 2
  },
  "characters": {
    "<characterId>": {
      "name": "<表示名>",
      "dialogues": {
        "<phaseId>": [
          "<セリフ1>",
          "<セリフ2>",
          "..."
        ]
      }
    }
  }
}
```

- `dialogues` のキーは数値文字列。未定義フェーズは自動的に以前のフェーズへフォールバック。
- 1行50文字以内を推奨。表示枠を超える場合でも自動折り返しされるが、可読性確保のため `[⏎]` などの制御表記でプレイヤー入力タイミングを示すと親切。

## 5. 王様のセリフ例
TOWN `{x:18, y:2}` に配置。`assets/dialogues.json` へ以下のように記述。

```json
"king": {
  "name": "王様",
  "dialogues": {
    "0": [
      "王様 よく来た、若き冒険者よ。[⏎]",
      "王様 最近、東の遺跡に古代のドラゴンが現れたとの報告がある。[⏎]",
      "王様 遺跡の扉は固く閉ざされておるが、Ancient Key があれば開けられるはずだ。[⏎]",
      "王様 その鍵は洞窟の奥深くに眠っていると言われておる。探してきてくれぬか。[⏎]"
    ],
    "1": [
      "王様 Ancient Key はまだ見つからぬか。[⏎]",
      "王様 洞窟は危険だが、そなたなら必ず探し出せるはずだ。[⏎]",
      "王様 宝箱の中に眠っているという噂もある。諦めずに探すのだ。[⏎]"
    ],
    "2": [
      "王様 おお、Ancient Key を手に入れたか！[⏎]",
      "王様 さすがだ。これで遺跡の扉を開けられる。[⏎]",
      "王様 中には強大なドラゴンが待つだろう。十分に備えて向かうのだ。[⏎]"
    ]
  }
}
```

- `[⏎]` は任意。入力タイミングのヒントとして使用。
- JSON 追加時は構文チェックとテキスト幅の確認を行う。

## 6. `dialogue.js` モジュール仕様

```ts
interface DialogueModule {
  loadDialogues(p5Instance: p5): Promise<void>;
  talk(characterId: string): void;
  getCurrentPhase(): number;
  isLoaded(): boolean;
  isSessionActive(): boolean;
  STORY_PHASE: Readonly<Record<string, number>>;
}
```

### `loadDialogues`
- `p5.loadJSON()` もしくは `fetch` を利用して `assets/dialogues.json` をロード。
- 成功: データを内部状態に保持し、以後の呼び出しで即参照。
- 失敗: フォールバックデータ（簡易メッセージ）を生成し、警告を出力。

### `talk(characterId)`
- 現在フェーズを取得し、該当セリフ配列を検索。
- セリフは内部キューへ積まれ、`T` キーを押すたびに 1 行ずつ `Game.pushMessage()` へ送る。これによりメッセージ欄の 4 行制限に左右されない。
- セリフ未定義時は前フェーズを参照（フォールバック）。
- 会話が最後まで進んだ時に王様×フェーズ0であれば `progressFlags.questTalked = true` を更新。実際のフェーズ遷移はシーン移動時の判定に委ねる。
- 該当キャラクターが存在しない場合は「特に反応がない。」を表示。

### `getCurrentPhase`
- `progressFlags` を参照し、最大優先度のフェーズを返す (`hasKey > questGiven > start`)。

## 7. `input.js` との連携
`handleTalk()` で王様に隣接しているかつ同一シーンであれば `Game.dialogue.talk('king')` を呼び出す。商人や宿屋など機能NPCの判定より後に配置し、キング会話は逐次表示で進行する。セッション中に再度 `T` キーを押すと次の行へ進む仕様のため、追加の入力分岐は不要。

## 8. 実装ファイル構成
```
ultima-like-rpg/
├─ index.html            // <script src="dialogue.js"> を input.js より前に読み込む
├─ dialogue.js           // 会話制御ロジック
├─ assets/
│  └─ dialogues.json     // セリフデータ
├─ game_state.js         // 王様座標・進行フラグ管理
├─ input.js              // Tキー処理
├─ renderer.js           // メッセージ描画（p.textWrapで折り返し）
└─ ...
```

## 9. 実装・テスト手順
1. `dialogues.json` を編集し、新規セリフを追加。UTF-8 / JSON バリデーション必須。
2. `dialogue.js` を修正（フェーズ追加やセッション挙動など）。
3. `index.html` で読み込み順を確認後、`sketch.js::preload` で `Game.dialogue.loadDialogues(this)` を呼び出しておく。
4. `input.js` で T キー判定が正しく `Game.dialogue.talk` に流れることを確認。
5. `game_state.js` の `switchScene` で `questTalked` → `questGiven` への昇格をテスト（TOWN→FIELD に移動する）。
6. ローカルサーバー (`python -m http.server`) で起動し、各フェーズを手動確認。必要に応じて `Game.flags` をコンソールから書き換えテスト。

## 10. 拡張アイデア
- サブキャラクターの追加とフェーズ3以降（ドラゴン討伐後など）のセリフ拡張。
- 選択肢や分岐会話、好感度によるセリフ変化。
- 多言語対応 (`dialogues_en.json` など)。
- セリフスキップ・早送り機能、ボイス再生などの演出強化。

## 11. 運用上の注意
- JSON は UTF-8 (BOMなし) で保存し、PR 時に差分が読みやすいよう整形を揃える。
- 1行あたり 50 文字前後を目安にし、必要に応じて `[⏎]` や句読点で区切る。
- セッション状態をリセットする操作（シーン切り替えや戦闘など）が増える場合は `dialogue.js` の `resetSession` を必ず呼び出す。
- メッセージログは 4 行まで描画されるため、長文イベントでは逐次表示前提で台詞を設計する。



