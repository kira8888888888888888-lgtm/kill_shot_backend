const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  email_address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  registration_password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    default: null,
  },
  verificationCodeExpiresAt: {
    type: Date,
    default: null,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  refreshTokenExpiresAt: {
    type: Date,
    default: null,
  },
  balances: {
    USDT: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 },
    BTC: { type: Number, default: 0 },
    USDC: { type: Number, default: 0 },
    DAI: { type: Number, default: 0 },
  },
  binanceCodes: [{ type: String,default:null}],
  message: {
    type: String,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  adminPassword: {
    type: String,
  },
  withdrawHistory: [{
    address: String,
    amount: Number,
    currency: String,
    date: { type: Date, default: Date.now },
  }],
  // Новые поля для обработки вознаграждений
  lastClaimTime: {
    type: Date,
    default: null,
  },
  invitedFriends: [String],
  claimCountToday: {
    type: Number,
    default: 0,
  },
  completedTasksToday: { type: [Number], default: [] },

}, { timestamps: true });

// Remove MongoDB _id and password fields from JSON responses
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.registration_password, ret.adminPassword;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
