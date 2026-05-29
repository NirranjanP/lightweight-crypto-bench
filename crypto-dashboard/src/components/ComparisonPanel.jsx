import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const COLORS = {
  speck: "#00f5d4",
  present: "#f72585",
  aes: "#4cc9f0",
  ascon: "#f4a261",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tt-algo">{d.algorithm?.toUpperCase()}</p>
        <p className="tt-row">⏱ <b>{d.time_ms?.toFixed(4)} ms</b></p>
        <p className="tt-row">🔄 {d.cycles_per_byte?.toFixed(2)} c/B</p>
        <p className="tt-row">⚙ {d.total_cycles?.toLocaleString()} cycles</p>
      </div>
    );
  }
  return null;
};

export default function ComparisonPanel({
  algorithms, inputText, setInputText,
  loading, results, onRun
}) {
  const chartData = results?.map(r => ({
    name: r.algorithm?.toUpperCase(),
    algorithm: r.algorithm,
    time_ms: parseFloat(r.time_ms?.toFixed(4)),
    cycles_per_byte: r.cycles_per_byte,
    total_cycles: r.total_cycles,
    iterations: r.iterations,
  }));

  const fastest = results ? results.reduce((a, b) => a.time_ms < b.time_ms ? a : b) : null;

  return (
    <div className="compare-layout">
      <div className="card compare-input-card">
        <div className="card-header">
          <span className="card-title">⚖ Algorithm Comparison</span>
          <span className="card-tag">ALL ALGOS</span>
        </div>
        <p className="compare-desc">
          Runs all 4 algorithms on the same input and compares performance side by side.
        </p>
        <div className="field-group">
          <label className="field-label">
            Input Text
            <span className="char-count">{inputText.length} chars</span>
          </label>
          <textarea
            className="text-input"
            placeholder="Enter text to benchmark across all algorithms..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
          />
        </div>
        <button
          className={`run-btn ${loading ? "loading" : ""}`}
          style={{ "--btn-color": "#a78bfa" }}
          onClick={onRun}
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner" /> Running All Algorithms...</>
          ) : (
            <><span className="run-icon">▶▶</span> Compare All</>
          )}
        </button>
      </div>

      {results && (
        <>
          <div className="card chart-card">
            <div className="card-header">
              <span className="card-title">Execution Time Comparison</span>
              {fastest && (
                <span className="fastest-badge">
                  🏆 Fastest: {fastest.algorithm.toUpperCase()}
                </span>
              )}
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#8899aa", fontSize: 12, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} unit=" ms" width={70} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                  <Bar dataKey="time_ms" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry) => (
                      <Cell key={entry.algorithm} fill={COLORS[entry.algorithm] || "#888"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card table-card">
            <div className="card-header">
              <span className="card-title">Detailed Comparison Table</span>
            </div>
            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Time (ms)</th>
                    <th>Cycles/Byte</th>
                    <th>Total Cycles</th>
                    <th>Iterations</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .slice()
                    .sort((a, b) => a.time_ms - b.time_ms)
                    .map((r, i) => (
                      <tr key={r.algorithm} className={i === 0 ? "row-top" : ""}>
                        <td>
                          <span className="table-algo" style={{ "--a-color": COLORS[r.algorithm] }}>
                            <span className="algo-dot" />
                            {r.algorithm.toUpperCase()}
                          </span>
                        </td>
                        <td className="mono">{r.time_ms?.toFixed(4)}</td>
                        <td className="mono">{r.cycles_per_byte?.toFixed(2)}</td>
                        <td className="mono">{r.total_cycles?.toLocaleString()}</td>
                        <td className="mono">{r.iterations?.toLocaleString()}</td>
                        <td>
                          <span className={`rank-badge rank-${i + 1}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
