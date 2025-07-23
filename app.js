// PDF Invoice Download Route

const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Message = require('./models/Message');
const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

const app = express();

app.get('/order/:id/invoice/pdf', requireLogin, async (req, res) => {
  const Order = require('./models/Order');
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).render('error', { error: 'Order not found.' });
    }
    if (order.user && (!req.user || (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin))) {
      return res.status(403).render('error', { error: 'Unauthorized to view this invoice.' });
    }
    // Render EJS to HTML
    const html = await ejs.renderFile(path.join(__dirname, 'views', 'order-invoice.ejs'), { order });
    // Generate PDF from HTML using Puppeteer
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice-' + order._id + '.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).render('error', { error: 'Failed to generate PDF invoice.' });
  }
});
// --- Order Invoice Download Route ---
app.get('/order/:id/invoice', requireLogin, async (req, res) => {
  const Order = require('./models/Order');
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).render('error', { error: 'Order not found.' });
    }
    // Only allow owner or admin to view
    if (order.user && (!req.user || (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin))) {
      return res.status(403).render('error', { error: 'Unauthorized to view this invoice.' });
    }
    res.setHeader('Content-Disposition', 'attachment; filename="invoice-' + order._id + '.html"');
    res.render('order-invoice', { order });
  } catch (err) {
    res.status(500).render('error', { error: 'Failed to generate invoice.' });
  }
});
// --- Order Detail Page ---
app.get('/order/:id', requireLogin, async (req, res) => {
  const Order = require('./models/Order');
  const Product = require('./models/Product');
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');
    if (!order) {
      return res.status(404).render('error', { error: 'Order not found.' });
    }
    // Only allow owner or admin to view
    if (order.user && (!req.user || (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin))) {
      return res.status(403).render('error', { error: 'Unauthorized to view this order.' });
    }
    res.render('order-detail', { order });
  } catch (err) {
    res.status(500).render('error', { error: 'Failed to load order details.' });
  }
});
// --- Order Success Page ---
// --- Order Success Page with Order Summary ---
app.get('/order-success', requireLogin, async (req, res) => {
  // Find the latest paid order for this user
  const user = await User.findById(req.session.userId);
  const order = await Order.findOne({ user: user._id, 'payment.status': 'Paid' }).sort({ createdAt: -1 });
  res.render('order-success', { order });
});
// --- Razorpay Payment Verification and Order Saving ---
// const crypto = require('crypto');
app.post('/verify-payment', requireLogin, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
    return res.status(400).json({ success: false, error: 'Missing payment details' });
  }
  // Verify signature
  const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');
  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Payment verification failed' });
  }
  try {
    // Save order to DB (minimal order for demo)
    const user = await User.findById(req.session.userId);
    const order = new Order({
      user: user._id,
      items: [],
      name: user.name,
      email: user.email,
      payment: {
        method: 'Razorpay',
        status: 'Paid',
        transactionId: razorpay_payment_id,
        provider: 'Razorpay',
        details: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
      },
      status: 'Pending',
      createdAt: new Date()
    });
    await order.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});
// --- Razorpay Integration ---
const razorpay = require('./razorpay-helper');

// --- Razorpay Payment Order API ---
app.post('/create-order', requireLogin, async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    const options = {
      amount: Number(amount) * 100, // amount in paise
      currency: 'INR',
      receipt: `rcptid_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});



// Remove from cart
app.post('/remove-from-cart', (req, res) => {
  const { productId } = req.body;
  let cart = req.session.cart || [];
  cart = cart.filter(item => item.product._id.toString() !== productId);
  req.session.cart = cart;
  res.redirect('/cart');
});

// Update cart quantity
app.post('/update-cart', (req, res) => {
  const { productId, quantity } = req.body;
  let cart = req.session.cart || [];
  const item = cart.find(item => item.product._id.toString() === productId);
  if (item) {
    item.quantity = Math.max(1, parseInt(quantity) || 1);
  }
  req.session.cart = cart;
  res.redirect('/cart');
});
// --- Admin Product Management ---
// Add Product (GET)
app.get('/admin/add-product', requireAdmin, (req, res) => {
  res.render('add-product', { error: null });
});

// Add Product (POST)
app.post('/admin/add-product', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, image, description } = req.body;
    if (!name || !category || !price) {
      return res.render('add-product', { error: 'Name, category, and price are required.' });
    }
    if (isNaN(price) || price <= 0) {
      return res.render('add-product', { error: 'Price must be a positive number.' });
    }
    await Product.create({ name, category, price, image, description });
    res.redirect('/admin');
  } catch (err) {
    res.render('add-product', { error: 'Server error. Please try again.' });
  }
});

// Edit Product (GET)
app.get('/admin/edit-product/:id', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.redirect('/admin');
  res.render('edit-product', { product, error: null });
});

// Edit Product (POST)
app.post('/admin/edit-product/:id', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, image, description } = req.body;
    if (!name || !category || !price) {
      return res.render('edit-product', { error: 'Name, category, and price are required.', product: { _id: req.params.id, name, category, price, image, description } });
    }
    if (isNaN(price) || price <= 0) {
      return res.render('edit-product', { error: 'Price must be a positive number.', product: { _id: req.params.id, name, category, price, image, description } });
    }
    await Product.findByIdAndUpdate(req.params.id, { name, category, price, image, description });
    res.redirect('/admin');
  } catch (err) {
    res.render('edit-product', { error: 'Server error. Please try again.', product: { _id: req.params.id, name: req.body.name, category: req.body.category, price: req.body.price, image: req.body.image, description: req.body.description } });
  }
});

// Delete Product
app.get('/admin/delete-product/:id', requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

app.set('view engine', 'ejs');
app.use(express.static('public'));

const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
// Email transporter setup (configure .env for production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'ecommerce-secret', resave: false, saveUninitialized: true }));

// --- Authentication Middleware ---
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(403).send('Forbidden');
  next();
}


// --- Mock SMS sender (replace with real API for production) ---
function sendSmsOtp(mobile, otp) {
  console.log(`Mock SMS: Sending OTP ${otp} to mobile ${mobile}`);
  // Integrate real SMS API here (e.g., Twilio, MSG91, Fast2SMS)
}

// --- Signup logic with OTP (Email or Mobile) ---

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    // Validate name and password
    if (!name || !password) {
      return res.render('signup', { error: 'Name and password are required.' });
    }
    // At least one of email or mobile must be provided
    if ((!email || email.trim() === '') && (!mobile || mobile.trim() === '')) {
      return res.render('signup', { error: 'Please provide either email or mobile number.' });
    }
    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(email)) {
        return res.render('signup', { error: 'Invalid email format.' });
      }
      if (await User.findOne({ email })) {
        return res.render('signup', { error: 'Email already registered.' });
      }
    }
    // Validate mobile format if provided
    if (mobile && mobile.trim() !== '') {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobile)) {
        return res.render('signup', { error: 'Invalid mobile number. Enter 10 digits.' });
      }
      if (await User.findOne({ mobile })) {
        return res.render('signup', { error: 'Mobile number already registered.' });
      }
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.otp = otp;
    req.session.signupData = { name, email, mobile, password };
    // Send OTP via email or SMS
    if (email && email.trim() !== '') {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Signup',
        text: `Your OTP for signup is: ${otp}`
      });
    } else if (mobile && mobile.trim() !== '') {
      sendSmsOtp(mobile, otp);
    }
    res.render('verify-otp', { email, mobile });
  } catch (err) {
    console.error(err);
    res.render('signup', { error: 'Error during signup. Please try again.' });
  }
});

app.get('/verify-otp', (req, res) => {
  const { signupData } = req.session;
  if (!signupData) return res.redirect('/signup');
  res.render('verify-otp', { email: signupData.email, mobile: signupData.mobile });
});

app.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    if (!req.session.otp || !req.session.signupData) {
      return res.redirect('/signup');
    }
    if (otp !== req.session.otp) {
      return res.render('verify-otp', {
        email: req.session.signupData.email,
        mobile: req.session.signupData.mobile,
        error: 'Invalid OTP. Please try again.'
      });
    }
    // Create user
    const { name, email, mobile, password } = req.session.signupData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email: email || undefined, mobile: mobile || undefined, password: hashedPassword });
    await user.save();
    // Clear session
    req.session.otp = null;
    req.session.signupData = null;
    req.session.userId = user._id;
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.render('verify-otp', { error: 'Error verifying OTP. Please try again.' });
  }
});
const crypto = require('crypto');
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.render('signup', { error: 'All fields are required.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.render('signup', { error: 'Invalid email format.' });
    }
    if (password.length < 6) {
      return res.render('signup', { error: 'Password must be at least 6 characters.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.render('signup', { error: 'Email already registered.' });
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.otp = otp;
    req.session.signupData = { name, email, password };
    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Love Bites Signup',
      html: `<h2>Your OTP is: ${otp}</h2><p>Enter this code to complete your signup.</p>`
    });
    res.render('verify-otp', { email, error: null });
  } catch (err) {
    res.render('signup', { error: 'Server error. Please try again.' });
  }
});

// OTP verification route
app.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;
  if (!req.session.otp || !req.session.signupData) {
    return res.redirect('/signup');
  }
  if (otp !== req.session.otp) {
    return res.render('verify-otp', { email: req.session.signupData.email, error: 'Invalid OTP. Please try again.' });
  }
  // OTP correct, create user
  const { name, email, password } = req.session.signupData;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hash });
  await user.save();
  req.session.userId = user._id;
  req.session.otp = null;
  req.session.signupData = null;
  res.redirect('/profile');
});

// Login logic
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render('login', { error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.render('login', { error: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Invalid email or password.' });
    req.session.userId = user._id;
    req.session.isAdmin = (user.email === 'admin@lovebites.com');
    res.redirect('/profile');
  } catch (err) {
    res.render('login', { error: 'Server error. Please try again.' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// --- User Profile ---
app.get('/profile', requireLogin, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const orders = await Order.find({ user: user._id });
  // Expose Razorpay Key ID to EJS
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
  // Show payment error if present in query
  const payError = req.query.payError || null;
  res.render('profile', { user, orders, RAZORPAY_KEY_ID, payError });
});

// --- Wishlist ---
app.get('/wishlist', requireLogin, async (req, res) => {
  // For now, wishlist is empty. You can add logic to store wishlist in user model.
  const wishlist = [];
  res.render('wishlist', { wishlist });
});

// --- Admin Panel ---
app.get('/admin', requireAdmin, async (req, res) => {
  const products = await Product.find();
  const orders = await Order.find();
  const users = await User.find();
  res.render('admin', { products, orders, users });
});

// --- Admin Order Management ---
app.get('/admin/orders', requireAdmin, async (req, res) => {
  const orders = await Order.find().populate('user').sort({ createdAt: -1 });
  res.render('admin-orders', { orders });
});

app.post('/admin/orders/update-status', requireAdmin, async (req, res) => {
  const { orderId, status } = req.body;
  try {
    if (!orderId || !['Pending', 'Delivered'].includes(status)) throw new Error('Invalid order or status');
    await Order.findByIdAndUpdate(orderId, { status });
    res.redirect('/admin/orders');
  } catch (err) {
    res.status(400).render('error', { error: err.message || 'Error updating order status.' });
  }
});

// --- Admin User Management ---
app.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await User.find();
  res.render('admin-users', { users });
});

app.post('/admin/users/delete', requireAdmin, async (req, res) => {
  const { userId } = req.body;
  try {
    if (!userId) throw new Error('User ID required');
    await User.findByIdAndDelete(userId);
    res.redirect('/admin/users');
  } catch (err) {
    res.status(400).render('error', { error: err.message || 'Error deleting user.' });
  }
});

// --- Enhanced Coupon/Offer Logic ---
let coupons = [
  { code: 'WELCOME10', discount: 10 },
  { code: 'SUMMER20', discount: 20 }
];

app.get('/admin/coupons', requireAdmin, (req, res) => {
  res.render('admin-coupons', { coupons });
});

app.post('/admin/coupons/add', requireAdmin, (req, res) => {
  const { code, discount } = req.body;
  if (!code || !discount) {
    return res.status(400).render('error', { error: 'Coupon code and discount are required.' });
  }
  if (isNaN(discount) || discount <= 0 || discount > 99) {
    return res.status(400).render('error', { error: 'Discount must be a number between 1 and 99.' });
  }
  if (coupons.find(c => c.code === code)) {
    return res.status(400).render('error', { error: 'Coupon code already exists.' });
  }
  coupons.push({ code, discount: parseInt(discount) });
  res.redirect('/admin/coupons');
});

app.post('/admin/coupons/delete', requireAdmin, (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).render('error', { error: 'Coupon code required.' });
  }
  coupons = coupons.filter(c => c.code !== code);
  res.redirect('/admin/coupons');
});

// Home page with sale, categories, and featured products
app.get('/', async (req, res) => {
  // Get all categories
  const categories = await Product.distinct('category');
  // Get featured products (top 6 by rating)
  const featured = await Product.find().sort({ rating: -1 }).limit(6);
  // Get all products on sale
  const saleProducts = await Product.find({ sale: { $ne: null } });
  // Pick a random sale product for the rotating sale banner
  let saleItem = null;
  if (saleProducts.length > 0) {
    const idx = Math.floor(Math.random() * saleProducts.length);
    saleItem = saleProducts[idx];
  }
  res.render('home', { categories, featured, saleItem });
});

// About page
app.get('/about', (req, res) => {
  res.render('about');
});

// Products page with category filter
// --- Global Error Handler Middleware ---
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  // Render a friendly error page or JSON
  if (req.accepts('html')) {
    res.status(500).render('error', { error: err.message || 'Something went wrong!' });
  } else {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});
// --- Coupon Logic ---
// Example coupon list (in production, use a Coupon model)
const COUPONS = [
  { code: 'WELCOME10', discount: 10, expires: new Date('2099-12-31') },
  { code: 'SALE20', discount: 20, expires: new Date('2099-12-31') },
  { code: 'INDIA25', discount: 25, expires: new Date('2099-12-31') }
];

// Apply coupon from cart
app.post('/cart/apply-coupon', (req, res) => {
  const { coupon } = req.body;
  const found = COUPONS.find(c => c.code.toLowerCase() === coupon.trim().toLowerCase());
  if (!found) {
    req.session.appliedCoupon = null;
    req.session.couponError = 'Invalid coupon code.';
  } else if (found.expires < new Date()) {
    req.session.appliedCoupon = null;
    req.session.couponError = 'Coupon expired.';
  } else {
    req.session.appliedCoupon = { code: found.code, discount: found.discount };
    req.session.couponError = null;
  }
  res.redirect('/cart');
});

// Cart page (update to pass coupon info)
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  let total = 0;
  cart.forEach(item => {
    total += item.product.price * item.quantity;
  });
  res.render('cart', {
    cart,
    total,
    appliedCoupon: req.session.appliedCoupon,
    couponError: req.session.couponError
  });
  req.session.couponError = null; // clear error after render
});

// Checkout (apply coupon discount to order)
app.post('/checkout', async (req, res) => {
  const cart = req.session.cart || [];
  if (!cart.length) return res.redirect('/cart');
  let total = 0;
  cart.forEach(item => {
    total += item.product.price * item.quantity;
  });
  let coupon = req.session.appliedCoupon;
  let discount = 0;
  if (coupon && coupon.discount) {
    discount = Math.round(total * coupon.discount / 100);
  }
  const finalTotal = total - discount;
  // Validate checkout fields
  const { name, email, address, payment } = req.body;
  if (!name || !email || !address || !payment) {
    return res.render('cart', {
      cart,
      total,
      appliedCoupon: req.session.appliedCoupon,
      couponError: null,
      checkoutError: 'All checkout fields are required.'
    });
  }
  // ...existing order creation logic...
  try {
    const order = new Order({
      items: cart.map(item => ({ product: item.product._id, quantity: item.quantity })),
      name,
      email,
      address,
      payment: { method: payment, status: 'Pending' },
      status: 'Pending',
      coupon: coupon ? { code: coupon.code, discount: coupon.discount } : undefined,
      total: finalTotal
    });
    await order.save();
    // Send order confirmation email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Order Confirmation - Love Bites',
        html: `<h2>Thank you for your order!</h2><p>Order ID: ${order._id}</p><p>Total: ₹${finalTotal}</p><p>We will process your order soon.</p>`
      });
    } catch (e) {
      console.error('Email send error:', e);
    }
    req.session.cart = [];
    req.session.appliedCoupon = null;
    res.redirect('/order-success');
  } catch (err) {
    res.render('cart', {
      cart,
      total,
      appliedCoupon: req.session.appliedCoupon,
      couponError: null,
      checkoutError: 'Server error. Please try again.'
    });
  }
});
// Products page with category filter and search
app.get('/products', async (req, res) => {
  const category = req.query.category;
  const search = req.query.search;
  let query = {};
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: 'i' };
  let products = await Product.find(query);
  let categories = await Product.distinct('category');
  // Compute brands for the selected category
  let brands = [];
  if (category) {
    // Try to get all distinct brands for this category
    // For Mobiles, Laptops, etc. brand is in name or specifications.Brand
    let brandSet = new Set();
    for (const p of products) {
      // Try to extract brand from specifications.Brand or from name
      if (p.specifications && p.specifications.Brand) {
        brandSet.add(p.specifications.Brand);
      } else if (p.name) {
        // Assume brand is the first word in name (for Mobiles, Laptops, etc.)
        let first = p.name.split(' ')[0];
        if (first && first.length > 1 && first.toLowerCase() !== 'the') brandSet.add(first);
      }
    }
    brands = Array.from(brandSet).sort();
  }
  res.render('products', { products, categories, selectedCategory: category || '', search: search || '', brands });
});
// --- User Profile Editing ---
app.get('/profile/edit', requireLogin, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('edit-profile', { user, error: null });
});

app.post('/profile/edit', requireLogin, async (req, res) => {
  const { name, email, mobile, age, gender, password } = req.body;
  const user = await User.findById(req.session.userId);
  if (!name) {
    return res.render('edit-profile', { user, error: 'Name is required.' });
  }
  if (email && email.trim() !== '' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.render('edit-profile', { user, error: 'Invalid email format.' });
  }
  if (mobile && mobile.trim() !== '' && !/^[0-9]{10}$/.test(mobile)) {
    return res.render('edit-profile', { user, error: 'Invalid mobile number. Enter 10 digits.' });
  }
  user.name = name;
  user.email = email || undefined;
  user.mobile = mobile || undefined;
  user.age = age ? Number(age) : undefined;
  user.gender = gender || undefined;
  if (password) {
    if (password.length < 6) {
      return res.render('edit-profile', { user, error: 'Password must be at least 6 characters.' });
    }
    const bcrypt = require('bcryptjs');
    user.password = await bcrypt.hash(password, 10);
  }
  await user.save();
  res.redirect('/profile');
});
// --- Pay Section (Demo Payment Route) ---
app.post('/pay', requireLogin, (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.redirect('/profile');
  }
  // Simulate payment success
  (async () => {
    const user = await User.findById(req.session.userId);
    const orders = await Order.find({ user: user._id });
    res.render('profile', { user, orders, paySuccess: `Payment of ₹${amount} successful! (Simulated)` });
  })();
});


// Add to cart
app.post('/add-to-cart', async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.redirect('/products');
  if (!req.session.cart) req.session.cart = [];
  const cart = req.session.cart;
  const existing = cart.find(item => item.product._id.toString() === productId);
  if (existing) {
    existing.quantity += parseInt(quantity);
  } else {
    cart.push({ product, quantity: parseInt(quantity) });
  }
  req.session.cart = cart;
  res.redirect('/cart');
});


// View cart
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  res.render('cart', { cart, total });
});


// Checkout
app.post('/checkout', async (req, res) => {
  const { name, email, address, payment, cardNumber, cardName, cardExpiry, cardCVC, upiId, bank, emiMonths } = req.body;
  const cart = req.session.cart || [];
  if (!cart.length) return res.redirect('/cart');
  let paymentDetails = {};
  let provider = '';
  if (payment === 'card') {
    provider = 'Stripe';
    paymentDetails = { cardNumber, cardName, cardExpiry, cardCVC };
  } else if (payment === 'upi') {
    provider = 'Razorpay';
    paymentDetails = { upiId };
  } else if (payment === 'finance') {
    provider = 'Bank';
    paymentDetails = { bank, emiMonths };
  } else if (payment === 'cod') {
    provider = 'COD';
  }
  // Simulate payment gateway callback/confirmation
  let paymentStatus = (payment === 'cod') ? 'Pending' : 'Paid';
  let transactionId = 'TXN' + Date.now();
  // If user is logged in, attach user ID
  let userId = req.session.userId || null;
  await Order.create({
    user: userId,
    items: cart.map(item => ({ product: item.product._id, quantity: item.quantity })),
    name, email, address,
    payment: {
      method: payment,
      status: paymentStatus,
      transactionId,
      provider,
      details: paymentDetails
    },
    status: 'Pending'
  });
  req.session.cart = [];
  res.render('order-success');
});

// Contact page
app.get('/contact', (req, res) => {
  res.render('index');
});

// Login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Signup page
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Contact form (optional, can be removed if not needed)
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  await Message.create({ name, email, message });
  res.send('Thanks for contacting us!');
});


// API endpoint for rotating sale item (must be after app is defined)
app.get('/api/sale-item', async (req, res) => {
  const saleProducts = await Product.find({ sale: { $ne: null } });
  if (saleProducts.length === 0) return res.json(null);
  const idx = Math.floor(Math.random() * saleProducts.length);
  res.json(saleProducts[idx]);
});

// Product detail page
app.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render('error', { error: 'Product not found.' });
    // Optionally, compute delivery date, etc.
    res.render('product-detail', { product });
  } catch (err) {
    res.status(500).render('error', { error: 'Failed to load product details.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
