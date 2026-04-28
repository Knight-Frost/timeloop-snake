const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    score: { type: Number, required: true, min: 0, default: 0 },
    loops_survived: { type: Number, required: true, min: 0, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  { timestamps: true, versionKey: false }
);

scoreSchema.index({ score: -1 });

const Score = mongoose.model('Score', scoreSchema);
module.exports = { Score };
