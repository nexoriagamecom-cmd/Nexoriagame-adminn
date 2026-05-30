'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, X } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/produits', label: 'Produits', icon: Package },
  { href: '/commandes', label: 'Commandes', icon: ShoppingBag },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setChecking(false)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--gray)', fontFamily: 'var(--font-title)', fontSize: 14 }}>Chargement...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* SIDEBAR DESKTOP */}
      <aside style={{ width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '28px 16px', position: 'sticky', top: 0, height: '100vh' }} className="sidebar-desktop">
        <SidebarContent pathname={pathname} handleLogout={handleLogout} />
      </aside>

      {/* MOBILE HEADER */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', zIndex: 100, alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }} className="mobile-header">
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 900 }}>
          <span style={{ color: 'var(--white)' }}>NEXORIA</span>
          <span style={{ color: 'var(--violet-light)' }}>GAME</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer' }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,15,0.98)', zIndex: 99, padding: '80px 20px 20px', display: 'flex', flexDirection: 'column' }}>
          <SidebarContent pathname={pathname} handleLogout={() => { setMenuOpen(false); handleLogout() }} onNav={() => setMenuOpen(false)} />
        </div>
      )}

      {/* MAIN */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }} className="main-content">
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header { display: flex !important; }
          .main-content { padding: 80px 16px 20px !important; }
        }
      `}</style>
    </div>
  )
}

function SidebarContent({ pathname, handleLogout, onNav }: any) {
  return (
    <>
      <Link href="/dashboard" style={{ fontFamily: 'var(--font-title)', fontSize: 17, fontWeight: 900, textDecoration: 'none', marginBottom: 40, paddingLeft: 12, display: 'block' }} onClick={onNav}>
        <span style={{ color: 'var(--white)' }}>NEXORIA</span>
        <span style={{ color: 'var(--violet-light)' }}>GAME</span>
        <div style={{ fontSize: 10, color: 'var(--gray)', letterSpacing: '0.15em', fontFamily: 'var(--font-body)', fontWeight: 600, marginTop: 2 }}>ADMIN</div>
      </Link>
      <nav style={{ flex: 1 }}>
        {links.map(l => {
          const active = pathname === l.href
          const Icon = l.icon
          return (
            <Link key={l.href} href={l.href} onClick={onNav} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, marginBottom: 4, textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, letterSpacing: '0.05em', transition: 'all .2s', background: active ? 'rgba(124,58,237,0.2)' : 'transparent', color: active ? 'var(--violet-light)' : 'var(--gray)', border: active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent' }}>
              <Icon size={16} />{l.label}
            </Link>
          )
        })}
      </nav>
      <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--gray)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, width: '100%', marginTop: 'auto' }}>
        <LogOut size={16} /> Déconnexion
      </button>
    </>
  )
}
