import { useState } from "react";
import { Connection } from "./SidePanel";
import { verifyHash } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";

interface InfoPanelProps {
  activeChat: Connection | null;
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ activeChat, onClose }) => {
  const [messageContent, setMessageContent] = useState("");
  const [hashValue, setHashValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  // Get initials from connection name
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    const parts = name.split(':')[0]; // Remove hash part
    return parts.charAt(0).toUpperCase();
  };

  const handleVerifyMessage = async () => {
    if (!messageContent || !hashValue) {
      toast({
        title: "Validation Error",
        description: "Both message content and hash value are required",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const isValid = await verifyHash(messageContent, hashValue);
      if (isValid) {
        toast({
          title: "Verification Successful",
          description: "The message hash is valid and verified",
          variant: "default",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "The hash doesn't match the message content",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Extract node ID from name (assuming format name:hash)
  const getNodeId = (name: string): string => {
    const hash = name.split(':')[1] || '';
    // Repeat the hash to make it look like a longer ID
    return hash.repeat(16).substring(0, 64);
  };

  if (!activeChat) {
    return null;
  }

  return (
    <aside className="w-80 border-l border-gray-700 bg-mediumBg hidden xl:block">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Connection Info</h3>
        <button className="p-1 rounded-full hover:bg-gray-700" onClick={onClose}>
          <span className="material-icons text-gray-400">close</span>
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col items-center mb-6">
          <div className={`h-20 w-20 rounded-full ${activeChat.avatar} flex items-center justify-center mb-3`}>
            <span className="font-bold text-2xl">{getInitials(activeChat.name)}</span>
          </div>
          <h2 className="text-lg font-semibold mb-1">{activeChat.name}</h2>
          <div className="flex items-center text-sm text-gray-300">
            <span className="material-icons text-xs mr-1">wifi</span>
            <span>Direct P2P Connection</span>
          </div>
        </div>
        
        {/* Connection Details */}
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <span className="material-icons text-primary text-sm mr-2">security</span>
              Security Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Encryption</span>
                <span>End-to-end</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hash Algorithm</span>
                <span>SHA-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connection Type</span>
                <span>Direct P2P</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="flex items-center">
                  {activeChat.isActive ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-secondary mr-1"></span>
                      Active
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-gray-500 mr-1"></span>
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {/* Public Key */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <span className="material-icons text-primary text-sm mr-2">vpn_key</span>
              Public Node ID
            </h4>
            <div className="bg-gray-800 p-3 rounded text-xs font-mono break-all">
              {getNodeId(activeChat.name)}
            </div>
          </div>
          
          {/* Message Verification */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <span className="material-icons text-primary text-sm mr-2">verified</span>
              Message Verification
            </h4>
            <p className="text-xs text-gray-300 mb-3">
              Verify message integrity by comparing hash values
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Message Content
                </label>
                <textarea 
                  className="w-full bg-gray-800 rounded p-2 text-xs" 
                  rows={3} 
                  placeholder="Paste message to verify"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                ></textarea>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Hash Value
                </label>
                <input 
                  type="text" 
                  className="w-full bg-gray-800 rounded p-2 text-xs" 
                  placeholder="Enter hash to compare"
                  value={hashValue}
                  onChange={(e) => setHashValue(e.target.value)}
                />
              </div>
              <button 
                className="w-full py-2 rounded bg-primary hover:bg-blue-600 text-white text-xs font-medium"
                onClick={handleVerifyMessage}
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Verify Message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default InfoPanel;
