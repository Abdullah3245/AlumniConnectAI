// Function to call SerpAPI for Google AI Overview
async function getAIOverview(query) {
    const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
    const endpoint = `https://serpapi.com/search?engine=google_ai_overview&q=${encodeURIComponent(query)}&api_key=${apiKey}`;

    try {
        const response = await fetch(endpoint);
        
        // Check if the response is OK (status code 200-299)
        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorDetails.error}`);
        }

        const data = await response.json();
        
        // Check if the AI overview data is available
        if (!data.ai_overview) {
            throw new Error('AI Overview data not available in the response.');
        }

        // Process the AI overview data as needed
        const aiOverview = data.ai_overview;
        // Example: Extracting text blocks
        const insights = aiOverview.text_blocks.map(block => block.snippet).join('\n');

        return {
            success: true,
            insights: insights, // Return the processed insights
            rawData: aiOverview // Optionally return the raw data for further processing
        };
    } catch (error) {
        console.error('Error fetching data from SerpAPI:', error);
        return {
            success: false,
            message: error.message // Return the error message for handling
        };
    }
}

module.exports = { getAIOverview }; // Change to CommonJS export