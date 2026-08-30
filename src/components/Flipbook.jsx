import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react'
import { PageFlip } from 'page-flip'
import './Flipbook.css'

const Flipbook = forwardRef(({ pages, onPageChange, zoom }, ref) => {
  const containerRef = useRef(null)
  const flipBookRef = useRef(null)
  const wrapperRef = useRef(null)
  const onPageChangeRef = useRef(onPageChange)
  const [dimensions, setDimensions] = useState({ width: 400, height: 570 })

  // Keep callback ref in sync without re-initializing the flipbook
  useEffect(() => {
    onPageChangeRef.current = onPageChange
  }, [onPageChange])

  // Calculate dimensions based on viewport
  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight
      const vw = window.innerWidth
      const availableHeight = vh - 140
      const availableWidth = vw - 80

      const ratio = 7 / 10
      let height = Math.min(availableHeight - 40, 700)
      let width = height * ratio

      if (width > availableWidth) {
        width = availableWidth
        height = width / ratio
      }

      width = Math.max(width, 280)
      height = Math.max(height, 400)

      setDimensions({ width: Math.floor(width), height: Math.floor(height) })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Initialize StPageFlip
  useEffect(() => {
    if (!containerRef.current || pages.length === 0) return

    // Destroy previous instance if exists
    if (flipBookRef.current) {
      flipBookRef.current.destroy()
      flipBookRef.current = null
    }

    // Clear container
    containerRef.current.innerHTML = ''

    // Create page elements
    pages.forEach((src, index) => {
      const pageDiv = document.createElement('div')
      pageDiv.className = 'page'
      if (index === 0 || index === pages.length - 1) {
        pageDiv.classList.add('page--cover')
      }
      pageDiv.setAttribute('data-density', index === 0 || index === pages.length - 1 ? 'hard' : 'soft')

      const img = document.createElement('img')
      img.src = src
      img.alt = `Page ${index + 1}`
      img.draggable = false
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'cover'
      img.style.display = 'block'
      img.style.userSelect = 'none'

      pageDiv.appendChild(img)
      containerRef.current.appendChild(pageDiv)
    })

    // Initialize PageFlip
    const pageFlip = new PageFlip(containerRef.current, {
      width: dimensions.width,
      height: dimensions.height,
      size: 'fixed',
      minWidth: 280,
      maxWidth: 700,
      minHeight: 400,
      maxHeight: 1000,
      showCover: true,
      usePortrait: true,
      autoSize: false,
      flippingTime: 1000,
      drawShadow: true,
      maxShadowOpacity: 0.4,
      useMouseEvents: true,
      swipeDistance: 30,
      showPageCorners: true,
      disableFlipByClick: false,
      startZIndex: 0,
      startPage: 0,
      mobileScrollSupport: false,
    })

    // Load pages from the DOM elements
    pageFlip.loadFromHTML(containerRef.current.querySelectorAll('.page'))

    // Single flip event handler using ref to avoid stale closures
    pageFlip.on('flip', (e) => {
      if (onPageChangeRef.current) {
        onPageChangeRef.current(e.data)
      }
    })

    flipBookRef.current = pageFlip

    return () => {
      if (flipBookRef.current) {
        flipBookRef.current.destroy()
        flipBookRef.current = null
      }
    }
  }, [pages, dimensions])

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    flipNext: () => flipBookRef.current?.flipNext(),
    flipPrev: () => flipBookRef.current?.flipPrev(),
    turnToPage: (page) => flipBookRef.current?.turnToPage(page),
  }))

  return (
    <div className="flipbook-stage">
      <div
        className={`flipbook-wrapper ${zoom > 1 ? 'zoomed' : ''}`}
        ref={wrapperRef}
        style={{ transform: `scale(${zoom})` }}
      >
        <div className="flipbook-container" ref={containerRef} />
      </div>
    </div>
  )
})

Flipbook.displayName = 'Flipbook'
export default Flipbook
