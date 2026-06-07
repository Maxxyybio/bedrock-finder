import { useState, useCallback } from "react";
import type { Candidate, SeedCandidate } from "@bedrock-finder/shared";
import { analyseStream, seedStream, type AnalyseParams, type SeedParams } from "../api/client.js";

export type Status = "idle" | "scanning" | "done" | "error";

export interface Progress { pct: number; checked: number; total: number; found: number; }

export interface CoordState {
  status: Status; progress: Progress | null; error: string | null;
  candidates: Candidate[]; searchedPositions: number; durationMs: number;
}
export interface SeedState {
  status: Status; progress: Progress | null; error: string | null;
  candidates: SeedCandidate[]; searchedSeeds: number; durationMs: number;
}

const emptyCoord: CoordState = { status: "idle", progress: null, error: null, candidates: [], searchedPositions: 0, durationMs: 0 };
const emptySeed:  SeedState  = { status: "idle", progress: null, error: null, candidates: [], searchedSeeds: 0,     durationMs: 0 };

export function useCoordSearch() {
  const [state, setState] = useState<CoordState>(emptyCoord);

  const run = useCallback((params: AnalyseParams) => {
    setState({ ...emptyCoord, status: "scanning", progress: { pct: 0, checked: 0, total: 0, found: 0 } });
    analyseStream(
      params,
      p  => setState(s => ({ ...s, progress: { pct: p.pct, checked: p.checked, total: p.total, found: p.found } })),
      r  => setState({ ...emptyCoord, status: "done", candidates: r.candidates, searchedPositions: r.searchedPositions, durationMs: r.durationMs }),
      msg => setState({ ...emptyCoord, status: "error", error: msg }),
    );
  }, []);

  const reset = useCallback(() => setState(emptyCoord), []);
  return { state, run, reset };
}

export function useSeedSearch() {
  const [state, setState] = useState<SeedState>(emptySeed);

  const run = useCallback((params: SeedParams) => {
    setState({ ...emptySeed, status: "scanning", progress: { pct: 0, checked: 0, total: 0, found: 0 } });
    seedStream(
      params,
      p  => setState(s => ({ ...s, progress: { pct: p.pct, checked: p.checked, total: p.total, found: p.found } })),
      r  => setState({ ...emptySeed, status: "done", candidates: r.candidates, searchedSeeds: r.searchedSeeds, durationMs: r.durationMs }),
      msg => setState({ ...emptySeed, status: "error", error: msg }),
    );
  }, []);

  const reset = useCallback(() => setState(emptySeed), []);
  return { state, run, reset };
}