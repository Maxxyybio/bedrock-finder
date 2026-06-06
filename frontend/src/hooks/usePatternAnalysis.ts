import { useState, useCallback } from "react";
import type { AnalyseResponse, Grid, Edition } from "@bedrock-finder/shared";
import { analyseGrid, ApiError } from "../api/client.js";

type Status = "idle" | "loading" | "success" | "error";

interface UsePatternAnalysisResult {
  status: Status;
  result: AnalyseResponse | null;
  error: string | null;
  run: (params: {
    grid: Grid;
    yLevel: number;
    edition: Edition;
    worldSeed?: string;
    searchRadius?: number;
  }) => Promise<void>;
  reset: () => void;
}

export function usePatternAnalysis(): UsePatternAnalysisResult {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (params: Parameters<typeof analyseGrid>[0]) => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const data = await analyseGrid(params);
      setResult(data);
      setStatus("success");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `API error ${err.statusCode}: ${err.message}`
          : "Unknown error — is the backend running?";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, run, reset };
}