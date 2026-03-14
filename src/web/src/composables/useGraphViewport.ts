import { reactive } from 'vue'

export function useGraphViewport() {
  const vp = reactive({ panX: 0, panY: 0, zoom: 1.0 })

  function screenToGraph(sx: number, sy: number, rect: DOMRect) {
    return {
      gx: (sx - rect.left - vp.panX) / vp.zoom,
      gy: (sy - rect.top  - vp.panY) / vp.zoom,
    }
  }

  function graphToScreen(gx: number, gy: number, rect: DOMRect) {
    return {
      sx: gx * vp.zoom + vp.panX + rect.left,
      sy: gy * vp.zoom + vp.panY + rect.top,
    }
  }

  function applyWheel(e: WheelEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const oldZoom = vp.zoom
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    vp.zoom = Math.max(0.3, Math.min(2.0, vp.zoom * factor))

    // Zoom toward cursor
    vp.panX = mx - (mx - vp.panX) * (vp.zoom / oldZoom)
    vp.panY = my - (my - vp.panY) * (vp.zoom / oldZoom)
  }

  function startPan(e: MouseEvent) {
    const startX = e.clientX - vp.panX
    const startY = e.clientY - vp.panY

    const onMove = (ev: MouseEvent) => {
      vp.panX = ev.clientX - startX
      vp.panY = ev.clientY - startY
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { vp, screenToGraph, graphToScreen, applyWheel, startPan }
}
