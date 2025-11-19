const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyAuth } = require('../middlewares/authMiddleware');


// Endpoint to update a withdrawal in the history
// Example route for saving withdrawal history updates
router.put('/admin/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update withdraw history
        user.withdrawHistory = req.body.withdrawHistory;

        await user.save();
        return res.status(200).json(user);  // Return the updated user
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



// API: запрос на вывод
router.post('/withdraw', verifyAuth, async (req, res) => {
  try {
    const { userId, amount, address, currency } = req.body;

    if (!userId || !amount || !address || !currency) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Проверка лимита выводов — не больше 5
    if (user.withdrawHistory.length >= 5) {
      return res.status(400).json({ message: "Withdraw limit reached (max 5 withdrawals allowed)" });
    }

    // Проверка наличия баланса
    const currentBalance = user.balances?.[currency] || 0;

    if (currentBalance < Number(amount)) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Создаём объект для записи в историю
    const withdrawRecord = {
      currency,
      amount: Number(amount),
      address,
      date: new Date(),
    };

    // Добавляем в историю выводов
    user.withdrawHistory.push(withdrawRecord);

    await user.save();

    return res.status(200).json({
      message: "Withdraw request submitted successfully",
      withdraw: withdrawRecord
    });

  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
