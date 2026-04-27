const { Router } = require('express');
const { protect } = require('../middleware/protect');
const { requireRole } = require('../middleware/requireRole');
const { User } = require('../models/User');
const { Score } = require('../models/Score');

const router = Router();

router.use(protect, requireRole('admin'));

router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'role', 'createdAt'] });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/scores/:id', async (req, res) => {
  try {
    const entry = await Score.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Score not found' });
    await entry.destroy();
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
