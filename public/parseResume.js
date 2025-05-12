// PDF.js worker source - we'll need to include this in manifest.json
const PDFJS_WORKER_SRC = chrome.runtime.getURL('pdf.worker.min.js');

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

// Helper function to extract text from PDF
async function extractTextFromPDF(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

// Helper function to extract email addresses
function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(emailRegex) || [])];
}

// Helper function to extract phone numbers
function extractPhoneNumbers(text) {
  const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
  return [...new Set(text.match(phoneRegex) || [])];
}

// Helper function to extract sections from resume text
function extractSections(text) {
  // Section headers to look for
  const sectionOrder = [
    'EDUCATION',
    'WORK EXPERIENCE',
    'LEADERSHIP',
    'PROJECTS',
    'PUBLICATIONS',
    'AWARDS',
    'SKILLS'
  ];
  // Build regex for section headers
  const sectionRegex = new RegExp(`^(${sectionOrder.join('|')})`, 'i');

  // Split text into lines
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  const sections = {};
  let currentSection = 'HEADER';
  sections[currentSection] = [];

  for (let line of lines) {
    const headerMatch = line.match(sectionRegex);
    if (headerMatch) {
      currentSection = headerMatch[1].toUpperCase();
      if (!sections[currentSection]) sections[currentSection] = [];
      continue;
    }
    sections[currentSection].push(line);
  }
  return sections;
}

// Main function to parse resume
async function parseResume(pdfFile) {
  try {
    const text = await extractTextFromPDF(pdfFile);
    
    // Extract basic information
    const emails = extractEmails(text);
    const phones = extractPhoneNumbers(text);
    const sections = extractSections(text);

    // Create structured data object
    const resumeData = {
      profile: {
        emails: emails,
        phones: phones,
        // Add more profile fields as needed
      },
      sections: sections, // Store all parsed sections as arrays of lines
      rawText: text // Store raw text for potential future processing
    };

    // Save to localStorage in the same format as webscraper.js
    localStorage.setItem('resumeParseResult', JSON.stringify(resumeData));
    
    console.log('=== Resume Parse Result ===');
    console.log(resumeData);

    return resumeData;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

// Export the main function
window.parseResume = parseResume; 