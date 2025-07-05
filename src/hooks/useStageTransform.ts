// src/hooks/useStageTransform.ts
import { useState, useEffect, useCallback, useRef } from 'react'

type Pos = { x: number; y: number }

export function useStageTransform(background?: HTMLImageElement) {
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [scale, setScale] = useState<number>(1)
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 })

  // touch tracking
  const pointers = useRef<Record<number, Pos>>({})
  const lastDist = useRef(0)
  const isDragging = useRef(false)
  const tapStart = useRef<Pos | null>(null)
  const hasPinched = useRef(false)
  const hasPanned = useRef(false)
  const TAP_THRESHOLD = 6

  // clamp helper
  const clampPos = useCallback(
    (x: number, y: number) => {
      if (!background) return { x, y }
      const wS = background.width * scale
      const hS = background.height * scale
      const minX = Math.min(0, dims.w - wS),
        maxX = 0
      const minY = Math.min(0, dims.h - hS),
        maxY = 0
      return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
      }
    },
    [background, scale, dims]
  )

  // fit on mount / resize
  const fitToScreen = useCallback(() => {
    const vw = window.innerWidth,
      vh = window.innerHeight
    setDims({ w: vw, h: vh })
    if (!background) return
    const factor = Math.max(vw / background.width, vh / background.height)
    setScale(factor)
    setPos({
      x: (vw - background.width * factor) / 2,
      y: (vh - background.height * factor) / 2,
    })
    lastDist.current = 0
  }, [background])

  useEffect(() => {
    fitToScreen()
    window.addEventListener('resize', fitToScreen)
    window.addEventListener('orientationchange', fitToScreen)
    return () => {
      window.removeEventListener('resize', fitToScreen)
      window.removeEventListener('orientationchange', fitToScreen)
    }
  }, [fitToScreen])

  // touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      pointers.current[t.identifier] = { x: t.clientX, y: t.clientY }
    }
    if (Object.keys(pointers.current).length === 1) {
      const t0 = e.changedTouches[0]
      tapStart.current = { x: t0.clientX, y: t0.clientY }
      hasPinched.current = false
      hasPanned.current = false
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current) return
    const ids = Object.keys(pointers.current)
    // two‐finger pinch
    if (ids.length === 2) {
      hasPinched.current = true
      e.preventDefault()
      for (const t of Array.from(e.touches)) {
        if (pointers.current[t.identifier] != null) {
          pointers.current[t.identifier] = { x: t.clientX, y: t.clientY }
        }
      }
      const [p1, p2] = ids.map((i) => pointers.current[+i])
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      if (!lastDist.current) {
        lastDist.current = dist
        return
      }
      const ratio = dist / lastDist.current
      const newScale = Math.max(1, scale * ratio)
      const cx = (p1.x + p2.x) / 2,
        cy = (p1.y + p2.y) / 2
      setScale(newScale)
      setPos(
        clampPos(
          cx - (cx - pos.x) * (newScale / scale),
          cy - (cy - pos.y) * (newScale / scale)
        )
      )
      lastDist.current = dist
      return
    }
    // one‐finger pan
    if (ids.length === 1) {
      const id = +ids[0]
      const prev = pointers.current[id]
      const t = Array.from(e.touches).find((x) => x.identifier === id)
      if (!t || !prev) return
      const dx = t.clientX - prev.x,
        dy = t.clientY - prev.y
      if (Math.hypot(dx, dy) > TAP_THRESHOLD) hasPanned.current = true
      setPos(clampPos(pos.x + dx, pos.y + dy))
      pointers.current[id] = { x: t.clientX, y: t.clientY }
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    // detect “tap”
    if (
      !hasPinched.current &&
      !hasPanned.current &&
      tapStart.current &&
      Object.keys(pointers.current).length === 1 &&
      e.changedTouches.length === 1
    ) {
      const t0 = e.changedTouches[0]
      const dx = t0.clientX - tapStart.current.x,
        dy = t0.clientY - tapStart.current.y
      if (Math.hypot(dx, dy) < TAP_THRESHOLD) {
        // this was a tap!
        // we synthesize a click event
        const x = (t0.clientX - pos.x) / scale
        const y = (t0.clientY - pos.y) / scale
        // @ts-ignore — we’ll provide onTap handler in our return
        handlers.onTap({ x, y })
      }
    }
    // cleanup pointers
    for (const t of Array.from(e.changedTouches)) {
      delete pointers.current[t.identifier]
    }
    if (Object.keys(pointers.current).length < 2) lastDist.current = 0
    tapStart.current = null
  }

  // click/tap to open add
  const onClick = (e: any, openAdd: (pos: Pos) => void) => {
    const { clientX, clientY } = e.evt as MouseEvent
    openAdd({ x: (clientX - pos.x) / scale, y: (clientY - pos.y) / scale })
  }

  const handlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onClick: (e: any, openAdd: (pos: Pos) => void) => onClick(e, openAdd),
    onTap: (_p: Pos) => {}, // placeholder, will be bound in MarinaCanvas
    setDragging: (d: boolean) => {
      isDragging.current = d
    },
  }

  return { dims, scale, pos, setScale, setPos, handlers }
}
