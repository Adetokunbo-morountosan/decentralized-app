import { useState } from "react";
import UserProfile from "./UserProfile";

interface AppHeaderProps {
  userId: string;
  displayName: string;
  connectedPeers: number;
}

const AppHeader: React.FC<AppHeaderProps> = ({ userId, displayName, connectedPeers }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <header className="bg-darkBg border-b border-gray-700 py-3 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="material-icons text-primary">hub</span>
        <h1 className="text-xl font-semibold">Tosan Chat</h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-secondary mr-2"></span>
          <span className="text-xs text-secondary">
            Connected to {connectedPeers} {connectedPeers === 1 ? 'peer' : 'peers'}
          </span>
        </div>
        
        {/* User Profile */}
        <UserProfile userId={userId} displayName={displayName} />
      </div>
    </header>
  );
};

export default AppHeader;
