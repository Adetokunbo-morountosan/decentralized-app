import { useState, useEffect, useCallback, useRef } from "react";
import useWebSocket, { ReadyState } from "./useWebSocket";
import PeerManager, { PeerMessage } from "@/lib/webrtc";
import { DEFAULT_PROFILE_COLORS, MessageType, USER_STORAGE_KEY } from "@/lib/constants";
import { MessageType as WebSocketMessageType } from "@shared/schema";
import { Connection } from "@/components/SidePanel";
import { generateHash } from "@/lib/crypto";
import { Message } from "@/components/ChatArea";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  displayName: string;
}

export const useChat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [dataRate, setDataRate] = useState("0 KB/s");
  
  const peerManagerRef = useRef<PeerManager | null>(null);
  const lastTrafficTime = useRef<number>(Date.now());
  const dataRateBytes = useRef<number>(0);

  // Get WebSocket URL
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Initialize peer manager with user info
      if (!peerManagerRef.current) {
        peerManagerRef.current = new PeerManager(
          parsedUser.id,
          parsedUser.displayName
        );
        
        // Set up callbacks
        peerManagerRef.current.setCallbacks(
          (message, verified) => handlePeerMessage(message, verified),
          (peerId, connected) => handlePeerConnection(peerId, connected)
        );
      }
    }
  }, []);

  // WebSocket connection with callbacks
  const {
    sendJsonMessage,
    readyState,
    lastMessage,
    isConnected,
    reconnectAttempt
  } = useWebSocket(wsUrl, {
    onOpen: () => {
      console.log("WebSocket connected");
      setIsNetworkOnline(true);
      
      // Announce ourselves to the signaling server
      if (user) {
        sendJsonMessage({
          type: WebSocketMessageType.CONNECT,
          userId: user.id,
          displayName: user.displayName
        });
      }
    },
    onClose: () => {
      console.log("WebSocket disconnected");
      setIsNetworkOnline(false);
      setIsSynced(false);
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  });

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    if (!peerManagerRef.current || !user) return;
    
    switch(data.type) {
      case WebSocketMessageType.PEER_LIST:
        // When server sends list of connected peers
        if (data.peers && Array.isArray(data.peers)) {
          data.peers.forEach((peer: any) => {
            // Don't connect to ourselves
            if (peer.userId !== user.id) {
              // Initiate connection to this peer
              const peerDisplayName = peer.displayName || `Anonymous:${peer.userId.substring(0, 4)}`;
              
              // Create a new connection in our list if it doesn't exist
              addConnection(peer.userId, peerDisplayName);
              
              // Initiate P2P connection (as initiator)
              if (peerManagerRef.current && !peerManagerRef.current.isConnected(peer.userId)) {
                peerManagerRef.current.createPeer(peer.userId, peerDisplayName, true);
              }
            }
          });
          
          // Set network as synced after receiving peer list
          setIsSynced(true);
        }
        break;
        
      case WebSocketMessageType.SIGNAL:
        // Handle WebRTC signaling data
        if (data.from && data.fromName && data.signal) {
          // Add this peer to our connections list if it doesn't exist
          addConnection(data.from, data.fromName);
          
          // Process the signal
          if (peerManagerRef.current) {
            peerManagerRef.current.receivePeerSignal(data.from, data.fromName, data.signal);
          }
        }
        break;
        
      case WebSocketMessageType.DISCONNECT:
        // Handle peer disconnection
        if (data.userId) {
          if (peerManagerRef.current) {
            peerManagerRef.current.destroyPeer(data.userId);
          }
          
          // Mark connection as inactive
          setConnections(prev => prev.map(conn => 
            conn.id === data.userId ? {...conn, isActive: false} : conn
          ));
        }
        break;
        
      case WebSocketMessageType.ERROR:
        console.error("WebSocket error:", data.message);
        break;
    }
  }, [user]);

  // Handle peer messages
  const handlePeerMessage = useCallback((message: PeerMessage, verified: boolean) => {
    // Update the data rate
    dataRateBytes.current += JSON.stringify(message).length;
    
    // Add this message to our messages state
    const newMessage: Message = {
      id: message.id,
      sender: message.sender,
      content: message.content,
      timestamp: message.timestamp,
      verified,
      sent: false
    };
    
    // Find the connection info to get sender name
    const connection = connections.find(c => c.id === message.sender);
    if (connection) {
      newMessage.senderName = connection.name;
      
      // Update connection with last message info
      updateConnectionLastMessage(
        message.sender, 
        message.content.startsWith('---HASH---') 
          ? 'Sent a hash verification' 
          : message.content
      );
    }
    
    // Add to messages
    setMessages(prev => {
      const existingMessages = prev[message.sender] || [];
      return {
        ...prev,
        [message.sender]: [...existingMessages, newMessage]
      };
    });
  }, [connections]);

  // Handle peer connection/disconnection
  const handlePeerConnection = useCallback((peerId: string, connected: boolean) => {
    setConnections(prev => prev.map(conn => 
      conn.id === peerId ? {...conn, isActive: connected} : conn
    ));
  }, []);

  // Add a new connection to the list
  const addConnection = useCallback((peerId: string, peerName: string) => {
    setConnections(prev => {
      // Check if connection already exists
      if (prev.some(conn => conn.id === peerId)) {
        return prev;
      }
      
      // Pick a random profile color
      const randomColor = DEFAULT_PROFILE_COLORS[
        Math.floor(Math.random() * DEFAULT_PROFILE_COLORS.length)
      ];
      
      return [
        ...prev,
        {
          id: peerId,
          name: peerName,
          isActive: false,
          avatar: randomColor,
          connectionType: MessageType.DIRECT
        }
      ];
    });
  }, []);

  // Update a connection with last message info
  const updateConnectionLastMessage = useCallback((connectionId: string, messageContent: string) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === connectionId) {
        return {
          ...conn,
          lastMessage: messageContent.length > 30
            ? messageContent.substring(0, 27) + '...'
            : messageContent,
          lastMessageTime: format(new Date(), 'p')
        };
      }
      return conn;
    }));
  }, []);

  // Send a message to the active chat
  const sendMessage = useCallback(async (content: string) => {
    if (!peerManagerRef.current || !activeChatId) return false;
    
    // Generate message ID
    const messageId = crypto.randomUUID();
    
    try {
      // Send message through the peer connection
      const sent = await peerManagerRef.current.sendMessage(activeChatId, content);
      
      if (sent) {
        // Update data rate
        dataRateBytes.current += content.length;
        
        // Save message in our state too
        const newMessage: Message = {
          id: messageId,
          sender: user?.id || '',
          content,
          timestamp: Date.now(),
          verified: true,
          sent: true
        };
        
        setMessages(prev => {
          const existingMessages = prev[activeChatId] || [];
          return {
            ...prev,
            [activeChatId]: [...existingMessages, newMessage]
          };
        });
        
        // Update connection with last message info
        updateConnectionLastMessage(
          activeChatId, 
          content.startsWith('---HASH---') 
            ? 'Sent a hash verification' 
            : content
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [activeChatId, user, updateConnectionLastMessage]);

  // Set the active chat
  const setActiveChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    // Initialize messages array for this chat if it doesn't exist
    setMessages(prev => {
      if (!prev[chatId]) {
        return { ...prev, [chatId]: [] };
      }
      return prev;
    });
  }, []);

  // Get active chat messages
  const getActiveChatMessages = useCallback(() => {
    if (!activeChatId) return [];
    return messages[activeChatId] || [];
  }, [activeChatId, messages]);

  // Get active chat connection
  const getActiveChat = useCallback(() => {
    if (!activeChatId) return null;
    return connections.find(conn => conn.id === activeChatId) || null;
  }, [activeChatId, connections]);

  // Create a new connection dialog
  const handleNewConnection = useCallback(() => {
    // This would typically open a dialog to enter connection details
    // For now, we'll just rely on the automatic peer discovery
    console.log("New connection requested");
  }, []);

  // Update data rate calculation every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTrafficTime.current) / 1000; // seconds
      
      if (elapsed > 0) {
        const bytesPerSecond = dataRateBytes.current / elapsed;
        
        // Format as KB/s
        const kbps = (bytesPerSecond / 1024).toFixed(1);
        setDataRate(`${kbps} KB/s`);
        
        // Reset counters
        dataRateBytes.current = 0;
        lastTrafficTime.current = now;
      }
      
      // Update peer count from peer manager
      const connectedPeerCount = peerManagerRef.current?.getPeers().filter(p => p.connected).length || 0;
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    user,
    connections,
    isNetworkOnline,
    isSynced,
    dataRate,
    wsReadyState: readyState,
    wsConnected: isConnected,
    peerCount: peerManagerRef.current?.getPeers().filter(p => p.connected).length || 0,
    activeChatId,
    activeChatMessages: getActiveChatMessages(),
    activeChat: getActiveChat(),
    isInfoPanelOpen,
    sendMessage,
    setActiveChat,
    toggleInfoPanel: () => setIsInfoPanelOpen(!isInfoPanelOpen),
    closeInfoPanel: () => setIsInfoPanelOpen(false),
    handleNewConnection
  };
};
