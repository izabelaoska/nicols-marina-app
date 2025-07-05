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
      zaplacono_do: string
    }
  }
  onClose: () => void
  onArchive: (id: string) => void
  onEdit: () => void
}

export function MiejscePostojoweInfoDialog({
  berth,
  onClose,
  onArchive,
  onEdit,
}: MiejsceInfoDialogProps) {
  return (
    <div className="modal modal-open p-2 pointer-events-none">
      <div className="modal-box w-96 p-6 pointer-events-auto">
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
                <strong>Umowa od:</strong> {berth.umowa.data_od}
              </p>
            )}
            {berth.umowa.data_do && (
              <p>
                <strong>Umowa do:</strong> {berth.umowa.data_do}
              </p>
            )}
            {berth.umowa.zaplacono_do && (
              <p>
                <strong>Zapłacone do:</strong> {berth.umowa.zaplacono_do}
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
          <button
            className="btn btn-sm btn-warning btn-outline"
            onClick={() => onArchive(berth.id)}
          >
            Archiwizuj
          </button>
          <button className="btn btn-sm btn-info btn-outline" onClick={onEdit}>
            Edytuj
          </button>
          <button className="btn btn-sm btn-outline" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}
