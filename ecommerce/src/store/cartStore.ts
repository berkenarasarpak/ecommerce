import { create } from 'zustand'
import { cartApi } from '@/lib/api'

interface CartItem {
  id: number
  productId: number
  name: string
  slug: string
  image: string
  price: number
  quantity: number
  stockQuantity: number
  total: number
}

interface Cart {
  id: number
  items: CartItem[]
  total: number
  itemCount: number
}

interface CartStore {
  cart: Cart | null
  isLoading: boolean
  fetchCart: () => Promise<void>
  addItem: (productId: number, quantity: number) => Promise<void>
  updateItem: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  isLoading: false,
  
  fetchCart: async () => {
    set({ isLoading: true })
    try {
      const cart = await cartApi.getCart()
      set({ cart, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
  
  addItem: async (productId, quantity) => {
    set({ isLoading: true })
    try {
      await cartApi.addItem({ productId, quantity })
      await get().fetchCart()
    } catch {
      set({ isLoading: false })
    }
  },
  
  updateItem: async (itemId, quantity) => {
    set({ isLoading: true })
    try {
      await cartApi.updateItem(itemId, { quantity })
      await get().fetchCart()
    } catch {
      set({ isLoading: false })
    }
  },
  
  removeItem: async (itemId) => {
    set({ isLoading: true })
    try {
      await cartApi.removeItem(itemId)
      await get().fetchCart()
    } catch {
      set({ isLoading: false })
    }
  },
  
  clearCart: () => {
    set({ cart: null })
  },
}))
