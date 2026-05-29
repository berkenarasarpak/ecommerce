'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react'
import { isAuthenticated } from '@/lib/auth'

export default function CartPage() {
  const { cart, fetchCart, updateItem, removeItem, isLoading } = useCartStore()
  const router = useRouter()

  useEffect(() => {
    fetchCart()
  }, [])

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      await updateItem(itemId, newQuantity)
    } catch {
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId)
    } catch {
    }
  }

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/checkout')
      return
    }
    router.push('/checkout')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-24 h-24 bg-slate-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
          <p className="text-slate-600 mb-6">Looks like you haven&apos;t added anything yet.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-slate-50 rounded-lg"
              >
                <div className="relative w-24 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <span className="text-xs text-slate-400">No Image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-semibold text-slate-900 hover:text-slate-600 transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatPrice(item.price)} each
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-slate-100 transition-colors"
                        disabled={item.quantity >= item.stockQuantity}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-slate-900">
                        {formatPrice(item.total)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:w-96">
            <div className="bg-slate-50 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{cart.total > 100 ? 'Free' : formatPrice(15)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>{formatPrice(cart.total * 0.08)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold text-slate-900">
                  <span>Total</span>
                  <span>
                    {formatPrice(cart.total + cart.total * 0.08 + (cart.total > 100 ? 0 : 15))}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/products"
                className="block text-center text-slate-600 hover:text-slate-900 mt-4 font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
