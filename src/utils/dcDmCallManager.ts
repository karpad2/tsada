/**
 * DM Voice/Video Call Manager
 * Handles 1-to-1 WebRTC audio/video calls over DM signaling
 */

import { DcChatService } from '@/services/DcChatService';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
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

/** Minimizes SDP payload size for Appwrite signaling */
function minifySdp(sdp: string): string {
  return sdp
    .split('\r\n')
    .filter(l => !l.startsWith('a=extmap:') && !l.startsWith('a=extmap-allow-mixed'))
    .join('\r\n');
}

export type DmCallState = 'idle' | 'calling' | 'ringing' | 'connected';

export interface DmCallEvents {
  onIncomingCall?: (fromUserId: string, fromNickname: string, withVideo: boolean) => void;
  onCallAccepted?: () => void;
  onCallRejected?: () => void;
  onCallEnded?: () => void;
  onCallStateChanged?: (state: DmCallState) => void;
  onRemoteStream?: (stream: MediaStream | null) => void;
  onLocalStream?: (stream: MediaStream | null) => void;
  onError?: (error: string) => void;
}

export class DcDmCallManager {
  private chatService: DcChatService;
  private myNickname: string = '';
  private myUserId: string = '';
  private events: DmCallEvents = {};

  private callState: DmCallState = 'idle';
  private peerNickname: string = '';
  private peerUserId: string = '';
  private withVideo: boolean = false;
  private isInitiator: boolean = false;

  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  private isMuted: boolean = false;
  private isVideoOff: boolean = false;

  private ringTimeout: ReturnType<typeof setTimeout> | null = null;
  private signalingUnsub: (() => void) | null = null;

  constructor(chatService: DcChatService, events: DmCallEvents = {}) {
    this.chatService = chatService;
    this.events = events;
  }

  initialize(nickname: string, userId: string): void {
    this.myNickname = nickname;
    this.myUserId = userId;

    this.signalingUnsub = this.chatService.subscribeToDmSignaling(
      this.myNickname,
      (type, from, data) => this.handleSignal(type, from, data)
    );

    console.log('[DmCall] Call manager initialized for:', nickname);
  }

  /** Initiate a call to a peer */
  async startCall(peerUserId: string, peerNickname: string, withVideo: boolean): Promise<boolean> {
    if (this.callState !== 'idle') {
      console.warn('[DmCall] Already in a call');
      return false;
    }

    this.peerNickname = peerNickname;
    this.peerUserId = peerUserId;
    this.withVideo = withVideo;
    this.isInitiator = true;

    // Acquire media first
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: withVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      });
      this.events.onLocalStream?.(this.localStream);
    } catch (error: any) {
      console.error('[DmCall] Media access failed:', error);
      this.events.onError?.(error.message || 'Mikrofon/kamera hozzáférés megtagadva');
      return false;
    }

    // Send call request signal
    await this.chatService.sendDmSignal(
      this.myNickname, 'DM_CALL_REQUEST', peerNickname,
      { withVideo, fromUserId: this.myUserId }
    );

    this.setCallState('calling');

    // Auto-cancel after 30 seconds if not answered
    this.ringTimeout = setTimeout(async () => {
      await this.hangup();
    }, 30_000);

    console.log('[DmCall] Call initiated to:', peerNickname, 'video:', withVideo);
    return true;
  }

  /** Accept an incoming call */
  async acceptCall(): Promise<void> {
    if (this.callState !== 'ringing') return;

    // Acquire media
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: this.withVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      });
      this.events.onLocalStream?.(this.localStream);
    } catch (error: any) {
      console.error('[DmCall] Media access failed on accept:', error);
      this.events.onError?.(error.message || 'Mikrofon/kamera hozzáférés megtagadva');
      await this.rejectCall();
      return;
    }

    this.clearRingTimeout();

    // Notify initiator we accepted - they will now send the WebRTC offer
    await this.chatService.sendDmSignal(
      this.myNickname, 'DM_CALL_ACCEPT', this.peerNickname,
      { fromUserId: this.myUserId }
    );

    this.setCallState('connected');
    console.log('[DmCall] Call accepted from:', this.peerNickname);
  }

  /** Reject an incoming call */
  async rejectCall(): Promise<void> {
    if (this.callState !== 'ringing') return;

    this.clearRingTimeout();

    await this.chatService.sendDmSignal(
      this.myNickname, 'DM_CALL_REJECT', this.peerNickname,
      { fromUserId: this.myUserId }
    );

    console.log('[DmCall] Call rejected from:', this.peerNickname);
    this.cleanupCall();
  }

  /** Hang up the current call */
  async hangup(): Promise<void> {
    if (this.callState === 'idle') return;

    if (this.peerNickname) {
      await this.chatService.sendDmSignal(
        this.myNickname, 'DM_CALL_HANGUP', this.peerNickname,
        { fromUserId: this.myUserId }
      );
    }

    console.log('[DmCall] Hanging up call with:', this.peerNickname);
    this.cleanupCall();
    this.events.onCallEnded?.();
  }

  /** Toggle microphone mute */
  toggleMute(): boolean {
    if (!this.localStream) return this.isMuted;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(t => { t.enabled = !this.isMuted; });
    return this.isMuted;
  }

  /** Toggle camera (video-only tracks) */
  toggleVideo(): boolean {
    if (!this.localStream) return this.isVideoOff;
    this.isVideoOff = !this.isVideoOff;
    this.localStream.getVideoTracks().forEach(t => { t.enabled = !this.isVideoOff; });
    return this.isVideoOff;
  }

  getCallState(): DmCallState { return this.callState; }
  getPeerNickname(): string { return this.peerNickname; }
  getPeerUserId(): string { return this.peerUserId; }
  isCallWithVideo(): boolean { return this.withVideo; }
  getLocalStream(): MediaStream | null { return this.localStream; }
  getRemoteStream(): MediaStream | null { return this.remoteStream; }
  isMicMuted(): boolean { return this.isMuted; }
  isVideoDisabled(): boolean { return this.isVideoOff; }

  destroy(): void {
    this.cleanupCall();
    this.signalingUnsub?.();
    this.signalingUnsub = null;
    console.log('[DmCall] Call manager destroyed');
  }

  // ==================== PRIVATE ====================

  private setCallState(state: DmCallState): void {
    this.callState = state;
    this.events.onCallStateChanged?.(state);
  }

  private clearRingTimeout(): void {
    if (this.ringTimeout) {
      clearTimeout(this.ringTimeout);
      this.ringTimeout = null;
    }
  }

  private cleanupCall(): void {
    this.clearRingTimeout();

    this.pc?.close();
    this.pc = null;

    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.events.onLocalStream?.(null);

    this.remoteStream = null;
    this.events.onRemoteStream?.(null);

    this.pendingIceCandidates = [];
    this.peerNickname = '';
    this.peerUserId = '';
    this.withVideo = false;
    this.isInitiator = false;
    this.isMuted = false;
    this.isVideoOff = false;

    this.setCallState('idle');
  }

  private createPeerConnection(): RTCPeerConnection {
    this.pc?.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote streams
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        this.remoteStream = stream;
        this.events.onRemoteStream?.(stream);
        console.log('[DmCall] Remote stream received, tracks:', stream.getTracks().length);
      }
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.peerNickname) {
        this.chatService.sendDmSignal(
          this.myNickname, 'DM_CALL_ICE', this.peerNickname,
          { candidate: event.candidate.toJSON(), fromUserId: this.myUserId }
        );
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[DmCall] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        this.setCallState('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn('[DmCall] Connection', pc.connectionState);
        this.hangup();
      }
    };

    this.pc = pc;
    return pc;
  }

  private async flushPendingIce(): Promise<void> {
    if (!this.pc || !this.pc.remoteDescription || this.pendingIceCandidates.length === 0) return;
    console.log('[DmCall] Flushing', this.pendingIceCandidates.length, 'buffered ICE candidates');
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // stale candidate
      }
    }
    this.pendingIceCandidates = [];
  }

  private async handleSignal(type: string, fromNickname: string, data: any): Promise<void> {
    switch (type) {
      case 'DM_CALL_REQUEST': {
        // Someone wants to call us
        if (this.callState !== 'idle') {
          // We're busy - auto-reject
          await this.chatService.sendDmSignal(
            this.myNickname, 'DM_CALL_REJECT', fromNickname,
            { fromUserId: this.myUserId, reason: 'busy' }
          );
          return;
        }

        this.peerNickname = fromNickname;
        this.peerUserId = data?.fromUserId || '';
        this.withVideo = data?.withVideo || false;
        this.isInitiator = false;

        // Auto-reject if unanswered after 30s
        this.ringTimeout = setTimeout(async () => {
          await this.rejectCall();
        }, 30_000);

        this.setCallState('ringing');
        this.events.onIncomingCall?.(this.peerUserId, fromNickname, this.withVideo);
        console.log('[DmCall] Incoming call from:', fromNickname, 'video:', this.withVideo);
        break;
      }

      case 'DM_CALL_ACCEPT': {
        // Peer accepted our call - now we (initiator) send the WebRTC offer
        if (this.callState !== 'calling') return;
        this.clearRingTimeout();
        this.events.onCallAccepted?.();

        const pc = this.createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdp = minifySdp(offer.sdp || '');
        await this.chatService.sendDmSignal(
          this.myNickname, 'DM_CALL_OFFER', this.peerNickname,
          { type: offer.type, sdp, fromUserId: this.myUserId }
        );

        console.log('[DmCall] Offer sent to:', this.peerNickname);
        break;
      }

      case 'DM_CALL_REJECT': {
        if (this.callState !== 'calling') return;
        this.clearRingTimeout();
        this.cleanupCall();
        this.events.onCallRejected?.();
        console.log('[DmCall] Call rejected by:', fromNickname, 'reason:', data?.reason);
        break;
      }

      case 'DM_CALL_HANGUP': {
        if (this.callState === 'idle') return;
        this.cleanupCall();
        this.events.onCallEnded?.();
        console.log('[DmCall] Call ended by:', fromNickname);
        break;
      }

      case 'DM_CALL_OFFER': {
        // We (responder) received the WebRTC offer from initiator after accepting
        if (this.callState !== 'connected') return;

        const pc = this.createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription({ type: data.type, sdp: data.sdp }));
        await this.flushPendingIce();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const sdp = minifySdp(answer.sdp || '');
        await this.chatService.sendDmSignal(
          this.myNickname, 'DM_CALL_ANSWER', this.peerNickname,
          { type: answer.type, sdp, fromUserId: this.myUserId }
        );

        console.log('[DmCall] Answer sent to:', this.peerNickname);
        break;
      }

      case 'DM_CALL_ANSWER': {
        // We (initiator) received the WebRTC answer
        if (!this.pc || this.pc.signalingState !== 'have-local-offer') return;

        await this.pc.setRemoteDescription(new RTCSessionDescription({ type: data.type, sdp: data.sdp }));
        await this.flushPendingIce();
        console.log('[DmCall] Answer received from:', fromNickname, '- WebRTC connecting...');
        break;
      }

      case 'DM_CALL_ICE': {
        if (!data?.candidate) return;

        if (!this.pc || !this.pc.remoteDescription) {
          // Buffer until remote description is set
          this.pendingIceCandidates.push(data.candidate);
          return;
        }

        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          // stale candidate, ignore
        }
        break;
      }
    }
  }
}
