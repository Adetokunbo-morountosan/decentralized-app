import { WebSocketServer, WebSocket } from "ws";
import { IStorage } from "./storage";
import { MessageType } from "@shared/schema";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  displayName?: string;
  isAlive: boolean;
}

export function setupWebSocketServer(wss: WebSocketServer, storage: IStorage) {
  // Map to keep track of connected clients
  const clients = new Map<string, ExtendedWebSocket>();

  // Handle new connections
  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('New WebSocket connection');
    
    // Set initial connection state
    ws.isAlive = true;

    // Handle pong messages
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle client messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case MessageType.CONNECT:
            // A user is registering their presence
            if (data.userId && data.displayName) {
              ws.userId = data.userId;
              ws.displayName = data.displayName;
              
              // Store in clients map
              clients.set(data.userId, ws);
              
              // Create or update user in storage
              const existingUser = await storage.getUserById(data.userId);
              
              if (existingUser) {
                await storage.updateUserLastSeen(data.userId);
              } else {
                await storage.createUser({
                  id: data.userId,
                  username: data.displayName.split(':')[0],
                  displayName: data.displayName
                });
              }
              
              // Send current peer list to the new client
              const activeUsers = await storage.getUsersByActivity(10);
              const peers = activeUsers
                .filter(user => user.id !== data.userId) // Don't include the current user
                .map(user => ({
                  userId: user.id,
                  displayName: user.displayName
                }));
                
              ws.send(JSON.stringify({
                type: MessageType.PEER_LIST,
                peers
              }));
              
              // Broadcast to all clients that a new user has connected
              broadcastUserConnected(data.userId, data.displayName);
            }
            break;
            
          case MessageType.SIGNAL:
            // Forward WebRTC signaling data to the specified peer
            if (data.to && data.from && data.signal) {
              const targetWs = clients.get(data.to);
              
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({
                  type: MessageType.SIGNAL,
                  from: data.from,
                  fromName: data.fromName || data.from,
                  signal: data.signal
                }));
              }
            }
            break;
            
          default:
            console.log(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (ws.userId) {
        console.log(`User disconnected: ${ws.userId}`);
        
        // Remove from clients map
        clients.delete(ws.userId);
        
        // Broadcast disconnect to all clients
        broadcastUserDisconnected(ws.userId);
      }
    });
  });

  // Broadcast to all connected clients that a user has connected
  function broadcastUserConnected(userId: string, displayName: string) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
        client.send(JSON.stringify({
          type: MessageType.PEER_LIST,
          peers: [{ userId, displayName }]
        }));
      }
    });
  }

  // Broadcast to all connected clients that a user has disconnected
  function broadcastUserDisconnected(userId: string) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: MessageType.DISCONNECT,
          userId
        }));
      }
    });
  }

  // Ping all clients periodically to check for dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (!ws.isAlive) {
        // If not responsive, terminate connection
        if (ws.userId) {
          clients.delete(ws.userId);
          broadcastUserDisconnected(ws.userId);
        }
        return ws.terminate();
      }
      
      // Mark as not alive, expect pong to set it back to alive
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('WebSocket server initialized');
}
