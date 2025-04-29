// Project: AlumniConnectAI
import { useState, useRef, useEffect } from "react";
import './App.css';

function App() {
  const [open, setOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [alumName, setAlum]   = useState("");
  const [promptText, setPromptText] = useState("");

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const fileRef = useRef(null);

  const [alumSet, setAlumSet] = useState(() => {
    const stored = localStorage.getItem("scrapedAlums");
    return new Set(stored ? JSON.parse(stored) : []);
  });

  useEffect(() => {
    localStorage.setItem("scrapedAlums", JSON.stringify(Array.from(alumSet)));
  }, [alumSet]);

  const handleScrape = async () => {
    setShowToast(true);

    /* Fake scrape */
    const scrapedName = await new Promise(r =>
      setTimeout(() => r("John Cena"), 1200)
    );

    setAlum(scrapedName);    
    setAlumSet(prev => {
      const next = new Set(prev);
      next.add(scrapedName);
      return next;
    });

    setTimeout(() => setShowToast(false), 1500);
  };

  const handleGenerate = () => {
    // …
    const prompt = `Alum: ${alumName || "Alum"},\n\ninsert special prompt`;
    setPromptText(prompt);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleClear = () => {
    setPromptText("");
    setAlum("");
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setResumeName(file.name);
  };

  return (
    <div className="container">
      {/* ─── Logo ──────────────────────────────────────────────── */}
      <img
        src="/assets/AlumniConnectIcon.png"
        alt="AlumniConnectAI logo"
        className="logo"
      />
      {/* ─── Top bar ───────────────────────────────────────────── */}
      <div className="top-bar">
        <span className="title">AlumniConnectAI</span>
        <button
          className="sidebar-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="toggle sidebar"
        >
          {open ? "✕" : "▶"}
        </button>
      </div>

      {/* Scrape + Alum field */}
      <div className="controls">

        {/* === Upload resume section ====================== */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={handleUpload}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="resume-btn"
          onClick={() => fileRef.current?.click()}
        >
          Upload&nbsp;Resume
        </button>

        {resumeName && <div className="file-name">📄 {resumeName}</div>}

        <button className="scrape-btn" onClick={handleScrape}>🗘 Scrape</button>

        {/* Toast */}
        {showToast && <div className="toast">Scraping…</div>}  

        <label className="alum-label">
          Alum
          <input
            className="alum-input"
            type="text"
            placeholder="Name will appear here"
            readOnly
            value={alumName}           
          />
        </label>

        <div className="actions">
          <button className="gen-btn" onClick={handleGenerate}>Generate</button>
          <button className="copy-btn" onClick={handleCopy}>Copy</button>
        </div>

        {/* new rectangle */}
        <textarea
        className="prompt-box"
        value={promptText}
        readOnly
        placeholder="Prompt will appear here..."
        />

        <div className="clear">
          <button className="clear-btn" onClick={handleClear}>Clear</button>
        </div>

      </div>
            

      {/* ─── Sidebar ───────────────────────────────────────────── */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <h3>Scraped Alumni</h3>
        <ul>
        {Array.from(alumSet).map(name => (
          <li key={name}>{name}</li>
        ))}
        </ul>
      </aside>
    </div>
  );
}

export default App;
