import { useEffect, useState, useRef, useCallback } from 'react'
import { Stage, Layer, Circle, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { supabase } from '../lib/supabaseClient'

type Miejsce = {
  id: string
  position_x: number
  position_y: number
  zajęte: boolean
}

export default function MarinaCanvas() {
  // 1) Load background + berths
  const [background] = useImage('/marina-layout.png')
  const [berths, setBerths] = useState<Miejsce[]>([])
  useEffect(() => {
    supabase
      .from('MiejscaPostojowe')
      .select('*')
      .then(({ data }) => data && setBerths(data as Miejsce[]))
  }, [])

  // 2) Fit + pan/zoom state
  const [dims, setDims] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })
  const [initialScale, setInitialScale] = useState(1)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const fitToScreen = useCallback(() => {
    const vw = window.innerWidth,
      vh = window.innerHeight
    setDims({ w: vw, h: vh })
    if (!background) return
    const fit = Math.max(vw / background.width, vh / background.height)
    setInitialScale(fit)
    setScale(fit)
    setPos({
      x: (vw - background.width * fit) / 2,
      y: (vh - background.height * fit) / 2,
    })
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

  // refs for touch logic
  const stageRef = useRef<any>(null)
  const pointers = useRef<Record<number, { x: number; y: number }>>({})
  const lastDist = useRef(0)
  const hasPinched = useRef(false)
  const TAP_THRESHOLD = 6
  const hasPanned = useRef(false)
  const tapStart = useRef<{ x: number; y: number } | null>(null)

  // clamp a given pos so the image always covers the viewport
  function clampPos(x: number, y: number) {
    if (!background) return { x, y }
    const wScaled = background.width * scale
    const hScaled = background.height * scale
    const minX = Math.min(0, dims.w - wScaled)
    const maxX = 0
    const minY = Math.min(0, dims.h - hScaled)
    const maxY = 0

    return {
      x: Math.max(minX, Math.min(x, maxX)),
      y: Math.max(minY, Math.min(y, maxY)),
    }
  }

  const onTouchStart: React.TouchEventHandler = (e) => {
    for (const t of Array.from(e.changedTouches)) {
      pointers.current[t.identifier] = { x: t.clientX, y: t.clientY }
    }
    if (Object.keys(pointers.current).length === 1) {
      const t = e.changedTouches[0]
      tapStart.current = { x: t.clientX, y: t.clientY }
      hasPinched.current = false
      hasPanned.current = false
    }
  }

  const onTouchMove: React.TouchEventHandler = (e) => {
    const ids = Object.keys(pointers.current)
    // PINCH (two fingers)
    if (ids.length === 2) {
      hasPinched.current = true
      e.preventDefault()
      for (const t of Array.from(e.touches)) {
        if (pointers.current[t.identifier] != null) {
          pointers.current[t.identifier] = { x: t.clientX, y: t.clientY }
        }
      }
      const [p1, p2] = ids.map((id) => pointers.current[+id])
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      if (!lastDist.current) {
        lastDist.current = dist
        return
      }
      const ratio = dist / lastDist.current
      const newScale = Math.max(initialScale, scale * ratio)

      // recenter on pinch midpoint
      const cx = (p1.x + p2.x) / 2
      const cy = (p1.y + p2.y) / 2
      const newX = cx - (cx - pos.x) * (newScale / scale)
      const newY = cy - (cy - pos.y) * (newScale / scale)

      const clamped = clampPos(newX, newY)
      setScale(newScale)
      setPos(clamped)
      lastDist.current = dist
      return
    }

    // PAN (one finger)
    if (ids.length === 1) {
      const id = +ids[0]
      const prev = pointers.current[id]
      const t = Array.from(e.touches).find((x) => x.identifier === id)
      if (!t || !prev) return

      const dx = t.clientX - prev.x
      const dy = t.clientY - prev.y
      if (Math.hypot(dx, dy) > TAP_THRESHOLD) {
        hasPanned.current = true
      }

      const unclampedX = pos.x + dx
      const unclampedY = pos.y + dy
      const clamped = clampPos(unclampedX, unclampedY)
      setPos(clamped)

      pointers.current[id] = { x: t.clientX, y: t.clientY }
    }
  }

  const onTouchEnd: React.TouchEventHandler = async (e) => {
    // TAP
    if (
      !hasPinched.current &&
      !hasPanned.current &&
      tapStart.current &&
      Object.keys(pointers.current).length === 1 &&
      e.changedTouches.length === 1
    ) {
      const t = e.changedTouches[0]
      const dx = t.clientX - tapStart.current.x
      const dy = t.clientY - tapStart.current.y
      if (Math.hypot(dx, dy) < TAP_THRESHOLD) {
        const p = stageRef.current.getPointerPosition()
        if (
          p &&
          window.confirm(
            `Add berth at x:${Math.round(p.x)} y:${Math.round(p.y)}?`
          )
        ) {
          const { data } = await supabase
            .from('MiejscaPostojowe')
            .insert({ position_x: p.x, position_y: p.y, zajęte: false })
            .select()
            .single()
          if (data) setBerths((b) => [...b, data as Miejsce])
        }
      }
    }

    // cleanup
    for (const t of Array.from(e.changedTouches)) {
      delete pointers.current[t.identifier]
    }
    if (Object.keys(pointers.current).length < 2) {
      lastDist.current = 0
    }
    tapStart.current = null
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Stage
        ref={stageRef}
        width={dims.w}
        height={dims.h}
        x={pos.x}
        y={pos.y}
        scaleX={scale}
        scaleY={scale}
        style={{ background: '#fafafa' }}
      >
        <Layer>
          {background && (
            <KonvaImage
              image={background}
              x={0}
              y={0}
              width={background.width}
              height={background.height}
            />
          )}
          {berths.map((b) => (
            <Circle
              key={b.id}
              x={b.position_x}
              y={b.position_y}
              radius={10}
              fill={b.zajęte ? 'blue' : 'green'}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
