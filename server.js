const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ 추가
const friendRouter = require('./routes/friends'); // ✅ 추가
const authRouter = require('./routes/auth');
const roomRouter = require('./routes/rooms');
const postRouter = require('./routes/posts');
const chatRouter = require('./routes/chat');

const app = express();

// ✅ CORS 미들웨어 추가
app.use(cors());

// JSON 바디 파싱
app.use(express.json());

// 라우트 연결
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/posts', postRouter);
app.use('/api/friends', friendRouter); // ✅ 추가
app.use('/api/chat', chatRouter);

// DB 연결 & 서버 시작 (너 이미 있는 코드 그대로)
mongoose
  .connect('mongodb://localhost:27017/sidekeep', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(4000, () => {
      console.log('🚀 Server running on http://localhost:4000');
    });
  })
  .catch(err => {
    console.error('MongoDB connect error:', err);
  });
