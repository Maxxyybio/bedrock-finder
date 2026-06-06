import {
  scorePattern,
  getOrientations,
  isBedrockAt,
  type Edition,
  type Grid,
  type AnalyseResponse,
  type Candidate,
  type SeedResponse,
  type SeedCandidate,
} from "@bedrock-finder/shared";

interface AnalyseParams {
  grid: Grid;
  yLevel: number;
  edition: Edition;
  worldSeed: bigint;
  searchRadius?: number;
  originX?: number;
  originZ?: number;
  loose?: boolean;
}

interface SeedParams {
  grid: Grid;
  yLevel: number;
  edition: Edition;
  anchorX: number;
  anchorZ: number;
  seedMin?: bigint;
  seedMax?: bigint;
}

// ---------------------------------------------------------------------------
// Coordinate search
// ---------------------------------------------------------------------------
export async function analysePattern(params: AnalyseParams): Promise<AnalyseResponse> {
  const start = Date.now();
  const {
    grid, yLevel, edition, worldSeed,
    searchRadius = 1000,
    originX = 0, originZ = 0,
    loose = false,
  } = params;

  const knownCells = grid.flat().filter(v => v !== -1).length;
  if (knownCells === 0) return { candidates: [], searchedPositions: 0, durationMs: 0 };

  // In loose mode we try all 8 orientations of the pattern
  const grids = loose ? getOrientations(grid) : [grid];

  const gridRows = grid.length;
  const gridCols = grid[0].length;
  const halfW = Math.floor(gridCols / 2);
  const halfH = Math.floor(gridRows / 2);

  const THRESHOLD = loose ? 0.75 : 0.85;
  const candidates: Candidate[] = [];
  let searchedPositions = 0;

  for (let z = originZ - searchRadius; z <= originZ + searchRadius; z++) {
    for (let x = originX - searchRadius; x <= originX + searchRadius; x++) {
      searchedPositions++;
      let bestMatch = 0, bestTotal = 0;

      for (const g of grids) {
        const rh = Math.floor(g.length / 2);
        const rw = Math.floor(g[0].length / 2);
        const { matchedCells, totalCells } = scorePattern(edition, worldSeed, g, x - rw, z - rh, yLevel);
        if (totalCells > 0 && matchedCells / totalCells > bestMatch / Math.max(bestTotal, 1)) {
          bestMatch = matchedCells;
          bestTotal = totalCells;
        }
      }

      if (bestTotal > 0 && bestMatch / bestTotal >= THRESHOLD) {
        candidates.push({ x, z, confidence: bestMatch / bestTotal, matchedCells: bestMatch, totalCells: bestTotal });
      }
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<string>();
  const deduped = candidates.filter(c => {
    const k = `${c.x},${c.z}`;
    return seen.has(k) ? false : (seen.add(k), true);
  }).slice(0, 20);

  return { candidates: deduped, searchedPositions, durationMs: Date.now() - start };
}

// ---------------------------------------------------------------------------
// Seed finder (inverse mode)
// ---------------------------------------------------------------------------
export async function findSeed(params: SeedParams): Promise<SeedResponse> {
  const start = Date.now();
  const {
    grid, yLevel, edition,
    anchorX, anchorZ,
    seedMin = 0n,
    seedMax = 100_000_000n,
  } = params;

  const knownCells = grid.flat().filter(v => v !== -1).length;
  if (knownCells === 0) return { candidates: [], searchedSeeds: 0, durationMs: 0 };

  const halfW = Math.floor(grid[0].length / 2);
  const halfH = Math.floor(grid.length / 2);
  const ax = anchorX - halfW;
  const az = anchorZ - halfH;

  const candidates: SeedCandidate[] = [];
  let searchedSeeds = 0;

  for (let seed = seedMin; seed <= seedMax; seed++) {
    searchedSeeds++;
    const { matchedCells, totalCells } = scorePattern(edition, seed, grid, ax, az, yLevel);
    if (totalCells > 0 && matchedCells / totalCells >= 0.9) {
      candidates.push({ seed, confidence: matchedCells / totalCells, matchedCells, totalCells });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  return { candidates: candidates.slice(0, 10), searchedSeeds, durationMs: Date.now() - start };
}
