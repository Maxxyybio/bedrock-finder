import type { AnalyseResponse, Candidate } from "@bedrock-finder/shared";
import type { Progress } from "../hooks/usePatternAnalysis.js";

interface Props {
  status: "idle" | "loading" | "success" | "error";
  result: AnalyseResponse | null;
  error: string | null;
  progress: Progress | null;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const col = pct >= 95 ? "#4ade80" : pct >= 85 ? "#facc15" : "#fb923c";
  return (
    <div>
      <div className="conf-bar-wrap">
        <div className="conf-bar-fill" style={{ width: `${pct}%`, background: col }} />
      </div>
      <div className="pct" style={{ color: col }}>{pct}%</div>
    </div>
  );
}

function CandidateRow({ c, rank }: { c: Candidate; rank: number }) {
  const tp = `/tp @s ${c.x} ~ ${c.z}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(tp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={`candidate-row ${rank === 0 ? "candidate-row--best" : ""}`}>
      <span className="candidate-rank">#{rank + 1}</span>
      <div className="candidate-coords">
        <span className="coord">X: {c.x.toLocaleString()}</span>
        <span className="coord">Z: {c.z.toLocaleString()}</span>
      </div>
      <ConfidenceBar value={c.confidence} />
      <span className="candidate-cells">{c.matchedCells}/{c.totalCells} cells</span>
      <button className="btn-copy" onClick={copy}>{copied ? "✓" : "/tp"}</button>
    </div>
  );
}

// Import useState for the copy button
import { useState } from "react";

export function ResultsPanel({ status, result, error, progress }: Props) {
  if (status === "idle") return (
    <div className="results-empty">
      <p>Paint your bedrock pattern then hit <strong>Analyse</strong>.</p>
      <ul className="results-tips">
        <li>Paint what you see on the floor beneath you</li>
        <li>★ y=−63 gives the best pattern distinction</li>
        <li>More cells filled = more accurate results</li>
        <li>Enable Loose Mode if you're unsure of orientation</li>
      </ul>
    </div>
  );

  if (status === "loading" && progress) return (
    <div className="results-loading">
      <div className="progress-header">
        <span className="progress-title">Scanning coordinates…</span>
        <span className="progress-pct">{progress.pct}%</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progress.pct}%` }} />
      </div>
      <div className="progress-stats">
        <span>{progress.checked.toLocaleString()} / {progress.total.toLocaleString()} positions checked</span>
        <span>{progress.found} match{progress.found !== 1 ? "es" : ""} so far</span>
      </div>
      {progress.found > 0 && (
        <div className="progress-found">
          ✓ Found {progress.found} candidate{progress.found !== 1 ? "s" : ""} — finishing scan…
        </div>
      )}
    </div>
  );

  if (status === "error") return (
    <div className="results-error">
      <p>⚠ {error}</p>
      <p className="results-error-hint">Check that the backend is running and your world seed is a valid integer.</p>
    </div>
  );

  if (!result || result.candidates.length === 0) return (
    <div className="results-empty">
      <p>No matches found above the confidence threshold.</p>
      <ul className="results-tips">
        <li>Add more cells to the grid</li>
        <li>Double-check your world seed</li>
        <li>Try y=−63 for the most distinctive pattern</li>
        <li>Enable Loose Mode to try all orientations</li>
        <li>Increase the search radius</li>
      </ul>
    </div>
  );

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2 className="panel-title">Results</h2>
        <div className="results-meta">
          <span>{result.candidates.length} match{result.candidates.length !== 1 ? "es" : ""}</span>
          <span>{(result.searchedPositions / 1_000_000).toFixed(2)}M positions</span>
          <span>{result.durationMs.toLocaleString()}ms</span>
        </div>
      </div>
      <div className="candidate-list">
        {result.candidates.map((c, i) => <CandidateRow key={`${c.x},${c.z}`} c={c} rank={i} />)}
      </div>
    </div>
  );
}