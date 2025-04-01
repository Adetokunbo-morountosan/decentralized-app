import { useState } from "react";
import { MessageType } from "@/lib/constants";
import { useChat } from "@/hooks/useChat";

export interface Connection {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  isActive: boolean;
  verified?: boolean;
  avatar: string;
  connectionType: MessageType;
  unreadCount?: number;
}

interface SidePanelProps {
  connections: Connection[];
  activeChat: string | null;
  onSelectChat: (chatId: string) => void;
  onNewConnection: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  connections,
  activeChat,
  onSelectChat,
  onNewConnection,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MessageType>(MessageType.DIRECT);
  
  // Filter connections based on search and active tab
  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = connection.connectionType === activeTab;
    return matchesSearch && matchesTab;
  });

  // Get initials from connection name
  const getInitials = (name: string): string => {
    const parts = name.split(':')[0]; // Remove hash part
    return parts.charAt(0).toUpperCase();
  };

  return (
    <aside className="w-64 border-r border-gray-700 flex flex-col bg-mediumBg hidden lg:flex">
      <div className="p-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-icons text-gray-400 text-sm">search</span>
          </span>
          <input 
            type="text" 
            className="w-full py-2 pl-10 pr-4 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" 
            placeholder="Search connections..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Connection Types */}
      <div className="px-4 py-2">
        <div className="flex space-x-2 mb-4">
          <button 
            className={`px-3 py-1 text-xs rounded-full ${activeTab === MessageType.DIRECT ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'}`}
            onClick={() => setActiveTab(MessageType.DIRECT)}
          >
            Direct
          </button>
          <button 
            className={`px-3 py-1 text-xs rounded-full ${activeTab === MessageType.CHANNEL ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'}`}
            onClick={() => setActiveTab(MessageType.CHANNEL)}
          >
            Channels
          </button>
          <button 
            className={`px-3 py-1 text-xs rounded-full ${activeTab === MessageType.GROUP ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'}`}
            onClick={() => setActiveTab(MessageType.GROUP)}
          >
            Groups
          </button>
        </div>
      </div>
      
      {/* Connection List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
        {filteredConnections.map((connection) => (
          <div 
            key={connection.id}
            className={`p-2 rounded-lg hover:bg-gray-700 cursor-pointer mb-1 flex items-center space-x-3 ${activeChat === connection.id ? 'bg-gray-700' : ''}`}
            onClick={() => onSelectChat(connection.id)}
          >
            <div className={`h-10 w-10 rounded-full ${connection.avatar} flex items-center justify-center`}>
              <span className="font-medium">{getInitials(connection.name)}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{connection.name}</span>
                {connection.lastMessageTime && (
                  <span className="text-xs text-gray-400">{connection.lastMessageTime}</span>
                )}
              </div>
              <div className="flex items-center">
                {connection.verified ? (
                  <span className="material-icons text-xs text-secondary mr-1">check_circle</span>
                ) : null}
                <span className="text-xs text-gray-300 truncate">
                  {connection.lastMessage || (connection.unreadCount ? `${connection.unreadCount} new messages` : 'No messages yet')}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {filteredConnections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <span className="material-icons mb-2">search_off</span>
            <p className="text-sm">No connections found</p>
          </div>
        )}
      </div>
      
      {/* New Connection */}
      <div className="p-3 border-t border-gray-700">
        <button 
          className="w-full py-2 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-medium flex items-center justify-center"
          onClick={onNewConnection}
        >
          <span className="material-icons text-sm mr-2">add</span>
          New Connection
        </button>
      </div>
    </aside>
  );
};

export default SidePanel;
