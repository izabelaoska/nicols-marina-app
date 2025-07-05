import { useState, useEffect, useCallback, useRef } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'

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
    (x: number, y: number): Pos => {
      if (!background) return { x, y }
      const wS = background.width * scale
      const hS = background.height * scale
      const minX = Math.min(0, dims.w - wS)
      const maxX = 0
      const minY = Math.min(0, dims.h - hS)
      const maxY = 0
      return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
      }
    },
    [background, scale, dims]
  )

  // fit on mount / resize
  const fitToScreen = useCallback(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
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
  const onTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    const te = e.evt as TouchEvent
    for (const t of Array.from(te.changedTouches)) {
      pointers.current[t.identifier] = { x: t.clientX, y: t.clientY }
    }
    if (Object.keys(pointers.current).length === 1) {
      const t0 = te.changedTouches[0]
      tapStart.current = { x: t0.clientX, y: t0.clientY }
      hasPinched.current = false
      hasPanned.current = false
    }
  }

  const onTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    const te = e.evt as TouchEvent
    if (isDragging.current) return
    const ids = Object.keys(pointers.current)
    // two-finger pinch
    if (ids.length === 2) {
      hasPinched.current = true
      te.preventDefault()
      for (const t of Array.from(te.touches)) {
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
      const cx = (p1.x + p2.x) / 2
      const cy = (p1.y + p2.y) / 2
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
    // one-finger pan
    if (ids.length === 1) {
      const id = +ids[0]
      const prev = pointers.current[id]
      const t = Array.from(te.touches).find((x) => x.identifier === id)
      if (!t || !prev) return
      const dx = t.clientX - prev.x
      const dy = t.clientY - prev.y
      if (Math.hypot(dx, dy) > TAP_THRESHOLD) hasPanned.current = true
      setPos(clampPos(pos.x + dx, pos.y + dy))
      pointers.current[id] = { x: t.clientX, y: t.clientY }
    }
  }

  const onTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
    const te = e.evt as TouchEvent
    // detect “tap”
    if (
      !hasPinched.current &&
      !hasPanned.current &&
      tapStart.current &&
      Object.keys(pointers.current).length === 1 &&
      te.changedTouches.length === 1
    ) {
      const t0 = te.changedTouches[0]
      const dx = t0.clientX - tapStart.current.x
      const dy = t0.clientY - tapStart.current.y
      if (Math.hypot(dx, dy) < TAP_THRESHOLD) {
        // this was a tap!
        const x = (t0.clientX - pos.x) / scale
        const y = (t0.clientY - pos.y) / scale
        // @ts-ignore
        handlers.onTap({ x, y })
      }
    }
    // cleanup pointers
    for (const t of Array.from(te.changedTouches)) {
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
    onTap: (_p: Pos) => {},
    setDragging: (d: boolean) => {
      isDragging.current = d
    },
  }

  return { dims, scale, pos, setScale, setPos, handlers }
}
