import { GoogleGenAI } from "@google/genai";

// Get API key from Vite environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Initialize AI client if API key is available
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey.trim() !== '') {
  try {
    ai = new GoogleGenAI(apiKey);
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
    ai = null;
  }
}

export const analyzeMarketScenario = async (scenarioTitle: string, description: string): Promise<string> => {
  // Check if API key is configured
  if (!apiKey || apiKey.trim() === '') {
    return "AI Analysis Unavailable: No API Key configured.\n\n" +
           "To enable AI analysis:\n" +
           "1. Get a free API key from https://aistudio.google.com/apikey\n" +
           "2. Add it to your .env file as: VITE_GEMINI_API_KEY=your_api_key_here\n" +
           "3. Restart your dev server (npm run dev)";
  }

  if (!ai) {
    return "AI Analysis Unavailable: Failed to initialize Gemini AI client. Please check your API key.";
  }

  try {
    // Use the correct API format for @google/genai package
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `You are a senior financial analyst and prediction market expert.
Analyze the following betting scenario briefly (max 100 words).
Provide a "Bullish" or "Bearish" sentiment for the "YES" outcome and list 2 key factors to consider.

Scenario: ${scenarioTitle}
Description: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "Analysis could not be generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMsg = error?.message || String(error) || 'Unknown error';
    
    // Provide helpful error messages
    if (errorMsg.includes('API key') || errorMsg.includes('authentication') || errorMsg.includes('401')) {
      return "AI Analysis Unavailable: Invalid API key.\n\n" +
             "Please check:\n" +
             "1. Your VITE_GEMINI_API_KEY in .env file is correct\n" +
             "2. The API key is valid (get a new one from https://aistudio.google.com/apikey)\n" +
             "3. You've restarted your dev server after adding the key";
    }
    
    if (errorMsg.includes('quota') || errorMsg.includes('429')) {
      return "AI Analysis Unavailable: API quota exceeded. Please try again later.";
    }
    
    if (errorMsg.includes('model') || errorMsg.includes('404')) {
      // Try fallback to a more stable model
      try {
        const fallbackModel = ai!.getGenerativeModel({ model: 'gemini-pro' });
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        return response.text() || "Analysis could not be generated.";
      } catch (fallbackError) {
        return "AI Analysis Unavailable: Model not available. Please try again later.";
      }
    }
    
    // Return a truncated error message
    const shortError = errorMsg.length > 150 ? errorMsg.substring(0, 150) + '...' : errorMsg;
    return `Error generating analysis: ${shortError}`;
  }
};
