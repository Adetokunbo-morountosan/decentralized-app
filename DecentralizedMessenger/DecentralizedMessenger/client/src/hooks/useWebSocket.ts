import { useState, useEffect, useCallback } from "react";
import { WS_RECONNECT_INTERVAL } from "@/lib/constants";

export enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3,
}

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectOnClose?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.Closed);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectOnClose = true,
    reconnectInterval = WS_RECONNECT_INTERVAL,
  } = options;

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = (event) => {
      setReadyState(ReadyState.Open);
      setReconnectAttempt(0);
      if (onOpen) onOpen(event);
    };

    ws.onmessage = (event) => {
      setLastMessage(event);
      if (onMessage) onMessage(event);
    };

    ws.onclose = (event) => {
      setReadyState(ReadyState.Closed);
      setSocket(null);
      if (onClose) onClose(event);
      
      if (reconnectOnClose) {
        const nextReconnectAttempt = reconnectAttempt + 1;
        setReconnectAttempt(nextReconnectAttempt);
        
        // Exponential backoff with a maximum delay
        const delay = Math.min(
          reconnectInterval * Math.pow(1.5, nextReconnectAttempt - 1),
          30000 // 30 second max
        );
        
        setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = (event) => {
      if (onError) onError(event);
    };

    setSocket(ws);
    setReadyState(ws.readyState);
    
    // Store socket in window for global access
    window.socket = ws;
    
    return ws;
  }, [url, onOpen, onMessage, onClose, onError, reconnectOnClose, reconnectInterval, reconnectAttempt]);

  // Initial connection
  useEffect(() => {
    const ws = connect();
    
    return () => {
      if (ws.readyState === ReadyState.Open) {
        ws.close();
      }
    };
  }, [connect]);

  // Send message function
  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socket?.readyState === ReadyState.Open) {
      socket.send(data);
      return true;
    }
    return false;
  }, [socket]);

  // Send JSON message function
  const sendJsonMessage = useCallback((data: any) => {
    return sendMessage(JSON.stringify(data));
  }, [sendMessage]);

  return {
    socket,
    readyState,
    lastMessage,
    sendMessage,
    sendJsonMessage,
    reconnectAttempt,
    isConnected: readyState === ReadyState.Open,
  };
}

export default useWebSocket;
