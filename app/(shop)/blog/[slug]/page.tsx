// app/(shop)/blog/[slug]/page.tsx
import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Metadata } from 'next'
import '@/app/(shop)/blog/blog.css'

export const revalidate = 60 // Revalider toutes les 60 secondes

async function getArticle(slug: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('publie', true)
    .single()

  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug)
  
  if (!article) {
    return {
      title: 'Article introuvable | NexoriaGame',
      description: 'Cet article n\'existe pas ou a été supprimé.'
    }
  }

  return {
    title: `${article.titre} | Blog NexoriaGame`,
    description: article.extrait || article.titre,
    openGraph: {
      title: article.titre,
      description: article.extrait || '',
      images: article.image ? [article.image] : [],
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.auteur],
    }
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug)

  if (!article) {
    notFound()
  }

  return (
    <article className="blog-article">
      {/* Image de couverture */}
      {article.image && (
        <img
          src={article.image}
          alt={article.titre}
          className="article-cover"
        />
      )}

      {/* Meta : catégorie, auteur, date */}
      <div className="article-meta">
        <span className="category">{article.categorie}</span>
        <span className="separator">•</span>
        <span>{article.auteur}</span>
        <span className="separator">•</span>
        <span>
          {new Date(article.published_at || article.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </span>
      </div>

      {/* Titre */}
      <h1>{article.titre}</h1>

      {/* Extrait mis en avant */}
      {article.extrait && (
        <blockquote>
          <p>{article.extrait}</p>
        </blockquote>
      )}

      {/* Contenu Markdown stylisé automatiquement */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {article.contenu}
      </ReactMarkdown>
    </article>
  )
}
