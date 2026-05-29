const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.post('/api/auth/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, firstName, lastName, phone, address, city, country, zipCode } = req.body;
    
    try {
      const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [result] = await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, phone, address, city, country, zip_code) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, firstName, lastName, phone, address, city, country, zipCode]
      );
      
      const token = jwt.sign(
        { userId: result.insertId, email, role: 'customer' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.status(201).json({
        token,
        user: {
          id: result.insertId,
          email,
          firstName,
          lastName,
          role: 'customer'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

app.post('/api/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    try {
      const [users] = await pool.query(
        'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, role, phone, address, city, country, zip_code FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      country: user.country,
      zipCode: user.zip_code
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/products', async (req, res) => {
  const { category, search, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12 } = req.query;
  
  try {
    let whereClause = 'WHERE p.is_active = TRUE';
    const params = [];
    
    if (category) {
      whereClause += ' AND c.slug = ?';
      params.push(category);
    }
    
    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(minPrice);
    }
    
    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(maxPrice);
    }
    
    const sortOptions = {
      newest: 'p.created_at DESC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      name_asc: 'p.name ASC',
      featured: 'p.is_featured DESC, p.created_at DESC'
    };
    
    const orderBy = sortOptions[sort] || sortOptions.newest;
    const offset = (page - 1) * limit;
    
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    res.json({
      products: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/featured', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE AND p.is_featured = TRUE
       ORDER BY p.created_at DESC
       LIMIT 8`
    );
    
    res.json(products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : []
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.is_active = TRUE`,
      [req.params.slug]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = products[0];
    res.json({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
  const {
    name, slug, description, shortDescription, price, comparePrice,
    costPrice, sku, barcode, quantity, weight, categoryId, images,
    featuredImage, isFeatured, metaTitle, metaDescription
  } = req.body;
  
  try {
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, short_description, price, compare_price,
       cost_price, sku, barcode, quantity, weight, category_id, images, featured_image,
       is_featured, meta_title, meta_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, shortDescription, price, comparePrice,
       costPrice, sku, barcode, quantity, weight, categoryId, JSON.stringify(images),
       featuredImage, isFeatured, metaTitle, metaDescription]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Product with this slug or SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const {
    name, slug, description, shortDescription, price, comparePrice,
    costPrice, sku, barcode, quantity, weight, categoryId, images,
    featuredImage, isActive, isFeatured, metaTitle, metaDescription
  } = req.body;
  
  try {
    await pool.query(
      `UPDATE products SET
       name = ?, slug = ?, description = ?, short_description = ?, price = ?,
       compare_price = ?, cost_price = ?, sku = ?, barcode = ?, quantity = ?,
       weight = ?, category_id = ?, images = ?, featured_image = ?, is_active = ?,
       is_featured = ?, meta_title = ?, meta_description = ?
       WHERE id = ?`,
      [name, slug, description, shortDescription, price, comparePrice,
       costPrice, sku, barcode, quantity, weight, categoryId, JSON.stringify(images),
       featuredImage, isActive, isFeatured, metaTitle, metaDescription, req.params.id]
    );
    
    res.json({ message: 'Product updated' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Product with this slug or SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name'
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name, slug, description, imageUrl, parentId } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, description, image_url, parent_id) VALUES (?, ?, ?, ?, ?)',
      [name, slug, description, imageUrl, parentId]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const [carts] = await pool.query(
      'SELECT id FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.userId]
    );
    
    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [req.user.userId]);
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }
    
    const [items] = await pool.query(
      `SELECT ci.*, p.name, p.slug, p.featured_image, p.quantity as stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({
      id: cartId,
      items: items.map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        image: item.featured_image,
        price: item.price,
        quantity: item.quantity,
        stockQuantity: item.stock_quantity,
        total: item.price * item.quantity
      })),
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart/items', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  
  try {
    const [products] = await pool.query(
      'SELECT price, quantity FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = products[0];
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    const [carts] = await pool.query(
      'SELECT id FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.userId]
    );
    
    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [req.user.userId]);
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }
    
    const [existingItems] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );
    
    if (existingItems.length > 0) {
      const newQuantity = existingItems[0].quantity + quantity;
      if (product.quantity < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [cartId, productId, quantity, product.price]
      );
    }
    
    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

app.put('/api/cart/items/:id', authenticateToken, async (req, res) => {
  const { quantity } = req.body;
  
  try {
    const [items] = await pool.query(
      `SELECT ci.*, p.quantity as stock_quantity
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.userId]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    if (items[0].stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    } else {
      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.id]);
    }
    
    res.json({ message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/api/cart/items/:id', authenticateToken, async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT ci.* FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.userId]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;
  
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const [carts] = await connection.query(
        `SELECT c.id FROM carts c WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT 1`,
        [req.user.userId]
      );
      
      if (carts.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      const cartId = carts[0].id;
      
      const [cartItems] = await connection.query(
        `SELECT ci.*, p.name, p.sku, p.featured_image, p.quantity as stock_quantity
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ?`,
        [cartId]
      );
      
      if (cartItems.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      for (const item of cartItems) {
        if (item.stock_quantity < item.quantity) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
        }
      }
      
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = subtotal * 0.08;
      const shippingAmount = subtotal > 100 ? 0 : 15;
      const totalAmount = subtotal + taxAmount + shippingAmount;
      
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, order_number, status, payment_status, payment_method,
         subtotal, tax_amount, shipping_amount, total_amount, shipping_address, billing_address, notes)
         VALUES (?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.userId, orderNumber, paymentMethod, subtotal, taxAmount, shippingAmount,
         totalAmount, JSON.stringify(shippingAddress), JSON.stringify(billingAddress), notes]
      );
      
      const orderId = orderResult.insertId;
      
      for (const item of cartItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_sku, product_image,
           quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.name, item.sku, item.featured_image,
           item.quantity, item.price, item.price * item.quantity]
        );
        
        await connection.query(
          'UPDATE products SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
      
      await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
      
      await connection.commit();
      connection.release();
      
      res.status(201).json({
        orderId,
        orderNumber,
        total: totalAmount,
        message: 'Order created successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE o.user_id = ?';
    const params = [req.user.userId];
    
    if (req.user.role === 'admin') {
      whereClause = '';
      params.length = 0;
    }
    
    const [orders] = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    
    res.json({
      orders: orders.map(o => ({
        ...o,
        shippingAddress: o.shipping_address ? JSON.parse(o.shipping_address) : null,
        billingAddress: o.billing_address ? JSON.parse(o.billing_address) : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    let whereClause = 'WHERE o.id = ? AND o.user_id = ?';
    const params = [req.params.id, req.user.userId];
    
    if (req.user.role === 'admin') {
      whereClause = 'WHERE o.id = ?';
      params.pop();
    }
    
    const [orders] = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      params
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [req.params.id]
    );
    
    const order = orders[0];
    res.json({
      ...order,
      shippingAddress: order.shipping_address ? JSON.parse(order.shipping_address) : null,
      billingAddress: order.billing_address ? JSON.parse(order.billing_address) : null,
      items
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.put('/api/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status, paymentStatus } = req.body;
  
  try {
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (paymentStatus) {
      updates.push('payment_status = ?');
      params.push(paymentStatus);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    params.push(req.params.id);
    
    await pool.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM orders WHERE payment_status = "paid"');
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM products WHERE is_active = TRUE');
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE is_active = TRUE');
    
    const [recentOrders] = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );
    
    const [lowStockProducts] = await pool.query(
      `SELECT id, name, sku, quantity FROM products WHERE quantity < 10 AND is_active = TRUE ORDER BY quantity ASC LIMIT 5`
    );
    
    res.json({
      stats: { totalOrders, totalRevenue, totalProducts, totalUsers },
      recentOrders: recentOrders.map(o => ({
        ...o,
        shippingAddress: o.shipping_address ? JSON.parse(o.shipping_address) : null
      })),
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {});
