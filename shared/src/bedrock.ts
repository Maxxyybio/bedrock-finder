// =============================================================================
// Shared package — types and core bedrock algorithm
// Used by both frontend (for live previews) and backend (for full searches).
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Edition = "java" | "bedrock";

/** A 2-D grid of cell values. 1 = bedrock, 0 = stone/air, -1 = unknown. */
export type GridRow = (0 | 1 | -1)[];
export type Grid = GridRow[];

export interface AnalyseRequest {
  grid: Grid;
  /** Y-level the user scanned. 0–4 for Java, 0–5 for Bedrock edition. */
  yLevel: 0 | 1 | 2 | 3 | 4 | 5;
  edition: Edition;
  /** World seed. If omitted the search is seed-agnostic (slower). */
  worldSeed?: bigint | null;
  /** Half-width of the coordinate search square. Default 1000. */
  searchRadius?: number;
  /** Top-left anchor: if provided, the search is anchored rather than centred. */
  originX?: number;
  originZ?: number;
}

export interface Candidate {
  x: number;
  z: number;
  /** 0–1 fraction of non-unknown cells that matched. */
  confidence: number;
  matchedCells: number;
  totalCells: number;
}

export interface AnalyseResponse {
  candidates: Candidate[];
  searchedPositions: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Java LCG Random  (mirrors java.util.Random)
// ---------------------------------------------------------------------------
// Minecraft Java edition uses java.util.Random for bedrock placement.
// The multiplier and addend are defined in the JVM spec.

const LCG_MULTIPLIER = 0x5deece66dn;
const LCG_ADDEND = 0xbn;
const LCG_MASK = (1n << 48n) - 1n;

/** Returns a seeded Java-compatible LCG random function. */
function makeJavaRandom(seed: bigint) {
  let state = (seed ^ LCG_MULTIPLIER) & LCG_MASK;

  function next(bits: number): number {
    state = (state * LCG_MULTIPLIER + LCG_ADDEND) & LCG_MASK;
    return Number(state >> BigInt(48 - bits));
  }

  function nextInt(bound?: number): number {
    if (bound === undefined) return next(32);
    if (bound <= 0) throw new RangeError("bound must be positive");
    if ((bound & -bound) === bound) {
      // power of two fast path
      return Number((BigInt(bound) * BigInt(next(31))) >> 31n);
    }
    let bits: number, val: number;
    do {
      bits = next(31);
      val = bits % bound;
    } while (bits - val + (bound - 1) < 0);
    return val;
  }

  return { nextInt };
}

// ---------------------------------------------------------------------------
// Bedrock generation — Java Edition
// ---------------------------------------------------------------------------
// Minecraft mixes the world seed with block coordinates to produce a
// per-block seed, then uses nextInt(y) == 0 to decide bedrock placement.
//
// Reference: net.minecraft.world.gen.surfacebuilder.SurfaceBuilder
//            and BedrockFloorDecorator (1.18+ uses a slightly different path
//            but this formulation matches practical observation).

export function isBedrockJava(
  worldSeed: bigint,
  blockX: number,
  blockZ: number,
  blockY: number
): boolean {
  if (blockY === 0) return true;
  if (blockY < 0 || blockY > 4) return false;

  // Minecraft mixes position into the world seed with XOR shifts.
  const positionHash =
    BigInt(blockX) * 341873128712n + BigInt(blockZ) * 132897987541n;
  const mixedSeed = worldSeed ^ positionHash;

  const rng = makeJavaRandom(mixedSeed);
  return rng.nextInt(blockY) === 0;
}

// ---------------------------------------------------------------------------
// Bedrock generation — Bedrock Edition
// ---------------------------------------------------------------------------
// Bedrock edition uses a different (Xorshift-based) RNG and a slightly
// different mixing function. This is an approximation based on reverse-
// engineering work by the Minecraft community.

export function isBedrockBedrock(
  worldSeed: bigint,
  blockX: number,
  blockZ: number,
  blockY: number
): boolean {
  if (blockY === 0) return true;
  if (blockY < 0 || blockY > 5) return false;

  // Bedrock edition mixes coordinates differently.
  let state =
    worldSeed ^
    (BigInt(blockX) * 2265665809n) ^
    (BigInt(blockZ) * 6364136223846793005n) ^
    BigInt(blockY);

  // Simple xorshift64
  state ^= state << 13n;
  state ^= state >> 7n;
  state ^= state << 17n;
  state &= 0xffffffffffffffffn;

  return Number(state % BigInt(blockY + 1)) === 0;
}

// ---------------------------------------------------------------------------
// Primary exported helper
// ---------------------------------------------------------------------------

export function isBedrockAt(
  edition: Edition,
  worldSeed: bigint,
  blockX: number,
  blockZ: number,
  blockY: number
): boolean {
  return edition === "java"
    ? isBedrockJava(worldSeed, blockX, blockZ, blockY)
    : isBedrockBedrock(worldSeed, blockX, blockZ, blockY);
}

// ---------------------------------------------------------------------------
// Pattern scoring
// ---------------------------------------------------------------------------

/**
 * Score how well an observed grid matches the computed pattern at (anchorX, anchorZ).
 * Unknown cells (-1) are skipped.
 * Returns { matchedCells, totalCells }.
 */
export function scorePattern(
  edition: Edition,
  worldSeed: bigint,
  grid: Grid,
  anchorX: number,
  anchorZ: number,
  yLevel: number
): { matchedCells: number; totalCells: number } {
  let matchedCells = 0;
  let totalCells = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const observed = grid[row][col];
      if (observed === -1) continue;

      totalCells++;
      const worldX = anchorX + col;
      const worldZ = anchorZ + row;
      const computed = isBedrockAt(edition, worldSeed, worldX, worldZ, yLevel)
        ? 1
        : 0;

      if (computed === observed) matchedCells++;
    }
  }

  return { matchedCells, totalCells };
}
