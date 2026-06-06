import { useState } from "react";
import type { Grid, Edition } from "@bedrock-finder/shared";
import { BedrockGrid, buildEmptyGrid } from "./components/BedrockGrid.js";
import { ConfigPanel } from "./components/ConfigPanel.js";
import { ResultsPanel } from "./components/ResultsPanel.js";
import { usePatternAnalysis } from "./hooks/usePatternAnalysis.js";

const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 8;

export default function App() {
  const [edition, setEdition] = useState<Edition>("java");
  const [yLevel, setYLevel] = useState(4);
  const [worldSeed, setWorldSeed] = useState("");
  const [searchRadius, setSearchRadius] = useState(1000);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<Grid>(() =>
    buildEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS)
  );

  const { status, result, error, run, reset } = usePatternAnalysis();

  function handleRowsChange(newRows: number) {
    const clamped = Math.max(2, Math.min(32, newRows));
    setRows(clamped);
    setGrid(buildEmptyGrid(clamped, cols));
    reset();
  }

  function handleColsChange(newCols: number) {
    const clamped = Math.max(2, Math.min(32, newCols));
    setCols(clamped);
    setGrid(buildEmptyGrid(rows, clamped));
    reset();
  }

  function handleAnalyse() {
    run({ grid, yLevel, edition, worldSeed, searchRadius });
  }

  const knownCells = grid.flat().filter((v) => v !== -1).length;
  const totalCells = rows * cols;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">🪨</span>
            <div>
              <h1 className="brand-title">Bedrock Finder</h1>
              <p className="brand-sub">
                Reverse-engineer your Minecraft coordinates from bedrock patterns
              </p>
            </div>
          </div>
          <a
            href="https://github.com/your-org/bedrock-finder"
            target="_blank"
            rel="noreferrer"
            className="github-link"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      <main className="app-main">
        <section className="panel panel--grid">
          <ConfigPanel
            edition={edition}
            yLevel={yLevel}
            worldSeed={worldSeed}
            searchRadius={searchRadius}
            rows={rows}
            cols={cols}
            onEditionChange={(v) => { setEdition(v); reset(); }}
            onYLevelChange={(v) => { setYLevel(v); reset(); }}
            onWorldSeedChange={(v) => { setWorldSeed(v); reset(); }}
            onSearchRadiusChange={setSearchRadius}
            onRowsChange={handleRowsChange}
            onColsChange={handleColsChange}
          />

          <BedrockGrid
            rows={rows}
            cols={cols}
            grid={grid}
            onChange={(g) => { setGrid(g); reset(); }}
          />

          <div className="analyse-bar">
            <span className="cell-count">
              {knownCells} / {totalCells} cells filled
            </span>
            <button
              className="btn-analyse"
              onClick={handleAnalyse}
              disabled={knownCells === 0 || status === "loading"}
            >
              {status === "loading" ? "Scanning…" : "Analyse Pattern →"}
            </button>
          </div>
        </section>

        <section className="panel panel--results">
          <ResultsPanel status={status} result={result} error={error} />
        </section>
      </main>
    </div>
  );
}
