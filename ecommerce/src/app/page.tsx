'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { productsApi } from '@/lib/api'
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

interface Product {
  id: number
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  compare_price: number
  featured_image: string
  category_name: string
  category_slug: string
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addItem } = useCartStore()

  useEffect(() => {
    loadFeaturedProducts()
  }, [])

  const loadFeaturedProducts = async () => {
    try {
      const products = await productsApi.getFeatured()
      setFeaturedProducts(products)
    } catch {
      setFeaturedProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async (productId: number) => {
    try {
      await addItem(productId, 1)
    } catch {
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-slate-900 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800 opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Premium Collection
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Discover our curated selection of high-quality products
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Featured Products</h2>
            <Link
              href="/products"
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 aspect-square rounded-lg mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group">
                  <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden mb-4">
                    {product.featured_image ? (
                      <Image
                        src={product.featured_image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <span className="text-slate-400">No Image</span>
                      </div>
                    )}
                    {product.compare_price > product.price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{calculateDiscountPercentage(product.compare_price, product.price)}%
                      </div>
                    )}
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="absolute bottom-3 right-3 bg-white text-slate-900 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-slate-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-500 mb-2">{product.category_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.compare_price > product.price && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(product.compare_price)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Premium Quality</h3>
              <p className="text-slate-600">Carefully curated products from top brands</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Fast Shipping</h3>
              <p className="text-slate-600">Free shipping on orders over $100</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
              <p className="text-slate-600">100% secure checkout process</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
