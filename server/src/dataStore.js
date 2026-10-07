const provinces = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'المنوفية', 'الشرقية', 'القليوبية', 'الدقهلية', 'كفر الشيخ',
  'البحيرة', 'الغربية', 'المنيا', 'بني سويف', 'الفيوم', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'السويس', 'البحر الأحمر', 'شمال سيناء', 'جنوب سيناء', 'الوادي الجديد', 'مطروح', 'الإسماعيلية', 'بورسعيد'
];

const users = [
  {
    id: 'admin-1',
    fullName: 'مدير النظام',
    nationalId: '12345678901234',
    mobile: '01000000000',
    address: 'القاهرة',
    province: 'القاهرة',
    email: 'admin@tamweely.com',
    password: '$2a$10$L1aXQHIfT9d8m7lH8dMCKOCvR/9mYQnSLg5bF0UaeR3ll0jF0b2z6',
    role: 'manager',
    createdAt: new Date().toISOString()
  },
  {
    id: 'supervisor-1',
    fullName: 'المشرف الرئيسي',
    nationalId: '23456789012345',
    mobile: '01111111111',
    address: 'الجيزة',
    province: 'الجيزة',
    email: 'supervisor@tamweely.com',
    password: '$2a$10$L1aXQHIfT9d8m7lH8dMCKOCvR/9mYQnSLg5bF0UaeR3ll0jF0b2z6',
    role: 'supervisor',
    createdAt: new Date().toISOString()
  },
  {
    id: 'recruiter-1',
    fullName: 'أخصائي التوظيف',
    nationalId: '34567890123456',
    mobile: '01222222222',
    address: 'القاهرة',
    province: 'القاهرة',
    email: 'recruiter@tamweely.com',
    password: '$2a$10$L1aXQHIfT9d8m7lH8dMCKOCvR/9mYQnSLg5bF0UaeR3ll0jF0b2z6',
    role: 'recruitment_specialist',
    createdAt: new Date().toISOString()
  },
  {
    id: 'applicant-1',
    fullName: 'المتقدم الأول',
    nationalId: '45678901234567',
    mobile: '01555555555',
    address: 'القاهرة',
    province: 'القاهرة',
    email: 'applicant@tamweely.com',
    password: '$2a$10$L1aXQHIfT9d8m7lH8dMCKOCvR/9mYQnSLg5bF0UaeR3ll0jF0b2z6',
    role: 'applicant',
    createdAt: new Date().toISOString()
  }
];

const jobs = [
  {
    id: 'job-1',
    title: 'مساعد موظف شؤون موظفين',
    province: 'القاهرة',
    type: 'full_time',
    description: 'العمل في متابعة ملف المتقدمين وإدارة الطلبات.',
    requirements: ['خبرة 1-2 سنة', 'إجادة الحاسب', 'التعامل مع الملفات'],
    closingDate: '2026-12-31',
    status: 'open',
    createdAt: new Date().toISOString()
  },
  {
    id: 'job-2',
    title: 'مندوب مبيعات',
    province: 'الجيزة',
    type: 'full_time',
    description: 'تسويق الخدمات ورفع معدلات المبيعات.',
    requirements: ['خبرة في المبيعات', 'مهارات اتصال'],
    closingDate: '2026-11-20',
    status: 'open',
    createdAt: new Date().toISOString()
  },
  {
    id: 'job-3',
    title: 'مسؤول خدمة عملاء',
    province: 'الإسكندرية',
    type: 'full_time',
    description: 'متابعة شكاوى العملاء وتقديم الدعم.',
    requirements: ['مهارات تواصل ممتازة', 'مستوى جيد باللغة العربية'],
    closingDate: '2026-10-30',
    status: 'open',
    createdAt: new Date().toISOString()
  }
];

const applications = [
  {
    id: 'app-1',
    applicantId: 'applicant-1',
    jobId: 'job-1',
    jobTitle: 'مساعد موظف شؤون موظفين',
    province: 'القاهرة',
    cvUrl: 'https://example.com/cv1.pdf',
    notes: 'أرغب في العمل في التوظيف والملفات.',
    status: 'pending',
    rejectionReason: '',
    interviewDate: '',
    submittedAt: new Date().toISOString()
  }
];

export function seedData() {
  if (users.length === 0) {
    users.push(...[]);
  }
  if (jobs.length === 0) {
    jobs.push(...[]);
  }
  if (applications.length === 0) {
    applications.push(...[]);
  }
}

export { provinces, users, jobs, applications };

export function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  return users.find((user) => user.id === id);
}

export function getUserWithPrivateData(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function addJob(job) {
  jobs.push(job);
  return job;
}

export function addApplication(application) {
  applications.push(application);
  return application;
}

export function updateApplicationStatus(id, updates) {
  const appIndex = applications.findIndex((app) => app.id === id);
  if (appIndex === -1) return null;

  applications[appIndex] = { ...applications[appIndex], ...updates };
  return applications[appIndex];
}

export function getDashboardSummary(user) {
  const allApps = applications;
  const totalApplicants = users.filter((u) => u.role === 'applicant').length;

  const byStatus = {
    pending: allApps.filter((app) => app.status === 'pending').length,
    interview: allApps.filter((app) => app.status === 'interview').length,
    accepted: allApps.filter((app) => app.status === 'accepted').length,
    rejected: allApps.filter((app) => app.status === 'rejected').length
  };

  const summary = {
    totalApplicants,
    openJobs: jobs.filter((job) => job.status === 'open').length,
    totalApplications: allApps.length,
    byStatus,
    userRole: user.role,
    province: user.province
  };

  return summary;
}
