// routes/adminRoutes.js
const express = require('express');
const User = require('../models/User'); // Подключаем модель User
const { verifyAuth } = require('../middlewares/authMiddleware');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const {verifyAdmin} = require('../middlewares/verifyAdminMiddleware') 


// API для получения всех пользователей
router.get('/users',verifyAdmin, async (req, res) => {
  try {
    const users = await User.find(); // Получаем всех пользователей из базы
    res.json(users); // Отправляем их клиенту
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API для создания нового пользователя
router.post('/users',verifyAdmin, async (req, res) => {
  const newUser = new User(req.body); // Создаем нового пользователя из данных запроса
  try {
    const savedUser = await newUser.save(); // Сохраняем его в базе
    res.status(201).json(savedUser); // Отправляем созданного пользователя клиенту
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// API для удаления пользователя из invitedFriends
router.put('/removeFriend/:userId', verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { friendId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Убираем friendId из массива invitedFriends
    user.invitedFriends = user.invitedFriends.filter(friend => friend !== friendId);
    await user.save(); // Сохраняем изменения

    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// API для удаления вывода пользователя
router.delete('/withdraw/:userId/:withdrawId', verifyAdmin, async (req, res) => {
  const { userId, withdrawId } = req.params;

  try {
    // Находим пользователя по ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ищем индекс записи вывода
    const withdrawIndex = user.withdrawHistory.findIndex(w => w._id.toString() === withdrawId);
    if (withdrawIndex === -1) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    // Удаляем запись о выводе
    user.withdrawHistory.splice(withdrawIndex, 1);
    await user.save(); // Сохраняем изменения в базе данных

    res.status(200).json({ message: 'Withdrawal deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// API для обновления пользователя
router.put('/users/:id',verifyAdmin, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Обновляем пользователя
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' }); // Если пользователь не найден, возвращаем ошибку
    }
    res.json(updatedUser); // Отправляем обновленного пользователя
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// API для получения сообщения для пользователя
router.get('/getMessage/:userId',verifyAuth, async (req, res) => {
  const { userId } = req.params;
  try {
      console.log(userId)
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: user.message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get message' });
  }
});

// routes/adminRoutes.js
router.delete('/deleteMessage', verifyAuth, async (req, res) => {
    const { userId, message } = req.body;

    // Проверяем, что сообщение существует и принадлежит текущему пользователю
    if (req.user.id !== userId) {
        return res.status(403).json({ message: "You are not authorized to delete this message." });
    }

    try {
        // Здесь мы ищем сообщение по тексту, принадлежащему пользователю
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Удаляем сообщение, если оно существует
        if (user.message === message) {
            user.message = ''; // Очистить поле сообщения
            await user.save(); // Сохраняем изменения
        }

        return res.status(200).json({ message: "Message deleted successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error." });
    }
});



// API для отправки сообщения
router.post('/sendMessage',verifyAdmin, async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'User ID and message are required' });
  }

  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновляем поле message для этого пользователя
    user.message = message;
    await user.save();

    res.status(200).json({ success: 'Message sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// API для удаления пользователя
router.delete('/users/:id',verifyAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id); // Удаляем пользователя по ID
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' }); // Отправляем сообщение об удалении
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// API для обновления пароля администратора
router.put('/updateAdminPassword',verifyAdmin, async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }
  
  try {
    // Находим пользователя по ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем, является ли пользователь администратором
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Not an admin user' });
    }
    
    // Хэшируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Обновляем пароль и сохраняем
    user.adminPassword = hashedPassword;
    console.log(hashedPassword)
    await user.save();

    res.status(200).json({ message: 'Admin password updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// API для админского логина с авто-созданием админа
router.post('/login', async (req, res) => {
  const { email_address, adminPassword } = req.body;
  const SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'my_super_secret_key';
  const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

  if (!email_address || !adminPassword) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let admin = await User.findOne({ email_address });

if (!admin) {
  // создаём нового администратора
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  admin = new User({
    email_address,
    isAdmin: true,
    adminPassword: hashedPassword,
  });
  await admin.save();
} else {
  // обновляем существующего пользователя до админа
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  admin.isAdmin = true;
  admin.adminPassword = hashedPassword;
  await admin.save();
}


    // Генерируем JWT
    const token = jwt.sign(
      { id: admin._id, email_address: admin.email_address, isAdmin: admin.isAdmin },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// API для удаления Binance Code у пользователя
router.put('/removeBinanceCode/:userId', verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { binanceCode } = req.body;

  if (!binanceCode) {
    return res.status(400).json({ message: 'Binance Code is required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Убираем Binance Code из массива
    user.binanceCodes = user.binanceCodes.filter(code => code !== binanceCode);
    await user.save(); // Сохраняем изменения в базе

    res.status(200).json({ message: 'Binance Code removed successfully', binanceCodes: user.binanceCodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
