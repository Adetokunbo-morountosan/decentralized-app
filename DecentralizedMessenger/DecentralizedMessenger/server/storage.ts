import { User, InsertUser, Message, InsertMessage, Connection, InsertConnection } from "@shared/schema";

export interface IStorage {
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUsersByActivity(minutes: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastSeen(id: string): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId1: string, userId2: string, limit: number): Promise<Message[]>;
  
  // Connection operations
  createConnection(connection: InsertConnection): Promise<Connection>;
  getActiveConnections(userId: string): Promise<Connection[]>;
  markConnectionInactive(userId: string, peerId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Message[];
  private connections: Connection[];
  private connectionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = [];
    this.connections = [];
    this.connectionIdCounter = 1;
  }

  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsersByActivity(minutes: number): Promise<User[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return Array.from(this.users.values()).filter(
      (user) => user.lastSeen && new Date(user.lastSeen) >= cutoffTime
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      lastSeen: new Date()
    };
    this.users.set(user.id, newUser);
    return newUser;
  }

  async updateUserLastSeen(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      ...message,
      timestamp: new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string, limit: number): Promise<Message[]> {
    return this.messages
      .filter(
        (msg) =>
          (msg.senderId === userId1 || msg.senderId === userId2)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Connection operations
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const newConnection: Connection = {
      ...connection,
      id: this.connectionIdCounter++,
      established: new Date(),
      active: true
    };
    this.connections.push(newConnection);
    return newConnection;
  }

  async getActiveConnections(userId: string): Promise<Connection[]> {
    return this.connections.filter(
      (conn) => (conn.userId === userId || conn.peerId === userId) && conn.active
    );
  }

  async markConnectionInactive(userId: string, peerId: string): Promise<void> {
    this.connections = this.connections.map(conn => {
      if ((conn.userId === userId && conn.peerId === peerId) || 
          (conn.userId === peerId && conn.peerId === userId)) {
        return { ...conn, active: false };
      }
      return conn;
    });
  }
}

export const storage = new MemStorage();
