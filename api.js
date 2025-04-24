// Function to call SerpAPI and get information about a position
async function fetchGoogleAI(apiKey, query) {
    try {
        const response = await fetch(`https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&engine=google_ai_overview`);
        if (!response.ok) {
            throw new Error(`Error fetching data from SerpAPI: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data; // Return the parsed JSON data
    } catch (error) {
        console.error("Failed to fetch data from SerpAPI:", error);
        throw error; // Rethrow the error for handling in the calling function
    }
}

// Export the functions for use in other modules
export { fetchGoogleAI };