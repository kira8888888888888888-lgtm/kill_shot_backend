const jwt = require('jsonwebtoken');
const { verifyAuth } = require('../middlewares/authMiddleware');

// Middleware для проверки токена и прав администратора
exports.verifyAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Извлекаем токен из заголовков

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Проверка с секретным ключом

    // Если пользователь не администратор, отправляем ошибку
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to view this page' });
    }

    req.user = decoded; // Добавляем данные пользователя в запрос
    next(); // Пропускаем дальше, если все проверки прошли
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
