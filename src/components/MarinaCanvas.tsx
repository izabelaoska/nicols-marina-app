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

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
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
            width={window.innerWidth}
            height={window.innerHeight}
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
  )
}
