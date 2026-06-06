// =============================================================================
// Core bedrock generation algorithm — Java 1.18+ and Bedrock Edition
// =============================================================================

export type Edition = "java" | "bedrock";
export type GridRow = (0 | 1 | -1)[];
export type Grid = GridRow[];

export interface AnalyseRequest {
  grid: Grid;
  yLevel: number;
  edition: Edition;
  worldSeed: bigint;
  searchRadius?: number;
  originX?: number;
  originZ?: number;
  loose?: boolean;
}

export interface Candidate {
  x: number;
  z: number;
  confidence: number;
  matchedCells: number;
  totalCells: number;
}

export interface AnalyseResponse {
  candidates: Candidate[];
  searchedPositions: number;
  durationMs: number;
}

export interface SeedCandidate {
  seed: bigint;
  confidence: number;
  matchedCells: number;
  totalCells: number;
}

export interface SeedResponse {
  candidates: SeedCandidate[];
  searchedSeeds: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Java LCG (mirrors java.util.Random)
// ---------------------------------------------------------------------------
const LCG_MULT = 0x5deece66dn;
const LCG_ADD  = 0xbn;
const LCG_MASK = (1n << 48n) - 1n;

function makeJavaRandom(seed: bigint) {
  let s = (seed ^ LCG_MULT) & LCG_MASK;
  function next(b: number) {
    s = (s * LCG_MULT + LCG_ADD) & LCG_MASK;
    return Number(s >> BigInt(48 - b));
  }
  return {
    nextInt(bound?: number) {
      if (bound === undefined) return next(32);
      if ((bound & -bound) === bound) return Number(BigInt(bound) * BigInt(next(31)) >> 31n);
      let bits: number, val: number;
      do { bits = next(31); val = bits % bound; } while (bits - val + (bound - 1) < 0);
      return val;
    }
  };
}

// ---------------------------------------------------------------------------
// Java Edition 1.18+ — bedrock floor at y=-64
// Layers: y=-64 (always), y=-63 to y=-60 (probabilistic, depth 1-4)
// ---------------------------------------------------------------------------
export const JAVA_FLOOR_Y  = -64;
export const JAVA_MAX_Y    = -60;
export const BEDROCK_FLOOR_Y = 0;
export const BEDROCK_MAX_Y   = 4;

export function isBedrockJava(seed: bigint, x: number, z: number, y: number): boolean {
  const depth = y - JAVA_FLOOR_Y;
  if (depth === 0) return true;
  if (depth < 0 || depth > 4) return false;
  const mix = seed ^ (BigInt(x) * 341873128712n + BigInt(z) * 132897987541n);
  return makeJavaRandom(mix).nextInt(depth + 1) === 0;
}

// ---------------------------------------------------------------------------
// Bedrock Edition — floor at y=0 (legacy) / y=-64 (1.18+ worlds)
// ---------------------------------------------------------------------------
export function isBedrockBedrock(seed: bigint, x: number, z: number, y: number): boolean {
  const depth = y - BEDROCK_FLOOR_Y;
  if (depth === 0) return true;
  if (depth < 0 || depth > 4) return false;
  let s = seed ^ (BigInt(x) * 2265665809n) ^ (BigInt(z) * 6364136223846793005n) ^ BigInt(y);
  s ^= s << 13n; s ^= s >> 7n; s ^= s << 17n;
  s &= 0xffffffffffffffffn;
  return Number(s % BigInt(depth + 1)) === 0;
}

export function isBedrockAt(edition: Edition, seed: bigint, x: number, z: number, y: number): boolean {
  return edition === "java"
    ? isBedrockJava(seed, x, z, y)
    : isBedrockBedrock(seed, x, z, y);
}

// ---------------------------------------------------------------------------
// Score a grid against a known position
// ---------------------------------------------------------------------------
export function scorePattern(
  edition: Edition,
  seed: bigint,
  grid: Grid,
  anchorX: number,
  anchorZ: number,
  yLevel: number
): { matchedCells: number; totalCells: number } {
  let matched = 0, total = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const v = grid[row][col];
      if (v === -1) continue;
      total++;
      const computed = isBedrockAt(edition, seed, anchorX + col, anchorZ + row, yLevel) ? 1 : 0;
      if (computed === v) matched++;
    }
  }
  return { matchedCells: matched, totalCells: total };
}

// ---------------------------------------------------------------------------
// Rotate grid 90° clockwise
// ---------------------------------------------------------------------------
export function rotateGrid90(grid: Grid): Grid {
  const rows = grid.length, cols = grid[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => grid[rows - 1 - r][c])
  ) as Grid;
}

// ---------------------------------------------------------------------------
// Flip grid horizontally
// ---------------------------------------------------------------------------
export function flipGrid(grid: Grid): Grid {
  return grid.map(row => [...row].reverse()) as Grid;
}

// ---------------------------------------------------------------------------
// Get all 8 orientations (4 rotations × 2 flips)
// ---------------------------------------------------------------------------
export function getOrientations(grid: Grid): Grid[] {
  const orientations: Grid[] = [];
  let g = grid;
  for (let i = 0; i < 4; i++) {
    orientations.push(g);
    orientations.push(flipGrid(g));
    g = rotateGrid90(g);
  }
  return orientations;
}
