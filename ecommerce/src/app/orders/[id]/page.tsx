'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ordersApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { isAuthenticated } from '@/lib/auth'
import { ChevronLeft, Package, Truck, MapPin, CreditCard } from 'lucide-react'

interface OrderItem {
  id: number
  product_name: string
  product_sku: string
  product_image: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: number
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  shipping_address: any
  billing_address: any
  notes: string
  created_at: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadOrder()
  }, [params.id])

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(Number(params.id))
      setOrder(data)
    } catch {
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-slate-100 text-slate-800',
    }
    return colors[status] || 'bg-slate-100 text-slate-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-48" />
            <div className="h-96 bg-white rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Order not found</h1>
          <Link href="/orders" className="text-slate-900 font-medium hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/orders"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{order.order_number}</h1>
              <p className="text-slate-500">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <span className="text-slate-500">
            Payment: <span className="font-medium capitalize">{order.payment_status}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="divide-y divide-slate-200">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.product_name}</p>
                      <p className="text-sm text-slate-500">SKU: {item.product_sku}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatPrice(item.unit_price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              {order.shipping_address && (
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    {order.shipping_address.firstName} {order.shipping_address.lastName}
                  </p>
                  <p className="text-slate-600">{order.shipping_address.email}</p>
                  <p className="text-slate-600 mt-2">{order.shipping_address.address}</p>
                  <p className="text-slate-600">
                    {order.shipping_address.city}, {order.shipping_address.country} {order.shipping_address.zipCode}
                  </p>
                  {order.shipping_address.phone && (
                    <p className="text-slate-600 mt-2">{order.shipping_address.phone}</p>
                  )}
                </div>
              )}
            </div>

            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Order Notes</h2>
                <p className="text-slate-600">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{order.shipping_amount === 0 ? 'Free' : formatPrice(order.shipping_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-semibold text-slate-900">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h2>
              <div className="text-sm">
                <p className="text-slate-600">Method: <span className="font-medium capitalize">{order.payment_method}</span></p>
                <p className="text-slate-600">Status: <span className="font-medium capitalize">{order.payment_status}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
