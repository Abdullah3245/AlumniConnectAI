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

// Export the function
export { getAIOverview };