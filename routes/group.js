// routes/group.js
const express = require('express');
const Group = require('../models/Group');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/*
  그룹 만들기
  POST /api/groups
  header: Authorization: Bearer <토큰>
  body: { "name": "캡스톤 팀" }

  동작:
  - 새 그룹 생성
  - 현재 로그인한 유저를 members[0] 으로 자동 추가
*/
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: '그룹 이름 name 이 필요합니다.' });
    }

    // req.user.id 는 토큰에서 복원된 현재 사용자 id
    const newGroup = await Group.create({
      name,
      members: [req.user.id],
    });

    return res.status(201).json({
      message: '그룹 생성 완료',
      group: {
        id: newGroup._id,
        name: newGroup.name,
        members: newGroup.members,
      },
    });
  } catch (err) {
    console.error('Group create error:', err);
    return res.status(500).json({ error: '서버 에러(그룹 생성)' });
  }
});

/*
  그룹 대시보드
  GET /api/groups/:id/dashboard
  header: Authorization: Bearer <토큰>

  동작:
  - 해당 그룹 정보 조회
  - 멤버들의 기본 정보도 같이 넘겨주기 (populate)
  - 나중에 todo나 공지 같은 것도 여기 묶어서 내려주면 됨
*/
router.get('/:id/dashboard', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;

    // 그룹 + 멤버 정보 같이
    const group = await Group.findById(groupId)
      .populate('members', 'email name'); // User에서 email, name만

    if (!group) {
      return res.status(404).json({ error: '그룹을 찾을 수 없습니다.' });
    }

    // 이 유저가 이 그룹의 멤버인지 검사 (접근권한)
    const isMember = group.members.some(
      (m) => m._id.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: '이 그룹에 접근 권한이 없습니다.' });
    }

    // 대시보드 응답 (지금은 멤버 목록만, 나중에 todo 추가 가능)
    return res.json({
      group: {
        id: group._id,
        name: group.name,
        members: group.members.map(m => ({
          id: m._id,
          email: m.email,
          name: m.name,
        })),
      },
      todos: [], // 추후 추가할 자리
    });
  } catch (err) {
    console.error('Group dashboard error:', err);
    return res.status(500).json({ error: '서버 에러(대시보드)' });
  }
});

module.exports = router;
