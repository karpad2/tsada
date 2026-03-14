// ─────────────────────────────────────────────────────────────
// SoundManager — Web Audio API procedural SFX synthesizer
// No audio files needed; all sounds are synthesised at runtime.
// Call sfx.init() once, then sfx.resume() on first user gesture.
// ─────────────────────────────────────────────────────────────

class SoundManager {
  private ctx: AudioContext | null = null
  private _ready = false

  init() {
    if (this._ready) return
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      this._ready = true
    } catch { /* no AudioContext support */ }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }

  private get ac(): AudioContext { return this.ctx! }

  // ── Noise burst helper ────────────────────────────────────
  private _noise(
    duration: number, gain: number,
    filterType: BiquadFilterType, freq: number,
    startOffset = 0,
  ) {
    const ac   = this.ac
    const size = Math.floor(ac.sampleRate * duration)
    const buf  = ac.createBuffer(1, size, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1

    const src = ac.createBufferSource()
    src.buffer = buf
    const flt = ac.createBiquadFilter()
    flt.type = filterType; flt.frequency.value = freq
    const g = ac.createGain()
    const t = ac.currentTime + startOffset
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(flt); flt.connect(g); g.connect(ac.destination)
    src.start(t); src.stop(t + duration)
  }

  // ── Tone helper ───────────────────────────────────────────
  private _tone(
    freq: number, freqEnd: number,
    type: OscillatorType,
    duration: number, gain: number,
    startOffset = 0,
  ) {
    const ac  = this.ac
    const t   = ac.currentTime + startOffset
    const osc = ac.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (freqEnd !== freq)
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + duration)
    const g = ac.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(g); g.connect(ac.destination)
    osc.start(t); osc.stop(t + duration)
  }

  // ── Sounds ────────────────────────────────────────────────

  shoot() {
    if (!this._ready) return
    // Low boom
    this._tone(160, 40, 'sine', 0.10, 0.55)
    // Muzzle crack
    this._noise(0.06, 0.45, 'bandpass', 2400)
    // High snap
    this._noise(0.04, 0.25, 'highpass', 5000)
  }

  emptyClick() {
    if (!this._ready) return
    this._noise(0.04, 0.3, 'highpass', 4800)
  }

  reload() {
    if (!this._ready) return
    // Mag eject rattle
    this._noise(0.14, 0.22, 'highpass', 3200)
    // Follow-up click
    setTimeout(() => {
      if (!this._ready) return
      this._noise(0.05, 0.28, 'highpass', 5200)
    }, 130)
  }

  reloadDone() {
    if (!this._ready) return
    // Chamber close
    this._noise(0.07, 0.32, 'bandpass', 1800)
    setTimeout(() => {
      if (!this._ready) return
      this._tone(110, 55, 'sine', 0.07, 0.18)
    }, 75)
  }

  grenadePin() {
    if (!this._ready) return
    this._noise(0.05, 0.28, 'highpass', 5800)
    this._tone(2000, 700, 'sine', 0.08, 0.1, 0.02)
  }

  explosion() {
    if (!this._ready) return
    // Sub bass
    this._tone(80, 18, 'sine', 0.95, 1.4)
    // Mid rumble
    this._noise(0.75, 1.1, 'bandpass', 380)
    // High crack
    this._noise(0.22, 0.75, 'highpass', 2200)
  }

  flashbang() {
    if (!this._ready) return
    // Initial crack
    this._noise(0.07, 0.9, 'highpass', 6500)
    // Tinnitus ring — ramps in then fades over 3.5s
    const ac  = this.ac
    const osc = ac.createOscillator()
    osc.type = 'sine'; osc.frequency.setValueAtTime(4400, ac.currentTime)
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, ac.currentTime)
    g.gain.linearRampToValueAtTime(0.45, ac.currentTime + 0.06)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 3.5)
    osc.connect(g); g.connect(ac.destination)
    osc.start(); osc.stop(ac.currentTime + 3.5)
  }

  maskOn() {
    if (!this._ready) return
    // Rubber strap snap
    this._noise(0.09, 0.45, 'bandpass', 1100)
    // Breath whoosh
    this._tone(280, 140, 'sine', 0.22, 0.28)
  }

  guardAlert() {
    if (!this._ready) return
    // Walkie-talkie double chirp
    for (let i = 0; i < 2; i++) {
      this._tone(920, 920, 'square', 0.08, 0.07, i * 0.13)
    }
  }

  backupCalled() {
    if (!this._ready) return
    // Two-cycle siren wail
    for (let i = 0; i < 2; i++) {
      const ac = this.ac
      const t0 = ac.currentTime + i * 0.5
      const osc = ac.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(580, t0)
      osc.frequency.linearRampToValueAtTime(1150, t0 + 0.22)
      osc.frequency.linearRampToValueAtTime(580, t0 + 0.44)
      const g = ac.createGain()
      g.gain.setValueAtTime(0.11, t0)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.46)
      osc.connect(g); g.connect(ac.destination)
      osc.start(t0); osc.stop(t0 + 0.46)
    }
  }

  tieCiv() {
    if (!this._ready) return
    // Zip-tie ratchet: 3 quick clicks
    for (let i = 0; i < 3; i++) this._noise(0.035, 0.28, 'highpass', 4200, i * 0.065)
  }

  doorOpen() {
    if (!this._ready) return
    this._tone(175, 85, 'sine', 0.42, 0.14)
    this._noise(0.28, 0.10, 'bandpass', 550)
  }

  pickup() {
    if (!this._ready) return
    // Two-note chime
    this._tone(880,  880,  'sine', 0.32, 0.16, 0.0)
    this._tone(1320, 1320, 'sine', 0.32, 0.16, 0.12)
  }

  escapeBeep(urgent = false) {
    if (!this._ready) return
    const freq  = urgent ? 1050 : 660
    const count = urgent ? 2 : 1
    for (let i = 0; i < count; i++) this._tone(freq, freq, 'sine', 0.09, 0.2, i * 0.11)
  }

  shieldHit() {
    if (!this._ready) return
    this._noise(0.13, 0.38, 'bandpass', 2800)
    this._tone(1100, 380, 'sine', 0.16, 0.18)
  }

  bodyHit() {
    if (!this._ready) return
    this._tone(95, 45, 'sine', 0.20, 0.48)
    this._noise(0.11, 0.28, 'bandpass', 320)
  }

  glassCrack() {
    if (!this._ready) return
    // Short sharp crack — high-frequency noise burst
    this._noise(0.08, 0.5, 'highpass', 4000)
    this._tone(3200, 800, 'square', 0.15, 0.12)
  }

  glassShatter() {
    if (!this._ready) return
    // Longer cascading shatter — noise + tinkling
    this._noise(0.3, 0.6, 'highpass', 3000)
    this._noise(0.15, 0.35, 'bandpass', 6000, 0.1)
    this._tone(4000, 1500, 'sine', 0.2, 0.15)
    this._tone(5500, 2000, 'sine', 0.15, 0.25)
  }

  gasHiss() {
    if (!this._ready) return
    this._noise(1.5, 0.35, 'lowpass', 800)
    this._tone(200, 80, 'sine', 1.0, 0.15)
  }

  electricShock() {
    if (!this._ready) return
    this._noise(0.15, 0.6, 'highpass', 3800)
    this._tone(2400, 600, 'sawtooth', 0.3, 0.25)
    this._noise(0.08, 0.4, 'bandpass', 5000, 0.15)
  }

  taserFire() {
    if (!this._ready) return
    this._noise(0.12, 0.5, 'highpass', 4000)
    this._tone(1800, 400, 'sawtooth', 0.2, 0.3)
    this._noise(0.08, 0.3, 'bandpass', 6000, 0.05)
  }

  droneHum() {
    if (!this._ready) return
    this._tone(180, 180, 'sawtooth', 0.5, 0.08)
    this._tone(360, 360, 'sawtooth', 0.5, 0.04)
  }

  droneDeath() {
    if (!this._ready) return
    this._noise(0.3, 0.5, 'bandpass', 1200)
    this._tone(400, 80, 'sawtooth', 0.5, 0.25)
  }

  bulletImpact() {
    if (!this._ready) return
    this._noise(0.04, 0.15, 'highpass', 2000)
  }

  achievementUnlock() {
    if (!this._ready) return
    this._tone(880, 880, 'sine', 0.3, 0.08)
    this._tone(1100, 1100, 'sine', 0.3, 0.06, 0.1)
    this._tone(1320, 1320, 'sine', 0.3, 0.12, 0.2)
  }

  taserZap() {
    if (!this._ready) return
    this._noise(0.1, 0.4, 'highpass', 5000)
    this._tone(3000, 800, 'sawtooth', 0.2, 0.15)
  }
}

export const sfx = new SoundManager()
