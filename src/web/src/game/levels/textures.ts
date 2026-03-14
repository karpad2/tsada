import * as THREE from 'three'

// ── Texture system ────────────────────────────────────────────
//
// By default textures are generated via HTML Canvas (no files needed).
//
// To use your own PNG files instead:
//   1. Place PNG files in  public/textures/  (e.g. floor_tile.png)
//   2. In getTex(), change the mode constant below:
//        const MODE = 'png'   ← swap to this
//   PNG files must be named exactly as the texture keys below.
//
// Available texture keys:
//   Floors:  floor_tile  floor_marble  floor_wood  floor_carpet
//            floor_casino  floor_metal  floor_asphalt  floor_concrete
//            floor_linoleum  floor_stone
//   Walls:   wall_plaster  wall_brick  wall_concrete  wall_panel
//            wall_metal  wall_marble  wall_tile
// ─────────────────────────────────────────────────────────────

const MODE   = 'canvas'   // 'canvas' | 'png'
const _cache = new Map()
const _normalCache = new Map()
const _loader = new THREE.TextureLoader()

export function getTex(name) {
  if (_cache.has(name)) return _cache.get(name)
  let tex
  if (MODE === 'png') {
    tex = _loader.load(`/textures/${name}.png`)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  } else {
    tex = _buildCanvas(name)
  }
  _cache.set(name, tex)
  return tex
}

// ── Normal map generation (Sobel filter on luminance) ─────────
export function getNormalMap(name) {
  if (_normalCache.has(name)) return _normalCache.get(name)

  // Ensure color texture is built first
  const colorTex = getTex(name)
  if (!colorTex?.image) return null

  const src = colorTex.image
  const w = src.width, h = src.height
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(src, 0, 0)
  const data = ctx.getImageData(0, 0, w, h).data

  const out = ctx.createImageData(w, h)
  const strength = 2.0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lU = _lum(data, w, h, x, y - 1)
      const lD = _lum(data, w, h, x, y + 1)
      const lL = _lum(data, w, h, x - 1, y)
      const lR = _lum(data, w, h, x + 1, y)
      const dx = (lR - lL) * strength
      const dy = (lD - lU) * strength
      const idx = (y * w + x) * 4
      out.data[idx]     = Math.round((dx * 0.5 + 0.5) * 255)
      out.data[idx + 1] = Math.round((dy * 0.5 + 0.5) * 255)
      out.data[idx + 2] = 255  // Z up
      out.data[idx + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)

  const normalTex = new THREE.CanvasTexture(c)
  normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping
  _normalCache.set(name, normalTex)
  return normalTex
}

function _lum(data, w, h, x, y) {
  x = ((x % w) + w) % w
  y = ((y % h) + h) % h
  const idx = (y * w + x) * 4
  return (data[idx] + data[idx + 1] + data[idx + 2]) / 3 / 255
}

// ── Canvas texture builders ───────────────────────────────────
function _buildCanvas(name) {
  const S   = 256
  const c   = document.createElement('canvas')
  c.width   = c.height = S
  const ctx = c.getContext('2d')

  switch (name) {
    // Floors
    case 'floor_tile':     _checker(ctx, S, '#9a8a70', '#88775e', 128);  break
    case 'floor_marble':   _marble(ctx, S);                               break
    case 'floor_wood':     _wood(ctx, S);                                 break
    case 'floor_carpet':   _carpet(ctx, S, '#3a3050');                    break
    case 'floor_casino':   _carpet(ctx, S, '#5a0010');                    break
    case 'floor_metal':    _metalGrid(ctx, S);                            break
    case 'floor_asphalt':  _asphalt(ctx, S);                              break
    case 'floor_concrete': _speckle(ctx, S, '#7a7870');                   break
    case 'floor_linoleum': _checker(ctx, S, '#ddd8cc', '#ccc8bc', 128);  break
    case 'floor_stone':    _speckle(ctx, S, '#8a8070');                   break
    // Walls
    case 'wall_plaster':   _plaster(ctx, S);                              break
    case 'wall_brick':     _brick(ctx, S);                                break
    case 'wall_concrete':  _speckle(ctx, S, '#909090');                   break
    case 'wall_panel':     _panel(ctx, S);                                break
    case 'wall_metal':     _metalPanel(ctx, S);                           break
    case 'wall_marble':    _marble(ctx, S);                               break
    case 'wall_tile':      _checker(ctx, S, '#c8d0d8', '#b8c0c8', 96);  break
    default:               ctx.fillStyle = '#888888'; ctx.fillRect(0, 0, S, S)
  }

  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// ── Pattern helpers ───────────────────────────────────────────
function _checker(ctx, S, a, b, ts) {
  for (let y = 0; y < S; y += ts)
    for (let x = 0; x < S; x += ts) {
      ctx.fillStyle = ((x / ts + y / ts) % 2 === 0) ? a : b
      ctx.fillRect(x, y, ts, ts)
    }
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 3
  for (let i = 0; i <= S; i += ts) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke()
  }
}

function _marble(ctx, S) {
  const g = ctx.createLinearGradient(0, 0, S, S)
  g.addColorStop(0,   '#e8e0d8')
  g.addColorStop(0.5, '#d4c8b4')
  g.addColorStop(1,   '#c8bcac')
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(180,165,140,0.45)'; ctx.lineWidth = 2.5
  for (let i = 0; i < 12; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * S, 0)
    ctx.bezierCurveTo(Math.random() * S, S * 0.33,
                      Math.random() * S, S * 0.66,
                      Math.random() * S, S)
    ctx.stroke()
  }
}

function _wood(ctx, S) {
  ctx.fillStyle = '#7a5030'; ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 4
  for (let y = 0; y < S; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y)
    ctx.lineTo(S, y + (Math.random() - 0.5) * 6); ctx.stroke()
  }
  // Wood grain detail
  ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 1.5
  for (let y = 0; y < S; y += 8) {
    ctx.beginPath(); ctx.moveTo(0, y)
    ctx.lineTo(S, y + (Math.random() - 0.5) * 3); ctx.stroke()
  }
}

function _carpet(ctx, S, base) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  for (let i = 0; i < 1200; i++)
    ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 3
  for (let d = -S; d < S * 2; d += 80) {
    ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + S, S); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(d + S, 0); ctx.lineTo(d, S); ctx.stroke()
  }
}

function _metalGrid(ctx, S) {
  ctx.fillStyle = '#5a6070'; ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 4
  for (let y = 0; y < S; y += 64)
    for (let x = 0; x < S; x += 64)
      ctx.strokeRect(x + 6, y + 6, 52, 52)
  // Highlight edges
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
  for (let y = 0; y < S; y += 64)
    for (let x = 0; x < S; x += 64)
      ctx.strokeRect(x + 7, y + 7, 50, 50)
}

function _asphalt(ctx, S) {
  ctx.fillStyle = '#282828'; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let i = 0; i < 300; i++)
    ctx.fillRect(Math.random() * S, Math.random() * S, Math.random() * 12 + 2, 2)
  // Cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * S, Math.random() * S)
    ctx.lineTo(Math.random() * S, Math.random() * S)
    ctx.stroke()
  }
}

function _speckle(ctx, S, base) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  for (let i = 0; i < 250; i++)
    ctx.fillRect(Math.random() * S, Math.random() * S,
                 Math.random() * 20 + 2, Math.random() * 6 + 1)
}

function _plaster(ctx, S) {
  ctx.fillStyle = '#d4c8b0'; ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = 'rgba(0,0,0,0.03)'
  for (let i = 0; i < 300; i++) {
    ctx.beginPath()
    ctx.arc(Math.random() * S, Math.random() * S, Math.random() * 6 + 1, 0, Math.PI * 2)
    ctx.fill()
  }
}

function _brick(ctx, S) {
  ctx.fillStyle = '#6a3a20'; ctx.fillRect(0, 0, S, S)
  const bw = 128, bh = 56
  for (let row = 0; row * bh < S; row++) {
    const off = (row % 2) * (bw / 2)
    ctx.fillStyle = '#884422'
    for (let col = -1; col * bw < S; col++)
      ctx.fillRect(col * bw + off + 3, row * bh + 3, bw - 6, bh - 6)
  }
  // Mortar highlight
  ctx.strokeStyle = 'rgba(200,180,150,0.12)'; ctx.lineWidth = 1
  for (let row = 0; row * bh < S; row++) {
    const off = (row % 2) * (bw / 2)
    for (let col = -1; col * bw < S; col++)
      ctx.strokeRect(col * bw + off + 4, row * bh + 4, bw - 8, bh - 8)
  }
}

function _panel(ctx, S) {
  ctx.fillStyle = '#c0c8cc'; ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 5
  for (let y = 0; y <= S; y += 192) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke()
  }
  ctx.lineWidth = 3
  for (let x = 0; x <= S; x += 192) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S); ctx.stroke()
  }
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(6, 6, S - 12, S / 2 - 12)
}

function _metalPanel(ctx, S) {
  ctx.fillStyle = '#4a5560'; ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 5
  for (let y = 0; y <= S; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2
  for (let y = 3; y < S; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke()
  }
  // Rivet dots
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let y = 20; y < S; y += 128) {
    for (let x = 20; x < S; x += 64) {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
    }
  }
}
