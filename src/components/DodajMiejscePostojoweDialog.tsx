import { useState, useEffect } from 'react'

export interface DodajMiejscePostojoweValues {
  tenant: string
  start: string
  end: string
  amount: number
  phone: string
}

export function DodajMiejscePostojoweDialog({
  open,
  initialPos,
  onSave,
  onCancel,
}: {
  open: boolean
  initialPos: { x: number; y: number } | null
  onSave: (
    pos: { x: number; y: number },
    values: DodajMiejscePostojoweValues
  ) => void
  onCancel: () => void
}) {
  const [tenant, setTenant] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (open) {
      setTenant('')
      setStart('')
      setEnd('')
      setAmount('')
      setPhone('')
    }
  }, [open])

  const handleSave = () => {
    if (initialPos) {
      onSave(initialPos, {
        tenant,
        start,
        end,
        amount: Number(amount),
        phone,
      })
    }
  }

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="modal-box modal-bottom sm:modal-middle w-full sm:w-96 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg">Dodaj dane</h3>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="label-text">Najemca</span>
            <input
              type="text"
              placeholder="Imię i nazwisko"
              className="input input-bordered w-full"
              value={tenant}
              onChange={(e) => setTenant(e.currentTarget.value)}
            />
          </label>

          <div className="flex gap-2">
            <label className="flex-1">
              <span className="label-text">Data rozpoczęcia</span>
              <input
                type="date"
                className="input input-bordered w-full"
                value={start}
                onChange={(e) => setStart(e.currentTarget.value)}
              />
            </label>
            <label className="flex-1">
              <span className="label-text">Umowa do</span>
              <input
                type="date"
                className="input input-bordered w-full"
                value={end}
                onChange={(e) => setEnd(e.currentTarget.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="label-text">Kwota</span>
            <input
              type="number"
              placeholder="Kwota"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.currentTarget.value)}
            />
          </label>

          <label className="block">
            <span className="label-text">Telefon</span>
            <input
              type="tel"
              placeholder="+48 123 456 789"
              className="input input-bordered w-full"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
          </label>
        </div>

        <div className="modal-action mt-6">
          <button className="btn btn-outline" onClick={onCancel}>
            Anuluj
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!tenant || !start || !end || !amount || !phone}
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  )
}
