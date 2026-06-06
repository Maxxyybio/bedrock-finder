import { Router } from "express";
import { z } from "zod";
import { analysePatternStream, findSeed } from "../services/patternAnalyser.js";

export const patternRouter = Router();

const CellValue = z.union([z.literal(0), z.literal(1), z.literal(-1)]);
const gridSchema = z
  .array(z.array(CellValue).min(1).max(64))
  .min(1).max(64)
  .refine(g => g.every(r => r.length === g[0].length), "Grid rows must be equal length");

function formatZodError(err: z.ZodError) {
  return err.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
}

const analyseSchema = z.object({
  grid: gridSchema,
  yLevel: z.number().int().min(-64).max(320),
  edition: z.enum(["java", "bedrock"]),
  worldSeed: z.string().min(1, "World seed is required"),
  searchRadius: z.number().int().min(1).max(250_000).default(1000),
  originX: z.number().int().default(0),
  originZ: z.number().int().default(0),
  loose: z.boolean().default(false),
});

const seedSchema = z.object({
  grid: gridSchema,
  yLevel: z.number().int().min(-64).max(320),
  edition: z.enum(["java", "bedrock"]),
  anchorX: z.number().int(),
  anchorZ: z.number().int(),
  seedMin: z.string().default("0"),
  seedMax: z.string().default("100000000"),
});

// ---------------------------------------------------------------------------
// POST /api/analyse — streaming SSE response
// ---------------------------------------------------------------------------
patternRouter.post("/analyse", async (req, res, next) => {
  try {
    const parsed = analyseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed.error) });
    }
    const { worldSeed, ...rest } = parsed.data;
    let seed: bigint;
    try { seed = BigInt(worldSeed); }
    catch { return res.status(400).json({ error: "Seed must be a valid integer (e.g. 1234567890)" }); }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable Nginx buffering for SSE
    res.flushHeaders();

    const send = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    await analysePatternStream(
      { ...rest, worldSeed: seed },
      (event) => send(event)
    );

    res.end();
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// POST /api/seed
// ---------------------------------------------------------------------------
patternRouter.post("/seed", async (req, res, next) => {
  try {
    const parsed = seedSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed.error) });
    }
    const { seedMin, seedMax, ...rest } = parsed.data;
    let sMin: bigint, sMax: bigint;
    try { sMin = BigInt(seedMin); sMax = BigInt(seedMax); }
    catch { return res.status(400).json({ error: "Seed range must be valid integers" }); }
    const result = await findSeed({ ...rest, seedMin: sMin, seedMax: sMax });
    res.json(result);
  } catch (err) { next(err); }
});