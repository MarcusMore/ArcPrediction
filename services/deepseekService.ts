import OpenAI from "openai";

// Get API key from Vite environment variables
const getApiKey = (): string => {
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
  return key.trim();
};

// Lazy initialization of OpenAI client
let client: OpenAI | null = null;
let initializationError: string | null = null;

const initializeClient = (): boolean => {
  if (client) return true; // Already initialized
  
  const apiKey = getApiKey();
  
  if (!apiKey) {
    initializationError = "No API key found";
    return false;
  }

  try {
    client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });
    initializationError = null;
    return true;
  } catch (error: any) {
    console.error("Failed to initialize DeepSeek AI:", error);
    initializationError = error?.message || String(error) || 'Unknown initialization error';
    client = null;
    return false;
  }
};

export const analyzeMarketScenario = async (scenarioTitle: string, description: string): Promise<string> => {
  // Check if API key is configured
  const apiKey = getApiKey();
  if (!apiKey) {
    return "AI Analysis Unavailable: No API Key configured.\n\n" +
           "To enable AI analysis:\n" +
           "1. Get a free API key from https://platform.deepseek.com/api_keys\n" +
           "2. Add it to your .env file as: VITE_DEEPSEEK_API_KEY=your_api_key_here\n" +
           "3. Restart your dev server (npm run dev)";
  }

  // Initialize client if not already initialized
  if (!initializeClient()) {
    return `AI Analysis Unavailable: Failed to initialize DeepSeek AI client.\n\n` +
           `Error: ${initializationError}\n\n` +
           `Please check:\n` +
           `1. Your VITE_DEEPSEEK_API_KEY in .env file is correct\n` +
           `2. The API key is valid (get a new one from https://platform.deepseek.com/api_keys)\n` +
           `3. You've restarted your dev server after adding the key`;
  }

  if (!client) {
    return "AI Analysis Unavailable: Client initialization failed. Please check your API key and restart the server.";
  }

  try {
    const prompt = `You are a senior financial analyst and prediction market expert.
Analyze the following betting scenario briefly (max 100 words).
Provide a "Bullish" or "Bearish" sentiment for the "YES" outcome and list 2 key factors to consider.

Scenario: ${scenarioTitle}
Description: ${description}`;

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a senior financial analyst and prediction market expert. Provide concise, actionable analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content;
    return text || "Analysis could not be generated.";
  } catch (error: any) {
    console.error("DeepSeek API Error:", error);
    const errorMsg = error?.message || String(error) || 'Unknown error';
    
    // Provide helpful error messages
    if (errorMsg.includes('API key') || errorMsg.includes('authentication') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return "AI Analysis Unavailable: Invalid API key.\n\n" +
             "Please check:\n" +
             "1. Your VITE_DEEPSEEK_API_KEY in .env file is correct\n" +
             "2. The API key is valid (get a new one from https://platform.deepseek.com/api_keys)\n" +
             "3. You've restarted your dev server after adding the key";
    }
    
    if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      return "AI Analysis Unavailable: API quota exceeded. Please try again later.";
    }
    
    if (errorMsg.includes('model') || errorMsg.includes('404')) {
      return "AI Analysis Unavailable: Model not found. Please check the API documentation.";
    }
    
    // Return a truncated error message
    const shortError = errorMsg.length > 150 ? errorMsg.substring(0, 150) + '...' : errorMsg;
    return `Error generating analysis: ${shortError}`;
  }
};

