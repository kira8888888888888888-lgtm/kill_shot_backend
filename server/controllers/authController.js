const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');
const loginValidationSchema = require('../validators/loginValidator');
const registerValidationSchema = require('../validators/registerValidator');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const TOKEN_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 30 * 6; // 6 месяцев

// Генерация 6-значного кода
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// REGISTER
exports.registerUser = async (req, res) => {
  const { email_address, registration_password, confirm_password } = req.body;

  try {
    await registerValidationSchema.validate(
      { email_address, registration_password, confirm_password },
      { abortEarly: false }
    );
  } catch (err) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  try {
    const existingUser = await User.findOne({ email_address });
    if (existingUser) return res.status(409).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(registration_password, 12);
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    const newUser = new User({
      email_address,
      registration_password: hashedPassword,
      verificationCode,
      verificationCodeExpiresAt: expiresAt,
      verified: false
    });

    await newUser.save();

    setTimeout(async () => {
      const user = await User.findById(newUser._id);
      if (user && !user.verified) {
        await User.findByIdAndDelete(newUser._id);
        console.log(`Deleted unverified user: ${user.email_address}`);
      }
    }, 10 * 60 * 1000);

    await sendVerificationEmail(email_address, verificationCode);

    return res.status(201).json({ message: 'User registered. Check your email for verification code.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  const { email_address, code } = req.body;

  try {
    const user = await User.findOne({ email_address });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.verified) return res.status(400).json({ error: 'Email already verified' });
    if (user.verificationCode !== code) return res.status(400).json({ error: 'Invalid verification code' });
    if (new Date() > user.verificationCodeExpiresAt) return res.status(400).json({ error: 'Verification code expired' });

    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    return res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  const { email_address, login_password } = req.body;

  try {
    await loginValidationSchema.validate({ email_address, login_password }, { abortEarly: false });
  } catch (err) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  try {
    const user = await User.findOne({ email_address });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.verified) return res.status(403).json({ error: 'Please verify your email before logging in' });

    const isMatch = await bcrypt.compare(login_password, user.registration_password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const accessToken = jwt.sign(
      { id: user._id, email: user.email_address },
      JWT_SECRET,
      { expiresIn: '15m' } // короткий срок жизни
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    res.cookie('token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure:true,
      maxAge: 15 * 60 * 1000, // 15 минут
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure:true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    });

    return res.json({ message: 'Logged in successfully', userId: user._id, userEmail: user.email_address,isAdmin:user.isAdmin});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token provided' });

  try {
    const user = await User.findOne({ refreshToken: token });
    if (!user) return res.status(401).json({ error: 'Invalid refresh token' });

    if (new Date() > user.refreshTokenExpiresAt) {
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;
      await user.save();
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email_address },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    res.cookie('token', newAccessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ message: 'Tokens refreshed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// LOGOUT
exports.logoutUser = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;
      await user.save();
    }
  }

  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.json({ message: 'Logged out successfully' });
};

// AUTH MIDDLEWARE
exports.verifyAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET CURRENT USER
exports.getCurrentUser = (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
};
