import { useCallback, useState } from "react";
import type { Grid } from "@bedrock-finder/shared";

type CellValue = 0 | 1 | -1;

interface Props {
  rows: number;
  cols: number;
  grid: Grid;
  onChange: (grid: Grid) => void;
}

const CELL_CYCLE: Record<CellValue, CellValue> = {
  [-1]: 1,  // unknown → bedrock
  1: 0,    // bedrock  → stone
  0: -1,   // stone    → unknown
};

const CELL_LABEL: Record<CellValue, string> = {
  1: "■",
  0: "□",
  [-1]: "?",
};

const CELL_TITLE: Record<CellValue, string> = {
  1: "Bedrock",
  0: "Stone / Air",
  [-1]: "Unknown — click to cycle",
};

function buildEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => -1 as CellValue)
  );
}

export function BedrockGrid({ rows, cols, grid, onChange }: Props) {
  // Track mouse-down state to allow click-and-drag painting.
  const [painting, setPainting] = useState<CellValue | null>(null);

  const cycleCell = useCallback(
    (row: number, col: number) => {
      const next = CELL_CYCLE[grid[row][col] as CellValue];
      const updated = grid.map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? next : c))
      );
      onChange(updated as Grid);
      return next;
    },
    [grid, onChange]
  );

  const handleMouseDown = (row: number, col: number) => {
    const next = cycleCell(row, col);
    setPainting(next);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (painting === null) return;
    const current = grid[row][col];
    if (current === painting) return;
    const updated = grid.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? painting : c))
    );
    onChange(updated as Grid);
  };

  const handleMouseUp = () => setPainting(null);

  const handleClear = () => onChange(buildEmptyGrid(rows, cols));

  const handleFillBedrock = () =>
    onChange(
      Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => 1 as CellValue)
      ) as Grid
    );

  return (
    <div className="grid-container" onMouseLeave={handleMouseUp}>
      <div className="grid-header">
        <span className="grid-title">Pattern Grid</span>
        <div className="grid-actions">
          <button className="btn-ghost" onClick={handleClear}>
            Clear
          </button>
          <button className="btn-ghost" onClick={handleFillBedrock}>
            Fill Bedrock
          </button>
        </div>
      </div>

      <div
        className="grid-board"
        style={{ "--cols": cols } as React.CSSProperties}
        onMouseUp={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
              className={`cell cell--${cell === 1 ? "bedrock" : cell === 0 ? "stone" : "unknown"}`}
              title={CELL_TITLE[cell as CellValue]}
              aria-label={`Row ${ri + 1}, Col ${ci + 1}: ${CELL_TITLE[cell as CellValue]}`}
              onMouseDown={() => handleMouseDown(ri, ci)}
              onMouseEnter={() => handleMouseEnter(ri, ci)}
            >
              {CELL_LABEL[cell as CellValue]}
            </button>
          ))
        )}
      </div>

      <div className="grid-legend">
        <span className="legend-item">
          <span className="cell cell--bedrock cell--sm">■</span> Bedrock
        </span>
        <span className="legend-item">
          <span className="cell cell--stone cell--sm">□</span> Stone
        </span>
        <span className="legend-item">
          <span className="cell cell--unknown cell--sm">?</span> Unknown
        </span>
      </div>
    </div>
  );
}

export { buildEmptyGrid };
export type { CellValue };
