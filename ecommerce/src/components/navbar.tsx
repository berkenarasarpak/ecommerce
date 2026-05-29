'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, Menu, X, Search, Package } from 'lucide-react'
import { getUser, isAdmin, removeToken } from '@/lib/auth'
import { useCartStore } from '@/store/cartStore'
import { categoriesApi } from '@/lib/api'

interface Category {
  id: number
  name: string
  slug: string
}

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { cart, fetchCart } = useCartStore()

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
    setIsAdminUser(isAdmin())
    
    if (currentUser) {
      fetchCart()
    }
    
    loadCategories()
  }, [pathname])

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll()
      setCategories(data.slice(0, 6))
    } catch {
      setCategories([])
    }
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
    setIsAdminUser(false)
    window.location.href = '/'
  }

  const cartItemCount = cart?.itemCount || 0

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-slate-900">
              Store
            </Link>
            
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/products" className="text-slate-600 hover:text-slate-900 font-medium">
                Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="p-2 text-slate-600 hover:text-slate-900 lg:hidden"
            >
              <Search className="w-5 h-5" />
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-slate-600 hover:text-slate-900"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden sm:flex items-center gap-4">
                {isAdminUser && (
                  <Link
                    href="/admin"
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/account"
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  {user.firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 lg:hidden"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-2">
              <Link
                href="/products"
                className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              
              {user ? (
                <>
                  <div className="border-t border-slate-200 my-2" />
                  {isAdminUser && (
                    <Link
                      href="/admin"
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/orders"
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-slate-200 my-2" />
                  <Link
                    href="/login"
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
