import { useState } from "react";
import type { Grid, Edition } from "@bedrock-finder/shared";
import { BedrockGrid, makeGrid } from "./components/BedrockGrid.js";
import { ProgressBar } from "./components/ProgressBar.js";
import { useCoordSearch, useSeedSearch } from "./hooks/useAnalyse.js";

// Y-level config per edition
const Y_CONFIG = {
  java:    { floor: -64, max: -60, best: -63, hint: "Stand at y=−58 and look at the floor in F3 debug view." },
  bedrock: { floor: 0,   max: 4,   best: 3,   hint: "Stand at y=6 and look at the blocks on the floor." },
} as const;

// Always odd so there's a true center cell
const DEFAULT_SIZE = 9;
const center = (n: number) => Math.floor(n / 2);

type Tab = "coords" | "seed";

export default function App() {
  const [tab,    setTab]    = useState<Tab>("coords");
  const [edition, setEdition] = useState<Edition>("java");

  // Grid state
  const [size,    setSize]    = useState(DEFAULT_SIZE);
  const [grid,    setGrid]    = useState<Grid>(() => makeGrid(DEFAULT_SIZE, DEFAULT_SIZE));
  const youRow = center(size);
  const youCol = center(size);

  // Shared
  const [yLevel, setYLevel] = useState<number>(Y_CONFIG.java.best);

  // Coord tab
  const [seed,    setSeed]    = useState("");
  const [radius,  setRadius]  = useState(1000);
  const [loose,   setLoose]   = useState(false);
  const coord = useCoordSearch();

  // Seed tab
  const [anchorX, setAnchorX] = useState(0);
  const [anchorZ, setAnchorZ] = useState(0);
  const [sMin,    setSMin]    = useState("0");
  const [sMax,    setSMax]    = useState("10000000");
  const seedSearch = useSeedSearch();

  const ycfg = Y_CONFIG[edition];
  const yLevels = Array.from({ length: ycfg.max - ycfg.floor + 1 }, (_, i) => ycfg.floor + i);
  const filled  = grid.flat().filter(v => v !== -1).length;
  const total   = size * size;

  function changeEdition(e: Edition) {
    setEdition(e); setYLevel(Y_CONFIG[e].best);
    coord.reset(); seedSearch.reset();
  }
  function changeSize(n: number) {
    const s = Math.max(3, Math.min(21, n % 2 === 0 ? n + 1 : n)); // force odd
    setSize(s); setGrid(makeGrid(s, s));
    coord.reset(); seedSearch.reset();
  }

  function runCoord() {
    if (!seed.trim() || filled === 0) return;
    coord.run({ grid, yLevel, edition, worldSeed: seed, searchRadius: radius, loose });
  }
  function runSeed() {
    if (filled === 0) return;
    seedSearch.run({ grid, yLevel, edition, anchorX, anchorZ, seedMin: sMin, seedMax: sMax });
  }

  const scanning = coord.state.status === "scanning" || seedSearch.state.status === "scanning";

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="hdr">
        <div className="hdr-inner">
          <div className="hdr-brand">
            <span className="hdr-icon">🪨</span>
            <div>
              <h1 className="hdr-title">Bedrock Finder</h1>
              <p className="hdr-sub">Find your Minecraft coordinates from bedrock patterns</p>
            </div>
          </div>
          <div className="tabs">
            <button className={`tab ${tab === "coords" ? "tab-on" : ""}`}
              onClick={() => { setTab("coords"); coord.reset(); }}>Find Coordinates</button>
            <button className={`tab ${tab === "seed" ? "tab-on" : ""}`}
              onClick={() => { setTab("seed"); seedSearch.reset(); }}>Find Seed</button>
          </div>
        </div>
      </header>

      <div className="body">
        {/* ── Left panel: config + grid ── */}
        <aside className="sidebar">

          {/* Edition */}
          <div className="section">
            <div className="sec-label">Edition</div>
            <div className="seg">
              {(["java", "bedrock"] as Edition[]).map(e => (
                <button key={e} className={`seg-btn ${edition === e ? "seg-on" : ""}`}
                  onClick={() => changeEdition(e)}>
                  {e === "java" ? "Java 1.18+" : "Bedrock"}
                </button>
              ))}
            </div>
          </div>

          {/* Y-level */}
          <div className="section">
            <div className="sec-label">Y-Level scanned
              <span className="sec-badge">★ best = {ycfg.best}</span>
            </div>
            <div className="seg seg-wrap">
              {yLevels.map(y => (
                <button key={y}
                  className={`seg-btn ${yLevel === y ? "seg-on" : ""} ${y === ycfg.best ? "seg-star" : ""}`}
                  onClick={() => { setYLevel(y); coord.reset(); seedSearch.reset(); }}>
                  {y}{y === ycfg.best ? "★" : ""}
                </button>
              ))}
            </div>
            <div className="sec-hint">{ycfg.hint}</div>
          </div>

          {/* Grid size */}
          <div className="section">
            <div className="sec-label">Grid size (must be odd)
              <span className="sec-badge">{size}×{size}</span>
            </div>
            <input type="range" className="slider" min={3} max={21} step={2} value={size}
              onChange={e => changeSize(Number(e.target.value))} />
            <div className="sec-hint">The center cell (YOU) = your position. Paint outward.</div>
          </div>

          {/* Coord-mode fields */}
          {tab === "coords" && <>
            <div className="section">
              <div className="sec-label">World seed <span className="sec-required">required</span></div>
              <input className="inp" type="text" placeholder="e.g. 1234567890"
                value={seed} onChange={e => { setSeed(e.target.value); coord.reset(); }} />
              {seed && !/^-?\d+$/.test(seed.trim()) &&
                <div className="inp-err">Must be a whole number</div>}
            </div>
            <div className="section">
              <div className="sec-label">Search radius
                <span className="sec-badge">±{radius.toLocaleString()}</span>
              </div>
              <input type="range" className="slider" min={100} max={250000} step={100} value={radius}
                onChange={e => setRadius(Number(e.target.value))} />
              <div className="sec-hint">Searches {(radius * 2).toLocaleString()} × {(radius * 2).toLocaleString()} block area</div>
            </div>
            <div className="section">
              <label className="toggle-row">
                <div>
                  <div className="sec-label" style={{marginBottom:2}}>Loose mode</div>
                  <div className="sec-hint">Tries all 8 rotations and flips of your pattern</div>
                </div>
                <button className={`tog ${loose ? "tog-on" : ""}`} onClick={() => setLoose(v => !v)}>
                  <span className="tog-knob"/>
                </button>
              </label>
            </div>
          </>}

          {/* Seed-mode fields */}
          {tab === "seed" && <>
            <div className="callout">
              <strong>How it works:</strong> Paint the bedrock pattern you see at your feet. Enter your exact X and Z from F3 — you should be standing on the center cell marked YOU. The tool brute-forces seeds until one produces your pattern.
            </div>
            <div className="section">
              <div className="sec-label">Your X coordinate (from F3)</div>
              <input className="inp" type="number" value={anchorX}
                onChange={e => { setAnchorX(Number(e.target.value)); seedSearch.reset(); }} />
            </div>
            <div className="section">
              <div className="sec-label">Your Z coordinate (from F3)</div>
              <input className="inp" type="number" value={anchorZ}
                onChange={e => { setAnchorZ(Number(e.target.value)); seedSearch.reset(); }} />
            </div>
            <div className="section">
              <div className="sec-label">Seed range to search</div>
              <div className="row2">
                <div>
                  <div className="sec-hint">From</div>
                  <input className="inp" type="text" value={sMin} onChange={e => setSMin(e.target.value)} />
                </div>
                <div>
                  <div className="sec-hint">To</div>
                  <input className="inp" type="text" value={sMax} onChange={e => setSMax(e.target.value)} />
                </div>
              </div>
              <div className="sec-hint" style={{marginTop:6}}>
                Searching {(Number(sMax) - Number(sMin)).toLocaleString()} seeds. Start small, widen if no match.
              </div>
            </div>
          </>}
        </aside>

        {/* ── Center: grid ── */}
        <main className="main">
          <BedrockGrid
            rows={size} cols={size} grid={grid}
            youRow={youRow} youCol={youCol}
            onChange={g => { setGrid(g); coord.reset(); seedSearch.reset(); }}
          />
          <div className="action-bar">
            <span className="fill-count">{filled}/{total} cells painted</span>
            {tab === "coords"
              ? <button className="run-btn" onClick={runCoord}
                  disabled={filled === 0 || !seed.trim() || !/^-?\d+$/.test(seed.trim()) || scanning}>
                  {coord.state.status === "scanning"
                    ? `Scanning… ${coord.state.progress?.pct ?? 0}%`
                    : "Scan for coordinates →"}
                </button>
              : <button className="run-btn" onClick={runSeed}
                  disabled={filled === 0 || scanning}>
                  {seedSearch.state.status === "scanning"
                    ? `Searching seeds… ${seedSearch.state.progress?.pct ?? 0}%`
                    : "Find seed →"}
                </button>
            }
          </div>
        </main>

        {/* ── Right: results ── */}
        <section className="results">
          {tab === "coords" && <CoordResults state={coord.state} />}
          {tab === "seed"   && <SeedResults  state={seedSearch.state} />}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
import type { CoordState, SeedState } from "./hooks/useAnalyse.js";
import { useState as useLocalState } from "react";

function CoordResults({ state }: { state: CoordState }) {
  if (state.status === "idle") return (
    <div className="res-idle">
      <p className="res-idle-title">Results will appear here</p>
      <ul className="res-tips">
        <li>Paint the bedrock you see at y=−63 (starred option)</li>
        <li>The <span className="you-inline">YOU</span> cell = where you're standing</li>
        <li>More cells painted = more accurate</li>
        <li>Loose mode tries all rotations if unsure of facing</li>
      </ul>
    </div>
  );

  if (state.status === "scanning" && state.progress) return (
    <ProgressBar {...state.progress} label="Scanning coordinates…" />
  );

  if (state.status === "error") return (
    <div className="res-error">
      <div className="res-error-title">⚠ Error</div>
      <div className="res-error-msg">{state.error}</div>
    </div>
  );

  if (state.candidates.length === 0) return (
    <div className="res-idle">
      <p className="res-idle-title">No matches found</p>
      <ul className="res-tips">
        <li>Double-check your world seed</li>
        <li>Try y=−63 for most distinctive pattern</li>
        <li>Enable loose mode</li>
        <li>Increase search radius</li>
        <li>Paint more cells</li>
      </ul>
    </div>
  );

  return (
    <div className="res-list">
      <div className="res-header">
        <span className="res-title">{state.candidates.length} match{state.candidates.length !== 1 ? "es" : ""}</span>
        <span className="res-meta">{(state.searchedPositions / 1e6).toFixed(2)}M checked · {state.durationMs.toLocaleString()}ms</span>
      </div>
      {state.candidates.map((c, i) => <CoordRow key={`${c.x},${c.z}`} c={c} rank={i} />)}
    </div>
  );
}

function CoordRow({ c, rank }: { c: import("@bedrock-finder/shared").Candidate; rank: number }) {
  const [copied, setCopied] = useLocalState(false);
  const pct = Math.round(c.confidence * 100);
  const col = pct >= 95 ? "#4ade80" : pct >= 85 ? "#facc15" : "#fb923c";
  const cmd = `/tp @s ${c.x} ~ ${c.z}`;

  return (
    <div className={`res-row ${rank === 0 ? "res-row-best" : ""}`}>
      <span className="res-rank">#{rank + 1}</span>
      <div className="res-coords">
        <span className="res-x">X {c.x.toLocaleString()}</span>
        <span className="res-z">Z {c.z.toLocaleString()}</span>
      </div>
      <div className="res-conf">
        <div className="conf-track">
          <div className="conf-fill" style={{ width:`${pct}%`, background: col }}/>
        </div>
        <span className="conf-pct" style={{ color: col }}>{pct}%</span>
      </div>
      <span className="res-cells">{c.matchedCells}/{c.totalCells}</span>
      <button className="copy-btn" onClick={() => {
        navigator.clipboard.writeText(cmd);
        setCopied(true); setTimeout(() => setCopied(false), 1400);
      }}>{copied ? "✓" : "/tp"}</button>
    </div>
  );
}

function SeedResults({ state }: { state: SeedState }) {
  if (state.status === "idle") return (
    <div className="res-idle">
      <p className="res-idle-title">Seed results will appear here</p>
      <ul className="res-tips">
        <li>Paint your bedrock pattern</li>
        <li>Enter your exact X and Z from F3</li>
        <li>You must be standing on the YOU cell</li>
        <li>Start with a small seed range (0–10,000,000)</li>
      </ul>
    </div>
  );

  if (state.status === "scanning" && state.progress) return (
    <ProgressBar {...state.progress} label="Searching seeds…" />
  );

  if (state.status === "error") return (
    <div className="res-error">
      <div className="res-error-title">⚠ Error</div>
      <div className="res-error-msg">{state.error}</div>
    </div>
  );

  if (state.candidates.length === 0) return (
    <div className="res-idle">
      <p className="res-idle-title">No seeds matched</p>
      <ul className="res-tips">
        <li>Check your X and Z coordinates are exact</li>
        <li>Try a wider seed range</li>
        <li>Paint more cells in the grid</li>
      </ul>
    </div>
  );

  return (
    <div className="res-list">
      <div className="res-header">
        <span className="res-title">{state.candidates.length} seed{state.candidates.length !== 1 ? "s" : ""} found</span>
        <span className="res-meta">{state.searchedSeeds.toLocaleString()} seeds · {state.durationMs.toLocaleString()}ms</span>
      </div>
      {state.candidates.map((c, i) => {
        const pct = Math.round(c.confidence * 100);
        const col = pct >= 98 ? "#4ade80" : pct >= 90 ? "#facc15" : "#fb923c";
        return (
          <div key={String(c.seed)} className={`res-row ${i === 0 ? "res-row-best" : ""}`}>
            <span className="res-rank">#{i+1}</span>
            <div className="res-coords">
              <span className="res-x" style={{fontFamily:"var(--mono)"}}>Seed: {String(c.seed)}</span>
            </div>
            <div className="res-conf">
              <div className="conf-track">
                <div className="conf-fill" style={{ width:`${pct}%`, background: col }}/>
              </div>
              <span className="conf-pct" style={{ color: col }}>{pct}%</span>
            </div>
            <span className="res-cells">{c.matchedCells}/{c.totalCells}</span>
            <CopyBtn text={String(c.seed)} />
          </div>
        );
      })}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useLocalState(false);
  return (
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 1400);
    }}>{copied ? "✓" : "Copy"}</button>
  );
}