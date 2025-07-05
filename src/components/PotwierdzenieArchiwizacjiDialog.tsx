export default function PotwierdzenieArchiwizacjiDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <>
      {/* darker overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-[1010]" />
      <div className="modal modal-open fixed inset-0 z-50 pointer-events-none">
        <div className="modal-box pointer-events-auto mx-auto mt-20 bg-white">
          <p className="mb-4">{message}</p>
          <div className="modal-action justify-end">
            <button className="btn btn-outline" onClick={onCancel}>
              Anuluj
            </button>
            <button className="btn btn-warning" onClick={onConfirm}>
              Tak, archiwizuj
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
