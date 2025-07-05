import { useState } from 'react'
import type { MiejscePostojowe } from './useMiejscaPostojowe'
import type { DodajMiejscePostojoweValues } from '../components/DodajMiejscePostojoweDialog'

type Pos = { x: number; y: number }

interface DialogsProps {
  addBerth: (pos: Pos, vals: DodajMiejscePostojoweValues) => Promise<void>
  deleteBerth: (id: string) => Promise<void>
}

export function useDialogs({ addBerth, deleteBerth }: DialogsProps) {
  const [infoBerth, setInfoBerth] = useState<MiejscePostojowe | null>(null)
  const [dialogPos, setDialogPos] = useState<Pos | null>(null)

  const openInfo = (b: MiejscePostojowe) => setInfoBerth(b)
  const closeInfo = () => setInfoBerth(null)
  const openAdd = (pos: Pos) => setDialogPos(pos)
  const closeAdd = () => setDialogPos(null)

  const save = async (pos: Pos, values: DodajMiejscePostojoweValues) => {
    await addBerth(pos, values)
    closeAdd()
  }

  const remove = async (id: string) => {
    await deleteBerth(id)
    closeInfo()
  }

  return {
    infoBerth,
    dialogPos,
    openInfo,
    closeInfo,
    openAdd,
    closeAdd,
    save,
    remove,
  }
}
