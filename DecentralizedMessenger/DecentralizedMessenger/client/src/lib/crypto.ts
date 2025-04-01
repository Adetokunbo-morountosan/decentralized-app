// Using native crypto for hash generation

/**
 * Generate a SHA-256 hash of a string
 * @param content The string to hash
 * @returns Hex string representation of the hash
 */
export const generateHash = async (content: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert the ArrayBuffer to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Verify if a hash matches the content
 * @param content The original content
 * @param hash The hash to verify against
 */
export const verifyHash = async (content: string, hash: string): Promise<boolean> => {
  const calculatedHash = await generateHash(content);
  return calculatedHash === hash;
};

/**
 * Generate a random user ID
 * @returns A random string ID
 */
export const generateUserId = (): string => {
  return crypto.randomUUID().substring(0, 8);
};

/**
 * Generate a short hash (4 characters) for display
 * @returns A short hash string
 */
export const generateShortHash = async (): Promise<string> => {
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 4);
};

/**
 * Generate user display name with short hash
 * @param name User's chosen name
 * @returns Name with hash appended
 */
export const generateDisplayName = async (name: string): Promise<string> => {
  const shortHash = await generateShortHash();
  return `${name}:${shortHash}`;
};
