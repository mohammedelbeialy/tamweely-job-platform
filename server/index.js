import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  provinces,
  users,
  jobs,
  applications,
  seedData,
  findUserByEmail,
  findUserById,
  getUserWithPrivateData,
  getDashboardSummary,
  addApplication,
  addJob,
  updateApplicationStatus
} from './src/dataStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'tamweely_super_secret_key';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

const createToken = (user) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'غير مصرح لك بالدخول' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'رمز الدخول غير صالح' });
  }
};

const roleMiddleware = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة' });
  }

  next();
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Tamweely Job Platform' });
});

app.get('/api/provinces', (req, res) => {
  res.json(provinces);
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, nationalId, mobile, address, province, email, password, role = 'applicant' } = req.body;

    if (!fullName || !nationalId || !mobile || !address || !province || !email || !password) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ message: 'هذا البريد مستخدم سابقًا' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      fullName,
      nationalId,
      mobile,
      address,
      province,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    const token = createToken(newUser);
    res.status(201).json({
      token,
      user: getUserWithPrivateData(newUser)
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
    }

    const token = createToken(user);
    res.json({ token, user: getUserWithPrivateData(user) });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: getUserWithPrivateData(req.user) });
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.post('/api/jobs', authMiddleware, roleMiddleware('manager', 'supervisor', 'recruitment_specialist'), (req, res) => {
  const { title, province, type, description, requirements, closingDate } = req.body;

  if (!title || !province || !type || !description) {
    return res.status(400).json({ message: 'بيانات الوظيفة غير مكتملة' });
  }

  const job = addJob({
    id: crypto.randomUUID(),
    title,
    province,
    type,
    description,
    requirements: requirements || [],
    closingDate: closingDate || new Date().toISOString(),
    status: 'open',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(job);
});

app.get('/api/applications', authMiddleware, (req, res) => {
  if (req.user.role === 'applicant') {
    return res.json(applications.filter((app) => app.applicantId === req.user.id));
  }

  if (req.user.role === 'recruitment_specialist') {
    return res.json(applications.filter((app) => app.province === req.user.province));
  }

  res.json(applications);
});

app.post('/api/applications', authMiddleware, roleMiddleware('applicant'), (req, res) => {
  const { jobId, cvUrl, notes, province } = req.body;
  const targetJob = jobs.find((job) => job.id === jobId);

  if (!targetJob) {
    return res.status(404).json({ message: 'الوظيفة غير موجودة' });
  }

  const application = addApplication({
    id: crypto.randomUUID(),
    applicantId: req.user.id,
    jobId,
    jobTitle: targetJob.title,
    province: province || req.user.province,
    cvUrl: cvUrl || '',
    notes: notes || '',
    status: 'pending',
    rejectionReason: '',
    interviewDate: '',
    submittedAt: new Date().toISOString()
  });

  res.status(201).json(application);
});

app.patch('/api/applications/:id/status', authMiddleware, roleMiddleware('recruitment_specialist', 'supervisor', 'manager'), (req, res) => {
  const { status, rejectionReason, interviewDate } = req.body;
  const application = updateApplicationStatus(req.params.id, { status, rejectionReason, interviewDate });

  if (!application) {
    return res.status(404).json({ message: 'التقديم غير موجود' });
  }

  res.json(application);
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  const summary = getDashboardSummary(req.user);
  res.json(summary);
});

seedData();

app.listen(PORT, () => {
  console.log(`Tamweely server running on http://localhost:${PORT}`);
});
