// PDF.js worker source - we'll need to include this in manifest.json
const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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

// Helper function to extract education information
function extractEducation(text) {
  const educationKeywords = [
    'University', 'College', 'School', 'Institute', 'Bachelor', 'Master', 'PhD',
    'B.S.', 'M.S.', 'B.A.', 'M.A.', 'B.E.', 'M.E.', 'MBA', 'JD', 'MD'
  ];

  const lines = text.split('\n');
  const educationEntries = [];
  let currentEntry = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line contains education keywords
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      if (currentEntry) {
        educationEntries.push(currentEntry);
      }
      currentEntry = {
        institution: line,
        details: []
      };
    } else if (currentEntry && line) {
      currentEntry.details.push(line);
    }
  }

  if (currentEntry) {
    educationEntries.push(currentEntry);
  }

  return educationEntries;
}

// Main function to parse resume
async function parseResume(pdfFile) {
  try {
    const text = await extractTextFromPDF(pdfFile);
    
    // Extract basic information
    const emails = extractEmails(text);
    const phones = extractPhoneNumbers(text);
    const education = extractEducation(text);

    // Create structured data object
    const resumeData = {
      profile: {
        emails: emails,
        phones: phones,
        // Add more profile fields as needed
      },
      education: education,
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