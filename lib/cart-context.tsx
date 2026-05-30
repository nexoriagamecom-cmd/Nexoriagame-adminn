'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Product } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantite?: number, variation?: Record<string, string>) => void
  removeItem: (productId: string) => void
  updateQuantite: (productId: string, quantite: number) => void
  clearCart: () => void
  total: number
  count: number
  isOpen: boolean
  setIsOpen: (v: boolean) => void
}

const CartContext = createContext<CartContextType>({} as CartContextType)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nexoriagame-cart')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('nexoriagame-cart', JSON.stringify(items))
  }, [items])

  const addItem = (product: Product, quantite = 1, variation?: Record<string, string>) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantite: i.quantite + quantite } : i)
      return [...prev, { product, quantite, variation_choisie: variation }]
    })
    setIsOpen(true)
  }

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.product.id !== productId))

  const updateQuantite = (productId: string, quantite: number) => {
    if (quantite <= 0) return removeItem(productId)
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantite } : i))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.product.prix * i.quantite, 0)
  const count = items.reduce((sum, i) => sum + i.quantite, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantite, clearCart, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
