'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { isAuthenticated, getUser, User } from '@/lib/auth'
import { ChevronLeft, Package, User as UserIcon, LogOut } from 'lucide-react'

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const cachedUser = getUser()
      if (cachedUser) {
        setUser(cachedUser)
      }
      const freshUser = await authApi.getMe()
      setUser(freshUser)
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ecommerce_token')
    localStorage.removeItem('ecommerce_user')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Failed to load account data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-slate-500">{user.email}</p>
                <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full mt-2">
                  {user.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            <Link
              href="/orders"
              className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">My Orders</p>
                  <p className="text-sm text-slate-500">View and track your orders</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
            </Link>

            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">{user.phone || '-'}</p>
                </div>
              </div>
            </div>

            {user.address && (
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Default Address</h3>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">{user.address}</p>
                  <p className="text-slate-500">
                    {user.city}, {user.country} {user.zipCode}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-6 text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
