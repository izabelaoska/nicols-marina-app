import { useRef } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import useBoatIcon from '../hooks/useBoatIcon'
import { useMiejscaPostojowe } from '../hooks/useMiejscaPostojowe'
import type { DodajMiejscePostojoweValues } from './DodajMiejscePostojoweDialog'
import { DodajMiejscePostojoweDialog } from './DodajMiejscePostojoweDialog'
import { MiejscePostojoweInfoDialog } from './MiejscePostojoweInfoDialog'
import { useStageTransform } from '../hooks/useStageTransform'
import { useDialogs } from '../hooks/useDialogs'

export default function MarinaCanvas() {
  const [background] = useImage('/marina-layout.png')
  const boatIcon = useBoatIcon(28, 'white')

  // Berth data + CRUD
  const { berths, loading, error, updatePosition, addBerth, deleteBerth } =
    useMiejscaPostojowe()

  // Pan/zoom/resize
  const { dims, scale, pos, handlers } = useStageTransform(background)

  // Dialog logic
  const {
    infoBerth,
    dialogPos,
    openInfo,
    closeInfo,
    openAdd,
    closeAdd,
    save,
    remove,
  } = useDialogs({ addBerth, deleteBerth })

  const stageRef = useRef(null)

  if (loading) return <div>Ładowanie...</div>
  if (error) return <div>Błąd: {error.message}</div>
  if (!background || !boatIcon) return null

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
    >
      <Stage
        ref={stageRef}
        width={dims.w}
        height={dims.h}
        x={pos.x}
        y={pos.y}
        scaleX={scale}
        scaleY={scale}
        onClick={(e) => handlers.onClick(e, openAdd)}
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
              onDragEnd={(e) =>
                updatePosition(b.id, e.target.x(), e.target.y())
              }
              onClick={(e) => {
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
      />

      {infoBerth && (
        <MiejscePostojoweInfoDialog
          berth={infoBerth}
          onClose={closeInfo}
          onDelete={() => remove(infoBerth.id)}
        />
      )}
    </div>
  )
}
