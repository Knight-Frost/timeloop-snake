require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('./config/db');
const { User } = require('./models/User');
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.get('/api/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    db: states[mongoose.connection.readyState] || 'unknown'
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error(err);
  res.status(err.status || 500).json({
    error: isProd ? 'Server error' : (err.message || 'Server error')
  });
});

const PORT = process.env.PORT || 3000;

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted ${email} to admin`);
    }
    return;
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({ email, password: hash, role: 'admin' });
  console.log(`Admin account created: ${email}`);
}

connectDB()
  .then(seedAdmin)
  .then(() => {
    app.listen(PORT, '127.0.0.1', () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
