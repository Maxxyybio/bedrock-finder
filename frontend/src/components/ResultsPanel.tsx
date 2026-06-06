import type { AnalyseResponse, Candidate } from "@bedrock-finder/shared";

interface Props {
  status: "idle" | "loading" | "success" | "error";
  result: AnalyseResponse | null;
  error: string | null;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const colour =
    pct >= 95 ? "#4ade80" : pct >= 80 ? "#facc15" : "#fb923c";
  return (
    <div className="conf-bar-wrap">
      <div
        className="conf-bar-fill"
        style={{ width: `${pct}%`, background: colour }}
      />
      <span className="conf-label" style={{ color: colour }}>
        {pct}%
      </span>
    </div>
  );
}

function CandidateRow({ c, rank }: { c: Candidate; rank: number }) {
  const tp = `/tp @s ${c.x} ~ ${c.z}`;
  return (
    <div className={`candidate-row ${rank === 0 ? "candidate-row--best" : ""}`}>
      <span className="candidate-rank">#{rank + 1}</span>
      <div className="candidate-coords">
        <span className="coord">X: {c.x.toLocaleString()}</span>
        <span className="coord">Z: {c.z.toLocaleString()}</span>
      </div>
      <ConfidenceBar value={c.confidence} />
      <span className="candidate-cells">
        {c.matchedCells}/{c.totalCells} cells
      </span>
      <button
        className="btn-copy"
        title="Copy /tp command"
        onClick={() => navigator.clipboard.writeText(tp)}
      >
        /tp
      </button>
    </div>
  );
}

export function ResultsPanel({ status, result, error }: Props) {
  if (status === "idle") {
    return (
      <div className="results-empty">
        <p>Paint your bedrock pattern, then hit <strong>Analyse</strong>.</p>
        <ul className="results-tips">
          <li>■ = Bedrock block</li>
          <li>□ = Stone / air</li>
          <li>? = Unknown (skipped)</li>
          <li>More cells = higher accuracy</li>
        </ul>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="results-loading">
        <div className="spinner" />
        <p>Scanning coordinates…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="results-error">
        <p>⚠ {error}</p>
      </div>
    );
  }

  if (!result || result.candidates.length === 0) {
    return (
      <div className="results-empty">
        <p>No matches found. Try:</p>
        <ul className="results-tips">
          <li>Adding more known cells to the grid</li>
          <li>Increasing the search radius</li>
          <li>Providing your world seed for accuracy</li>
          <li>Scanning y=4 (most distinctive layer)</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2 className="panel-title">Results</h2>
        <div className="results-meta">
          <span>{result.candidates.length} match{result.candidates.length !== 1 ? "es" : ""}</span>
          <span>{(result.searchedPositions / 1_000_000).toFixed(2)}M positions checked</span>
          <span>{result.durationMs}ms</span>
        </div>
      </div>

      <div className="candidate-list">
        {result.candidates.map((c, i) => (
          <CandidateRow key={`${c.x},${c.z}`} c={c} rank={i} />
        ))}
      </div>
    </div>
  );
}
