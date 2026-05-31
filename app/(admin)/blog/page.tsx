
// app/(admin)/blog/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  titre: string
  extrait: string
  contenu: string
  image: string | null
  categorie: string
  auteur: string
  published_at: string | null
  created_at: string
  publie: boolean
}

const CATEGORIES = ['Gaming', 'Actualités', 'Guides', 'Événements', 'Promotions']

const emptyForm = {
  slug: '',
  titre: '',
  extrait: '',
  contenu: '',
  image: '',
  categorie: 'Gaming',
  auteur: 'Nexoriagame',
  publie: true
}

function generateSlug(titre: string) {
  return titre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Toutes')
  const [uploading, setUploading] = useState(false)

  async function load() {
    const supabase = createClient()
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (selectedCategory !== 'Toutes') {
      query = query.eq('categorie', selectedCategory)
    }
    const { data } = await query
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [selectedCategory])

  const filtered = posts.filter(p => 
    p.titre.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true) }
  
  const openEdit = (p: BlogPost) => {
    setEditing(p)
    setForm({
      slug: p.slug,
      titre: p.titre,
      extrait: p.extrait || '',
      contenu: p.contenu,
      image: p.image || '',
      categorie: p.categorie || 'Gaming',
      auteur: p.auteur || 'Nexoriagame',
      publie: p.publie
    })
    setError('')
    setShowModal(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'titre' && !editing ? { slug: generateSlug(value) } : {})
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(`public/${fileName}`, file)

    if (data) {
      const { data: publicUrlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`public/${fileName}`)
      setForm(prev => ({ ...prev, image: publicUrlData.publicUrl }))
    } else {
      setError(error?.message || "Erreur lors de l'upload")
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const data = {
        slug: form.slug,
        titre: form.titre,
        extrait: form.extrait,
        contenu: form.contenu,
        image: form.image || null,
        categorie: form.categorie,
        auteur: form.auteur,
        publie: form.publie,
        published_at: form.publie ? new Date().toISOString() : null
      }
      if (editing) {
        await supabase.from('blog_posts').update(data).eq('id', editing.id)
      } else {
        await supabase.from('blog_posts').insert(data)
      }
      setShowModal(false)
      await load()
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cet article ?')) return
    const supabase = createClient()
    await supabase.from('blog_posts').delete().eq('id', id)
    await load()
  }

  const togglePublie = async (p: BlogPost) => {
    const supabase = createClient()
    await supabase.from('blog_posts').update({ 
      publie: !p.publie,
      published_at: !p.publie ? new Date().toISOString() : p.published_at
    }).eq('id', p.id)
    await load()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Blog</h1>
          <p style={{ color: '#aaa', fontSize: 14 }}>{posts.length} article{posts.length > 1 ? 's' : ''} au total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Rechercher..." 
            style={{ padding: '10px 14px', fontSize: 14, width: 200, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} 
          />
          <button 
            onClick={openCreate} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 15px rgba(124,58,237,0.4)', whiteSpace: 'nowrap' }}
          >
            <Plus size={16} /> Nouvel article
          </button>
        </div>
      </div>

      {/* Filtres catégories */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedCategory('Toutes')}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: selectedCategory === 'Toutes' ? '2px solid #7c3aed' : '1px solid #333',
            background: selectedCategory === 'Toutes' ? 'rgba(124,58,237,0.15)' : '#111',
            color: selectedCategory === 'Toutes' ? '#a855f7' : '#aaa',
            fontWeight: selectedCategory === 'Toutes' ? 700 : 400,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Toutes
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              border: selectedCategory === cat ? '2px solid #7c3aed' : '1px solid #333',
              background: selectedCategory === cat ? 'rgba(124,58,237,0.15)' : '#111',
              color: selectedCategory === cat ? '#a855f7' : '#aaa',
              fontWeight: selectedCategory === cat ? 700 : 400,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {['Article', 'Catégorie', 'Auteur', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 14 }}>Aucun article. Cliquez sur "Nouvel article" pour commencer.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.1)', opacity: p.publie ? 1 : 0.5 }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                        {p.image ? (
                          <img src={p.image} alt={p.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📝</div>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</p>
                        <p style={{ fontSize: 11, color: '#666' }}>/blog/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#06b6d4' }}>{p.categorie}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#aaa' }}>{p.auteur}</td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: '#666' }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ 
                      background: p.publie ? 'rgba(74,222,128,0.15)' : 'rgba(100,116,139,0.15)', 
                      color: p.publie ? '#4ade80' : '#aaa', 
                      border: `1px solid ${p.publie ? 'rgba(74,222,128,0.3)' : 'rgba(100,116,139,0.3)'}`, 
                      padding: '4px 10px', 
                      borderRadius: 6, 
                      fontSize: 12, 
                      fontWeight: 700 
                    }}>
                      {p.publie ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => togglePublie(p)} title={p.publie ? 'Dépublier' : 'Publier'} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid #222', color: '#aaa', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.publie ? <EyeOff size={14} /> : <Eye size={14} />}
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
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', background: '#1a1a2e', border: '1px solid #333', borderRadius: 20, padding: 32, zIndex: 201 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{editing ? 'Modifier l\'article' : 'Nouvel article'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              {/* Titre */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Titre *</label>
                <input name="titre" value={form.titre} onChange={handleChange} placeholder="Titre de l'article" required style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              </div>

              {/* Slug + Catégorie + Auteur */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Slug *</label>
                  <input name="slug" value={form.slug} onChange={handleChange} placeholder="mon-article" required style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Catégorie</label>
                  <select name="categorie" value={form.categorie} onChange={handleChange} style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Auteur</label>
                  <input name="auteur" value={form.auteur} onChange={handleChange} placeholder="Nexoriagame" style={{ width: '100%', padding: '11px 14px', fontSize: 14, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                </div>
              </div>

              {/* Extrait */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Extrait</label>
                <textarea name="extrait" value={form.extrait} onChange={handleChange} placeholder="Résumé court de l'article..." rows={2} style={{ width: '100%', padding: '11px 14px', fontSize: 14, resize: 'vertical', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              </div>

              {/* Contenu */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Contenu (Markdown) *</label>
                <textarea name="contenu" value={form.contenu} onChange={handleChange} placeholder="## Titre&#10;&#10;Votre contenu..." required rows={8} style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              </div>

              {/* Image */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Image principale (URL)</label>
                <textarea 
                  name="image" 
                  value={form.image} 
                  onChange={handleChange} 
                  placeholder="https://exemple.com/image.jpg" 
                  rows={2} 
                  style={{ width: '100%', padding: '11px 14px', fontSize: 13, resize: 'vertical', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} 
                />
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    style={{ fontSize: 13, color: '#aaa' }}
                  />
                  {uploading && <span style={{ fontSize: 12, color: '#06b6d4' }}>Upload en cours…</span>}
                </div>
                {form.image && (
                  <div style={{ marginTop: 12, position: 'relative', display: 'inline-block' }}>
                    <img src={form.image} alt="Preview" style={{ maxWidth: 200, borderRadius: 8, border: '1px solid #333' }} />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                      style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Publié */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, fontSize: 14, color: '#aaa' }}>
                <input type="checkbox" name="publie" checked={form.publie} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
                Article publié (visible sur le site)
              </label>

              {error && <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Sauvegarde...' : editing ? 'Enregistrer' : 'Créer l\'article'}
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
