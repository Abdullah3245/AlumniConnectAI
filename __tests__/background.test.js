const { getAIOverview } = require('../background'); // Ensure this path is correct

// Mock the fetch function
global.fetch = jest.fn();

describe('getAIOverview', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    test('should return insights on successful API call', async () => {
        const mockResponse = {
            ai_overview: {
                text_blocks: [
                    { snippet: 'Insight 1' },
                    { snippet: 'Insight 2' }
                ]
            }
        };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(mockResponse)
        });

        const result = await getAIOverview('Software Engineer');
        expect(result).toEqual({
            success: true,
            insights: 'Insight 1\nInsight 2',
            rawData: mockResponse.ai_overview
        });
    });

    // ... other test cases ...
});