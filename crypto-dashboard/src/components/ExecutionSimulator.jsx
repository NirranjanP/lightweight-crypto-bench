import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

// Fallback cycles/byte if no real benchmark data
const DEFAULT_CPB = {
  speck: 5.2,
  present: 32.0,
  aes: 12.8,
  ascon: 8.5,
};

const COLORS = {
  speck: "#00f5d4",
  present: "#f72585",
  aes: "#4cc9f0",
  ascon: "#f4a261",
};

function calcTime(cpb, dataSizeKB, clockMHz) {
  const bytes = dataSizeKB * 1024;
  const cycles = cpb * bytes;
  const clockHz = clockMHz * 1e6;
  return (cycles / clockHz) * 1000; // ms
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tt-algo">{label} KB</p>
        {payload.map(p => (
          <p key={p.dataKey} className="tt-row" style={{ color: p.color }}>
            {p.name.toUpperCase()}: <b>{p.value?.toFixed(4)} ms</b>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ExecutionSimulator({ algorithms, benchmarkResults }) {
  const [dataSize, setDataSize] = useState(64);
  const [clockSpeed, setClockSpeed] = useState(16);
  const [selectedAlgo, setSelectedAlgo] = useState("aes");

  // Use real cycles/byte from benchmark results if available
  const cpbMap = useMemo(() => {
    if (!benchmarkResults) return DEFAULT_CPB;
    const map = { ...DEFAULT_CPB };
    benchmarkResults.forEach(r => {
      if (r.cycles_per_byte) map[r.algorithm] = r.cycles_per_byte;
    });
    return map;
  }, [benchmarkResults]);

  const currentTime = calcTime(cpbMap[selectedAlgo], dataSize, clockSpeed);

  // Build chart data: time vs data size
  const chartData = useMemo(() => {
    const sizes = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
    return sizes.map(s => {
      const point = { size: s };
      algorithms.forEach(a => {
        point[a.value] = parseFloat(calcTime(cpbMap[a.value], s, clockSpeed).toFixed(4));
      });
      return point;
    });
  }, [clockSpeed, cpbMap, algorithms]);

  const algoTimes = algorithms.map(a => ({
    ...a,
    time: calcTime(cpbMap[a.value], dataSize, clockSpeed),
    cpb: cpbMap[a.value],
  })).sort((a, b) => a.time - b.time);

  const selectedMeta = algorithms.find(a => a.value === selectedAlgo);
  const baseline = algoTimes[0];

  return (
    <div className="sim-layout">
      <div className="card sim-header-card">
        <div className="card-header">
          <span className="card-title">📊 Execution Time Simulator</span>
          <span className="card-tag">ESTIMATED</span>
        </div>
        <p className="compare-desc">
          Estimate execution time based on data size and clock speed using measured cycles/byte.
          {!benchmarkResults && (
            <span className="sim-note"> ⚠ Using default cycles/byte — run Compare All for real values.</span>
          )}
          {benchmarkResults && (
            <span className="sim-note sim-note-green"> ✓ Using real benchmark cycles/byte values.</span>
          )}
        </p>

        <div className="sim-controls">
          <div className="sim-control-group">
            <label className="field-label">
              Algorithm (Selected)
            </label>
            <div className="algo-grid">
              {algorithms.map(a => (
                <button
                  key={a.value}
                  className={`algo-chip ${selectedAlgo === a.value ? "selected" : ""}`}
                  style={{ "--chip-color": a.color }}
                  onClick={() => setSelectedAlgo(a.value)}
                >
                  <span className="chip-dot" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="slider-row">
            <div className="slider-group">
              <label className="field-label">
                Data Size
                <span className="slider-val">{dataSize} KB</span>
              </label>
              <input
                type="range" min={1} max={512} step={1}
                value={dataSize}
                onChange={e => setDataSize(Number(e.target.value))}
                className="range-slider"
                style={{ "--slider-color": selectedMeta?.color }}
              />
              <div className="slider-ticks">
                <span>1 KB</span><span>128 KB</span><span>512 KB</span>
              </div>
            </div>

            <div className="slider-group">
              <label className="field-label">
                Clock Speed
                <span className="slider-val">{clockSpeed} MHz</span>
              </label>
              <input
                type="range" min={1} max={240} step={1}
                value={clockSpeed}
                onChange={e => setClockSpeed(Number(e.target.value))}
                className="range-slider"
                style={{ "--slider-color": "#a78bfa" }}
              />
              <div className="slider-ticks">
                <span>1 MHz</span><span>120 MHz</span><span>240 MHz</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sim-middle">
        <div className="card sim-result-card">
          <p className="sim-config-label">
            Data: <b>{dataSize} KB</b> @ <b>{clockSpeed} MHz</b>
          </p>
          <div className="sim-big-time" style={{ color: selectedMeta?.color }}>
            {currentTime.toFixed(2)} <span className="sim-unit">ms</span>
          </div>
          <p className="sim-algo-label">{selectedMeta?.label}</p>
          <p className="sim-cpb">Cycles/byte: {cpbMap[selectedAlgo]?.toFixed(2)}</p>
        </div>

        <div className="card sim-rank-card">
          <div className="card-header">
            <span className="card-title">All Algorithms @ {dataSize} KB / {clockSpeed} MHz</span>
          </div>
          <div className="rank-list">
            {algoTimes.map((a, i) => {
              const pct = (a.time / algoTimes[algoTimes.length - 1].time) * 100;
              return (
                <div key={a.value} className="rank-row">
                  <span className="rank-num">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                  <span className="rank-name" style={{ color: a.color }}>{a.label}</span>
                  <div className="rank-bar-wrap">
                    <div className="rank-bar" style={{ width: `${pct}%`, background: a.color }} />
                  </div>
                  <span className="rank-time mono">{a.time.toFixed(3)} ms</span>
                  {i === 0 && a.value !== selectedAlgo && (
                    <span className="fastest-tag">fastest</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card chart-card">
        <div className="card-header">
          <span className="card-title">Execution Time vs Data Size</span>
          <span className="badge badge-blue">@ {clockSpeed} MHz</span>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" vertical={false} />
              <XAxis
                dataKey="size"
                tick={{ fill: "#8899aa", fontSize: 11, fontFamily: "monospace" }}
                axisLine={false} tickLine={false}
                unit=" KB"
              />
              <YAxis
                tick={{ fill: "#8899aa", fontSize: 11 }}
                axisLine={false} tickLine={false}
                unit=" ms" width={75}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#ffffff20" }} />
              <Legend
                wrapperStyle={{ paddingTop: 16, fontSize: 12, fontFamily: "monospace" }}
                formatter={(val) => <span style={{ color: COLORS[val] }}>{val.toUpperCase()}</span>}
              />
              <ReferenceLine x={dataSize} stroke="#ffffff30" strokeDasharray="4 4" label={{ value: `${dataSize}KB`, fill: "#ffffff50", fontSize: 10 }} />
              {algorithms.map(a => (
                <Line
                  key={a.value}
                  type="monotone"
                  dataKey={a.value}
                  stroke={COLORS[a.value]}
                  strokeWidth={selectedAlgo === a.value ? 2.5 : 1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  opacity={selectedAlgo === a.value ? 1 : 0.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
