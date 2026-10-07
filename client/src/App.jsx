import { useEffect, useMemo, useState } from 'react';

const backendUrl = 'http://localhost:4000';

const roleLabels = {
  applicant: 'متقدم',
  recruitment_specialist: 'أخصائي توظيف',
  supervisor: 'مشرف',
  manager: 'مدير'
};

const happyStatus = {
  pending: 'قيد المراجعة',
  interview: 'تمت المقابلة',
  accepted: 'مقبول',
  rejected: 'مرفوض'
};

const provinces = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'المنوفية', 'الشرقية', 'القليوبية', 'الدقهلية', 'كفر الشيخ',
  'البحيرة', 'الغربية', 'المنيا', 'بني سويف', 'الفيوم', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'السويس', 'البحر الأحمر', 'شمال سيناء', 'جنوب سيناء', 'الوادي الجديد', 'مطروح', 'الإسماعيلية', 'بورسعيد'
];

const defaultJob = {
  title: '',
  province: 'القاهرة',
  type: 'full_time',
  description: '',
  requirements: '',
  closingDate: ''
};

const emptyApplicationForm = {
  fullName: '',
  nationalId: '',
  mobile: '',
  address: '',
  province: 'القاهرة',
  email: '',
  cvUrl: '',
  notes: ''
};

function App() {
  const [mode, setMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('tamweely_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tamweely_user') || 'null');
    } catch {
      return null;
    }
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm);
  const [loginForm, setLoginForm] = useState({ email: 'admin@tamweely.com', password: '123456' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    nationalId: '',
    mobile: '',
    address: '',
    province: 'القاهرة',
    email: '',
    password: '',
    role: 'applicant'
  });
  const [jobForm, setJobForm] = useState(defaultJob);
  const [message, setMessage] = useState('');

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(`${backendUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ');
    }

    return data;
  };

  const loadData = async () => {
    try {
      const [jobsData, dashboardData, appsData] = await Promise.all([
        fetchJson('/api/jobs'),
        fetchJson('/api/dashboard'),
        fetchJson('/api/applications')
      ]);

      setJobs(jobsData);
      setDashboard(dashboardData);
      setApplications(appsData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    loadData();
  }, [token, user]);

  const login = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      localStorage.setItem('tamweely_token', data.token);
      localStorage.setItem('tamweely_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setMessage('تم تسجيل الدخول بنجاح');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm)
      });
      localStorage.setItem('tamweely_token', data.token);
      localStorage.setItem('tamweely_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setMessage('تم إنشاء الحساب بنجاح');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const addJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...jobForm,
        requirements: jobForm.requirements.split(',').map((r) => r.trim()).filter(Boolean)
      };
      const newJob = await fetchJson('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setJobs((prev) => [newJob, ...prev]);
      setJobForm(defaultJob);
      setMessage('تم إضافة الوظيفة بنجاح');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      await fetchJson('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: selectedJob.id,
          province: applicationForm.province || user.province,
          cvUrl: applicationForm.cvUrl || 'https://example.com/cv.pdf',
          notes: applicationForm.notes,
          fullName: applicationForm.fullName || user.fullName,
          nationalId: applicationForm.nationalId || user.nationalId,
          mobile: applicationForm.mobile || user.mobile,
          address: applicationForm.address || user.address,
          email: applicationForm.email || user.email
        })
      });
      setMessage('تم إرسال الطلب بنجاح، وسيصلك تأكيد قريبًا');
      setSelectedJob(null);
      setApplicationForm(emptyApplicationForm);
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateAppStatus = async (applicationId, status) => {
    try {
      await fetchJson(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMessage('تم تحديث حالة الطلب');
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('tamweely_token');
    localStorage.removeItem('tamweely_user');
    setToken('');
    setUser(null);
    setJobs([]);
    setApplications([]);
    setDashboard(null);
    setSelectedJob(null);
  };

  const applicantCards = useMemo(() => {
    if (!applications.length) return [];
    return [
      { title: 'إجمالي الطلبات', value: applications.length },
      { title: 'قيد المراجعة', value: applications.filter((a) => a.status === 'pending').length },
      { title: 'تمت المقابلة', value: applications.filter((a) => a.status === 'interview').length },
      { title: 'مقبول', value: applications.filter((a) => a.status === 'accepted').length }
    ];
  }, [applications]);

  const viewer = useMemo(() => {
    if (!user) return null;

    if (user.role === 'applicant') {
      return (
        <div>
          <div className="cards">
            {applicantCards.map((card) => (
              <div className="card" key={card.title}>
                <h3>{card.title}</h3>
                <div className="stats">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="area-title">الوظائف المتاحة</div>
          <div className="job-grid">
            {jobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-head">
                  <div>
                    <h3>{job.title}</h3>
                    <div className="meta">{job.province} • {job.type === 'full_time' ? 'دوام كامل' : job.type}</div>
                  </div>
                  <span className="status-pill open">مفتوح</span>
                </div>

                <p>{job.description}</p>

                <div className="tags">
                  {(job.requirements || []).map((req) => (
                    <span className="tag" key={req}>{req}</span>
                  ))}
                </div>

                <div className="job-actions">
                  <button className="button primary" onClick={() => setSelectedJob(job)}>عرض التفاصيل</button>
                </div>
              </article>
            ))}
          </div>

          <div className="table-wrap" style={{ marginTop: 30 }}>
            <div className="area-title">طلباتك</div>
            <table className="table">
              <thead>
                <tr>
                  <th>الوظيفة</th>
                  <th>الحالة</th>
                  <th>سبب الرفض</th>
                  <th>تاريخ الإرسال</th>
                </tr>
              </thead>
              <tbody>
                {applications.length ? applications.map((item) => (
                  <tr key={item.id}>
                    <td>{item.jobTitle}</td>
                    <td><span className={`badge ${item.status}`}>{happyStatus[item.status] || item.status}</span></td>
                    <td>{item.rejectionReason || '—'}</td>
                    <td>{new Date(item.submittedAt).toLocaleDateString('ar-EG')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4">لا توجد طلبات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (user.role === 'recruitment_specialist') {
      const provinceApps = applications.filter((app) => app.province === user.province);
      return (
        <div>
          <div className="cards">
            <div className="card"><h3>عدد المتقدمين</h3><div className="stats">{provinceApps.length}</div></div>
            <div className="card"><h3>قيد المراجعة</h3><div className="stats">{provinceApps.filter((a) => a.status === 'pending').length}</div></div>
            <div className="card"><h3>مقبول</h3><div className="stats">{provinceApps.filter((a) => a.status === 'accepted').length}</div></div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الوظيفة</th>
                  <th>المحافظة</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {provinceApps.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fullName || item.applicantId}</td>
                    <td>{item.jobTitle}</td>
                    <td>{item.province}</td>
                    <td><span className={`badge ${item.status}`}>{happyStatus[item.status] || item.status}</span></td>
                    <td>
                      <button className="button secondary" onClick={() => updateAppStatus(item.id, 'interview')}>مقابلة</button>
                      <button className="button primary" onClick={() => updateAppStatus(item.id, 'accepted')} style={{ marginRight: 8 }}>قبول</button>
                      <button className="button danger" onClick={() => updateAppStatus(item.id, 'rejected')} style={{ marginRight: 8 }}>رفض</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (user.role === 'supervisor' || user.role === 'manager') {
      return (
        <div>
          <div className="cards">
            <div className="card"><h3>إجمالي المتقدمين</h3><div className="stats">{dashboard?.totalApplicants || 0}</div></div>
            <div className="card"><h3>الوظائف المفتوحة</h3><div className="stats">{dashboard?.openJobs || 0}</div></div>
            <div className="card"><h3>إجمالي الطلبات</h3><div className="stats">{dashboard?.totalApplications || 0}</div></div>
          </div>

          {user.role === 'manager' && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3>إضافة وظيفة جديدة</h3>
              <form className="form-grid" onSubmit={addJob}>
                <div className="form-grid split-2">
                  <input className="input" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="عنوان الوظيفة" />
                  <select className="select" value={jobForm.province} onChange={(e) => setJobForm({ ...jobForm, province: e.target.value })}>
                    {provinces.map((province) => <option key={province}>{province}</option>)}
                  </select>
                </div>
                <textarea className="textarea" rows={4} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="وصف الوظيفة" />
                <input className="input" value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} placeholder="المتطلبات (افصل بينها بفاصلة)" />
                <button className="button primary">حفظ الوظيفة</button>
              </form>
            </div>
          )}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>الوظيفة</th>
                  <th>المحافظة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id.slice(0, 8)}</td>
                    <td>{item.jobTitle}</td>
                    <td>{item.province}</td>
                    <td><span className={`badge ${item.status}`}>{happyStatus[item.status] || item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  }, [applications, applicantCards, dashboard, jobs, user, jobForm]);

  if (!token || !user) {
    return (
      <div className="app-shell">
        <div className="topbar">
          <div className="brand">
            <span className="logo-circle">T</span>
            Tamweely
          </div>
        </div>

        <div className="auth-box">
          <div className="auth-tabs">
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>تسجيل الدخول</button>
            <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>إنشاء حساب</button>
          </div>

          {mode === 'login' ? (
            <form className="form-grid" onSubmit={login}>
              <input className="input" type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="البريد الإلكتروني" />
              <input className="input" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="كلمة المرور" />
              <button className="button primary">دخول</button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={register}>
              <input className="input" value={registerForm.fullName} onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })} placeholder="الاسم الكامل" />
              <input className="input" value={registerForm.nationalId} onChange={(e) => setRegisterForm({ ...registerForm, nationalId: e.target.value })} placeholder="الرقم القومي" />
              <input className="input" value={registerForm.mobile} onChange={(e) => setRegisterForm({ ...registerForm, mobile: e.target.value })} placeholder="رقم الموبايل" />
              <input className="input" value={registerForm.address} onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })} placeholder="العنوان" />
              <select className="select" value={registerForm.province} onChange={(e) => setRegisterForm({ ...registerForm, province: e.target.value })}>
                {provinces.map((province) => <option key={province}>{province}</option>)}
              </select>
              <input className="input" type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="البريد الإلكتروني" />
              <input className="input" type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="كلمة المرور" />
              <select className="select" value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                <option value="applicant">متقدم</option>
                <option value="recruitment_specialist">أخصائي توظيف</option>
                <option value="supervisor">مشرف</option>
                <option value="manager">مدير</option>
              </select>
              <button className="button primary">إنشاء الحساب</button>
            </form>
          )}

          {message && <p className="note-box">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="logo-circle">T</span>
          Tamweely
        </div>

        <div className="topbar-user">
          <span style={{ fontWeight: 700 }}>مرحباً {user.fullName}</span>
          <span className="badge pending" style={{ background: '#e0f2fe', color: '#0f172a' }}>{roleLabels[user.role]}</span>
          <button className="button secondary" onClick={logout}>تسجيل الخروج</button>
        </div>
      </div>

      <div className="dashboard">
        {dashboard && (
          <div className="cards">
            <div className="card"><h3>إجمالي المتقدمين</h3><div className="stats">{dashboard.totalApplicants || 0}</div></div>
            <div className="card"><h3>الوظائف المفتوحة</h3><div className="stats">{dashboard.openJobs || 0}</div></div>
            <div className="card"><h3>إجمالي الطلبات</h3><div className="stats">{dashboard.totalApplications || 0}</div></div>
          </div>
        )}

        {viewer}
      </div>

      {selectedJob && (
        <div className="modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{selectedJob.title}</h2>
              <button className="button secondary" onClick={() => setSelectedJob(null)}>إغلاق</button>
            </div>

            <p className="meta">{selectedJob.province} • {selectedJob.type === 'full_time' ? 'دوام كامل' : selectedJob.type}</p>
            <p>{selectedJob.description}</p>

            <form className="form-grid" onSubmit={submitApplication}>
              <div className="split-2 form-grid">
                <input className="input" placeholder="الاسم الكامل" value={applicationForm.fullName || user.fullName} onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })} />
                <input className="input" placeholder="الرقم القومي" value={applicationForm.nationalId || user.nationalId} onChange={(e) => setApplicationForm({ ...applicationForm, nationalId: e.target.value })} />
              </div>
              <div className="split-2 form-grid">
                <input className="input" placeholder="رقم الموبايل" value={applicationForm.mobile || user.mobile} onChange={(e) => setApplicationForm({ ...applicationForm, mobile: e.target.value })} />
                <input className="input" placeholder="البريد الإلكتروني" value={applicationForm.email || user.email} onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })} />
              </div>
              <div className="split-2 form-grid">
                <input className="input" placeholder="العنوان" value={applicationForm.address || user.address} onChange={(e) => setApplicationForm({ ...applicationForm, address: e.target.value })} />
                <select className="select" value={applicationForm.province || user.province} onChange={(e) => setApplicationForm({ ...applicationForm, province: e.target.value })}>
                  {provinces.map((province) => <option key={province}>{province}</option>)}
                </select>
              </div>
              <input className="input" placeholder="رابط السيرة الذاتية (اختياري)" value={applicationForm.cvUrl} onChange={(e) => setApplicationForm({ ...applicationForm, cvUrl: e.target.value })} />
              <textarea className="textarea" rows={4} placeholder="ملاحظات إضافية" value={applicationForm.notes} onChange={(e) => setApplicationForm({ ...applicationForm, notes: e.target.value })} />
              <button className="button primary">إرسال الطلب</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
