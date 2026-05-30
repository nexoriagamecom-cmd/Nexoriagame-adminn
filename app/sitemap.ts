import { createClient } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const { data: products } = await supabase
    .from('produits')
    .select('slug, created_at')
    .eq('actif', true)

  const productUrls = (products || []).map((product) => ({
    url: `https://nexoriagame.com/produits/${product.slug}`,
    lastModified: product.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const staticPages = [
    { url: 'https://nexoriagame.com', changeFrequency: 'daily', priority: 1 },
    { url: 'https://nexoriagame.com/produits', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://nexoriagame.com/contact', changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://nexoriagame.com/a-propos', changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://nexoriagame.com/faq', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://nexoriagame.com/mentions-legales', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://nexoriagame.com/cgv', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://nexoriagame.com/confidentialite', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://nexoriagame.com/cookies', changeFrequency: 'yearly', priority: 0.3 },
  ].map((page) => ({
    ...page,
    lastModified: new Date(),
  }))

  return [...staticPages, ...productUrls]
}
