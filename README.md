# AlumniConnectAI

A Chrome extension that automates alumni outreach by scraping alumni data and sending personalized emails.

## Features

- Automated alumni data scraping
- Personalized email templates
- Email tracking and history
- Bulk email sending
- Easy-to-use interface

## Installation

1. Clone this repository locally
2. cd to local clone
3. Execute npm install in terminal
4. Still in terminal, execute npm run build 
5. Open Chrome and go to `chrome://extensions/`
6. Enable "Developer mode"
7. Click "Load unpacked" and select dist folder in the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Configure your email settings
3. Navigate to the alumni directory
4. Click "Start Scraping" to begin collecting alumni data
5. Review and customize email templates
6. Send personalized emails to alumni

## Development

### Project Structure

- `manifest.json` - Extension configuration
- `popup.html` - Main extension interface
- `popup.js` - Popup functionality
- `content.js` - Content script for scraping
- `background.js` - Background tasks
- `style.css` - Extension styling

## Authors

- Muhammad Abdullah Goher
- Alan Wu
- Adi Sirohi
- Caia Gelli

  ## Landing Page
  https://chrome-glow-landing.lovable.app/

## Advanced Resume Upload & Parsing

- Click the 'Upload Resume' button in the popup to upload your PDF resume.
- The PDF is stored in Chrome local storage as a base64 string.
- The extension uses pdf.js to extract text from the PDF and compromise.js for advanced NLP parsing.
- Parsed sections include: Education, Work Experience, Skills, Extracurriculars, Projects, Certifications, Awards, and more.
- The parsed data is stored as a JSON object in Chrome local storage (`resumeJSON`).
- Every new upload overwrites the previous resume and parsed data.

### Libraries Used
- [pdf.js](https://mozilla.github.io/pdf.js/) for PDF parsing
- [compromise.js](https://github.com/spencermountain/compromise) for NLP entity extraction
