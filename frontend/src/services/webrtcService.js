import Peer from 'simple-peer';

export class WebRTCService {
  constructor(wsClient, sessionId, isInitiator) {
    this.wsClient = wsClient;
    this.sessionId = sessionId;
    this.isInitiator = isInitiator;
    this.peer = null;
    this.localStream = null;
    this.remoteAudio = null;
  }

  async startAudioStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this.peer = new Peer({
        initiator: this.isInitiator,
        stream: this.localStream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('signal', (data) => {
        this.wsClient.sendWebRTC({
          type: 'signal',
          signal: data
        });
      });

      this.peer.on('stream', (remoteStream) => {
        if (!this.remoteAudio) {
          this.remoteAudio = new Audio();
          this.remoteAudio.srcObject = remoteStream;
          this.remoteAudio.play();
        }
      });

      this.peer.on('error', (err) => {
        console.error('WebRTC error:', err);
      });

      return true;
    } catch (err) {
      console.error('Failed to get audio stream:', err);
      return false;
    }
  }

  handleSignal(signal) {
    if (this.peer) {
      this.peer.signal(signal);
    }
  }

  stopAudioStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peer) {
      this.peer.destroy();
    }
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio = null;
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }
}