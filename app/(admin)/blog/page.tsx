// app/admin/blog/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BlogPost {
  id: string
  slug: string
  titre: string
  extrait: string
  contenu: string
  image: string | null
  categorie: string
  auteur: string
  published_at: string
  created_at: string
  publie: boolean
}

const CATEGORIES = ['Gaming', 'Actualités', 'Guides', 'Événements', 'Promotions']

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Toutes')

  const [formData, setFormData] = useState({
    slug: '',
    titre: '',
    extrait: '',
    contenu: '',
    image: '',
    categorie: 'Gaming',
    auteur: 'Nexoriagame',
    publie: true
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (selectedCategory !== 'Toutes') {
      query = query.eq('categorie', selectedCategory)
    }

    const { data, error } = await query

    if (data) setPosts(data)
    if (error) console.error('Erreur fetch:', error)
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  function generateSlug(titre: string) {
    return titre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleTitreChange(value: string) {
    setFormData({
      ...formData,
      titre: value,
      slug: generateSlug(value)
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file)

    if (error) {
      console.error('Erreur upload:', error)
      alert('Erreur lors de l\'upload de l\'image')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName)

    setFormData({ ...formData, image: publicUrl })
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.slug || !formData.titre || !formData.contenu) {
      alert('Titre, slug et contenu sont obligatoires')
      return
    }

    const payload = {
      ...formData,
      published_at: formData.publie ? new Date().toISOString() : null
    }

    if (editingPost) {
      const { error } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', editingPost.id)

      if (error) {
        console.error('Erreur update:', error)
        alert('Erreur lors de la mise à jour')
        return
      }
    } else {
      const { error } = await supabase
        .from('blog_posts')
        .insert([payload])

      if (error) {
        console.error('Erreur insert:', error)
        alert('Erreur lors de la création : ' + error.message)
        return
      }
    }

    resetForm()
    fetchPosts()
  }

  function editPost(post: BlogPost) {
    setEditingPost(post)
    setFormData({
      slug: post.slug,
      titre: post.titre,
      extrait: post.extrait || '',
      contenu: post.contenu,
      image: post.image || '',
      categorie: post.categorie || 'Gaming',
      auteur: post.auteur || 'Nexoriagame',
      publie: post.publie
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deletePost(id: string) {
    if (!confirm('Supprimer définitivement cet article ?')) return

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erreur lors de la suppression')
      return
    }

    fetchPosts()
  }

  async function togglePublie(post: BlogPost) {
    const { error } = await supabase
      .from('blog_posts')
      .update({ 
        publie: !post.publie,
        published_at: !post.publie ? new Date().toISOString() : post.published_at
      })
      .eq('id', post.id)

    if (!error) fetchPosts()
  }

  function resetForm() {
    setFormData({
      slug: '',
      titre: '',
      extrait: '',
      contenu: '',
      image: '',
      categorie: 'Gaming',
      auteur: 'Nexoriagame',
      publie: true
    })
    setEditingPost(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: 16
      }}>
        Chargement des articles...
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '40px 5%',
      color: '#1a1a2e',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
            📝 Gestion du Blog
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            {posts.length} article{posts.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: showForm ? '#ef4444' : '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.2s'
          }}
        >
          {showForm ? '✕ Fermer le formulaire' : '+ Nouvel article'}
        </button>
      </div>

      {/* Filtres catégories */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedCategory('Toutes')}
          style={filterStyle(selectedCategory === 'Toutes')}
        >
          Toutes
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={filterStyle(selectedCategory === cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#fff',
          padding: 28,
          borderRadius: 12,
          marginBottom: 32,
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>
            {editingPost ? '✏️ Modifier l\'article' : '✨ Nouvel article'}
          </h2>

          <div style={{ display: 'grid', gap: 20 }}>
            {/* Titre */}
            <div>
              <label style={labelStyle}>Titre *</label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => handleTitreChange(e.target.value)}
                required
                style={inputStyle}
                placeholder="Titre de l'article"
              />
            </div>

            {/* Slug */}
            <div>
              <label style={labelStyle}>Slug (URL) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                style={inputStyle}
                placeholder="mon-article"
              />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                URL : /blog/{formData.slug || '...'}
              </p>
            </div>

            {/* Catégorie + Auteur */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  style={inputStyle}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Auteur</label>
                <input
                  type="text"
                  value={formData.auteur}
                  onChange={(e) => setFormData({ ...formData, auteur: e.target.value })}
                  style={inputStyle}
                  placeholder="Nexoriagame"
                />
              </div>
            </div>

            {/* Extrait */}
            <div>
              <label style={labelStyle}>Extrait</label>
              <textarea
                value={formData.extrait}
                onChange={(e) => setFormData({ ...formData, extrait: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Résumé court de l'article..."
              />
            </div>

            {/* Contenu */}
            <div>
              <label style={labelStyle}>Contenu (Markdown) *</label>
              <textarea
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                required
                rows={12}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                placeholder={`## Titre\n\nVotre contenu ici...\n\n- Liste\n- Items\n\n**Gras** *Italique*`}
              />
            </div>

            {/* Image */}
            <div>
              <label style={labelStyle}>Image principale</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  style={{ ...inputStyle, flex: 1, minWidth: 250 }}
                  placeholder="https://... ou uploadez"
                />
                <span style={{ color: '#6b7280', fontSize: 14 }}>ou</span>
                <label style={{
                  padding: '10px 16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid #d1d5db',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  📁 Parcourir
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && (
                <p style={{ color: '#7c3aed', fontSize: 14, marginTop: 8 }}>
                  ⏳ Upload en cours...
                </p>
              )}
              {formData.image && (
                <div style={{ marginTop: 12, position: 'relative', display: 'inline-block' }}>
                  <img
                    src={formData.image}
                    alt="Preview"
                    style={{ 
                      maxWidth: 250, 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb',
                      display: 'block'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Publié */}
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.publie}
                  onChange={(e) => setFormData({ ...formData, publie: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span>Publier l&apos;article</span>
                {formData.publie && (
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    (visible immédiatement)
                  </span>
                )}
              </label>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              <button type="submit" style={{
                padding: '12px 28px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 15,
                transition: 'all 0.2s'
              }}>
                {editingPost ? '💾 Mettre à jour' : '📝 Créer l\'article'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 15,
                  color: '#374151'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Liste des articles */}
      <div style={{ display: 'grid', gap: 10 }}>
        {posts.map((post) => (
          <div key={post.id} style={{
            backgroundColor: '#fff',
            padding: '16px 20px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            transition: 'box-shadow 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
              {post.image ? (
                <img
                  src={post.image}
                  alt={post.titre}
                  style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 8, 
                    objectFit: 'cover',
                    border: '1px solid #f3f4f6',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 8, 
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0
                }}>
                  📄
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ 
                  fontWeight: 600, 
                  color: '#1a1a2e', 
                  marginBottom: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {post.titre}
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                  /blog/{post.slug} • {post.categorie || 'Gaming'}
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af' }}>
                  Créé le {new Date(post.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                  {post.publie && post.published_at && (
                    <> • Publié le {new Date(post.published_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</>
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => togglePublie(post)}
                title={post.publie ? 'Dépublier' : 'Publier'}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: post.publie ? '#d1fae5' : '#fef3c7',
                  color: post.publie ? '#065f46' : '#92400e',
                  whiteSpace: 'nowrap'
                }}
              >
                {post.publie ? '✅ Publié' : '📝 Brouillon'}
              </button>
              <button
                onClick={() => editPost(post)}
                title="Modifier"
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  whiteSpace: 'nowrap'
                }}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => deletePost(post.id)}
                title="Supprimer"
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          color: '#6b7280'
        }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📝</p>
          <p style={{ fontSize: 16, fontWeight: 500 }}>Aucun article trouvé</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>
            {selectedCategory !== 'Toutes' 
              ? `Aucun article dans la catégorie "${selectedCategory}"` 
              : 'Créez votre premier article !'}
          </p>
        </div>
      )}
    </div>
  )
}

// Styles réutilisables
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 600,
  fontSize: 14,
  color: '#374151'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
}

function filterStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 20,
    border: active ? '2px solid #7c3aed' : '1px solid #d1d5db',
    backgroundColor: active ? '#ede9fe' : '#fff',
    color: active ? '#5b21b6' : '#6b7280',
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
}
