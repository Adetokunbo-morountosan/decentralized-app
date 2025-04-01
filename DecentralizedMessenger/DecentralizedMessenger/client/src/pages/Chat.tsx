import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import SidePanel from "@/components/SidePanel";
import ChatArea from "@/components/ChatArea";
import InfoPanel from "@/components/InfoPanel";
import NetworkStatusBar from "@/components/NetworkStatusBar";
import { useChat } from "@/hooks/useChat";
import { USER_STORAGE_KEY } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const {
    user,
    connections,
    isNetworkOnline,
    isSynced,
    dataRate,
    peerCount,
    activeChatId,
    activeChatMessages,
    activeChat,
    isInfoPanelOpen,
    sendMessage,
    setActiveChat,
    toggleInfoPanel,
    closeInfoPanel,
    handleNewConnection
  } = useChat();

  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotConnectedDialog, setShowNotConnectedDialog] = useState(false);

  // Check if user is set up
  useEffect(() => {
    if (!localStorage.getItem(USER_STORAGE_KEY)) {
      window.location.href = "/";
    }
  }, []);

  // If user is not connected, show dialog
  useEffect(() => {
    if (!isNetworkOnline && connections.length === 0) {
      // Only show after a delay to avoid showing immediately on load
      const timer = setTimeout(() => {
        setShowNotConnectedDialog(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowNotConnectedDialog(false);
    }
  }, [isNetworkOnline, connections.length]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-darkBg">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-darkBg text-lightText h-screen flex flex-col">
      <AppHeader 
        userId={user.id} 
        displayName={user.displayName} 
        connectedPeers={peerCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Dialog */}
        <Dialog open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen} modal>
          <DialogContent className="bg-mediumBg text-white border-gray-700 p-0 h-[80vh] max-w-[90vw] sm:max-w-[400px]">
            <SidePanel
              connections={connections}
              activeChat={activeChatId}
              onSelectChat={(chatId) => {
                setActiveChat(chatId);
                setMobileSidebarOpen(false);
              }}
              onNewConnection={handleNewConnection}
            />
          </DialogContent>
        </Dialog>

        {/* Regular layout for larger screens */}
        <SidePanel
          connections={connections}
          activeChat={activeChatId}
          onSelectChat={setActiveChat}
          onNewConnection={handleNewConnection}
        />

        <ChatArea
          activeChat={activeChat}
          messages={activeChatMessages}
          onSendMessage={sendMessage}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />

        {isInfoPanelOpen && (
          <InfoPanel 
            activeChat={activeChat} 
            onClose={closeInfoPanel} 
          />
        )}
      </div>

      <NetworkStatusBar
        isOnline={isNetworkOnline}
        isSynced={isSynced}
        peerCount={peerCount}
        dataRate={dataRate}
      />

      {/* Not connected dialog */}
      <Dialog open={showNotConnectedDialog} onOpenChange={setShowNotConnectedDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Network Status</DialogTitle>
            <DialogDescription className="text-gray-300">
              Waiting for peer connections...
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${isNetworkOnline ? 'bg-secondary' : 'bg-red-500'} animate-pulse`}></div>
              <p>{isNetworkOnline ? 'Connected to signaling server' : 'Connecting to signaling server...'}</p>
            </div>
            
            <p className="text-sm text-gray-300 text-center">
              Tosan Chat is looking for other peers on the network. This might take a moment.
              <br /><br />
              If no peers appear, you can share your Tosan Chat URL with others to connect directly.
            </p>
          </div>
          
          <Button variant="secondary" onClick={() => setShowNotConnectedDialog(false)}>
            Continue Anyway
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
