require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const withdrawRoutes = require('./routes/withdrawRoutes'); 
const { verifyAuth } = require('./middlewares/authMiddleware');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔗 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 🛡️ Middleware
app.use(helmet());
app.use(express.json());
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(cors({
  origin: "https://www.happybit.live",
  credentials: true,
}));

// // ⚙️ CSRF middleware (cookie-based)
// const csrfProtection = csrf({
//   cookie: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'none',
//   },
// });
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"    // обязательно для мобильных браузеров
  }
});


// 🚪 CSRF token route (GET) — отдаёт токен
app.get('/api/auth/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 🧱 Apply CSRF protection only to POST/PUT/DELETE routes
app.use('/api', (req, res, next) => {
  const csrfExcludedMethods = ['GET', 'OPTIONS', 'HEAD'];
  if (csrfExcludedMethods.includes(req.method)) return next();
  csrfProtection(req, res, next);
}, authRoutes);

// ✅ Root route
app.get('/', (req, res) => res.send('✅ API running!'));

// Все маршруты для платежей
app.use('/api/binance', paymentRoutes);
app.use('/api/money',withdrawRoutes)
app.use('/api/user',userRoutes);
app.use('/admin', (req, res, next) => {
  const csrfExcludedMethods = ['GET'];
  if (csrfExcludedMethods.includes(req.method)) return next();
  csrfProtection(req, res, next);
},adminRoutes);

// ❌ Global error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('❌ Invalid CSRF token');
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  console.error('Global Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 🚀 Start server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
