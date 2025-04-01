declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  export interface SimplePeerOptions {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: object;
    constraints?: object;
    offerConstraints?: object;
    answerConstraints?: object;
    sdpTransform?: (sdp: any) => any;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
    wrtc?: object;
  }

  export interface SignalData {
    type?: string;
    sdp?: any;
    candidate?: any;
  }

  // Define the instance interface
  export interface Instance extends EventEmitter {
    signal(data: SignalData): void;
    send(data: string | Uint8Array | ArrayBuffer | Blob): void;
    destroy(): void;
    readonly connected: boolean;
    readonly destroyed: boolean;
    readonly readyState: string;
    
    on(event: 'signal', listener: (data: SignalData) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'data', listener: (data: Uint8Array) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }
  
  // Define the default export as a function that returns an Instance
  const SimplePeer: {
    (opts?: SimplePeerOptions): Instance;
    new (opts?: SimplePeerOptions): Instance;
  };
  
  export default SimplePeer;
}