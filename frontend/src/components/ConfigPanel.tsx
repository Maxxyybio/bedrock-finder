import type { Edition } from "@bedrock-finder/shared";

type Mode = "coords" | "seed";

interface Props {
  mode: Mode;
  edition: Edition;
  yLevel: number;
  floorY: number;
  maxY: number;
  worldSeed: string;
  searchRadius: number;
  loose: boolean;
  rows: number;
  cols: number;
  anchorX: number;
  anchorZ: number;
  seedMin: string;
  seedMax: string;
  onEditionChange: (v: Edition) => void;
  onYLevelChange: (v: number) => void;
  onWorldSeedChange: (v: string) => void;
  onSearchRadiusChange: (v: number) => void;
  onLooseChange: (v: boolean) => void;
  onRowsChange: (v: number) => void;
  onColsChange: (v: number) => void;
  onAnchorXChange: (v: number) => void;
  onAnchorZChange: (v: number) => void;
  onSeedMinChange: (v: string) => void;
  onSeedMaxChange: (v: string) => void;
}

export function ConfigPanel(props: Props) {
  const {
    mode, edition, yLevel, floorY, maxY,
    worldSeed, searchRadius, loose, rows, cols,
    anchorX, anchorZ, seedMin, seedMax,
  } = props;

  const yLevels = Array.from({ length: maxY - floorY + 1 }, (_, i) => floorY + i);

  return (
    <div className="config-panel">
      <h2 className="panel-title">Configuration</h2>

      <div className="config-group">
        <label className="config-label">Edition</label>
        <div className="segmented">
          {(["java", "bedrock"] as Edition[]).map(e => (
            <button key={e} className={`segmented-btn ${edition === e ? "active" : ""}`} onClick={() => props.onEditionChange(e)}>
              {e === "java" ? "Java 1.18+" : "Bedrock"}
            </button>
          ))}
        </div>
      </div>

      <div className="config-group">
        <label className="config-label">
          Y-Level
          <span className="config-hint">
            {edition === "java" ? "Stand at y=-59, look down. Use y=-63 for best results." : "Stand at y=5, look down. Use y=3 for best results."}
          </span>
        </label>
        <div className="segmented segmented--wrap">
          {yLevels.map(y => (
            <button key={y} className={`segmented-btn ${yLevel === y ? "active" : ""}`} onClick={() => props.onYLevelChange(y)}>
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="config-row">
        <div className="config-group">
          <label className="config-label">Cols</label>
          <input className="config-input" type="number" min={2} max={32} value={cols} onChange={e => props.onColsChange(Number(e.target.value))} />
        </div>
        <div className="config-group">
          <label className="config-label">Rows</label>
          <input className="config-input" type="number" min={2} max={32} value={rows} onChange={e => props.onRowsChange(Number(e.target.value))} />
        </div>
      </div>

      {mode === "coords" && <>
        <div className="config-group">
          <label className="config-label">
            World Seed <span className="config-hint required">Required</span>
          </label>
          <input
            className="config-input"
            type="text"
            placeholder="e.g. 1234567890"
            value={worldSeed}
            onChange={e => props.onWorldSeedChange(e.target.value)}
          />
        </div>

        <div className="config-group">
          <label className="config-label">
            Search Radius
            <span className="config-hint">{(searchRadius * 2).toLocaleString()} total blocks</span>
          </label>
          <input className="config-input" type="range" min={100} max={250000} step={100} value={searchRadius} onChange={e => props.onSearchRadiusChange(Number(e.target.value))} />
          <span className="config-value">±{searchRadius.toLocaleString()}</span>
        </div>

        <div className="config-group">
          <label className="config-label toggle-label">
            <span>
              Loose Mode
              <span className="config-hint">Tries all rotations & flips. Use when unsure of exact orientation.</span>
            </span>
            <button className={`toggle ${loose ? "toggle--on" : ""}`} onClick={() => props.onLooseChange(!loose)}>
              <span className="toggle-knob" />
            </button>
          </label>
        </div>
      </>}

      {mode === "seed" && <>
        <div className="config-group">
          <label className="config-label">Your X coordinate</label>
          <input className="config-input" type="number" value={anchorX} onChange={e => props.onAnchorXChange(Number(e.target.value))} />
        </div>
        <div className="config-group">
          <label className="config-label">Your Z coordinate</label>
          <input className="config-input" type="number" value={anchorZ} onChange={e => props.onAnchorZChange(Number(e.target.value))} />
        </div>
        <div className="config-row">
          <div className="config-group">
            <label className="config-label">Seed min</label>
            <input className="config-input" type="text" value={seedMin} onChange={e => props.onSeedMinChange(e.target.value)} />
          </div>
          <div className="config-group">
            <label className="config-label">Seed max</label>
            <input className="config-input" type="text" value={seedMax} onChange={e => props.onSeedMaxChange(e.target.value)} />
          </div>
        </div>
      </>}
    </div>
  );
}
