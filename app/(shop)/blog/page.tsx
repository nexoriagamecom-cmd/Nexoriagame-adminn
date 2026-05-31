// app/(shop)/blog/page.tsx
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | NexoriaGame',
  description: 'Actualités, guides et articles gaming',
}

export const revalidate = 60

export default async function BlogListPage() {
  const supabase = createClient()
  const { data: articles } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('publie', true)
    .order('created_at', { ascending: false })

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '60px 5%',
    }}>
      <h1 style={{
        fontSize: 32,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 8,
        fontFamily: 'var(--font-title)'
      }}>
        Blog NexoriaGame
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: 40, fontSize: 15 }}>
        Actualités, guides et articles sur l&apos;univers du gaming
      </p>

      <div style={{ display: 'grid', gap: 24 }}>
        {articles?.map((article: any) => (
          <Link
            key={article.id}
            href={`/blog/${article.slug}`}
            style={{
              display: 'flex',
              gap: 20,
              background: '#111',
              border: '1px solid #1e1e3a',
              borderRadius: 16,
              padding: 20,
              textDecoration: 'none',
              transition: 'border-color 0.2s',
              flexWrap: 'wrap'
            }}
          >
            {article.image && (
              <img
                src={article.image}
                alt={article.titre}
                style={{
                  width: 180,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 10,
                  flexShrink: 0
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#a78bfa',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(124,58,237,0.15)',
                padding: '4px 10px',
                borderRadius: 12
              }}>
                {article.categorie}
              </span>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                marginTop: 8,
                marginBottom: 6,
                fontFamily: 'var(--font-title)'
              }}>
                {article.titre}
              </h2>
              {article.extrait && (
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
                  {article.extrait}
                </p>
              )}
              <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
                {article.auteur} •{' '}
                {new Date(article.published_at || article.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {(!articles || articles.length === 0) && (
        <p style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>
          Aucun article pour le moment. Revenez bientôt !
        </p>
      )}
    </div>
  )
}
