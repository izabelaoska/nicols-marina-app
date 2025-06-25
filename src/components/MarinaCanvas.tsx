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
  // 1) Berths + background
  const [berths, setBerths] = useState<Miejsce[]>([])
  const [background] = useImage('/marina-layout.png')

  // 2) Pan/zoom state
  const stageRef = useRef<any>(null)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [initialScale, setInitialScale] = useState(1)
  const [lastDist, setLastDist] = useState(0)

  // 3) Viewport sizing & fit-to-screen
  const [dims, setDims] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })
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
    return () => window.removeEventListener('resize', fitToScreen)
  }, [fitToScreen])

  // 4) Load berths
  useEffect(() => {
    supabase
      .from('MiejscaPostojowe')
      .select('*')
      .then(({ data }) => data && setBerths(data as Miejsce[]))
  }, [])

  // 5) Orientation via matchMedia (reliable on iOS & Android)
  const [isLandscape, setIsLandscape] = useState(
    window.matchMedia('(orientation: landscape)').matches
  )
  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)')
    const onChange = (e: MediaQueryListEvent) => setIsLandscape(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // swap dims when in landscape
  const width = isLandscape ? dims.h : dims.w
  const height = isLandscape ? dims.w : dims.h

  // 6) Pinch handling
  const handleGestureStart = (e: any) => {
    e.evt.preventDefault()
    setLastDist(0)
  }
  const handleGestureChange = (e: any) => {
    const touches = (e.evt as TouchEvent).touches
    if (touches.length !== 2) return
    const [t1, t2] = touches
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    if (!lastDist) {
      setLastDist(dist)
      return
    }
    const delta = dist / lastDist
    if (delta <= 1) return // ignore pinch-close (no zoom out)

    const newScale = Math.max(initialScale, scale * delta)
    const cx = (t1.clientX + t2.clientX) / 2
    const cy = (t1.clientY + t2.clientY) / 2

    setPos({
      x: cx - (cx - pos.x) * (newScale / scale),
      y: cy - (cy - pos.y) * (newScale / scale),
    })
    setScale(newScale)
    setLastDist(dist)
  }
  const handleGestureEnd = () => {
    setLastDist(0)
  }

  // once mounted, block native touch on Konva container
  useEffect(() => {
    const container = stageRef.current?.container()
    if (container) {
      container.style.touchAction = 'none'
    }
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none', // block browser from doing its own pinch
        userSelect: 'none',
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
        onGestureStart={handleGestureStart}
        onGestureChange={handleGestureChange}
        onGestureEnd={handleGestureEnd}
        style={{ touchAction: 'none' }}
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
