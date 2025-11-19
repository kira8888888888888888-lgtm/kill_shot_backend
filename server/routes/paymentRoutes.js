const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const { verifyAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/user/balance', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ balance: user.balances,userId:user._id });
  } catch (err) {
    console.error('Ошибка при получении баланса:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/save-binance-code', verifyAuth, async (req, res) => {
  const { userId, binanceCode } = req.body;

  try {
    // Находим пользователя по userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Проверяем, если такой код уже существует в массиве binanceCodes
    if (user.binanceCodes.includes(binanceCode)) {
      return res.status(400).json({ message: 'Binance code already exists' });
    }

    // Если кода еще нет, добавляем его
    user.binanceCodes.push(binanceCode);

    // Сохраняем изменения в базе данных
    await user.save();

    return res.status(200).json({ message: 'Binance code saved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error saving Binance code', error });
  }
});



module.exports = router;
