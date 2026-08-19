
const AnalyticsEngine = (() => {
  const HISTORY_KEY = "neumo_test_history";

  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  }

  function saveResult(result) {
    // result = { date, mode, wpm, rawWpm, accuracy, timeSec, errors, wpmTimeline }
    const history = getHistory();
    history.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...result
    });

    // Limit history to 50 entries
    if (history.length > 50) {
      history.pop();
    }

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save result", e);
    }

    return history[0];
  }

  function getPersonalBest(modeKey) {
    const history = getHistory();
    const filtered = history.filter(item => item.mode === modeKey);
    if (!filtered.length) return 0;
    return Math.max(...filtered.map(item => item.wpm));
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.error("Failed to clear history", e);
    }
  }

  // Native Soft Neumorphic Canvas Timeline Chart
  function renderCanvasChart(canvasId, timelineData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    
    // Support HiDPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    let pointsData = timelineData ? [...timelineData] : [];
    if (pointsData.length === 1) {
      pointsData.unshift({ second: 0, wpm: 0, raw: 0, errors: 0 });
    }

    if (!pointsData || pointsData.length < 2) {
      ctx.fillStyle = "#8a99ad";
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Insufficient typing data for graph", width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 30, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const wpms = pointsData.map(d => d.wpm);
    const maxWpm = Math.max(...wpms, 40) + 10;
    const minWpm = 0;

    // Light Soft UI Colors
    const gridColor = "rgba(0, 0, 0, 0.06)";
    const textColor = "#718096";
    const lineColor = "#4f46e5";
    const areaGradientColor = "rgba(79, 70, 229, 0.15)";

    // Draw Grid Lines & Y-Axis Labels
    const steps = 4;
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillStyle = textColor;
    ctx.textAlign = "right";

    for (let i = 0; i <= steps; i++) {
      const yVal = Math.round(minWpm + (maxWpm - minWpm) * (i / steps));
      const yPos = height - padding.bottom - (chartHeight * (i / steps));

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(width - padding.right, yPos);
      ctx.stroke();

      ctx.fillText(yVal, padding.left - 8, yPos + 4);
    }

    // Map Timeline Data Points
    const points = pointsData.map((d, index) => {
      const x = padding.left + (chartWidth * (index / (pointsData.length - 1)));
      const y = height - padding.bottom - (chartHeight * ((d.wpm - minWpm) / (maxWpm - minWpm)));
      return { x, y, wpm: d.wpm, raw: d.raw, errors: d.errors };
    });

    // Filled Gradient Area under curve
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, areaGradientColor);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Smooth Line Spline Path
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();

    // Draw Data Point Nodes
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#e6ecf5";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = lineColor;
      ctx.stroke();
    });
  }

  function formatShareString(result) {
    return `⚡ NeumoType Score\nWPM: ${result.wpm} | Accuracy: ${result.accuracy}% | Mode: ${result.mode}\nRaw WPM: ${result.rawWpm} | Mistakes: ${result.errors}`;
  }

  return {
    getHistory,
    saveResult,
    getPersonalBest,
    clearHistory,
    renderCanvasChart,
    formatShareString
  };
})();
