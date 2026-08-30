import React, { forwardRef, useRef, useImperativeHandle, useState, useEffect, useCallback } from 'react'
import './Flipbook.css'

const Flipbook = forwardRef(({ pages, onPageChange, zoom }, ref) => {
  const canvasRef = useRef(null)
  
  // State refs for animation & gesture tracking
  const [currentPage, setCurrentPage] = useState(0)
  const currentPageRef = useRef(0)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const dragDirectionRef = useRef(null) // 'forward' | 'backward' | null
  const progressRef = useRef(0)
  const animFrameRef = useRef(null)
  const loadedImagesRef = useRef([])
  const onPageChangeRef = useRef(onPageChange)

  const [dimensions, setDimensions] = useState({ width: 400, height: 570 })

  // Keep callback ref updated
  useEffect(() => {
    onPageChangeRef.current = onPageChange
  }, [onPageChange])

  // Responsive dimensions with 7:10 aspect ratio
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

  // Draw fallback page if image is loading or missing
  const drawFallbackPage = (ctx, w, h, pageNum) => {
    ctx.fillStyle = '#fafaf7'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#6F7F64'
    ctx.font = '600 24px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Page ${pageNum}`, w / 2, h / 2)
  }

  // Master Render Loop for 3D Interactive Physical Page Curl
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = dimensions.width
    const h = dimensions.height

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const curIdx = currentPageRef.current
    const images = loadedImagesRef.current
    const dir = dragDirectionRef.current
    const p = Math.min(Math.max(progressRef.current, 0), 1)

    const curImg = images[curIdx]

    // 1. Fully Flat View (No drag / progress === 0)
    if (!dir || p <= 0) {
      if (curImg && curImg.complete && curImg.naturalWidth !== 0) {
        ctx.drawImage(curImg, 0, 0, w, h)
      } else {
        drawFallbackPage(ctx, w, h, curIdx + 1)
      }
      ctx.restore()
      return
    }

    const isForward = dir === 'forward'
    const targetIdx = isForward ? curIdx + 1 : curIdx - 1
    const targetImg = images[targetIdx]

    // 2. Draw Target Page (Revealed Underneath)
    if (targetImg && targetImg.complete && targetImg.naturalWidth !== 0) {
      ctx.drawImage(targetImg, 0, 0, w, h)
    } else {
      drawFallbackPage(ctx, w, h, targetIdx + 1)
    }

    // Fold line position across the width
    const foldX = isForward ? w * (1 - p) : w * p

    // 3. Dynamic Under-Shadow Cast onto the Target Page
    const shadowWidth = Math.min(90, w * 0.25) * Math.sin(Math.PI * p)
    const shadowAlpha = 0.55 * Math.sin(Math.PI * p)

    if (shadowWidth > 0 && shadowAlpha > 0) {
      ctx.save()
      const shadowGrad = isForward
        ? ctx.createLinearGradient(foldX, 0, foldX + shadowWidth, 0)
        : ctx.createLinearGradient(foldX, 0, foldX - shadowWidth, 0)

      shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`)
      shadowGrad.addColorStop(0.4, `rgba(0, 0, 0, ${shadowAlpha * 0.35})`)
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = shadowGrad
      if (isForward) {
        ctx.fillRect(foldX, 0, shadowWidth, h)
      } else {
        ctx.fillRect(foldX - shadowWidth, 0, shadowWidth, h)
      }
      ctx.restore()
    }

    // 4. Draw Uncurled Flat Portion of Current Page
    ctx.save()
    ctx.beginPath()
    if (isForward) {
      ctx.rect(0, 0, Math.max(0, foldX), h)
    } else {
      ctx.rect(foldX, 0, Math.max(0, w - foldX), h)
    }
    ctx.clip()

    if (curImg && curImg.complete && curImg.naturalWidth !== 0) {
      ctx.drawImage(curImg, 0, 0, w, h)
    } else {
      drawFallbackPage(ctx, w, h, curIdx + 1)
    }

    // Spine inner shadow near the fold line
    const innerShadowW = Math.min(35, isForward ? foldX : w - foldX)
    if (innerShadowW > 0) {
      const innerGrad = isForward
        ? ctx.createLinearGradient(foldX - innerShadowW, 0, foldX, 0)
        : ctx.createLinearGradient(foldX, 0, foldX + innerShadowW, 0)
      innerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
      innerGrad.addColorStop(1, `rgba(0, 0, 0, ${0.35 * Math.sin(Math.PI * p)})`)
      ctx.fillStyle = innerGrad
      if (isForward) {
        ctx.fillRect(foldX - innerShadowW, 0, innerShadowW, h)
      } else {
        ctx.fillRect(foldX, 0, innerShadowW, h)
      }
    }
    ctx.restore()

    // 5. Draw 3D Physical Paper Curl Cylinder & Turned Flap
    const maxR = Math.min(55, w * 0.14)
    const R = maxR * Math.sin(Math.PI * p) + 3
    const curlW = Math.PI * R
    const numSlices = 36

    ctx.save()
    for (let i = 0; i < numSlices; i++) {
      const t = i / numSlices // 0 -> 1
      const angle = t * Math.PI // 0 -> PI

      const sinA = Math.sin(angle)
      const cosA = Math.cos(angle)

      // X position of slice
      let sliceX
      if (isForward) {
        sliceX = foldX - R * sinA
      } else {
        sliceX = foldX + R * sinA
      }

      // 3D perspective height scaling
      const lift = R * (1 - cosA)
      const scaleY = 1 + (lift / 1400)
      const sliceH = h * scaleY
      const offsetY = (h - sliceH) / 2
      const sliceBoxW = Math.ceil(curlW / numSlices) + 1.2

      const isFront = angle < Math.PI / 2

      ctx.save()
      ctx.beginPath()
      ctx.rect(sliceX, offsetY, sliceBoxW, sliceH)
      ctx.clip()

      if (isFront) {
        // Front surface of flipping page
        if (curImg && curImg.complete && curImg.naturalWidth !== 0) {
          ctx.drawImage(curImg, 0, 0, w, h)
        } else {
          drawFallbackPage(ctx, w, h, curIdx + 1)
        }
        // Lighting shadow on front curve
        const shade = 0.28 * sinA
        ctx.fillStyle = `rgba(0, 0, 0, ${shade})`
        ctx.fillRect(sliceX - 1, offsetY, sliceBoxW + 2, sliceH)
      } else {
        // Back surface of flipping page (Warm paper texture with subtle reversed overlay)
        ctx.fillStyle = '#e8e4d5'
        ctx.fillRect(sliceX - 1, offsetY, sliceBoxW + 2, sliceH)

        if (curImg && curImg.complete && curImg.naturalWidth !== 0) {
          ctx.save()
          ctx.globalAlpha = 0.14
          ctx.translate(sliceX + sliceBoxW, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(curImg, 0, 0, w, h)
          ctx.restore()
        }

        // Curve highlight/shadow on back surface
        const backShade = 0.32 * (1 - sinA)
        ctx.fillStyle = `rgba(0, 0, 0, ${backShade})`
        ctx.fillRect(sliceX - 1, offsetY, sliceBoxW + 2, sliceH)
      }
      ctx.restore()
    }
    ctx.restore()

    // 6. Draw Turned Back Flap (Page portion flipped past the fold)
    const flapW = isForward ? w - foldX - curlW : foldX - curlW
    if (flapW > 0) {
      ctx.save()
      const flapStartX = isForward ? foldX - curlW - flapW : foldX + curlW
      ctx.beginPath()
      ctx.rect(flapStartX, 0, flapW, h)
      ctx.clip()

      // Back paper surface
      ctx.fillStyle = '#eae6d7'
      ctx.fillRect(flapStartX, 0, flapW, h)

      // Content back overlay (correctly oriented back)
      if (curImg && curImg.complete && curImg.naturalWidth !== 0) {
        ctx.save()
        ctx.globalAlpha = 0.12
        ctx.translate(w, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(curImg, 0, 0, w, h)
        ctx.restore()
      }

      // Soft edge shadow across the turned flap
      const flapGrad = isForward
        ? ctx.createLinearGradient(flapStartX, 0, flapStartX + flapW, 0)
        : ctx.createLinearGradient(flapStartX + flapW, 0, flapStartX, 0)
      flapGrad.addColorStop(0, 'rgba(0, 0, 0, 0.25)')
      flapGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.04)')
      flapGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = flapGrad
      ctx.fillRect(flapStartX, 0, flapW, h)

      ctx.restore()
    }

    ctx.restore()
  }, [dimensions])

  // Preload Images
  useEffect(() => {
    let isMounted = true
    const images = pages.map((src) => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        if (isMounted) render()
      }
      return img
    })
    loadedImagesRef.current = images
    render()
    return () => {
      isMounted = false
    }
  }, [pages, render])

  // Initial and Resize Render
  useEffect(() => {
    render()
  }, [dimensions, render])

  // Smooth animation progress helper
  const animateToProgress = (targetP, onComplete) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }

    const startP = progressRef.current
    const startTime = performance.now()
    const duration = 380 // ms for responsive, physical feel

    const step = (now) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Smooth easeOutCubic curve
      const ease = 1 - Math.pow(1 - t, 3)
      progressRef.current = startP + (targetP - startP) * ease
      render()

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        animFrameRef.current = null
        if (onComplete) onComplete()
      }
    }

    animFrameRef.current = requestAnimationFrame(step)
  }

  // Pointer Gesture Handlers
  const handlePointerDown = (e) => {
    if (animFrameRef.current) return
    startXRef.current = e.clientX
    isDraggingRef.current = true
    dragDirectionRef.current = null
    progressRef.current = 0
  }

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return

    const dx = e.clientX - startXRef.current
    const canvas = canvasRef.current
    const rect = canvas ? canvas.getBoundingClientRect() : { width: dimensions.width }
    const width = rect.width || dimensions.width

    // Direction detection
    if (!dragDirectionRef.current) {
      if (Math.abs(dx) > 6) {
        if (dx < 0 && currentPageRef.current < pages.length - 1) {
          dragDirectionRef.current = 'forward'
        } else if (dx > 0 && currentPageRef.current > 0) {
          dragDirectionRef.current = 'backward'
        }
      }
    }

    if (dragDirectionRef.current) {
      let p = 0
      if (dragDirectionRef.current === 'forward') {
        p = Math.min(Math.max(-dx / width, 0), 1)
      } else {
        p = Math.min(Math.max(dx / width, 0), 1)
      }
      progressRef.current = p
      render()
    }
  }

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    const dir = dragDirectionRef.current
    const p = progressRef.current

    if (!dir) return

    // Release threshold: > 0.4 completes flip, <= 0.4 springs back
    const targetP = p > 0.4 ? 1 : 0
    animateToProgress(targetP, () => {
      if (targetP === 1) {
        const nextIdx = dir === 'forward'
          ? currentPageRef.current + 1
          : currentPageRef.current - 1

        currentPageRef.current = nextIdx
        setCurrentPage(nextIdx)
        if (onPageChangeRef.current) {
          onPageChangeRef.current(nextIdx)
        }
      }
      dragDirectionRef.current = null
      progressRef.current = 0
      render()
    })
  }

  // Imperative Methods exposed to Parent (App.jsx / PageNav.jsx)
  useImperativeHandle(ref, () => ({
    flipNext: () => {
      if (animFrameRef.current || isDraggingRef.current) return
      if (currentPageRef.current >= pages.length - 1) return

      dragDirectionRef.current = 'forward'
      progressRef.current = 0
      animateToProgress(1, () => {
        const nextIdx = currentPageRef.current + 1
        currentPageRef.current = nextIdx
        setCurrentPage(nextIdx)
        if (onPageChangeRef.current) {
          onPageChangeRef.current(nextIdx)
        }
        dragDirectionRef.current = null
        progressRef.current = 0
        render()
      })
    },

    flipPrev: () => {
      if (animFrameRef.current || isDraggingRef.current) return
      if (currentPageRef.current <= 0) return

      dragDirectionRef.current = 'backward'
      progressRef.current = 0
      animateToProgress(1, () => {
        const prevIdx = currentPageRef.current - 1
        currentPageRef.current = prevIdx
        setCurrentPage(prevIdx)
        if (onPageChangeRef.current) {
          onPageChangeRef.current(prevIdx)
        }
        dragDirectionRef.current = null
        progressRef.current = 0
        render()
      })
    },

    turnToPage: (targetPage) => {
      if (animFrameRef.current || isDraggingRef.current) return
      if (targetPage === currentPageRef.current) return
      if (targetPage < 0 || targetPage >= pages.length) return

      const dir = targetPage > currentPageRef.current ? 'forward' : 'backward'
      dragDirectionRef.current = dir
      progressRef.current = 0

      animateToProgress(1, () => {
        currentPageRef.current = targetPage
        setCurrentPage(targetPage)
        if (onPageChangeRef.current) {
          onPageChangeRef.current(targetPage)
        }
        dragDirectionRef.current = null
        progressRef.current = 0
        render()
      })
    }
  }))

  return (
    <div className="flipbook-stage">
      <div
        className={`flipbook-wrapper ${zoom > 1 ? 'zoomed' : ''}`}
        style={{ transform: `scale(${zoom})` }}
      >
        <canvas
          ref={canvasRef}
          className="flipbook-canvas"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onMouseLeave={handlePointerUp}
        />
      </div>
    </div>
  )
})

Flipbook.displayName = 'Flipbook'
export default Flipbook
