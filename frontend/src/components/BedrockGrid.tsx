import { useCallback, useState } from "react";
import type { Grid } from "@bedrock-finder/shared";

type CellValue = 0 | 1 | -1;

interface Props {
  rows: number;
  cols: number;
  grid: Grid;
  onChange: (grid: Grid) => void;
}

const CYCLE: Record<number, CellValue> = { [-1]: 1, 1: 0, 0: -1 };

// SVG block icons
function BedrockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" fill="#333"/>
      <rect x="1" y="1" width="3" height="3" fill="#555"/>
      <rect x="6" y="2" width="2" height="2" fill="#444"/>
      <rect x="11" y="1" width="4" height="2" fill="#555"/>
      <rect x="2" y="6" width="4" height="2" fill="#444"/>
      <rect x="8" y="5" width="3" height="3" fill="#555"/>
      <rect x="13" y="6" width="2" height="3" fill="#444"/>
      <rect x="1" y="10" width="2" height="3" fill="#555"/>
      <rect x="5" y="11" width="4" height="2" fill="#444"/>
      <rect x="11" y="10" width="3" height="3" fill="#555"/>
      <rect x="3" y="14" width="3" height="2" fill="#444"/>
      <rect x="9" y="13" width="2" height="3" fill="#555"/>
    </svg>
  );
}

function StoneIcon() {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" fill="#7a7a7a"/>
      <rect x="1" y="1" width="6" height="5" fill="#8a8a8a"/>
      <rect x="9" y="1" width="6" height="5" fill="#888"/>
      <rect x="1" y="8" width="4" height="4" fill="#888"/>
      <rect x="7" y="8" width="5" height="4" fill="#8a8a8a"/>
      <rect x="0" y="0" width="16" height="1" fill="#6a6a6a"/>
      <rect x="0" y="0" width="1" height="16" fill="#6a6a6a"/>
      <rect x="0" y="6" width="16" height="1" fill="#6a6a6a"/>
      <rect x="7" y="0" width="1" height="6" fill="#6a6a6a"/>
      <rect x="5" y="7" width="1" height="5" fill="#6a6a6a"/>
      <rect x="12" y="7" width="1" height="5" fill="#6a6a6a"/>
    </svg>
  );
}

function UnknownIcon() {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" fill="none"/>
      <text x="8" y="12" textAnchor="middle" fontSize="10" fill="#555" fontFamily="monospace">?</text>
    </svg>
  );
}

export function buildEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(-1) as (0 | 1 | -1)[]);
}

export function BedrockGrid({ rows, cols, grid, onChange }: Props) {
  const [painting, setPainting] = useState<CellValue | null>(null);

  const setCell = useCallback((r: number, c: number, v: CellValue) => {
    onChange(grid.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? v : cell)) as Grid);
  }, [grid, onChange]);

  return (
    <div className="grid-container" onMouseLeave={() => setPainting(null)}>
      <div className="grid-header">
        <span className="grid-title">Pattern Grid</span>
        <div className="grid-actions">
          <button className="btn-ghost" onClick={() => onChange(buildEmptyGrid(rows, cols))}>Clear</button>
          <button className="btn-ghost" onClick={() => onChange(Array.from({ length: rows }, () => Array(cols).fill(1)) as Grid)}>All Bedrock</button>
          <button className="btn-ghost" onClick={() => onChange(Array.from({ length: rows }, () => Array(cols).fill(0)) as Grid)}>All Stone</button>
        </div>
      </div>

      <div
        className="grid-board"
        style={{ "--cols": cols } as React.CSSProperties}
        onMouseUp={() => setPainting(null)}
        onDragStart={e => e.preventDefault()}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => {
            const type = cell === 1 ? "bedrock" : cell === 0 ? "stone" : "unknown";
            return (
              <div
                key={`${ri}-${ci}`}
                className={`cell cell--${type}`}
                title={type === "bedrock" ? "Bedrock" : type === "stone" ? "Stone / Air" : "Unknown — click to set"}
                onMouseDown={() => {
                  const next = CYCLE[cell];
                  setPainting(next);
                  setCell(ri, ci, next);
                }}
                onMouseEnter={() => {
                  if (painting === null || grid[ri][ci] === painting) return;
                  setCell(ri, ci, painting);
                }}
              >
                {cell === 1 ? <BedrockIcon /> : cell === 0 ? <StoneIcon /> : <UnknownIcon />}
              </div>
            );
          })
        )}
      </div>

      <div className="grid-legend">
        <div className="legend-item"><div className="cell cell--bedrock cell--sm"><BedrockIcon /></div> Bedrock</div>
        <div className="legend-item"><div className="cell cell--stone cell--sm"><StoneIcon /></div> Stone</div>
        <div className="legend-item"><div className="cell cell--unknown cell--sm"><UnknownIcon /></div> Unknown</div>
      </div>
    </div>
  );
}
