// routes/posts.js
const express = require('express');
const Post = require('../models/Post');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/*
  권한 체크 유틸:
  - 이 유저가 이 방(roomId)의 멤버인지 확인
*/
async function isMember(userId, roomId) {
  const room = await Room.findById(roomId);
  if (!room) return false;
  return room.members.map(id => id.toString()).includes(userId.toString());
}

/*
  POST /api/posts
  body: {
    "roomId": "방아이디",
    "imageUrl": "https://example.com/cute.jpg",
    "caption": "라영이랑 밥먹는중 ㅎㅎ"
  }
  동작:
  - 이 방 멤버만 글을 올릴 수 있음
*/
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { roomId, imageUrl, caption } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId 가 필요합니다.' });
    }

    // 방 멤버인지 확인
    const allowed = await isMember(req.user.id, roomId);
    if (!allowed) {
      return res.status(403).json({ error: '이 방에 글을 올릴 권한이 없습니다.' });
    }

    const newPost = await Post.create({
      roomId,
      author: req.user.id,
      imageUrl: imageUrl || '',
      caption: caption || '',
      likes: [],
      comments: [],
    });

    const populated = await Post.findById(newPost._id)
      .populate('author', 'name nickname email')
      .populate('likes', 'name nickname email')
      .populate('comments.user', 'name nickname email');

    return res.status(201).json({
      message: '게시글 업로드 완료',
      post: populated,
    });
  } catch (err) {
    console.error('Post create error:', err);
    return res.status(500).json({ error: '서버 에러(게시글 생성)' });
  }
});

/*
  GET /api/posts/room/:roomId
  동작:
  - 그 방의 피드를 불러옴 (최신순)
  - 이 방 멤버만 볼 수 있음
*/
router.get('/room/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const allowed = await isMember(req.user.id, roomId);
    if (!allowed) {
      return res.status(403).json({ error: '이 방의 피드를 볼 권한이 없습니다.' });
    }

    const feed = await Post.find({ roomId })
      .sort({ createdAt: -1 })
      .populate('author', 'name nickname email')
      .populate('likes', 'name nickname email')
      .populate('comments.user', 'name nickname email');

    return res.json({ feed });
  } catch (err) {
    console.error('Feed load error:', err);
    return res.status(500).json({ error: '서버 에러(피드 로드)' });
  }
});

/*
  POST /api/posts/:postId/like
  동작:
  - 좋아요 토글 (이미 눌렀으면 취소, 아니면 추가)
  - 이 포스트가 있는 방의 멤버만 가능
*/
router.post('/:postId/like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const allowed = await isMember(req.user.id, post.roomId);
    if (!allowed) {
      return res.status(403).json({ error: '이 방에 접근 권한이 없습니다.' });
    }

    const already = post.likes
      .map(id => id.toString())
      .includes(req.user.id.toString());

    if (already) {
      // 좋아요 취소
      post.likes = post.likes.filter(
        id => id.toString() !== req.user.id.toString()
      );
    } else {
      // 좋아요 추가
      post.likes.push(req.user.id);
    }

    await post.save();

    const populated = await Post.findById(postId)
      .populate('author', 'name nickname email')
      .populate('likes', 'name nickname email')
      .populate('comments.user', 'name nickname email');

    return res.json({
      message: 'like 상태 변경 완료',
      post: populated,
    });
  } catch (err) {
    console.error('Like error:', err);
    return res.status(500).json({ error: '서버 에러(좋아요)' });
  }
});

/*
  POST /api/posts/:postId/comment
  body: { "text": "ㅋㅋㅋ 뭐야 이사진" }
  동작:
  - 댓글 추가
  - 이 포스트 방 멤버만 가능
*/
router.post('/:postId/comment', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text(댓글 내용)가 필요합니다.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const allowed = await isMember(req.user.id, post.roomId);
    if (!allowed) {
      return res.status(403).json({ error: '이 방에 접근 권한이 없습니다.' });
    }

    post.comments.push({
      user: req.user.id,
      text,
    });

    await post.save();

    const populated = await Post.findById(postId)
      .populate('author', 'name nickname email')
      .populate('likes', 'name nickname email')
      .populate('comments.user', 'name nickname email');

    return res.json({
      message: '댓글 추가 완료',
      post: populated,
    });
  } catch (err) {
    console.error('Comment error:', err);
    return res.status(500).json({ error: '서버 에러(댓글)' });
  }
});

module.exports = router;
