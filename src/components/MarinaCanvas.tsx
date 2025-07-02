import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Stage, Layer, Circle, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { supabase } from '../lib/supabaseClient'
import type { DodajMiejscePostojoweValues } from '../components/DodajMiejscePostojoweDialog'
import { DodajMiejscePostojoweDialog } from '../components/DodajMiejscePostojoweDialog'

type Miejsce = {
  id: string
  position_x: number
  position_y: number
  zajęte: boolean
}

export default function MarinaCanvas() {
  // 1) Background + existing berths
  const [background] = useImage('/marina-layout.png')
  const [berths, setBerths] = useState<Miejsce[]>([])
  useEffect(() => {
    supabase
      .from('MiejscaPostojowe')
      .select('*')
      .then(({ data }) => data && setBerths(data as Miejsce[]))
  }, [])

  // 2) Fit + pan/zoom
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

  // 3) Touch/pinch/pan refs & helpers (unchanged) …
  const stageRef = useRef<any>(null)
  const pointers = useRef<Record<number, { x: number; y: number }>>({})
  const lastDist = useRef(0)
  const hasPinched = useRef(false)
  const hasPanned = useRef(false)
  const tapStart = useRef<{ x: number; y: number } | null>(null)
  const TAP_THRESHOLD = 6

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

  // 4) Dialog state
  const [dialogPos, setDialogPos] = useState<{ x: number; y: number } | null>(
    null
  )

  // 5) Common fn to open dialog at canvas coords
  const openDialogAt = (clientX: number, clientY: number) => {
    const canvasX = (clientX - pos.x) / scale
    const canvasY = (clientY - pos.y) / scale
    setDialogPos({ x: canvasX, y: canvasY })
  }

  // 6) Desktop click
  const handleClick = (e: any) => {
    const { clientX, clientY } = e.evt as MouseEvent
    openDialogAt(clientX, clientY)
  }

  // 7) Touch handlers
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
    if (ids.length === 2) {
      // pinch logic (unchanged) …
      hasPinched.current = true
      e.preventDefault()
      for (const t of Array.from(e.touches)) {
        if (pointers.current[t.identifier]) {
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
      const cx = (p1.x + p2.x) / 2
      const cy = (p1.y + p2.y) / 2
      const newX = cx - (cx - pos.x) * (newScale / scale)
      const newY = cy - (cy - pos.y) * (newScale / scale)
      setScale(newScale)
      setPos(clampPos(newX, newY))
      lastDist.current = dist
      return
    }
    if (ids.length === 1) {
      // pan logic (unchanged) …
      const id = +ids[0]
      const prev = pointers.current[id]
      const t = Array.from(e.touches).find((x) => x.identifier === id)
      if (!t || !prev) return
      const dx = t.clientX - prev.x
      const dy = t.clientY - prev.y
      if (Math.hypot(dx, dy) > TAP_THRESHOLD) {
        hasPanned.current = true
      }
      setPos(clampPos(pos.x + dx, pos.y + dy))
      pointers.current[id] = { x: t.clientX, y: t.clientY }
    }
  }

  const onTouchEnd: React.TouchEventHandler = (e) => {
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
        openDialogAt(t.clientX, t.clientY)
      }
    }
    // cleanup
    for (const t of Array.from(e.changedTouches)) {
      delete pointers.current[t.identifier]
    }
    if (Object.keys(pointers.current).length < 2) lastDist.current = 0
    tapStart.current = null
  }

  // inside handleDialogSave in MarinaCanvas.tsx

  const handleDialogSave = async (
    pos2: { x: number; y: number },
    values: DodajMiejscePostojoweValues
  ) => {
    // 1) Najemca
    const { data: tenant, error: tenantError } = await supabase
      .from('Najemcy')
      .insert({
        imię: values.tenant, // <— column is "imię"
        telefon: values.phone, // <— column is "telefon"
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('Failed to insert Najemca:', tenantError)
      alert('Nie udało się zapisać najemcy. Sprawdź konsolę.')
      return
    }

    // 2) Umowa
    const { data: contract, error: contractError } = await supabase
      .from('Umowy')
      .insert({
        najemca_id: tenant.id,
        data_od: values.start, // <— column is "data_od"
        data_do: values.end, // <— column is "data_do"
        kwota: values.amount, // <— column is "kwota"
      })
      .select()
      .single()

    if (contractError || !contract) {
      console.error('Failed to insert Umowa:', contractError)
      alert('Nie udało się zapisać umowy.')
      return
    }

    // 3) Berth
    const { data: berth, error: berthError } = await supabase
      .from('MiejscaPostojowe')
      .insert({
        position_x: pos2.x,
        position_y: pos2.y,
        zajęte: true,
        najemca_id: tenant.id,
        uwagi: values.uwagi ?? '',
      })
      .select()
      .single()

    if (berthError || !berth) {
      console.error('Failed to insert MiejscePostojowe:', berthError)
      alert('Nie udało się zapisać miejsca.')
      return
    }

    setBerths((b) => [...b, berth as Miejsce])
    setDialogPos(null)
  }

  // 9) Render
  return (
    <>
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
          onClick={handleClick}
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

      <DodajMiejscePostojoweDialog
        open={!!dialogPos}
        initialPos={dialogPos}
        onCancel={() => setDialogPos(null)}
        onSave={handleDialogSave}
      />
    </>
  )
}
