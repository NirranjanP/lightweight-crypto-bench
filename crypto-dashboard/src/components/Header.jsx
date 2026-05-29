export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-group">
          <div className="logo-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="#00f5d4" strokeWidth="1.5" />
              <rect x="20" y="2" width="14" height="14" rx="2" stroke="#4cc9f0" strokeWidth="1.5" />
              <rect x="2" y="20" width="14" height="14" rx="2" stroke="#f72585" strokeWidth="1.5" />
              <rect x="20" y="20" width="14" height="14" rx="2" stroke="#f4a261" strokeWidth="1.5" />
              <line x1="9" y1="2" x2="9" y2="16" stroke="#00f5d4" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="27" y1="2" x2="27" y2="16" stroke="#4cc9f0" strokeWidth="0.5" strokeDasharray="2 2" />
            </svg>
          </div>
          <div>
            <h1 className="header-title">Crypto Benchmark Dashboard</h1>
            <p className="header-subtitle">Lightweight Cipher Performance Analyzer</p>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge badge-green">● Backend Live</span>
          <span className="badge badge-blue">localhost:5000</span>
        </div>
      </div>
    </header>
  );
}
