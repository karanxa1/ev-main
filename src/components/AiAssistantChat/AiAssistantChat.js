import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './AiAssistantChat.css';
// import { generateChatResponse as getGeminiResponse } from '../../services/geminiService'; // Old Gemini import
// import { getOpenAiChatResponse } from '../../services/openAiService'; // Old OpenAI import
import { getCohereChatResponse } from '../../services/cohereService'; // New Cohere import
import { websiteInfo } from '../../utils/websiteContent.js'; // Import website content

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

// Function to parse message text and extract button data
const parseMessageForButtons = (text) => {
  console.log('[parseMessageForButtons] INPUT TEXT:', JSON.stringify(text)); // Log 1: Input to parser
  const buttonRegex = /\[BUTTON:([^\]]+?):([^\]]+?):(anchor|route)\]/g;
  let match;
  const parts = [];
  let lastIndex = 0;

  while ((match = buttonRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'button',
      label: match[1],
      targetValue: match[2],
      targetType: match[3],
    });
    lastIndex = buttonRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }
  
  const result = parts.length > 0 ? parts : [{ type: 'text', content: text }];
  console.log('[parseMessageForButtons] PARSED PARTS:', JSON.stringify(result)); // Log 2: Output of parser
  return result;
};

const AiAssistantChat = ({ isOpen, onClose }) => {
  const navigate = useNavigate(); // Initialize navigate
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

  const handleNavigationButtonClick = (targetValue, targetType) => {
    onClose(); // Close chat window before navigating
    if (targetType === 'route') {
      navigate(targetValue);
    } else if (targetType === 'anchor') {
      // Ensure targetValue for anchors includes '#'
      const anchorId = targetValue.startsWith('#') ? targetValue.substring(1) : targetValue;
      const element = document.getElementById(anchorId);
      if (element) {
        // Delay slightly to allow chat window to close
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        console.warn(`Anchor element with ID '${anchorId}' not found.`);
        // Fallback: navigate to home and let user scroll if ID is wrong/missing
        if (targetValue.startsWith('#')) navigate('/'); 
      }
    }
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;
    const userText = currentMessage.trim();
    const newUserMessage = { id: Date.now().toString(), text: userText, sender: 'user' };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setCurrentMessage('');
    setIsAiThinking(true);

    try {
      const historyForApi = updatedMessages.filter(msg => msg.id !== 'init');
      const aiResponseText = await getCohereChatResponse(historyForApi, userText, websiteInfo.documents);
      
      // Log 3: The EXACT text from Cohere
      console.log('[handleSendMessage] RAW AI RESPONSE FROM COHERE:', JSON.stringify(aiResponseText)); 

      const aiMessage = { id: (Date.now() + 1).toString(), text: aiResponseText || "Sorry, I didn't get a response.", sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error processing Cohere response in component:", error);
      const errorMessageText = error.message || "Sorry, I encountered an error. Please try again.";
      const errorMessage = { id: (Date.now() + 1).toString(), text: errorMessageText, sender: 'ai' };
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
        {messages.map(msg => {
          // Log 4: Text being passed to the parser for THIS specific message
          console.log('[Message Rendering] Text for this message:', JSON.stringify(msg.text));
          
          const messageParts = parseMessageForButtons(msg.text);
          
          // Log 5: What parts are being used to render THIS specific message
          console.log('[Message Rendering] Parts for this message:', JSON.stringify(messageParts));

          return (
            <div key={msg.id} className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
              {messageParts.map((part, index) => {
                if (part.type === 'text') {
                  return <span key={index}>{part.content.split('\\n').map((line, i) => <React.Fragment key={i}>{line}{i < part.content.split('\\n').length - 1 && <br />}</React.Fragment>)}</span>;
                }
                if (part.type === 'button') {
                  console.log('[Message Rendering] Rendering a BUTTON for:', JSON.stringify(part)); // Log 6: Confirmation of button rendering attempt
                  return (
                    <button 
                      key={index} 
                      className="chat-nav-button" 
                      onClick={() => handleNavigationButtonClick(part.targetValue, part.targetType)}
                    >
                      {part.label}
                    </button>
                  );
                }
                return null;
              })}
            </div>
          );
        })}
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