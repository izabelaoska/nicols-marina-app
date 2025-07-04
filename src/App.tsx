// src/App.tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import SignInModal from './components/SignInModal'
import MarinaCanvas from './components/MarinaCanvas'
import type { Session } from '@supabase/supabase-js'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // If not signed in yet, show your magic-link form
  if (!session) {
    return <SignInModal />
  }

  return (
    <div className="h-screen w-screen">
      <MarinaCanvas />
    </div>
  )
}
