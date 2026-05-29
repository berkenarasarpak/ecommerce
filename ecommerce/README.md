# Fullstack E-Commerce Platform

A professional fullstack e-commerce application built with Next.js, Node.js, Express, MySQL, and Tailwind CSS.

## Features

- JWT Authentication (Login/Register)
- User Roles (Admin/Customer)
- Admin Dashboard
- Product Management (CRUD)
- Category Management
- Shopping Cart System
- Order Management System
- Checkout Process
- Order History
- Responsive Design
- Stock Management
- Featured Products

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: Zustand
- **UI Components**: shadcn/ui

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up MySQL database:
   ```bash
   mysql -u root -p < database.sql
   ```

4. Create `.env.local` file in root directory:
   ```
   JWT_SECRET=your-secret-key
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=ecommerce
   ```

5. Start the development servers:
   
   Backend server (in one terminal):
   ```bash
   npm run server
   ```
   
   Frontend server (in another terminal):
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Default Admin Account

- Email: `admin@ecommerce.com`
- Password: `password`

## Project Structure

```
ecommerce/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and API
│   ├── store/           # Zustand stores
│   └── ...
├── server/              # Express backend
│   └── index.js
├── database.sql         # MySQL schema
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:slug` - Get product by slug
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats

## Database Schema

### Users Table
- id, email, password, first_name, last_name, role, phone, address, timestamps

### Products Table
- id, name, slug, description, price, compare_price, sku, quantity, category_id, images, is_featured, timestamps

### Categories Table
- id, name, slug, description, is_active, timestamps

### Carts & Cart Items Tables
- User cart management with product quantities

### Orders & Order Items Tables
- Complete order tracking with status management

## Development

The application consists of:
- Frontend: Next.js 15 app in `src/` directory
- Backend: Express server in `server/` directory
- Database: MySQL schema in `database.sql`

Both frontend and backend run concurrently during development.
