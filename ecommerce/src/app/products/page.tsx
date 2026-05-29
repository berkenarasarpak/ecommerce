'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { productsApi, categoriesApi } from '@/lib/api'
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils'
import { ShoppingCart, Filter, ChevronDown } from 'lucide-react'
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
  is_featured: boolean
}

interface Category {
  id: number
  name: string
  slug: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  })
  const searchParams = useSearchParams()
  const { addItem } = useCartStore()

  const selectedCategory = searchParams.get('category')
  const searchQuery = searchParams.get('search')

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [selectedCategory, searchQuery, pagination.page])

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll()
      setCategories(data)
    } catch {
      setCategories([])
    }
  }

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string> = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      }
      if (selectedCategory) params.category = selectedCategory
      if (searchQuery) params.search = searchQuery

      const data = await productsApi.getAll(params)
      setProducts(data.products)
      setPagination(data.pagination)
    } catch {
      setProducts([])
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
      <div className="bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {selectedCategory
              ? categories.find((c) => c.slug === selectedCategory)?.name || 'Products'
              : searchQuery
              ? `Search: ${searchQuery}`
              : 'All Products'}
          </h1>
          <p className="text-slate-600 mt-2">
            {pagination.total} products available
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
              </h3>
              <div className="space-y-2">
                <Link
                  href="/products"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Products
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.slug
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 aspect-square rounded-lg mb-4" />
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg">No products found</p>
                <Link
                  href="/products"
                  className="text-slate-900 font-medium hover:underline mt-2 inline-block"
                >
                  View all products
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
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
                      <p className="text-sm text-slate-500 mb-2">
                        {product.category_name}
                      </p>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {product.short_description || product.description}
                      </p>
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

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setPagination({ ...pagination, page: i + 1 })
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          pagination.page === i + 1
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
