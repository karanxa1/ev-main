import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file.");
  // You might want to throw an error here or handle it more gracefully
  // depending on how critical this service is to your app's startup.
}

// Initialize the GoogleGenerativeAI instance only if API_KEY is available
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Configuration for the generative model
const generationConfig = {
  temperature: 0.7, // Controls randomness. Lower is more deterministic.
  topK: 1,          // Not typically used with Gemini, but shown for completeness from some examples.
  topP: 1,          // Controls diversity. 1.0 means no nucleus sampling.
  maxOutputTokens: 2048, // Maximum length of the response.
};

// Safety settings to block harmful content
// Adjust these as needed based on your application's requirements.
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Function to generate a chat response using the Gemini API
export const generateChatResponse = async (chatHistory, newMessage) => {
  if (!genAI) {
    console.error("Gemini AI SDK not initialized. Check API Key.");
    return "Error: AI Service not initialized. Please check your API key setup.";
  }

  try {
    // For chat, it's best to use startChat() for conversational context
    // Model: 'gemini-pro' is suitable for text-only chat.
    // For multimodal, you might use 'gemini-pro-vision' if sending images later.
    const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig, safetySettings });

    // Convert your existing messages format to Gemini's format if needed
    // Gemini expects an array of { role: "user"/"model", parts: [{text: "..."}] }
    // The last message in the history should be the new user message.
    
    const historyForGemini = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: historyForGemini, // Pass the existing chat history
      // generationConfig and safetySettings are already part of the model config
    });

    const result = await chat.sendMessage(newMessage);
    const response = result.response;
    
    if (response && response.text) {
      return response.text();
    } else if (response && response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
      // Fallback for slightly different response structures if text() is not direct.
      return response.candidates[0].content.parts.map(part => part.text).join('');
    } else if (response && response.promptFeedback && response.promptFeedback.blockReason) {
      console.warn('Gemini API response blocked:', response.promptFeedback.blockReason, response.promptFeedback);
      return `I apologize, but I cannot respond to that due to safety guidelines. Reason: ${response.promptFeedback.blockReason}`;
    } else {
      console.error('Gemini API returned an unexpected response structure:', response);
      return "Sorry, I received an unexpected response from the AI. Please try again.";
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return "Sorry, I couldn't connect to the AI service. Please try again later.";
  }
}; 