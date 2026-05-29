export default function BenchmarkPanel({
  algorithms, algorithm, setAlgorithm,
  inputText, setInputText, loading, onRun
}) {
  const selected = algorithms.find(a => a.value === algorithm);

  return (
    <div className="card benchmark-card">
      <div className="card-header">
        <span className="card-title">Configure Benchmark</span>
        <span className="card-tag">INPUT</span>
      </div>

      <div className="field-group">
        <label className="field-label">Select Algorithm</label>
        <div className="algo-grid">
          {algorithms.map((algo) => (
            <button
              key={algo.value}
              className={`algo-chip ${algorithm === algo.value ? "selected" : ""}`}
              style={{ "--chip-color": algo.color }}
              onClick={() => setAlgorithm(algo.value)}
            >
              <span className="chip-dot" />
              {algo.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">
          Plaintext Input
          <span className="char-count">{inputText.length} chars</span>
        </label>
        <textarea
          className="text-input"
          placeholder="Enter the text to encrypt and benchmark..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
        />
      </div>

      <button
        className={`run-btn ${loading ? "loading" : ""}`}
        style={{ "--btn-color": selected?.color || "#00f5d4" }}
        onClick={onRun}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Running {selected?.label}...
          </>
        ) : (
          <>
            <span className="run-icon">▶</span>
            Run Benchmark
          </>
        )}
      </button>

      <div className="algo-info">
        <InfoBox algo={algorithm} />
      </div>
    </div>
  );
}

function InfoBox({ algo }) {
  const info = {
    speck: { desc: "NSA lightweight cipher, optimized for software.", keysize: "128-bit key", blocksize: "64/128-bit block" },
    present: { desc: "Ultra-lightweight hardware-oriented block cipher.", keysize: "80/128-bit key", blocksize: "64-bit block" },
    aes: { desc: "NIST standard, widely used symmetric cipher.", keysize: "128/256-bit key", blocksize: "128-bit block" },
    ascon: { desc: "NIST lightweight crypto winner (2023), AEAD.", keysize: "128-bit key", blocksize: "64-bit rate" },
  };
  const d = info[algo];
  if (!d) return null;
  return (
    <div className="info-box">
      <p className="info-desc">{d.desc}</p>
      <div className="info-tags">
        <span className="info-tag">{d.keysize}</span>
        <span className="info-tag">{d.blocksize}</span>
      </div>
    </div>
  );
}
