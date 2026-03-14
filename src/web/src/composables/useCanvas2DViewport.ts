/**
 * Pan/zoom viewport state and coordinate helpers for the 2D level editor canvas.
 */
export function useCanvas2DViewport() {
  // Plain object — mutated directly (no Vue refs, avoids .value everywhere)
  const vp = { scale: 40, panX: 0, panY: 0 }

  /** World coords → screen pixels */
  function toScreen(wx, wz) {
    return { sx: vp.panX + wx * vp.scale, sy: vp.panY - wz * vp.scale }
  }

  /** Screen pixels → world coords, with optional grid snap */
  function toWorld(sx, sy, snap = 1) {
    const wx = (sx - vp.panX) / vp.scale
    const wz = (vp.panY - sy) / vp.scale
    return snap
      ? { wx: Math.round(wx / snap) * snap, wz: Math.round(wz / snap) * snap }
      : { wx, wz }
  }

  /** Convert a drag start/end into a centred AABB { x, z, w, d } */
  function rectFromDrag(s, e) {
    const x1 = Math.min(s.wx, e.wx), x2 = Math.max(s.wx, e.wx)
    const z1 = Math.min(s.wz, e.wz), z2 = Math.max(s.wz, e.wz)
    return {
      x: +(((x1 + x2) / 2).toFixed(1)),
      z: +(((z1 + z2) / 2).toFixed(1)),
      w: +((x2 - x1).toFixed(1)) || 1,
      d: +((z2 - z1).toFixed(1)) || 1,
    }
  }

  /**
   * Handle a wheel event on the canvas — zoom around the cursor position.
   * `draw` is called after updating the viewport.
   */
  function applyWheel(e, canvasEl, draw) {
    const rect = canvasEl.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const { wx, wz } = toWorld(mx, my, 0)
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    vp.scale = Math.max(10, Math.min(200, vp.scale * factor))
    vp.panX  = mx - wx * vp.scale
    vp.panY  = my + wz * vp.scale
    draw()
  }

  /**
   * Set initial pan so world origin appears at canvas centre (only if not yet panned).
   */
  function initPan(canvasEl) {
    if (vp.panX === 0 && vp.panY === 0) {
      vp.panX = canvasEl.width  / 2
      vp.panY = canvasEl.height / 2
    }
  }

  return { vp, toScreen, toWorld, rectFromDrag, applyWheel, initPan }
}
