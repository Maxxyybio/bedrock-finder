import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { searchCoords, searchSeed } from "../services/patternAnalyser.js";

export const patternRouter = Router();

const Cell    = z.union([z.literal(0), z.literal(1), z.literal(-1)]);
const Grid    = z.array(z.array(Cell).min(1).max(64)).min(1).max(64)
                 .refine(g => g.every(r => r.length === g[0].length), "Rows must be equal length");

function zodErr(e: z.ZodError) { return e.errors.map(x => `${x.path.join(".")}: ${x.message}`).join(", "); }

function sseSetup(res: Response) {
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

function sseSend(res: Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  // Flush if the underlying socket supports it
  if (typeof (res as any).flush === "function") (res as any).flush();
}

// ---------------------------------------------------------------------------
// POST /api/analyse  (SSE stream)
// ---------------------------------------------------------------------------
const AnalyseSchema = z.object({
  grid:         Grid,
  yLevel:       z.number().int().min(-64).max(320),
  edition:      z.enum(["java", "bedrock"]),
  worldSeed:    z.string().min(1, "Seed required"),
  searchRadius: z.number().int().min(1).max(250_000).default(1000),
  originX:      z.number().int().default(0),
  originZ:      z.number().int().default(0),
  loose:        z.boolean().default(false),
});

patternRouter.post("/analyse", async (req: Request, res: Response) => {
  const parsed = AnalyseSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodErr(parsed.error) }); return; }

  let worldSeed: bigint;
  try { worldSeed = BigInt(parsed.data.worldSeed); }
  catch { res.status(400).json({ error: "Seed must be a whole number e.g. 1234567890" }); return; }

  sseSetup(res);
  await searchCoords({ ...parsed.data, worldSeed }, e => sseSend(res, e));
  res.end();
});

// ---------------------------------------------------------------------------
// POST /api/seed  (SSE stream)
// ---------------------------------------------------------------------------
const SeedSchema = z.object({
  grid:     Grid,
  yLevel:   z.number().int().min(-64).max(320),
  edition:  z.enum(["java", "bedrock"]),
  anchorX:  z.number().int(),
  anchorZ:  z.number().int(),
  seedMin:  z.string().default("0"),
  seedMax:  z.string().default("10000000"),
});

patternRouter.post("/seed", async (req: Request, res: Response) => {
  const parsed = SeedSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodErr(parsed.error) }); return; }

  let seedMin: bigint, seedMax: bigint;
  try { seedMin = BigInt(parsed.data.seedMin); seedMax = BigInt(parsed.data.seedMax); }
  catch { res.status(400).json({ error: "Seed range must be whole numbers" }); return; }

  sseSetup(res);
  await searchSeed({ ...parsed.data, seedMin, seedMax }, e => sseSend(res, e));
  res.end();
});