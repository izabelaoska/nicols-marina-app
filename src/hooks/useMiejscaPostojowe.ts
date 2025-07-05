import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

type Najemca = {
  imie: string
  telefon?: string
  email?: string
}

type Umowa = {
  kwota: number
  data_od?: string
  data_do?: string
  zaplacone_do: string
}

export interface MiejscePostojowe {
  id: string
  position_x: number
  position_y: number
  zajete: boolean
  uwagi?: string
  najemca?: Najemca
  umowa?: Umowa
}

export function useMiejscaPostojowe() {
  const [berths, setBerths] = useState<MiejscePostojowe[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch berths on mount
  useEffect(() => {
    async function fetchBerths() {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('MiejscaPostojowe')
          .select(
            `
            id,
            position_x,
            position_y,
            zajete,
            uwagi,
            Najemcy: najemca_id (
              imie,
              telefon,
              email
            ),
            Umowy (
              kwota,
              data_od,
              data_do,
              zaplacone_do
            )
          `
          )
          .order('data_od', { foreignTable: 'Umowy', ascending: false })
          .limit(1, { foreignTable: 'Umowy' })

        if (fetchError) {
          throw fetchError
        }

        const mapped: MiejscePostojowe[] = (data ?? []).map((m: any) => ({
          id: m.id,
          position_x: m.position_x,
          position_y: m.position_y,
          zajete: m.zajete,
          uwagi: m.uwagi,
          najemca: m.Najemcy
            ? {
                imie: m.Najemcy.imie,
                telefon: m.Najemcy.telefon,
                email: m.Najemcy.email,
              }
            : undefined,
          umowa:
            Array.isArray(m.Umowy) && m.Umowy.length > 0
              ? {
                  kwota: m.Umowy[0].kwota,
                  data_od: m.Umowy[0].data_od,
                  data_do: m.Umowy[0].data_do,
                  zaplacone_do: m.Umowy[0].zaplacone_do,
                }
              : undefined,
        }))

        setBerths(mapped)
      } catch (err: any) {
        console.error('Error loading berths:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBerths()
  }, [])

  // Update a berth's position
  const updatePosition = async (id: string, x: number, y: number) => {
    try {
      const { error: updateError } = await supabase
        .from('MiejscaPostojowe')
        .update({ position_x: x, position_y: y })
        .eq('id', id)

      if (updateError) throw updateError

      setBerths((all) =>
        all.map((b) =>
          b.id === id ? { ...b, position_x: x, position_y: y } : b
        )
      )
    } catch (err) {
      console.error('Error updating position:', err)
    }
  }

  // Add a new berth (tenant + berth + contract)
  const addBerth = async (
    pos: { x: number; y: number },
    values: {
      tenant: string
      amount: number
      start?: string
      end?: string
      phone: string
      uwagi?: string
      zaplacone_do: string
    }
  ) => {
    try {
      // 1. Insert tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('Najemcy')
        .insert({ imie: values.tenant, telefon: values.phone })
        .select()
        .single()
      if (tenantError || !tenant) throw tenantError

      // 2. Insert berth
      const { data: berth, error: berthError } = await supabase
        .from('MiejscaPostojowe')
        .insert({
          position_x: pos.x,
          position_y: pos.y,
          zajete: true,
          najemca_id: tenant.id,
          uwagi: values.uwagi ?? '',
        })
        .select()
        .single()
      if (berthError || !berth) throw berthError

      // 3. Insert contract
      const { error: contractError } = await supabase.from('Umowy').insert({
        najemca_id: tenant.id,
        miejsce_id: berth.id,
        data_od: values.start,
        data_do: values.end,
        kwota: values.amount,
        zaplacone_do: values.zaplacone_do,
      })
      if (contractError) throw contractError

      // 4. Re-fetch this berth with relations
      const { data: newData, error: fetchError } = await supabase
        .from('MiejscaPostojowe')
        .select(
          `
          id,
          position_x,
          position_y,
          zajete,
          uwagi,
          Najemcy: najemca_id (
            imie,
            telefon,
            email
          ),
          Umowy (
            kwota,
            data_od,
            data_do,
            zaplacone_do
          )
        `
        )
        .eq('id', berth.id)
        .order('data_od', { foreignTable: 'Umowy', ascending: false })
        .limit(1, { foreignTable: 'Umowy' })
        .single()

      if (fetchError || !newData) throw fetchError

      // Map and append
      const mapped = {
        id: newData.id,
        position_x: newData.position_x,
        position_y: newData.position_y,
        zajete: newData.zajete,
        uwagi: newData.uwagi,
        najemca: newData.Najemcy
          ? {
              imie: newData.Najemcy[0]?.imie ?? '',
              telefon: newData.Najemcy[0]?.telefon ?? '',
              email: newData.Najemcy[0]?.email ?? '',
            }
          : undefined,
        umowa:
          Array.isArray(newData.Umowy) && newData.Umowy.length > 0
            ? {
                kwota: newData.Umowy[0].kwota,
                data_od: newData.Umowy[0].data_od,
                data_do: newData.Umowy[0].data_do,
                zaplacone_do: newData.Umowy[0].zaplacone_do,
              }
            : undefined,
      }

      setBerths((all) => [...all, mapped])
    } catch (err) {
      console.error('Error adding berth:', err)
    }
  }

  // Delete berth, tenant, and contract
  const deleteBerth = async (id: string) => {
    try {
      // Fetch najemca_id
      const { data: berthData, error: fetchErr } = await supabase
        .from('MiejscaPostojowe')
        .select('najemca_id')
        .eq('id', id)
        .single()
      if (fetchErr || !berthData?.najemca_id) throw fetchErr

      const najemcaId = berthData.najemca_id

      // Delete all three
      const [{ error: cErr }, { error: tErr }, { error: bErr }] =
        await Promise.all([
          supabase.from('Umowy').delete().eq('najemca_id', najemcaId),
          supabase.from('Najemcy').delete().eq('id', najemcaId),
          supabase.from('MiejscaPostojowe').delete().eq('id', id),
        ])
      if (cErr || tErr || bErr) throw cErr || tErr || bErr

      setBerths((all) => all.filter((b) => b.id !== id))
    } catch (err) {
      console.error('Error deleting berth:', err)
    }
  }

  return {
    berths,
    loading,
    error,
    updatePosition,
    addBerth,
    deleteBerth,
  }
}
