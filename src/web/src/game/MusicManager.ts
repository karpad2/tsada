// ── MusicManager ─────────────────────────────────────────────
// Plays a single MP3 whose sections are mapped to game phases.
// Each section loops seamlessly using Web Audio API loopStart/loopEnd.
// Phase transitions trigger a short crossfade.
//
// HOW TO CONFIGURE:
//   1. Drop your MP3 at  public/music/heist.mp3
//   2. Edit the start/end times (seconds) in MUSIC_SECTIONS below.

const MUSIC_SRC = '/music/dead_end.mp3'

// ── Section timestamps ── edit these to match your MP3 ──────
export const MUSIC_SECTIONS = {
  stealth:      { start:   0, end:  88 },   // calm, undetected
  control:      { start:  89, end: 168 },   // suspicion building
  anticipation: { start: 169, end: 200 },   // alarm triggered, countdown
  assault:      { start: 201, end: 528 },   // full action
}

// ── Phase → section mapping ──────────────────────────────────
const PHASE_SECTION = {
  STEALTH:      'stealth',
  CONTROL:      'control',
  ANTICIPATION: 'anticipation',
  ASSAULT:      'assault',
  ESCAPED:      null,
  FAILED:       null,
}

const CROSSFADE = 1.5   // seconds

// ── Master volume (0–1). Can be tweaked at runtime. ──────────
export let masterVolume = 0.7

export class MusicManager {
  constructor() {
    this._ctx     = null
    this._buffer  = null
    this._current = null   // { source, gain, sectionName }
    this._loading = false
    this._pending = null   // section name queued while loading
  }

  // Call once (from createEngine, which runs inside a user-gesture click).
  async init() {
    if (this._ctx) return
    this._ctx    = new AudioContext()
    this._loading = true
    try {
      const res    = await fetch(MUSIC_SRC)
      const arr    = await res.arrayBuffer()
      this._buffer = await this._ctx.decodeAudioData(arr)
    } catch (e) {
      console.warn('[MusicManager] Could not load music:', e)
      this._loading = false
      return
    }
    this._loading = false
    if (this._pending !== null) {
      this._crossfadeTo(this._pending)
      this._pending = null
    }
  }

  // Call whenever the game phase changes.
  setPhase(phase) {
    const section = PHASE_SECTION[phase] ?? null
    if (section === null) {
      this._fadeOut()
      return
    }
    if (this._current?.sectionName === section) return

    if (this._loading || !this._buffer) {
      this._pending = section
      return
    }
    this._crossfadeTo(section)
  }

  setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v))
    if (this._current) {
      this._current.gain.gain.setTargetAtTime(masterVolume, this._ctx.currentTime, 0.1)
    }
  }

  destroy() {
    try { this._current?.source.stop() } catch {}
    this._current = null
    try { this._ctx?.close() } catch {}
    this._ctx = null
  }

  // ── internals ───────────────────────────────────────────────

  _playSection(name, fadeIn = 0) {
    const sec = MUSIC_SECTIONS[name]
    if (!sec || !this._buffer || !this._ctx) return

    const gainNode = this._ctx.createGain()
    const now      = this._ctx.currentTime
    gainNode.gain.setValueAtTime(fadeIn > 0 ? 0 : masterVolume, now)
    if (fadeIn > 0) gainNode.gain.linearRampToValueAtTime(masterVolume, now + fadeIn)
    gainNode.connect(this._ctx.destination)

    const source      = this._ctx.createBufferSource()
    source.buffer     = this._buffer
    source.loop       = true
    source.loopStart  = sec.start
    source.loopEnd    = sec.end
    source.connect(gainNode)
    source.start(0, sec.start)   // start playback at section start

    this._current = { source, gain: gainNode, sectionName: name }
  }

  _crossfadeTo(name) {
    if (this._current) {
      const old = this._current
      const now = this._ctx.currentTime
      old.gain.gain.setValueAtTime(old.gain.gain.value, now)
      old.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE)
      old.source.stop(now + CROSSFADE)
      this._current = null
    }
    this._playSection(name, this._current === null ? CROSSFADE * 0.5 : 0)
  }

  _fadeOut() {
    if (!this._current) return
    const old = this._current
    const now = this._ctx.currentTime
    old.gain.gain.setValueAtTime(old.gain.gain.value, now)
    old.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE)
    old.source.stop(now + CROSSFADE)
    this._current = null
  }
}
