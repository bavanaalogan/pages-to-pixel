import React, { useState, useRef, useCallback, useEffect } from 'react'
import Flipbook from './components/Flipbook.jsx'
import Toolbar from './components/Toolbar.jsx'
import PageNav from './components/PageNav.jsx'
import { useTheme } from './hooks/useTheme.js'
import { useZoom } from './hooks/useZoom.js'

// Magazine pages - place your PNG files in public/pages/
const TOTAL_PAGES = 7
const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => `/pages/page-${String(i + 1).padStart(2, '0')}.png`)

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { zoom, zoomLabel, canZoomIn, canZoomOut, zoomIn, zoomOut, resetZoom, showIndicator } = useZoom()
  const [currentPage, setCurrentPage] = useState(0)
  const flipbookRef = useRef(null)
  const [showHint, setShowHint] = useState(true)

  // Hide keyboard hint after it fades
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 7000)
    return () => clearTimeout(timer)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          flipbookRef.current?.flipNext()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          flipbookRef.current?.flipPrev()
          break
        case '+':
        case '=':
          e.preventDefault()
          zoomIn()
          break
        case '-':
        case '_':
          e.preventDefault()
          zoomOut()
          break
        case '0':
          e.preventDefault()
          resetZoom()
          break
        case 't':
        case 'T':
          e.preventDefault()
          toggleTheme()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomIn, zoomOut, resetZoom, toggleTheme])

  const handlePageChange = useCallback((pageNum) => {
    setCurrentPage(pageNum)
  }, [])

  const handlePrev = useCallback(() => {
    flipbookRef.current?.flipPrev()
  }, [])

  const handleNext = useCallback(() => {
    flipbookRef.current?.flipNext()
  }, [])

  const handleGoToPage = useCallback((page) => {
    flipbookRef.current?.turnToPage(page)
  }, [])

  return (
    <div className="app" data-theme={theme}>
      <Toolbar
        theme={theme}
        onToggleTheme={toggleTheme}
        zoom={zoomLabel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />

      <Flipbook
        ref={flipbookRef}
        pages={PAGES}
        onPageChange={handlePageChange}
        zoom={zoom}
      />

      <PageNav
        currentPage={currentPage}
        totalPages={TOTAL_PAGES}
        onPrev={handlePrev}
        onNext={handleNext}
        onGoToPage={handleGoToPage}
      />

      {/* Zoom indicator overlay */}
      {showIndicator && (
        <div className="zoom-overlay">{zoomLabel}</div>
      )}

      {/* Keyboard shortcuts hint */}
      {showHint && (
        <div className="keyboard-hint">
          <kbd>←</kbd><kbd>→</kbd> Navigate
          <span style={{ margin: '0 4px' }}>·</span>
          <kbd>+</kbd><kbd>−</kbd> Zoom
          <span style={{ margin: '0 4px' }}>·</span>
          <kbd>T</kbd> Theme
        </div>
      )}
    </div>
  )
}
