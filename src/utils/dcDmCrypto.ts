/**
 * P2P DM Cryptography - ECDH Key Exchange + AES-256-GCM Encryption
 * Uses Web Crypto API for all operations
 */

/**
 * Generate an ECDH P-256 key pair and export as JWK
 */
export async function generateECDHKeyPair(): Promise<{ publicKeyJwk: JsonWebKey; privateKeyJwk: JsonWebKey }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return { publicKeyJwk, privateKeyJwk };
}

/**
 * Derive a shared AES-256-GCM key from ECDH key exchange
 */
export async function deriveSharedKey(
  myPrivateKeyJwk: JsonWebKey,
  theirPublicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    myPrivateKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    theirPublicKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive bits via ECDH
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );

  // Use HKDF to derive AES-256-GCM key
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    'HKDF',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('dcDm-e2ee-salt-v1'),
      info: new TextEncoder().encode('dcDm-aes-key'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a message with AES-256-GCM
 * Returns base64 ciphertext and base64 IV
 */
export async function encryptMessage(
  text: string,
  sharedKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  );

  return {
    ciphertext: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a message with AES-256-GCM
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  sharedKey: CryptoKey
): Promise<string> {
  const cipherBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = new Uint8Array(base64ToArrayBuffer(iv));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    sharedKey,
    cipherBuffer
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Export a public key JWK to a compact string for Appwrite storage
 */
export function exportPublicKeyString(jwk: JsonWebKey): string {
  return JSON.stringify(jwk);
}

/**
 * Import a public key from compact string
 */
export function importPublicKeyString(str: string): JsonWebKey {
  return JSON.parse(str);
}

// --- Helpers ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
