'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { productsApi } from '@/lib/api'
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils'
import { ShoppingCart, Minus, Plus, ChevronLeft, Check, Package, Truck, Shield } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

interface Product {
  id: number
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  compare_price: number
  sku: string
  barcode: string
  quantity: number
  weight: number
  featured_image: string
  images: string[]
  category_name: string
  category_slug: string
  is_active: boolean
}

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const params = useParams()
  const { addItem } = useCartStore()

  useEffect(() => {
    loadProduct()
  }, [params.slug])

  const loadProduct = async () => {
    setIsLoading(true)
    try {
      const data = await productsApi.getBySlug(params.slug as string)
      setProduct(data)
    } catch {
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addItem(product.id, quantity)
      } catch {
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-slate-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-slate-200 rounded w-3/4" />
                <div className="h-6 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Product not found</h1>
          <Link href="/products" className="text-slate-900 font-medium hover:underline">
            Browse all products
          </Link>
        </div>
      </div>
    )
  }

  const allImages = [product.featured_image, ...(product.images || [])].filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
              {allImages[selectedImage] ? (
                <Image
                  src={allImages[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                  <span className="text-slate-400">No Image</span>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-slate-900'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <Link
                href={`/products?category=${product.category_slug}`}
                className="text-sm text-slate-500 hover:text-slate-900"
              >
                {product.category_name}
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 mt-2">{product.name}</h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {formatPrice(product.price)}
              </span>
              {product.compare_price > product.price && (
                <>
                  <span className="text-xl text-slate-400 line-through">
                    {formatPrice(product.compare_price)}
                  </span>
                  <span className="text-red-600 font-semibold">
                    Save {calculateDiscountPercentage(product.compare_price, product.price)}%
                  </span>
                </>
              )}
            </div>

            {product.short_description && (
              <p className="text-slate-600">{product.short_description}</p>
            )}

            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="p-3 hover:bg-slate-100 transition-colors"
                    disabled={quantity >= product.quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className={`text-sm ${product.quantity > 10 ? 'text-green-600' : product.quantity > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {product.quantity > 10 ? 'In Stock' : product.quantity > 0 ? `Only ${product.quantity} left` : 'Out of Stock'}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.quantity === 0}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            </div>

            <div className="border-t border-slate-200 pt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Truck className="w-5 h-5 text-slate-400" />
                <span>Free shipping on orders over $100</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Package className="w-5 h-5 text-slate-400" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Shield className="w-5 h-5 text-slate-400" />
                <span>2-year warranty included</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Description</h3>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 whitespace-pre-line">{product.description}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Product Details</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {product.sku && (
                  <>
                    <dt className="text-slate-500">SKU</dt>
                    <dd className="text-slate-900 font-medium">{product.sku}</dd>
                  </>
                )}
                {product.barcode && (
                  <>
                    <dt className="text-slate-500">Barcode</dt>
                    <dd className="text-slate-900 font-medium">{product.barcode}</dd>
                  </>
                )}
                {product.weight && (
                  <>
                    <dt className="text-slate-500">Weight</dt>
                    <dd className="text-slate-900 font-medium">{product.weight} kg</dd>
                  </>
                )}
                <dt className="text-slate-500">Category</dt>
                <dd className="text-slate-900 font-medium">{product.category_name}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
