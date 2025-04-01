import { useState, useRef, useEffect } from "react";
import { generateHash } from "@/lib/crypto";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const generateHashAndCopy = async () => {
    if (!message.trim()) return;
    
    try {
      const hash = await generateHash(message.trim());
      
      // Create message with hash to send
      const hashMessage = `---HASH---${message.trim()}|${hash}`;
      onSendMessage(hashMessage);
      setMessage("");
      
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Error generating hash:", error);
    }
  };

  return (
    <div className="flex items-end space-x-2">
      <div className={`flex-1 bg-gray-700 rounded-lg px-4 py-3 ${disabled ? 'opacity-70' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs text-secondary flex items-center">
            <span className="material-icons text-xs mr-1">lock</span>
            End-to-end encrypted
          </span>
          <span className="text-xs text-secondary flex items-center">
            <span className="material-icons text-xs mr-1">verified</span>
            Hash verification enabled
          </span>
        </div>
        <textarea 
          ref={textareaRef}
          className="w-full bg-transparent text-sm resize-none focus:outline-none" 
          placeholder={disabled ? "Connection offline" : "Type a message..."} 
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        ></textarea>
      </div>
      
      <div className="flex space-x-2">
        <button 
          className={`p-3 rounded-full bg-gray-700 hover:bg-gray-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={generateHashAndCopy}
          disabled={disabled || !message.trim()}
          title="Generate Hash"
        >
          <span className="material-icons text-gray-300">vpn_key</span>
        </button>
        <button 
          className={`p-3 rounded-full bg-primary ${!disabled && message.trim() ? 'hover:bg-blue-600' : 'opacity-50 cursor-not-allowed'}`}
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
        >
          <span className="material-icons text-white">send</span>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
