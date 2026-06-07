import { useState } from "react";
import type { Grid } from "@bedrock-finder/shared";

type Cell = 0 | 1 | -1;
const NEXT: Record<number, Cell> = { [-1]: 1, 1: 0, 0: -1 };

export function makeGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(-1) as Cell[]);
}

// ---------------------------------------------------------------------------
// Pixel-art SVG textures (16×16 Minecraft-accurate)
// ---------------------------------------------------------------------------
function Bedrock() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      style={{ display:"block", width:"100%", height:"100%", imageRendering:"pixelated" }}>
      <rect width="16" height="16" fill="#111"/>
      <rect x="1"  y="1"  width="4" height="3" fill="#444"/>
      <rect x="7"  y="0"  width="3" height="2" fill="#3a3a3a"/>
      <rect x="12" y="1"  width="3" height="4" fill="#444"/>
      <rect x="0"  y="5"  width="2" height="4" fill="#3a3a3a"/>
      <rect x="4"  y="4"  width="4" height="4" fill="#333"/>
      <rect x="9"  y="3"  width="3" height="3" fill="#444"/>
      <rect x="13" y="6"  width="3" height="3" fill="#3a3a3a"/>
      <rect x="1"  y="9"  width="3" height="4" fill="#444"/>
      <rect x="6"  y="8"  width="4" height="5" fill="#333"/>
      <rect x="11" y="9"  width="4" height="4" fill="#444"/>
      <rect x="2"  y="13" width="4" height="3" fill="#3a3a3a"/>
      <rect x="8"  y="14" width="3" height="2" fill="#444"/>
      {/* highlight flecks */}
      <rect x="3"  y="2"  width="1" height="1" fill="#666"/>
      <rect x="14" y="2"  width="1" height="1" fill="#555"/>
      <rect x="5"  y="6"  width="1" height="1" fill="#555"/>
      <rect x="10" y="4"  width="1" height="1" fill="#666"/>
      <rect x="2"  y="11" width="1" height="1" fill="#555"/>
      <rect x="12" y="10" width="1" height="1" fill="#666"/>
      <rect x="7"  y="15" width="1" height="1" fill="#555"/>
    </svg>
  );
}

function Stone() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      style={{ display:"block", width:"100%", height:"100%", imageRendering:"pixelated" }}>
      <rect width="16" height="16" fill="#888"/>
      <rect x="1" y="1" width="6" height="5" fill="#999"/>
      <rect x="9" y="1" width="6" height="4" fill="#929292"/>
      <rect x="2" y="7" width="4" height="5" fill="#919191"/>
      <rect x="8" y="6" width="6" height="5" fill="#9a9a9a"/>
      <rect x="1" y="12" width="6" height="3" fill="#939393"/>
      <rect x="9" y="12" width="5" height="3" fill="#8e8e8e"/>
      {/* mortar */}
      <rect x="0"  y="6"  width="16" height="1" fill="#6e6e6e"/>
      <rect x="0"  y="11" width="16" height="1" fill="#6e6e6e"/>
      <rect x="7"  y="0"  width="1" height="6"  fill="#6e6e6e"/>
      <rect x="6"  y="7"  width="1" height="4"  fill="#6e6e6e"/>
      <rect x="11" y="7"  width="1" height="4"  fill="#6e6e6e"/>
      <rect x="7"  y="12" width="1" height="4"  fill="#6e6e6e"/>
    </svg>
  );
}

function Unknown() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      style={{ display:"block", width:"100%", height:"100%", imageRendering:"pixelated" }}>
      <rect width="16" height="16" fill="#161616"/>
      <rect x="0" y="0" width="16" height="1" fill="#252525"/>
      <rect x="0" y="15" width="16" height="1" fill="#252525"/>
      <rect x="0" y="0" width="1" height="16" fill="#252525"/>
      <rect x="15" y="0" width="1" height="16" fill="#252525"/>
      <text x="8" y="12" textAnchor="middle" fontSize="9"
        fill="#383838" fontFamily="monospace" fontWeight="bold">?</text>
    </svg>
  );
}

interface Props {
  rows: number;
  cols: number;
  grid: Grid;
  /** Row/col of the "you are here" marker */
  youRow: number;
  youCol: number;
  onChange: (g: Grid) => void;
}

export function BedrockGrid({ rows, cols, grid, youRow, youCol, onChange }: Props) {
  const [painting, setPainting] = useState<Cell | null>(null);

  function setCell(r: number, c: number, v: Cell) {
    onChange(grid.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? v : cell)) as Grid);
  }

  return (
    <div className="grid-wrap" onMouseLeave={() => setPainting(null)}>
      <div className="grid-toolbar">
        <span className="grid-label">Paint what you see beneath your feet</span>
        <div className="grid-btns">
          <button className="gbtn" onClick={() => onChange(makeGrid(rows, cols))}>Clear</button>
          <button className="gbtn" onClick={() => onChange(Array.from({ length: rows }, () => Array(cols).fill(1)) as Grid)}>All bedrock</button>
        </div>
      </div>

      <div className="grid-board"
        style={{ "--gc": cols } as React.CSSProperties}
        onMouseUp={() => setPainting(null)}
        onDragStart={e => e.preventDefault()}
      >
        {grid.map((row, ri) => row.map((cell, ci) => {
          const isYou = ri === youRow && ci === youCol;
          return (
            <div
              key={`${ri}-${ci}`}
              className={[
                "gcell",
                cell === 1 ? "gcell-b" : cell === 0 ? "gcell-s" : "gcell-u",
                isYou ? "gcell-you" : "",
              ].join(" ")}
              title={isYou ? "Your position" : cell === 1 ? "Bedrock" : cell === 0 ? "Stone/Air" : "Unknown — click to set"}
              onMouseDown={() => { const v = isYou ? (cell as Cell) : NEXT[cell as Cell]; setPainting(v); setCell(ri, ci, v); }}
              onMouseEnter={() => { if (painting === null || grid[ri][ci] === painting) return; setCell(ri, ci, painting); }}
            >
              {cell === 1 ? <Bedrock /> : cell === 0 ? <Stone /> : <Unknown />}
              {isYou && <span className="you-marker">YOU</span>}
            </div>
          );
        }))}
      </div>

      <div className="grid-legend">
        <div className="gl-item"><div className="gcell gcell-b gl-swatch"><Bedrock /></div>Bedrock</div>
        <div className="gl-item"><div className="gcell gcell-s gl-swatch"><Stone /></div>Stone / Air</div>
        <div className="gl-item"><div className="gcell gcell-u gl-swatch"><Unknown /></div>Unknown (skip)</div>
        <div className="gl-tip">Click cycles · Drag to paint</div>
      </div>
    </div>
  );
}