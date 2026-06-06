import type { Edition } from "@bedrock-finder/shared";

interface Props {
  edition: Edition;
  yLevel: number;
  worldSeed: string;
  searchRadius: number;
  rows: number;
  cols: number;
  onEditionChange: (v: Edition) => void;
  onYLevelChange: (v: number) => void;
  onWorldSeedChange: (v: string) => void;
  onSearchRadiusChange: (v: number) => void;
  onRowsChange: (v: number) => void;
  onColsChange: (v: number) => void;
}

const Y_LEVELS_JAVA = [0, 1, 2, 3, 4];
const Y_LEVELS_BEDROCK = [0, 1, 2, 3, 4, 5];

export function ConfigPanel({
  edition,
  yLevel,
  worldSeed,
  searchRadius,
  rows,
  cols,
  onEditionChange,
  onYLevelChange,
  onWorldSeedChange,
  onSearchRadiusChange,
  onRowsChange,
  onColsChange,
}: Props) {
  const yLevels = edition === "java" ? Y_LEVELS_JAVA : Y_LEVELS_BEDROCK;

  return (
    <div className="config-panel">
      <h2 className="panel-title">Configuration</h2>

      <div className="config-group">
        <label className="config-label">Edition</label>
        <div className="segmented">
          {(["java", "bedrock"] as Edition[]).map((e) => (
            <button
              key={e}
              className={`segmented-btn ${edition === e ? "active" : ""}`}
              onClick={() => onEditionChange(e)}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="config-group">
        <label className="config-label">
          Y-Level Scanned
          <span className="config-hint">
            Stand at y=5, look down. Use y=4 for best results.
          </span>
        </label>
        <div className="segmented">
          {yLevels.map((y) => (
            <button
              key={y}
              className={`segmented-btn ${yLevel === y ? "active" : ""}`}
              onClick={() => onYLevelChange(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="config-row">
        <div className="config-group">
          <label className="config-label">Grid Columns</label>
          <input
            className="config-input"
            type="number"
            min={2}
            max={32}
            value={cols}
            onChange={(e) => onColsChange(Number(e.target.value))}
          />
        </div>
        <div className="config-group">
          <label className="config-label">Grid Rows</label>
          <input
            className="config-input"
            type="number"
            min={2}
            max={32}
            value={rows}
            onChange={(e) => onRowsChange(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="config-group">
        <label className="config-label">
          World Seed
          <span className="config-hint">Leave blank for seed-agnostic search</span>
        </label>
        <input
          className="config-input"
          type="text"
          placeholder="e.g. 1234567890"
          value={worldSeed}
          onChange={(e) => onWorldSeedChange(e.target.value)}
        />
      </div>

      <div className="config-group">
        <label className="config-label">
          Search Radius
          <span className="config-hint">{searchRadius * 2}×{searchRadius * 2} blocks searched</span>
        </label>
        <input
          className="config-input"
          type="range"
          min={100}
          max={10000}
          step={100}
          value={searchRadius}
          onChange={(e) => onSearchRadiusChange(Number(e.target.value))}
        />
        <span className="config-value">±{searchRadius.toLocaleString()}</span>
      </div>
    </div>
  );
}
