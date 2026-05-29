import { useState } from "react";

export default function ResultsPanel({ result, loading, algorithms }) {
  const [showFull, setShowFull] = useState(false);

  if (loading) {
    return (
      <div className="card results-card">
        <div className="loading-state">
          <div className="pulse-ring" />
          <div className="pulse-ring delay1" />
          <div className="pulse-ring delay2" />
          <p className="loading-text">Encrypting & benchmarking...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card results-card empty-results">
        <div className="empty-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="27" stroke="#ffffff15" strokeWidth="1" />
            <path d="M20 28 L28 20 L36 28 L28 36 Z" stroke="#ffffff30" strokeWidth="1.5" fill="none" />
            <circle cx="28" cy="28" r="4" stroke="#ffffff30" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <p className="empty-title">No Results Yet</p>
        <p className="empty-sub">Run a benchmark to see results here</p>
      </div>
    );
  }

  const algoMeta = algorithms.find(a => a.value === result.algorithm) || { color: "#00f5d4", label: result.algorithm };
  const cipherPreview = showFull ? result.ciphertext_hex : result.ciphertext_hex?.slice(0, 64) + (result.ciphertext_hex?.length > 64 ? "..." : "");

  return (
    <div className="card results-card">
      <div className="card-header">
        <span className="card-title">Benchmark Results</span>
        <span className="result-algo-badge" style={{ "--badge-color": algoMeta.color }}>
          {algoMeta.label}
        </span>
      </div>

      <div className="metrics-grid">
        <MetricTile
          label="Execution Time"
          value={result.time_ms?.toFixed(4)}
          unit="ms"
          color="#00f5d4"
          icon="⏱"
        />
        <MetricTile
          label="Cycles / Byte"
          value={result.cycles_per_byte?.toFixed(2)}
          unit="c/B"
          color="#4cc9f0"
          icon="🔄"
        />
        <MetricTile
          label="Total Cycles"
          value={result.total_cycles?.toLocaleString()}
          unit="cyc"
          color="#f72585"
          icon="⚙"
        />
        <MetricTile
          label="Iterations"
          value={result.iterations?.toLocaleString()}
          unit="iter"
          color="#f4a261"
          icon="🔁"
        />
      </div>

      <div className="cipher-section">
        <div className="cipher-block">
          <div className="cipher-header">
            <span className="cipher-label">🔒 Ciphertext (Hex)</span>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(result.ciphertext_hex)}>
              Copy
            </button>
          </div>
          <div className="cipher-text">{cipherPreview}</div>
          {result.ciphertext_hex?.length > 64 && (
            <button className="toggle-btn" onClick={() => setShowFull(!showFull)}>
              {showFull ? "Show less ▲" : "Show full ▼"}
            </button>
          )}
        </div>

        <div className="cipher-block">
          <div className="cipher-header">
            <span className="cipher-label">🔓 Decrypted Text</span>
            <span className={`verify-badge ${result.decrypted_text === undefined ? "" : "verified"}`}>
              ✓ Verified
            </span>
          </div>
          <div className="decrypted-text">{result.decrypted_text}</div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, unit, color, icon }) {
  return (
    <div className="metric-tile" style={{ "--tile-color": color }}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-unit">{unit}</div>
      <div className="metric-label">{label}</div>
      <div className="tile-glow" />
    </div>
  );
}
