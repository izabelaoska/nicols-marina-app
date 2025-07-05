import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import useBoatIcon from '../hooks/useBoatIcon'
import { useMiejscaPostojowe } from '../hooks/useMiejscaPostojowe'
import type { DodajMiejscePostojoweValues } from './DodajMiejscePostojoweDialog'
import { DodajMiejscePostojoweDialog } from './DodajMiejscePostojoweDialog'
import { MiejscePostojoweInfoDialog } from './MiejscePostojoweInfoDialog'
import { useStageTransform } from '../hooks/useStageTransform'
import { useDialogs } from '../hooks/useDialogs'
import PotwierdzenieArchiwizacjiDialog from './PotwierdzenieArchiwizacjiDialog'

type Pos = { x: number; y: number }

export default function MarinaCanvas() {
  const [background] = useImage('/marina-layout.png')
  const boatIcon = useBoatIcon(28, 'white')
  const [showArchivedAlert, setShowArchivedAlert] = useState(false)
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null)

  // Berth data + CRUD
  const {
    berths,
    loading,
    error,
    updatePosition,
    addBerth,
    updateBerth,
    archiveBerth,
  } = useMiejscaPostojowe()

  // Pan/zoom/resize
  const { dims, scale, pos, handlers } = useStageTransform(background)

  // Dialog logic
  const {
    infoBerth,
    dialogPos,
    openInfo,
    closeInfo,
    openAdd,
    openEdit,
    closeAdd,
    save,
    archive,
    editing,
  } = useDialogs({ addBerth, updateBerth, archiveBerth })

  handlers.onTap = (p: Pos) => {
    // if tapping on an occupied berth, show info instead of add
    const hit = berths.find((b) => {
      const dx = p.x - b.position_x
      const dy = p.y - b.position_y
      // 14 is half your icon width
      return Math.hypot(dx, dy) <= 14
    })
    if (hit) {
      openInfo(hit)
    } else {
      openAdd(p)
    }
  }

  const stageRef = useRef<any>(null)

  // Disable default browser pinch-zoom
  useEffect(() => {
    const container = stageRef.current?.container()
    if (container) container.style.touchAction = 'none'
  }, [])

  if (loading) return <div>Ładowanie...</div>
  if (error) return <div>Błąd: {error.message}</div>
  if (!background || !boatIcon) return null

  const handleConfirmArchive = async () => {
    if (!pendingArchiveId) return
    await archive(pendingArchiveId)
    setShowArchivedAlert(true)
    setTimeout(() => setShowArchivedAlert(false), 3000)
    setPendingArchiveId(null)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={dims.w}
        height={dims.h}
        x={pos.x}
        y={pos.y}
        scaleX={scale}
        scaleY={scale}
        style={{ userSelect: 'none' }}
        // Desktop click opens add
        onClick={(e) => handlers.onClick(e, (p) => openAdd(p))}
        // Touch-driven pan & pinch
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
      >
        <Layer>
          <KonvaImage
            image={background}
            x={0}
            y={0}
            width={background.width}
            height={background.height}
          />
        </Layer>
        <Layer>
          {berths.map((b) => (
            <KonvaImage
              key={b.id}
              image={boatIcon}
              x={b.position_x}
              y={b.position_y}
              width={28}
              height={28}
              offsetX={14}
              offsetY={14}
              draggable
              onDragStart={() => handlers.setDragging(true)}
              onDragEnd={(e) => {
                handlers.setDragging(false)
                updatePosition(b.id, e.target.x(), e.target.y())
              }}
              // Boat icon handlers: check occupancy on click & tap
              onClick={(e) => {
                e.cancelBubble = true
                b.zajete
                  ? openInfo(b)
                  : openAdd({ x: b.position_x, y: b.position_y })
              }}
              onTap={(e) => {
                e.cancelBubble = true
                b.zajete
                  ? openInfo(b)
                  : openAdd({ x: b.position_x, y: b.position_y })
              }}
            />
          ))}
        </Layer>
      </Stage>

      <DodajMiejscePostojoweDialog
        open={!!dialogPos}
        initialPos={dialogPos}
        onSave={(pos, vals: DodajMiejscePostojoweValues) => save(pos, vals)}
        onCancel={closeAdd}
        editing={editing}
      />

      {showArchivedAlert && (
        <div
          role="alert"
          className="alert alert-error alert-soft fixed inset-x-0 bottom-4 mx-auto z-50 max-w-lg w-auto px-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Miejsce postojowe zarchiwizowane!</span>
        </div>
      )}

      {infoBerth && (
        <MiejscePostojoweInfoDialog
          berth={infoBerth}
          onClose={closeInfo}
          onArchive={() => setPendingArchiveId(infoBerth.id)}
          onEdit={() => openEdit(infoBerth)}
        />
      )}

      <PotwierdzenieArchiwizacjiDialog
        open={pendingArchiveId !== null}
        message="Na pewno chcesz zarchiwizować to miejsce postojowe?"
        onCancel={() => setPendingArchiveId(null)}
        onConfirm={handleConfirmArchive}
      />
    </div>
  )
}
