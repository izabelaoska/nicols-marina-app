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
      <div className="fixed inset-0 bg-black bg-opacity-60 z-60" />
      <div className="modal modal-open fixed inset-0 z-70">
        <div className="modal-box pointer-events-auto mx-auto mt-20 bg-gray-300">
          <p className="mb-4 text-lg font-semibold text-gray-900">{message}</p>
          <div className="modal-action justify-start">
            <button className="btn btn-soft" onClick={onCancel}>
              Anuluj
            </button>
            <button className="btn btn-error" onClick={onConfirm}>
              Tak, archiwizuj
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
