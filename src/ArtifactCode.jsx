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
      if (isValid(g, r, c, v, size)) {
        g[r][c] = v;
        if (bt(pos + 1)) return true;
        g[r][c] = 0;
      }
    }
    return false;
  }
  bt(0);
  return g;
}

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
  // When noRepeats is on, cap cage size to the board size (can't have more unique
  // digits than values 1–size), but also cap at size to avoid impossible cages.
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

      // In no-repeats mode, only allow candidates whose value isn't already in this cage
      const usedVals = noRepeats ? new Set(cage.map(([r, c]) => solution[r][c])) : null;
      const valid = noRepeats
        ? frontier.filter(([nr, nc]) => !usedVals.has(solution[nr][nc]))
        : frontier;

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
  // Wrong value vs solution
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] !== 0 && grid[r][c] !== solution[r][c]) e.add(r * size + c);
  // Cage-internal duplicate violations
  if (noRepeats && cages) {
    for (const cage of cages) {
      const seen = new Map();
      for (const [r, c] of cage.cells) {
        const v = grid[r][c];
        if (v === 0) continue;
        if (seen.has(v)) {
          e.add(r * size + c);
          e.add(seen.get(v));
        } else {
          seen.set(v, r * size + c);
        }
      }
    }
  }
  return e;
}

const CAGE_COLORS = [
  "rgba(255,180,50,0.11)",  "rgba(100,200,160,0.11)", "rgba(100,160,255,0.11)",
  "rgba(220,100,180,0.11)", "rgba(255,120,100,0.11)", "rgba(160,120,255,0.11)",
  "rgba(80,200,220,0.11)",  "rgba(255,200,80,0.11)",  "rgba(160,220,100,0.11)",
  "rgba(200,140,100,0.11)",
];

const NULL_PUZZLE = { size: 0, solution: null, cages: [], borders: [], grid: null };

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function KillerSudoku() {
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

  useEffect(() => {
    if (timerActive && !won) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, won]);

  const formatTime = s =>
    `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // generate always receives sz and diff explicitly — no stale closure risk
  const generate = useCallback((sz, diff, nr) => {
    const token = ++genTokenRef.current;
    setGenerating(true);
    setWon(false);
    setSelected(null);
    setErrors(new Set());
    setNotes({});
    setShowSolution(false);
    setTimer(0);
    setTimerActive(false);
    setPuzzle(NULL_PUZZLE);
    setTimeout(() => {
      if (genTokenRef.current !== token) return;
      const solution = generateSolution(sz);
      const cages    = buildCages(solution, sz, diff, nr);
      const borders  = computeCageBorders(cages, sz);
      setPuzzle({ size: sz, solution, cages, borders, grid: makeEmptyGrid(sz) });
      setGenerating(false);
      setTimerActive(true);
    }, 30);
  }, []);

  // On mount, generate with initial defaults
  useEffect(() => { generate(9, "medium", false); }, []); // eslint-disable-line

  // Changing size or difficulty: update state AND generate immediately
  const handleSizeChange = (s) => { setSize(s); generate(s, difficulty, noRepeats); };
  const handleDiffChange = (d) => { setDifficulty(d); generate(size, d, noRepeats); };

  // Keyboard input
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
          setErrors(getErrors(ng, solution, psize, cages, noRepeats));
          setPuzzle(prev => ({ ...prev, grid: ng }));
          if (validateBoard(ng, solution, psize)) { setWon(true); setTimerActive(false); }
        }
      }
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        const ng = grid.map(row => [...row]); ng[r][c] = 0;
        setPuzzle(prev => ({ ...prev, grid: ng }));
        setErrors(getErrors(ng, solution, psize, cages, noRepeats));
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
  }, [selected, puzzle, noteMode]);

  const handleNumPad = (n) => {
    const { size: psize, grid, solution } = puzzle;
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
  const cellSize = size === 4 ? 80 : size === 6 ? 68 : 56;
  const fontSize = size === 4 ? 28 : size === 6 ? 22 : 20;
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
      minHeight: "100vh", background: "#0f0e0c",
      backgroundImage: `linear-gradient(rgba(255,200,80,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,80,0.03) 1px,transparent 1px)`,
      backgroundSize: "28px 28px",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'DM Mono','Courier New',monospace", color: "#f0e8d0",
      padding: "24px 12px 48px",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          fontFamily: "'Playfair Display',Georgia,serif",
          fontSize: "clamp(24px,5vw,40px)", fontWeight: 900,
          letterSpacing: "0.06em", color: "#ffc840",
          textShadow: "0 0 40px rgba(255,200,64,0.45)", marginBottom: 4,
        }}>KILLER SUDOKU</div>
        <div style={{ fontSize: 10, color: "#6a5a3a", letterSpacing: "0.3em", textTransform: "uppercase" }}>
          additive cage puzzle
        </div>
      </div>

      {/* Controls */}
      <div style={{
        width: "100%", maxWidth: 580,
        background: "rgba(255,200,80,0.03)", border: "1px solid rgba(255,200,80,0.1)",
        borderRadius: 14, padding: "16px 18px", marginBottom: 20,
        display: "flex", flexDirection: "column", gap: 12,
      }}>

        {/* Board size */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Label>BOARD</Label>
          <div style={{ display: "flex", gap: 6 }}>
            {[4, 6, 9].map(s => (
              <SizeBtn key={s} active={size === s} disabled={generating}
                onClick={() => handleSizeChange(s)}>
                {s}×{s}
              </SizeBtn>
            ))}
          </div>
        </div>

        {/* Difficulty — label above full-width 3x2 grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>LEVEL</Label>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            width: "100%",
          }}>
            {DIFFICULTIES.map(d => (
              <DiffBtn key={d.key} cfg={d} active={difficulty === d.key} disabled={generating}
                onClick={() => handleDiffChange(d.key)}>
                {d.label}
              </DiffBtn>
            ))}
          </div>
        </div>

        {/* Difficulty info bar */}
        <DifficultyBar diffKey={difficulty} />

        {/* Generate + timer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button onClick={() => generate(size, difficulty, noRepeats)} disabled={generating} style={{
            padding: "8px 22px",
            background: generating ? "rgba(255,200,80,0.07)" : "rgba(255,200,80,0.16)",
            border: `1px solid ${generating ? "rgba(255,200,80,0.2)" : "rgba(255,200,80,0.5)"}`,
            borderRadius: 8, color: generating ? "rgba(255,200,80,0.4)" : "#ffc840",
            fontFamily: "inherit", fontSize: 12, fontWeight: 700,
            letterSpacing: "0.12em", cursor: generating ? "not-allowed" : "pointer",
            transition: "all 0.2s", textTransform: "uppercase",
          }}>
            {generating ? "⚙ Generating…" : "⟳ New Puzzle"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              fontSize: 20, fontWeight: 700, color: won ? "#6dffb0" : "#ffc840",
              fontVariantNumeric: "tabular-nums", minWidth: 54, textAlign: "right",
            }}>{formatTime(timer)}</div>
            {won && (
              <div style={{
                padding: "4px 12px", background: "rgba(109,255,176,0.12)",
                border: "1px solid rgba(109,255,176,0.4)", borderRadius: 20,
                color: "#6dffb0", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
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
          color: "rgba(255,200,80,0.25)", fontSize: 12, letterSpacing: "0.2em",
          border: "1px dashed rgba(255,200,80,0.08)", borderRadius: 10, marginBottom: 18,
        }}>GENERATING…</div>
      )}

      {/* Board */}
      {!generating && ready && (
        <div style={{
          background: "rgba(16,14,10,0.98)", borderRadius: 10, overflow: "hidden",
          boxShadow: `0 8px 60px rgba(0,0,0,0.7), 0 0 0 2px ${diffCfg.color}33`,
          marginBottom: 16,
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
                const cageColor = CAGE_COLORS[cageIdx % CAGE_COLORS.length];
                const b = borders[r][c];
                const hasError = errors.has(r * psize + c);
                const labelSum = labelCells.get(`${r},${c}`);
                const val = showSolution ? solution[r][c] : grid[r][c];
                const cellNotes = notes[`${r},${c}`] || [];

                let bg = cageColor;
                if (isSelected) bg = "rgba(255,200,80,0.2)";
                else if (hasError) bg = "rgba(255,70,70,0.14)";
                else if (selected) {
                  const [sr, sc] = selected;
                  const { br: br2, bc: bc2 } = boxSize(psize);
                  if (r===sr || c===sc || (Math.floor(r/br2)===Math.floor(sr/br2) && Math.floor(c/bc2)===Math.floor(sc/bc2)))
                    bg = "rgba(255,200,80,0.06)";
                }

                const dash = `2px dashed rgba(255,200,80,0.48)`;
                const thin = `1px solid rgba(255,255,255,0.04)`;
                const bold = `2.5px solid rgba(255,200,80,0.32)`;

                return (
                  <div key={`${r}-${c}`} onClick={() => setSelected([r, c])} style={{
                    width: cellSize, height: cellSize, position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", background: bg, transition: "background 0.1s",
                    boxSizing: "border-box",
                    borderTop:    b.top    ? dash : (r%br===0&&r!==0) ? bold : thin,
                    borderBottom: b.bottom ? dash : thin,
                    borderLeft:   b.left   ? dash : (c%bc===0&&c!==0) ? bold : thin,
                    borderRight:  b.right  ? dash : thin,
                  }}>
                    {labelSum !== undefined && (
                      <span style={{
                        position: "absolute", top: 2, left: 3,
                        fontSize: Math.max(8, cellSize * 0.17), fontWeight: 700, lineHeight: 1,
                        color: labelSum.hidden ? "rgba(255,110,70,0.9)" : "rgba(255,200,80,0.85)",
                        pointerEvents: "none", zIndex: 2,
                      }}>{labelSum.hidden ? "?" : labelSum.sum}</span>
                    )}
                    {val !== 0 && (
                      <span style={{
                        fontSize, fontWeight: 700, lineHeight: 1, userSelect: "none",
                        fontFamily: "'Playfair Display',Georgia,serif",
                        color: hasError ? "#ff5555" : showSolution ? "rgba(100,210,160,0.9)" : "#f0e8d0",
                      }}>{val}</span>
                    )}
                    {val === 0 && cellNotes.length > 0 && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(psize))}, 1fr)`,
                        padding: 3, fontSize: Math.max(6, cellSize * 0.13),
                        color: "rgba(255,200,80,0.5)",
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
                        border: `2px solid ${diffCfg.color}bb`,
                        boxShadow: `inset 0 0 10px ${diffCfg.color}18`,
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
              width: 42, height: 42,
              background: "rgba(255,200,80,0.07)", border: "1px solid rgba(255,200,80,0.2)",
              borderRadius: 8, color: "#ffc840",
              fontFamily: "'Playfair Display',Georgia,serif", fontSize: 19, fontWeight: 700, cursor: "pointer",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,200,80,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,200,80,0.07)")}
            >{n}</button>
          ))}
          <button onClick={() => handleNumPad(0)} style={{
            width: 42, height: 42,
            background: "rgba(255,80,80,0.07)", border: "1px solid rgba(255,80,80,0.2)",
            borderRadius: 8, color: "#ff7070", fontSize: 15, cursor: "pointer",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,80,80,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,80,80,0.07)")}
          >✕</button>
        </div>
      )}

      {/* Tools */}
      {!generating && ready && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <ToolBtn active={noteMode} onClick={() => setNoteMode(m => !m)} color="#80c8ff">
            ✎ Notes {noteMode ? "ON" : "OFF"}
          </ToolBtn>
          <ToolBtn active={noRepeats} onClick={() => setNoRepeats(n => !n)} color="#ffb347">
            ⊘ No Repeats {noRepeats ? "ON" : "OFF"}
          </ToolBtn>
          <ToolBtn active={showSolution} onClick={() => setShowSolution(s => !s)} color="#6dffb0">
            👁 Reveal
          </ToolBtn>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: 28, fontSize: 10, color: "#4a3e2a", textAlign: "center", lineHeight: 2, letterSpacing: "0.04em" }}>
        <div>Dashed border = cage boundary · corner digit = cage sum · <span style={{ color: "rgba(255,110,70,0.55)" }}>?</span> = hidden sum</div>
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

function Label({ children, style }) {
  return (
    <span style={{ fontSize: 10, color: "#6a5a3a", letterSpacing: "0.2em", minWidth: 52, flexShrink: 0, ...style }}>
      {children}
    </span>
  );
}

function SizeBtn({ active, onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "6px 14px",
      background: active ? "rgba(255,200,80,0.18)" : "transparent",
      border: active ? "1px solid rgba(255,200,80,0.55)" : "1px solid rgba(255,200,80,0.12)",
      borderRadius: 7, cursor: disabled ? "not-allowed" : "pointer",
      color: active ? "#ffc840" : "#5a4e35",
      fontFamily: "'DM Mono',monospace", fontSize: 12,
      fontWeight: active ? 700 : 400, letterSpacing: "0.05em", transition: "all 0.15s",
    }}>{children}</button>
  );
}

function DiffBtn({ cfg, active, onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "7px 4px",
      background: active ? `${cfg.color}22` : "rgba(255,255,255,0.03)",
      border: active ? `1px solid ${cfg.color}88` : "1px solid rgba(255,255,255,0.07)",
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      color: active ? cfg.color : "#5a4e35",
      fontFamily: "'DM Mono',monospace", fontSize: 11,
      fontWeight: active ? 700 : 400, letterSpacing: "0.04em",
      transition: "all 0.15s", textAlign: "center", width: "100%",
    }}>{children}</button>
  );
}

function DifficultyBar({ diffKey }) {
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
            background: i <= idx ? cfg.color : "rgba(255,255,255,0.07)",
            transition: "all 0.3s",
          }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, color: cfg.color, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(240,232,208,0.45)", lineHeight: 1.5 }}>{desc.text}</div>
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

function ToolBtn({ active, onClick, color, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px",
      background: active ? `${color}1a` : "transparent",
      border: `1px solid ${active ? `${color}77` : "rgba(255,255,255,0.07)"}`,
      borderRadius: 8, color: active ? color : "#5a4e35",
      fontFamily: "'DM Mono',monospace", fontSize: 11,
      fontWeight: 600, cursor: "pointer", letterSpacing: "0.1em", transition: "all 0.15s",
    }}>{children}</button>
  );
}