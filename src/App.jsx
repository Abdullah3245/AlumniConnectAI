// Project: AlumniConnectAI
import { useState, useEffect, useRef } from "react";
import './App.css';
import WebScraper from "../public/webscraper";

// Function to call SerpAPI for Google AI Overview
async function getAIOverview(query) {
  const apiKey = "API KEY";

  return new Promise((resolve, reject) => {
    fetch(`https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${apiKey}`)
      .then(response => response.json())
      .then(json => {
        const token = json["ai_overview"]["page_token"];
        const endpoint = `https://serpapi.com/search?engine=google_ai_overview&q=${encodeURIComponent(query)}&api_key=${apiKey}&page_token=${token}`;

        fetch(endpoint)
          .then(response => response.json())
          .then(data => {
            const textBlocks = data["ai_overview"]["text_blocks"];
            const extractedText = textBlocks.map(block => {
              if (block.type === "paragraph") {
                return block.snippet;
              } else if (block.type === "list") {
                return block.list.map(item => item.snippet).join('\n');
              }
              return '';
            }).filter(text => text !== '').join('\n\n');

            resolve(extractedText);
          })
          .catch(error => reject(error));
      })
      .catch(error => reject(error));
  });
}

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
        const aiResult = await getAIOverview(scrapedData.profile.title);
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

    let prompt = `Alum: ${profile.name}\n`;

    if (profile?.title && profile.title !== '(not found)') {
      prompt += `Title: ${profile.title}\n`;
    }

    if (profile?.employer && profile.employer !== '(not found)') {
      prompt += `Employer: ${profile.employer}\n`;
    }

    if (profile?.location && profile.location !== '(not found)') {
      prompt += `Location: ${profile.location}\n`;
    }

    if (emails?.length) {
      prompt += `Emails: ${emails.join(', ')}\n`;
    }

    if (academic?.length) {
      prompt += `\nAcademic Background:\n`;
      academic.forEach((entry, i) => {
        prompt += `School ${i + 1}: ${entry.school}\n`;
        if (entry['Class Year']) {
          prompt += `Class Year: ${entry['Class Year']}\n`;
        }
        if (entry['Degree']) {
          prompt += `Degree: ${entry['Degree']}\n`;
        }
        if (entry['Major(s)']) {
          prompt += `Major(s): ${entry['Major(s)']}\n`;
        }
        if (entry['Minor(s)']) {
          prompt += `Minor(s): ${entry['Minor(s)']}\n`;
        }
        prompt += `\n`;
      });
    }

    prompt += `AI Insights: ${aiOverview?.insights || 'No AI insights available'}`;

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
