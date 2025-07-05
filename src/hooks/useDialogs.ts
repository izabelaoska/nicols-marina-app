// src/hooks/useDialogs.ts
import { useState } from 'react'
import type { MiejscePostojowe } from './useMiejscaPostojowe'
import type { DodajMiejscePostojoweValues } from '../components/DodajMiejscePostojoweDialog'

type Pos = { x: number; y: number }

interface DialogsProps {
  addBerth: (pos: Pos, vals: DodajMiejscePostojoweValues) => Promise<void>
  updateBerth: (
    berth: MiejscePostojowe,
    vals: DodajMiejscePostojoweValues
  ) => Promise<void>
  deleteBerth: (id: string) => Promise<void>
}

export function useDialogs({
  addBerth,
  updateBerth,
  deleteBerth,
}: DialogsProps) {
  const [infoBerth, setInfoBerth] = useState<MiejscePostojowe | null>(null)
  const [dialogPos, setDialogPos] = useState<Pos | null>(null)
  const [editing, setEditing] = useState<MiejscePostojowe | null>(null)

  const openInfo = (b: MiejscePostojowe) => setInfoBerth(b)
  const closeInfo = () => setInfoBerth(null)

  // open blank form
  const openAdd = (pos: Pos) => {
    setEditing(null)
    setDialogPos(pos)
  }

  // open pre-filled form
  const openEdit = (b: MiejscePostojowe) => {
    setEditing(b)
    setDialogPos({ x: b.position_x, y: b.position_y })
    setInfoBerth(null)
  }

  const closeAdd = () => {
    setEditing(null)
    setDialogPos(null)
  }

  // on Save
  const save = async (pos: Pos, vals: DodajMiejscePostojoweValues) => {
    if (editing) {
      await updateBerth(editing, vals)
    } else {
      await addBerth(pos, vals)
    }
    closeAdd()
  }

  const remove = async (id: string) => {
    await deleteBerth(id)
    closeInfo()
  }

  return {
    infoBerth,
    dialogPos,
    editing,
    openInfo,
    closeInfo,
    openAdd,
    openEdit,
    closeAdd,
    save,
    remove,
  }
}
