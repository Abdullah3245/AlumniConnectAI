// Helper: Read PDF as base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: Extract text from PDF using pdf.js
async function extractTextFromPDF(base64) {
  const pdfData = atob(base64);
  const uint8Array = new Uint8Array(pdfData.length);
  for (let i = 0; i < pdfData.length; i++) uint8Array[i] = pdfData.charCodeAt(i);

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

// Helper: Advanced resume parsing using heuristics and NLP
function parseResumeSections(text) {
  // Normalize text
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Section headers to look for
  const sections = [
    'education', 'work experience', 'professional experience', 'experience',
    'extracurricular', 'projects', 'skills', 'certifications', 'awards'
  ];

  // Find section indices
  const sectionIndices = {};
  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    sections.forEach(section => {
      if (lower.includes(section) && !(section in sectionIndices)) {
        sectionIndices[section] = idx;
      }
    });
  });

  // Extract sections
  const result = {};
  const sectionNames = Object.keys(sectionIndices).sort((a, b) => sectionIndices[a] - sectionIndices[b]);
  for (let i = 0; i < sectionNames.length; i++) {
    const start = sectionIndices[sectionNames[i]];
    const end = i + 1 < sectionNames.length ? sectionIndices[sectionNames[i + 1]] : lines.length;
    result[sectionNames[i]] = lines.slice(start + 1, end).join('\n');
  }

  // Use compromise NLP for named entity extraction (education, orgs, dates, etc.)
  const nlp = window.nlp || window.compromise;
  const doc = nlp(text);

  // Education: look for degrees, universities, years
  const education = [];
  if (result.education) {
    const eduLines = result.education.split('\n');
    eduLines.forEach(line => {
      const degree = /(bachelor|master|phd|associate|ba|bs|ms|mba|b\.s\.|b\.a\.|m\.s\.|ph\.d\.)/i.exec(line);
      const year = /\b(19|20)\d{2}\b/.exec(line);
      if (degree || year) {
        education.push({ line, degree: degree?.[0], year: year?.[0] });
      }
    });
  }

  // Work Experience: look for organizations, roles, dates
  const experience = [];
  if (result['work experience'] || result.experience || result['professional experience']) {
    const expText = result['work experience'] || result.experience || result['professional experience'];
    const expLines = expText.split('\n');
    expLines.forEach(line => {
      const org = nlp(line).organizations().out('text');
      const date = /\b(19|20)\d{2}\b/.exec(line);
      if (org || date) {
        experience.push({ line, org, date: date?.[0] });
      }
    });
  }

  // Skills: look for comma-separated lists or bullet points
  const skills = [];
  if (result.skills) {
    result.skills.split(/[\n,•]/).forEach(skill => {
      const s = skill.trim();
      if (s && s.length > 1) skills.push(s);
    });
  }

  // Extracurriculars, Projects, etc.
  const extracurriculars = result.extracurricular || '';
  const projects = result.projects || '';
  const certifications = result.certifications || '';
  const awards = result.awards || '';

  return {
    education,
    experience,
    skills,
    extracurriculars,
    projects,
    certifications,
    awards,
    rawText: text
  };
}

// UI logic
document.getElementById('upload-btn').onclick = () => {
  document.getElementById('resume-upload').click();
};

document.getElementById('resume-upload').onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('resume-status').innerText = 'Uploading and parsing...';

  // 1. Store PDF as base64
  const base64 = await readFileAsBase64(file);
  await chrome.storage.local.set({ resumePDF: base64 });

  // 2. Parse PDF and extract text
  const text = await extractTextFromPDF(base64);

  // 3. Advanced parsing
  const resumeJSON = parseResumeSections(text);

  // 4. Store JSON in local storage
  await chrome.storage.local.set({ resumeJSON });

  document.getElementById('resume-status').innerText = 'Resume uploaded and parsed!';
}; 