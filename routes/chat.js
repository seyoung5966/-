// routes/chat.js
const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 방 멤버인지 확인
async function isMember(userId, roomId) {
  const room = await Room.findById(roomId);
  if (!room) return false;
  return room.members.map(id => id.toString()).includes(userId.toString());
}

/*
  GET /api/chat/:roomId
  - 해당 방 채팅 메시지 최근 50개
*/
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const allowed = await isMember(req.user.id, roomId);
    if (!allowed) {
      return res.status(403).json({ error: '이 방 채팅을 볼 권한이 없습니다.' });
    }

    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(50)
      .populate('user', 'name email');

    return res.json({ messages });
  } catch (err) {
    console.error('Chat list error:', err);
    return res.status(500).json({ error: '서버 에러(채팅 목록)' });
  }
});

/*
  POST /api/chat/:roomId
  body: { text }
*/
router.post('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '메시지 내용을 입력해주세요.' });
    }

    const allowed = await isMember(req.user.id, roomId);
    if (!allowed) {
      return res.status(403).json({ error: '이 방에 메시지를 보낼 권한이 없습니다.' });
    }

    const message = await Message.create({
      roomId,
      user: req.user.id,
      text: text.trim(),
    });

    const populated = await message.populate('user', 'name email');

    return res.json({
      message: '메시지 전송 완료',
      data: populated,
    });
  } catch (err) {
    console.error('Chat send error:', err);
    return res.status(500).json({ error: '서버 에러(채팅 전송)' });
  }
});

module.exports = router;
