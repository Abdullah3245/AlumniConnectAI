# TESTING.md

## Overview

Testing for this project was conducted manually. Due to the specific website (MyPenn Alumni Directory) and API calls with nondeterministic responses, we couldn't create reliable test cases and instead focused manual testing. 
---

## Testing

**Approach**: Manual walkthroughs performed in the Chrome Extension popup and side panel. 

### Test Case 1: Basic UI Load
- **Input**: Load the extension and click on the icon
- **Expected Output**: AlumniConnectAI loads successfully with no storied history
- **Result**: Pass — UI renders correctly, fonts and buttons load as expected

### Test Case 2: Insights Available
- **Input**: Press scrape and then generate on an alum's page where they have a conventional job title
- **Expected Output**: Generates a prompt with additional AI insights
- **Result**: Pass — AI insights fit cleanly at the end of generated prompt

### Test Case 3: No insights available
- **Input**: Press scrape and then generate on an alum's page where they have an unconventional job title
- **Expected Output**: Generates a prompt without an additional AI insights
- **Result**: Pass - Prompt fully generates without any mention of AI insights

### Test Case 4: Resume Upload
- **Input**: Upload resume to extension and generate a prompt
- **Expected Output**: Generates a prompt with resume information inserted cleanly
- **Result**: Needs Work - Generates with resume information, but resume info is not formatted nicely. However, it isn't clear how much this negatively impacts the LLM output.
