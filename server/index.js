require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
const { User } = require('./models/User');
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.set('trust proxy', 1);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (existing.role !== 'admin') {
      await existing.update({ role: 'admin' });
      console.log(`Promoted ${ADMIN_EMAIL} to admin`);
    }
    return;
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({ email: ADMIN_EMAIL, password: hash, role: 'admin' });
  console.log(`Admin account created: ${ADMIN_EMAIL}`);
}

sequelize.sync().then(async () => {
  await seedAdmin();
  app.listen(PORT, '127.0.0.1', () =>
    console.log(`Server running on port ${PORT}`)
  );
}).catch(err => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});
