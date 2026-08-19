/* ==========================================================================
   NEUMOTYPE - Core Application Controller
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    mode: "time", // 'time', 'words', 'custom', 'vault', 'quote', 'code'
    timeOption: 60, // 15, 30, 60, 300, 600, 900
    wordOption: 25, // 10, 25, 50, 100
    customText: "",
    
    status: "ready", // 'ready', 'running', 'complete'
    passage: "",
    words: [],
    
    currentWordIndex: 0,
    currentCharIndex: 0,
    
    errorsTotal: 0,
    
    mistakeWordsCurrentSession: new Set(),
    
    timerSeconds: 0,
    elapsedSeconds: 0,
    startTime: null,
    timerInterval: null,
    
    timelineData: []
  };

  // DOM Elements
  const wordsContainer = document.getElementById("words-container");
  const caret = document.getElementById("caret");
  const hiddenInput = document.getElementById("hidden-input");
  const focusOverlay = document.getElementById("focus-overlay");
  const arenaCard = document.getElementById("arena-card");
  
  // HUD Elements
  const hudWpm = document.getElementById("hud-wpm");
  const hudAccuracy = document.getElementById("hud-accuracy");
  const hudTimer = document.getElementById("hud-timer");
  const hudErrors = document.getElementById("hud-errors");

  // Mode Buttons
  const modeButtons = document.querySelectorAll(".mode-btn");
  const subOptionsContainer = document.getElementById("sub-options-container");

  // Controls & Modals
  const soundToggleBtn = document.getElementById("sound-toggle-btn");
  const soundPresetSelect = document.getElementById("sound-preset-select");
  const restartBtn = document.getElementById("restart-btn");
  
  // Modal Backdrops
  const resultsModal = document.getElementById("results-modal");
  const customModal = document.getElementById("custom-modal");
  const historyModal = document.getElementById("history-modal");
  const vaultModal = document.getElementById("vault-modal");

  // Keyboard elements
  const virtualKeyboard = document.getElementById("virtual-keyboard");

  // Initialize App
  function init() {
    setupEventListeners();
    setupSubOptions();
    resetTest();
  }

  // --------------------------------------------------------------------------
  // Sub-Options Dynamic Renderer
  // --------------------------------------------------------------------------
  function setupSubOptions() {
    subOptionsContainer.innerHTML = "";

    if (state.mode === "time") {
      const options = [
        { label: "15s", val: 15 },
        { label: "30s", val: 30 },
        { label: "60s", val: 60 },
        { label: "5m", val: 300 },
        { label: "10m", val: 600 },
        { label: "15m", val: 900 }
      ];
      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = `sub-option-btn ${state.timeOption === opt.val ? "active" : ""}`;
        btn.textContent = opt.label;
        btn.onclick = () => {
          state.timeOption = opt.val;
          setupSubOptions();
          resetTest();
        };
        subOptionsContainer.appendChild(btn);
      });
    } else if (state.mode === "words") {
      const options = [
        { label: "10", val: 10 },
        { label: "25", val: 25 },
        { label: "50", val: 50 },
        { label: "100", val: 100 }
      ];
      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = `sub-option-btn ${state.wordOption === opt.val ? "active" : ""}`;
        btn.textContent = opt.label;
        btn.onclick = () => {
          state.wordOption = opt.val;
          setupSubOptions();
          resetTest();
        };
        subOptionsContainer.appendChild(btn);
      });
    } else if (state.mode === "custom") {
      const btn = document.createElement("button");
      btn.className = "neu-btn";
      btn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Set Custom Text`;
      btn.onclick = () => openModal(customModal);
      subOptionsContainer.appendChild(btn);
    } else if (state.mode === "vault") {
      const count = MistakeVault.getVaultCount();
      const badge = document.createElement("span");
      badge.className = "neu-pill active";
      badge.innerHTML = `<i class="fa-solid fa-vault"></i> ${count} Tricky Words`;
      subOptionsContainer.appendChild(badge);
    }
  }

  // --------------------------------------------------------------------------
  // Passage & Test Reset
  // --------------------------------------------------------------------------
  function resetTest() {
    clearInterval(state.timerInterval);
    state.status = "ready";
    state.startTime = null;
    state.currentWordIndex = 0;
    state.currentCharIndex = 0;
    state.errorsTotal = 0;
    state.elapsedSeconds = 0;
    state.timelineData = [];
    state.mistakeWordsCurrentSession.clear();

    // Set Timer Counter HUD
    if (state.mode === "time") {
      state.timerSeconds = state.timeOption;
      hudTimer.textContent = `${state.timerSeconds}s`;
    } else {
      hudTimer.textContent = "0s";
    }

    // Generate Text Passage based on Mode
    if (state.mode === "time") {
      state.passage = TextCorpus.getRandomWords(100);
    } else if (state.mode === "words") {
      state.passage = TextCorpus.getRandomWords(state.wordOption);
    } else if (state.mode === "custom") {
      state.passage = state.customText || "Paste your custom text in the options bar above to begin practicing custom passages.";
    } else if (state.mode === "vault") {
      state.passage = MistakeVault.generateVaultPassage(30);
    } else if (state.mode === "quote") {
      state.passage = TextCorpus.getRandomQuote();
    } else if (state.mode === "code") {
      state.passage = TextCorpus.getRandomCode();
    }

    state.words = state.passage.split(/\s+/);
    renderPassageDOM();
    updateHUD();
    
    setTimeout(() => {
      updateCaretPosition();
    }, 50);
  }

  // Render Passage DOM elements
  function renderPassageDOM() {
    wordsContainer.innerHTML = '<div id="caret" class="caret"></div>';
    appendWordsDOM(state.words, 0);
  }

  function appendWordsDOM(wordsList, startIdx) {
    wordsList.forEach((wordText, relativeIdx) => {
      const wIdx = startIdx + relativeIdx;
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      wordSpan.dataset.wordIndex = wIdx;

      for (let cIdx = 0; cIdx < wordText.length; cIdx++) {
        const charSpan = document.createElement("span");
        charSpan.className = "char";
        charSpan.textContent = wordText[cIdx];
        charSpan.dataset.charIndex = cIdx;
        wordSpan.appendChild(charSpan);
      }

      wordsContainer.appendChild(wordSpan);
    });
  }

  // --------------------------------------------------------------------------
  // Caret Cursor Movement & Scroll
  // --------------------------------------------------------------------------
  function updateCaretPosition() {
    const caret = document.getElementById("caret");
    if (!caret) return;

    const wordEls = wordsContainer.querySelectorAll(".word");
    const currentWordEl = wordEls[state.currentWordIndex];
    if (!currentWordEl) return;

    const charEls = currentWordEl.querySelectorAll(".char");
    if (!charEls.length) return;

    let targetEl;
    let isAfter = false;

    if (state.currentCharIndex < charEls.length) {
      targetEl = charEls[state.currentCharIndex];
    } else {
      targetEl = charEls[charEls.length - 1];
      isAfter = true;
    }

    if (targetEl) {
      const containerRect = wordsContainer.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      let leftPos = (isAfter ? targetRect.right : targetRect.left) - containerRect.left + wordsContainer.scrollLeft;
      let topPos = targetRect.top - containerRect.top + wordsContainer.scrollTop;

      if (targetRect.height > 0) {
        caret.style.height = `${targetRect.height}px`;
      }

      caret.style.left = `${leftPos}px`;
      caret.style.top = `${topPos}px`;

      // Auto-scroll words container line by line cleanly
      const visibleTop = targetRect.top - containerRect.top;
      if (visibleTop > 80) {
        wordsContainer.scrollTop += (visibleTop - 35);
      } else if (visibleTop < 10 && wordsContainer.scrollTop > 0) {
        wordsContainer.scrollTop = 0;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Keyboard Input Handler
  // --------------------------------------------------------------------------
  function handleKeyDown(e) {
    // Ignore meta/ctrl/alt key combinations except quick restart shortcuts
    if (e.ctrlKey || e.altKey || e.metaKey) {
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetTest();
      }
      return;
    }

    if (e.key === "Tab" || e.key === "Escape") {
      e.preventDefault();
      resetTest();
      return;
    }

    // Start timer on first keystroke
    if (state.status === "ready" && e.key.length === 1) {
      startTestTimer();
    }

    if (state.status !== "running" && state.status !== "ready") return;

    // Dynamic word stream for Time Mode
    if (state.mode === "time" && state.currentWordIndex >= state.words.length - 15) {
      const extraWords = TextCorpus.getRandomWords(50).split(/\s+/);
      const startIdx = state.words.length;
      state.words = state.words.concat(extraWords);
      appendWordsDOM(extraWords, startIdx);
    }

    const wordEls = wordsContainer.querySelectorAll(".word");
    const currentWordEl = wordEls[state.currentWordIndex];
    if (!currentWordEl) return;

    const currentWordText = state.words[state.currentWordIndex];

    // Trigger visual virtual keyboard press state
    pressVirtualKey(e.key);

    // 1. BACKSPACE
    if (e.key === "Backspace") {
      e.preventDefault();
      AudioEngine.playKeySound(false, false);

      if (state.currentCharIndex > 0) {
        state.currentCharIndex--;
        const charEl = currentWordEl.children[state.currentCharIndex];
        if (charEl) {
          if (charEl.classList.contains("extra")) {
            charEl.remove();
          } else {
            charEl.className = "char";
          }
        }
      } else if (state.currentWordIndex > 0) {
        // Allow backspacing into previous word if it contains errors
        const prevWordEl = wordEls[state.currentWordIndex - 1];
        const hasErrors = prevWordEl.querySelector(".incorrect, .extra");
        if (hasErrors) {
          state.currentWordIndex--;
          state.currentCharIndex = prevWordEl.children.length;
        }
      }
      updateCaretPosition();
      updateHUD();
      return;
    }

    // 2. SPACEBAR (Word Jump)
    if (e.key === " ") {
      e.preventDefault();
      AudioEngine.playKeySound(true, false);

      if (state.currentCharIndex === 0) return; // Don't allow empty space spam

      let wordHadError = false;
      // Mark un-typed remaining characters in word as incorrect
      for (let i = state.currentCharIndex; i < currentWordEl.children.length; i++) {
        const charEl = currentWordEl.children[i];
        if (!charEl.classList.contains("extra")) {
          charEl.classList.add("incorrect");
          state.errorsTotal++;
          wordHadError = true;
        }
      }

      if (wordHadError) {
        state.mistakeWordsCurrentSession.add(currentWordText);
        MistakeVault.recordMistake(currentWordText);
      }

      state.currentWordIndex++;
      state.currentCharIndex = 0;

      // Check if finished test in non-time modes
      if (state.mode !== "time" && state.currentWordIndex >= state.words.length) {
        finishTest();
        return;
      }

      updateCaretPosition();
      updateHUD();
      return;
    }

    // 3. REGULAR CHARACTER TYPING
    if (e.key.length === 1) {
      e.preventDefault();

      if (state.currentCharIndex < currentWordText.length) {
        const charEl = currentWordEl.children[state.currentCharIndex];
        const targetChar = currentWordText[state.currentCharIndex];

        if (e.key === targetChar) {
          charEl.className = "char correct";
          AudioEngine.playKeySound(false, false);
        } else {
          charEl.className = "char incorrect";
          state.errorsTotal++;
          state.mistakeWordsCurrentSession.add(currentWordText);
          MistakeVault.recordMistake(currentWordText);
          AudioEngine.playKeySound(false, true);
        }
        state.currentCharIndex++;
      } else {
        // Extra characters typed beyond word length
        if (state.currentCharIndex < currentWordText.length + 10) {
          const extraSpan = document.createElement("span");
          extraSpan.className = "char extra";
          extraSpan.textContent = e.key;
          currentWordEl.appendChild(extraSpan);
          state.currentCharIndex++;
          state.errorsTotal++;
          AudioEngine.playKeySound(false, true);
        }
      }

      // Check if last character of last word in non-time modes
      if (
        state.mode !== "time" &&
        state.currentWordIndex === state.words.length - 1 &&
        state.currentCharIndex >= currentWordText.length
      ) {
        finishTest();
        return;
      }

      updateCaretPosition();
      updateHUD();
    }
  }

  // --------------------------------------------------------------------------
  // Timer & HUD Metrics Loop
  // --------------------------------------------------------------------------
  function startTestTimer() {
    state.status = "running";
    state.startTime = Date.now();
    state.timelineData = [];
    state.timelineData.push({ second: 0, wpm: 0, raw: 0, errors: 0 });

    state.timerInterval = setInterval(() => {
      state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);

      if (state.mode === "time") {
        const remaining = state.timeOption - state.elapsedSeconds;
        state.timerSeconds = Math.max(0, remaining);
        hudTimer.textContent = `${state.timerSeconds}s`;

        if (remaining <= 0) {
          finishTest();
          return;
        }
      } else {
        hudTimer.textContent = `${state.elapsedSeconds}s`;
      }

      // Record Timeline Sample for Graph
      const currentWpm = calculateWPM();
      const currentRaw = calculateRawWPM();
      state.timelineData.push({
        second: state.elapsedSeconds,
        wpm: currentWpm,
        raw: currentRaw,
        errors: state.errorsTotal
      });

      updateHUD();
    }, 1000);
  }

  function getPassageStats() {
    const wordEls = wordsContainer.querySelectorAll(".word");
    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;
    let completedSpaces = 0;

    wordEls.forEach((wEl, idx) => {
      if (idx < state.currentWordIndex) {
        completedSpaces++;
        const chars = wEl.querySelectorAll(".char");
        chars.forEach(c => {
          if (c.classList.contains("correct")) correctChars++;
          else if (c.classList.contains("incorrect")) incorrectChars++;
          else if (c.classList.contains("extra")) extraChars++;
        });
      } else if (idx === state.currentWordIndex) {
        const chars = wEl.querySelectorAll(".char");
        chars.forEach(c => {
          if (c.classList.contains("correct")) correctChars++;
          else if (c.classList.contains("incorrect")) incorrectChars++;
          else if (c.classList.contains("extra")) extraChars++;
        });
      }
    });

    const totalCorrect = correctChars + completedSpaces;
    const totalTyped = correctChars + incorrectChars + extraChars + completedSpaces;

    return {
      correctTotal: totalCorrect,
      typedTotal: totalTyped
    };
  }

  function getElapsedMinutes() {
    if (!state.startTime) return 1 / 60;
    const elapsedSec = (Date.now() - state.startTime) / 1000;
    return Math.max(elapsedSec, 0.5) / 60;
  }

  function calculateWPM() {
    const stats = getPassageStats();
    const minutes = getElapsedMinutes();
    const wpm = Math.round((stats.correctTotal / 5) / minutes);
    return isFinite(wpm) ? Math.max(0, wpm) : 0;
  }

  function calculateRawWPM() {
    const stats = getPassageStats();
    const minutes = getElapsedMinutes();
    const raw = Math.round((stats.typedTotal / 5) / minutes);
    return isFinite(raw) ? Math.max(0, raw) : 0;
  }

  function calculateAccuracy() {
    const stats = getPassageStats();
    if (stats.typedTotal === 0) return 100;
    const acc = Math.round((stats.correctTotal / stats.typedTotal) * 100);
    return Math.min(100, Math.max(0, isNaN(acc) ? 100 : acc));
  }

  function updateHUD() {
    hudWpm.textContent = calculateWPM();
    hudAccuracy.textContent = `${calculateAccuracy()}%`;
    hudErrors.textContent = state.errorsTotal;
  }

  // --------------------------------------------------------------------------
  // Test Completion & Results Modal
  // --------------------------------------------------------------------------
  function finishTest() {
    clearInterval(state.timerInterval);
    state.status = "complete";
    AudioEngine.playCompletionBell();

    if (state.startTime) {
      state.elapsedSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000));
    }

    const finalWpm = calculateWPM();
    const finalRaw = calculateRawWPM();
    const finalAccuracy = calculateAccuracy();
    const stats = getPassageStats();
    const modeLabel = state.mode === "time" ? `${state.timeOption}s Time` : `${state.wordOption} Words`;

    state.timelineData.push({
      second: state.elapsedSeconds,
      wpm: finalWpm,
      raw: finalRaw,
      errors: state.errorsTotal
    });

    const resultObject = {
      wpm: finalWpm,
      rawWpm: finalRaw,
      accuracy: finalAccuracy,
      timeSec: state.elapsedSeconds,
      errors: state.errorsTotal,
      mode: modeLabel,
      timelineData: state.timelineData
    };

    // Save to LocalStorage
    AnalyticsEngine.saveResult(resultObject);

    // Update Results Modal Elements
    document.getElementById("res-wpm").textContent = finalWpm;
    document.getElementById("res-acc").textContent = `${finalAccuracy}%`;
    document.getElementById("res-raw").textContent = finalRaw;
    document.getElementById("res-time").textContent = `${state.elapsedSeconds}s`;
    document.getElementById("res-errors").textContent = state.errorsTotal;
    document.getElementById("res-correct").textContent = stats.correctTotal;

    // Render Canvas Chart
    openModal(resultsModal);
    setTimeout(() => {
      AnalyticsEngine.renderCanvasChart("results-chart", state.timelineData);
    }, 150);
  }

  // --------------------------------------------------------------------------
  // Modal Handlers & Helpers
  // --------------------------------------------------------------------------
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add("active");
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove("active");
  }

  function pressVirtualKey(keyChar) {
    if (!virtualKeyboard) return;
    let cleanKey = keyChar === " " ? "space" : keyChar.toLowerCase();
    
    try {
      const keyEl = virtualKeyboard.querySelector(`.kb-key[data-key="${CSS.escape(cleanKey)}"]`);
      if (keyEl) {
        keyEl.classList.add("pressed");
        setTimeout(() => keyEl.classList.remove("pressed"), 150);
      }
    } catch (e) {
      // Safe fallback for unescaped or invalid characters
    }
  }

  // --------------------------------------------------------------------------
  // Event Listeners Setup
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    window.addEventListener("resize", () => {
      requestAnimationFrame(updateCaretPosition);
    });

    // Focus capture on Arena click
    arenaCard.addEventListener("click", () => {
      if (!document.querySelector(".modal-backdrop.active")) {
        hiddenInput.focus();
        focusOverlay.classList.add("hidden");
      }
    });

    hiddenInput.addEventListener("blur", () => {
      if (state.status === "running" && !document.querySelector(".modal-backdrop.active")) {
        focusOverlay.classList.remove("hidden");
      }
    });

    document.addEventListener("keydown", (e) => {
      const activeModal = document.querySelector(".modal-backdrop.active");
      if (activeModal) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeModal(activeModal);
        }
        return;
      }

      if (document.activeElement.tagName === "TEXTAREA" || (document.activeElement.tagName === "INPUT" && document.activeElement !== hiddenInput)) {
        return;
      }
      hiddenInput.focus();
      focusOverlay.classList.add("hidden");
      handleKeyDown(e);
    });

    // Mode Selector Buttons
    modeButtons.forEach(btn => {
      btn.onclick = () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.mode = btn.dataset.mode;
        setupSubOptions();
        resetTest();
      };
    });

    // Quick Restart
    restartBtn.onclick = resetTest;

    // Sound Switches
    soundToggleBtn.onclick = () => {
      const muted = AudioEngine.toggleMute();
      soundToggleBtn.classList.toggle("active", !muted);
      soundToggleBtn.innerHTML = muted 
        ? `<i class="fa-solid fa-volume-xmark"></i> Sound Off`
        : `<i class="fa-solid fa-volume-high"></i> Sound On`;
    };

    soundPresetSelect.onchange = (e) => {
      AudioEngine.setPreset(e.target.value);
    };

    // Modal Triggers & Close Buttons
    document.querySelectorAll(".close-modal-btn").forEach(btn => {
      btn.onclick = () => {
        const modal = btn.closest(".modal-backdrop");
        if (modal) closeModal(modal);
      };
    });

    document.getElementById("btn-custom-text-save").onclick = () => {
      const val = document.getElementById("custom-text-input").value;
      if (val && val.trim()) {
        state.customText = val.trim();
        closeModal(customModal);
        resetTest();
      }
    };

    // History Modal Trigger
    document.getElementById("nav-history-btn").onclick = () => {
      renderHistoryTable();
      openModal(historyModal);
    };

    // Mistake Vault Modal Trigger
    document.getElementById("nav-vault-btn").onclick = () => {
      renderVaultChips();
      openModal(vaultModal);
    };

    // Clear Vault
    document.getElementById("clear-vault-btn").onclick = () => {
      if (confirm("Are you sure you want to clear your Mistake Vault?")) {
        MistakeVault.clearVault();
        renderVaultChips();
        setupSubOptions();
      }
    };

    // Clear History
    document.getElementById("clear-history-btn").onclick = () => {
      if (confirm("Are you sure you want to clear your test history?")) {
        AnalyticsEngine.clearHistory();
        renderHistoryTable();
      }
    };

    // Share Score Button
    document.getElementById("share-score-btn").onclick = () => {
      const currentStats = {
        wpm: document.getElementById("res-wpm").textContent,
        accuracy: document.getElementById("res-acc").textContent,
        mode: state.mode,
        rawWpm: document.getElementById("res-raw").textContent,
        errors: document.getElementById("res-errors").textContent
      };
      const text = AnalyticsEngine.formatShareString(currentStats);

      const handleSuccess = () => {
        const btn = document.getElementById("share-score-btn");
        const orig = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => btn.innerHTML = orig, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(handleSuccess).catch(() => {
          fallbackCopyText(text, handleSuccess);
        });
      } else {
        fallbackCopyText(text, handleSuccess);
      }
    };
  }

  function fallbackCopyText(text, onSuccess) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      onSuccess();
    } catch (err) {
      console.error("Failed to copy", err);
    }
    document.body.removeChild(textarea);
  }

  function renderVaultChips() {
    const container = document.getElementById("vault-chips-container");
    container.innerHTML = "";
    const list = MistakeVault.getTopMistakes(30);

    if (!list.length) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Your Mistake Vault is empty! Keep typing to automatically log tricky words here.</p>`;
      return;
    }

    list.forEach(item => {
      const chip = document.createElement("div");
      chip.className = "vault-chip";
      chip.innerHTML = `${item.word} <span class="count">${item.count}</span>`;
      container.appendChild(chip);
    });
  }

  function renderHistoryTable() {
    const tbody = document.getElementById("history-tbody");
    tbody.innerHTML = "";
    const history = AnalyticsEngine.getHistory();

    if (!history.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No history records yet. Complete your first test!</td></tr>`;
      return;
    }

    history.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.date}</td>
        <td>${item.mode}</td>
        <td style="font-weight: 700; color: var(--accent-primary);">${item.wpm}</td>
        <td>${item.accuracy}%</td>
        <td>${item.errors}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Start Application
  init();
});
