import { useCallback, useState } from "react";
import type { Grid } from "@bedrock-finder/shared";

type CellValue = 0 | 1 | -1;
const CYCLE: Record<number, CellValue> = { [-1]: 1, 1: 0, 0: -1 };

export function buildEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(-1) as CellValue[]);
}

// ---------------------------------------------------------------------------
// Authentic Minecraft pixel-art block textures as inline SVG
// ---------------------------------------------------------------------------

function BedrockTexture() {
  // 16×16 Minecraft bedrock — dark base with grey patches
  const patches = [
    [1,0,3,2],[5,0,2,1],[8,0,4,3],[13,0,3,2],
    [0,2,2,3],[3,2,1,1],[6,2,3,2],[10,2,2,2],[14,2,2,3],
    [0,5,3,2],[4,5,2,2],[7,5,4,3],[12,5,3,2],
    [1,8,2,2],[5,8,3,3],[9,8,2,2],[12,8,4,2],
    [0,11,4,2],[5,11,2,3],[8,11,3,2],[12,11,3,3],
    [2,14,3,2],[6,14,4,2],[11,14,3,2],
  ];
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%",imageRendering:"pixelated"}}>
      <rect width="16" height="16" fill="#222222"/>
      {patches.map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={i%3===0?"#555555":i%3===1?"#444444":"#333333"}/>
      ))}
      {/* Dark border flecks */}
      <rect x="4" y="1" width="1" height="1" fill="#111111"/>
      <rect x="10" y="4" width="1" height="1" fill="#111111"/>
      <rect x="2" y="9" width="1" height="1" fill="#111111"/>
      <rect x="8" y="13" width="1" height="1" fill="#111111"/>
      {/* Light highlight flecks */}
      <rect x="7" y="0" width="1" height="1" fill="#666666"/>
      <rect x="13" y="3" width="1" height="1" fill="#666666"/>
      <rect x="3" y="7" width="1" height="1" fill="#666666"/>
      <rect x="11" y="11" width="1" height="1" fill="#666666"/>
    </svg>
  );
}

function StoneTexture() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%",imageRendering:"pixelated"}}>
      <rect width="16" height="16" fill="#888888"/>
      {/* Stone grain */}
      <rect x="1" y="1" width="6" height="5" fill="#999999"/>
      <rect x="9" y="1" width="6" height="4" fill="#929292"/>
      <rect x="2" y="7" width="5" height="4" fill="#919191"/>
      <rect x="8" y="6" width="6" height="5" fill="#9a9a9a"/>
      <rect x="1" y="12" width="7" height="3" fill="#939393"/>
      <rect x="9" y="12" width="5" height="3" fill="#8e8e8e"/>
      {/* Mortar lines */}
      <rect x="0" y="6" width="16" height="1" fill="#777777"/>
      <rect x="0" y="11" width="16" height="1" fill="#777777"/>
      <rect x="7" y="0" width="1" height="6" fill="#777777"/>
      <rect x="4" y="7" width="1" height="4" fill="#777777"/>
      <rect x="11" y="7" width="1" height="4" fill="#777777"/>
      <rect x="6" y="12" width="1" height="4" fill="#777777"/>
    </svg>
  );
}

function DeepslateTexture() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%",imageRendering:"pixelated"}}>
      <rect width="16" height="16" fill="#4a4a52"/>
      {/* Deepslate layers */}
      <rect x="0" y="0" width="16" height="3" fill="#525258"/>
      <rect x="0" y="4" width="16" height="3" fill="#484850"/>
      <rect x="0" y="8" width="16" height="3" fill="#505058"/>
      <rect x="0" y="12" width="16" height="3" fill="#464650"/>
      {/* Horizontal grain lines */}
      <rect x="0" y="3" width="16" height="1" fill="#3e3e46"/>
      <rect x="0" y="7" width="16" height="1" fill="#3e3e46"/>
      <rect x="0" y="11" width="16" height="1" fill="#3e3e46"/>
      {/* Speckles */}
      <rect x="3" y="1" width="1" height="1" fill="#5a5a62"/>
      <rect x="9" y="2" width="1" height="1" fill="#3a3a42"/>
      <rect x="5" y="5" width="1" height="1" fill="#5a5a62"/>
      <rect x="13" y="6" width="1" height="1" fill="#3a3a42"/>
      <rect x="2" y="9" width="1" height="1" fill="#5a5a62"/>
      <rect x="11" y="10" width="1" height="1" fill="#3a3a42"/>
      <rect x="7" y="13" width="1" height="1" fill="#5a5a62"/>
      <rect x="14" y="14" width="1" height="1" fill="#3a3a42"/>
    </svg>
  );
}

function UnknownTexture() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{display:"block",width:"100%",height:"100%",imageRendering:"pixelated"}}>
      <rect width="16" height="16" fill="#1a1a1a" rx="1"/>
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="2 2"/>
      <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#444" fontFamily="monospace" fontWeight="bold">?</text>
    </svg>
  );
}

interface Props {
  rows: number;
  cols: number;
  grid: Grid;
  onChange: (grid: Grid) => void;
}

export function BedrockGrid({ rows, cols, grid, onChange }: Props) {
  const [painting, setPainting] = useState<CellValue | null>(null);

  const setCell = useCallback((r: number, c: number, v: CellValue) => {
    onChange(grid.map((row, ri) => row.map((cell, ci) =>
      ri === r && ci === c ? v : cell
    )) as Grid);
  }, [grid, onChange]);

  function cellTexture(v: CellValue) {
    if (v === 1) return <BedrockTexture />;
    if (v === 0) return <StoneTexture />;
    return <UnknownTexture />;
  }

  function cellClass(v: CellValue) {
    return `cell cell--${v === 1 ? "bedrock" : v === 0 ? "stone" : "unknown"}`;
  }

  return (
    <div className="grid-container" onMouseLeave={() => setPainting(null)}>
      <div className="grid-header">
        <span className="grid-title">Pattern Grid</span>
        <div className="grid-actions">
          <button className="btn-ghost" onClick={() => onChange(buildEmptyGrid(rows, cols))}>Clear</button>
          <button className="btn-ghost" onClick={() => onChange(Array.from({ length: rows }, () => Array(cols).fill(1)) as Grid)}>Fill Bedrock</button>
        </div>
      </div>

      <div
        className="grid-board"
        style={{ "--cols": cols } as React.CSSProperties}
        onMouseUp={() => setPainting(null)}
        onDragStart={e => e.preventDefault()}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={cellClass(cell as CellValue)}
              title={cell === 1 ? "Bedrock" : cell === 0 ? "Stone / Air" : "Unknown — click to cycle"}
              onMouseDown={() => {
                const next = CYCLE[cell as CellValue];
                setPainting(next);
                setCell(ri, ci, next);
              }}
              onMouseEnter={() => {
                if (painting === null || (grid[ri][ci] as CellValue) === painting) return;
                setCell(ri, ci, painting);
              }}
            >
              {cellTexture(cell as CellValue)}
            </div>
          ))
        )}
      </div>

      <div className="grid-legend">
        <div className="legend-item">
          <div className="cell cell--bedrock cell--sm"><BedrockTexture /></div>
          <span>Bedrock</span>
        </div>
        <div className="legend-item">
          <div className="cell cell--stone cell--sm"><StoneTexture /></div>
          <span>Stone / Deepslate</span>
        </div>
        <div className="legend-item">
          <div className="cell cell--unknown cell--sm"><UnknownTexture /></div>
          <span>Unknown (skip)</span>
        </div>
        <div className="legend-hint">Click to cycle · Click and drag to paint</div>
      </div>
    </div>
  );
}