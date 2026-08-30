import { useState, useCallback } from 'react'

const ZOOM_LEVELS = [1, 1.5, 2]

export function useZoom() {
  const [zoomIndex, setZoomIndex] = useState(0)
  const [showIndicator, setShowIndicator] = useState(false)

  const zoom = ZOOM_LEVELS[zoomIndex]
  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1
  const canZoomOut = zoomIndex > 0

  const flashIndicator = useCallback(() => {
    setShowIndicator(true)
    setTimeout(() => setShowIndicator(false), 600)
  }, [])

  const zoomIn = useCallback(() => {
    setZoomIndex(prev => {
      const next = Math.min(prev + 1, ZOOM_LEVELS.length - 1)
      if (next !== prev) flashIndicator()
      return next
    })
  }, [flashIndicator])

  const zoomOut = useCallback(() => {
    setZoomIndex(prev => {
      const next = Math.max(prev - 1, 0)
      if (next !== prev) flashIndicator()
      return next
    })
  }, [flashIndicator])

  const resetZoom = useCallback(() => {
    setZoomIndex(0)
    flashIndicator()
  }, [flashIndicator])

  const zoomLabel = zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`

  return {
    zoom,
    zoomLabel,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    resetZoom,
    showIndicator,
  }
}
