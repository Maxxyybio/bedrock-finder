import {
  scorePattern,
  type AnalyseRequest,
  type AnalyseResponse,
  type Candidate,
} from "@bedrock-finder/shared";

const REPRESENTATIVE_SEEDS: bigint[] = [
  0n,
  1n,
  -1n,
  1234567890n,
  8675309n,
  42n,
  987654321n,
  2147483647n,
];

interface AnalyseParams extends Omit<AnalyseRequest, "worldSeed"> {
  worldSeed: bigint | null;
}

export async function analysePattern(
  params: AnalyseParams
): Promise<AnalyseResponse> {
  const start = Date.now();

  const {
    grid,
    yLevel,
    edition,
    worldSeed,
    searchRadius = 1000,
    originX = 0,
    originZ = 0,
  } = params;

  const gridRows = grid.length;
  const gridCols = grid[0].length;

  const knownCells = grid.flat().filter((v) => v !== -1).length;
  if (knownCells === 0) {
    return { candidates: [], searchedPositions: 0, durationMs: 0 };
  }

  const seeds = worldSeed !== null ? [worldSeed] : REPRESENTATIVE_SEEDS;

  const candidates: Candidate[] = [];
  let searchedPositions = 0;

  const halfW = Math.floor(gridCols / 2);
  const halfH = Math.floor(gridRows / 2);

  for (const seed of seeds) {
    for (let z = originZ - searchRadius; z <= originZ + searchRadius; z++) {
      for (let x = originX - searchRadius; x <= originX + searchRadius; x++) {
        searchedPositions++;

        const anchorX = x - halfW;
        const anchorZ = z - halfH;

        const { matchedCells, totalCells } = scorePattern(
          edition,
          seed,
          grid,
          anchorX,
          anchorZ,
          yLevel
        );

        if (totalCells === 0) continue;
        const confidence = matchedCells / totalCells;

        if (confidence >= 0.8) {
          candidates.push({ x, z, confidence, matchedCells, totalCells });
        }
      }
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<string>();
  const deduped: Candidate[] = [];
  for (const c of candidates) {
    const key = `${c.x},${c.z}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  return {
    candidates: deduped.slice(0, 20),
    searchedPositions,
    durationMs: Date.now() - start,
  };
}