// routes/rooms.js
const express = require('express');
const Room = require('../models/Room');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// ✅ 방 생성
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, memberIds } = req.body;

    const room = await Room.create({
      name,
      owner: req.user.id,
      members: [req.user.id, ...(memberIds || [])],
    });

    return res.status(201).json({ message: '방 생성 완료', room });
  } catch (err) {
    console.error('Room create error:', err);
    return res.status(500).json({ error: '서버 에러(방 생성)' });
  }
});

// ✅ 친구 초대
router.post('/:roomId/invite', authMiddleware, async (req, res) => {
  try {
    const { friendId } = req.body;
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: '방을 찾을 수 없습니다.' });

    // 방장 또는 이미 멤버인지 확인
    if (!room.owner.equals(req.user.id) && !room.members.includes(req.user.id)) {
      return res.status(403).json({ error: '이 방에 초대할 권한이 없습니다.' });
    }

    // 이미 초대된 경우
    if (room.members.includes(friendId)) {
      return res.status(409).json({ error: '이미 멤버입니다.' });
    }

    room.members.push(friendId);
    await room.save();

    return res.json({ message: '초대 완료', room });
  } catch (err) {
    console.error('Invite error:', err);
    return res.status(500).json({ error: '서버 에러(초대)' });
  }
});

// ✅ 내 방 목록 보기
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id })
      .populate('owner', 'name email')
      .populate('members', 'name email');
    return res.json({ rooms });
  } catch (err) {
    console.error('My rooms error:', err);
    return res.status(500).json({ error: '서버 에러(내 방 목록)' });
  }
});

module.exports = router;
