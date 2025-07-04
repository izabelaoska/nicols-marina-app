export interface MiejsceInfoDialogProps {
  berth: {
    id: string
    position_x: number
    position_y: number
    zajęte: boolean
    uwagi?: string
    najemca?: {
      imię: string
      telefon?: string
      email?: string
      created_at?: string
    }
    umowa?: {
      kwota: number
      data_od?: string
      data_do?: string
      created_at?: string
    }
  }
  onClose: () => void
  onDelete: (id: string) => void
}

export function MiejscePostojoweInfoDialog({
  berth,
  onClose,
  onDelete,
}: MiejsceInfoDialogProps) {
  return (
    <div className="modal modal-open">
      <div className="modal-box w-full sm:w-96">
        <h3 className="font-bold text-lg mb-4">Szczegóły miejsca</h3>

        <p>
          <strong>Pozycja:</strong> {Math.round(berth.position_x)},{' '}
          {Math.round(berth.position_y)}
        </p>
        <p>
          <strong>Status:</strong> {berth.zajęte ? 'Zajęte' : 'Wolne'}
        </p>

        {berth.najemca && (
          <>
            <p>
              <strong>Najemca:</strong> {berth.najemca.imię}
            </p>
            {berth.najemca.telefon && (
              <p>
                <strong>Telefon:</strong> {berth.najemca.telefon}
              </p>
            )}
            {berth.najemca.email && (
              <p>
                <strong>Email:</strong> {berth.najemca.email}
              </p>
            )}
          </>
        )}

        {berth.umowa && (
          <>
            <p>
              <strong>Kwota:</strong> {berth.umowa.kwota} PLN
            </p>
            {berth.umowa.data_od && (
              <p>
                <strong>Od:</strong> {berth.umowa.data_od}
              </p>
            )}
            {berth.umowa.data_do && (
              <p>
                <strong>Do:</strong> {berth.umowa.data_do}
              </p>
            )}
          </>
        )}

        {berth.uwagi && (
          <p>
            <strong>Uwagi:</strong> {berth.uwagi}
          </p>
        )}

        <div className="modal-action justify-between">
          <button className="btn btn-error" onClick={() => onDelete(berth.id)}>
            Usuń
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}
