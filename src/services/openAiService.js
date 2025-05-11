import OpenAI from 'openai';

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("OpenAI API Key not found. Please set REACT_APP_OPENAI_API_KEY in your .env file.");
}

// Initialize the OpenAI client instance only if API_KEY is available
const openai = API_KEY ? new OpenAI({ apiKey: API_KEY, dangerouslyAllowBrowser: true }) : null;
// dangerouslyAllowBrowser: true is used for client-side browser usage.
// For production, it's highly recommended to use a backend proxy to protect your API key.

// Function to generate a chat response using the OpenAI API
export const getOpenAiChatResponse = async (chatHistory, newMessageText) => {
  if (!openai) {
    console.error("OpenAI SDK not initialized. Check API Key.");
    return "Error: OpenAI Service not initialized. Please check your API key setup.";
  }

  // Convert our chat history format to OpenAI's expected format
  // OpenAI expects an array of { role: "user"/"assistant"/"system", content: "..." }
  const messagesForApi = chatHistory.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  // Add the new user message
  messagesForApi.push({ role: 'user', content: newMessageText });

  // Optional: Add a system message for context/persona if desired
  // const systemMessage = { role: "system", content: "You are a helpful EV charging assistant." };
  // const messagesWithSystem = [systemMessage, ...messagesForApi];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or another model like "gpt-4"
      messages: messagesForApi, // Use messagesForApi or messagesWithSystem
      // temperature: 0.7, // Optional: control randomness
      // max_tokens: 150, // Optional: limit response length
    });

    if (completion.choices && completion.choices[0] && completion.choices[0].message) {
      return completion.choices[0].message.content;
    } else {
      console.error('OpenAI API returned an unexpected response structure:', completion);
      return "Sorry, I received an unexpected response from the AI. Please try again.";
    }

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Attempt to parse more detailed error from OpenAI response if available
    if (error.response && error.response.data && error.response.data.error) {
      return `OpenAI API Error: ${error.response.data.error.message}`;
    }
    return "Sorry, I couldn't connect to the OpenAI service. Please try again later.";
  }
}; 