// Function to call SerpAPI for Google AI Overview
async function getAIOverview(query) {
    const apiKey = "217ae030d8810a6b3e56970071c780b18a767d787904c59c84fe63d712fe5222";

    return new Promise((resolve, reject) => {
        fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`)
            .then(response => response.json())
            .then(json => {
                const token = json["ai_overview"]["page_token"];
                const endpoint = `https://serpapi.com/search.json?engine=google_ai_overview&q=${encodeURIComponent(query)}&api_key=${apiKey}&page_token=${token}`;
                
                fetch(endpoint)
                    .then(response => response.json())
                    .then(data => {
                        const textBlocks = data["ai_overview"]["text_blocks"];
                        // Extract only the snippet_highlighted_words from paragraphs that have them
                        const highlightedWords = textBlocks
                            .filter(block => block.type === "paragraph" && block.snippet_highlighted_words)
                            .map(block => block.snippet_highlighted_words)
                            .flat(); // Flatten the array since each block might have multiple highlighted words
                        
                        resolve(highlightedWords);
                    })
                    .catch(error => reject(error));
            })
            .catch(error => reject(error));
    });
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getAIOverview') {
        getAIOverview(request.query)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Required for async sendResponse
    }
});

// Export the function
export { getAIOverview };

// No changes needed for background.js for resume upload and parsing logic.
// This file is ready for future background features.