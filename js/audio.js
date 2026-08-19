
const AudioEngine = (() => {
  let audioCtx = null;
  let isMuted = false;
  let currentPreset = "thock"; // 'thock', 'clicky', 'tactile', 'typewriter', 'linear'

  let masterGain = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function getDestinationNode(ctx) {
    if (!masterGain && ctx) {
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
    return masterGain || ctx.destination;
  }

  function playKeySound(isSpace = false, isError = false) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (isError) {
      playErrorSound(ctx, now);
      return;
    }

    switch (currentPreset) {
      case "thock":
        playThock(ctx, now, isSpace);
        break;
      case "clicky":
        playClicky(ctx, now, isSpace);
        break;
      case "tactile":
        playTactile(ctx, now, isSpace);
        break;
      case "typewriter":
        playTypewriter(ctx, now, isSpace);
        break;
      case "linear":
        playLinear(ctx, now, isSpace);
        break;
      default:
        playThock(ctx, now, isSpace);
    }
  }

  // 1. Thock Profile (Deep Mechanical Sound)
  function playThock(ctx, now, isSpace) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    const freq = isSpace ? 140 : 220 + Math.random() * 30;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getDestinationNode(ctx));

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 2. Clicky Profile (Crisp Blue Switch)
  function playClicky(ctx, now, isSpace) {
    // High click component
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(isSpace ? 1200 : 2400 + Math.random() * 200, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(getDestinationNode(ctx));
    osc.start(now);
    osc.stop(now + 0.02);

    // Subtle bottom-out thud
    playThock(ctx, now, isSpace);
  }

  // 3. Tactile Profile (Brown Switch)
  function playTactile(ctx, now, isSpace) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isSpace ? 180 : 320, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(getDestinationNode(ctx));
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 4. Typewriter Profile (Metal Strike)
  function playTypewriter(ctx, now, isSpace) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(isSpace ? 400 : 800 + Math.random() * 100, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(getDestinationNode(ctx));
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // 5. Linear Profile (Quiet Red Switch)
  function playLinear(ctx, now, isSpace) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isSpace ? 110 : 160, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getDestinationNode(ctx));

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Soft Error Buzz
  function playErrorSound(ctx, now) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(getDestinationNode(ctx));
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Completion Bell
  function playCompletionBell() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(getDestinationNode(ctx));

    osc.start(now);
    osc.stop(now + 0.6);
  }

  function setMuted(muted) {
    isMuted = muted;
  }

  function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
  }

  function setPreset(preset) {
    currentPreset = preset;
  }

  function getMuted() {
    return isMuted;
  }

  function getPreset() {
    return currentPreset;
  }

  return {
    playKeySound,
    playCompletionBell,
    setMuted,
    toggleMute,
    setPreset,
    getMuted,
    getPreset
  };
})();
