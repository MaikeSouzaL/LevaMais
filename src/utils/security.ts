import * as Crypto from 'expo-crypto';

/**
 * Generates a deterministic SHA-256 hash for a given string.
 * This can be used on the client-side to generate unique identifiers 
 * or to hash sensitive data before sending it to the backend if zero-knowledge is required.
 */
export async function generateSecureHash(text: string): Promise<string> {
  if (!text) return '';
  
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text
  );
  
  return digest;
}

/**
 * Checks if a string matches a given hash.
 */
export async function compareWithHash(text: string, hash: string): Promise<boolean> {
  const newHash = await generateSecureHash(text);
  return newHash === hash;
}
