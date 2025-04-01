interface NetworkStatusBarProps {
  isOnline: boolean;
  isSynced: boolean;
  peerCount: number;
  dataRate: string;
}

const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  isOnline,
  isSynced,
  peerCount,
  dataRate,
}) => {
  return (
    <div className="bg-gray-800 py-2 px-4 flex items-center justify-between text-xs text-gray-300 border-t border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-secondary' : 'bg-red-500'} mr-2`}></span>
          <span>Network: {isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="flex items-center">
          <span className="material-icons text-xs mr-1">sync</span>
          <span>{isSynced ? 'Synced' : 'Syncing...'}</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className="material-icons text-xs mr-1">people</span>
          <span>{peerCount} {peerCount === 1 ? 'Peer' : 'Peers'}</span>
        </div>
        <div className="flex items-center">
          <span className="material-icons text-xs mr-1">trending_up</span>
          <span>{dataRate}</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatusBar;
