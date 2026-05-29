'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminApi, ordersApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { isAuthenticated, isAdmin } from '@/lib/auth'
import { Package, Users, DollarSign, ShoppingBag, ArrowUpRight, AlertCircle } from 'lucide-react'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalUsers: number
}

interface Order {
  id: number
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  first_name: string
  last_name: string
  email: string
}

interface LowStockProduct {
  id: number
  name: string
  sku: string
  quantity: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    if (!isAdmin()) {
      router.push('/')
      return
    }
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const dashboardData = await adminApi.getDashboard()
      setStats(dashboardData.stats)
      setRecentOrders(dashboardData.recentOrders)
      setLowStockProducts(dashboardData.lowStockProducts)
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg w-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">{formatPrice(stats?.totalRevenue || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Products</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalProducts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-200">
              {recentOrders.length === 0 ? (
                <p className="p-6 text-slate-500 text-center">No orders yet</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{order.order_number}</p>
                        <p className="text-sm text-slate-500">
                          {order.first_name} {order.last_name} • {order.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatPrice(order.total_amount)}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <Link
                  href="/admin/products/new"
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-slate-900">Add Product</span>
                </Link>
                <Link
                  href="/admin/categories"
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-slate-900">Categories</span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-slate-900">Low Stock Alert</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {lowStockProducts.length === 0 ? (
                  <p className="p-6 text-slate-500 text-center">No low stock products</p>
                ) : (
                  lowStockProducts.map((product) => (
                    <div key={product.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.quantity === 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {product.quantity} left
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
