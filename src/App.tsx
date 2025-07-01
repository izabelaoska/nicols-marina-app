// App.tsx
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import MarinaCanvas from './components/MarinaCanvas'
import { SignInModal } from './components/SignInModal'

export default function App() {
  const [session, setSession] = useState(supabase.auth.getSession())

  useEffect(() => {
    // subscribe to auth changes (link click, sign out, etc)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, newSession) => {
        setSession(newSession)
      }
    )
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (!session) {
    return <SignInModal />
  }

  return <MarinaCanvas />
}
