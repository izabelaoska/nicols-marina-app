import { useEffect, useState, useRef } from 'react'
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
  // 1) berth data
  const [berths, setBerths] = useState<Miejsce[]>([])
  // 2) background image
  const [background] = useImage('/marina-layout.png')

  // 3) zoom & pan state
  const stageRef = useRef<any>(null)
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [lastDist, setLastDist] = useState(0)

  // 4) load from Supabase
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('MiejscaPostojowe').select('*')
      if (data) setBerths(data as Miejsce[])
    })()
  }, [])

  // 5) single-tap: add a berth
  const handleClick = async (e: any) => {
    const stage = stageRef.current!
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    if (
      !window.confirm(
        `Dodać nowe miejsce? (x: ${Math.round(pointer.x)}, y: ${Math.round(
          pointer.y
        )})`
      )
    ) {
      return
    }

    const { data } = await supabase
      .from('MiejscaPostojowe')
      .insert({
        position_x: pointer.x,
        position_y: pointer.y,
        zajęte: false,
      })
      .select()
      .single()

    if (data) {
      setBerths((prev) => [...prev, data as Miejsce])
    }
  }

  // 6) pinch-to-zoom handler
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

    const scaleChange = dist / lastDist
    const newScale = stageScale * scaleChange

    const centerX = (t1.clientX + t2.clientX) / 2
    const centerY = (t1.clientY + t2.clientY) / 2
    const x = centerX - (centerX - stagePos.x) * scaleChange
    const y = centerY - (centerY - stagePos.y) * scaleChange

    setStageScale(newScale)
    setStagePos({ x, y })
    setLastDist(dist)
  }

  // reset on touch end
  const handleTouchEnd = () => setLastDist(0)

  // 7) track device orientation
  const [angle, setAngle] = useState(0)
  useEffect(() => {
    const update = () => {
      // try Screen Orientation API first
      const o =
        (screen.orientation && screen.orientation.angle) ??
        (window as any).orientation ??
        0
      setAngle(o as number)
    }
    window.addEventListener('orientationchange', update)
    update()
    return () => window.removeEventListener('orientationchange', update)
  }, [])

  const isLandscape = angle === 90 || angle === -90 || angle === 270

  // swap dimensions when rotated
  const width = isLandscape ? window.innerHeight : window.innerWidth
  const height = isLandscape ? window.innerWidth : window.innerHeight

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
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onClick={handleClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <Layer>
          {/* Background image */}
          {background && (
            <KonvaImage
              image={background}
              x={0}
              y={0}
              width={width}
              height={height}
            />
          )}
          {/* Berth circles */}
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
