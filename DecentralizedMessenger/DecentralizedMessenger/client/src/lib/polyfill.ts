// Polyfill for Node.js globals in the browser
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
  
  // Other common Node.js globals that might be needed
  // @ts-ignore
  window.process = window.process || { env: {} };

  // Don't use any Buffer-related code in the browser
  // SimplePeer doesn't require Buffer if we're sending just strings
}

export {};