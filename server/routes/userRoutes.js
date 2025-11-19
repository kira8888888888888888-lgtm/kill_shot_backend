const { getClaimStatus, claimReward } = require('../controllers/userController');
const express = require('express');
const User = require('../models/User'); // Подключаем модель User
const { verifyAuth } = require('../middlewares/authMiddleware');
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: true });

const router = express.Router();
// Получить статус вознаграждения (можно ли забрать 2%)
router.get('/claim-status', verifyAuth, getClaimStatus);

// Маршрут для добавления друга
router.post('/invite-friend', verifyAuth, async (req, res) => {
  try {
    const { currentUserId, friendId } = req.body;

    // Находим текущего пользователя
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Проверяем, не добавил ли этот пользователь больше 10 друзей
    if (currentUser.invitedFriends.length >= 10) {
      return res.status(400).json({ message: 'You can only invite up to 10 friends' });
    }

    // Проверяем, не добавлен ли этот друг уже в список приглашенных
    if (currentUser.invitedFriends.includes(friendId)) {
      return res.status(400).json({ message: 'This friend is already invited' });
    }

    // Добавляем нового друга в массив invitedFriends
    currentUser.invitedFriends.push(friendId);

    // Сохраняем изменения в базе данных
    await currentUser.save();

    // Отправляем успешный ответ
    res.status(200).json({
      message: 'Friend ID Saved Successfully',
      currentUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Получить вознаграждение (2% от баланса)
router.post('/claim-reward', verifyAuth, claimReward);

module.exports = router;
