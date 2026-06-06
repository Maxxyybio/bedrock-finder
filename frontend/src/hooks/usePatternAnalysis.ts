import { useState, useCallback } from "react";
import type { AnalyseResponse, SeedResponse } from "@bedrock-finder/shared";
import { analyseGrid, findSeed, ApiError } from "../api/client.js";

type Status = "idle" | "loading" | "success" | "error";

export function usePatternAnalysis() {
  const [status, setStatus]       = useState<Status>("idle");
  const [result, setResult]       = useState<AnalyseResponse | null>(null);
  const [seedResult, setSeedResult] = useState<SeedResponse | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const runAnalyse = useCallback(async (params: Parameters<typeof analyseGrid>[0]) => {
    setStatus("loading"); setError(null); setResult(null); setSeedResult(null);
    try {
      setResult(await analyseGrid(params));
      setStatus("success");
    } catch (err) {
      setError(err instanceof ApiError ? `API ${err.statusCode}: ${err.message}` : "Could not reach the backend.");
      setStatus("error");
    }
  }, []);

  const runSeed = useCallback(async (params: Parameters<typeof findSeed>[0]) => {
    setStatus("loading"); setError(null); setResult(null); setSeedResult(null);
    try {
      setSeedResult(await findSeed(params));
      setStatus("success");
    } catch (err) {
      setError(err instanceof ApiError ? `API ${err.statusCode}: ${err.message}` : "Could not reach the backend.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle"); setResult(null); setSeedResult(null); setError(null);
  }, []);

  return { status, result, seedResult, error, runAnalyse, runSeed, reset };
}
