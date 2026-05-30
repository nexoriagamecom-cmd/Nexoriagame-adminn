'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Redirection vers le dashboard sans utiliser window.location.search
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
      <form onSubmit={handleLogin} style={{ background: '#111', padding: 40, borderRadius: 16, border: '1px solid #222', maxWidth: 400, width: '100%' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Connexion Admin</h1>
        {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
        <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 12, marginBottom: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
        <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 12, marginBottom: 24, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
