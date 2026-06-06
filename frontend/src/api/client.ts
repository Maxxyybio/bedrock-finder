/// <reference types="vite/client" />
import type { AnalyseResponse, Grid, Edition } from "@bedrock-finder/shared";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface AnalyseParams {
  grid: Grid;
  yLevel: number;
  edition: Edition;
  worldSeed?: string;
  searchRadius?: number;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function analyseGrid(
  params: AnalyseParams
): Promise<AnalyseResponse> {
  const res = await fetch(`${BASE}/api/analyse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body?.error ?? `Request failed with status ${res.status}`
    );
  }

  return res.json();
}