import React from 'react'
import './PageNav.css'

export default function PageNav({ currentPage, totalPages, onPrev, onNext, onGoToPage }) {
  return (
    <nav className="page-nav">
      <button
        className="btn btn--nav"
        onClick={onPrev}
        disabled={currentPage <= 0}
        title="Previous page (←)"
        aria-label="Previous page"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="page-nav__info">
        <div className="page-nav__counter">
          Page <span>{currentPage + 1}</span> of {totalPages}
        </div>
        <div className="page-nav__dots">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-nav__dot ${i === currentPage ? 'page-nav__dot--active' : ''}`}
              onClick={() => onGoToPage(i)}
              aria-label={`Go to page ${i + 1}`}
              title={`Page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <button
        className="btn btn--nav"
        onClick={onNext}
        disabled={currentPage >= totalPages - 1}
        title="Next page (→)"
        aria-label="Next page"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  )
}
