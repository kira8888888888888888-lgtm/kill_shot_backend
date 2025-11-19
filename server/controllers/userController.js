const User = require('../models/User');
const axios = require('axios');

const MAX_CLAIMS_PER_DAY = 5;
const CLAIM_PERIOD = 24; // hours
const conversionRates = {
  BTC: 103471,
  ETH: 3485,
  USDT: 1,
  USDC: 1,
};

// 🧩 Проверка статуса
async function getClaimStatus(req, res) {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const lastClaimTime = user.lastClaimTime ? new Date(user.lastClaimTime) : null;
    const hoursSinceLastClaim = lastClaimTime
      ? Math.floor((now - lastClaimTime) / 1000 / 3600)
      : CLAIM_PERIOD;

    // 🕐 Если прошло 24 часа — сбрасываем прогресс
    if (hoursSinceLastClaim >= CLAIM_PERIOD) {
      user.claimCountToday = 0;
      user.completedTasksToday = [];
      await user.save();
    }

    const canClaimReward = user.claimCountToday < MAX_CLAIMS_PER_DAY;

    return res.json({
      canClaimReward,
      remainingClaims: Math.max(MAX_CLAIMS_PER_DAY - user.claimCountToday, 0),
      completedTasks: user.completedTasksToday,
      message: canClaimReward
        ? 'The game will start when the score reaches 100$'
        : 'You have already claimed your rewards 5 times today.',
    });
  } catch (error) {
    console.error('Error checking claim status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// 💰 Получение вознаграждения
async function claimReward(req, res) {
  const userId = req.user.id;
  const { taskId } = req.body;

  if (!taskId)
    return res.status(400).json({ message: 'Task ID is required.' });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const lastClaimTime = user.lastClaimTime ? new Date(user.lastClaimTime) : null;
    const hoursSinceLastClaim = lastClaimTime
      ? Math.floor((now - lastClaimTime) / 1000 / 3600)
      : CLAIM_PERIOD;

    if (hoursSinceLastClaim >= CLAIM_PERIOD) {
      user.claimCountToday = 0;
      user.completedTasksToday = [];
    }

    // 🔒 Проверяем лимиты
    if (user.claimCountToday >= MAX_CLAIMS_PER_DAY) {
      return res.status(400).json({
        message: 'You have already claimed your rewards 5 times today. Try again tomorrow.',
      });
    }

    if (user.completedTasksToday.includes(taskId)) {
      return res.status(400).json({ message: 'This task is already completed today.' });
    }

    // 💵 Рассчитываем вознаграждение
    let totalBalanceInUSD = 0;
    for (const [asset, balance] of Object.entries(user.balances)) {
      const rate = conversionRates[asset] || 0;
      totalBalanceInUSD += balance * rate;
    }

    const reward = totalBalanceInUSD * 0.02; // 2%

    if (reward <= 0)
      return res.status(400).json({ message: 'Insufficient balance to claim reward.' });

    // ➕ Добавляем в баланс
    user.balances['USDT'] = (user.balances['USDT'] || 0) + reward;
    user.claimCountToday += 1;
    user.completedTasksToday.push(taskId);
    user.lastClaimTime = now;
    await user.save();

    return res.json({
      message: `Reward claimed successfully: +$${reward.toFixed(2)} USDT`,
      newBalances: user.balances,
      remainingClaims: MAX_CLAIMS_PER_DAY - user.claimCountToday,
      completedTasks: user.completedTasksToday,
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { getClaimStatus, claimReward };
