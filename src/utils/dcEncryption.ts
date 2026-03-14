/**
 * DC Chat AES-256-GCM Encryption Utility
 * Server-level message encryption for DC chat servers
 */

/**
 * Generate a new AES-256-GCM key and return it as base64
 */
export async function generateServerKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/**
 * Import a base64 AES key into a CryptoKey object
 */
async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with AES-256-GCM
 * Returns base64 string: iv(12 bytes) + ciphertext
 */
export async function encrypt(text: string, base64Key: string): Promise<string> {
  const key = await importKey(base64Key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Combine iv + ciphertext into one array
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt AES-256-GCM ciphertext
 * Input: base64 string containing iv(12 bytes) + ciphertext
 */
export async function decrypt(encryptedBase64: string, base64Key: string): Promise<string> {
  const key = await importKey(base64Key);
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Generate a random invite code (8 characters, alphanumeric)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(array, b => chars[b % chars.length]).join('');
}
