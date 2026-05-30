'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingBag, Package, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({ commandes: 0, produits: 0, revenus: 0, enAttente: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ count: commandes }, { count: produits }, { data: orders }, { data: pending }] = await Promise.all([
        supabase.from('commandes').select('*', { count: 'exact', head: true }),
        supabase.from('produits').select('*', { count: 'exact', head: true }),
        supabase.from('commandes').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('commandes').select('total').eq('statut', 'en_attente'),
      ])
      const revenus = (orders || []).filter((o: any) => ['payee','expediee','livree'].includes(o.statut)).reduce((s: number, o: any) => s + o.total, 0)
      setStats({ commandes: commandes || 0, produits: produits || 0, revenus, enAttente: pending?.length || 0 })
      setRecentOrders(orders || [])
      setLoading(false)
    }
    load()
  }, [])

  const statutColors: Record<string, string> = { en_attente: '#f59e0b', payee: '#4ade80', expediee: '#06b6d4', livree: '#a855f7', annulee: '#ef4444' }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 24, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 32 }}>Bienvenue dans votre espace administration Nexoriagame</p>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'Commandes totales', value: stats.commandes, icon: ShoppingBag, color: '#7c3aed' },
          { label: 'Produits actifs', value: stats.produits, icon: Package, color: '#06b6d4' },
          { label: 'Revenus (€)', value: stats.revenus.toFixed(2) + ' €', icon: TrendingUp, color: '#4ade80' },
          { label: 'En attente', value: stats.enAttente, icon: Clock, color: '#f59e0b' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color, borderRadius: '16px 16px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontFamily: 'var(--font-title)', fontSize: 26, fontWeight: 900, color: 'var(--white)' }}>{loading ? '...' : s.value}</p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${s.color}20` }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* RECENT ORDERS */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>Commandes récentes</h2>
          <Link href="/commandes" style={{ fontSize: 13, color: 'var(--cyan)', textDecoration: 'none' }}>Voir tout →</Link>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray)' }}>Chargement...</div>
        ) : recentOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray)' }}>Aucune commande pour l'instant</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Référence', 'Client', 'Total', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-title)', fontSize: 12, color: 'var(--violet-light)' }}>{o.reference}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--white)' }}>{o.client_nom}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>{o.total?.toFixed(2)} €</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: `${statutColors[o.statut]}20`, color: statutColors[o.statut], border: `1px solid ${statutColors[o.statut]}40`, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                        {o.statut?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--gray)' }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
