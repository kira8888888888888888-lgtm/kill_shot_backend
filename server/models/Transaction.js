const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true, min: 0.01 }, // сумма должна быть не меньше 0.01
  currency: { 
    type: String, 
    enum: ['USDT', 'ETH', 'BTC', 'USDC', 'DAI'], // Допустимые валюты
    default: 'USDT' 
  },
  status: { type: String, default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  paymentUrl: { type: String, default: null },
});

module.exports = mongoose.model('Transaction', transactionSchema);
