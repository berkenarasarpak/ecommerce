export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'customer'
  phone?: string
  address?: string
  city?: string
  country?: string
  zipCode?: string
}

export interface AuthResponse {
  token: string
  user: User
}

const TOKEN_KEY = 'ecommerce_token'
const USER_KEY = 'ecommerce_user'

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export const setUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY)
    if (userStr) {
      return JSON.parse(userStr)
    }
  }
  return null
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}

export const isAdmin = (): boolean => {
  const user = getUser()
  return user?.role === 'admin'
}
