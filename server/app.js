const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler, notFound } = require('./middleware/error');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const adminRoutes = require('./routes/admin');
const amRoutes = require('./routes/am');
const leadRoutes = require('./routes/leads');
const paymentRoutes = require('./routes/payment');
const blogRoutes = require('./routes/blogs');
const investmentRoutes = require('./routes/investments');
const referralRoutes = require('./routes/referral');

/**
 * Builds the Express app WITHOUT connecting to a database or listening on a port, so it can be
 * `require()`d by tests (see test/setupTestDb.js) against an isolated database. `server.js` is
 * the only production entry point and still does both of those; this split changes nothing
 * about production behaviour.
 */
function createApp() {
  const app = express();

  const allowedOrigins = [
    'http://localhost:5173',
    'https://legacy-wealth-mern.vercel.app',
    'https://admin.legacywealth.info',
    process.env.CLIENT_URL
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Legacy Wealth API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/enrollments', enrollmentRoutes);
  // IMPORTANT: /api/admin/am must be mounted BEFORE /api/admin. adminRoutes applies its
  // `admin`-only (role === 'admin') gate to every path under its mount, including
  // /api/admin/am/*, since Express treats /api/admin as a prefix match; mounting the more
  // specific am router first lets its own RBAC (middleware/amAuth.js) run instead, so
  // finance/operations/compliance staff (who may have no `admin` role at all) aren't rejected
  // before their permissions are even checked.
  app.use('/api/admin/am', amRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/blogs', blogRoutes);
  app.use('/api/investments', investmentRoutes);
  app.use('/api/referral', referralRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
