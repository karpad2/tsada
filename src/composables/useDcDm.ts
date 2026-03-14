/**
 * P2P E2EE Direct Messaging Composable
 * Main entry point for DM functionality in the UI
 */

import { ref, computed, onBeforeUnmount, type Ref } from 'vue';
import { notify } from '@kyvg/vue3-notification';
import { DcDmManager, ICE_SERVERS, type DmConnectionState } from '@/utils/dcDmManager';
import { DcDmCallManager, type DmCallState } from '@/utils/dcDmCallManager';
import { getDmDatabase, closeDmDatabase } from '@/utils/dcDmDatabase';
import { generateECDHKeyPair, exportPublicKeyString, importPublicKeyString } from '@/utils/dcDmCrypto';
import type { DcContact, DcDmMessage, DcDmConversation, DcDmKeyPair, DcDmEnvelope } from '@/types/DcDmTypes';
import chatService, { type DcUser } from '@/services/DcChatService';

export function useDcDm() {
  // State
  const contacts: Ref<DcContact[]> = ref([]);
  const conversations: Ref<DcDmConversation[]> = ref([]);
  const currentMessages: Ref<DcDmMessage[]> = ref([]);
  const currentConversationId: Ref<string | null> = ref(null);
  const connectionStates: Ref<Record<string, DmConnectionState>> = ref({});
  const dmActive = ref(false);
  const initialized = ref(false);
  const typingPeers: Ref<Record<string, boolean>> = ref({});
  const hasMoreMessages = ref(false);
  const isLoadingMore = ref(false);

  const MESSAGE_PAGE_SIZE = 30;

  let manager: DcDmManager | null = null;
  let callManager: DcDmCallManager | null = null;
  let myUserId = '';
  let myNickname = '';
  let myPrivateKeyJwk: JsonWebKey | null = null;
  let typingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
  let isInitializing = false;

  // ==================== CALL STATE ====================
  const callState: Ref<DmCallState> = ref('idle');
  const incomingCall: Ref<{ fromUserId: string; fromNickname: string; withVideo: boolean } | null> = ref(null);
  const localCallStream: Ref<MediaStream | null> = ref(null);
  const remoteCallStream: Ref<MediaStream | null> = ref(null);
  const callPeerNickname: Ref<string> = ref('');
  const callWithVideo: Ref<boolean> = ref(false);
  const callMuted: Ref<boolean> = ref(false);
  const callVideoOff: Ref<boolean> = ref(false);

  // DC Call state (DataChannel-based, for C# ↔ Browser calls)
  const dcCallActive = ref(false);
  let dcCallInitiator = false;
  let dcCallPeerUserId = '';
  let dcCallPc: RTCPeerConnection | null = null;
  let dcCallPendingIce: RTCIceCandidateInit[] = [];
  let dcLocalStream: MediaStream | null = null;

  const unreadTotal = computed(() => {
    return conversations.value.reduce((sum, c) => sum + c.unreadCount, 0);
  });

  /**
   * Initialize only the call manager (for receiving calls before DM mode is opened)
   */
  function initializeCallManager(user: DcUser): void {
    if (!user.$id || !user.nickname) return;
    if (callManager) return; // already initialized

    myUserId = user.$id;
    myNickname = user.nickname;

    function resetCallState() {
      callState.value = 'idle';
      incomingCall.value = null;
      localCallStream.value = null;
      remoteCallStream.value = null;
      callMuted.value = false;
      callVideoOff.value = false;
    }

    callManager = new DcDmCallManager(chatService, {
      onIncomingCall: (fromUserId, fromNickname, withVideo) => {
        incomingCall.value = { fromUserId, fromNickname, withVideo };
        callPeerNickname.value = fromNickname;
        callWithVideo.value = withVideo;
      },
      onCallAccepted: () => {
        callState.value = 'connected';
      },
      onCallRejected: resetCallState,
      onCallEnded: resetCallState,
      onCallStateChanged: (state) => {
        callState.value = state;
        if (state === 'idle') {
          incomingCall.value = null;
          callPeerNickname.value = '';
          callMuted.value = false;
          callVideoOff.value = false;
        }
      },
      onLocalStream: (stream) => {
        localCallStream.value = stream;
      },
      onRemoteStream: (stream) => {
        remoteCallStream.value = stream;
      },
      onError: (err) => console.error('[DmCall] Error:', err),
    });
    callManager.initialize(myNickname, myUserId);
    console.log('[DM] Call manager initialized for:', myNickname);
  }

  /**
   * Initialize the DM system for the current user
   */
  async function initialize(user: DcUser): Promise<void> {
    if (initialized.value || isInitializing) return;
    isInitializing = true;
    if (!user.$id || !user.nickname) { isInitializing = false; return; }

    myUserId = user.$id;
    myNickname = user.nickname;

    const db = getDmDatabase(myUserId);

    // Get or create ECDH key pair
    let keyPair = await db.keyPairs.get('main');
    if (!keyPair) {
      const generated = await generateECDHKeyPair();
      keyPair = {
        id: 'main',
        publicKeyJwk: generated.publicKeyJwk,
        privateKeyJwk: generated.privateKeyJwk,
        createdAt: new Date().toISOString(),
      };
      await db.keyPairs.put(keyPair);
      console.log('[DM] Generated new ECDH key pair');
    }

    myPrivateKeyJwk = keyPair.privateKeyJwk;

    // Ensure our public key is up-to-date in Appwrite contact records
    const myPublicKeyStr = exportPublicKeyString(keyPair.publicKeyJwk);
    console.log('[DM] My public key x:', (keyPair.publicKeyJwk as any).x?.substring(0, 8) + '...');
    chatService.updateContactsPublicKey(myUserId, myPublicKeyStr).catch(
      (err: unknown) => console.warn('[DM] Failed to sync public key:', err)
    );

    // Create manager
    manager = new DcDmManager(chatService, {
      onMessage: handleIncomingMessage,
      onAck: handleAck,
      onTyping: handleTyping,
      onConnectionStateChanged: handleConnectionStateChanged,
      onError: (err) => console.error('[DM] Error:', err),
      onFileStart: handleIncomingFileStart,
      onFileProgress: handleIncomingFileProgress,
      onFileComplete: handleIncomingFileComplete,
      onFileCancelled: handleFileCancelled,
      onPeerConnected: (peerUserId, flushedDbIds) => handlePeerConnected(peerUserId, flushedDbIds),
      // DC-based call events (C# ↔ Browser)
      onDcCallRequest:  handleDcCallRequest,
      onDcCallAccept:   (id) => { void handleDcCallAccept(id); },
      onDcCallDecline:  handleDcCallDecline,
      onDcCallEnd:      handleDcCallEnd,
      onDcCallOffer:    (id, sdp) => { void handleDcCallOffer(id, sdp); },
      onDcCallAnswer:   (id, sdp) => { void handleDcCallAnswer(id, sdp); },
      onDcCallIce:      (id, cand) => { void handleDcCallIce(id, cand); },
    });

    manager.initialize(myNickname, myUserId, myPrivateKeyJwk);

    // Initialize call manager (reuse if already created via initializeCallManager)
    if (!callManager) {
      initializeCallManager(user);
    }

    // Load contacts and conversations in parallel
    await Promise.all([loadContacts(), loadConversations()]);

    // Auto-connect to mutual contacts
    // Each contact record stores the OWNER's public key, not the peer's.
    // So to get the PEER's public key, we look up the peer's contact record
    // (where peer is owner and we are the contact).
    for (const contact of contacts.value) {
      if (!contact.blocked) {
        try {
          console.log('[DM] Auto-connect: looking up key for', contact.contact_nickname, '(id:', contact.contact_id, ')');
          const peerRecord = await chatService.getContactByPeer(contact.contact_id, myUserId);
          if (peerRecord && peerRecord.ecdh_public_key) {
            const peerPubKey = importPublicKeyString(peerRecord.ecdh_public_key);
            console.log('[DM] Auto-connect: key found for', contact.contact_nickname,
              'x prefix:', (peerPubKey as any).x?.substring(0, 12));
            manager.connectToPeer(contact.contact_id, contact.contact_nickname, peerPubKey);
          } else {
            console.warn('[DM] Auto-connect: NO KEY RECORD for', contact.contact_nickname,
              '- peerRecord:', peerRecord);
          }
        } catch (error) {
          console.warn('[DM] Failed to auto-connect to:', contact.contact_nickname, error);
        }
      }
    }

    initialized.value = true;
    isInitializing = false;
    console.log('[DM] Initialized for:', myNickname);
  }

  /**
   * Search for users to add as contacts
   */
  async function searchUsers(query: string): Promise<DcUser[]> {
    if (query.length < 2) return [];
    const users = await chatService.searchUsers(query);
    return users.filter(u => u.$id !== myUserId);
  }

  /**
   * Add a user as contact
   */
  async function addContact(user: DcUser): Promise<boolean> {
    if (!user.$id || !myUserId) return false;

    const db = getDmDatabase(myUserId);
    const keyPair = await db.keyPairs.get('main');
    if (!keyPair) return false;

    const myPublicKeyStr = exportPublicKeyString(keyPair.publicKeyJwk);

    // Store our public key on our contact entry so the peer can find it
    const success = await chatService.addContact(
      myUserId,
      user.$id,
      user.nickname,
      myPublicKeyStr
    );

    if (success) {
      await loadContacts();

      // Check if the peer also has us as a contact (mutual)
      const peerContact = await chatService.getContactByPeer(user.$id!, myUserId);
      if (peerContact && peerContact.ecdh_public_key && manager) {
        const peerPubKey = importPublicKeyString(peerContact.ecdh_public_key);
        manager.connectToPeer(user.$id!, user.nickname, peerPubKey);
      }
    }

    return success;
  }

  /**
   * Remove a contact
   */
  async function removeContact(contactDocId: string): Promise<boolean> {
    const success = await chatService.removeContact(contactDocId);
    if (success) {
      await loadContacts();
    }
    return success;
  }

  /**
   * Open a conversation with a peer
   */
  async function openConversation(peerUserId: string, peerNickname: string): Promise<void> {
    const convId = getConversationId(myUserId, peerUserId);
    currentConversationId.value = convId;
    hasMoreMessages.value = false;
    isLoadingMore.value = false;

    const db = getDmDatabase(myUserId);

    // Ensure conversation exists
    const existing = await db.conversations.get(convId);
    if (!existing) {
      await db.conversations.put({
        id: convId,
        peerUserId,
        peerNickname,
        lastMessage: '',
        lastTimestamp: new Date().toISOString(),
        unreadCount: 0,
      });
      await loadConversations();
    } else {
      // Clear unread count
      await db.conversations.update(convId, { unreadCount: 0 });
      await loadConversations();
    }

    // Load last PAGE_SIZE messages (paginated)
    const allKeys = await db.messages
      .where('conversationId')
      .equals(convId)
      .primaryKeys() as number[];
    hasMoreMessages.value = allKeys.length > MESSAGE_PAGE_SIZE;
    const pageKeys = allKeys.slice(-MESSAGE_PAGE_SIZE);
    const msgs = (await db.messages.bulkGet(pageKeys)).filter(Boolean) as DcDmMessage[];
    currentMessages.value = msgs;
  }

  /**
   * Load older messages (infinite scroll upward)
   */
  async function loadMoreMessages(): Promise<void> {
    if (!currentConversationId.value || !hasMoreMessages.value || isLoadingMore.value) return;
    isLoadingMore.value = true;

    const convId = currentConversationId.value;
    const db = getDmDatabase(myUserId);
    const oldestId = currentMessages.value[0]?.id;
    if (oldestId === undefined) { isLoadingMore.value = false; return; }

    const allKeys = await db.messages
      .where('conversationId')
      .equals(convId)
      .primaryKeys() as number[];
    const olderKeys = allKeys.filter(k => k < oldestId);

    hasMoreMessages.value = olderKeys.length > MESSAGE_PAGE_SIZE;
    const batchKeys = olderKeys.slice(-MESSAGE_PAGE_SIZE);
    const older = (await db.messages.bulkGet(batchKeys)).filter(Boolean) as DcDmMessage[];

    currentMessages.value = [...older, ...currentMessages.value];
    isLoadingMore.value = false;
  }

  /**
   * Send a message in the current conversation
   */
  async function sendMessage(text: string): Promise<boolean> {
    if (!currentConversationId.value || !manager) return false;

    const conv = conversations.value.find(c => c.id === currentConversationId.value);
    if (!conv) return false;

    const db = getDmDatabase(myUserId);
    const convId = currentConversationId.value;

    // Save to local DB
    const msg: DcDmMessage = {
      conversationId: convId,
      senderId: myUserId,
      senderNickname: myNickname,
      text,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    const id = await db.messages.add(msg);
    msg.id = id;
    currentMessages.value = [...currentMessages.value, msg];

    // Update conversation
    await db.conversations.update(convId, {
      lastMessage: text,
      lastTimestamp: msg.timestamp,
    });
    await loadConversations();

    // Send via DataChannel (pass DB id so offline queue can mark it when flushed)
    const envelope = await manager.sendMessage(conv.peerUserId, text, id);
    if (envelope) {
      // Update status
      const state = manager.getConnectionState(conv.peerUserId);
      const newStatus = state === 'connected' ? 'sent' : 'pending';
      await db.messages.update(id, { status: newStatus });
      const msgIdx = currentMessages.value.findIndex(m => m.id === id);
      if (msgIdx !== -1) {
        currentMessages.value[msgIdx] = { ...currentMessages.value[msgIdx], status: newStatus };
        currentMessages.value = [...currentMessages.value];
      }
    }

    return true;
  }

  // ==================== FILE TRANSFER ====================

  /** Max file size: 100 MB */
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  /**
   * Send a file to the peer in the current conversation
   */
  async function sendFile(file: File): Promise<boolean> {
    if (!currentConversationId.value || !manager) return false;
    if (file.size > MAX_FILE_SIZE) return false;

    const conv = conversations.value.find(c => c.id === currentConversationId.value);
    if (!conv) return false;

    const db = getDmDatabase(myUserId);
    const convId = currentConversationId.value;
    const fileId = crypto.randomUUID();

    // Add file message to chat immediately (shows progress)
    const msg: DcDmMessage = {
      conversationId: convId,
      senderId: myUserId,
      senderNickname: myNickname,
      text: '',
      timestamp: new Date().toISOString(),
      status: 'pending',
      type: 'file',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type || 'application/octet-stream',
      fileBlob: file,
      fileProgress: 0,
      fileStatus: 'sending',
    };

    const id = await db.messages.add(msg);
    msg.id = id;
    currentMessages.value = [...currentMessages.value, msg];

    // Update conversation last message
    await db.conversations.update(convId, {
      lastMessage: `📎 ${file.name}`,
      lastTimestamp: msg.timestamp,
    });
    await loadConversations();

    // Send via DataChannel
    const ok = await manager.sendFile(conv.peerUserId, file, fileId, (progress) => {
      // Update progress in currentMessages reactively
      const idx = currentMessages.value.findIndex(m => m.id === id);
      if (idx !== -1) {
        currentMessages.value[idx] = { ...currentMessages.value[idx], fileProgress: progress };
        currentMessages.value = [...currentMessages.value];
      }
    });

    // Update final status
    const finalStatus = ok ? 'done' : 'error';
    await db.messages.update(id, { fileStatus: finalStatus, fileProgress: ok ? 100 : 0, status: 'sent' });
    const idx = currentMessages.value.findIndex(m => m.id === id);
    if (idx !== -1) {
      currentMessages.value[idx] = { ...currentMessages.value[idx], fileStatus: finalStatus, fileProgress: ok ? 100 : 0, status: 'sent' };
      currentMessages.value = [...currentMessages.value];
    }

    return ok;
  }

  // ==================== FILE EVENT HANDLERS ====================

  async function handleIncomingFileStart(
    fromNickname: string, fromUserId: string,
    fileId: string, fileName: string, fileSize: number, fileMimeType: string
  ): Promise<void> {
    const convId = getConversationId(myUserId, fromUserId);
    const db = getDmDatabase(myUserId);

    const msg: DcDmMessage = {
      conversationId: convId,
      senderId: fromUserId,
      senderNickname: fromNickname,
      text: '',
      timestamp: new Date().toISOString(),
      status: 'delivered',
      type: 'file',
      fileId,
      fileName,
      fileSize,
      fileMimeType,
      fileProgress: 0,
      fileStatus: 'receiving',
    };

    const id = await db.messages.add(msg);
    msg.id = id;

    await upsertConversation(convId, fromUserId, fromNickname, `📎 ${fileName}`, msg.timestamp);

    if (currentConversationId.value === convId) {
      currentMessages.value = [...currentMessages.value, msg];
    } else {
      notify({ title: `💬 ${fromNickname}`, text: `📎 ${fileName}`, type: 'success', duration: 6000 });
    }
  }

  function handleIncomingFileProgress(fileId: string, receivedChunks: number, totalChunks: number): void {
    const progress = Math.round((receivedChunks / totalChunks) * 100);
    const idx = currentMessages.value.findIndex(m => m.fileId === fileId);
    if (idx !== -1) {
      currentMessages.value[idx] = { ...currentMessages.value[idx], fileProgress: progress };
      currentMessages.value = [...currentMessages.value];
    }
  }

  async function handleIncomingFileComplete(
    fromNickname: string, fromUserId: string,
    fileId: string, blob: Blob, fileName: string, fileMimeType: string
  ): Promise<void> {
    const db = getDmDatabase(myUserId);
    const idx = currentMessages.value.findIndex(m => m.fileId === fileId);
    if (idx !== -1) {
      const msgId = currentMessages.value[idx].id;
      if (msgId) {
        await db.messages.update(msgId, { fileBlob: blob, fileStatus: 'done', fileProgress: 100 });
      }
      currentMessages.value[idx] = {
        ...currentMessages.value[idx],
        fileBlob: blob,
        fileStatus: 'done',
        fileProgress: 100,
      };
      currentMessages.value = [...currentMessages.value];
    }
  }

  function handleFileCancelled(fileId: string): void {
    const idx = currentMessages.value.findIndex(m => m.fileId === fileId);
    if (idx !== -1) {
      currentMessages.value[idx] = { ...currentMessages.value[idx], fileStatus: 'cancelled', fileProgress: 0 };
      currentMessages.value = [...currentMessages.value];
    }
  }

  // ==================== CALL METHODS ====================

  async function startCall(peerUserId: string, peerNickname: string, withVideo: boolean): Promise<boolean> {
    // If peer is reachable via DataChannel, use DC signaling (C# ↔ Browser)
    if (manager && connectionStates.value[peerUserId] === 'connected') {
      dcCallActive.value = true;
      dcCallInitiator = true;
      dcCallPeerUserId = peerUserId;
      callPeerNickname.value = peerNickname;
      callWithVideo.value = false; // DC calls are audio-only
      callState.value = 'calling';
      sendDcCallMsg(peerUserId, 'call_request');
      return true;
    }
    // Fallback to Appwrite signaling
    if (!callManager) return false;
    callPeerNickname.value = peerNickname;
    callWithVideo.value = withVideo;
    return callManager.startCall(peerUserId, peerNickname, withVideo);
  }

  async function acceptCall(): Promise<void> {
    if (dcCallActive.value && incomingCall.value) {
      const peerId = incomingCall.value.fromUserId;
      incomingCall.value = null;
      sendDcCallMsg(peerId, 'call_accept');
      // Peer (the caller) will now send call_offer, we handle it in handleDcCallOffer
      return;
    }
    if (!callManager) return;
    await callManager.acceptCall();
  }

  async function rejectCall(): Promise<void> {
    if (dcCallActive.value && incomingCall.value) {
      const peerId = incomingCall.value.fromUserId;
      sendDcCallMsg(peerId, 'call_decline');
      callState.value = 'idle';
      cleanupDcCall();
      return;
    }
    if (!callManager) return;
    await callManager.rejectCall();
    incomingCall.value = null;
  }

  async function hangupCall(): Promise<void> {
    if (dcCallActive.value) {
      sendDcCallMsg(dcCallPeerUserId, 'call_end');
      callState.value = 'idle';
      cleanupDcCall();
      return;
    }
    if (!callManager) return;
    await callManager.hangup();
  }

  function toggleCallMute(): boolean {
    if (dcCallActive.value) {
      const newMuted = !callMuted.value;
      dcLocalStream?.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
      callMuted.value = newMuted;
      return newMuted;
    }
    if (!callManager) return callMuted.value;
    const muted = callManager.toggleMute();
    callMuted.value = muted;
    return muted;
  }

  function toggleCallVideo(): boolean {
    if (!callManager) return callVideoOff.value;
    const videoOff = callManager.toggleVideo();
    callVideoOff.value = videoOff;
    return videoOff;
  }

  // ==================== DC CALL HANDLERS ====================

  function handleDcCallRequest(fromUserId: string, fromNickname: string): void {
    incomingCall.value = { fromUserId, fromNickname, withVideo: false };
    callPeerNickname.value = fromNickname;
    callWithVideo.value = false;
    callState.value = 'ringing';
    dcCallActive.value = true;
    dcCallInitiator = false;
    dcCallPeerUserId = fromUserId;
    notify({ title: `📞 ${fromNickname}`, text: 'Bejövő hívás…', type: 'success', duration: 30000 });
  }

  async function handleDcCallAccept(fromUserId: string): Promise<void> {
    if (!dcCallInitiator || dcCallPeerUserId !== fromUserId) return;
    callState.value = 'connected';
    try {
      await createAndSendDcOffer(fromUserId);
    } catch (err) {
      console.error('[DcCall] Failed to create offer:', err);
      sendDcCallMsg(fromUserId, 'call_end');
      callState.value = 'idle';
      cleanupDcCall();
    }
  }

  function handleDcCallDecline(fromUserId: string): void {
    if (dcCallPeerUserId !== fromUserId) return;
    callState.value = 'idle';
    cleanupDcCall();
    notify({ title: 'Hívás', text: 'A hívást visszautasították', type: 'warn', duration: 4000 });
  }

  function handleDcCallEnd(fromUserId: string): void {
    if (dcCallPeerUserId !== fromUserId) return;
    callState.value = 'idle';
    cleanupDcCall();
  }

  async function handleDcCallOffer(fromUserId: string, sdp: string): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dcLocalStream = stream;
      localCallStream.value = stream;

      const pc = createDcCallPc(fromUserId, stream);
      dcCallPc = pc;

      for (const ice of dcCallPendingIce) {
        await pc.addIceCandidate(new RTCIceCandidate(ice)).catch(console.warn);
      }
      dcCallPendingIce = [];

      await pc.setRemoteDescription({ type: 'offer', sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendDcCallMsg(fromUserId, 'call_answer', { sdp: answer.sdp });
      callState.value = 'connected';
    } catch (err) {
      console.error('[DcCall] handleDcCallOffer error:', err);
      sendDcCallMsg(fromUserId, 'call_end');
      callState.value = 'idle';
      cleanupDcCall();
    }
  }

  async function handleDcCallAnswer(fromUserId: string, sdp: string): Promise<void> {
    if (!dcCallPc) return;
    try {
      await dcCallPc.setRemoteDescription({ type: 'answer', sdp });
      for (const ice of dcCallPendingIce) {
        await dcCallPc.addIceCandidate(new RTCIceCandidate(ice)).catch(console.warn);
      }
      dcCallPendingIce = [];
    } catch (err) {
      console.error('[DcCall] handleDcCallAnswer error:', err);
    }
  }

  async function handleDcCallIce(fromUserId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (dcCallPc && dcCallPc.remoteDescription) {
      await dcCallPc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
    } else {
      dcCallPendingIce.push(candidate);
    }
  }

  // ─── DC Call Helpers ───────────────────────────────────────────────────────

  function createDcCallPc(peerUserId: string, localStream: MediaStream): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
    pc.ontrack = (ev) => {
      remoteCallStream.value = ev.streams[0] ?? new MediaStream([ev.track]);
    };
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        sendDcCallMsg(peerUserId, 'call_ice', { candidate: ev.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn('[DcCall] Connection state:', pc.connectionState);
        if (dcCallActive.value) {
          callState.value = 'idle';
          cleanupDcCall();
        }
      }
    };
    return pc;
  }

  async function createAndSendDcOffer(peerUserId: string): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    dcLocalStream = stream;
    localCallStream.value = stream;

    const pc = createDcCallPc(peerUserId, stream);
    dcCallPc = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendDcCallMsg(peerUserId, 'call_offer', { sdp: offer.sdp });
  }

  function sendDcCallMsg(peerUserId: string, type: string, extra?: object): void {
    manager?.sendDcCallMsg(peerUserId, type, extra);
  }

  function cleanupDcCall(): void {
    dcCallPc?.close();
    dcCallPc = null;
    dcLocalStream?.getTracks().forEach(t => t.stop());
    dcLocalStream = null;
    dcCallPendingIce = [];
    dcCallActive.value = false;
    dcCallInitiator = false;
    dcCallPeerUserId = '';
    incomingCall.value = null;
    localCallStream.value = null;
    remoteCallStream.value = null;
    callMuted.value = false;
  }

  /**
   * Activate DM mode (switch UI from server view to DM view)
   */
  function activateDm(): void {
    dmActive.value = true;
  }

  /**
   * Deactivate DM mode
   */
  function deactivateDm(): void {
    dmActive.value = false;
    currentConversationId.value = null;
    currentMessages.value = [];
  }

  /**
   * Cleanup
   */
  function destroy(): void {
    cleanupDcCall();
    manager?.destroy();
    manager = null;
    callManager?.destroy();
    callManager = null;
    closeDmDatabase();
    initialized.value = false;
    contacts.value = [];
    conversations.value = [];
    currentMessages.value = [];
    currentConversationId.value = null;
    dmActive.value = false;
    callState.value = 'idle';
    incomingCall.value = null;
    localCallStream.value = null;
    remoteCallStream.value = null;

    for (const t of Object.values(typingTimeouts)) clearTimeout(t);
    typingTimeouts = {};
  }

  // ==================== INTERNAL HANDLERS ====================

  async function upsertConversation(
    convId: string, peerUserId: string, peerNickname: string,
    lastMessage: string, timestamp: string
  ): Promise<void> {
    const db = getDmDatabase(myUserId);
    const isCurrentConv = currentConversationId.value === convId;
    const existing = await db.conversations.get(convId);

    if (existing) {
      await db.conversations.update(convId, {
        lastMessage,
        lastTimestamp: timestamp,
        unreadCount: isCurrentConv ? 0 : existing.unreadCount + 1,
      });
    } else {
      await db.conversations.put({
        id: convId,
        peerUserId,
        peerNickname,
        lastMessage,
        lastTimestamp: timestamp,
        unreadCount: isCurrentConv ? 0 : 1,
      });
    }

    await loadConversations();
  }

  async function handleIncomingMessage(fromNickname: string, fromUserId: string, text: string, envelope: DcDmEnvelope): Promise<void> {
    const convId = getConversationId(myUserId, fromUserId);
    const db = getDmDatabase(myUserId);

    const msg: DcDmMessage = {
      conversationId: convId,
      senderId: fromUserId,
      senderNickname: fromNickname,
      text,
      timestamp: envelope.timestamp || new Date().toISOString(),
      status: 'delivered',
    };

    await db.messages.add(msg);
    await upsertConversation(convId, fromUserId, fromNickname, text, msg.timestamp);

    if (currentConversationId.value === convId) {
      currentMessages.value = [...currentMessages.value, msg];
    } else {
      const preview = text.length > 60 ? text.substring(0, 60) + '…' : text;
      notify({ title: `💬 ${fromNickname}`, text: preview, type: 'success', duration: 6000 });
    }
  }

  function handleAck(_fromNickname: string, _messageId: number): void {
    // Could update message status to 'delivered' here
  }

  function handleTyping(fromNickname: string): void {
    const peerUserId = Object.keys(connectionStates.value).find(
      uid => contacts.value.some(c => c.contact_id === uid && c.contact_nickname === fromNickname)
    );
    if (!peerUserId) return;

    typingPeers.value = { ...typingPeers.value, [peerUserId]: true };

    if (typingTimeouts[peerUserId]) clearTimeout(typingTimeouts[peerUserId]);
    typingTimeouts[peerUserId] = setTimeout(() => {
      const { [peerUserId]: _, ...rest } = typingPeers.value;
      typingPeers.value = rest;
    }, 3000);
  }

  function handleConnectionStateChanged(peerUserId: string, state: DmConnectionState): void {
    connectionStates.value = { ...connectionStates.value, [peerUserId]: state };
  }

  /**
   * Called when the DataChannel opens.
   * 1. Marks in-memory flushed messages as 'sent' in DB (so they aren't re-sent from DB).
   * 2. Resends any remaining 'pending' messages from DB (e.g. after page reload).
   */
  async function handlePeerConnected(peerUserId: string, flushedDbIds: number[]): Promise<void> {
    if (!myUserId || !manager) return;
    const db = getDmDatabase(myUserId);

    // Step 1: mark in-memory-flushed messages as 'sent' to prevent duplicate DB retry
    if (flushedDbIds.length > 0) {
      let changed = false;
      for (const msgId of flushedDbIds) {
        await db.messages.update(msgId, { status: 'sent' });
        const idx = currentMessages.value.findIndex(m => m.id === msgId);
        if (idx !== -1) {
          currentMessages.value[idx] = { ...currentMessages.value[idx], status: 'sent' };
          changed = true;
        }
      }
      if (changed) currentMessages.value = [...currentMessages.value];
    }

    // Step 2: resend any text messages still pending in DB (from a previous session)
    const convId = getConversationId(myUserId, peerUserId);
    const allMsgs = await db.messages.where('conversationId').equals(convId).toArray();
    const pending = allMsgs.filter(
      m => m.status === 'pending' && m.senderId === myUserId && m.type !== 'file'
    );
    if (pending.length === 0) return;

    console.log('[DM] Resending', pending.length, 'pending messages from DB to:', peerUserId);
    for (const msg of pending) {
      if (!msg.text) continue;
      const envelope = await manager.sendMessage(peerUserId, msg.text, msg.id);
      if (envelope && msg.id) {
        await db.messages.update(msg.id, { status: 'sent' });
        const idx = currentMessages.value.findIndex(m => m.id === msg.id);
        if (idx !== -1) {
          currentMessages.value[idx] = { ...currentMessages.value[idx], status: 'sent' };
          currentMessages.value = [...currentMessages.value];
        }
      }
    }
  }

  async function loadContacts(): Promise<void> {
    if (!myUserId) return;
    const docs = await chatService.getContacts(myUserId);
    contacts.value = docs as unknown as DcContact[];
  }

  async function loadConversations(): Promise<void> {
    if (!myUserId) return;
    const db = getDmDatabase(myUserId);
    const convs = await db.conversations.orderBy('lastTimestamp').reverse().toArray();
    conversations.value = convs;
  }

  // ==================== HELPERS ====================

  function getConversationId(userA: string, userB: string): string {
    return [userA, userB].sort().join('_');
  }

  function sendTyping(): void {
    if (!currentConversationId.value || !manager) return;
    const conv = conversations.value.find(c => c.id === currentConversationId.value);
    if (conv) {
      manager.sendTyping(conv.peerUserId);
    }
  }

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    // DM State
    contacts,
    conversations,
    currentMessages,
    currentConversationId,
    connectionStates,
    dmActive,
    initialized,
    unreadTotal,
    typingPeers,

    // DM Actions
    initializeCallManager,
    initialize,
    searchUsers,
    addContact,
    removeContact,
    openConversation,
    loadMoreMessages,
    sendMessage,
    sendFile,
    sendTyping,
    activateDm,
    deactivateDm,
    destroy,
    MAX_FILE_SIZE,
    hasMoreMessages,
    isLoadingMore,

    // Call State
    callState,
    incomingCall,
    localCallStream,
    remoteCallStream,
    callPeerNickname,
    callWithVideo,
    callMuted,
    callVideoOff,

    // Call Actions
    startCall,
    acceptCall,
    rejectCall,
    hangupCall,
    toggleCallMute,
    toggleCallVideo,
  };
}
