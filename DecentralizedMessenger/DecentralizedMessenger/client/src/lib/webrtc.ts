import SimplePeer from 'simple-peer';
import { generateHash } from './crypto';
// Import types directly 
import type { Instance as PeerInstance, SignalData } from 'simple-peer';

export interface PeerMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  hash: string;
}

export interface PeerConnection {
  peerId: string;
  peerName: string;
  instance: PeerInstance;
  connected: boolean;
  lastActivity: number;
}

export type MessageCallback = (message: PeerMessage, verified: boolean) => void;
export type ConnectionCallback = (peerId: string, connected: boolean) => void;

class PeerManager {
  private peers: Map<string, PeerConnection> = new Map();
  private userId: string;
  private displayName: string;
  private messageCallback: MessageCallback | null = null;
  private connectionCallback: ConnectionCallback | null = null;

  constructor(userId: string, displayName: string) {
    this.userId = userId;
    this.displayName = displayName;
  }

  public setCallbacks(
    messageCallback: MessageCallback,
    connectionCallback: ConnectionCallback
  ) {
    this.messageCallback = messageCallback;
    this.connectionCallback = connectionCallback;
  }

  public createPeer(peerId: string, peerName: string, initiator: boolean): PeerInstance {
    if (this.peers.has(peerId)) {
      // If peer connection already exists, destroy it first
      this.destroyPeer(peerId);
    }

    const peer = new SimplePeer({
      initiator,
      trickle: false,
    });

    // Setup peer event handlers
    peer.on('signal', (data: SignalData) => {
      this.handleSignal(peerId, data);
    });

    peer.on('connect', () => {
      console.log(`Connected to peer ${peerId}`);
      this.peers.set(peerId, {
        ...this.peers.get(peerId)!,
        connected: true,
        lastActivity: Date.now(),
      });
      
      if (this.connectionCallback) {
        this.connectionCallback(peerId, true);
      }
    });

    peer.on('data', async (data: Uint8Array | ArrayBuffer) => {
      try {
        const dataString = new TextDecoder().decode(data instanceof ArrayBuffer ? data : new Uint8Array(data));
        const message = JSON.parse(dataString) as PeerMessage;
        // Since generateHash is async, we need to await it
        const calculatedHash = await generateHash(message.content);
        const verified = calculatedHash === message.hash;

        if (this.messageCallback) {
          this.messageCallback(message, verified);
        }

        // Update last activity
        this.updatePeerActivity(peerId);
      } catch (err: any) {
        console.error('Error parsing message:', err);
      }
    });

    peer.on('close', () => {
      console.log(`Connection closed with peer ${peerId}`);
      if (this.connectionCallback) {
        this.connectionCallback(peerId, false);
      }
      this.peers.delete(peerId);
    });

    peer.on('error', (err: Error) => {
      console.error(`Error with peer ${peerId}:`, err);
    });

    this.peers.set(peerId, {
      peerId,
      peerName,
      instance: peer,
      connected: false,
      lastActivity: Date.now(),
    });

    return peer;
  }

  public destroyPeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.instance.destroy();
      this.peers.delete(peerId);
    }
  }

  public receivePeerSignal(peerId: string, peerName: string, signal: SignalData) {
    let peer = this.peers.get(peerId)?.instance;
    
    if (!peer) {
      // If we don't have this peer yet, create it (not as initiator)
      peer = this.createPeer(peerId, peerName, false);
    }
    
    // Process the received signal
    peer.signal(signal);
  }

  private handleSignal(peerId: string, signal: SignalData) {
    // This would typically send the signal through the signaling server
    // In a real app, we would emit this to our WebSocket server
    console.log(`Signal generated for peer ${peerId}:`, signal);
    
    // The signaling server implementation will forward this to the appropriate peer
    if (window.socket && window.socket.readyState === WebSocket.OPEN) {
      window.socket.send(JSON.stringify({
        type: 'signal',
        to: peerId,
        from: this.userId,
        fromName: this.displayName,
        signal
      }));
    } else {
      console.error('WebSocket not available or not connected to send signal');
    }
  }

  public async sendMessage(peerId: string, content: string): Promise<boolean> {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connected) {
      return false;
    }

    try {
      // Await the hash generation
      const hash = await generateHash(content);
      const message: PeerMessage = {
        id: crypto.randomUUID(),
        sender: this.userId,
        content,
        timestamp: Date.now(),
        hash
      };

      peer.instance.send(JSON.stringify(message));
      this.updatePeerActivity(peerId);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  public async broadcastMessage(content: string): Promise<number> {
    let successCount = 0;
    
    // Use Array.from to create an array of [key, value] entries
    for (const [peerId] of Array.from(this.peers.entries())) {
      // Since sendMessage is now async, we need to await it
      if (await this.sendMessage(peerId, content)) {
        successCount++;
      }
    }
    
    return successCount;
  }

  private updatePeerActivity(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      this.peers.set(peerId, {
        ...peer,
        lastActivity: Date.now()
      });
    }
  }

  public getPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  public getPeerCount(): number {
    return this.peers.size;
  }

  public isConnected(peerId: string): boolean {
    return !!this.peers.get(peerId)?.connected;
  }
}

declare global {
  interface Window {
    socket: WebSocket;
  }
}

export default PeerManager;
