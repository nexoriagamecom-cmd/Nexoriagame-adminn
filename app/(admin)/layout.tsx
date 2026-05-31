// app/(admin)/layout.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, PenTool } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    })
  }, [])
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--gray)' }}>
        Vérification…
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 240, background: '#111', borderRight: '1px solid #222', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px', marginBottom: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>Admin</h1>
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{user.email}</p>
        </div>
        <nav style={{ flex: 1 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: pathname.startsWith('/dashboard') ? '#fff' : '#aaa', textDecoration: 'none', borderLeft: '3px solid ' + (pathname.startsWith('/dashboard') ? '#7c3aed' : 'transparent') }}><LayoutDashboard size={18} /> Dashboard</Link>
          <Link href="/commandes" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: pathname.startsWith('/commandes') ? '#fff' : '#aaa', textDecoration: 'none', borderLeft: '3px solid ' + (pathname.startsWith('/commandes') ? '#7c3aed' : 'transparent') }}><ShoppingCart size={18} /> Commandes</Link>
          <Link href="/produits" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: pathname.startsWith('/produits') ? '#fff' : '#aaa', textDecoration: 'none', borderLeft: '3px solid ' + (pathname.startsWith('/produits') ? '#7c3aed' : 'transparent') }}><Package size={18} /> Produits</Link>
          <Link href="/blog" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: pathname.startsWith('/blog') ? '#fff' : '#aaa', textDecoration: 'none', borderLeft: '3px solid ' + (pathname.startsWith('/blog') ? '#7c3aed' : 'transparent') }}><PenTool size={18} /> Blog</Link>
          <Link href="/parametres" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: pathname.startsWith('/parametres') ? '#fff' : '#aaa', textDecoration: 'none', borderLeft: '3px solid ' + (pathname.startsWith('/parametres') ? '#7c3aed' : 'transparent') }}><Settings size={18} /> Paramètres</Link>
        </nav>
        <div style={{ padding: '0 20px', marginTop: 'auto' }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '32px' }}>
        {children}
      </main>
    </div>
  )
}
