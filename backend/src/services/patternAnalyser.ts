import {
  scorePattern,
  getOrientations,
  type Edition,
  type Grid,
  type Candidate,
  type SeedCandidate,
} from "@bedrock-finder/shared";

export type ProgressEvent = { type: "progress"; pct: number; checked: number; total: number; found: number };
export type ResultEvent   = { type: "result";   candidates: Candidate[];     searchedPositions: number; durationMs: number };
export type SeedProgressEvent = { type: "progress"; pct: number; checked: number; total: number; found: number };
export type SeedResultEvent   = { type: "result";   candidates: SeedCandidate[]; searchedSeeds: number; durationMs: number };

// ---------------------------------------------------------------------------
// Yield to the Node event loop so SSE flushes between writes
// ---------------------------------------------------------------------------
const yieldLoop = () => new Promise<void>(r => setImmediate(r));

// ---------------------------------------------------------------------------
// Coordinate search — streams progress events then a final result
// ---------------------------------------------------------------------------
export async function searchCoords(
  params: {
    grid: Grid; yLevel: number; edition: Edition; worldSeed: bigint;
    searchRadius: number; originX: number; originZ: number; loose: boolean;
  },
  emit: (e: ProgressEvent | ResultEvent) => void
) {
  const { grid, yLevel, edition, worldSeed, searchRadius, originX, originZ, loose } = params;
  const start = Date.now();

  const knownCells = grid.flat().filter(v => v !== -1).length;
  if (knownCells === 0) {
    emit({ type: "result", candidates: [], searchedPositions: 0, durationMs: 0 });
    return;
  }

  const grids  = loose ? getOrientations(grid) : [grid];
  const THRESH = loose ? 0.75 : 0.85;

  const diameter = searchRadius * 2 + 1;
  const total    = diameter * diameter;
  // Yield every ~50ms worth of work. Rough: ~500k simple ops/50ms
  const YIELD_EVERY = Math.max(500, Math.floor(total / 400));

  const candidates: Candidate[] = [];
  let checked = 0;

  for (let z = originZ - searchRadius; z <= originZ + searchRadius; z++) {
    for (let x = originX - searchRadius; x <= originX + searchRadius; x++) {
      checked++;

      let bestConf = 0, bestMatch = 0, bestTotal = 0;
      for (const g of grids) {
        const hw = Math.floor(g[0].length / 2);
        const hh = Math.floor(g.length / 2);
        const { matchedCells, totalCells } = scorePattern(edition, worldSeed, g, x - hw, z - hh, yLevel);
        if (totalCells > 0) {
          const conf = matchedCells / totalCells;
          if (conf > bestConf) { bestConf = conf; bestMatch = matchedCells; bestTotal = totalCells; }
        }
      }

      if (bestConf >= THRESH) {
        candidates.push({ x, z, confidence: bestConf, matchedCells: bestMatch, totalCells: bestTotal });
      }

      // Yield to event loop so SSE can flush
      if (checked % YIELD_EVERY === 0) {
        emit({ type: "progress", pct: Math.round((checked / total) * 100), checked, total, found: candidates.length });
        await yieldLoop();
      }
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<string>();
  const deduped = candidates.filter(c => {
    const k = `${c.x},${c.z}`;
    return seen.has(k) ? false : (seen.add(k), true);
  }).slice(0, 20);

  emit({ type: "result", candidates: deduped, searchedPositions: checked, durationMs: Date.now() - start });
}

// ---------------------------------------------------------------------------
// Seed search — streams progress events then a final result
// ---------------------------------------------------------------------------
export async function searchSeed(
  params: {
    grid: Grid; yLevel: number; edition: Edition;
    anchorX: number; anchorZ: number; seedMin: bigint; seedMax: bigint;
  },
  emit: (e: SeedProgressEvent | SeedResultEvent) => void
) {
  const { grid, yLevel, edition, anchorX, anchorZ, seedMin, seedMax } = params;
  const start = Date.now();

  const knownCells = grid.flat().filter(v => v !== -1).length;
  if (knownCells === 0) {
    emit({ type: "result", candidates: [], searchedSeeds: 0, durationMs: 0 });
    return;
  }

  const halfW = Math.floor(grid[0].length / 2);
  const halfH = Math.floor(grid.length / 2);
  const ax = anchorX - halfW;
  const az = anchorZ - halfH;

  const total = Number(seedMax - seedMin) + 1;
  const YIELD_EVERY = Math.max(500, Math.floor(total / 400));

  const candidates: SeedCandidate[] = [];
  let checked = 0;

  for (let seed = seedMin; seed <= seedMax; seed++) {
    checked++;
    const { matchedCells, totalCells } = scorePattern(edition, seed, grid, ax, az, yLevel);
    if (totalCells > 0 && matchedCells / totalCells >= 0.9) {
      candidates.push({ seed, confidence: matchedCells / totalCells, matchedCells, totalCells });
    }

    if (checked % YIELD_EVERY === 0) {
      emit({ type: "progress", pct: Math.round((checked / total) * 100), checked, total, found: candidates.length });
      await yieldLoop();
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  emit({ type: "result", candidates: candidates.slice(0, 10), searchedSeeds: checked, durationMs: Date.now() - start });
}