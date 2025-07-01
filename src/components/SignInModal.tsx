// LoginScreen.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SignInModal() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSendLink = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setMessage('Failed to send link – check console.')
      console.error(error)
    } else {
      setMessage(`Magic link sent! Check ${email}.`)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Sign in</h2>
        <input
          type="email"
          placeholder="you@example.com"
          className="mb-3 w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleSendLink}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Send magic link
        </button>
        {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  )
}
