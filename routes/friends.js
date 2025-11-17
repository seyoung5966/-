// routes/friends.js
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// ✅ 친구 검색 (이메일로 한 명 찾기)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: '이메일을 입력해주세요.' });
    }

    const user = await User.findOne({ email: email.trim() }).select('name email');

    if (!user) {
      return res.status(404).json({ error: '해당 이메일의 사용자를 찾을 수 없습니다.' });
    }

    // 자기 자신이면 안 됨
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ error: '자기 자신은 친구로 추가할 수 없습니다.' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('Friend search error:', err);
    return res.status(500).json({ error: '서버 에러(친구 검색)' });
  }
});

// ✅ 친구 추가 (상대 userId를 body로 받음)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { friendId } = req.body;
    const myId = req.user.id;

    if (!friendId) {
      return res.status(400).json({ error: 'friendId 가 필요합니다.' });
    }

    if (friendId === myId) {
      return res.status(400).json({ error: '자기 자신은 친구로 추가할 수 없습니다.' });
    }

    const me = await User.findById(myId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다.' });
    }

    const alreadyFriend = me.friends
      .map(id => id.toString())
      .includes(friendId.toString());

    if (alreadyFriend) {
      return res.status(409).json({ error: '이미 친구입니다.' });
    }

    me.friends.push(friendId);
    friend.friends.push(myId);

    await me.save();
    await friend.save();

    const populatedMe = await User.findById(myId).populate('friends', 'name email');

    return res.json({ message: '친구 추가 완료', friends: populatedMe.friends });
  } catch (err) {
    console.error('Friend add error:', err);
    return res.status(500).json({ error: '서버 에러(친구 추가)' });
  }
});

// ✅ 내 친구 목록 불러오기
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate('friends', 'name email');
    return res.json({ friends: me.friends });
  } catch (err) {
    console.error('Friend list error:', err);
    return res.status(500).json({ error: '서버 에러(친구 목록)' });
  }
});

module.exports = router;
