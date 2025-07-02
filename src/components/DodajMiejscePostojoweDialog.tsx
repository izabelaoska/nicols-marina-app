import { useState, useEffect } from 'react'

export interface DodajMiejscePostojoweValues {
  tenant: string
  start?: string
  end?: string
  amount: number
  phone?: string
  uwagi?: string
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
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (open) {
      setTenant('')
      setStart('')
      setEnd('')
      setAmount('')
      setPhone('')
      setRemarks('')
    }
  }, [open])

  const handleSave = () => {
    if (!initialPos) return
    onSave(initialPos, {
      tenant: tenant.trim(),
      amount: Number(amount),
      ...(start.trim() ? { start } : {}),
      ...(end.trim() ? { end } : {}),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(remarks.trim() ? { uwagi: remarks.trim() } : {}),
    })
  }

  const canSave = !!(tenant.trim() && amount.trim())

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="p-2 w-full h-full flex items-center justify-center">
        <div className="modal-box w-full sm:w-96 max-h-[90vh] overflow-y-auto p-6">
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

            <div className="flex flex-col sm:gap-2 space-y-4 sm:space-y-0">
              <label className="flex-1">
                <span className="label-text">
                  Data rozpoczęcia (opcjonalnie)
                </span>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={start}
                  onChange={(e) => setStart(e.currentTarget.value)}
                />
              </label>
              <label className="flex-1">
                <span className="label-text">Umowa do (opcjonalnie)</span>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={end}
                  onChange={(e) => setEnd(e.currentTarget.value)}
                />
              </label>
            </div>

            <label className="block relative">
              <span className="label-text">Kwota (PLN)</span>
              <input
                type="number"
                placeholder="Kwota"
                className="input input-bordered w-full pr-16"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
              />
            </label>

            <label className="block">
              <span className="label-text">Telefon (opcjonalnie)</span>
              <input
                type="tel"
                placeholder="+48 123 456 789"
                className="input input-bordered w-full"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
              />
            </label>

            <label className="block">
              <span className="label-text">Uwagi (opcjonalnie)</span>
              <textarea
                placeholder="np. kajak, mała łódź, motorówka"
                className="textarea textarea-bordered w-full"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.currentTarget.value)}
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
              disabled={!canSave}
            >
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
