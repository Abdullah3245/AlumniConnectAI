// Project: AlumniConnectAI
import { useState, useEffect, useRef } from "react";
import './App.css';

function App() {
  const [open, setOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [alumName, setAlum] = useState("");
  const [promptText, setPromptText] = useState("");
  const [scrapedData, setScrapedData] = useState(null);
  const [aiOverview, setAIOverview] = useState(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const fileRef = useRef(null);
  // for later
  const [tab, setTab] = useState < "alums" | "resumes" > ("alums");

  const [alumMap, setAlumMap] = useState(() => {
    const stored = localStorage.getItem("scrapedAlums");
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem("scrapedAlums", JSON.stringify(alumMap));
  }, [alumMap]);

  const handleScrape = async () => {
    setShowToast(true);

    try {
      // Execute the scraping script in the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Helper: safely get text from a selector
          const getText = (selector) =>
            document.querySelector(selector)?.textContent.trim() ?? '(not found)';

          // 1. Scrape Profile Info
          const profile = {
            name: getText('lightning-formatted-name.profileHeaderName'),
            gradYear: getText('lightning-formatted-text.profileHeaderAcadAffil'),
            employer: getText('lightning-formatted-text.profileHeaderEmployer'),
            title: getText('lightning-formatted-text.profileHeaderTitle'),
            location: getText('lightning-formatted-text.profileHeaderCity'),
          };

          // 2. Scrape Emails
          const emails = [...document.querySelectorAll('a[href^="mailto:"]')]
            .map(link => link.href.replace('mailto:', '').trim());

          // 3. Scrape Academic Information
          const academicData = [];
          const validSchoolKeywords = [
            "School", "Wharton", "Engineering", "Nursing", "Law", "Education",
            "Medicine", "Social Policy", "Design", "Dental", "Veterinary"
          ];

          const tiles = document.querySelectorAll('article.rlt-card');

          tiles.forEach(tile => {
            const schoolName = tile.querySelector('h3 span[part="formatted-rich-text"]')?.textContent.trim() ?? '';

            if (!validSchoolKeywords.some(keyword => schoolName.includes(keyword))) {
              return; // Skip non-education cards
            }

            const fields = tile.querySelectorAll('dl dt.slds-item_label');
            const values = tile.querySelectorAll('dl dd.slds-item_detail');

            const entry = { school: schoolName };

            fields.forEach((field, idx) => {
              const label = field?.innerText.trim().replace(':', '') ?? '';
              const value = values[idx]?.innerText.trim() ?? '';

              if (label && value) {
                entry[label] = value;
              }
            });

            academicData.push(entry);
          });

          return {
            profile,
            emails,
            academic: academicData,
          };
        }
      });

      const scrapedData = results[0].result;
      setScrapedData(scrapedData);
      setAlumMap(prev => ({
        ...prev,
        [scrapedData.profile.name]: scrapedData
      }));
      setAlum(scrapedData.profile.name);

      // Get AI overview for the job title
      if (scrapedData.profile.title) {
        const aiResult = await chrome.runtime.sendMessage({
          type: 'getAIOverview',
          query: scrapedData.profile.title
        });
        setAIOverview(aiResult);
        localStorage.setItem('aiOverview', JSON.stringify(aiResult));
      }

      localStorage.setItem('fullScrapeResult', JSON.stringify(scrapedData));
    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      setTimeout(() => setShowToast(false), 1500);
    }
  };

  const handleGenerate = () => {
    if (!scrapedData) return;

    const { profile, emails, academic } = scrapedData;
    const resumeData = JSON.parse(localStorage.getItem('resumeParseResult') || 'null');

    // 1. LLM Instructions
    let prompt = `You are an expert email writer. Generate a personalized cold email to an alumni from my college.\n`;
    prompt += `Use the information under "Alumni Information" to address the recipient and reference their background.\n`;
    prompt += `Incorporate relevant details from "Resume Education Information" to highlight shared experiences or interests, and connect them to the alumni's current role if possible.\n`;
    prompt += `Be concise, professional, and engaging.\n\n`;

    // 2. Alumni Information Section
    prompt += `Alumni Information:\n`;
    prompt += `Name: ${profile.name}\n`;
    if (profile?.title && profile.title !== '(not found)') {
      prompt += `Title: ${profile.title}\n`;
    }
    if (profile?.employer && profile.employer !== '(not found)') {
      prompt += `Employer: ${profile.employer}\n`;
    }
    if (profile?.location && profile.location !== '(not found)') {
      prompt += `Location: ${profile.location}\n`;
    }
    // Combine emails from both sources
    const allEmails = new Set([
      ...(emails || []),
      ...(resumeData?.profile?.emails || [])
    ]);
    if (allEmails.size > 0) {
      prompt += `Emails: ${Array.from(allEmails).join(', ')}\n`;
    }
    if (resumeData?.profile?.phones?.length) {
      prompt += `Phone Numbers: ${resumeData.profile.phones.join(', ')}\n`;
    }
    // Academic info from alumni
    if (academic?.length) {
      academic.forEach((entry, i) => {
        prompt += `School ${i + 1}: ${entry.school}\n`;
        if (entry['Class Year']) prompt += `Class Year: ${entry['Class Year']}\n`;
        if (entry['Degree']) prompt += `Degree: ${entry['Degree']}\n`;
        if (entry['Major(s)']) prompt += `Major(s): ${entry['Major(s)']}\n`;
        if (entry['Minor(s)']) prompt += `Minor(s): ${entry['Minor(s)']}\n`;
        prompt += `\n`;
      });
    }

    // 3. Resume Information Sections (from improved parser)
    if (resumeData?.sections) {
      prompt += `Resume Information:\n`;
      // List the order you want to display sections
      const sectionOrder = [
        'HEADER',
        'EDUCATION',
        'WORK EXPERIENCE',
        'LEADERSHIP',
        'PROJECTS',
        'PUBLICATIONS',
        'AWARDS',
        'SKILLS'
      ];
      sectionOrder.forEach(section => {
        if (resumeData.sections[section] && resumeData.sections[section].length) {
          // Skip HEADER if you don't want to show it
          if (section !== 'HEADER') {
            prompt += `  ${section[0] + section.slice(1).toLowerCase().replace(/_/g, ' ')}:\n`;
          }
          resumeData.sections[section].forEach(line => {
            prompt += `    - ${line}\n`;
          });
          prompt += `\n`;
        }
      });
    }

    // 4. AI Insights (optional)
    if (aiOverview?.length) {
      prompt += `\nAI Insights: ${aiOverview.join('; ')}`;
    }

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
    setScrapedData(null);
    setAIOverview(null);
    localStorage.removeItem('fullScrapeResult');
    localStorage.removeItem('aiOverview');
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setResumeName(file.name);

    // Call the resume parser!
    if (window.parseResume) {
      window.parseResume(file)
        .then(() => {
          // Optionally, you can show a toast or update state here
          console.log('Resume parsed and saved to localStorage');
        })
        .catch((err) => {
          console.error('Failed to parse resume:', err);
        });
    } else {
      console.error('parseResume function not found on window');
    }
  };

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('fullScrapeResult');
    const savedAIOverview = localStorage.getItem('aiOverview');

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setScrapedData(parsedData);
      setAlum(parsedData.profile.name);
    }

    if (savedAIOverview) {
      setAIOverview(JSON.parse(savedAIOverview));
    }
  }, []);

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
          {Object.keys(alumMap).map(name => (
            <li key={name}>
              <button
                className="alum-button"
                onClick={() => {
                  setAlum(name);
                  setScrapedData(alumMap[name]);
                  setPromptText("");
                  setAIOverview(null); // Optional: reset insights for that alum
                }}
              >
                {name}
              </button>
            </li>
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
