import type { SeedResponse } from "@bedrock-finder/shared";

interface Props {
  status: "idle" | "loading" | "success" | "error";
  result: SeedResponse | null;
  error: string | null;
}

export function SeedPanel({ status, result, error }: Props) {
  if (status === "idle") return (
    <div className="results-empty">
      <p>Paint your bedrock pattern, enter your known coordinates, then hit <strong>Find Seed</strong>.</p>
      <ul className="results-tips">
        <li>You must know your exact X and Z coordinates</li>
        <li>Paint exactly what you see beneath you</li>
        <li>Wider seed range = longer search time</li>
        <li>y=-63 gives the most distinctive pattern</li>
      </ul>
    </div>
  );

  if (status === "loading") return (
    <div className="results-loading">
      <div className="spinner" />
      <p>Brute-forcing seeds…</p>
    </div>
  );

  if (status === "error") return <div className="results-error"><p>⚠ {error}</p></div>;

  if (!result || result.candidates.length === 0) return (
    <div className="results-empty">
      <p>No seeds matched above 90% confidence.</p>
      <ul className="results-tips">
        <li>Double-check your X and Z coordinates</li>
        <li>Fill more cells in the pattern</li>
        <li>Try a wider seed range</li>
      </ul>
    </div>
  );

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2 className="panel-title">Seed Results</h2>
        <div className="results-meta">
          <span>{result.candidates.length} match{result.candidates.length !== 1 ? "es" : ""}</span>
          <span>{result.searchedSeeds.toLocaleString()} seeds checked</span>
          <span>{result.durationMs}ms</span>
        </div>
      </div>
      <div className="candidate-list">
        {result.candidates.map((c, i) => {
          const pct = Math.round(c.confidence * 100);
          const col = pct >= 98 ? "#4ade80" : pct >= 90 ? "#facc15" : "#fb923c";
          return (
            <div key={String(c.seed)} className={`candidate-row ${i === 0 ? "candidate-row--best" : ""}`}>
              <span className="candidate-rank">#{i + 1}</span>
              <div className="candidate-coords">
                <span className="coord">Seed: {String(c.seed)}</span>
              </div>
              <div>
                <div className="conf-bar-wrap">
                  <div className="conf-bar-fill" style={{ width: `${pct}%`, background: col }} />
                </div>
                <span className="pct" style={{ color: col }}>{pct}%</span>
              </div>
              <span className="candidate-cells">{c.matchedCells}/{c.totalCells}</span>
              <button className="btn-copy" onClick={() => navigator.clipboard.writeText(String(c.seed))}>Copy</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
