// models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // User 모델의 _id 를 참조
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', GroupSchema);
