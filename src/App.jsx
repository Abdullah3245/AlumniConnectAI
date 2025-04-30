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
  // for later
  const [tab, setTab] = useState<"alums" | "resumes">("alums");

  const [alumSet, setAlumSet] = useState(() => {
    const stored = localStorage.getItem("scrapedAlums");
    return new Set(stored ? JSON.parse(stored) : []);
  });
  

  useEffect(() => {
    localStorage.setItem("scrapedAlums", JSON.stringify(Array.from(alumSet)));
  }, [alumSet]);

  const handleScrape = async () => {
    setShowToast(true);

    /* FAKE SCRAPE */
    const scrapedName = await new Promise(r =>
      setTimeout(() => r("John Cena"), 1200)
    );

    // adds alum to list of scraped alums
    setAlum(scrapedName);    
    setAlumSet(prev => {
      const next = new Set(prev);
      next.add(scrapedName);
      return next;
    });

    setTimeout(() => setShowToast(false), 1500);
  };

  const handleGenerate = () => {

    // PROMPT GENERATION
    const resumeSummary = "Freshman at the University of Pennsylvania studying Computer Science. Experienced in frontend web development, React, and Chrome extension design. Interned at Meta and led the frontend team for a student-built AI product.";
    const jobTitle = "Product Designer";
    const company = "Google";
    const location = "San Francisco, CA";
    const tone = "Friendly";
  
    const prompt = `
      You are an assistant that helps generate personalized networking emails for students reaching out to alumni.
      
      Given:
      - The name of the alum
      - Their job title, company, and location (if available)
      - A short summary of the student's resume
      - The student's intended tone (e.g., friendly, professional, enthusiastic)
      
      Generate a concise, well-written email introducing the student, showing genuine interest in the alum’s career, and asking to connect for advice or a quick conversation.
      
      Use the format below:
      
      ---
      
      **Student Resume Summary:** ${resumeSummary}
      
      **Alum Info:**
      - Name: ${alumName || "Alum"}
      - Job Title: ${jobTitle}
      - Company: ${company}
      - Location: ${location}
      
      **Tone:** ${tone}
      
      ---
      
      Write the email below:
      `.trim();
    
      setPromptText(prompt);
  };
  

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // CLEAR BUTTON
  const handleClear = () => {
    setPromptText("");
    setAlum("");
  };

  // RESUME UPLOAD
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setResumeName(file.name);


    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;
      chrome.storage.local.get(["resumeList"], (result) => {
        const oldList = result.resumeList || [];
        const newEntry = { name: file.name, content };
        chrome.storage.local.set({ resumeList: [...oldList, newEntry] });
      });
    };
    reader.readAsText(file);
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

        {/* resume name preview for user */}
        {resumeName && <div className="file-name">📄 {resumeName}</div>}

        {/* === Scrape alumni section ====================== */}
        <button className="scrape-btn" onClick={handleScrape}>🗘 Scrape</button>

        {/* Toast */}
        {showToast && <div className="toast">Scraping…</div>}  

        {/* === Alum name field ====================== */}
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

        {/* === Generate + Copy buttons ====================== */}
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

        {/* === Clear button ====================== */}
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

        {/* later do this: expanding use of sidebar */}

        {/* <div className="flex space-x-4 p-2">
          <button onClick={() => setTab("alums")} className={tab === "alums" ? "font-bold" : ""}>Scraped Alums</button>
          <button onClick={() => setTab("resumes")} className={tab === "resumes" ? "font-bold" : ""}>Past Resumes</button>
        </div> */}
      </aside>
    </div>
  );
}

export default App;
