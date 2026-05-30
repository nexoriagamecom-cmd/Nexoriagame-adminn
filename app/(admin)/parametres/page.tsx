'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Save } from 'lucide-react'

export default function ParametresPage() {
  const [params, setParams] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('parametres').select('*')
      const map: Record<string, string> = {}
      ;(data || []).forEach((p: any) => { map[p.cle] = p.valeur })
      setParams(map)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await Promise.all(Object.entries(params).map(([cle, valeur]) =>
      supabase.from('parametres').upsert({ cle, valeur, updated_at: new Date().toISOString() }, { onConflict: 'cle' })
    ))
    setSaving(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <div style={{ color: 'var(--gray)', padding: 40 }}>Chargement...</div>

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 24, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>Paramètres</h1>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 32 }}>Configuration générale de la boutique</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 700, color: 'var(--white)', marginBottom: 20 }}>Général</h2>
          {[
            { cle: 'annonce_barre', label: "Texte barre d'annonce", placeholder: 'Livraison offerte dès 50€ | Prix réduits' },
            { cle: 'livraison_gratuite_seuil', label: 'Seuil livraison gratuite (€)', placeholder: '50' },
            { cle: 'delai_livraison', label: 'Délai de livraison affiché', placeholder: '10 jours ouvrables' },
          ].map(f => (
            <div key={f.cle} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 8 }}>{f.label}</label>
              <input value={params[f.cle] || ''} onChange={e => setParams(p => ({ ...p, [f.cle]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '12px 14px', fontSize: 14 }} />
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 700, color: 'var(--white)', marginBottom: 20 }}>État du site</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={params['site_actif'] === 'true'} onChange={e => setParams(p => ({ ...p, site_actif: String(e.target.checked) }))} style={{ width: 18, height: 18, accentColor: 'var(--violet)', padding: '0 !important', border: 'none !important' }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>Site actif</p>
              <p style={{ fontSize: 13, color: 'var(--gray)' }}>Désactivez pour mettre le site en maintenance</p>
            </div>
          </label>
        </div>

        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 700, color: 'var(--violet-light)', marginBottom: 12 }}>🔒 Paiement SogEcommerce</h2>
          <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.7 }}>
            Les clés API se configurent dans les variables d'environnement Netlify :<br/>
            <code style={{ color: 'var(--cyan)', fontSize: 12 }}>SOGECOMMERCE_SITE_ID</code> et <code style={{ color: 'var(--cyan)', fontSize: 12 }}>SOGECOMMERCE_API_KEY</code>
          </p>
        </div>

        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: success ? '#4ade80' : 'linear-gradient(135deg, var(--violet), #5b21b6)', color: success ? '#000' : '#fff', padding: '14px 28px', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', transition: 'all .3s' }}>
          <Save size={16} /> {success ? '✓ Enregistré !' : saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
