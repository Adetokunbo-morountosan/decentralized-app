import { useEffect, useRef, useState } from "react";
import MessageInput from "./MessageInput";
import { Connection } from "./SidePanel";
import { formatDistanceToNow } from "date-fns";

export interface Message {
  id: string;
  sender: string;
  senderName?: string;
  content: string;
  timestamp: number;
  verified: boolean;
  sent: boolean;
}

interface ChatAreaProps {
  activeChat: Connection | null;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onOpenSidebar: () => void;
  isTyping?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  activeChat,
  messages,
  onSendMessage,
  onOpenSidebar,
  isTyping = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format timestamp to human readable time
  const formatMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get initials from connection name
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.split(':')[0]; // Remove hash part
    return parts.charAt(0).toUpperCase();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const formatRelativeTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Header */}
      {activeChat ? (
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-mediumBg">
          <div className="flex items-center space-x-3">
            <button className="lg:hidden" onClick={onOpenSidebar}>
              <span className="material-icons text-gray-400">menu</span>
            </button>
            <div className={`h-10 w-10 rounded-full ${activeChat.avatar} flex items-center justify-center`}>
              <span className="font-medium">{getInitials(activeChat.name)}</span>
            </div>
            <div>
              <h2 className="font-semibold">{activeChat.name}</h2>
              <div className="flex items-center">
                <span className={`h-2 w-2 rounded-full ${activeChat.isActive ? 'bg-secondary' : 'bg-gray-500'} mr-2`}></span>
                <span className="text-xs text-gray-300">
                  {activeChat.isActive ? 'Online • P2P Secured' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-full hover:bg-gray-700">
              <span className="material-icons text-gray-400">more_vert</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-mediumBg">
          <div className="flex items-center space-x-3">
            <button className="lg:hidden" onClick={onOpenSidebar}>
              <span className="material-icons text-gray-400">menu</span>
            </button>
            <h2 className="font-semibold">No chat selected</h2>
          </div>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" id="messages-container">
        {activeChat ? (
          <>
            {/* System Message */}
            <div className="flex justify-center mb-4">
              <div className="bg-gray-700 text-gray-300 rounded-lg px-4 py-2 text-xs">
                Connected using P2P protocol • All messages are verified with SHA-256
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <span className="material-icons mb-2">chat</span>
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex items-end ${message.sent ? 'justify-end' : ''} mb-4`}>
                  <div className={`flex flex-col ${message.sent ? 'items-end' : 'items-start'}`}>
                    <div className={`${message.sent ? 'bg-primary' : 'bg-mediumBg'} rounded-lg p-3 message-bubble`}>
                      {/* Special case for hash message display */}
                      {message.content.startsWith('---HASH---') ? (
                        <>
                          <p className="text-sm">
                            {message.content.substring(10).split('|')[0]}
                          </p>
                          <div className="mt-2 bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto">
                            {message.content.substring(10).split('|')[1]}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    <div className="mt-1 flex items-center">
                      {!message.sent && (
                        <span className="text-xs text-gray-400 mr-2">
                          {message.senderName || 'Unknown'} • {formatMessageTime(message.timestamp)}
                        </span>
                      )}
                      
                      {!message.sent && message.verified && (
                        <div className="flex items-center text-secondary">
                          <span className="material-icons text-xs mr-1">verified</span>
                          <span className="text-xs">Hash verified</span>
                        </div>
                      )}
                      
                      {message.sent && (
                        <>
                          <span className="text-xs text-gray-400">{formatMessageTime(message.timestamp)}</span>
                          <span className="material-icons text-xs text-gray-400 ml-1">done_all</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end space-x-2">
                <div className="bg-mediumBg rounded-lg p-3 message-bubble animate-pulse">
                  <span className="text-sm typing-indicator">
                    {activeChat.name.split(':')[0]} is typing
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="material-icons text-6xl mb-4">chat_bubble_outline</span>
            <h3 className="text-xl font-medium mb-2">Welcome to Tosan Chat</h3>
            <p className="text-sm text-center max-w-md">
              Select a connection from the sidebar or create a new one to start chatting securely with P2P encryption
            </p>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      {activeChat && (
        <div className="border-t border-gray-700 p-4 bg-mediumBg">
          <MessageInput onSendMessage={onSendMessage} disabled={!activeChat.isActive} />
        </div>
      )}
    </main>
  );
};

export default ChatArea;
