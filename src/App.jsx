// Project: AlumniConnectAI
import { useState } from "react";
import './App.css';

function App() {
  const [open, setOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [alumName, setAlum]   = useState("");
  const [promptText, setPromptText] = useState("");

  const handleScrape = async () => {
    setShowToast(true);

    /* Fake scrape */
    const scrapedName = await new Promise(r =>
      setTimeout(() => r("John Cena"), 1200)
    );

    setAlum(scrapedName);      // fill the text box
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
      // brief “copied!” toast
      setToast(true);
      setTimeout(() => setToast(false), 1200);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleClear = () => {
    setPromptText("");
    setAlum("");
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
        <h3>Temp</h3>
        <ul>
          <li>temp1</li>
          <li>temp2</li>
          <li>temp3</li>
        </ul>
      </aside>
    </div>
  );
}

export default App;
