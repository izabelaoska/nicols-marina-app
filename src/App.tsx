// src/App.tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import SignInModal from './components/SignInModal'
import MarinaCanvas from './components/MarinaCanvas'
import type { Session } from '@supabase/supabase-js'

export default function App() {
  // 1) Start with no session
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // 2) On mount, check if there's already a logged-in session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 3) Subscribe to any future sign-in / sign-out events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // 4) Cleanup on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 5) If not signed in yet, show your magic-link form
  if (!session) {
    return <SignInModal />
  }

  // 6) Otherwise render the marina canvas
  return (
    <div className="h-screen w-screen">
      <MarinaCanvas />
    </div>
  )
}
