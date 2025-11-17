// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// 디버그 라우트
router.get('/debug', (req, res) => {
  res.json({ ok: true, route: 'auth router is mounted' });
});

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, name 은 필수입니다.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: '이미 가입된 이메일입니다.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      email,
      passwordHash,
      name,
    });

    return res.status(201).json({
      message: '회원가입 완료',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: '서버 에러(회원가입)' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email, password 는 필수입니다.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
      },
      'SUPER_SECRET_KEY_CHANGE_ME',
      { expiresIn: '12h' }
    );

    return res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: '서버 에러(로그인)' });
  }
});

// 👇 라우트 목록을 서버 부팅 시 콘솔에 뿌린다
router.stack.forEach((layer, idx) => {
  if (layer.route && layer.route.path) {
    console.log('📡 AUTH ROUTE', idx, layer.route.stack[0].method.toUpperCase(), layer.route.path);
  }
});

module.exports = router;
