require('dotenv').config();
const { randomBytes, timingSafeEqual } = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { rateLimit } = require('express-rate-limit');
const path = require('path');
const Student = require('./models/Student');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
mongoose.set('strictQuery', true);

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusdesk';
const mongoConnection = mongoose.connect(mongoUri);
mongoConnection
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    console.error('Check MONGODB_URI in .env and make sure MongoDB is running.');
  });

const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : randomBytes(64).toString('hex'));
if (!sessionSecret) throw new Error('SESSION_SECRET must be set in production.');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(session({
  name: 'campusdesk.sid',
  secret: sessionSecret,
  store: MongoStore.create({ clientPromise: mongoConnection.then(() => mongoose.connection.getClient()), ttl: 8 * 60 * 60 }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const matchesSecret = (candidate, expected) => {
  if (typeof candidate !== 'string' || typeof expected !== 'string') return false;
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
};

app.get('/api/auth/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session.admin) });
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!matchesSecret(username, process.env.ADMIN_USERNAME) || !matchesSecret(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  req.session.regenerate(err => {
    if (err) return res.status(500).json({ message: 'Could not start an admin session.' });
    req.session.admin = { username: process.env.ADMIN_USERNAME };
    req.session.save(saveError => {
      if (saveError) return res.status(500).json({ message: 'Could not save the admin session.' });
      res.json({ authenticated: true });
    });
  });
});

app.post('/api/auth/logout', (req, res) => {
  if (!req.session) return res.json({ authenticated: false });
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Could not end the admin session.' });
    res.clearCookie('campusdesk.sid', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.json({ authenticated: false });
  });
});

app.use('/api', (req, res, next) => {
  if (req.session.admin) return next();
  res.status(401).json({ message: 'Please log in to access student records.' });
});

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

app.get('/api/students', async (req, res) => {
  try {
    const { search = '', status = 'all', department = 'all', page = 1, limit = 8 } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (department !== 'all') filter.department = department;
    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { studentId: regex }, { firstName: regex }, { lastName: regex },
        { email: regex }, { course: regex }, { department: regex }
      ];
    }
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 8));
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ updatedAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
      Student.countDocuments(filter)
    ]);
    res.json({ students, total, page: safePage, pages: Math.max(1, Math.ceil(total / safeLimit)) });
  } catch (err) {
    res.status(500).json({ message: 'Could not load students.', error: err.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch {
    res.status(400).json({ message: 'Invalid student ID.' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    const duplicate = err.code === 11000;
    res.status(err.name === 'ValidationError' || duplicate ? 400 : 500).json({
      message: duplicate ? `${Object.keys(err.keyPattern || {})[0] || 'This field'} is already in use.` :
        (err.name === 'ValidationError' ? err.message : 'Could not create student.')
    });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (err) {
    const duplicate = err.code === 11000;
    res.status(err.name === 'ValidationError' || duplicate ? 400 : 500).json({
      message: duplicate ? `${Object.keys(err.keyPattern || {})[0] || 'This field'} is already in use.` :
        (err.name === 'ValidationError' ? err.message : 'Could not update student.')
    });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json({ message: 'Student deleted successfully.', id: student._id });
  } catch {
    res.status(400).json({ message: 'Invalid student ID.' });
  }
});

app.get('/api/summary', async (_req, res) => {
  try {
    const [total, active, graduated, onLeave, departments] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Student.countDocuments({ status: 'graduated' }),
      Student.countDocuments({ status: 'on leave' }),
      Student.distinct('department')
    ]);
    res.json({ total, active, graduated, onLeave, departments: departments.length });
  } catch (err) {
    res.status(500).json({ message: 'Could not load summary.', error: err.message });
  }
});

app.get('/api/notifications', async (_req, res) => {
  try {
    const [recentRecords, onLeave, graduated] = await Promise.all([
      Student.find().sort({ updatedAt: -1 }).limit(5)
        .select('firstName lastName department status createdAt updatedAt')
        .lean(),
      Student.countDocuments({ status: 'on leave' }),
      Student.countDocuments({ status: 'graduated' })
    ]);
    res.json({
      recentRecords,
      summary: { onLeave, graduated }
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load notifications.', error: err.message });
  }
});

app.get('/api/reports', async (_req, res) => {
  try {
    const [overviewResult, departmentResult, recentRecords] = await Promise.all([
      Student.aggregate([{ $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        graduated: { $sum: { $cond: [{ $eq: ['$status', 'graduated'] }, 1, 0] } },
        onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on leave'] }, 1, 0] } }
      } }]),
      Student.aggregate([
        { $group: { _id: { $ifNull: ['$department', 'Unassigned'] }, count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ]),
      Student.find().sort({ updatedAt: -1 }).limit(10)
        .select('studentId firstName lastName course department year status')
        .lean()
    ]);
    const departments = departmentResult.map(({ _id, count }) => ({ department: _id, count }));
    res.json({
      overview: { ...(overviewResult[0] || { total: 0, active: 0, graduated: 0, onLeave: 0 }), departments: departments.length },
      departments,
      recentRecords
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load reports.', error: err.message });
  }
});

app.get('/api/departments', async (_req, res) => {
  try {
    res.json(await Student.distinct('department'));
  } catch (err) {
    res.status(500).json({ message: 'Could not load departments.', error: err.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✓ CampusDesk API listening on http://localhost:${PORT}`));