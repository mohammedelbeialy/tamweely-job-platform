import { useEffect, useMemo, useState } from 'react';

const backendUrl = 'http://localhost:4000';

const roleLabels = {
  applicant: 'متقدم',
  recruitment_specialist: 'أخصائي توظيف',
  supervisor: 'مشرف',
  manager: 'مدير'
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

function App() {
  const [mode, setMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('tamweely_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('tamweely_user') || 'null'));
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dashboard, setDashboard] = useState(null);
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

  const submitApplication = async (jobId) => {
    try {
      await fetchJson('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId,
          cvUrl: 'https://example.com/cv.pdf',
          notes: 'أرغب في التقديم على هذه الوظيفة',
          province: user.province
        })
      });
      setMessage('تم إرسال الطلب بنجاح');
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
  };

  const roleView = useMemo(() => {
    if (!user) return null;

    switch (user.role) {
      case 'applicant':
        return (
          <div>
            <div className="cards">
              <div className="card">
                <h3>إجمالي الطلبات</h3>
                <div className="stats">{applications.length}</div>
              </div>
              <div className="card">
                <h3>قيد المراجعة</h3>
                <div className="stats">{applications.filter((a) => a.status === 'pending').length}</div>
              </div>
              <div className="card">
                <h3>تمت المقابلة</h3>
                <div className="stats">{applications.filter((a) => a.status === 'interview').length}</div>
              </div>
            </div>

            <div className="job-grid">
              {jobs.map((job) => (
                <div className="job-card" key={job.id}>
                  <h3>{job.title}</h3>
                  <div className="meta">{job.province} • {job.type === 'full_time' ? 'دوام كامل' : job.type}</div>
                  <p>{job.description}</p>
                  <div className="tags">
                    {job.requirements?.map((r) => <span className="tag" key={r}>{r}</span>)}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button className="button primary" onClick={() => submitApplication(job.id)}>قدّم الآن</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'recruitment_specialist':
        return (
          <div>
            <div className="cards">
              <div className="card"><h3>طلبات المحافظة</h3><div className="stats">{applications.filter((a) => a.province === user.province).length}</div></div>
              <div className="card"><h3>قيد المراجعة</h3><div className="stats">{applications.filter((a) => a.province === user.province && a.status === 'pending').length}</div></div>
              <div className="card"><h3>للمقابلة</h3><div className="stats">{applications.filter((a) => a.province === user.province && a.status === 'interview').length}</div></div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>المتقدم</th>
                    <th>الوظيفة</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.filter((a) => a.province === user.province).map((item) => (
                    <tr key={item.id}>
                      <td>{item.applicantId}</td>
                      <td>{item.jobTitle}</td>
                      <td><span className={`badge ${item.status}`}>{item.status}</span></td>
                      <td>
                        <button className="button secondary" onClick={() => updateAppStatus(item.id, 'interview')}>تحديد مقابلة</button>
                        <button className="button primary" style={{ marginRight: 8 }} onClick={() => updateAppStatus(item.id, 'accepted')}>قبول</button>
                        <button className="button" style={{ marginRight: 8, background: '#fee2e2', color: '#b91c1c' }} onClick={() => updateAppStatus(item.id, 'rejected')}>رفض</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'supervisor':
      case 'manager':
        return (
          <div>
            <div className="cards">
              <div className="card"><h3>إجمالي المتقدمين</h3><div className="stats">{dashboard?.totalApplicants || 0}</div></div>
              <div className="card"><h3>الوظائف المفتوحة</h3><div className="stats">{dashboard?.openJobs || 0}</div></div>
              <div className="card"><h3>الطلبات</h3><div className="stats">{dashboard?.totalApplications || 0}</div></div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3>إضافة وظيفة جديدة</h3>
              <form className="form-grid" onSubmit={addJob}>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
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
                      <td>{item.id}</td>
                      <td>{item.jobTitle}</td>
                      <td>{item.province}</td>
                      <td><span className={`badge ${item.status}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [applications, dashboard, jobs, user]);

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

          {message && <p style={{ marginTop: 16, color: '#0a1f3d', fontWeight: 600 }}>{message}</p>}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

        {roleView}
      </div>
    </div>
  );
}

export default App;
