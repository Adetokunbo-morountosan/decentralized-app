import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server on the same HTTP server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // Setup WebSocket handlers
  setupWebSocketServer(wss, storage);

  // REST API routes
  app.get('/api/status', async (req, res) => {
    try {
      const activeUsers = await storage.getUsersByActivity(10); // Users active in the last 10 minutes
      res.json({
        status: 'ok',
        activeUserCount: activeUsers.length,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return httpServer;
}
