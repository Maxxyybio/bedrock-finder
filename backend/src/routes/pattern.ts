import { Router } from "express";
import { z } from "zod";
import { analysePattern, findSeed } from "../services/patternAnalyser.js";

export const patternRouter = Router();

const CellValue = z.union([z.literal(0), z.literal(1), z.literal(-1)]);

const gridSchema = z
  .array(z.array(CellValue).min(1).max(64))
  .min(1).max(64)
  .refine(g => g.every(r => r.length === g[0].length), "Grid rows must be equal length");

// ---------------------------------------------------------------------------
// POST /api/analyse  — coordinate finder
// ---------------------------------------------------------------------------
const analyseSchema = z.object({
  grid: gridSchema,
  yLevel: z.number().int(),
  edition: z.enum(["java", "bedrock"]),
  worldSeed: z.string(),
  searchRadius: z.number().int().min(1).max(250_000).default(1000),
  originX: z.number().int().default(0),
  originZ: z.number().int().default(0),
  loose: z.boolean().default(false),
});

patternRouter.post("/analyse", async (req, res, next) => {
  try {
    const parsed = analyseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { worldSeed, ...rest } = parsed.data;
    const result = await analysePattern({ ...rest, worldSeed: BigInt(worldSeed) });
    res.json(result);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// POST /api/seed  — seed finder (inverse mode)
// ---------------------------------------------------------------------------
const seedSchema = z.object({
  grid: gridSchema,
  yLevel: z.number().int(),
  edition: z.enum(["java", "bedrock"]),
  anchorX: z.number().int(),
  anchorZ: z.number().int(),
  seedMin: z.string().default("0"),
  seedMax: z.string().default("100000000"),
});

patternRouter.post("/seed", async (req, res, next) => {
  try {
    const parsed = seedSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { seedMin, seedMax, ...rest } = parsed.data;
    const result = await findSeed({ ...rest, seedMin: BigInt(seedMin), seedMax: BigInt(seedMax) });
    res.json(result);
  } catch (err) { next(err); }
});
