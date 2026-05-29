import { useState } from "react";
import Header from "./components/Header";
import BenchmarkPanel from "./components/BenchmarkPanel";
import ResultsPanel from "./components/ResultsPanel";
import ComparisonPanel from "./components/ComparisonPanel";
import ExecutionSimulator from "./components/ExecutionSimulator";
import "./App.css";

const ALGORITHMS = [
  { value: "speck", label: "Speck", color: "#00f5d4" },
  { value: "present", label: "Present", color: "#f72585" },
  { value: "aes", label: "AES-128", color: "#4cc9f0" },
  { value: "ascon", label: "Ascon", color: "#f4a261" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("single");
  const [algorithm, setAlgorithm] = useState("aes");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [compResults, setCompResults] = useState(null);
  const [compLoading, setCompLoading] = useState(false);

  const runBenchmark = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to encrypt.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("http://localhost:5000/api/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm, text: inputText }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to compare algorithms.");
      return;
    }
    setCompLoading(true);
    setError(null);
    setCompResults(null);
    try {
      const promises = ALGORITHMS.map((algo) =>
        fetch("http://localhost:5000/api/benchmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ algorithm: algo.value, text: inputText }),
        }).then((r) => {
          if (!r.ok) throw new Error(`${algo.label} failed`);
          return r.json();
        })
      );
      const results = await Promise.all(promises);
      setCompResults(results);
    } catch (err) {
      setError(err.message || "Comparison failed.");
    } finally {
      setCompLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="grid-bg" />
      <Header />
      <nav className="tab-nav">
        {["single", "compare", "simulate"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => { setActiveTab(tab); setError(null); }}
          >
            {tab === "single" && "⚡ Single Benchmark"}
            {tab === "compare" && "⚖ Compare All"}
            {tab === "simulate" && "📊 Time Simulator"}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span> {error}
          </div>
        )}

        {activeTab === "single" && (
          <div className="panel-grid">
            <BenchmarkPanel
              algorithms={ALGORITHMS}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              inputText={inputText}
              setInputText={setInputText}
              loading={loading}
              onRun={runBenchmark}
            />
            <ResultsPanel result={result} loading={loading} algorithms={ALGORITHMS} />
          </div>
        )}

        {activeTab === "compare" && (
          <ComparisonPanel
            algorithms={ALGORITHMS}
            inputText={inputText}
            setInputText={setInputText}
            loading={compLoading}
            results={compResults}
            onRun={runComparison}
            error={error}
          />
        )}

        {activeTab === "simulate" && (
          <ExecutionSimulator algorithms={ALGORITHMS} benchmarkResults={compResults} />
        )}
      </main>
    </div>
  );
}
