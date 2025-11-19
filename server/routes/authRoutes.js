
const { getClaimStatus, claimReward } = require('../controllers/userController');

const express = require('express');
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, verifyEmail, getCurrentUser, logoutUser, refreshToken } = require('../controllers/authController');
const { verifyAuth } = require('../middlewares/authMiddleware');
const registerValidationSchema = require('../validators/registerValidator');
const loginValidationSchema = require('../validators/loginValidator');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: true });

const router = express.Router();

// Rate limiter для регистрации
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Please try again in an hour.' },
});

// Rate limiter для логина
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

// Middleware для валидации через Yup
const validateYupSchema = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (err) {
    return res.status(400).json({ errors: err.errors });
  }
};

// 🔹 Auth routes
router.post('/auth/register', registerLimiter, validateYupSchema(registerValidationSchema), registerUser);
router.post('/auth/login', loginLimiter, validateYupSchema(loginValidationSchema), loginUser);
router.post('/auth/logout', logoutUser);
router.post('/auth/refresh', refreshToken);
router.post('/auth/verify-email', verifyEmail);
router.get('/auth/me', verifyAuth, getCurrentUser);
// Пример защищённого маршрута с CSRF
router.post('/auth/secure-action', verifyAuth, csrfProtection);




module.exports = router;
