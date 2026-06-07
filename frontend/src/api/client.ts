/// <reference types="vite/client" />
import type { Grid, Edition, Candidate, SeedCandidate } from "@bedrock-finder/shared";

const BASE = import.meta.env.VITE_API_URL ?? "";

export interface AnalyseParams {
  grid: Grid; yLevel: number; edition: Edition;
  worldSeed: string; searchRadius: number; loose: boolean;
}
export interface SeedParams {
  grid: Grid; yLevel: number; edition: Edition;
  anchorX: number; anchorZ: number;
  seedMin: string; seedMax: string;
}
export type ProgressUpdate = { type: "progress"; pct: number; checked: number; total: number; found: number };
export type CoordResult    = { type: "result"; candidates: Candidate[]; searchedPositions: number; durationMs: number };
export type SeedResult     = { type: "result"; candidates: SeedCandidate[]; searchedSeeds: number; durationMs: number };

async function stream<P extends ProgressUpdate, R>(
  path: string,
  body: object,
  onProgress: (p: P) => void,
  onResult:   (r: R) => void,
  onError:    (msg: string) => void,
) {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    onError("Cannot reach server. Is the backend running?");
    return;
  }

  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    onError(typeof b?.error === "string" ? b.error : `Server error ${res.status}`);
    return;
  }

  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.replace(/^data:\s*/, "").trim();
      if (!line) continue;
      try {
        const evt = JSON.parse(line);
        if (evt.type === "progress") onProgress(evt as P);
        else if (evt.type === "result") onResult(evt as R);
      } catch { /* skip malformed */ }
    }
  }
}

export const analyseStream = (
  p: AnalyseParams,
  onProgress: (e: ProgressUpdate) => void,
  onResult:   (e: CoordResult)    => void,
  onError:    (msg: string)       => void,
) => stream("/api/analyse", p, onProgress, onResult, onError);

export const seedStream = (
  p: SeedParams,
  onProgress: (e: ProgressUpdate) => void,
  onResult:   (e: SeedResult)     => void,
  onError:    (msg: string)       => void,
) => stream("/api/seed", p, onProgress, onResult, onError);