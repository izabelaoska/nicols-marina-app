// src/components/MarinaCanvas.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import useImage from 'use-image'
import { supabase } from '../lib/supabaseClient'
import type { DodajMiejscePostojoweValues } from './DodajMiejscePostojoweDialog'
import { DodajMiejscePostojoweDialog } from './DodajMiejscePostojoweDialog'
import useBoatIcon from '../hooks/useBoatIcon'

type Miejsce = {
  id: string
  position_x: number
  position_y: number
  zajęte: boolean
}

export default function MarinaCanvas() {
  // background
  const [background] = useImage('/marina-layout.png')
  // SVG→Image hook
  const boatIcon = useBoatIcon(24, 'white')
  // fetched berths
  const [berths, setBerths] = useState<Miejsce[]>([])

  // fetch on mount
  useEffect(() => {
    supabase
      .from('MiejscaPostojowe')
      .select('*')
      .then(({ data }) => data && setBerths(data as Miejsce[]))
  }, [])

  // fit + pan/zoom state
  const [dims, setDims] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })
  const [initialScale, setInitialScale] = useState(1)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  // recalc on resize/orientation
  const fitToScreen = useCallback(() => {
    const vw = window.innerWidth,
      vh = window.innerHeight
    setDims({ w: vw, h: vh })
    if (!background) return
    const factor = Math.max(vw / background.width, vh / background.height)
    setInitialScale(factor)
    setScale(factor)
    setPos({
      x: (vw - background.width * factor) / 2,
      y: (vh - background.height * factor) / 2,
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

  // clamp pan
  const clampPos = (x: number, y: number) => {
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
  }

  // refs for Konva and multi-touch
  const stageRef = useRef<Konva.Stage>(null)
  const pointers = useRef<Record<number, { x: number; y: number }>>({})
  const lastDist = useRef(0)
  const hasPinched = useRef(false)
  const hasPanned = useRef(false)
  const tapStart = useRef<{ x: number; y: number } | null>(null)
  const isDraggingIcon = useRef(false)
  const TAP_THRESHOLD = 6

  // touch start for pan/pinch
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

  // touch move: pinch or pan, unless dragging icon
  const onTouchMove: React.TouchEventHandler = (e) => {
    if (isDraggingIcon.current) return
    const ids = Object.keys(pointers.current)
    if (ids.length === 2) {
      // pinch zoom
      hasPinched.current = true
      e.preventDefault()
      for (const t of Array.from(e.touches)) {
        if (pointers.current[t.identifier])
          pointers.current[t.identifier] = { x: t.clientX, y: t.clientY }
      }
      const [p1, p2] = ids.map((id) => pointers.current[+id])
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      if (!lastDist.current) {
        lastDist.current = dist
        return
      }
      const ratio = dist / lastDist.current
      const newScale = Math.max(initialScale, scale * ratio)
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
    if (ids.length === 1) {
      // pan
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

  // touch end cleanup or tap to open dialog
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
      if (Math.hypot(dx, dy) < TAP_THRESHOLD) openDialogAt(t.clientX, t.clientY)
    }
    for (const t of Array.from(e.changedTouches))
      delete pointers.current[t.identifier]
    if (Object.keys(pointers.current).length < 2) lastDist.current = 0
    tapStart.current = null
  }

  // dialog (add berth) state
  const [dialogPos, setDialogPos] = useState<{ x: number; y: number } | null>(
    null
  )
  const openDialogAt = (cx: number, cy: number) =>
    setDialogPos({ x: (cx - pos.x) / scale, y: (cy - pos.y) / scale })

  // desktop click → open dialog
  const handleClick = (e: any) => {
    const { clientX, clientY } = e.evt as MouseEvent
    openDialogAt(clientX, clientY)
  }

  // drag-end on boat → persist & update UI
  const handleBoatDragEnd = useCallback(async (id: string, e: any) => {
    isDraggingIcon.current = false
    const newX = e.target.x(),
      newY = e.target.y()
    setBerths((all) =>
      all.map((m) =>
        m.id === id ? { ...m, position_x: newX, position_y: newY } : m
      )
    )
    const { error } = await supabase
      .from('MiejscaPostojowe')
      .update({ position_x: newX, position_y: newY })
      .eq('id', id)
    if (error) console.error('Update failed', error)
  }, [])

  // handleSave from dialog (inserts tenant/contract/berth)
  const handleDialogSave = async (
    pos2: { x: number; y: number },
    values: DodajMiejscePostojoweValues
  ) => {
    const { data: tenant } = await supabase
      .from('Najemcy')
      .insert({ imię: values.tenant, telefon: values.phone })
      .select()
      .single()
    if (!tenant) return
    const { data: contract } = await supabase
      .from('Umowy')
      .insert({
        najemca_id: tenant.id,
        data_od: values.start,
        data_do: values.end,
        kwota: values.amount,
      })
      .select()
      .single()
    if (!contract) return
    const { data: berth } = await supabase
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
    if (berth) setBerths((b) => [...b, berth])
    setDialogPos(null)
  }

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
            {boatIcon &&
              berths.map((b) => {
                const S = 20
                return (
                  <KonvaImage
                    key={b.id}
                    image={boatIcon}
                    x={b.position_x}
                    y={b.position_y}
                    width={S}
                    height={S}
                    offsetX={S / 2}
                    offsetY={S / 2}
                    draggable
                    onDragStart={() => {
                      isDraggingIcon.current = true
                    }}
                    onDragEnd={(e) => handleBoatDragEnd(b.id, e)}
                  />
                )
              })}
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
