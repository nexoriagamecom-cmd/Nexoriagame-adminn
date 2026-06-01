'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Eye, X } from 'lucide-react'
import Image from 'next/image'

const STATUTS = ['tous', 'en_attente', 'payee', 'expediee', 'livree', 'annulee']
const statutColors: Record<string, string> = {
  en_attente: '#f59e0b',
  payee: '#4ade80',
  expediee: '#06b6d4',
  livree: '#a855f7',
  annulee: '#ef4444',
}
const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  payee: 'Payée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
}

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
    const sorted = (data || []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setOrders(sorted)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filter])

  const updateStatut = async (id: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('commandes').update({ statut }).eq('id', id)
    await load()
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, statut }))
  }

  // Récupérer le nom du premier produit
  const getFirstProductName = (produits: any[]) => {
    if (!produits || produits.length === 0) return '—'
    const first = produits[0]
    return first.product?.nom || first.nom || 'Produit'
  }

  // Récupérer l'image du premier produit
  const getFirstProductImage = (produits: any[]) => {
    if (!produits || produits.length === 0) return null
    const first = produits[0]
    const images = first.product?.images
    if (Array.isArray(images) && images.length > 0) return images[0]
    if (typeof images === 'string') return images
    return first.image || null
  }

  // Nombre total de produits
  const getProductCount = (produits: any[]) => {
    if (!produits) return 0
    return produits.reduce((sum: number, item: any) => sum + (item.quantite || 1), 0)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Commandes
          </h1>
          <p style={{ color: '#aaa', fontSize: 14 }}>{orders.length} commande(s)</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUTS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all .2s',
              borderColor: filter === s ? '#7c3aed' : '#333',
              background: filter === s ? 'rgba(124,58,237,0.2)' : 'transparent',
              color: filter === s ? '#a855f7' : '#aaa',
            }}
          >
            {s === 'tous' ? 'Toutes' : statutLabels[s]}
          </button>
        ))}
      </div>

      <div
        style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {['Produit', 'Référence', 'Client', 'Total', 'Statut', 'Date', ''].map(
                  (h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#aaa',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                    Chargement...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                    Aucune commande
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  const productImage = getFirstProductImage(o.produits)
                  const productName = getFirstProductName(o.produits)
                  const productCount = getProductCount(o.produits)
                  
                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid rgba(124,58,237,0.1)',
                      }}
                    >
                      {/* Produit avec photo */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: '#1a1a1a',
                            flexShrink: 0,
                            border: '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={productName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: 18, color: '#555' }}>📦</span>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#fff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 180,
                            }}>
                              {productName}
                            </p>
                            {productCount > 1 && (
                              <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                                +{productCount - 1} autre{productCount > 2 ? 's' : ''} produit{productCount > 2 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 12,
                          color: '#a855f7',
                          fontFamily: 'monospace',
                        }}
                      >
                        {o.reference}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 14,
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      >
                        {o.client_nom}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        {o.total?.toFixed(2)} €
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <select
                          value={o.statut}
                          onChange={e => updateStatut(o.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: statutColors[o.statut],
                            background: `${statutColors[o.statut]}15`,
                            border: `1px solid ${statutColors[o.statut]}40`,
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          {Object.entries(statutLabels).map(([val, lab]) => (
                            <option key={val} value={val}>
                              {lab}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#aaa' }}>
                        {new Date(o.created_at).toLocaleString('fr-FR', {
                          timeZone: 'Europe/Paris',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => setSelected(o)}
                          style={{
                            background: 'rgba(124,58,237,0.15)',
                            border: '1px solid rgba(124,58,237,0.3)',
                            color: '#a855f7',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DÉTAILS */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 200,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '90%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: 20,
              padding: 32,
              zIndex: 201,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              color: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {selected.reference}
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                ['Client', selected.client_nom],
                ['Email', selected.client_email],
                ['Téléphone', selected.client_telephone || 'N/A'],
                ['Adresse', selected.client_adresse],
                ['Code postal', selected.client_code_postal],
                ['Ville', selected.client_ville],
                ['Pays', selected.client_pays || 'N/A'],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    background: '#222',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: '#aaa',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </p>
                  <p style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{val}</p>
                </div>
              ))}
            </div>

            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 12,
              }}
            >
              Produits commandés
            </h3>
            {(selected.produits || []).map((item: any, i: number) => {
              const nom = item.product?.nom || item.nom || 'Produit'
              const prix = item.product?.prix || item.prix || 0
              const images = item.product?.images
              const imageUrl = Array.isArray(images) && images.length > 0 
                ? images[0] 
                : typeof images === 'string' 
                  ? images 
                  : item.image || null

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #333',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#1a1a1a',
                      flexShrink: 0,
                      border: '1px solid #333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={nom}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: 20 }}>📦</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ 
                        color: '#fff', 
                        fontSize: 14, 
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {nom}
                      </p>
                      <p style={{ color: '#aaa', fontSize: 12 }}>
                        × {item.quantite}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: '#a855f7', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {(prix * item.quantite).toFixed(2)} €
                  </span>
                </div>
              )
            })}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 0 0',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <span style={{ color: '#fff' }}>Total</span>
              <span style={{ color: '#a855f7' }}>{selected.total?.toFixed(2)} €</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
