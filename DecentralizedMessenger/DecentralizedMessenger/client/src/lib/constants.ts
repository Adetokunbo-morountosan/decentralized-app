// App constants

export const APP_NAME = "Tosan Chat";

// User settings
export const USER_STORAGE_KEY = "tosan-chat-user";

// WebSocket constants
export const WS_RECONNECT_INTERVAL = 3000; // 3 seconds

// WebRTC constants
export const MAX_PEER_CONNECTIONS = 50;
export const PEER_TIMEOUT = 30000; // 30 seconds without activity

// UI constants
export const MESSAGE_PAGE_SIZE = 20;
export const DEFAULT_PROFILE_COLORS = [
  "bg-primary",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-blue-500",
];

// Message types
export enum MessageType {
  DIRECT = "direct",
  CHANNEL = "channel",
  GROUP = "group",
}

// WebSocket message types
export enum WebSocketMessageType {
  CONNECT = "connect",
  SIGNAL = "signal",
  PEER_LIST = "peer_list",
  DISCONNECT = "disconnect",
  ERROR = "error",
}
