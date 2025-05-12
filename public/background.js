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