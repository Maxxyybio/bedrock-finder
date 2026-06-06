import { useState } from "react";
import type { Grid, Edition } from "@bedrock-finder/shared";
import { JAVA_FLOOR_Y, JAVA_MAX_Y, BEDROCK_FLOOR_Y, BEDROCK_MAX_Y } from "@bedrock-finder/shared";
import { BedrockGrid, buildEmptyGrid } from "./components/BedrockGrid.js";
import { ConfigPanel } from "./components/ConfigPanel.js";
import { ResultsPanel } from "./components/ResultsPanel.js";
import { SeedPanel } from "./components/SeedPanel.js";
import { usePatternAnalysis } from "./hooks/usePatternAnalysis.js";

const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 8;

type Mode = "coords" | "seed";

export default function App() {
  const [mode, setMode] = useState<Mode>("coords");
  const [edition, setEdition] = useState<Edition>("java");
  const [yLevel, setYLevel] = useState(-63);
  const [worldSeed, setWorldSeed] = useState("");
  const [searchRadius, setSearchRadius] = useState(1000);
  const [loose, setLoose] = useState(false);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<Grid>(() => buildEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [anchorX, setAnchorX] = useState(0);
  const [anchorZ, setAnchorZ] = useState(0);
  const [seedMin, setSeedMin] = useState("0");
  const [seedMax, setSeedMax] = useState("100000000");

  const { status, result, seedResult, error, runAnalyse, runSeed, reset } = usePatternAnalysis();

  const floorY = edition === "java" ? JAVA_FLOOR_Y : BEDROCK_FLOOR_Y;
  const maxY   = edition === "java" ? JAVA_MAX_Y   : BEDROCK_MAX_Y;

  function handleEditionChange(e: Edition) {
    setEdition(e);
    setYLevel(e === "java" ? JAVA_FLOOR_Y + 1 : BEDROCK_FLOOR_Y + 1);
    reset();
  }

  function handleRowsChange(v: number) {
    const c = Math.max(2, Math.min(32, v));
    setRows(c); setGrid(buildEmptyGrid(c, cols)); reset();
  }

  function handleColsChange(v: number) {
    const c = Math.max(2, Math.min(32, v));
    setCols(c); setGrid(buildEmptyGrid(rows, c)); reset();
  }

  function handleAnalyse() {
    if (!worldSeed.trim()) return;
    runAnalyse({ grid, yLevel, edition, worldSeed, searchRadius, loose });
  }

  function handleSeedFind() {
    runSeed({ grid, yLevel, edition, anchorX, anchorZ, seedMin, seedMax });
  }

  const knownCells = grid.flat().filter(v => v !== -1).length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">🪨</span>
            <div>
              <h1 className="brand-title">Bedrock Finder</h1>
              <p className="brand-sub">Reverse-engineer Minecraft coordinates from bedrock patterns</p>
            </div>
          </div>
          <div className="mode-tabs">
            <button className={`mode-tab ${mode === "coords" ? "active" : ""}`} onClick={() => { setMode("coords"); reset(); }}>
              Find Coords
            </button>
            <button className={`mode-tab ${mode === "seed" ? "active" : ""}`} onClick={() => { setMode("seed"); reset(); }}>
              Find Seed
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="panel panel--left">
          <ConfigPanel
            mode={mode}
            edition={edition}
            yLevel={yLevel}
            floorY={floorY}
            maxY={maxY}
            worldSeed={worldSeed}
            searchRadius={searchRadius}
            loose={loose}
            rows={rows}
            cols={cols}
            anchorX={anchorX}
            anchorZ={anchorZ}
            seedMin={seedMin}
            seedMax={seedMax}
            onEditionChange={handleEditionChange}
            onYLevelChange={v => { setYLevel(v); reset(); }}
            onWorldSeedChange={v => { setWorldSeed(v); reset(); }}
            onSearchRadiusChange={setSearchRadius}
            onLooseChange={setLoose}
            onRowsChange={handleRowsChange}
            onColsChange={handleColsChange}
            onAnchorXChange={setAnchorX}
            onAnchorZChange={setAnchorZ}
            onSeedMinChange={setSeedMin}
            onSeedMaxChange={setSeedMax}
          />

          <BedrockGrid
            rows={rows}
            cols={cols}
            grid={grid}
            onChange={g => { setGrid(g); reset(); }}
          />

          <div className="analyse-bar">
            <span className="cell-count">{knownCells} / {rows * cols} cells filled</span>
            {mode === "coords" ? (
              <button
                className="btn-analyse"
                onClick={handleAnalyse}
                disabled={knownCells === 0 || !worldSeed.trim() || status === "loading"}
              >
                {status === "loading" ? "Scanning…" : "Analyse →"}
              </button>
            ) : (
              <button
                className="btn-analyse"
                onClick={handleSeedFind}
                disabled={knownCells === 0 || status === "loading"}
              >
                {status === "loading" ? "Searching seeds…" : "Find Seed →"}
              </button>
            )}
          </div>
        </section>

        <section className="panel panel--right">
          {mode === "coords"
            ? <ResultsPanel status={status} result={result} error={error} />
            : <SeedPanel status={status} result={seedResult} error={error} />
          }
        </section>
      </main>
    </div>
  );
}
