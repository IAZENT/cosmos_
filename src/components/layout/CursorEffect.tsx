'use client'

import { useEffect, useRef } from 'react'

/**
 * CursorEffect  overlays a 28px outlined ring + 4px dot that follow the
 * pointer. The dot tracks position exactly; the ring trails with a
 * configurable easing factor so it feels weighted. Scales up + shifts hue
 * when the pointer is over an interactive element (`<a>`, `<button>`,
 * `[role="button"]`, inputs, `[data-cursor="hover"]`).
 *
 * Disabled automatically on:
 *   - coarse pointers (touch),
 *   - users with `prefers-reduced-motion: reduce`,
 *   - the very first paint until a real `pointermove` event fires.
 *
 * Native cursor is not hidden  the ring is purely additive overlay so
 * accessibility / OS cursor preferences remain intact.
 */
export function CursorEffect() {
  const ringRef = useRef<HTMLDivElement | null>(null)
  const dotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduced.matches) return

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let raf = 0
    let visible = false
    let hovering = false

    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    const tick = () => {
      // Ease the ring towards the mouse position.
      const ease = 0.18
      ringX += (mouseX - ringX) * ease
      ringY += (mouseY - ringY) * ease
      const scale = hovering ? 1.6 : 1
      ring.style.transform = `translate3d(${ringX - 14}px, ${ringY - 14}px, 0) scale(${scale})`
      dot.style.transform = `translate3d(${mouseX - 2}px, ${mouseY - 2}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    const isHoverable = (el: Element | null): boolean => {
      if (!el) return false
      return Boolean(
        el.closest(
          'a, button, [role="button"], [data-cursor="hover"], input, textarea, select, summary, label',
        ),
      )
    }

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!visible) {
        visible = true
        ring.style.opacity = '1'
        dot.style.opacity = '1'
      }
      const target = e.target as Element | null
      const next = isHoverable(target)
      if (next !== hovering) {
        hovering = next
        ring.classList.toggle('cosmos-cursor-ring--hover', hovering)
      }
    }

    const onLeave = () => {
      visible = false
      ring.style.opacity = '0'
      dot.style.opacity = '0'
    }

    const onDown = () => {
      ring.classList.add('cosmos-cursor-ring--down')
    }
    const onUp = () => {
      ring.classList.remove('cosmos-cursor-ring--down')
    }

    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  // Always render the overlays. On unsupported environments (touch /
  // reduced-motion / SSR) the effect never assigns a transform and the
  // elements remain invisible (`opacity: 0`).
  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="cosmos-cursor-ring"
        style={{ opacity: 0 }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="cosmos-cursor-dot"
        style={{ opacity: 0 }}
      />
    </>
  )
}
