(() => {
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
  
    // 4. Create the final structured object
    const fullScrapeResult = {
      profile,
      emails,
      academic: academicData,
    };
  
    // 5. Save into localStorage
    localStorage.setItem('fullScrapeResult', JSON.stringify(fullScrapeResult));
  
    // 6. Final console logs for debugging
    console.log('=== Full Scraped Result ===');
    console.log(fullScrapeResult);
  })();
  