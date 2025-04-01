import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for peer-to-peer connections
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
});

// Message model for signaling server
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  hash: text("hash").notNull(),
  verified: boolean("verified").default(false),
});

// Connection model to track peer connections
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  peerId: text("peer_id").notNull().references(() => users.id),
  established: timestamp("established").defaultNow(),
  active: boolean("active").default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertMessageSchema = createInsertSchema(messages);
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;

// WebSocket message types
export enum MessageType {
  CONNECT = "connect",
  SIGNAL = "signal",
  PEER_LIST = "peer_list",
  DISCONNECT = "disconnect",
  ERROR = "error",
}

export interface WebSocketMessage {
  type: MessageType;
  [key: string]: any;
}
