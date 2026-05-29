'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { ordersApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { isAuthenticated, getUser } from '@/lib/auth'
import { CreditCard, Truck, ChevronLeft, Check, Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const { cart, fetchCart, clearCart } = useCartStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    sameAsShipping: true,
    billingAddress: '',
    billingCity: '',
    billingCountry: '',
    billingZipCode: '',
    paymentMethod: 'credit_card',
    notes: '',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/checkout')
      return
    }

    const loadData = async () => {
      await fetchCart()
      
      const user = getUser()
      if (user) {
        setFormData((prev) => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          country: user.country || '',
          zipCode: user.zipCode || '',
        }))
      }
      setIsLoading(false)
    }

    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const shippingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        zipCode: formData.zipCode,
      }

      const billingAddress = formData.sameAsShipping
        ? shippingAddress
        : {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            address: formData.billingAddress,
            city: formData.billingCity,
            country: formData.billingCountry,
            zipCode: formData.billingZipCode,
          }

      const response = await ordersApi.create({
        shippingAddress,
        billingAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      })

      setOrderNumber(response.orderNumber)
      setOrderComplete(true)
      clearCart()
    } catch {
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    )
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-600 mb-4">
            Thank you for your purchase. Your order number is:
          </p>
          <p className="text-xl font-mono font-bold text-slate-900 mb-6">{orderNumber}</p>
          <div className="space-y-3">
            <Link
              href="/orders"
              className="block w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              View My Orders
            </Link>
            <Link
              href="/"
              className="block w-full bg-slate-100 text-slate-900 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  const shippingCost = cart.total > 100 ? 0 : 15
  const taxAmount = cart.total * 0.08
  const totalAmount = cart.total + taxAmount + shippingCost

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-slate-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Billing Address</h2>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    name="sameAsShipping"
                    checked={formData.sameAsShipping}
                    onChange={handleChange}
                    className="w-4 h-4 text-slate-900"
                  />
                  <span className="text-sm text-slate-700">Same as shipping address</span>
                </label>

                {!formData.sameAsShipping && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Billing Address</label>
                      <input
                        type="text"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        name="billingCity"
                        value={formData.billingCity}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Zip Code</label>
                      <input
                        type="text"
                        name="billingZipCode"
                        value={formData.billingZipCode}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="billingCountry"
                        value={formData.billingCountry}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={formData.paymentMethod === 'credit_card'}
                      onChange={handleChange}
                      className="w-4 h-4 text-slate-900"
                    />
                    <div>
                      <p className="font-medium text-slate-900">Credit Card</p>
                      <p className="text-sm text-slate-500">Pay with Visa, Mastercard, or Amex</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleChange}
                      className="w-4 h-4 text-slate-900"
                    />
                    <div>
                      <p className="font-medium text-slate-900">PayPal</p>
                      <p className="text-sm text-slate-500">Pay with your PayPal account</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleChange}
                      className="w-4 h-4 text-slate-900"
                    />
                    <div>
                      <p className="font-medium text-slate-900">Cash on Delivery</p>
                      <p className="text-sm text-slate-500">Pay when you receive your order</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Order Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  placeholder="Special instructions for delivery..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Place Order - {formatPrice(totalAmount)}</>
                )}
              </button>
            </form>
          </div>

          <div className="lg:w-96">
            <div className="bg-slate-50 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (8%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex justify-between text-lg font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
