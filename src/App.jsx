import React, { useCallback, useEffect, useState } from 'react';
import welcomePortrait from '../Image/placeholder.jpg';
import {
  Activity, ArrowLeft, ArrowRight, Bell, BookOpen, Building2, CalendarDays, Check,
  ChevronDown, CircleHelp, ClipboardList, Download, Ellipsis, GraduationCap,
  LayoutDashboard, LoaderCircle, LogIn, LogOut, Mail, Menu, Plus, Search, SlidersHorizontal,
  Sparkles, Trash2, Users, X, Pencil, Phone, Hash, Clock3, UserRound
} from 'lucide-react';

const API = '/api';
const palettes = ['#e5e8fc', '#fbe8dc', '#dff3e8', '#f8e7f0', '#dceef7', '#f6efcf', '#e9e1fb'];
const initials = s => (s || '').trim().split(/\s+/).slice(0, 2).map(v => v[0]).join('').toUpperCase() || '?';
const fullName = s => `${s.firstName || ''} ${s.lastName || ''}`.trim();
const api = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('campusdesk:unauthorized'));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
};
const blank = { studentId: '', firstName: '', lastName: '', email: '', phone: '', course: '', department: '', year: 'Year 1', status: 'active', gpa: '0', enrollmentDate: new Date().toISOString().slice(0, 10), notes: '' };
const programsByDepartment = {
  Computing: ['Bachelor of Information Technology', 'Bachelor of Science in Computer Science', 'Bachelor of Software Engineering', 'Diploma in Information Technology'],
  Business: ['Bachelor of Business Administration', 'Bachelor of Accounting and Finance', 'Bachelor of Human Resource Management', 'Bachelor of Marketing', 'Bachelor of Procurement and Logistics Management'],
  Engineering: ['Bachelor of Civil Engineering', 'Bachelor of Electrical Engineering', 'Bachelor of Mechanical Engineering', 'Diploma in Engineering'],
  'Health Sciences': ['Bachelor of Nursing Science', 'Bachelor of Public Health', 'Diploma in Nursing', 'Diploma in Midwifery'],
  Education: ['Bachelor of Education', 'Bachelor of Arts with Education', 'Bachelor of Science with Education', 'Bachelor of Education in Primary Education', 'Diploma in Education'],
  'Arts & Humanities': ['Bachelor of Arts in Education', 'Bachelor of Social Work and Social Administration', 'Bachelor of Theology', 'Bachelor of Education']
};

function Avatar({ name, index = 0, large = false }) {
  return <div className={`avatar ${large ? 'avatar-large' : ''}`} style={{ background: palettes[index % palettes.length] }}>{initials(name)}</div>;
}
function Status({ status }) {
  const label = status === 'on leave' ? 'On leave' : status[0].toUpperCase() + status.slice(1);
  return <span className={`status status-${status.replace(' ', '-')}`}><span />{label}</span>;
}
function Metric({ icon: Icon, label, value, note, tone, loading }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={18}/></div><div className="metric-label">{label}</div><div className="metric-value">{loading ? '—' : value}</div><div className="metric-note">{note}</div></div>;
}

function ReportsPage({ onOpenDirectory }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/reports')
      .then(data => { if (active) setReport(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const exportReport = () => {
    if (!report) return;
    const rows = [
      ['Bugema University student report'],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Registry metric', 'Students'],
      ['Total students', report.overview.total],
      ['Active', report.overview.active],
      ['Graduated', report.overview.graduated],
      ['On leave', report.overview.onLeave],
      [],
      ['Department', 'Student count'],
      ...report.departments.map(item => [item.department, item.count])
    ];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'bugema-student-report.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const departmentMax = Math.max(0, ...(report?.departments || []).map(item => item.count));
  return <div className="reports-view">
    <div className="reports-heading"><div><div className="eyebrow">BUGEMA UNIVERSITY / REGISTRY</div><h1>Records &amp; reports</h1><p>Enrollment and department activity at a glance.</p></div><div className="reports-actions"><button className="btn btn-outline" onClick={exportReport} disabled={!report || loading}><Download size={16}/> Export report</button><button className="btn btn-primary" onClick={onOpenDirectory}><Users size={16}/> Browse records</button></div></div>
    {error && <div className="error-banner"><span>{error}</span><button onClick={() => window.location.reload()}>Try again</button></div>}
    <section className="metrics-grid report-metrics">
      <Metric icon={Users} label="Total students" value={String(report?.overview.total ?? 0)} note="Registered records" tone="blue" loading={loading}/>
      <Metric icon={Activity} label="Active" value={String(report?.overview.active ?? 0)} note="Currently enrolled" tone="green" loading={loading}/>
      <Metric icon={GraduationCap} label="Graduated" value={String(report?.overview.graduated ?? 0)} note="Completed studies" tone="orange" loading={loading}/>
      <Metric icon={Building2} label="Departments" value={String(report?.overview.departments ?? 0)} note="With student records" tone="purple" loading={loading}/>
    </section>
    <div className="report-layout">
      <section className="report-panel department-panel">
        <div className="report-panel-heading"><div><h2>Students by department</h2><p>Distribution of enrolled records</p></div><Building2 size={18}/></div>
        {loading ? <div className="report-empty">Loading department report…</div> : report?.departments.length ? <div className="department-bars">{report.departments.map(item => <div className="department-bar-row" key={item.department}>
          <div className="department-bar-label"><span>{item.department}</span><strong>{item.count}</strong></div>
          <div className="department-bar-track"><span style={{ width: `${departmentMax ? item.count / departmentMax * 100 : 0}%` }}/></div>
        </div>)}</div> : <div className="report-empty">No department records yet.</div>}
      </section>
      <section className="report-panel recent-panel">
        <div className="report-panel-heading"><div><h2>Recent student records</h2><p>Latest 10 updated records</p></div><button className="text-action" onClick={onOpenDirectory}>View all <ArrowRight size={14}/></button></div>
        <div className="report-table-wrap"><table className="report-table"><thead><tr><th>STUDENT</th><th>PROGRAMME</th><th>DEPARTMENT</th><th>STATUS</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="4" className="report-empty">Loading records…</td></tr> : report?.recentRecords.length ? report.recentRecords.map(record => <tr key={record._id}>
            <td><strong>{fullName(record)}</strong><small>{record.studentId}</small></td><td>{record.course}</td><td>{record.department}</td><td><Status status={record.status}/></td>
          </tr>) : <tr><td colSpan="4" className="report-empty">No student records yet.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  </div>;
}

function StudentModal({ student, onClose, onSave, saving }) {
  const [form, setForm] = useState(student ? { ...blank, ...student, enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().slice(0, 10) : '' } : { ...blank });
  const [error, setError] = useState('');
  const programs = programsByDepartment[form.department] || [];
  const legacyDepartment = form.department && !programsByDepartment[form.department];
  const legacyProgram = form.course && !programs.includes(form.course);
  useEffect(() => {
    const key = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const submit = async e => {
    e.preventDefault(); setError('');
    if (!form.studentId.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.course.trim() || !form.department.trim()) {
      setError('Please fill in all required fields marked with *.'); return;
    }
    try { await onSave({ ...form, gpa: Number(form.gpa) || 0 }); } catch (err) { setError(err.message); }
  };
  return <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-head"><div><div className="eyebrow">{student ? 'STUDENT RECORD' : 'NEW ENROLLMENT'}</div><h2 id="modal-title">{student ? 'Edit student' : 'Add a student'}</h2><p>{student ? 'Keep this student’s details up to date.' : 'Let’s add someone to your campus community.'}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field">Student ID <span>*</span><input value={form.studentId} onChange={e => update('studentId', e.target.value)} placeholder="e.g. CS-2026-014" maxLength="30"/></label>
          <label className="field">Enrollment date<input type="date" value={form.enrollmentDate} onChange={e => update('enrollmentDate', e.target.value)}/></label>
          <label className="field">First name <span>*</span><input autoFocus value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First name"/></label>
          <label className="field">Last name <span>*</span><input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last name"/></label>
          <label className="field">Email address <span>*</span><input type="text" inputMode="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Enter any email format"/></label>
          <label className="field">Phone number<input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+256 700 000 000"/></label>
          <label className="field">Department <span>*</span><select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value, course: '' }))}><option value="">Select department</option>{Object.keys(programsByDepartment).map(name => <option key={name} value={name}>{name}</option>)}{legacyDepartment && <option value={form.department}>{form.department}</option>}</select></label>
          <label className="field field-wide">Course / programme <span>*</span><select value={form.course} onChange={e => update('course', e.target.value)} disabled={!form.department}><option value="">{form.department ? 'Select course / programme' : 'Select a department first'}</option>{legacyProgram && <option value={form.course}>{form.course}</option>}{programs.map(program => <option key={program} value={program}>{program}</option>)}</select></label>
          <label className="field">Year of study<select value={form.year} onChange={e => update('year', e.target.value)}><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Year 5</option><option>Postgraduate</option></select></label>
          <label className="field">Student status<select value={form.status} onChange={e => update('status', e.target.value)}><option value="active">Active</option><option value="graduated">Graduated</option><option value="on leave">On leave</option></select></label>
          <label className="field">GPA (out of 5.0)<input type="number" min="0" max="5" step="0.01" value={form.gpa} onChange={e => update('gpa', e.target.value)}/></label>
          <label className="field field-wide">Notes<textarea rows="3" maxLength="2000" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Advising notes, achievements, or helpful context…"/></label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions"><button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16}/> : <Check size={16}/>} {saving ? 'Saving…' : student ? 'Save changes' : 'Add student'}</button></div>
      </form>
    </section>
  </div>;
}

function ProfilePanel({ student, index, onClose, onEdit, onDelete }) {
  if (!student) return null;
  const date = student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not provided';
  return <div className="backdrop profile-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="profile-panel">
      <div className="profile-top"><span className="eyebrow">STUDENT PROFILE</span><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>
      <div className="profile-intro"><Avatar name={fullName(student)} index={index} large/><h2>{fullName(student)}</h2><p>{student.course}</p><Status status={student.status}/><div className="student-id-pill"><Hash size={13}/>{student.studentId}</div></div>
      <div className="profile-actions"><button className="btn btn-primary" onClick={onEdit}><Pencil size={15}/> Edit student</button><button className="btn btn-quiet" onClick={() => onDelete(student)}><Trash2 size={15}/> Delete</button></div>
      <div className="profile-section"><h3>Student information</h3>
        <div className="info-row"><Mail size={16}/><div><small>Email address</small><a href={`mailto:${student.email}`}>{student.email}</a></div></div>
        <div className="info-row"><Phone size={16}/><div><small>Phone number</small><span>{student.phone || 'Not provided'}</span></div></div>
        <div className="info-row"><Building2 size={16}/><div><small>Department</small><span>{student.department}</span></div></div>
        <div className="info-row"><BookOpen size={16}/><div><small>Year of study</small><span>{student.year}</span></div></div>
        <div className="info-row"><Activity size={16}/><div><small>Current GPA</small><span>{Number(student.gpa || 0).toFixed(2)} / 5.00</span></div></div>
        <div className="info-row"><CalendarDays size={16}/><div><small>Enrollment date</small><span>{date}</span></div></div>
      </div>
      <div className="profile-section"><h3>Notes</h3><p className="notes-box">{student.notes || 'No notes yet. Edit this profile to add helpful context.'}</p></div>
    </section>
  </div>;
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, graduated: 0, onLeave: 0, departments: 0 });
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [toast, setToast] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [pageView, setPageView] = useState('welcome');
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSaving, setLoginSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api('/auth/session')
      .then(result => { if (active) setAuthenticated(result.authenticated); })
      .catch(() => {})
      .finally(() => { if (active) setAuthChecking(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const expireSession = () => {
      setAuthenticated(false); setPageView('welcome'); setLoginOpen(false);
      setLoginError('Your admin session expired. Please sign in again.');
    };
    window.addEventListener('campusdesk:unauthorized', expireSession);
    return () => window.removeEventListener('campusdesk:unauthorized', expireSession);
  }, []);

  const load = useCallback(async () => {
    if (!authenticated) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ search, status, department, page: String(page), limit: '8' });
      const [list, stats, deps] = await Promise.all([api(`/students?${params}`), api('/summary'), api('/departments')]);
      setStudents(list.students); setTotal(list.total); setPages(list.pages); setSummary(stats); setDepartments(deps);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [authenticated, search, status, department, page]);
  const loadNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError('');
    try { setNotifications(await api('/notifications')); }
    catch (err) { setNotificationsError(err.message); }
    finally { setNotificationsLoading(false); }
  };
  const toggleNotifications = () => {
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }
    setNotificationsOpen(true);
    loadNotifications();
  };
  useEffect(() => { const t = setTimeout(load, 220); return () => clearTimeout(t); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3200); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { setPage(1); }, [search, status, department]);

  const saveStudent = async form => {
    setSaving(true);
    try {
      if (modal?.student?._id) await api(`/students/${modal.student._id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/students', { method: 'POST', body: JSON.stringify(form) });
      setModal(null); setSelected(null); setToast(modal?.student ? 'Student record updated' : 'Student successfully enrolled'); await load();
    } finally { setSaving(false); }
  };
  const deleteStudent = async student => {
    if (!window.confirm(`Delete ${fullName(student)} (${student.studentId}) from the student database? This cannot be undone.`)) return;
    try { await api(`/students/${student._id}`, { method: 'DELETE' }); setSelected(null); setMenuFor(null); setToast('Student record deleted'); await load(); }
    catch (err) { setError(err.message); }
  };
  const editStudent = student => { setSelected(null); setMenuFor(null); setModal({ student }); };
  const exportCsv = () => {
    const headers = ['Student ID','First name','Last name','Email','Phone','Course','Department','Year','Status','GPA','Enrollment date','Notes'];
    const rows = students.map(s => [s.studentId,s.firstName,s.lastName,s.email,s.phone,s.course,s.department,s.year,s.status,s.gpa,s.enrollmentDate,s.notes]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'campusdesk-students.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const setView = next => {
    setPageView(next === 'welcome' ? 'welcome' : next === 'reports' ? 'reports' : 'directory');
    if (next === 'welcome') setStatus('all');
    else if (next !== 'reports') setStatus(next);
    setMobileNav(false);
  };
  const submitLogin = async e => {
    e.preventDefault(); setLoginSaving(true); setLoginError('');
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: loginUsername, password: loginPassword }) });
      setAuthenticated(true); setPageView('directory'); setLoginOpen(false);
      setLoginUsername(''); setLoginPassword('');
    } catch (err) { setLoginError(err.message); }
    finally { setLoginSaving(false); }
  };
  const logoutAdmin = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
      setAuthenticated(false); setPageView('welcome'); setMobileNav(false);
      setStudents([]); setTotal(0); setSummary({ total: 0, active: 0, graduated: 0, onLeave: 0, departments: 0 });
      setDepartments([]); setToast('You have been logged out.');
    } catch (err) { setError(err.message); }
  };

  return <div className="app-shell">
    {pageView !== 'welcome' && <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><span/><span/><span/><span/></div><span>Campus<span className="brand-light">Desk</span></span></div>
      <div className="campus-switch"><div className="campus-logo"><GraduationCap size={20}/></div><div className="campus-copy"><strong>Bugema University</strong><span>Registrar workspace</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">STUDENT SERVICES</div>
      <nav className="nav-links">
        <button className={`nav-link ${pageView === 'welcome' ? 'active' : ''}`} onClick={() => setView('welcome')}><LayoutDashboard size={18}/> Overview</button>
        <button className={`nav-link ${pageView === 'directory' && status === 'all' ? 'active' : ''}`} onClick={() => setView('all')}><Users size={18}/> All students <span className="nav-count">{summary.total}</span></button>
        <button className={`nav-link ${pageView === 'directory' && status === 'active' ? 'active' : ''}`} onClick={() => setView('active')}><Activity size={18}/> Active students</button>
        <button className={`nav-link ${pageView === 'directory' && status === 'graduated' ? 'active' : ''}`} onClick={() => setView('graduated')}><GraduationCap size={18}/> Graduates</button>
        <button className={`nav-link ${pageView === 'directory' && status === 'on leave' ? 'active' : ''}`} onClick={() => setView('on leave')}><CalendarDays size={18}/> On leave</button>
      </nav>
      <div className="nav-label nav-label-lower">MANAGE</div>
      <nav className="nav-links"><button className="nav-link" onClick={() => setToast('Use the Department filter to browse programmes and departments.')}><Building2 size={18}/> Departments</button><button className={`nav-link ${pageView === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}><ClipboardList size={18}/> Records &amp; reports</button></nav>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Here to help</strong><p>Keep every student record clear, current, and in one place.</p><button onClick={() => setToast('Tip: search by student ID, name, email, course or department.')}>Quick search tips <ArrowRight size={14}/></button></div>
        <div className="user-profile"><div className="user-avatar">RA</div><div className="user-copy"><strong>Registrar Admin</strong><span>Administrator</span></div><Ellipsis size={19}/></div>
      </div>
    </aside>}
    {mobileNav && pageView !== 'welcome' && <div className="mobile-scrim" onClick={() => setMobileNav(false)}/>}
    <main className={`main-content ${pageView === 'welcome' ? 'home-content' : ''}`}>
      <header className="topbar">{pageView !== 'welcome' && <button className="mobile-menu icon-btn" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button>}<div className="breadcrumbs">Student services <span>/</span> <strong>{pageView === 'welcome' ? 'Welcome' : pageView === 'reports' ? 'Records & reports' : 'Students'}</strong></div><div className="topbar-right">{authenticated && <><div className="live-indicator"><span/> Workspace ready</div><div className="notification-wrap"><button className="icon-btn notification-btn" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={toggleNotifications}><Bell size={18}/><i/></button>{notificationsOpen && <section className="notification-panel" aria-label="Notifications">
        <div className="notification-heading"><div><strong>Notifications</strong><span>Recent student activity</span></div><button className="icon-btn" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={16}/></button></div>
        {notificationsLoading ? <div className="notification-state"><LoaderCircle className="spin" size={18}/> Loading notifications…</div> : notificationsError ? <div className="notification-state notification-error"><span>{notificationsError}</span><button className="text-action" onClick={loadNotifications}>Try again</button></div> : notifications && <>
          {notifications.recentRecords.length ? <div className="notification-list">{notifications.recentRecords.map(record => <div className="notification-item" key={record._id}>
            <span className="notification-icon"><Users size={15}/></span><div><strong>{record.createdAt && record.updatedAt && new Date(record.updatedAt) - new Date(record.createdAt) < 1000 ? 'New student record' : 'Student record updated'}</strong><p>{fullName(record)} · {record.department}</p><small>{new Date(record.updatedAt || record.createdAt).toLocaleString()}</small></div>
          </div>)}</div> : <div className="notification-state">No student records yet. Add a student to start seeing registry activity.</div>}
          {(notifications.summary.onLeave > 0 || notifications.summary.graduated > 0) && <div className="notification-summary">
            {notifications.summary.onLeave > 0 && <div><CalendarDays size={14}/><span><strong>{notifications.summary.onLeave}</strong> {notifications.summary.onLeave === 1 ? 'student is' : 'students are'} currently on leave</span></div>}
            {notifications.summary.graduated > 0 && <div><GraduationCap size={14}/><span><strong>{notifications.summary.graduated}</strong> {notifications.summary.graduated === 1 ? 'student record is' : 'student records are'} marked graduated</span></div>}
          </div>}
        </>}
      </section>}</div><div className="top-avatar">RA</div><button className="btn btn-outline logout-btn" onClick={logoutAdmin}><LogOut size={15}/> Log out</button></>}</div></header>
      <div className="page-wrap">
        {pageView === 'welcome' ? <section className="welcome-screen">
          <div className="welcome-hero">
            <div className="welcome-copy">
              <div className="welcome-brand"><img src={welcomePortrait} alt="Bugema University logo"/><span>Bugema University</span></div>
              <div className="eyebrow">BUGEMA UNIVERSITY / STUDENT REGISTRY</div>
              <h1>Welcome to <em>Bugema University</em></h1>
              <p>Student records and campus services, all in one place.</p>
              <div className="welcome-actions">
                <button className="btn btn-primary" disabled={authChecking || loginSaving} onClick={() => authenticated ? setView('all') : setLoginOpen(true)}>{authenticated ? <Users size={16}/> : <LogIn size={16}/>} {authChecking ? 'Checking access…' : authenticated ? 'Browse students' : 'Admin login'} {authenticated && <ArrowRight size={16}/>}</button>
              </div>
            </div>
            <div className="welcome-art">
              <img className="welcome-portrait" src={welcomePortrait} alt="University community member seated on campus steps"/>
              <div className="welcome-image-caption"><strong>BUGEMA UNIVERSITY</strong><span>Student community</span></div>
            </div>
          </div>
          {error && <div className="welcome-error">{error}</div>}
          <div className="welcome-note"><span>STUDENT SERVICES</span><span>Registrar workspace <i/></span></div>
        </section> : pageView === 'reports' ? <ReportsPage onOpenDirectory={() => setView('all')}/> : <>
        <div className="welcome-row"><div><div className="eyebrow">STUDENT SERVICES / REGISTRY</div><h1>Every student, <em>seen.</em></h1><p className="page-subtitle">A clearer picture of your campus community starts here.</p></div><button className="btn btn-primary add-btn" onClick={() => setModal({ student: null })}><Plus size={17}/> Add student</button></div>
        <section className="metrics-grid">
          <Metric icon={Users} label="Total students" value={summary.total.toLocaleString()} note="All registered records" tone="purple" loading={loading && summary.total === 0}/>
          <Metric icon={Activity} label="Active students" value={summary.active.toLocaleString()} note="Currently enrolled" tone="green" loading={loading && summary.total === 0}/>
          <Metric icon={GraduationCap} label="Graduated" value={summary.graduated.toLocaleString()} note="Completed their studies" tone="orange" loading={loading && summary.total === 0}/>
          <Metric icon={Building2} label="Departments" value={summary.departments.toLocaleString()} note="Represented in records" tone="blue" loading={loading && summary.total === 0}/>
        </section>
        <section className="table-card">
          <div className="table-heading"><div><h2>Student directory <span className="count-pill">{total}</span></h2><p>Student records, thoughtfully organized.</p></div><button className="btn btn-outline export-btn" onClick={exportCsv} disabled={!students.length}><Download size={16}/> Export CSV</button></div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students, ID, course…" aria-label="Search students"/>{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14}/></button>}</div><div className="filter-wrap"><SlidersHorizontal size={15}/><select aria-label="Filter by department" value={department} onChange={e => setDepartment(e.target.value)}><option value="all">All departments</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select><ChevronDown size={14}/></div><button className="btn btn-outline sort-btn" onClick={() => { setStudents(s => [...s].reverse()); setToast('List order changed for this view.'); }}><Sparkles size={15}/> Quick view</button></div>
          {error && <div className="error-banner"><span>{error}</span><button onClick={load}>Try again</button></div>}
          <div className="table-scroll"><table><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>COURSE / PROGRAMME</th><th>YEAR</th><th>STATUS</th><th>GPA</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {loading ? <tr><td colSpan="7"><div className="table-state"><LoaderCircle className="spin" size={22}/><span>Gathering student records…</span></div></td></tr> :
            students.length ? students.map((s, i) => <tr className="student-row" key={s._id}>
              <td><button className="person-cell" onClick={() => setSelected(s)}><Avatar name={fullName(s)} index={i + page}/><span className="person-info"><strong>{fullName(s)}</strong><small>{s.email}</small></span></button></td>
              <td><span className="id-cell">{s.studentId}</span></td>
              <td><div className="course-cell"><div className="course-icon"><BookOpen size={15}/></div><span><strong>{s.course}</strong><small>{s.department}</small></span></div></td>
              <td><span className="year-pill">{s.year}</span></td><td><Status status={s.status}/></td><td className="gpa-cell">{Number(s.gpa || 0).toFixed(2)} <span>/ 5.0</span></td>
              <td className="action-cell"><div className="row-actions"><button className="icon-btn" aria-label={`Edit ${fullName(s)}`} onClick={() => editStudent(s)}><Pencil size={15}/></button><button className="icon-btn" aria-label={`More actions for ${fullName(s)}`} onClick={() => setMenuFor(menuFor === s._id ? null : s._id)}><Ellipsis size={18}/></button>{menuFor === s._id && <div className="action-menu"><button onClick={() => {setSelected(s);setMenuFor(null)}}>View profile</button><button onClick={() => editStudent(s)}>Edit student</button><button className="danger-item" onClick={() => deleteStudent(s)}>Delete record</button></div>}</div></td>
            </tr>) : <tr><td colSpan="7"><div className="empty-state"><div className="empty-illustration"><GraduationCap size={26}/><Plus size={15}/></div><h3>{search || status !== 'all' || department !== 'all' ? 'No students found' : 'Your student directory starts here'}</h3><p>{search || status !== 'all' || department !== 'all' ? 'Try another search or clear your filters.' : 'Add your first student to begin building your campus directory.'}</p>{search || status !== 'all' || department !== 'all' ? <button className="btn btn-outline" onClick={() => {setSearch('');setStatus('all');setDepartment('all')}}>Clear filters</button> : <button className="btn btn-primary" onClick={() => setModal({student:null})}><Plus size={16}/> Add first student</button>}</div></td></tr>}
          </tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{total ? (page - 1) * 8 + 1 : 0}–{Math.min(page * 8, total)}</strong> of <strong>{total}</strong> students</span><div className="pagination"><button className="page-btn" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}><ArrowLeft size={15}/> Previous</button><span className="page-number">{page} <i>of</i> {pages}</span><button className="page-btn" disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Next <ArrowRight size={15}/></button></div></div>
        </section>
        <footer className="page-footer"><span>Every student has a story. Keep their details in good hands.</span><span><span className="footer-dot"/> CampusDesk <span className="footer-separator">·</span> v1.0</span></footer>
        </>}
      </div>
    </main>
    {loginOpen && !authenticated && <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setLoginOpen(false)}>
      <section className="modal login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <div className="modal-head"><div><div className="eyebrow">BUGEMA UNIVERSITY</div><h2 id="login-title">Admin sign in</h2><p>Sign in to access the student registry.</p></div><button className="icon-btn" onClick={() => setLoginOpen(false)} aria-label="Close"><X size={19}/></button></div>
        <form className="login-form" onSubmit={submitLogin}>
          <label className="field">Admin name <span>*</span><input name="username" autoComplete="username" autoFocus required value={loginUsername} onChange={e => setLoginUsername(e.target.value)} placeholder="Enter admin name"/></label>
          <label className="field">Password <span>*</span><input name="password" type="password" autoComplete="current-password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Enter password"/></label>
          {loginError && <div className="form-error">{loginError}</div>}
          <div className="modal-actions"><button type="button" className="btn btn-quiet" onClick={() => setLoginOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={loginSaving}>{loginSaving ? <LoaderCircle className="spin" size={16}/> : <LogIn size={16}/>} {loginSaving ? 'Signing in…' : 'Sign in'}</button></div>
        </form>
      </section>
    </div>}
    {modal && <StudentModal key={modal.student?._id || 'new'} student={modal.student} onClose={() => setModal(null)} onSave={saveStudent} saving={saving}/>}
    {selected && <ProfilePanel student={selected} index={students.findIndex(s => s._id === selected._id)} onClose={() => setSelected(null)} onEdit={() => editStudent(selected)} onDelete={deleteStudent}/>}
    {toast && <div className="toast"><span className="toast-check"><Check size={14}/></span>{toast}<button onClick={() => setToast('')}><X size={14}/></button></div>}
  </div>;
}