import React from 'react'
import './Toolbar.css'

export default function Toolbar({ theme, onToggleTheme, zoom, onZoomIn, onZoomOut, onResetZoom, canZoomIn, canZoomOut }) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <div className="toolbar__icon">P</div>
        <div>
          <div className="toolbar__title">Pages to Pixel</div>
          <div className="toolbar__subtitle">Magazine</div>
        </div>
      </div>

      <div className="toolbar__controls">
        {/* Zoom controls */}
        <button
          className="btn btn--icon"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          title="Zoom out (−)"
          aria-label="Zoom out"
        >
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <span className="zoom-label" onClick={onResetZoom} title="Reset zoom">
          {zoom}
        </span>

        <button
          className="btn btn--icon"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <div className="toolbar__divider" />

        {/* Theme toggle */}
        <button
          className="btn btn--icon btn--theme"
          onClick={onToggleTheme}
          title="Toggle theme (T)"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>
    </header>
  )
}
