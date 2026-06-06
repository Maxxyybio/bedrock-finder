/// <reference types="vite/client" />
import type { AnalyseResponse, Grid, Edition, SeedResponse } from "@bedrock-finder/shared";

// Empty string = relative URL, so Nginx proxies /api/ to the backend.
// Override with VITE_API_URL env var for local dev.
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

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new ApiError(res.status, b?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const analyseGrid = (p: AnalyseParams) => post<AnalyseResponse>("/api/analyse", p);
export const findSeed    = (p: SeedParams)    => post<SeedResponse>("/api/seed", p);
