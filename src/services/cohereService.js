const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

// Function to transform messages from AiAssistantChat format to Cohere format
const transformMessagesForCohere = (messages) => {
  return messages.map(msg => {
    if (msg.sender === 'user') {
      return { role: 'USER', message: msg.text };
    } else if (msg.sender === 'ai') {
      return { role: 'CHATBOT', message: msg.text };
    }
    return null; // Should not happen with current structure
  }).filter(Boolean); // Remove any nulls
};

export const getCohereChatResponse = async (chatHistory, currentUserMessage, documents = []) => {
  if (!COHERE_API_KEY) {
    console.error('Cohere API key is missing. Please set REACT_APP_COHERE_API_KEY environment variable.');
    throw new Error('Cohere API key is not configured.');
  }

  // Transform the existing chat history (excluding the initial greeting if needed)
  // The AiAssistantChat already filters out the 'init' message before sending to the service.
  const cohereChatHistory = transformMessagesForCohere(chatHistory);

  const preamble = 
    "You are an expert assistant for the EV Charging Network website. " +
    "When you mention a specific section or page of the website that the user might want to visit, " +
    "and that section is included in the provided documents with a targetType and targetValue, " +
    "suggest navigating there by appending a special button marker to your sentence. " +
    "The marker format is [BUTTON:Button Label:targetValue:targetType]. " +
    "For example: 'You can find details on our services on the [About Page](#about). [BUTTON:Visit About Us:#about:anchor]' or " +
    "'To create an account, please visit the [Sign Up page](/signup). [BUTTON:Go to Sign Up:/signup:route]'. " +
    "Only include a button marker if the information is directly from the provided documents and has a navigation target. " +
    "Ensure the button label is concise and action-oriented.";

  try {
    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`,
      },
      body: JSON.stringify({
        chat_history: cohereChatHistory,
        message: currentUserMessage,
        documents: documents,
        preamble: preamble,
        // You can add other parameters here, e.g., connectors for web search
        // connectors: [{ "id": "web-search" }]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Cohere API Error:', errorBody);
      throw new Error(errorBody.message || `Cohere API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Cohere's chat response typically has the AI's reply in `data.text`
    if (data.text) {
      return data.text;
    } else {
      console.warn('Cohere response did not contain text:', data);
      return 'Sorry, I could not get a proper response from Cohere.';
    }

  } catch (error) {
    console.error('Error calling Cohere API:', error);
    throw error; // Re-throw to be caught by AiAssistantChat component
  }
}; 