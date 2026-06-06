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

const Y_DESCRIPTIONS: Record<number, { label: string; pct: string; recommended?: boolean }> = {
  [-64]: { label: "Floor",   pct: "100% bedrock — no pattern" },
  [-63]: { label: "Layer 1", pct: "~80% bedrock",  recommended: true },
  [-62]: { label: "Layer 2", pct: "~60% bedrock" },
  [-61]: { label: "Layer 3", pct: "~40% bedrock" },
  [-60]: { label: "Layer 4", pct: "~20% bedrock" },
  [0]:   { label: "Floor",   pct: "100% bedrock — no pattern" },
  [1]:   { label: "Layer 1", pct: "~80% bedrock", recommended: true },
  [2]:   { label: "Layer 2", pct: "~60% bedrock" },
  [3]:   { label: "Layer 3", pct: "~40% bedrock" },
  [4]:   { label: "Layer 4", pct: "~20% bedrock" },
};

export function ConfigPanel(props: Props) {
  const {
    mode, edition, yLevel, floorY, maxY,
    worldSeed, searchRadius, loose, rows, cols,
    anchorX, anchorZ, seedMin, seedMax,
  } = props;

  const yLevels = Array.from({ length: maxY - floorY + 1 }, (_, i) => floorY + i);
  const yDesc = Y_DESCRIPTIONS[yLevel];

  return (
    <div className="config-panel">
      <h2 className="panel-title">Configuration</h2>

      {/* Edition */}
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

      {/* Y Level */}
      <div className="config-group">
        <label className="config-label">Y-Level you scanned</label>
        <div className="segmented segmented--wrap">
          {yLevels.map(y => {
            const d = Y_DESCRIPTIONS[y];
            return (
              <button
                key={y}
                className={`segmented-btn ylevel-btn ${yLevel === y ? "active" : ""} ${d?.recommended ? "recommended" : ""}`}
                onClick={() => props.onYLevelChange(y)}
                title={d ? `${d.label} — ${d.pct}` : ""}
              >
                {y}
                {d?.recommended && <span className="ylevel-star">★</span>}
              </button>
            );
          })}
        </div>
        {yDesc && (
          <div className="ylevel-desc">
            <span className="ylevel-name">{yDesc.label}</span>
            <span className="ylevel-pct">{yDesc.pct}</span>
            {yDesc.recommended && <span className="ylevel-rec">★ Best for accuracy</span>}
          </div>
        )}
        <div className="config-hint">
          {edition === "java"
            ? "Stand at y=−58, open F3. Look at the bedrock blocks on the floor beneath you."
            : "Stand at y=6, look at the bedrock blocks on the floor beneath you."}
        </div>
      </div>

      {/* Grid size */}
      <div className="config-row">
        <div className="config-group">
          <label className="config-label">Grid cols</label>
          <input className="config-input" type="number" min={2} max={32} value={cols} onChange={e => props.onColsChange(Number(e.target.value))} />
        </div>
        <div className="config-group">
          <label className="config-label">Grid rows</label>
          <input className="config-input" type="number" min={2} max={32} value={rows} onChange={e => props.onRowsChange(Number(e.target.value))} />
        </div>
      </div>

      {/* Coords mode fields */}
      {mode === "coords" && <>
        <div className="config-group">
          <label className="config-label">
            World Seed
            <span className="config-badge required">Required</span>
          </label>
          <input
            className={`config-input ${worldSeed && !isValidSeed(worldSeed) ? "config-input--error" : ""}`}
            type="text"
            placeholder="e.g. 1234567890"
            value={worldSeed}
            onChange={e => props.onWorldSeedChange(e.target.value)}
          />
          {worldSeed && !isValidSeed(worldSeed) && (
            <span className="config-error">Must be a whole number (positive or negative)</span>
          )}
        </div>

        <div className="config-group">
          <label className="config-label">
            Search Radius
            <span className="config-badge">{(searchRadius * 2).toLocaleString()} blocks total</span>
          </label>
          <input className="config-input" type="range" min={100} max={250000} step={100} value={searchRadius}
            onChange={e => props.onSearchRadiusChange(Number(e.target.value))} />
          <div className="radius-row">
            <span className="config-hint">Searches from −{searchRadius.toLocaleString()} to +{searchRadius.toLocaleString()}</span>
            <span className="config-value">±{searchRadius.toLocaleString()}</span>
          </div>
        </div>

        <div className="config-group">
          <label className="config-label toggle-label">
            <div>
              Loose Mode
              <div className="config-hint">Tries all 8 rotations &amp; flips of your pattern. Use when you're unsure which direction you were facing.</div>
            </div>
            <button className={`toggle ${loose ? "toggle--on" : ""}`} onClick={() => props.onLooseChange(!loose)}>
              <span className="toggle-knob" />
            </button>
          </label>
        </div>
      </>}

      {/* Seed finder fields */}
      {mode === "seed" && <>
        <div className="config-callout">
          <strong>How to use:</strong> Paint the bedrock pattern you see beneath your feet, then enter the coordinates shown in your F3 screen (Java) or the coordinates display (Bedrock). The tool will find which world seed produces that exact pattern at your location.
        </div>

        <div className="config-group">
          <label className="config-label">
            Your X coordinate
            <span className="config-hint">From F3 (Java) or coordinates display. Stand in the <em>middle</em> of where you painted.</span>
          </label>
          <input className="config-input" type="number" value={anchorX} onChange={e => props.onAnchorXChange(Number(e.target.value))} />
        </div>

        <div className="config-group">
          <label className="config-label">
            Your Z coordinate
            <span className="config-hint">From F3 (Java) or coordinates display. Same spot.</span>
          </label>
          <input className="config-input" type="number" value={anchorZ} onChange={e => props.onAnchorZChange(Number(e.target.value))} />
        </div>

        <div className="config-group">
          <label className="config-label">Seed search range</label>
          <div className="config-hint" style={{marginBottom: 6}}>
            The tool will try every integer from <strong>min</strong> to <strong>max</strong>. Wider range = longer wait. Start small (0 → 10,000,000) then widen if needed.
          </div>
          <div className="config-row">
            <div className="config-group">
              <label className="config-label">From (min seed)</label>
              <input className="config-input" type="text" placeholder="0" value={seedMin} onChange={e => props.onSeedMinChange(e.target.value)} />
            </div>
            <div className="config-group">
              <label className="config-label">To (max seed)</label>
              <input className="config-input" type="text" placeholder="100000000" value={seedMax} onChange={e => props.onSeedMaxChange(e.target.value)} />
            </div>
          </div>
        </div>
      </>}
    </div>
  );
}

function isValidSeed(s: string): boolean {
  try { BigInt(s); return true; } catch { return false; }
}