// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ✅ 방장
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ✅ 초대된 멤버들
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
