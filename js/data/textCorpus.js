
const TextCorpus = (() => {
  const commonWords = [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "I", "with",
    "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one",
    "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out",
    "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new",
    "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any",
    "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after",
    "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should",
    "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how",
    "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell",
    "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop",
    "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin",
    "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child",
    "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open",
    "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible",
    "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye",
    "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change",
    "help", "line", "city", "value", "case", "force", "power", "future", "mind", "important", "social",
    "nature", "thought", "study", "idea", "across", "create", "money", "letter", "hope", "build", "focus",
    "process", "action", "memory", "light", "energy", "reason", "sense", "truth", "music", "design", "logic",
    "simple", "future", "vision", "impact", "learn", "speed", "smooth", "screen", "keyboard", "practice"
  ];

  const quotes = [
    { text: "Simplicity is prerequisite for reliability.", author: "Edsger W. Dijkstra" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
    { text: "Knowledge is power, but practice makes progress.", author: "Anonymous" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" }
  ];

  const codeSnippets = [
    "const calculateWPM = (chars, timeInSec) => Math.round((chars / 5) / (timeInSec / 60));",
    "function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }",
    "document.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); resetTest(); } });",
    "const state = { wpm: 0, accuracy: 100, mistakes: new Map(), isRunning: false };",
    "array.reduce((acc, curr) => acc + curr, 0);"
  ];

  const pangrams = [
    "The quick brown fox jumps over the lazy dog.",
    "Pack my box with five dozen liquor jugs.",
    "How vexingly quick waft zephyr disposition light.",
    "Sphinx of black quartz, judge my vow."
  ];

  function getRandomWords(count = 25) {
    const result = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * commonWords.length);
      result.push(commonWords[randomIndex]);
    }
    return result.join(" ");
  }

  function getRandomQuote() {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    return `${q.text}`;
  }

  function getRandomCode() {
    return codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
  }

  function getRandomPangram() {
    return pangrams[Math.floor(Math.random() * pangrams.length)];
  }

  return {
    commonWords,
    getRandomWords,
    getRandomQuote,
    getRandomCode,
    getRandomPangram
  };
})();
