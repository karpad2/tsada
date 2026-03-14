/**
 * Voice Chat Sound Effects
 * AudioContext-based synthesized sounds for join/leave events and soundboard
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export interface SoundboardSound {
  id: string;
  name: string;
  emoji: string;
  play: () => void;
}

/**
 * Discord-style join sound - rising two-tone beep
 */
export function playJoinSound(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First tone (lower)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone (higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.25);
  } catch (e) {
    console.warn('Failed to play join sound:', e);
  }
}

/**
 * Discord-style leave sound - falling single tone
 */
export function playLeaveSound(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn('Failed to play leave sound:', e);
  }
}

/**
 * Short notification beep for screen share start
 */
export function playScreenShareSound(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.08);
    osc.frequency.setValueAtTime(880, now + 0.16);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn('Failed to play screen share sound:', e);
  }
}

// --- Soundboard ---

function playSoundAirhorn(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520 + i * 10, now);
      osc.frequency.linearRampToValueAtTime(580 + i * 10, now + 0.8);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.setValueAtTime(0.06, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    }
  } catch (e) { console.warn('Soundboard error:', e); }
}

function playSoundBaDumTss(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    // Ba
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(150, now);
    g1.gain.setValueAtTime(0.2, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.15);
    // Dum
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(120, now + 0.2);
    g2.gain.setValueAtTime(0.25, now + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.start(now + 0.2); osc2.stop(now + 0.4);
    // Tss (white noise)
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    const gN = ctx.createGain();
    const hipass = ctx.createBiquadFilter();
    hipass.type = 'highpass';
    hipass.frequency.value = 7000;
    noise.buffer = buffer;
    gN.gain.setValueAtTime(0.12, now + 0.45);
    gN.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    noise.connect(hipass); hipass.connect(gN); gN.connect(ctx.destination);
    noise.start(now + 0.45); noise.stop(now + 0.75);
  } catch (e) { console.warn('Soundboard error:', e); }
}

function playSoundCricket(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    for (let c = 0; c < 3; c++) {
      const t = now + c * 0.35;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500 + Math.random() * 500, t + i * 0.03);
        gain.gain.setValueAtTime(0.05, t + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.025);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t + i * 0.03); osc.stop(t + i * 0.03 + 0.03);
      }
    }
  } catch (e) { console.warn('Soundboard error:', e); }
}

function playSoundGolfClap(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.18 + Math.random() * 0.04;
      const bufferSize = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.15));
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000 + Math.random() * 1000;
      filter.Q.value = 1;
      source.buffer = buffer;
      gain.gain.setValueAtTime(0.08 + Math.random() * 0.04, t);
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      source.start(t);
    }
  } catch (e) { console.warn('Soundboard error:', e); }
}

function playSoundQuack(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    osc.frequency.setValueAtTime(650, now + 0.13);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.setValueAtTime(0.01, now + 0.12);
    gain.gain.setValueAtTime(0.12, now + 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  } catch (e) { console.warn('Soundboard error:', e); }
}

function playSoundSadTrombone(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const notes = [370, 349, 330, 233];
    const durations = [0.35, 0.35, 0.35, 0.7];
    let t = now;
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[i], t);
      if (i === 3) osc.frequency.linearRampToValueAtTime(220, t + durations[i]);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i] - 0.02);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + durations[i]);
      t += durations[i];
    }
  } catch (e) { console.warn('Soundboard error:', e); }
}

function playSoundTaDa(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    // Ta
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(523, now);
    g1.gain.setValueAtTime(0.08, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.15);
    // Da (chord)
    const freqs = [523, 659, 784];
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + 0.2);
      g.gain.setValueAtTime(0.08, now + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now + 0.2); osc.stop(now + 0.7);
    });
  } catch (e) { console.warn('Soundboard error:', e); }
}

function playSoundBoing(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.5);
  } catch (e) { console.warn('Soundboard error:', e); }
}

export const SOUNDBOARD_SOUNDS: SoundboardSound[] = [
  { id: 'airhorn', name: 'Airhorn', emoji: '📯', play: playSoundAirhorn },
  { id: 'ba_dum_tss', name: 'Ba Dum Tss', emoji: '🥁', play: playSoundBaDumTss },
  { id: 'cricket', name: 'Cricket', emoji: '🦗', play: playSoundCricket },
  { id: 'golf_clap', name: 'Golf Clap', emoji: '👏', play: playSoundGolfClap },
  { id: 'quack', name: 'Quack', emoji: '🦆', play: playSoundQuack },
  { id: 'sad_trombone', name: 'Sad Trombone', emoji: '🎺', play: playSoundSadTrombone },
  { id: 'tada', name: 'Ta-Da!', emoji: '🎉', play: playSoundTaDa },
  { id: 'boing', name: 'Boing', emoji: '🏀', play: playSoundBoing },
];

export function playSoundboardSound(id: string): void {
  const sound = SOUNDBOARD_SOUNDS.find(s => s.id === id);
  if (sound) sound.play();
}
