/**
 * WebRTC Voice Manager
 * Handles peer-to-peer audio connections, camera, and screen sharing
 */

import { DcChatService } from '@/services/DcChatService';
import { playJoinSound, playLeaveSound, playScreenShareSound, playSoundboardSound } from './voiceSounds';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export interface VoiceEvents {
  onUserJoined?: (nickname: string) => void;
  onUserLeft?: (nickname: string) => void;
  onMuteChanged?: (muted: boolean) => void;
  onCameraChanged?: (active: boolean) => void;
  onScreenShareChanged?: (active: boolean, nickname?: string) => void;
  onRemoteScreenStream?: (nickname: string, stream: MediaStream | null) => void;
  onRemoteCameraStream?: (nickname: string, stream: MediaStream | null) => void;
  onSoundboardPlayed?: (nickname: string, soundId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Minify SDP to reduce payload size.
 * Removes non-essential lines (extmap, rtcp-fb for secondary codecs, etc.)
 * while keeping the SDP valid and functional.
 */
function minifySdp(sdp: string): string {
  const lines = sdp.split('\r\n');
  const result: string[] = [];
  for (const line of lines) {
    // Skip header extensions (not needed for basic audio/video)
    if (line.startsWith('a=extmap:')) continue;
    if (line.startsWith('a=extmap-allow-mixed')) continue;
    // Skip RTCP feedback for secondary codecs (keep first video codec's feedback)
    // Skip SSRC info lines (not essential)
    if (line.startsWith('a=ssrc:') && line.includes('cname:')) {
      result.push(line);
      continue;
    }
    if (line.startsWith('a=ssrc:')) continue;
    // Keep everything else
    result.push(line);
  }
  return result.join('\r\n');
}

export class VoiceManager {
  private chatService: DcChatService;
  private localStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private remoteAudios: Map<string, HTMLAudioElement> = new Map();
  private nickname: string = '';
  private channelId: string = '';
  private signalingUnsub: (() => void) | null = null;
  private events: VoiceEvents = {};
  private _isMuted: boolean = false;
  private _isCameraOn: boolean = false;
  private _isScreenSharing: boolean = false;
  private _isConnected: boolean = false;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isRenegotiating: Set<string> = new Set();
  // Track which stream IDs correspond to camera vs screen share
  private cameraStreamId: string = '';
  private screenStreamId: string = '';

  constructor(chatService: DcChatService, events: VoiceEvents = {}) {
    this.chatService = chatService;
    this.events = events;
  }

  get isMuted(): boolean { return this._isMuted; }
  get isCameraOn(): boolean { return this._isCameraOn; }
  get isScreenSharing(): boolean { return this._isScreenSharing; }
  get localCameraStream(): MediaStream | null { return this.cameraStream; }
  get localScreenStream(): MediaStream | null { return this.screenStream; }
  get isConnected(): boolean { return this._isConnected; }

  /**
   * Join a voice channel
   */
  async joinChannel(channelId: string, nickname: string): Promise<boolean> {
    try {
      this.channelId = channelId;
      this.nickname = nickname;

      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this._isConnected = true;

      // Subscribe to voice signaling
      this.signalingUnsub = this.chatService.subscribeToVoiceSignaling(
        this.nickname,
        (type, from, channelOrTarget, data) => this.handleSignal(type, from, channelOrTarget, data)
      );

      // Announce join
      await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_JOIN', channelId);

      // Start heartbeat (every 45s) so others know we're still here
      this.startHeartbeat();

      playJoinSound();
      console.log('[Voice] Joined channel:', channelId);
      return true;
    } catch (error: any) {
      console.error('[Voice] Failed to join voice channel:', error);
      this.events.onError?.(error.message || 'Mikrofon hozzáférés megtagadva');
      return false;
    }
  }

  /**
   * Leave the current voice channel
   */
  async leaveChannel(): Promise<void> {
    if (!this._isConnected) return;

    // Stop camera if active
    if (this._isCameraOn) {
      await this.stopCamera();
    }

    // Stop screen sharing if active
    if (this._isScreenSharing) {
      await this.stopScreenShare();
    }

    // Notify others
    if (this.channelId) {
      await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_LEAVE', this.channelId);
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peers.forEach((pc, peerId) => {
      pc.close();
      const audio = this.remoteAudios.get(peerId);
      if (audio) {
        audio.srcObject = null;
        audio.remove();
      }
    });
    this.peers.clear();
    this.remoteAudios.clear();

    // Stop heartbeat
    this.stopHeartbeat();

    // Unsubscribe from signaling
    this.signalingUnsub?.();
    this.signalingUnsub = null;

    this._isConnected = false;
    this._isMuted = false;
    this.channelId = '';

    playLeaveSound();
    console.log('[Voice] Left channel');
  }

  /**
   * Toggle microphone mute
   */
  toggleMute(): boolean {
    if (!this.localStream) return this._isMuted;

    this._isMuted = !this._isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this._isMuted;
    });

    this.events.onMuteChanged?.(this._isMuted);
    return this._isMuted;
  }

  /**
   * Toggle camera (video)
   */
  async toggleCamera(): Promise<boolean> {
    if (this._isCameraOn) {
      await this.stopCamera();
      return false;
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });

      this.cameraStreamId = this.cameraStream.id;
      console.log('[Voice] Camera stream acquired, id:', this.cameraStreamId);

      const videoTrack = this.cameraStream.getVideoTracks()[0];

      // Add track to all peers and renegotiate
      for (const [peerId, pc] of this.peers) {
        pc.addTrack(videoTrack, this.cameraStream);
        console.log('[Voice] Added camera track to peer:', peerId, 'senders:', pc.getSenders().length);
        await this.renegotiate(peerId, pc);
      }

      this._isCameraOn = true;
      this.events.onCameraChanged?.(true);

      // Notify others with stream ID so they can differentiate
      await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_CAMERA_START', this.channelId, { streamId: this.cameraStreamId });
      return true;
    } catch (error: any) {
      console.error('[Voice] Camera failed:', error);
      if (error.name !== 'NotAllowedError') {
        this.events.onError?.(error.message || 'Kamera hozzáférés megtagadva');
      }
      return false;
    }
  }

  /**
   * Remove a stream's tracks from all peers and renegotiate
   */
  private async removeStreamFromPeers(stream: MediaStream): Promise<void> {
    for (const [peerId, pc] of this.peers) {
      stream.getTracks().forEach(track => {
        const sender = pc.getSenders().find(s => s.track === track);
        if (sender) pc.removeTrack(sender);
      });
      await this.renegotiate(peerId, pc);
    }
    stream.getTracks().forEach(track => track.stop());
  }

  /**
   * Stop camera
   */
  private async stopCamera(): Promise<void> {
    if (!this.cameraStream) return;

    await this.removeStreamFromPeers(this.cameraStream);
    this.cameraStream = null;
    this.cameraStreamId = '';
    this._isCameraOn = false;
    this.events.onCameraChanged?.(false);

    await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_CAMERA_STOP', this.channelId);
    console.log('[Voice] Camera stopped');
  }

  /**
   * Toggle screen sharing with optional quality settings
   */
  async toggleScreenShare(settings?: { resolution?: number; fps?: number; audio?: boolean }): Promise<boolean> {
    if (this._isScreenSharing) {
      await this.stopScreenShare();
      return false;
    }

    try {
      const resolution = settings?.resolution || 720;
      const fps = settings?.fps || 30;
      const includeAudio = settings?.audio || false;

      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          width: { ideal: resolution >= 1080 ? 1920 : resolution >= 720 ? 1280 : 854 },
          height: { ideal: resolution },
          frameRate: { ideal: fps, max: fps },
        } as any,
        audio: includeAudio
      });

      this.screenStreamId = this.screenStream.id;
      console.log('[Voice] Screen share stream acquired, id:', this.screenStreamId);

      // When user stops sharing via browser UI
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      // Add all screen tracks to peers and renegotiate
      for (const [peerId, pc] of this.peers) {
        this.screenStream.getTracks().forEach(track => {
          pc.addTrack(track, this.screenStream!);
        });
        console.log('[Voice] Added screen tracks to peer:', peerId);
        await this.renegotiate(peerId, pc);
      }

      this._isScreenSharing = true;
      this.events.onScreenShareChanged?.(true, this.nickname);

      // Notify others with stream ID
      await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_SCREEN_START', this.channelId, { streamId: this.screenStreamId });

      playScreenShareSound();
      return true;
    } catch (error: any) {
      console.error('[Voice] Screen share failed:', error);
      if (error.name !== 'NotAllowedError') {
        this.events.onError?.(error.message || 'Képernyőmegosztás sikertelen');
      }
      return false;
    }
  }

  /**
   * Stop screen sharing
   */
  private async stopScreenShare(): Promise<void> {
    if (!this.screenStream) return;

    await this.removeStreamFromPeers(this.screenStream);
    this.screenStream = null;
    this.screenStreamId = '';
    this._isScreenSharing = false;
    this.events.onScreenShareChanged?.(false);

    // Notify others
    await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_SCREEN_STOP', this.channelId);
    console.log('[Voice] Screen share stopped');
  }

  /**
   * Play a soundboard sound and broadcast to all peers
   */
  async playSoundboard(soundId: string): Promise<void> {
    // Play locally
    playSoundboardSound(soundId);
    // Broadcast to others
    await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_SOUNDBOARD', this.channelId, { soundId });
  }

  /**
   * Serialize an SDP for signaling (explicit extraction + minification)
   */
  private serializeSdp(desc: RTCSessionDescription | null): { type: string; sdp: string } | null {
    if (!desc || !desc.sdp) return null;
    return { type: desc.type, sdp: minifySdp(desc.sdp) };
  }

  /**
   * Renegotiate a peer connection (new offer/answer exchange)
   * Required after addTrack/removeTrack on an established connection
   */
  private async renegotiate(peerId: string, pc: RTCPeerConnection): Promise<void> {
    if (this.isRenegotiating.has(peerId)) {
      console.warn('[Voice] Already renegotiating with:', peerId);
      return;
    }
    this.isRenegotiating.add(peerId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpData = this.serializeSdp(pc.localDescription);
      if (!sdpData) {
        console.error('[Voice] No local description after createOffer for:', peerId);
        return;
      }

      console.log('[Voice] Sending renegotiation offer to:', peerId, 'SDP length:', sdpData.sdp.length);

      const sent = await this.chatService.sendVoiceSignal(
        this.nickname,
        'VOICE_OFFER',
        peerId,
        sdpData
      );
      if (!sent) {
        console.error('[Voice] Failed to send renegotiation offer to:', peerId, '(message send returned null - payload too large?)');
      }
    } catch (error) {
      console.error(`[Voice] Renegotiation failed for ${peerId}:`, error);
    } finally {
      this.isRenegotiating.delete(peerId);
    }
  }

  /**
   * Handle incoming signaling messages
   */
  private async handleSignal(type: string, from: string, channelOrTarget: string, data?: any): Promise<void> {
    switch (type) {
      case 'VOICE_JOIN':
        if (channelOrTarget === this.channelId) {
          // Someone joined our channel - create offer for them
          console.log('[Voice] User joined:', from);
          this.events.onUserJoined?.(from);
          playJoinSound();
          await this.createOffer(from);
        }
        break;

      case 'VOICE_LEAVE':
        if (channelOrTarget === this.channelId) {
          console.log('[Voice] User left:', from);
          this.events.onUserLeft?.(from);
          playLeaveSound();
          this.removePeer(from);
        }
        break;

      case 'VOICE_OFFER':
        console.log('[Voice] Received offer from:', from);
        await this.handleOffer(from, data);
        break;

      case 'VOICE_ANSWER':
        console.log('[Voice] Received answer from:', from);
        await this.handleAnswer(from, data);
        break;

      case 'VOICE_ICE':
        await this.handleIceCandidate(from, data);
        break;

      case 'VOICE_SCREEN_START':
        if (channelOrTarget === this.channelId) {
          console.log('[Voice] Screen share started by:', from, 'streamId:', data?.streamId);
          this.events.onScreenShareChanged?.(true, from);
        }
        break;

      case 'VOICE_SCREEN_STOP':
        if (channelOrTarget === this.channelId) {
          console.log('[Voice] Screen share stopped by:', from);
          this.events.onScreenShareChanged?.(false, from);
          this.events.onRemoteScreenStream?.(from, null);
        }
        break;

      case 'VOICE_CAMERA_START':
        if (channelOrTarget === this.channelId) {
          console.log('[Voice] Camera started by:', from, 'streamId:', data?.streamId);
          this.events.onCameraChanged?.(true);
          this.events.onRemoteCameraStream?.(from, null); // Signal camera start, stream comes via ontrack
        }
        break;

      case 'VOICE_CAMERA_STOP':
        if (channelOrTarget === this.channelId) {
          console.log('[Voice] Camera stopped by:', from);
          this.events.onCameraChanged?.(false);
          this.events.onRemoteCameraStream?.(from, null);
        }
        break;

      case 'VOICE_SOUNDBOARD':
        if (channelOrTarget === this.channelId && data?.soundId) {
          // Play the sound locally for the receiving user
          playSoundboardSound(data.soundId);
          this.events.onSoundboardPlayed?.(from, data.soundId);
        }
        break;

      case 'VOICE_PING':
        // Heartbeat from another user
        if (channelOrTarget === this.channelId && !this.peers.has(from)) {
          this.events.onUserJoined?.(from);
          await this.createOffer(from);
        }
        break;
    }
  }

  /**
   * Create a new RTCPeerConnection for a remote peer
   */
  private createPeerConnection(remotePeer: string): RTCPeerConnection {
    // Close existing connection if any
    const existing = this.peers.get(remotePeer);
    if (existing) {
      existing.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add all local tracks (audio, camera, screen share)
    for (const stream of [this.localStream, this.cameraStream, this.screenStream]) {
      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      }
    }

    // Handle incoming remote streams
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const track = event.track;

      console.log('[Voice] ontrack from:', remotePeer, 'kind:', track.kind, 'streamId:', stream?.id, 'trackId:', track.id, 'readyState:', track.readyState);

      if (!stream) {
        console.warn('[Voice] ontrack - no stream for track from:', remotePeer);
        return;
      }

      if (track.kind === 'audio') {
        // Create/update audio element for remote audio
        let audio = this.remoteAudios.get(remotePeer);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          this.remoteAudios.set(remotePeer, audio);
        }
        audio.srcObject = stream;
      } else if (track.kind === 'video') {
        console.log('[Voice] Video track received from:', remotePeer, 'stream.active:', stream.active, 'track.enabled:', track.enabled);

        // Notify UI about the video stream - it could be camera or screen share
        // The UI differentiates based on VOICE_CAMERA_START / VOICE_SCREEN_START signals
        this.events.onRemoteCameraStream?.(remotePeer, stream);
        this.events.onRemoteScreenStream?.(remotePeer, stream);

        track.onended = () => {
          console.log('[Voice] Video track ended from:', remotePeer);
          this.events.onRemoteCameraStream?.(remotePeer, null);
          this.events.onRemoteScreenStream?.(remotePeer, null);
        };

        track.onmute = () => {
          console.log('[Voice] Video track muted from:', remotePeer);
        };

        track.onunmute = () => {
          console.log('[Voice] Video track unmuted from:', remotePeer);
        };
      }
    };

    // Send ICE candidates to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.chatService.sendVoiceSignal(
          this.nickname,
          'VOICE_ICE',
          remotePeer,
          event.candidate.toJSON()
        );
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[Voice] Connection to ${remotePeer}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn(`[Voice] Peer connection to ${remotePeer}: ${pc.connectionState}`);
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`[Voice] Signaling state for ${remotePeer}: ${pc.signalingState}`);
    };

    pc.onnegotiationneeded = () => {
      console.log(`[Voice] Negotiation needed for ${remotePeer}`);
    };

    this.peers.set(remotePeer, pc);
    return pc;
  }

  /**
   * Create and send an SDP offer to a remote peer
   */
  private async createOffer(remotePeer: string): Promise<void> {
    try {
      const pc = this.createPeerConnection(remotePeer);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpData = this.serializeSdp(pc.localDescription);
      if (!sdpData) {
        console.error('[Voice] No local description for offer to:', remotePeer);
        return;
      }

      console.log('[Voice] Sending initial offer to:', remotePeer, 'SDP length:', sdpData.sdp.length);

      const sent = await this.chatService.sendVoiceSignal(
        this.nickname,
        'VOICE_OFFER',
        remotePeer,
        sdpData
      );
      if (!sent) {
        console.error('[Voice] Failed to send offer to:', remotePeer);
      }
    } catch (error) {
      console.error(`[Voice] Failed to create offer for ${remotePeer}:`, error);
    }
  }

  /**
   * Handle incoming SDP offer and send answer
   */
  private async handleOffer(from: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const existingPc = this.peers.get(from);
      let pc: RTCPeerConnection;

      if (existingPc && existingPc.signalingState !== 'closed') {
        console.log('[Voice] Renegotiation offer from:', from, 'current state:', existingPc.signalingState);
        if (existingPc.signalingState === 'have-local-offer') {
          console.log('[Voice] Glare detected - rolling back local offer for:', from);
          await existingPc.setLocalDescription({ type: 'rollback' } as any);
        }
        pc = existingPc;
      } else {
        console.log('[Voice] New connection offer from:', from);
        pc = this.createPeerConnection(from);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const sdpData = this.serializeSdp(pc.localDescription);
      if (!sdpData) {
        console.error('[Voice] No local description for answer to:', from);
        return;
      }

      console.log('[Voice] Sending answer to:', from, 'SDP length:', sdpData.sdp.length);
      const sent = await this.chatService.sendVoiceSignal(this.nickname, 'VOICE_ANSWER', from, sdpData);
      if (!sent) {
        console.error('[Voice] Failed to send answer to:', from);
      }
    } catch (error) {
      console.error(`[Voice] Failed to handle offer from ${from}:`, error);
    }
  }

  /**
   * Handle incoming SDP answer
   */
  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const pc = this.peers.get(from);
      if (!pc) {
        console.warn('[Voice] No peer connection for answer from:', from);
        return;
      }
      console.log('[Voice] handleAnswer from:', from, 'signaling state:', pc.signalingState);
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[Voice] Answer set successfully from:', from);
      } else {
        console.warn('[Voice] Ignoring answer from:', from, 'unexpected state:', pc.signalingState);
      }
    } catch (error) {
      console.error(`[Voice] Failed to handle answer from ${from}:`, error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const pc = this.peers.get(from);
      if (!pc) return;
      if (!pc.remoteDescription) {
        console.warn('[Voice] ICE candidate before remote description from:', from);
        return;
      }
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error(`[Voice] Failed to add ICE candidate from ${from}:`, error);
    }
  }

  /**
   * Remove a peer connection
   */
  private removePeer(nickname: string): void {
    const pc = this.peers.get(nickname);
    if (pc) {
      pc.close();
      this.peers.delete(nickname);
    }

    const audio = this.remoteAudios.get(nickname);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      this.remoteAudios.delete(nickname);
    }
  }

  /**
   * Start heartbeat to broadcast presence every 45 seconds
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this._isConnected && this.channelId) {
        this.chatService.sendVoiceSignal(this.nickname, 'VOICE_PING', this.channelId);
      }
    }, 45_000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Cleanup everything
   */
  destroy(): void {
    this.stopHeartbeat();
    this.leaveChannel();
  }
}
