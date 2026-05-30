'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Product, Category } from '@/types'
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'consoles', label: 'Consoles' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'jeux', label: 'Jeux Vidéo' },
  { value: 'univers-pc', label: 'Univers PC' },
]

const emptyForm = {
  nom: '', slug: '', description: '', prix: '', prix_barre: '',
  images: '', categorie: 'consoles' as Category, stock: '0',
  badge: '', actif: true,
  promo_countdown: false, promo_stock_limite: false, promo_viewers: false,
  variations: '',
  best_seller: false,
  nouveaute: false
}

function generateSlug(nom: string) {
  return nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('produits').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      nom: p.nom, slug: p.slug, description: p.description || '',
      prix: String(p.prix), prix_barre: p.prix_barre ? String(p.prix_barre) : '',
      images: (p.images || []).join('\n'), categorie: p.categorie,
      stock: String(p.stock), badge: p.badge || '', actif: p.actif,
      promo_countdown: p.promo_countdown || false,
      promo_stock_limite: p.promo_stock_limite || false,
      promo_viewers: p.promo_viewers || false,
      variations: p.variations ? JSON.stringify(p.variations, null, 2) : '',
      best_seller: p.best_seller || false,
      nouveaute: p.nouveaute || false
    })
    setError(''); setShowModal(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      let variations = []
      if (form.variations.trim()) {
        try { variations = JSON.parse(form.variations) } catch { setError('Format variations invalide (JSON requis)'); setSaving(false); return }
      }
      const data = {
        nom: form.nom, slug: form.slug || generateSlug(form.nom),
        description: form.description, prix: parseFloat(form.prix),
        prix_barre: form.prix_barre ? parseFloat(form.prix_barre) : null,
        images: form.images.split('\n').map((s: string) => s.trim()).filter(Boolean),
        categorie: form.categorie, stock: parseInt(form.stock),
        badge: form.badge || null, actif: form.actif, variations,
        promo_countdown: form.promo_countdown,
        promo_stock_limite: form.promo_stock_limite,
        promo_viewers: form.promo_viewers,
        best_seller: Boolean(form.best_seller),
        nouveaute: Boolean(form.nouveaute),
      }
      if (editing) await supabase.from('produits').update(data).eq('id', editing.id)
      else await supabase.from('produits').insert(data)
      setShowModal(false); await load()
    } catch (e: any) { setError(e.message || 'Erreur lors de la sauvegarde') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    const supabase = createClient()
    await supabase.from('produits').delete().eq('id', id)
    await load()
  }

  const toggleActif = async (p: Product) => {
    const supabase = createClient()
    await supabase.from('produits').update({ actif: !p.actif }).eq('id', p.id)
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Produits</h1>
          <p style={{ color: '#aaa', fontSize: 14 }}>{products.length} produits au total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ padding: '10px 14px', fontSize: 14, width: 200, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 15px rgba(124,58,237,0.4)', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {['Produit', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 14 }}>Aucun produit. Cliquez sur "Ajouter" pour commencer.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.1)', opacity: p.actif ? 1 : 0.5 }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                        {p.images?.[0] && <img src={p.images[0]} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{p.nom}</p>
                        {p.badge && <span style={{ fontSize: 11, color: '#a855f7', background: 'rgba(124,58,237,0.15)', padding: '2px 6px', borderRadius: 4 }}>{p.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#06b6d4', textTransform: 'capitalize' }}>{p.categorie.replace('-', ' ')}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{p.prix.toFixed(2)} €</div>
                    {p.prix_barre && <div style={{ fontSize: 12, color: '#aaa', textDecoration: 'line-through' }}>{p.prix_barre.toFixed(2)} €</div>}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ color: p.stock < 5 ? '#ef4444' : p.stock < 10 ? '#f59e0b' : '#4ade80', fontWeight: 700, fontSize: 14 }}>{p.stock}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: p.actif ? 'rgba(74,222,128,0.15)' : 'rgba(100,116,139,0.15)', color: p.actif ? '#4ade80' : '#aaa', border: `1px solid ${p.actif ? 'rgba(74,222,128,0.3)' : 'rgba(100,116,139,0.3)'}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                      {p.actif ? 'Actif' : 'Masqué'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleActif(p)} title={p.actif ? 'Masquer' : 'Activer'} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid #222', color: '#aaa', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.actif ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(p)} style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', background: '#1a1a2e', border: '1px solid #333', borderRadius: 20, padding: 32, zIndex: 201 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{editing ? 'Modifier' : 'Nouveau produit'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              {[
                { name: 'nom', label: 'Nom *', placeholder: 'Ex : PS5 Standard', required: true },
                { name: 'slug', label: 'Slug URL (auto si vide)', placeholder: 'ps5-standard' },
                { name: 'badge', label: 'Badge', placeholder: 'Nouveau, Promo...' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>{f.label}</label>
                  <input name={f.name} value={(form as any)[f.name]} onChange={handleChange} placeholder={f.placeholder} required={f.required} style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Prix * (€)</label>
                  <input name="prix" type="number" step="0.01" value={form.prix} onChange={handleChange} required placeholder="29.99" style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Prix barré (€)</label>
                  <input name="prix_barre" type="number" step="0.01" value={form.prix_barre} onChange={handleChange} placeholder="49.99" style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Stock</label>
                  <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="10" style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Catégorie</label>
                <select name="categorie" value={form.categorie} onChange={handleChange} style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description du produit..." rows={3} style={{ width: '100%', padding: '11px 14px', fontSize: 14, resize: 'vertical', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>URLs images (une par ligne)</label>
                <textarea name="images" value={form.images} onChange={handleChange} placeholder="https://example.com/image.jpg" rows={3} style={{ width: '100%', padding: '11px 14px', fontSize: 13, resize: 'vertical', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Variations JSON (optionnel)</label>
                <textarea name="variations" value={form.variations} onChange={handleChange} placeholder={'[\n  {"nom": "Couleur", "options": ["Noir", "Blanc"]}\n]'} rows={3} style={{ width: '100%', padding: '11px 14px', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              </div>
              <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a855f7', marginBottom: 12 }}>⚡ Outils de promotion</p>
                {[
                  { name: 'promo_stock_limite', label: '⚠️ Badge "Stock limité" clignotant' },
                  { name: 'promo_viewers', label: '👥 "X personnes regardent ce produit"' },
                  { name: 'promo_countdown', label: '⏳ Compte à rebours offre limitée' },
                ].map(opt => (
                  <label key={opt.name} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, fontSize: 14, color: '#aaa' }}>
                    <input type="checkbox" name={opt.name} checked={(form as any)[opt.name]} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* ⭐ Affichage page d'accueil */}
              <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#06b6d4', marginBottom: 12 }}>⭐ Affichage page d'accueil</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, fontSize: 14, color: '#aaa' }}>
                  <input type="checkbox" name="best_seller" checked={(form as any).best_seller} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#06b6d4' }} />
                  Afficher dans les <strong>Best‑Sellers</strong> (page d'accueil)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#aaa' }}>
                  <input type="checkbox" name="nouveaute" checked={(form as any).nouveaute} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#06b6d4' }} />
                  Afficher dans les <strong>Nouveautés</strong> (page d'accueil)
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, fontSize: 14, color: '#aaa' }}>
                <input type="checkbox" name="actif" checked={form.actif} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
                Produit actif (visible sur le site)
              </label>
              {error && <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Sauvegarde...' : editing ? 'Enregistrer' : 'Créer le produit'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '14px 20px', borderRadius: 10, background: 'none', border: '1px solid #333', color: '#aaa', cursor: 'pointer', fontSize: 14 }}>Annuler</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
