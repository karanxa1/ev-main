import React, { useState, useEffect, useRef } from 'react';
import './AiAssistantChat.css';
// import { generateChatResponse as getGeminiResponse } from '../../services/geminiService'; // Old Gemini import
import { getOpenAiChatResponse } from '../../services/openAiService'; // New OpenAI import

// Placeholder for a Send Icon SVG
const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

// Simple typing indicator component
const TypingIndicator = () => (
  <div className="message ai-message typing-indicator">
    <p><span>.</span><span>.</span><span>.</span></p>
  </div>
);

const AiAssistantChat = ({ isOpen, onClose }) => {
  const [animationClass, setAnimationClass] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 'init', text: 'Hello! I am your EV Charging Assistant. How can I help you today?', sender: 'ai' }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatBodyRef = useRef(null);

  // console.log('[AiAssistantChat] Rendering. isOpen prop:', isOpen, 'current animationClass:', animationClass);

  useEffect(() => {
    // console.log('[AiAssistantChat] useEffect triggered. isOpen:', isOpen);
    if (isOpen) {
      // When isOpen becomes true, we want to trigger the opening animation.
      // First, ensure the component is in the DOM with initial styles (opacity 0),
      // then add the 'open' class to trigger the transition.
      // A small timeout helps ensure the transition is applied correctly after mount.
      const timer = setTimeout(() => {
        // console.log('[AiAssistantChat] Setting animationClass to open');
        setAnimationClass('open');
        // Focus input when chat opens
        setTimeout(() => {
          const inputElement = document.querySelector('.ai-chat-footer input[type="text"]');
          if (inputElement) {
            inputElement.focus();
          }
        }, 100); // After animation
      }, 10); // Small delay for CSS transition to pick up
      return () => clearTimeout(timer);
    } else {
      // If we wanted a closing animation before unmounting, we'd handle it here.
      // For now, HomePage unmounts it, so we just reset.
      // console.log('[AiAssistantChat] Setting animationClass to empty (isOpen is false)');
      setAnimationClass('');
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isAiThinking]); // Scroll when new messages or typing indicator appears

  const handleInputChange = (event) => {
    setCurrentMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;

    const userText = currentMessage.trim();
    const newUserMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user'
    };

    // Keep previous messages, add new user message
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setCurrentMessage('');
    setIsAiThinking(true);

    try {
      // Prepare chat history for the API - OpenAI format expects just the text.
      // The openAiService will reformat it to {role, content}
      const historyForApi = updatedMessages.filter(msg => msg.id !== 'init'); // Exclude initial system message from history sent to API for this call
      
      // Use the new OpenAI service function
      const aiResponseText = await getOpenAiChatResponse(historyForApi, userText);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText || "Sorry, I didn't get a response.", // Fallback for empty response
        sender: 'ai'
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error processing OpenAI response in component:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: error.message || "Sorry, I encountered an error. Please try again.",
        sender: 'ai'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsAiThinking(false);
    }
  };
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in input
      handleSendMessage();
    }
  };

  // HomePage already ensures this component is not rendered if isOpen is false.
  // So, if we are here, isOpen is true.
  if (!isOpen && !animationClass) {
    // If it's not supposed to be open and not in a closing animation state (if we had one)
    // HomePage handles unmounting, so this path is mainly for clarity during render.
    // console.log('[AiAssistantChat] Not rendering content because isOpen is false and no closing animation state.');
    return null; // Should not be strictly necessary due to HomePage logic but good for safety.
  }

  return (
    <div className={`ai-chat-window ${animationClass}`}>
      <div className="ai-chat-header">
        <h3>AI Assistant</h3>
        <button onClick={onClose} className="ai-chat-close-btn" aria-label="Close chat">
          &times; {/* Simple 'X' for close */}
        </button>
      </div>
      <div className="ai-chat-body" ref={chatBodyRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
            <p>{msg.text}</p> {/* Wrap text in <p> for consistent styling if needed */}
          </div>
        ))}
        {isAiThinking && <TypingIndicator />} {/* Show typing indicator */}
      </div>
      <div className="ai-chat-footer">
        <input 
          type="text" 
          placeholder="Type your message..." 
          value={currentMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress} // Handle Enter key press
          disabled={isAiThinking} // Disable input while AI is thinking
        />
        <button 
          onClick={handleSendMessage} 
          className="send-btn" 
          aria-label="Send message"
          disabled={isAiThinking || currentMessage.trim() === ''} // Disable button while thinking or if input is empty
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default AiAssistantChat; 