const { Router } = require('express');
const { protect } = require('../middleware/protect');
const { Score } = require('../models/Score');
const { User } = require('../models/User');

const router = Router();

// Public leaderboard
router.get('/', async (req, res) => {
  try {
    const scores = await Score.findAll({
      include: [{ model: User, as: 'user', attributes: ['email'] }],
      order: [['score', 'DESC']],
      limit: 20
    });
    res.json(scores);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit a score (protected)
router.post('/', protect, async (req, res) => {
  // Destructure only the intended fields - never pass full req.body
  const { score, loops_survived } = req.body;

  if (typeof score !== 'number' || typeof loops_survived !== 'number') {
    return res.status(400).json({ error: 'Invalid score data' });
  }

  try {
    const entry = await Score.create({
      score: Math.max(0, Math.floor(score)),
      loops_survived: Math.max(0, Math.floor(loops_survived)),
      userId: req.user.id
    });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete own score (ownership enforced)
router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await Score.findByPk(req.params.id);
    // Return 404 whether it doesn't exist or isn't owned - prevents enumeration
    if (!entry || entry.userId !== req.user.id) {
      return res.status(404).json({ error: 'Score not found' });
    }
    await entry.destroy();
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
