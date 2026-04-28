const { Router } = require('express');
const { protect } = require('../middleware/protect');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateObjectId } = require('../middleware/validateObjectId');
const { Score } = require('../models/Score');

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const scores = await Score.find()
    .sort({ score: -1 })
    .limit(20)
    .populate('user', 'email')
    .lean();
  res.json(scores);
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const { score, loops_survived } = req.body;
  if (typeof score !== 'number' || typeof loops_survived !== 'number') {
    return res.status(400).json({ error: 'Invalid score data' });
  }
  if (!Number.isFinite(score) || !Number.isFinite(loops_survived)) {
    return res.status(400).json({ error: 'Invalid score data' });
  }
  const newScore = Math.max(0, Math.floor(score));
  const newLoops = Math.max(0, Math.floor(loops_survived));

  // One Score document per user. Keep only the personal best.
  const existing = await Score.findOne({ user: req.user._id }).sort({ score: -1 });

  if (!existing) {
    const entry = await Score.create({
      score: newScore,
      loops_survived: newLoops,
      user: req.user._id
    });
    return res.status(201).json(entry);
  }

  if (newScore > existing.score) {
    existing.score = newScore;
    existing.loops_survived = newLoops;
    await existing.save();
  }

  // Lazy migration: collapse any legacy duplicates into the single PB row.
  await Score.deleteMany({ user: req.user._id, _id: { $ne: existing._id } });

  res.json(existing);
}));

router.delete('/:id', protect, validateObjectId('id'), asyncHandler(async (req, res) => {
  const entry = await Score.findById(req.params.id);
  if (!entry || entry.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ error: 'Score not found' });
  }
  await entry.deleteOne();
  res.json({ message: 'Deleted' });
}));

module.exports = router;
