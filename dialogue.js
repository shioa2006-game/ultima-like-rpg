(function () {
  // NPC対話データを扱うモジュール
  const Game = (window.Game = window.Game || {});

  const STORY_PHASE = Object.freeze({
    START: 0,
    QUEST_GIVEN: 1,
    KEY_OBTAINED: 2,
  });

  const dialogueState = {
    data: null,
    loaded: false,
    session: {
      active: false,
      characterId: null,
      lines: [],
      index: 0,
      phase: STORY_PHASE.START,
    },
    cooldownUntilMove: false, // 会話終了後、1ターン移動するまで新しい会話を開始できない
  };

  function createFallbackData() {
    return {
      version: "fallback",
      storyPhases: { ...STORY_PHASE },
      characters: {
        default: {
          name: "謎の声",
          dialogues: {
            "0": ["謎の声 ...静寂が広がっている。"],
          },
        },
      },
    };
  }

  function loadDialogues(loader) {
    const targetLoader = resolveLoader(loader);
    let resolved = false;
    const handleSuccess = (json) => {
      if (resolved) return;
      resolved = true;
      applyDialogueData(json);
      dialogueState.loaded = true;
    };
    const handleError = (error) => {
      if (resolved) return;
      resolved = true;
      console.warn("dialogues.json のロードに失敗:", error);
      applyDialogueData(null);
      dialogueState.loaded = true;
    };

    if (targetLoader) {
      try {
        const immediate = targetLoader.loadJSON("assets/dialogues.json", handleSuccess, handleError);
        if (immediate && typeof immediate === "object" && Object.keys(immediate).length > 0) {
          handleSuccess(immediate);
        }
      } catch (error) {
        handleError(error);
      }
      return;
    }

    if (typeof window.fetch === "function") {
      window
        .fetch("assets/dialogues.json")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(handleSuccess)
        .catch(handleError);
      return;
    }

    handleError(new Error("データローダーが利用できません"));
  }

  function resolveLoader(loader) {
    if (loader && typeof loader.loadJSON === "function") {
      return loader;
    }
    if (typeof window.loadJSON === "function") {
      return window;
    }
    return null;
  }

  function applyDialogueData(raw) {
    if (!raw || typeof raw !== "object" || !raw.characters) {
      dialogueState.data = createFallbackData();
      return;
    }
    dialogueState.data = {
      version: raw.version || "unknown",
      storyPhases: raw.storyPhases || { ...STORY_PHASE },
      characters: raw.characters || {},
    };
  }

  function getCharacter(characterId) {
    if (!dialogueState.data || !dialogueState.data.characters) return null;
    return dialogueState.data.characters[characterId] || null;
  }

  function findLines(characterId, phase) {
    const character = getCharacter(characterId);
    if (!character || !character.dialogues) return null;
    let target = phase;
    while (target >= 0) {
      const key = String(target);
      const lines = character.dialogues[key];
      if (Array.isArray(lines) && lines.length > 0) {
        return { lines, phase: target };
      }
      target -= 1;
    }
    return null;
  }

  function talk(characterId) {
    if (!characterId) {
      pushFallbackMessage();
      return;
    }
    const session = dialogueState.session;

    // クールダウン中は新しい会話を開始できない
    if (dialogueState.cooldownUntilMove && !session.active) {
      return;
    }

    if (session.active && session.characterId !== characterId) {
      resetSession();
    }
    if (session.active && session.characterId === characterId) {
      advanceSession();
      return;
    }

    const phase = getCurrentPhase();
    const found = findLines(characterId, phase);
    if (!found) {
      pushFallbackMessage();
      return;
    }

    startSession(characterId, found.lines, found.phase);
    advanceSession();
  }

  // 会話セッションを開始して段階的に進める
  function startSession(characterId, lines, phase) {
    const session = dialogueState.session;
    session.active = true;
    session.characterId = characterId;
    // 最後に空行を追加して会話の終わりを明確にする
    session.lines = Array.isArray(lines) ? [...lines, ""] : [""];
    session.index = 0;
    session.phase = phase;
  }

  function advanceSession() {
    const session = dialogueState.session;
    if (!session.active) return false;
    if (!session.lines.length || session.index >= session.lines.length) {
      completeSession();
      return false;
    }
    const line = session.lines[session.index];
    session.index += 1;
    // 空文字列も含めてすべてのメッセージを表示（空行も表示される）
    if (typeof line === "string") {
      Game.pushMessage(line);
    }
    if (session.index >= session.lines.length) {
      completeSession();
    }
    return true;
  }

  function completeSession() {
    const session = dialogueState.session;
    if (
      session.characterId === "king" &&
      session.phase === STORY_PHASE.START &&
      Game.flags
    ) {
      Game.flags.questTalked = true;
    }
    // 空行はstartSession()で追加済みなので、ここでは追加しない
    // クールダウンを有効化（次の移動まで会話を開始できない）
    dialogueState.cooldownUntilMove = true;
    resetSession();
  }

  function resetSession() {
    const session = dialogueState.session;
    session.active = false;
    session.characterId = null;
    session.lines = [];
    session.index = 0;
    session.phase = STORY_PHASE.START;
  }

  function pushFallbackMessage() {
    Game.pushMessage("特に反応がない。");
  }

  function getCurrentPhase() {
    const story = Game.flags || {};
    if (story.hasKey) return STORY_PHASE.KEY_OBTAINED;
    if (story.questGiven) return STORY_PHASE.QUEST_GIVEN;
    return STORY_PHASE.START;
  }

  function isLoaded() {
    return dialogueState.loaded;
  }

  function clearCooldown() {
    dialogueState.cooldownUntilMove = false;
  }

  Game.dialogue = {
    STORY_PHASE,
    loadDialogues,
    talk,
    getCurrentPhase,
    isLoaded,
    isSessionActive: () => dialogueState.session.active,
    clearCooldown,
  };
})();
