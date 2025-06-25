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

  // 3) Dimensions (swap for rotated)
  const [dims, setDims] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })

  // recalc dims & fit scale on load, resize or when bg arrives
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
    return () => window.removeEventListener('resize', recomputeLayout)
  }, [recomputeLayout])

  // 4) Fetch berths once
  useEffect(() => {
    supabase
      .from('MiejscaPostojowe')
      .select('*')
      .then(({ data }) => data && setBerths(data as Miejsce[]))
  }, [])

  // 5) Single-finger tap only fires onTap; guard against pinch
  const handleTap = async (e: any) => {
    // if two touches are down, bail
    if ((e.evt as TouchEvent).touches?.length > 1) return
    const stage = stageRef.current!
    const p = stage.getPointerPosition()
    if (!p) return
    if (
      !window.confirm(
        `Dodać nowe miejsce? (x:${Math.round(p.x)}, y:${Math.round(p.y)})`
      )
    )
      return

    const { data } = await supabase
      .from('MiejscaPostojowe')
      .insert({ position_x: p.x, position_y: p.y, zajęte: false })
      .select()
      .single()
    if (data) setBerths((b) => [...b, data as Miejsce])
  }

  // 6) Pinch-to-zoom & pan
  const handleTouchMove = (e: any) => {
    const evt = e.evt as TouchEvent
    if (evt.touches.length !== 2) return
    evt.preventDefault()
    const [t1, t2] = [evt.touches[0], evt.touches[1]]
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    if (!lastDist) {
      setLastDist(dist)
      return
    }
    const change = dist / lastDist
    let newScale = scale * change
    if (newScale < initialScale) newScale = initialScale

    const cx = (t1.clientX + t2.clientX) / 2
    const cy = (t1.clientY + t2.clientY) / 2
    const x = cx - (cx - pos.x) * (newScale / scale)
    const y = cy - (cy - pos.y) * (newScale / scale)

    setScale(newScale)
    setPos({ x, y })
    setLastDist(dist)
  }
  const handleTouchEnd = () => setLastDist(0)

  // 7) Portrait-only wrapper on mobile
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
        transform: isLandscape ? 'rotate(-90deg)' : undefined,
        transformOrigin: 'center center',
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
        onTap={handleTap}
        onClick={handleTap}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
