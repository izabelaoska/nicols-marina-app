// components/SignInModal.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SignInModal() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSendLink = async () => {
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      console.error(error)
      setMessage('Nie udało się wysłać linku. Sprawdź konsolę.')
    } else {
      setMessage(`Link wysłany na ${email}. Sprawdź skrzynkę.`)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50 p-4">
      <h1 className="text-4xl font-semibold text-white mb-6 italic">
        Nicol’s Marina
      </h1>

      <div className="modal-box modal-bottom sm:modal-middle w-full sm:w-96 max-h-[90vh] overflow-y-auto p-10">
        <h2 className="text-xl font-semibold mb-4">Zaloguj się do systemu</h2>

        <label className="block mb-4">
          <span className="label-text text-lg">Adres e-mail</span>
          <input
            type="email"
            placeholder="you@example.com"
            className="input input-bordered w-full mt-1"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </label>

        <div className="modal-action justify-start">
          <button
            onClick={handleSendLink}
            className="btn btn-primary"
            disabled={!email}
          >
            Wyślij link
          </button>
        </div>

        {message && (
          <p className="mt-2 text-sm text-center text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}
