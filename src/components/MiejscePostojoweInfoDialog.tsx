export interface MiejsceInfoDialogProps {
  berth: {
    id: string
    zajete: boolean
    uwagi?: string
    najemca?: {
      imie: string
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
    <div className="modal modal-open p-2">
      <div className="modal-box w-80 sm:96 p-6">
        <h3 className="font-bold text-lg mb-4">Szczegóły miejsca</h3>

        <p>
          <strong>Status:</strong> {berth.zajete ? 'Zajęte' : 'Wolne'}
        </p>

        {berth.najemca && (
          <>
            <p>
              <strong>Najemca:</strong> {berth.najemca.imie}
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

        <div className="modal-action justify-start">
          <button className="btn btn-error" onClick={() => onDelete(berth.id)}>
            Usuń
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}
