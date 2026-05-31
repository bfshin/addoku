import { useState, useEffect, useRef, useCallback } from "react";

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SUDOKU GENERATOR ─────────────────────────────────────────────────────────

function makeEmptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}
function boxSize(size) {
  if (size === 4) return { br: 2, bc: 2 };
  if (size === 6) return { br: 2, bc: 3 };
  return { br: 3, bc: 3 };
}
function isValid(grid, r, c, val, size) {
  const { br, bc } = boxSize(size);
  for (let i = 0; i < size; i++)
    if (grid[r][i] === val || grid[i][c] === val) return false;
  const br0 = Math.floor(r / br) * br, bc0 = Math.floor(c / bc) * bc;
  for (let i = br0; i < br0 + br; i++)
    for (let j = bc0; j < bc0 + bc; j++)
      if (grid[i][j] === val) return false;
  return true;
}
function generateSolution(size) {
  const g = makeEmptyGrid(size);
  function bt(pos) {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size), c = pos % size;
    if (g[r][c] !== 0) return bt(pos + 1);
    for (const v of shuffle([...Array(size)].map((_, i) => i + 1))) {
      if (isValid(g, r, c, v, size)) { g[r][c] = v; if (bt(pos + 1)) return true; g[r][c] = 0; }
    }
    return false;
  }
  bt(0); return g;
}

// ─── THEMES ───────────────────────────────────────────────────────────────────
//
// Each theme provides all color tokens used throughout the UI.
// cage[]  – 10 distinct cage background tints
// Everything is consumed via a `theme` object passed/read from state.

const THEMES = {
  dark: {
    key: "dark", label: "Dark", icon: "🌑",
    // Page
    pageBg: "#0f0e0c",
    pageGrid: "rgba(255,200,80,0.03)",
    pageText: "#f0e8d0",
    // Panel
    panelBg: "rgba(255,200,80,0.03)",
    panelBorder: "rgba(255,200,80,0.10)",
    // Header
    titleColor: "#ffc840",
    titleGlow: "rgba(255,200,64,0.45)",
    subtitleColor: "#6a5a3a",
    // Labels / muted text
    labelColor: "#6a5a3a",
    mutedText: "rgba(240,232,208,0.45)",
    legendText: "#4a3e2a",
    // Accent (used for active states, borders, highlights)
    accent: "#ffc840",
    accentFaint: "rgba(255,200,80,0.07)",
    accentMid: "rgba(255,200,80,0.18)",
    accentBorder: "rgba(255,200,80,0.50)",
    // Board
    boardBg: "rgba(16,14,10,0.98)",
    cellThin: "rgba(255,255,255,0.04)",
    cellBold: "rgba(255,200,80,0.32)",
    cageDash: "rgba(255,200,80,0.48)",
    cellHighlight: "rgba(255,200,80,0.06)",
    cellSelected: "rgba(255,200,80,0.20)",
    cellError: "rgba(255,70,70,0.14)",
    // Cell text
    cellTextNormal: "#f0e8d0",
    cellTextError: "#ff5555",
    cellTextSolution: "rgba(100,210,160,0.9)",
    cellNotesColor: "rgba(255,200,80,0.50)",
    // Cage labels
    cageLabelColor: "rgba(255,200,80,0.85)",
    cageLabelHidden: "rgba(255,110,70,0.9)",
    // Numpad
    numBg: "rgba(255,200,80,0.07)",
    numBorder: "rgba(255,200,80,0.20)",
    numColor: "#ffc840",
    numHover: "rgba(255,200,80,0.18)",
    delBg: "rgba(255,80,80,0.07)",
    delBorder: "rgba(255,80,80,0.20)",
    delColor: "#ff7070",
    delHover: "rgba(255,80,80,0.18)",
    // Timer / won
    timerColor: "#ffc840",
    wonColor: "#6dffb0",
    wonBg: "rgba(109,255,176,0.12)",
    wonBorder: "rgba(109,255,176,0.40)",
    // Generate btn
    genBg: "rgba(255,200,80,0.16)",
    genColor: "#ffc840",
    // Difficulty bar inactive pip
    diffPipInactive: "rgba(255,255,255,0.07)",
    diffBtnInactiveBg: "rgba(255,255,255,0.03)",
    diffBtnInactiveBorder: "rgba(255,255,255,0.07)",
    diffBtnInactiveColor: "#5a4e35",
    // Tool button inactive
    toolInactiveBorder: "rgba(255,255,255,0.07)",
    toolInactiveColor: "#5a4e35",
    // Size button
    sizeBg: "rgba(255,200,80,0.18)",
    sizeBorder: "rgba(255,200,80,0.55)",
    sizeColor: "#ffc840",
    sizeInactiveBorder: "rgba(255,200,80,0.12)",
    sizeInactiveColor: "#5a4e35",
    // Cage colors
    cage: [
      "rgba(255,180,50,0.11)",  "rgba(100,200,160,0.11)", "rgba(100,160,255,0.11)",
      "rgba(220,100,180,0.11)", "rgba(255,120,100,0.11)", "rgba(160,120,255,0.11)",
      "rgba(80,200,220,0.11)",  "rgba(255,200,80,0.11)",  "rgba(160,220,100,0.11)",
      "rgba(200,140,100,0.11)",
    ],
  },

  light: {
    key: "light", label: "Light", icon: "☀️",
    pageBg: "#f5f0e8",
    pageGrid: "rgba(100,80,40,0.05)",
    pageText: "#2a2018",
    panelBg: "rgba(255,255,255,0.70)",
    panelBorder: "rgba(180,140,60,0.20)",
    titleColor: "#8a5c00",
    titleGlow: "rgba(180,120,0,0.25)",
    subtitleColor: "#b8965a",
    labelColor: "#b8965a",
    mutedText: "rgba(60,40,10,0.50)",
    legendText: "#c0a070",
    accent: "#b87800",
    accentFaint: "rgba(180,120,0,0.07)",
    accentMid: "rgba(180,120,0,0.14)",
    accentBorder: "rgba(180,120,0,0.50)",
    boardBg: "#ffffff",
    cellThin: "rgba(0,0,0,0.07)",
    cellBold: "rgba(100,70,0,0.35)",
    cageDash: "rgba(150,90,0,0.55)",
    cellHighlight: "rgba(180,120,0,0.06)",
    cellSelected: "rgba(180,120,0,0.16)",
    cellError: "rgba(220,60,60,0.12)",
    cellTextNormal: "#1a1208",
    cellTextError: "#cc2222",
    cellTextSolution: "#1a7a4a",
    cellNotesColor: "rgba(140,90,0,0.55)",
    cageLabelColor: "rgba(140,90,0,0.90)",
    cageLabelHidden: "rgba(200,80,30,0.90)",
    numBg: "rgba(180,120,0,0.08)",
    numBorder: "rgba(180,120,0,0.25)",
    numColor: "#8a5c00",
    numHover: "rgba(180,120,0,0.20)",
    delBg: "rgba(200,60,60,0.08)",
    delBorder: "rgba(200,60,60,0.25)",
    delColor: "#cc3333",
    delHover: "rgba(200,60,60,0.20)",
    timerColor: "#8a5c00",
    wonColor: "#1a7a4a",
    wonBg: "rgba(26,122,74,0.10)",
    wonBorder: "rgba(26,122,74,0.40)",
    genBg: "rgba(180,120,0,0.14)",
    genColor: "#8a5c00",
    diffPipInactive: "rgba(0,0,0,0.10)",
    diffBtnInactiveBg: "rgba(0,0,0,0.03)",
    diffBtnInactiveBorder: "rgba(0,0,0,0.09)",
    diffBtnInactiveColor: "#b8965a",
    toolInactiveBorder: "rgba(0,0,0,0.10)",
    toolInactiveColor: "#b8965a",
    sizeBg: "rgba(180,120,0,0.14)",
    sizeBorder: "rgba(180,120,0,0.50)",
    sizeColor: "#8a5c00",
    sizeInactiveBorder: "rgba(180,120,0,0.15)",
    sizeInactiveColor: "#b8965a",
    cage: [
      "rgba(255,180,50,0.14)",  "rgba(60,180,120,0.12)",  "rgba(60,120,220,0.10)",
      "rgba(200,80,160,0.10)",  "rgba(220,90,60,0.10)",   "rgba(130,80,220,0.10)",
      "rgba(40,170,190,0.10)",  "rgba(220,170,40,0.12)",  "rgba(120,190,60,0.10)",
      "rgba(180,110,60,0.12)",
    ],
  },

  colorful: {
    key: "colorful", label: "Colorful", icon: "🌈",
    // Bright white base, rainbow accents throughout
    pageBg: "#ffffff",
    pageGrid: "rgba(100,100,220,0.05)",
    pageText: "#1a1a2e",
    panelBg: "rgba(255,255,255,0.90)",
    panelBorder: "rgba(180,100,220,0.22)",
    titleColor: "#cc2288",
    titleGlow: "rgba(220,50,160,0.30)",
    subtitleColor: "#8855cc",
    labelColor: "#9966bb",
    mutedText: "rgba(40,20,60,0.50)",
    legendText: "#bb88cc",
    accent: "#cc2288",
    accentFaint: "rgba(200,50,180,0.07)",
    accentMid: "rgba(200,50,180,0.14)",
    accentBorder: "rgba(200,50,180,0.45)",
    // Board: pure white with vivid rainbow cage fills
    boardBg: "#ffffff",
    cellThin: "rgba(0,0,0,0.06)",
    cellBold: "rgba(80,40,140,0.30)",
    cageDash: "rgba(120,60,200,0.55)",
    cellHighlight: "rgba(180,100,220,0.08)",
    cellSelected: "rgba(200,50,180,0.16)",
    cellError: "rgba(230,40,60,0.13)",
    cellTextNormal: "#1a1a2e",
    cellTextError: "#dd1144",
    cellTextSolution: "#117744",
    cellNotesColor: "rgba(120,60,200,0.55)",
    cageLabelColor: "rgba(80,40,160,0.90)",
    cageLabelHidden: "rgba(220,60,20,0.90)",
    numBg: "rgba(180,100,220,0.08)",
    numBorder: "rgba(180,100,220,0.28)",
    numColor: "#8833cc",
    numHover: "rgba(180,100,220,0.20)",
    delBg: "rgba(220,40,80,0.08)",
    delBorder: "rgba(220,40,80,0.28)",
    delColor: "#cc2244",
    delHover: "rgba(220,40,80,0.20)",
    timerColor: "#cc2288",
    wonColor: "#117744",
    wonBg: "rgba(17,119,68,0.10)",
    wonBorder: "rgba(17,119,68,0.40)",
    genBg: "rgba(200,50,180,0.12)",
    genColor: "#cc2288",
    diffPipInactive: "rgba(0,0,0,0.10)",
    diffBtnInactiveBg: "rgba(0,0,0,0.03)",
    diffBtnInactiveBorder: "rgba(0,0,0,0.10)",
    diffBtnInactiveColor: "#9966bb",
    toolInactiveBorder: "rgba(0,0,0,0.10)",
    toolInactiveColor: "#9966bb",
    sizeBg: "rgba(200,50,180,0.14)",
    sizeBorder: "rgba(200,50,180,0.50)",
    sizeColor: "#cc2288",
    sizeInactiveBorder: "rgba(180,100,220,0.18)",
    sizeInactiveColor: "#9966bb",
    // Rainbow cage fills — vivid, saturated, light-background friendly
    cage: [
      "rgba(255,50,50,0.13)",   // red
      "rgba(255,140,0,0.14)",   // orange
      "rgba(255,210,0,0.16)",   // yellow
      "rgba(60,200,80,0.14)",   // green
      "rgba(0,180,220,0.14)",   // cyan
      "rgba(50,100,255,0.13)",  // blue
      "rgba(160,60,220,0.13)",  // violet
      "rgba(230,60,160,0.13)",  // pink
      "rgba(0,200,160,0.13)",   // teal
      "rgba(200,120,40,0.13)",  // amber
    ],
  },
};

const THEME_KEYS = ["dark", "light", "colorful"];

// ─── DIFFICULTY CONFIG ────────────────────────────────────────────────────────

const DIFFICULTIES = [
  { key: "easy",       label: "Easy",       color: "#6dffb0", maxCage: 2, minCage: 1, hidden: 0,    snaking: false },
  { key: "medium",     label: "Medium",     color: "#80d4ff", maxCage: 3, minCage: 1, hidden: 0,    snaking: false },
  { key: "hard",       label: "Hard",       color: "#ffc840", maxCage: 4, minCage: 2, hidden: 0,    snaking: false },
  { key: "expert",     label: "Expert",     color: "#ff9f40", maxCage: 5, minCage: 2, hidden: 0,    snaking: true  },
  { key: "master",     label: "Master",     color: "#ff6080", maxCage: 6, minCage: 3, hidden: 0.25, snaking: true  },
  { key: "diabolical", label: "Diabolical", color: "#c060ff", maxCage: 8, minCage: 3, hidden: 0.5,  snaking: true  },
];
const DIFF_MAP = Object.fromEntries(DIFFICULTIES.map(d => [d.key, d]));
const DIFF_DESCS = {
  easy:       { text: "Small 1–2 cell cages, all sums shown. Perfect for beginners.", tags: [] },
  medium:     { text: "Cages up to 3 cells. Classic Killer Sudoku.", tags: [] },
  hard:       { text: "Cages up to 4 cells with a minimum of 2. More elimination needed.", tags: [] },
  expert:     { text: "Larger cages that twist across box boundaries.", tags: ["Snaking cages"] },
  master:     { text: "Big snaking cages plus a quarter of sums are hidden.", tags: ["Snaking cages", "25% hidden"] },
  diabolical: { text: "Huge irregular cages. Half the sums are hidden. Experts only.", tags: ["Snaking cages", "50% hidden"] },
};

// ─── CAGE GENERATION ──────────────────────────────────────────────────────────

function getNeighbors(r, c, size) {
  const n = [];
  if (r > 0) n.push([r - 1, c]);
  if (r < size - 1) n.push([r + 1, c]);
  if (c > 0) n.push([r, c - 1]);
  if (c < size - 1) n.push([r, c + 1]);
  return n;
}

function buildCages(solution, size, diffKey, noRepeats) {
  const cfg = DIFF_MAP[diffKey] || DIFF_MAP.medium;
  const maxCage = Math.min(cfg.maxCage, size);
  const minCage = Math.min(cfg.minCage, maxCage);
  const assigned = Array.from({ length: size }, () => Array(size).fill(-1));
  const cages = [];
  const remaining = new Set(Array.from({ length: size * size }, (_, i) => i));

  while (remaining.size > 0) {
    const startIdx = [...remaining][Math.floor(Math.random() * remaining.size)];
    const sr = Math.floor(startIdx / size), sc = startIdx % size;
    const cage = [[sr, sc]];
    remaining.delete(startIdx);
    assigned[sr][sc] = cages.length;
    const target = minCage + Math.floor(Math.random() * (maxCage - minCage + 1));

    while (cage.length < target) {
      const frontier = cfg.snaking
        ? [...new Set(cage.flatMap(([r, c]) => getNeighbors(r, c, size)
            .filter(([nr, nc]) => assigned[nr][nc] === -1)
            .map(([nr, nc]) => nr * size + nc)
          ))].map(k => [Math.floor(k / size), k % size])
        : getNeighbors(sr, sc, size).filter(([r, c]) => assigned[r][c] === -1);
      const usedVals = noRepeats ? new Set(cage.map(([r, c]) => solution[r][c])) : null;
      const valid = noRepeats ? frontier.filter(([nr, nc]) => !usedVals.has(solution[nr][nc])) : frontier;
      if (valid.length === 0) break;
      const [nr, nc] = valid[Math.floor(Math.random() * valid.length)];
      if (assigned[nr][nc] !== -1) continue;
      cage.push([nr, nc]);
      remaining.delete(nr * size + nc);
      assigned[nr][nc] = cages.length;
    }

    const sum = cage.reduce((s, [r, c]) => s + solution[r][c], 0);
    cages.push({ cells: cage, sum, hidden: Math.random() < cfg.hidden });
  }
  return cages;
}

function computeCageBorders(cages, size) {
  const cc = Array.from({ length: size }, () => Array(size).fill(-1));
  cages.forEach((cage, i) => cage.cells.forEach(([r, c]) => (cc[r][c] = i)));
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      top:    r === 0        || cc[r-1][c] !== cc[r][c],
      bottom: r === size - 1 || cc[r+1][c] !== cc[r][c],
      left:   c === 0        || cc[r][c-1] !== cc[r][c],
      right:  c === size - 1 || cc[r][c+1] !== cc[r][c],
    }))
  );
}

function getCageLabelCell(cage, size) {
  return cage.cells.reduce((best, [r, c]) =>
    r < best[0] || (r === best[0] && c < best[1]) ? [r, c] : best, [size, size]);
}

function validateBoard(grid, solution, size) {
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] !== solution[r][c]) return false;
  return true;
}

function getErrors(grid, solution, size, cages, noRepeats) {
  const e = new Set();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] !== 0 && grid[r][c] !== solution[r][c]) e.add(r * size + c);
  if (noRepeats && cages) {
    for (const cage of cages) {
      const seen = new Map();
      for (const [r, c] of cage.cells) {
        const v = grid[r][c];
        if (v === 0) continue;
        if (seen.has(v)) { e.add(r * size + c); e.add(seen.get(v)); }
        else seen.set(v, r * size + c);
      }
    }
  }
  return e;
}

const NULL_PUZZLE = { size: 0, solution: null, cages: [], borders: [], grid: null };

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function KillerSudoku() {
  const [themeKey, setThemeKey] = useState("dark");
  const [size, setSize] = useState(9);
  const [difficulty, setDifficulty] = useState("medium");
  const [puzzle, setPuzzle] = useState(NULL_PUZZLE);
  const [selected, setSelected] = useState(null);
  const [errors, setErrors] = useState(new Set());
  const [won, setWon] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState({});
  const [showSolution, setShowSolution] = useState(false);
  const [noRepeats, setNoRepeats] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const genTokenRef = useRef(0);

  const T = THEMES[themeKey];

  useEffect(() => {
    if (timerActive && !won) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, won]);

  const formatTime = s =>
    `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const generate = useCallback((sz, diff, nr) => {
    const token = ++genTokenRef.current;
    setGenerating(true); setWon(false); setSelected(null);
    setErrors(new Set()); setNotes({}); setShowSolution(false);
    setTimer(0); setTimerActive(false); setPuzzle(NULL_PUZZLE);
    setTimeout(() => {
      if (genTokenRef.current !== token) return;
      const solution = generateSolution(sz);
      const cages    = buildCages(solution, sz, diff, nr);
      const borders  = computeCageBorders(cages, sz);
      setPuzzle({ size: sz, solution, cages, borders, grid: makeEmptyGrid(sz) });
      setGenerating(false); setTimerActive(true);
    }, 30);
  }, []);

  useEffect(() => { generate(9, "medium", false); }, []); // eslint-disable-line

  const handleSizeChange = (s) => { setSize(s); generate(s, difficulty, noRepeats); };
  const handleDiffChange = (d) => { setDifficulty(d); generate(size, d, noRepeats); };

  useEffect(() => {
    const { size: psize, grid, solution } = puzzle;
    const handler = (e) => {
      if (!selected || !grid || !solution) return;
      const [r, c] = selected;
      const n = parseInt(e.key);
      if (!isNaN(n) && n >= 1 && n <= psize) {
        if (noteMode) {
          setNotes(prev => {
            const curr = new Set(prev[`${r},${c}`] || []);
            curr.has(n) ? curr.delete(n) : curr.add(n);
            return { ...prev, [`${r},${c}`]: [...curr] };
          });
        } else {
          const ng = grid.map(row => [...row]); ng[r][c] = n;
          setNotes(prev => { const p={...prev}; delete p[`${r},${c}`]; return p; });
          setErrors(getErrors(ng, solution, psize, puzzle.cages, noRepeats));
          setPuzzle(prev => ({ ...prev, grid: ng }));
          if (validateBoard(ng, solution, psize)) { setWon(true); setTimerActive(false); }
        }
      }
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        const ng = grid.map(row => [...row]); ng[r][c] = 0;
        setPuzzle(prev => ({ ...prev, grid: ng }));
        setErrors(getErrors(ng, solution, psize, puzzle.cages, noRepeats));
      }
      const mv = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
      if (mv[e.key]) {
        e.preventDefault();
        const [dr,dc] = mv[e.key];
        setSelected([Math.max(0,Math.min(psize-1,r+dr)), Math.max(0,Math.min(psize-1,c+dc))]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, puzzle, noteMode, noRepeats]);

  const handleNumPad = (n) => {
    const { size: psize, grid, solution, cages } = puzzle;
    if (!selected || !grid || !solution) return;
    const [r, c] = selected;
    if (noteMode && n > 0) {
      setNotes(prev => {
        const curr = new Set(prev[`${r},${c}`] || []);
        curr.has(n) ? curr.delete(n) : curr.add(n);
        return { ...prev, [`${r},${c}`]: [...curr] };
      });
    } else {
      const ng = grid.map(row => [...row]); ng[r][c] = n;
      setNotes(prev => { const p={...prev}; delete p[`${r},${c}`]; return p; });
      setErrors(getErrors(ng, solution, psize, cages, noRepeats));
      setPuzzle(prev => ({ ...prev, grid: ng }));
      if (n !== 0 && validateBoard(ng, solution, psize)) { setWon(true); setTimerActive(false); }
    }
  };

  const { size: psize, solution, cages, borders, grid } = puzzle;
  const ready = psize > 0 && psize === size && grid !== null && solution !== null && borders.length === psize;
  // Fit board within viewport: 24px padding each side = 48px total horizontal padding
  const maxBoardPx = typeof window !== "undefined" ? window.innerWidth - 48 : 500;
  const maxCell = size === 4 ? 80 : size === 6 ? 68 : 56;
  const cellSize = Math.floor(Math.min(maxCell, maxBoardPx / size));
  const fontSize = cellSize >= 52 ? (size === 4 ? 28 : size === 6 ? 22 : 20)
                 : cellSize >= 40 ? (size === 4 ? 24 : size === 6 ? 18 : 16)
                 : 13;
  const { br, bc } = boxSize(size);
  const diffCfg = DIFF_MAP[difficulty];

  const cellCageMap = {};
  const labelCells = new Map();
  if (ready) {
    cages.forEach((cage, i) => {
      cage.cells.forEach(([r, c]) => (cellCageMap[`${r},${c}`] = i));
      const [lr, lc] = getCageLabelCell(cage, psize);
      labelCells.set(`${lr},${lc}`, { sum: cage.sum, hidden: cage.hidden });
    });
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.pageBg,
      backgroundImage: `linear-gradient(${T.pageGrid} 1px,transparent 1px),linear-gradient(90deg,${T.pageGrid} 1px,transparent 1px)`,
      backgroundSize: "28px 28px",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'DM Mono','Courier New',monospace", color: T.pageText,
      padding: "24px 12px 48px", transition: "background 0.3s, color 0.3s",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          fontFamily: "'Playfair Display',Georgia,serif",
          fontSize: "clamp(24px,5vw,40px)", fontWeight: 900,
          letterSpacing: "0.06em", color: T.titleColor,
          textShadow: `0 0 40px ${T.titleGlow}`, marginBottom: 4,
        }}>KILLER SUDOKU</div>
        <div style={{ fontSize: 10, color: T.subtitleColor, letterSpacing: "0.3em", textTransform: "uppercase" }}>
          additive cage puzzle
        </div>
      </div>

      {/* Controls panel */}
      <div style={{
        width: "100%", maxWidth: 580,
        background: T.panelBg, border: `1px solid ${T.panelBorder}`,
        borderRadius: 14, padding: "16px 18px", marginBottom: 20,
        display: "flex", flexDirection: "column", gap: 12,
        transition: "background 0.3s, border-color 0.3s",
      }}>

        {/* Board size */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Label T={T}>BOARD</Label>
          <div style={{ display: "flex", gap: 6 }}>
            {[4, 6, 9].map(s => (
              <SizeBtn key={s} active={size === s} disabled={generating} T={T}
                onClick={() => handleSizeChange(s)}>
                {s}×{s}
              </SizeBtn>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label T={T}>LEVEL</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, width: "100%" }}>
            {DIFFICULTIES.map(d => (
              <DiffBtn key={d.key} cfg={d} active={difficulty === d.key} disabled={generating} T={T}
                onClick={() => handleDiffChange(d.key)}>
                {d.label}
              </DiffBtn>
            ))}
          </div>
        </div>

        {/* Difficulty info bar */}
        <DifficultyBar diffKey={difficulty} T={T} />

        {/* Generate + timer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button onClick={() => generate(size, difficulty, noRepeats)} disabled={generating} style={{
            padding: "8px 22px",
            background: generating ? T.accentFaint : T.genBg,
            border: `1px solid ${generating ? T.panelBorder : T.accentBorder}`,
            borderRadius: 8, color: generating ? T.labelColor : T.genColor,
            fontFamily: "inherit", fontSize: 12, fontWeight: 700,
            letterSpacing: "0.12em", cursor: generating ? "not-allowed" : "pointer",
            transition: "all 0.2s", textTransform: "uppercase",
          }}>
            {generating ? "⚙ Generating…" : "⟳ New Puzzle"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              fontSize: 20, fontWeight: 700, color: won ? T.wonColor : T.timerColor,
              fontVariantNumeric: "tabular-nums", minWidth: 54, textAlign: "right",
            }}>{formatTime(timer)}</div>
            {won && (
              <div style={{
                padding: "4px 12px", background: T.wonBg, border: `1px solid ${T.wonBorder}`,
                borderRadius: 20, color: T.wonColor,
                fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
                animation: "pulse 1.2s ease infinite",
              }}>✓ SOLVED</div>
            )}
          </div>
        </div>
      </div>

      {/* Generating placeholder */}
      {generating && (
        <div style={{
          width: size * cellSize, height: size * cellSize,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: T.labelColor, fontSize: 12, letterSpacing: "0.2em",
          border: `1px dashed ${T.panelBorder}`, borderRadius: 10, marginBottom: 18,
        }}>GENERATING…</div>
      )}

      {/* Board */}
      {!generating && ready && (
        <div style={{
          background: T.boardBg, borderRadius: 10, overflow: "hidden",
          boxShadow: `0 8px 60px rgba(0,0,0,0.4), 0 0 0 2px ${diffCfg.color}44`,
          marginBottom: 16, transition: "background 0.3s",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${psize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${psize}, ${cellSize}px)`,
          }}>
            {Array.from({ length: psize }, (_, r) =>
              Array.from({ length: psize }, (_, c) => {
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const cageIdx = cellCageMap[`${r},${c}`] ?? 0;
                const cageColor = T.cage[cageIdx % T.cage.length];
                const b = borders[r][c];
                const hasError = errors.has(r * psize + c);
                const labelSum = labelCells.get(`${r},${c}`);
                const val = showSolution ? solution[r][c] : grid[r][c];
                const cellNotes = notes[`${r},${c}`] || [];

                let bg = cageColor;
                if (isSelected) bg = T.cellSelected;
                else if (hasError) bg = T.cellError;
                else if (selected) {
                  const [sr, sc] = selected;
                  const { br: br2, bc: bc2 } = boxSize(psize);
                  if (r===sr || c===sc || (Math.floor(r/br2)===Math.floor(sr/br2) && Math.floor(c/bc2)===Math.floor(sc/bc2)))
                    bg = T.cellHighlight;
                }

                return (
                  <div key={`${r}-${c}`} onClick={() => setSelected([r, c])} style={{
                    width: cellSize, height: cellSize, position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", background: bg, transition: "background 0.1s",
                    boxSizing: "border-box",
                    borderTop:    b.top    ? `2px dashed ${T.cageDash}` : (r%br===0&&r!==0) ? `2.5px solid ${T.cellBold}` : `1px solid ${T.cellThin}`,
                    borderBottom: b.bottom ? `2px dashed ${T.cageDash}` : `1px solid ${T.cellThin}`,
                    borderLeft:   b.left   ? `2px dashed ${T.cageDash}` : (c%bc===0&&c!==0) ? `2.5px solid ${T.cellBold}` : `1px solid ${T.cellThin}`,
                    borderRight:  b.right  ? `2px dashed ${T.cageDash}` : `1px solid ${T.cellThin}`,
                  }}>
                    {labelSum !== undefined && (
                      <span style={{
                        position: "absolute", top: 2, left: 3,
                        fontSize: Math.max(8, cellSize * 0.17), fontWeight: 700, lineHeight: 1,
                        color: labelSum.hidden ? T.cageLabelHidden : T.cageLabelColor,
                        pointerEvents: "none", zIndex: 2,
                      }}>{labelSum.hidden ? "?" : labelSum.sum}</span>
                    )}
                    {val !== 0 && (
                      <span style={{
                        fontSize, fontWeight: 700, lineHeight: 1, userSelect: "none",
                        fontFamily: "'Playfair Display',Georgia,serif",
                        color: hasError ? T.cellTextError : showSolution ? T.cellTextSolution : T.cellTextNormal,
                      }}>{val}</span>
                    )}
                    {val === 0 && cellNotes.length > 0 && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(psize))}, 1fr)`,
                        padding: 3, fontSize: Math.max(6, cellSize * 0.13),
                        color: T.cellNotesColor,
                        width: "100%", height: "100%",
                        alignContent: "center", justifyItems: "center",
                      }}>
                        {Array.from({ length: psize }, (_, i) => i + 1).map(n => (
                          <span key={n} style={{ opacity: cellNotes.includes(n) ? 1 : 0 }}>{n}</span>
                        ))}
                      </div>
                    )}
                    {isSelected && (
                      <div style={{
                        position: "absolute", inset: 0,
                        border: `2px solid ${diffCfg.color}cc`,
                        boxShadow: `inset 0 0 10px ${diffCfg.color}22`,
                        pointerEvents: "none",
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Numpad */}
      {!generating && ready && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: psize }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => handleNumPad(n)} style={{
              width: 42, height: 42, background: T.numBg,
              border: `1px solid ${T.numBorder}`, borderRadius: 8, color: T.numColor,
              fontFamily: "'Playfair Display',Georgia,serif", fontSize: 19, fontWeight: 700, cursor: "pointer",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = T.numHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.numBg)}
            >{n}</button>
          ))}
          <button onClick={() => handleNumPad(0)} style={{
            width: 42, height: 42, background: T.delBg,
            border: `1px solid ${T.delBorder}`, borderRadius: 8,
            color: T.delColor, fontSize: 15, cursor: "pointer", transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = T.delHover)}
            onMouseLeave={e => (e.currentTarget.style.background = T.delBg)}
          >✕</button>
        </div>
      )}

      {/* Tools */}
      {!generating && ready && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <ToolBtn active={noteMode} onClick={() => setNoteMode(m => !m)} color="#80c8ff" T={T}>
            ✎ Notes {noteMode ? "ON" : "OFF"}
          </ToolBtn>
          <ToolBtn active={noRepeats} onClick={() => setNoRepeats(n => !n)} color="#ffb347" T={T}>
            ⊘ No Repeats {noRepeats ? "ON" : "OFF"}
          </ToolBtn>
          <ToolBtn active={showSolution} onClick={() => setShowSolution(s => !s)} color="#6dffb0" T={T}>
            👁 Reveal
          </ToolBtn>
        </div>
      )}

      {/* Theme switcher */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 10, color: T.legendText, letterSpacing: "0.2em" }}>THEME</span>
        {THEME_KEYS.map(tk => {
          const th = THEMES[tk];
          const active = themeKey === tk;
          return (
            <button key={tk} onClick={() => setThemeKey(tk)} title={th.label} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 13,
              background: active ? T.accentMid : "transparent",
              border: active ? `1px solid ${T.accentBorder}` : `1px solid ${T.panelBorder}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              color: active ? T.accent : T.legendText,
              fontFamily: "'DM Mono',monospace", fontSize: 11,
              fontWeight: active ? 700 : 400,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14 }}>{th.icon}</span>
              {th.label}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, fontSize: 10, color: T.legendText, textAlign: "center", lineHeight: 2, letterSpacing: "0.04em" }}>
        <div>Dashed border = cage boundary · corner digit = cage sum · <span style={{ color: T.cageLabelHidden }}>?</span> = hidden sum</div>
        <div>Click a cell then type or tap numpad · Arrow keys to move</div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Label({ children, T, style }) {
  return (
    <span style={{ fontSize: 10, color: T.labelColor, letterSpacing: "0.2em", minWidth: 52, flexShrink: 0, ...style }}>
      {children}
    </span>
  );
}

function SizeBtn({ active, onClick, disabled, T, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "6px 14px",
      background: active ? T.sizeBg : "transparent",
      border: active ? `1px solid ${T.sizeBorder}` : `1px solid ${T.sizeInactiveBorder}`,
      borderRadius: 7, cursor: disabled ? "not-allowed" : "pointer",
      color: active ? T.sizeColor : T.sizeInactiveColor,
      fontFamily: "'DM Mono',monospace", fontSize: 12,
      fontWeight: active ? 700 : 400, letterSpacing: "0.05em", transition: "all 0.15s",
    }}>{children}</button>
  );
}

function DiffBtn({ cfg, active, onClick, disabled, T, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "7px 4px",
      background: active ? `${cfg.color}22` : T.diffBtnInactiveBg,
      border: active ? `1px solid ${cfg.color}88` : `1px solid ${T.diffBtnInactiveBorder}`,
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      color: active ? cfg.color : T.diffBtnInactiveColor,
      fontFamily: "'DM Mono',monospace", fontSize: 11,
      fontWeight: active ? 700 : 400, letterSpacing: "0.04em",
      transition: "all 0.15s", textAlign: "center", width: "100%",
    }}>{children}</button>
  );
}

function DifficultyBar({ diffKey, T }) {
  const cfg = DIFF_MAP[diffKey];
  const desc = DIFF_DESCS[diffKey];
  const idx = DIFFICULTIES.findIndex(d => d.key === diffKey);
  if (!cfg || !desc) return null;
  return (
    <div style={{
      padding: "10px 12px",
      background: `${cfg.color}0c`, border: `1px solid ${cfg.color}25`,
      borderRadius: 8, display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {DIFFICULTIES.map((d, i) => (
          <div key={d.key} style={{
            height: 5, borderRadius: 3,
            flex: i <= idx ? 2 : 1,
            background: i <= idx ? cfg.color : T.diffPipInactive,
            transition: "all 0.3s",
          }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, color: cfg.color, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 11, color: T.mutedText, lineHeight: 1.5 }}>{desc.text}</div>
      {desc.tags.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {desc.tags.map(tag => (
            <span key={tag} style={{
              padding: "2px 8px", borderRadius: 10,
              background: `${cfg.color}1a`, border: `1px solid ${cfg.color}40`,
              fontSize: 10, color: cfg.color, letterSpacing: "0.04em",
            }}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolBtn({ active, onClick, color, T, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px",
      background: active ? `${color}1a` : "transparent",
      border: `1px solid ${active ? `${color}77` : T.toolInactiveBorder}`,
      borderRadius: 8, color: active ? color : T.toolInactiveColor,
      fontFamily: "'DM Mono',monospace", fontSize: 11,
      fontWeight: 600, cursor: "pointer", letterSpacing: "0.1em", transition: "all 0.15s",
    }}>{children}</button>
  );
}
