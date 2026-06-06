import { useState, useCallback } from "react";
import type { AnalyseResponse, SeedResponse } from "@bedrock-finder/shared";
import { analyseGridStream, findSeed, ApiError, type ProgressUpdate } from "../api/client.js";

type Status = "idle" | "loading" | "success" | "error";

export interface Progress {
  pct: number;
  checked: number;
  total: number;
  found: number;
}

export function usePatternAnalysis() {
  const [status, setStatus]         = useState<Status>("idle");
  const [result, setResult]         = useState<AnalyseResponse | null>(null);
  const [seedResult, setSeedResult] = useState<SeedResponse | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [progress, setProgress]     = useState<Progress | null>(null);

  const runAnalyse = useCallback(async (params: Parameters<typeof analyseGridStream>[0]) => {
    setStatus("loading");
    setError(null);
    setResult(null);
    setSeedResult(null);
    setProgress({ pct: 0, checked: 0, total: 0, found: 0 });

    await analyseGridStream(
      params,
      (p: ProgressUpdate) => setProgress({ pct: p.pct, checked: p.checked, total: p.total, found: p.found }),
      (r) => {
        setResult({ candidates: r.candidates, searchedPositions: r.searchedPositions, durationMs: r.durationMs });
        setStatus("success");
        setProgress(null);
      },
      (msg) => {
        setError(msg);
        setStatus("error");
        setProgress(null);
      }
    );
  }, []);

  const runSeed = useCallback(async (params: Parameters<typeof findSeed>[0]) => {
    setStatus("loading");
    setError(null);
    setResult(null);
    setSeedResult(null);
    setProgress(null);

    try {
      setSeedResult(await findSeed(params));
      setStatus("success");
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message}` : "Could not reach the backend.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setSeedResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return { status, result, seedResult, error, progress, runAnalyse, runSeed, reset };
}