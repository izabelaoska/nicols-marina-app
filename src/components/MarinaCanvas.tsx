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
  // 1) Data + image
  const [berths, setBerths] = useState<Miejsce[]>([])
  const [background] = useImage('/marina-layout.png')

  // 2) Canvas refs + transform state
  const stageRef = useRef<any>(null)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [lastDist, setLastDist] = useState(0)
  const [initialScale, setInitialScale] = useState(1)
  const pinchRef = useRef(false)

  // 3) Dimensions (swap for rotated)
  const [dims, setDims] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })

  const recomputeLayout = useCallback(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
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
    recomputeLayout()
    window.addEventListener('resize', recomputeLayout)
    window.addEventListener('orientationchange', recomputeLayout)
    return () => {
      window.removeEventListener('resize', recomputeLayout)
      window.removeEventListener('orientationchange', recomputeLayout)
    }
  }, [recomputeLayout])

  // 4) Fetch berths once
  useEffect(() => {
    supabase
      .from('MiejscaPostojowe')
      .select('*')
      .then(({ data }) => data && setBerths(data as Miejsce[]))
  }, [])

  // 5) Portrait / landscape detection (only to swap w/h)
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
  const [angle, setAngle] = useState(0)
  useEffect(() => {
    const upd = () => {
      const a = screen.orientation?.angle ?? (window as any).orientation ?? 0
      setAngle(a as number)
    }
    window.addEventListener('orientationchange', upd)
    upd()
    return () => window.removeEventListener('orientationchange', upd)
  }, [])
  const isLandscape =
    isMobile && (angle === 90 || angle === -90 || angle === 270)

  // final canvas size
  const width = isLandscape ? dims.h : dims.w
  const height = isLandscape ? dims.w : dims.h

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={pos.x}
        y={pos.y}
        scaleX={scale}
        scaleY={scale}
        // Gesture-based pinch-to-zoom
        onGestureStart={(e) => {
          e.evt.preventDefault()
          pinchRef.current = true
          setLastDist(0)
        }}
        onGestureChange={(e) => {
          const touches = (e.evt as TouchEvent).touches
          if (touches.length !== 2) return
          const [t1, t2] = touches
          const dist = Math.hypot(
            t2.clientX - t1.clientX,
            t2.clientY - t1.clientY
          )
          if (!lastDist) {
            setLastDist(dist)
            return
          }

          const change = dist / lastDist
          if (change <= 1) {
            // ignore “pinch in” (no zoom out)
            return
          }

          const newScale = Math.max(initialScale, scale * change)
          const cx = (t1.clientX + t2.clientX) / 2
          const cy = (t1.clientY + t2.clientY) / 2

          setPos({
            x: cx - (cx - pos.x) * (newScale / scale),
            y: cy - (cy - pos.y) * (newScale / scale),
          })
          setScale(newScale)
          setLastDist(dist)
        }}
        onGestureEnd={() => {
          setLastDist(0)
          // clear the pinch‐flag after Konva finishes its internal tap logic
          setTimeout(() => {
            pinchRef.current = false
          }, 0)
        }}
        style={{ touchAction: 'none', userSelect: 'none' }}
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
          {berths.map((m) => (
            <Circle
              key={m.id}
              x={m.position_x}
              y={m.position_y}
              radius={10}
              fill={m.zajęte ? 'blue' : 'green'}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
