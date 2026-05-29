import { getToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  
  return response.json()
}

export const authApi = {
  register: (data: any) => fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data: any) => fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMe: () => fetchWithAuth('/api/auth/me'),
}

export const productsApi = {
  getAll: (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchWithAuth(`/api/products${queryString}`)
  },
  
  getFeatured: () => fetchWithAuth('/api/products/featured'),
  
  getBySlug: (slug: string) => fetchWithAuth(`/api/products/${slug}`),
  
  create: (data: any) => fetchWithAuth('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: number, data: any) => fetchWithAuth(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: number) => fetchWithAuth(`/api/products/${id}`, {
    method: 'DELETE',
  }),
}

export const categoriesApi = {
  getAll: () => fetchWithAuth('/api/categories'),
  
  create: (data: any) => fetchWithAuth('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

export const cartApi = {
  getCart: () => fetchWithAuth('/api/cart'),
  
  addItem: (data: any) => fetchWithAuth('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateItem: (id: number, data: any) => fetchWithAuth(`/api/cart/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  removeItem: (id: number) => fetchWithAuth(`/api/cart/items/${id}`, {
    method: 'DELETE',
  }),
}

export const ordersApi = {
  getAll: (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchWithAuth(`/api/orders${queryString}`)
  },
  
  getById: (id: number) => fetchWithAuth(`/api/orders/${id}`),
  
  create: (data: any) => fetchWithAuth('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateStatus: (id: number, data: any) => fetchWithAuth(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}

export const adminApi = {
  getDashboard: () => fetchWithAuth('/api/admin/dashboard'),
}
