import { Router } from "express";
import { z } from "zod";
import { analysePattern } from "../services/patternAnalyser.js";

export const patternRouter = Router();

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const CellValue = z.union([z.literal(0), z.literal(1), z.literal(-1)]);

const analyseSchema = z.object({
  grid: z
    .array(z.array(CellValue).min(1).max(64))
    .min(1)
    .max(64)
    .refine(
      (g) => g.every((row) => row.length === g[0].length),
      "Grid rows must all have the same length"
    ),
  yLevel: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  edition: z.enum(["java", "bedrock"]),
  worldSeed: z.string().optional().nullable(),
  searchRadius: z.number().int().min(1).max(30_000).default(1000),
  originX: z.number().int().optional(),
  originZ: z.number().int().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/analyse
// ---------------------------------------------------------------------------

patternRouter.post("/analyse", async (req, res, next) => {
  try {
    const parsed = analyseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const params = parsed.data;

    const worldSeed =
      params.worldSeed != null && params.worldSeed !== ""
        ? BigInt(params.worldSeed)
        : null;

    const result = await analysePattern({
      ...params,
      worldSeed,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});
