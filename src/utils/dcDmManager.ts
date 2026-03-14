/**
 * P2P DM WebRTC DataChannel Manager
 * Handles peer-to-peer encrypted messaging via WebRTC DataChannels
 * Mirrors voiceManager.ts pattern but for DataChannel messaging
 */

import { DcChatService } from '@/services/DcChatService';
import { deriveSharedKey, encryptMessage, decryptMessage, importPublicKeyString } from './dcDmCrypto';
import type { DcDmEnvelope } from '@/types/DcDmTypes';

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    // Free TURN relay for NAT traversal (restrictive networks/firewalls)
    {
      urls: 'turn:standard.relay.metered.ca:80',
      username: 'e7012850a9f5e11fa5c89049',
      credential: '2XGCMOxbQ+VnPBbn',
    },
    {
      urls: 'turn:standard.relay.metered.ca:443',
      username: 'e7012850a9f5e11fa5c89049',
      credential: '2XGCMOxbQ+VnPBbn',
    },
    {
      urls: 'turn:standard.relay.metered.ca:443?transport=tcp',
      username: 'e7012850a9f5e11fa5c89049',
      credential: '2XGCMOxbQ+VnPBbn',
    },
  ],
};

export type DmConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface DmManagerEvents {
  onMessage?: (fromNickname: string, fromUserId: string, text: string, envelope: DcDmEnvelope) => void;
  onAck?: (fromNickname: string, messageId: number) => void;
  onTyping?: (fromNickname: string) => void;
  onConnectionStateChanged?: (peerUserId: string, state: DmConnectionState) => void;
  onError?: (error: string) => void;

  // File transfer events
  onFileStart?: (fromNickname: string, fromUserId: string, fileId: string, fileName: string, fileSize: number, fileMimeType: string) => void;
  onFileProgress?: (fileId: string, receivedChunks: number, totalChunks: number) => void;
  onFileComplete?: (fromNickname: string, fromUserId: string, fileId: string, blob: Blob, fileName: string, fileMimeType: string) => void;
  onFileCancelled?: (fileId: string) => void;

  // Called when the DataChannel to a peer becomes open.
  // flushedDbIds = DB message IDs that were queued in-memory and just sent,
  // so they shouldn't be re-sent from the DB.
  onPeerConnected?: (peerUserId: string, flushedDbIds: number[]) => void;

  // DC-based voice call signaling (C# client ↔ Browser)
  onDcCallRequest?:  (fromUserId: string, fromNickname: string) => void;
  onDcCallAccept?:   (fromUserId: string) => void;
  onDcCallDecline?:  (fromUserId: string) => void;
  onDcCallEnd?:      (fromUserId: string) => void;
  onDcCallOffer?:    (fromUserId: string, sdp: string) => void;
  onDcCallAnswer?:   (fromUserId: string, sdp: string) => void;
  onDcCallIce?:      (fromUserId: string, candidate: RTCIceCandidateInit) => void;
}

/** Chunk size for file transfers (64 KB) */
const FILE_CHUNK_SIZE = 64 * 1024;
/** Stop sending when DataChannel buffer exceeds this (512 KB) */
const BUFFER_HIGH_THRESHOLD = 512 * 1024;

interface IncomingTransfer {
  fromNickname: string;
  fromUserId: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  totalChunks: number;
  chunks: string[];       // base64 chunks indexed by chunkIndex
  receivedCount: number;
}

/**
 * Minify SDP to reduce payload size for Appwrite.
 */
function minifySdp(sdp: string): string {
  const lines = sdp.split('\r\n');
  const result: string[] = [];
  for (const line of lines) {
    if (line.startsWith('a=extmap:')) continue;
    if (line.startsWith('a=extmap-allow-mixed')) continue;
    if (line.startsWith('a=ssrc:') && !line.includes('cname:')) continue;
    result.push(line);
  }
  return result.join('\r\n');
}

export class DcDmManager {
  private chatService: DcChatService;
  private myNickname: string = '';
  private myUserId: string = '';
  private myPrivateKeyJwk: JsonWebKey | null = null;
  private events: DmManagerEvents = {};

  // Per-peer state
  private peers: Map<string, RTCPeerConnection> = new Map(); // keyed by peerUserId
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private connectionStates: Map<string, DmConnectionState> = new Map();
  private sharedKeys: Map<string, CryptoKey> = new Map(); // derived AES keys
  private peerNicknames: Map<string, string> = new Map(); // userId -> nickname
  private nickToUserId: Map<string, string> = new Map(); // nickname -> userId

  // Offline message queue: peerUserId -> pending envelopes (with optional DB message ID for dedup)
  private offlineQueue: Map<string, { envelope: DcDmEnvelope; dbMessageId?: number }[]> = new Map();

  // File transfer state
  private incomingTransfers: Map<string, IncomingTransfer> = new Map();
  private cancelledTransfers: Set<string> = new Set();

  // ICE candidate buffer: stores candidates that arrive before remoteDescription is set
  private pendingIceCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  // Deterministic connection: only lower userId initiates offers
  private initiatorPeers: Set<string> = new Set();
  private retryInterval: ReturnType<typeof setInterval> | null = null;

  private signalingUnsub: (() => void) | null = null;

  constructor(chatService: DcChatService, events: DmManagerEvents = {}) {
    this.chatService = chatService;
    this.events = events;
  }

  /**
   * Initialize the manager with user credentials and ECDH private key
   */
  initialize(nickname: string, userId: string, privateKeyJwk: JsonWebKey): void {
    this.myNickname = nickname;
    this.myUserId = userId;
    this.myPrivateKeyJwk = privateKeyJwk;

    // Subscribe to DM signaling
    this.signalingUnsub = this.chatService.subscribeToDmSignaling(
      this.myNickname,
      (type, from, data) => this.handleSignal(type, from, data)
    );

    // Retry timer: re-send offers for peers that haven't connected yet
    this.retryInterval = setInterval(() => this.retryDisconnectedPeers(), 10000);

    console.log('[DM] Manager initialized for:', nickname);
  }

  getConnectionState(peerUserId: string): DmConnectionState {
    return this.connectionStates.get(peerUserId) || 'disconnected';
  }

  /**
   * Connect to a peer for DM messaging.
   * Only the user with the lower userId creates the offer (initiator).
   * The other user waits for the incoming offer (responder).
   * This prevents glare (simultaneous offers creating 2 DataChannels).
   */
  async connectToPeer(peerUserId: string, peerNickname: string, peerPublicKeyJwk: JsonWebKey): Promise<void> {
    if (!this.myPrivateKeyJwk) {
      console.error('[DM] No private key - call initialize() first');
      return;
    }

    // Skip if already connected
    const currentState = this.connectionStates.get(peerUserId);
    if (currentState === 'connected') return;

    // Store peer mapping
    this.peerNicknames.set(peerUserId, peerNickname);
    this.nickToUserId.set(peerNickname, peerUserId);

    // Always (re-)derive shared encryption key to ensure freshness
    try {
      const sharedKey = await deriveSharedKey(this.myPrivateKeyJwk, peerPublicKeyJwk);
      this.sharedKeys.set(peerUserId, sharedKey);
      console.log('[DM] Shared key derived for peer:', peerNickname,
        'theirKey x:', (peerPublicKeyJwk as any).x?.substring(0, 8) + '...');
    } catch (error) {
      console.error('[DM] Failed to derive shared key for:', peerNickname, error);
      this.events.onError?.('Failed to derive encryption key');
      return;
    }

    // Deterministic: only the lower userId initiates the connection
    const isInitiator = this.myUserId < peerUserId;

    this.setConnectionState(peerUserId, 'connecting');

    if (isInitiator) {
      this.initiatorPeers.add(peerUserId);
      console.log('[DM] We are initiator for:', peerNickname);
      await this.createOffer(peerUserId, peerNickname);
    } else {
      console.log('[DM] We are responder for:', peerNickname, '- waiting for their offer');
    }
  }

  /**
   * Send an encrypted message to a peer.
   * Pass dbMessageId so the offline queue can mark it as delivered after reconnect.
   */
  async sendMessage(peerUserId: string, text: string, dbMessageId?: number): Promise<DcDmEnvelope | null> {
    const sharedKey = this.sharedKeys.get(peerUserId);
    if (!sharedKey) {
      console.error('[DM] No shared key for peer:', peerUserId);
      return null;
    }

    try {
      const { ciphertext, iv } = await encryptMessage(text, sharedKey);

      const envelope: DcDmEnvelope = {
        type: 'message',
        id: crypto.randomUUID(),
        ciphertext,
        iv,
        timestamp: new Date().toISOString(),
      };

      const dc = this.dataChannels.get(peerUserId);
      if (dc && dc.readyState === 'open') {
        dc.send(JSON.stringify(envelope));
        return envelope;
      }

      // Queue for later delivery when the DataChannel opens
      if (!this.offlineQueue.has(peerUserId)) {
        this.offlineQueue.set(peerUserId, []);
      }
      this.offlineQueue.get(peerUserId)!.push({ envelope, dbMessageId });
      console.log('[DM] Message queued (peer offline):', peerUserId);
      return envelope;
    } catch (error) {
      console.error('[DM] Failed to encrypt/send message:', error);
      return null;
    }
  }

  /**
   * Send a file to a peer via the DataChannel.
   * Returns the generated fileId, or null if the peer is not connected.
   * onProgress is called with values 0–100 as chunks are sent.
   */
  async sendFile(
    peerUserId: string,
    file: File,
    fileId: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    const dc = this.dataChannels.get(peerUserId);
    if (!dc || dc.readyState !== 'open') {
      console.error('[DM] Cannot send file – peer not connected:', peerUserId);
      return false;
    }

    const totalChunks = Math.ceil(file.size / FILE_CHUNK_SIZE);

    // Send file_start metadata
    const startEnvelope: DcDmEnvelope = {
      type: 'file_start',
      id: fileId,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type || 'application/octet-stream',
      totalChunks,
    };
    dc.send(JSON.stringify(startEnvelope));

    // Register in cancelled set so we can abort mid-transfer
    this.cancelledTransfers.delete(fileId);

    // Read and send chunks
    let chunkIndex = 0;
    let offset = 0;

    while (offset < file.size) {
      if (this.cancelledTransfers.has(fileId)) {
        const cancelEnv: DcDmEnvelope = { type: 'file_cancel', id: fileId, fileId };
        try { dc.send(JSON.stringify(cancelEnv)); } catch {}
        this.cancelledTransfers.delete(fileId);
        return false;
      }

      // Backpressure – wait if buffer is full
      while (dc.bufferedAmount > BUFFER_HIGH_THRESHOLD) {
        await new Promise(res => setTimeout(res, 50));
      }

      const slice = file.slice(offset, offset + FILE_CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);

      const chunkEnvelope: DcDmEnvelope = {
        type: 'file_chunk',
        id: crypto.randomUUID(),
        fileId,
        chunkIndex,
        chunkData: base64,
      };
      dc.send(JSON.stringify(chunkEnvelope));

      chunkIndex++;
      offset += FILE_CHUNK_SIZE;

      onProgress?.(Math.round((chunkIndex / totalChunks) * 100));
    }

    // Send file_end
    const endEnvelope: DcDmEnvelope = { type: 'file_end', id: fileId, fileId };
    dc.send(JSON.stringify(endEnvelope));

    console.log('[DM] File sent:', file.name, 'chunks:', totalChunks);
    return true;
  }

  /** Cancel an outgoing file transfer */
  cancelFileTransfer(fileId: string): void {
    this.cancelledTransfers.add(fileId);
  }

  /**
   * Send typing indicator
   */
  sendTyping(peerUserId: string): void {
    const dc = this.dataChannels.get(peerUserId);
    if (dc && dc.readyState === 'open') {
      const envelope: DcDmEnvelope = {
        type: 'typing',
        id: crypto.randomUUID(),
      };
      dc.send(JSON.stringify(envelope));
    }
  }

  /**
   * Disconnect from a specific peer
   */
  disconnectPeer(peerUserId: string): void {
    const pc = this.peers.get(peerUserId);
    if (pc) {
      pc.close();
      this.peers.delete(peerUserId);
    }
    this.dataChannels.delete(peerUserId);
    this.sharedKeys.delete(peerUserId);
    this.setConnectionState(peerUserId, 'disconnected');
  }

  /**
   * Destroy the manager and clean up all connections
   */
  destroy(): void {
    this.signalingUnsub?.();
    this.signalingUnsub = null;

    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }

    for (const [peerId] of this.peers) {
      this.disconnectPeer(peerId);
    }
    this.peers.clear();
    this.dataChannels.clear();
    this.sharedKeys.clear();
    this.offlineQueue.clear();
    this.pendingIceCandidates.clear();
    this.connectionStates.clear();
    this.peerNicknames.clear();
    this.nickToUserId.clear();
    this.initiatorPeers.clear();
    this.incomingTransfers.clear();
    this.cancelledTransfers.clear();

    console.log('[DM] Manager destroyed');
  }

  // ==================== PRIVATE ====================

  private setConnectionState(peerUserId: string, state: DmConnectionState): void {
    this.connectionStates.set(peerUserId, state);
    this.events.onConnectionStateChanged?.(peerUserId, state);
  }

  private serializeSdp(desc: RTCSessionDescription | null): { type: string; sdp: string } | null {
    if (!desc || !desc.sdp) return null;
    return { type: desc.type, sdp: minifySdp(desc.sdp) };
  }

  private createPeerConnection(peerUserId: string, peerNickname: string): RTCPeerConnection {
    const existing = this.peers.get(peerUserId);
    if (existing) existing.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.chatService.sendDmSignal(
          this.myNickname,
          'DM_ICE',
          peerNickname,
          { candidate: event.candidate.toJSON(), userId: this.myUserId }
        );
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[DM] Connection to ${peerNickname}: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        this.setConnectionState(peerUserId, 'connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.setConnectionState(peerUserId, 'disconnected');
      }
    };

    pc.ondatachannel = (event) => {
      console.log('[DM] Incoming DataChannel from:', peerNickname);
      this.setupDataChannel(peerUserId, peerNickname, event.channel);
    };

    this.peers.set(peerUserId, pc);
    return pc;
  }

  private setupDataChannel(peerUserId: string, peerNickname: string, dc: RTCDataChannel): void {
    this.dataChannels.set(peerUserId, dc);

    dc.onopen = async () => {
      console.log('[DM] DataChannel open with:', peerNickname);
      this.setConnectionState(peerUserId, 'connected');
      const flushedIds = await this.flushOfflineQueue(peerUserId);
      // Notify composable: flushedIds are already sent, skip them in DB retry
      this.events.onPeerConnected?.(peerUserId, flushedIds);
    };

    dc.onclose = () => {
      console.log('[DM] DataChannel closed with:', peerNickname);
      this.setConnectionState(peerUserId, 'disconnected');
    };

    dc.onmessage = async (event) => {
      try {
        const envelope: DcDmEnvelope = JSON.parse(event.data);
        await this.handleIncomingEnvelope(peerUserId, peerNickname, envelope);
      } catch (error) {
        console.error('[DM] Failed to parse incoming message:', error);
      }
    };
  }

  private async handleIncomingEnvelope(peerUserId: string, peerNickname: string, envelope: DcDmEnvelope): Promise<void> {
    switch (envelope.type) {
      case 'message': {
        if (!envelope.ciphertext || !envelope.iv) return;

        const sharedKey = this.sharedKeys.get(peerUserId);
        if (!sharedKey) {
          console.error('[DM] No shared key to decrypt message from:', peerNickname);
          return;
        }

        try {
          const plaintext = await decryptMessage(envelope.ciphertext, envelope.iv, sharedKey);
          this.events.onMessage?.(peerNickname, peerUserId, plaintext, envelope);

          // Send ACK
          const dc = this.dataChannels.get(peerUserId);
          if (dc && dc.readyState === 'open') {
            const ack: DcDmEnvelope = { type: 'ack', id: envelope.id };
            dc.send(JSON.stringify(ack));
          }
        } catch (error) {
          console.error('[DM] Failed to decrypt message from:', peerNickname, error);
        }
        break;
      }

      case 'ack':
        if (envelope.messageId !== undefined) {
          this.events.onAck?.(peerNickname, envelope.messageId);
        }
        break;

      case 'typing':
        this.events.onTyping?.(peerNickname);
        break;

      case 'file_start': {
        if (!envelope.fileId || !envelope.fileName || envelope.fileSize === undefined || !envelope.totalChunks) break;

        this.incomingTransfers.set(envelope.fileId, {
          fromNickname: peerNickname,
          fromUserId: peerUserId,
          fileName: envelope.fileName,
          fileSize: envelope.fileSize,
          fileMimeType: envelope.fileMimeType || 'application/octet-stream',
          totalChunks: envelope.totalChunks,
          chunks: new Array(envelope.totalChunks).fill(''),
          receivedCount: 0,
        });

        this.events.onFileStart?.(
          peerNickname, peerUserId,
          envelope.fileId, envelope.fileName, envelope.fileSize,
          envelope.fileMimeType || 'application/octet-stream'
        );
        console.log('[DM] Incoming file:', envelope.fileName, 'chunks:', envelope.totalChunks);
        break;
      }

      case 'file_chunk': {
        if (!envelope.fileId || envelope.chunkIndex === undefined || !envelope.chunkData) break;

        const transfer = this.incomingTransfers.get(envelope.fileId);
        if (!transfer) break;

        transfer.chunks[envelope.chunkIndex] = envelope.chunkData;
        transfer.receivedCount++;

        this.events.onFileProgress?.(envelope.fileId, transfer.receivedCount, transfer.totalChunks);
        break;
      }

      case 'file_end': {
        if (!envelope.fileId) break;

        const transfer = this.incomingTransfers.get(envelope.fileId);
        if (!transfer) break;

        this.incomingTransfers.delete(envelope.fileId);

        // Reconstruct Blob from base64 chunks
        try {
          const byteArrays: Uint8Array[] = transfer.chunks.map(b64 => base64ToUint8Array(b64));
          const blob = new Blob(byteArrays, { type: transfer.fileMimeType });
          this.events.onFileComplete?.(
            transfer.fromNickname, transfer.fromUserId,
            envelope.fileId, blob, transfer.fileName, transfer.fileMimeType
          );
          console.log('[DM] File received:', transfer.fileName, 'size:', blob.size);
        } catch (err) {
          console.error('[DM] Failed to reconstruct file:', err);
        }
        break;
      }

      case 'file_cancel': {
        if (!envelope.fileId) break;
        this.incomingTransfers.delete(envelope.fileId);
        this.events.onFileCancelled?.(envelope.fileId);
        break;
      }

      // ── DC-based voice call signaling (C# ↔ Browser) ──────────────────
      case 'call_request':
        this.events.onDcCallRequest?.(peerUserId, peerNickname);
        break;

      case 'call_accept':
        this.events.onDcCallAccept?.(peerUserId);
        break;

      case 'call_decline':
        this.events.onDcCallDecline?.(peerUserId);
        break;

      case 'call_end':
        this.events.onDcCallEnd?.(peerUserId);
        break;

      case 'call_offer':
        if (envelope.sdp) this.events.onDcCallOffer?.(peerUserId, envelope.sdp);
        break;

      case 'call_answer':
        if (envelope.sdp) this.events.onDcCallAnswer?.(peerUserId, envelope.sdp);
        break;

      case 'call_ice':
        if (envelope.candidate) this.events.onDcCallIce?.(peerUserId, envelope.candidate);
        break;
    }
  }

  /** Send a voice call signaling message via DataChannel (C# ↔ Browser). */
  sendDcCallMsg(peerUserId: string, type: string, extra?: object): boolean {
    const dc = this.dataChannels.get(peerUserId);
    if (!dc || dc.readyState !== 'open') {
      console.warn('[DM] sendDcCallMsg: DC not open for', peerUserId);
      return false;
    }
    dc.send(JSON.stringify({ type, ...extra }));
    return true;
  }

  private async flushOfflineQueue(peerUserId: string): Promise<number[]> {
    const queue = this.offlineQueue.get(peerUserId);
    const dc = this.dataChannels.get(peerUserId);
    if (!dc || dc.readyState !== 'open') return [];

    const flushedIds: number[] = [];
    if (queue && queue.length > 0) {
      console.log('[DM] Flushing', queue.length, 'queued messages for:', peerUserId);
      for (const { envelope, dbMessageId } of queue) {
        dc.send(JSON.stringify(envelope));
        if (dbMessageId !== undefined) flushedIds.push(dbMessageId);
      }
      this.offlineQueue.delete(peerUserId);
    }
    return flushedIds;
  }

  /**
   * Retry sending offers to peers that haven't connected yet.
   * Only retries for peers where we are the initiator (lower userId).
   */
  private retryDisconnectedPeers(): void {
    for (const peerUserId of this.initiatorPeers) {
      const state = this.connectionStates.get(peerUserId);
      if (state === 'connected') continue;

      // Don't retry if DataChannel is already open
      const dc = this.dataChannels.get(peerUserId);
      if (dc && dc.readyState === 'open') continue;

      const peerNickname = this.peerNicknames.get(peerUserId);
      if (!peerNickname) continue;

      console.log('[DM] Retrying offer to:', peerNickname);
      this.createOffer(peerUserId, peerNickname);
    }
  }

  private async createOffer(peerUserId: string, peerNickname: string): Promise<void> {
    try {
      // Clean up any existing connection for a fresh start
      const existingDc = this.dataChannels.get(peerUserId);
      if (existingDc) {
        try { existingDc.close(); } catch {}
        this.dataChannels.delete(peerUserId);
      }
      this.pendingIceCandidates.delete(peerUserId);

      const pc = this.createPeerConnection(peerUserId, peerNickname);

      // Create DataChannel (only the offerer/initiator creates it)
      const dc = pc.createDataChannel('dm', { ordered: true });
      this.setupDataChannel(peerUserId, peerNickname, dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpData = this.serializeSdp(pc.localDescription);
      if (!sdpData) {
        console.error('[DM] No local description for offer to:', peerNickname);
        return;
      }

      console.log('[DM] Sending offer to:', peerNickname, 'SDP length:', sdpData.sdp.length);

      const sent = await this.chatService.sendDmSignal(
        this.myNickname,
        'DM_OFFER',
        peerNickname,
        { ...sdpData, userId: this.myUserId }
      );
      if (!sent) {
        console.error('[DM] Failed to send offer to:', peerNickname);
      }
    } catch (error) {
      console.error('[DM] Failed to create offer for:', peerNickname, error);
    }
  }

  /**
   * Flush buffered ICE candidates after remoteDescription is set
   */
  private async flushPendingIceCandidates(peerUserId: string): Promise<void> {
    const pending = this.pendingIceCandidates.get(peerUserId);
    if (!pending || pending.length === 0) return;

    const pc = this.peers.get(peerUserId);
    if (!pc || !pc.remoteDescription) return;

    console.log('[DM] Flushing', pending.length, 'buffered ICE candidates for:', peerUserId);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        // Stale candidates from previous sessions - safe to ignore
        console.warn('[DM] Stale ICE candidate ignored');
      }
    }
    this.pendingIceCandidates.delete(peerUserId);
  }

  private async handleSignal(type: string, fromNickname: string, data: any): Promise<void> {
    const fromUserId: string = data?.userId || '';

    switch (type) {
      case 'DM_OFFER': {
        console.log('[DM] Received offer from:', fromNickname, 'userId:', fromUserId);

        if (!fromUserId) {
          console.warn('[DM] Offer missing userId from:', fromNickname);
          return;
        }

        // Store nickname mapping
        this.peerNicknames.set(fromUserId, fromNickname);
        this.nickToUserId.set(fromNickname, fromUserId);

        // Always (re-)derive shared key from the PEER's contact record.
        // Each contact record stores the OWNER's public key.
        // So getContactByPeer(peerId, myId) returns peer's record → peer's public key.
        try {
          const peerRecord = await this.chatService.getContactByPeer(fromUserId, this.myUserId);
          if (peerRecord && peerRecord.ecdh_public_key && this.myPrivateKeyJwk) {
            const peerPubKey = importPublicKeyString(peerRecord.ecdh_public_key);
            const sharedKey = await deriveSharedKey(this.myPrivateKeyJwk, peerPubKey);
            this.sharedKeys.set(fromUserId, sharedKey);
            console.log('[DM] Shared key derived (offer) for:', fromNickname,
              'theirKey x:', (peerPubKey as any).x?.substring(0, 8) + '...');
          } else {
            console.warn('[DM] No contact/public key for incoming offer from:', fromNickname);
            return;
          }
        } catch (error) {
          console.error('[DM] Failed to derive key for incoming offer:', error);
          return;
        }

        this.setConnectionState(fromUserId, 'connecting');

        // Always start fresh: close existing connection and create new one
        const existingPc = this.peers.get(fromUserId);
        if (existingPc) {
          existingPc.close();
          this.peers.delete(fromUserId);
        }
        const existingDc = this.dataChannels.get(fromUserId);
        if (existingDc) {
          try { existingDc.close(); } catch {}
          this.dataChannels.delete(fromUserId);
        }

        // Clear stale ICE candidates from previous attempts
        this.pendingIceCandidates.delete(fromUserId);

        // Create new PeerConnection and accept the offer
        // We are the responder: DataChannel comes via ondatachannel
        const pc = this.createPeerConnection(fromUserId, fromNickname);
        await pc.setRemoteDescription(new RTCSessionDescription(data));

        // Flush any ICE candidates that arrived while we were processing the offer
        await this.flushPendingIceCandidates(fromUserId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const sdpData = this.serializeSdp(pc.localDescription);
        if (sdpData) {
          console.log('[DM] Sending answer to:', fromNickname, 'SDP length:', sdpData.sdp.length);
          await this.chatService.sendDmSignal(this.myNickname, 'DM_ANSWER', fromNickname, { ...sdpData, userId: this.myUserId });
        }
        break;
      }

      case 'DM_ANSWER': {
        console.log('[DM] Received answer from:', fromNickname);
        const peerUserId = fromUserId || this.nickToUserId.get(fromNickname);
        if (!peerUserId) return;

        const pc = this.peers.get(peerUserId);
        if (!pc) return;

        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          console.log('[DM] Answer set successfully from:', fromNickname);

          // Flush any ICE candidates that arrived before the answer
          await this.flushPendingIceCandidates(peerUserId);
        }
        break;
      }

      case 'DM_ICE': {
        const peerUserId = fromUserId || this.nickToUserId.get(fromNickname);
        if (!peerUserId) return;

        const pc = this.peers.get(peerUserId);

        // Buffer ICE candidates if PeerConnection doesn't have remoteDescription yet
        if (!pc || !pc.remoteDescription) {
          if (!this.pendingIceCandidates.has(peerUserId)) {
            this.pendingIceCandidates.set(peerUserId, []);
          }
          this.pendingIceCandidates.get(peerUserId)!.push(data.candidate);
          console.log('[DM] Buffered ICE candidate from:', fromNickname, '(waiting for remote description)');
          return;
        }

        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          // "Unknown ufrag" = stale candidate from old session, safe to ignore
          console.warn('[DM] ICE candidate skipped (stale):', fromNickname);
        }
        break;
      }
    }
  }
}

// ==================== FILE TRANSFER HELPERS ====================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
