
const MistakeVault = (() => {
  const STORAGE_KEY = "neumo_mistake_vault";
  
  // Default fallback words for empty vault
  const defaultTrickyWords = [
    "rhythm", "phenomenon", "accommodate", "definitely", "embarrass",
    "hierarchy", "necessary", "occurrence", "privilege", "separate",
    "quintessential", "thorough", "conscientious", "maintenance", "persevere"
  ];

  function getVaultData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Failed to load mistake vault data", e);
      return {};
    }
  }

  function saveVaultData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save mistake vault data", e);
    }
  }

  function recordMistake(word) {
    if (!word || typeof word !== "string") return;
    const cleanWord = word.trim().toLowerCase().replace(/[^a-z0-9]/gi, "");
    if (!cleanWord || cleanWord.length < 1) return;

    const data = getVaultData();
    data[cleanWord] = (data[cleanWord] || 0) + 1;
    saveVaultData(data);
  }

  function recordMultipleMistakes(wordsList) {
    if (!Array.isArray(wordsList)) return;
    wordsList.forEach(w => recordMistake(w));
  }

  function getTopMistakes(limit = 15) {
    const data = getVaultData();
    const sorted = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count }));
    return sorted.slice(0, limit);
  }

  function generateVaultPassage(wordCount = 25) {
    const topMistakes = getTopMistakes(30).map(item => item.word);
    let pool = topMistakes.length >= 5 ? topMistakes : [...topMistakes, ...defaultTrickyWords];

    const passage = [];
    for (let i = 0; i < wordCount; i++) {
      const randWord = pool[Math.floor(Math.random() * pool.length)];
      passage.push(randWord);
    }
    return passage.join(" ");
  }

  function clearVault() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear vault", e);
    }
  }

  function getVaultCount() {
    const data = getVaultData();
    return Object.keys(data).length;
  }

  return {
    recordMistake,
    recordMultipleMistakes,
    getTopMistakes,
    generateVaultPassage,
    clearVault,
    getVaultCount
  };
})();
