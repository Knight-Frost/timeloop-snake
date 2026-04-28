const { Router } = require('express');
const { protect } = require('../middleware/protect');
const { requireRole } = require('../middleware/requireRole');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateObjectId } = require('../middleware/validateObjectId');
const { User } = require('../models/User');
const { Score } = require('../models/Score');

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/users', asyncHandler(async (_req, res) => {
  const users = await User.find().select('email role createdAt').lean();
  res.json(users);
}));

router.delete('/users/:id', validateObjectId('id'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.deleteOne();
  res.json({ message: 'Deleted' });
}));

router.delete('/scores/:id', validateObjectId('id'), asyncHandler(async (req, res) => {
  const entry = await Score.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Score not found' });
  await entry.deleteOne();
  res.json({ message: 'Deleted' });
}));

module.exports = router;
