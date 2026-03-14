// ── Sound assets ─────────────────────────────────────────────
// Lightweight Web Audio API wrapper for in-game sound effects.
// Drop .ogg / .mp3 files into web/public/sounds/ and register them here.

const _ctx   = typeof AudioContext !== 'undefined' ? new AudioContext() : null
const _cache = {}   // url → AudioBuffer

export async function loadSound(url) {
  if (_cache[url]) return _cache[url]
  if (!_ctx) return null
  try {
    const res  = await fetch(url)
    const ab   = await res.arrayBuffer()
    const buf  = await _ctx.decodeAudioData(ab)
    _cache[url] = buf
    return buf
  } catch {
    console.warn('[sounds] Failed to load', url)
    return null
  }
}

/**
 * Play a loaded sound buffer once.
 * @param {AudioBuffer} buf  — from loadSound()
 * @param {number}      vol  — 0.0 – 1.0
 * @param {number}      pitch — playback rate (1.0 = normal)
 */
export function playSound(buf, vol = 1.0, pitch = 1.0) {
  if (!_ctx || !buf) return
  if (_ctx.state === 'suspended') _ctx.resume()
  const src  = _ctx.createBufferSource()
  const gain = _ctx.createGain()
  src.buffer             = buf
  src.playbackRate.value = pitch
  gain.gain.value        = vol
  src.connect(gain).connect(_ctx.destination)
  src.start()
}

export const SoundCtx = _ctx
