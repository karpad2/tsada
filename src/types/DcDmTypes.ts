/**
 * P2P E2EE Direct Messaging Types
 */

/** Appwrite-stored contact record */
export interface DcContact {
  $id?: string;
  owner_id: string;
  contact_id: string;
  contact_nickname: string;
  ecdh_public_key: string;
  added_at: string;
  blocked: boolean;
}

/** IndexedDB message record (stored decrypted locally) */
export interface DcDmMessage {
  id?: number;
  conversationId: string;
  senderId: string;
  senderNickname: string;
  text: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered';

  // File transfer fields (optional, only for type === 'file')
  type?: 'text' | 'file';
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  fileBlob?: Blob;           // stored in IndexedDB (Dexie supports Blobs natively)
  fileProgress?: number;     // 0–100
  fileStatus?: 'sending' | 'receiving' | 'done' | 'error' | 'cancelled';
}

/** IndexedDB conversation metadata */
export interface DcDmConversation {
  id: string; // deterministic: [userA, userB].sort().join('_')
  peerUserId: string;
  peerNickname: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

/** ECDH key pair stored in IndexedDB */
export interface DcDmKeyPair {
  id: string; // 'main'
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  createdAt: string;
}

/** Envelope sent over DataChannel */
export interface DcDmEnvelope {
  type: 'message' | 'ack' | 'typing' | 'file_start' | 'file_chunk' | 'file_end' | 'file_cancel'
      | 'call_request' | 'call_accept' | 'call_decline' | 'call_end'
      | 'call_offer'   | 'call_answer' | 'call_ice';
  id: string;
  ciphertext?: string; // base64 – for 'message'
  iv?: string;         // base64 – for 'message'
  timestamp?: string;
  messageId?: number;  // for 'ack'

  // File transfer fields
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  totalChunks?: number;
  chunkIndex?: number;
  chunkData?: string;  // base64-encoded chunk bytes

  // Voice call fields (DC-based C# ↔ Browser signaling)
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

/** DM signaling types */
export type DcDmSignalType = 'DM_OFFER' | 'DM_ANSWER' | 'DM_ICE';
