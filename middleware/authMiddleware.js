const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: '토큰이 없습니다.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: '토큰 포맷이 잘못됐습니다.' });
  }

  const token = parts[1];

  try {
    // ✅ 여기 키를 auth.js 와 똑같이 수정!
    const decoded = jwt.verify(token, 'SUPER_SECRET_KEY_CHANGE_ME'); 
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };
    next();
  } catch (err) {
    console.error('authMiddleware verify error:', err);
    return res.status(401).json({ error: '토큰 검증 실패' });
  }
};
