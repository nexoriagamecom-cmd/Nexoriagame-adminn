'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Eye, X } from 'lucide-react'

const STATUTS = ['tous', 'en_attente', 'payee', 'expediee', 'livree', 'annulee']
const statutColors: Record<string, string> = { en_attente: '#f59e0b', payee: '#4ade80', expediee: '#06b6d4', livree: '#a855f7', annulee: '#ef4444' }
const statutLabels: Record<string, string> = { en_attente: 'En attente', payee: 'Payée', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée' }

export default function CommandesPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [selected, setSelected] = useState<any>(null)

  async function load() {
    const supabase = createClient()
    let q = supabase.from('commandes').select('*').order('created_at', { ascending: false })
    if (filter !== 'tous') q = q.eq('statut', filter)
    const { data } = await q
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const updateStatut = async (id: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('commandes').update({ statut }).eq('id', id)
    await load()
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, statut }))
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 24, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>Commandes</h1>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 24 }}>{orders.length} commande(s)</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUTS.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all .2s', borderColor: filter === s ? 'var(--violet)' : 'var(--border)', background: filter === s ? 'rgba(124,58,237,0.2)' : 'transparent', color: filter === s ? 'var(--violet-light)' : 'var(--gray)' }}>
            {s === 'tous' ? 'Toutes' : statutLabels[s]}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Référence', 'Client', 'Email', 'Total', 'Statut', 'Date', ''].map((h, i) => (
                  <th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Chargement...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Aucune commande</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                  <td style={{ padding: '14px 20px', fontFamily: 'var(--font-title)', fontSize: 12, color: 'var(--violet-light)' }}>{o.reference}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--white)', fontWeight: 600 }}>{o.client_nom}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--gray)' }}>{o.client_email}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>{o.total?.toFixed(2)} €</td>
                  <td style={{ padding: '14px 20px' }}>
                    <select value={o.statut} onChange={e => updateStatut(o.id, e.target.value)} style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, color: statutColors[o.statut], background: `${statutColors[o.statut]}15 !important`, border: `1px solid ${statutColors[o.statut]}40 !important`, borderRadius: '6px !important', cursor: 'pointer' }}>
                      {Object.entries(statutLabels).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--gray)' }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <button onClick={() => setSelected(o)} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--violet-light)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, zIndex: 201 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>{selected.reference}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[['Client', selected.client_nom], ['Email', selected.client_email], ['Téléphone', selected.client_telephone || 'N/A'], ['Code postal', selected.client_code_postal], ['Ville', selected.client_ville], ['Adresse', selected.client_adresse]].map(([label, val]) => (
                <div key={label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 14, color: 'var(--white)', fontWeight: 600 }}>{val}</p>
                </div>
              ))}
            </div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 13, fontWeight: 700, color: 'var(--white)', marginBottom: 12 }}>Produits commandés</h3>
            {(selected.produits || []).map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--white)' }}>{item.product?.nom} × {item.quantite}</span>
                <span style={{ color: 'var(--violet-light)', fontWeight: 700 }}>{(item.product?.prix * item.quantite).toFixed(2)} €</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontFamily: 'var(--font-title)', fontSize: 18, fontWeight: 700 }}>
              <span style={{ color: 'var(--white)' }}>Total</span>
              <span style={{ color: 'var(--violet-light)' }}>{selected.total?.toFixed(2)} €</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
