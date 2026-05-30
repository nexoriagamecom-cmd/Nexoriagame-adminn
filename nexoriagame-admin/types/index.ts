export type Category = 'consoles' | 'accessoires' | 'jeux' | 'univers-pc'

export interface Product {
  id: string
  slug: string
  nom: string
  description?: string
  prix: number
  prix_barre?: number
  categorie: Category
  images?: string[]
  stock: number
  actif: boolean
  badge?: string
  promo_countdown?: boolean
  promo_stock_limite?: boolean
  promo_viewers?: boolean
  variations?: { nom: string; options: string[] }[]
  created_at?: string
  best_seller?: boolean
  nouveaute?: boolean
}

export interface CartItem {
  product: Product
  quantite: number
  variations?: Record<string, string>
}
