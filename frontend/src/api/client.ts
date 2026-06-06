/// <reference types="vite/client" />
import type { AnalyseResponse, Grid, Edition, SeedResponse } from "@bedrock-finder/shared";

const BASE = import.meta.env.VITE_API_URL ?? "";

export interface AnalyseParams {
  grid: Grid;
  yLevel: number;
  edition: Edition;
  worldSeed: string;
  searchRadius?: number;
  loose?: boolean;
}

export interface SeedParams {
  grid: Grid;
  yLevel: number;
  edition: Edition;
  anchorX: number;
  anchorZ: number;
  seedMin?: string;
  seedMax?: string;
}

export interface ProgressUpdate {
  type: "progress";
  pct: number;
  checked: number;
  total: number;
  found: number;
}

export interface ResultUpdate {
  type: "result";
  candidates: AnalyseResponse["candidates"];
  searchedPositions: number;
  durationMs: number;
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Streaming analyse — yields progress and result events via callbacks
// ---------------------------------------------------------------------------
export async function analyseGridStream(
  params: AnalyseParams,
  onProgress: (e: ProgressUpdate) => void,
  onResult: (e: ResultUpdate) => void,
  onError: (msg: string) => void
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/analyse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    onError("Could not reach the server. Is the backend running?");
    return;
  }

  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    onError(typeof b?.error === "string" ? b.error : `HTTP ${res.status}`);
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE lines are separated by \n\n
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.replace(/^data: /, "").trim();
      if (!line) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === "progress") onProgress(event as ProgressUpdate);
        else if (event.type === "result") onResult(event as ResultUpdate);
      } catch { /* malformed line, skip */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Seed finder (non-streaming, reasonable wait time)
// ---------------------------------------------------------------------------
export async function findSeed(p: SeedParams): Promise<SeedResponse> {
  const res = await fetch(`${BASE}/api/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new ApiError(res.status, typeof b?.error === "string" ? b.error : `HTTP ${res.status}`);
  }
  return res.json();
}