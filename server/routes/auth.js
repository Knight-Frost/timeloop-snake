const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();

const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72; // bcrypt truncates beyond 72 bytes

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  if (!email.trim() || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return res.status(400).json({ error: `Email and password (${PASSWORD_MIN}-${PASSWORD_MAX} chars) required` });
  }
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(400).json({ error: 'Email already in use' });

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email: normalizedEmail, password: hash });
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { _id: user._id, email: user.email, role: user.role } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  if (password.length > PASSWORD_MAX) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { _id: user._id, email: user.email, role: user.role } });
}));

module.exports = router;
