import { useMemo, useState } from 'react';
import './App.css';
import './Attendance.css';

const initialStudents = [
  { id: 'ST-1024', name: 'Ava Rodriguez', email: 'ava.rodriguez@xyzacademy.edu', program: 'Computer Science', year: 'Year 3', status: 'Active', joined: 'Aug 24, 2024' },
  { id: 'ST-1023', name: 'Noah Williams', email: 'noah.williams@xyzacademy.edu', program: 'Business Analytics', year: 'Year 2', status: 'Active', joined: 'Aug 22, 2024' },
  { id: 'ST-1022', name: 'Maya Patel', email: 'maya.patel@xyzacademy.edu', program: 'Architecture', year: 'Year 4', status: 'Active', joined: 'Aug 18, 2024' },
  { id: 'ST-1021', name: 'Ethan Chen', email: 'ethan.chen@xyzacademy.edu', program: 'Product Design', year: 'Year 1', status: 'Pending', joined: 'Aug 15, 2024' },
  { id: 'ST-1020', name: 'Sofia Martin', email: 'sofia.martin@xyzacademy.edu', program: 'Psychology', year: 'Year 3', status: 'Active', joined: 'Aug 11, 2024' },
  { id: 'ST-1019', name: 'Liam Johnson', email: 'liam.johnson@xyzacademy.edu', program: 'Mechanical Engineering', year: 'Year 2', status: 'Inactive', joined: 'Aug 08, 2024' },
];

const blankStudent = { name: '', email: '', program: 'Computer Science', year: 'Year 1', status: 'Active' };
const initialAttendance = { 'ST-1024': 'Present', 'ST-1023': 'Present', 'ST-1022': 'Late', 'ST-1021': 'Absent', 'ST-1020': 'Present', 'ST-1019': 'Present' };
const attendanceOptions = ['Unmarked', 'Present', 'Late', 'Absent'];
const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const today = new Date().toISOString().slice(0, 10);

function StudentManagementApp() {
  const [students, setStudents] = useState(initialStudents);
  const [activeView, setActiveView] = useState('students');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalStudent, setModalStudent] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [form, setForm] = useState(blankStudent);
  const [notice, setNotice] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendanceByDate, setAttendanceByDate] = useState({ [today]: initialAttendance });

  const visibleStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = !term || [student.name, student.email, student.program, student.id].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, query, statusFilter]);

  const dayAttendance = attendanceByDate[selectedDate] || {};
  const attendanceSummary = useMemo(() => {
    const counts = { Present: 0, Late: 0, Absent: 0, Unmarked: 0 };
    students.forEach((student) => { counts[dayAttendance[student.id] || 'Unmarked'] += 1; });
    const marked = counts.Present + counts.Late + counts.Absent;
    return { ...counts, marked, rate: marked ? Math.round(((counts.Present + counts.Late) / marked) * 100) : 0 };
  }, [students, dayAttendance]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const saveStudent = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    if (modalStudent === 'new') {
      setStudents((current) => [{ ...form, id: `ST-${1025 + current.length - initialStudents.length}`, joined: 'Today' }, ...current]);
      flash('Student added successfully');
    } else {
      setStudents((current) => current.map((student) => student.id === modalStudent.id ? { ...student, ...form } : student));
      flash('Student details updated');
    }
    setModalStudent(null);
  };

  const removeStudent = (student) => {
    if (!window.confirm(`Remove ${student.name} from the student directory?`)) return;
    setStudents((current) => current.filter((item) => item.id !== student.id));
    setAttendanceByDate((current) => Object.fromEntries(Object.entries(current).map(([date, record]) => {
      const { [student.id]: unused, ...remaining } = record;
      return [date, remaining];
    })));
    flash('Student removed from directory');
  };

  const updateAttendance = (studentId, status) => {
    setAttendanceByDate((current) => ({ ...current, [selectedDate]: { ...(current[selectedDate] || {}), [studentId]: status } }));
    const student = students.find((item) => item.id === studentId);
    if (student) flash(`${student.name} marked ${status.toLowerCase()}`);
  };

  const markAllPresent = () => {
    setAttendanceByDate((current) => ({ ...current, [selectedDate]: Object.fromEntries(students.map((student) => [student.id, 'Present'])) }));
    flash('All listed students marked present');
  };

  const activeCount = students.filter((student) => student.status === 'Active').length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">X</span><span>XYZ Academy</span></div>
        <div className="workspace-label">Workspace</div>
        <div className="workspace-select"><span className="school-icon">X</span><span>XYZ Academy</span><span className="chevron">⌄</span></div>
        <nav aria-label="Main navigation">
          <button type="button" className={activeView === 'students' ? 'active' : ''} onClick={() => setActiveView('students')}><span>♧</span>Students <b>{students.length}</b></button>
          <button type="button" className={activeView === 'attendance' ? 'active' : ''} onClick={() => setActiveView('attendance')}><span>◷</span>Attendance</button>
          <button type="button" className="nav-muted"><span>▦</span>Classes</button>
          <button type="button" className="nav-muted"><span>◒</span>Reports</button>
        </nav>
        <div className="sidebar-bottom">
          <button type="button" className="nav-muted"><span>⚙</span>Settings</button>
          <button type="button" className="nav-muted"><span>?</span>Help center</button>
          <div className="profile"><div className="avatar avatar-dark">AD</div><div><strong>Aarya Deshpande</strong><small>Instructor</small></div><span>⋮</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Open menu">☰</button><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{activeView === 'students' ? 'Students' : 'Attendance'}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧<i /></button><div className="avatar avatar-small">AD</div></div></header>
        {activeView === 'students' ? (
          <StudentsView students={students} visibleStudents={visibleStudents} query={query} statusFilter={statusFilter} activeCount={activeCount} onQueryChange={setQuery} onStatusFilterChange={setStatusFilter} onOpenAdd={() => { setForm(blankStudent); setModalStudent('new'); }} onOpenEdit={(student) => { setForm(student); setModalStudent(student); }} onOpenProfile={setProfileStudent} onRemove={removeStudent} />
        ) : (
          <AttendanceView students={students} visibleStudents={visibleStudents} query={query} selectedDate={selectedDate} attendance={dayAttendance} summary={attendanceSummary} onDateChange={setSelectedDate} onQueryChange={setQuery} onStatusChange={updateAttendance} onMarkAllPresent={markAllPresent} />
        )}
        <footer>© 2026 XYZ Academy <span>•</span> Privacy <span>•</span> Terms <span className="status-live"><i />All systems operational</span></footer>
      </main>

      {modalStudent && <StudentModal student={modalStudent} form={form} onChange={setForm} onClose={() => setModalStudent(null)} onSubmit={saveStudent} />}
      {profileStudent && <StudentProfile student={profileStudent} onClose={() => setProfileStudent(null)} onEdit={(student) => { setProfileStudent(null); setForm(student); setModalStudent(student); }} />}
      {notice && <div className="toast" role="status">✓ {notice}</div>}
    </div>
  );
}

function StudentsView({ students, visibleStudents, query, statusFilter, activeCount, onQueryChange, onStatusFilterChange, onOpenAdd, onOpenEdit, onOpenProfile, onRemove }) {
  return <>
    <section className="page-heading"><div><p className="eyebrow">Directory / 2026</p><h1>Students <span>{students.length}</span></h1><p className="subheading">Keep track of your student community all in one place.</p></div><button className="primary-button" onClick={onOpenAdd}><strong>+</strong> Add student</button></section>
    <section className="stat-grid" aria-label="Student statistics"><StatCard icon="♧" tone="coral" label="Total students" value={students.length} detail="Current directory" /><StatCard icon="◉" tone="mint" label="Active students" value={activeCount} detail="Currently enrolled" /><StatCard icon="◷" tone="yellow" label="Pending review" value={students.filter((student) => student.status === 'Pending').length} detail="Requires attention" /><div className="stat-card quote-card"><span>“</span><p>Great things are done by a series of small things brought together.</p><small>— Vincent van Gogh</small></div></section>
    <section className="directory-panel" id="students"><div className="panel-head"><div><h2>Student directory</h2><p>Manage enrollment and student information.</p></div></div><div className="toolbar"><SearchBox value={query} onChange={onQueryChange} placeholder="Search by name, email, or ID..." /><div className="directory-filters"><label htmlFor="status-filter">Status</label><select id="status-filter" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}><option>All</option><option>Active</option><option>Inactive</option><option>Pending</option></select><span className="result-count">{visibleStudents.length} shown</span></div></div><div className="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Program</th><th>Year</th><th>Status</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleStudents.map((student) => <StudentRow key={student.id} student={student} onView={onOpenProfile} onEdit={onOpenEdit} onRemove={onRemove} />)}</tbody></table>{visibleStudents.length === 0 && <div className="empty-state">No students match the current filters.</div>}</div><div className="panel-foot"><span>Showing <strong>{visibleStudents.length}</strong> of <strong>{students.length}</strong> students</span></div></section>
  </>;
}

function AttendanceView({ students, visibleStudents, query, selectedDate, attendance, summary, onDateChange, onQueryChange, onStatusChange, onMarkAllPresent }) {
  return <>
    <section className="page-heading attendance-heading"><div><p className="eyebrow">Daily register</p><h1>Attendance</h1><p className="subheading">Record and monitor attendance for every student.</p></div><button className="primary-button" onClick={onMarkAllPresent}><strong>✓</strong> Mark all present</button></section>
    <section className="stat-grid attendance-stats" aria-label="Attendance statistics"><StatCard icon="✓" tone="mint" label="Attendance rate" value={`${summary.rate}%`} detail={`${summary.marked} records marked`} /><StatCard icon="●" tone="green" label="Present" value={summary.Present} detail="Students checked in" /><StatCard icon="◷" tone="yellow" label="Late" value={summary.Late} detail="Arrived after start" /><StatCard icon="−" tone="coral" label="Absent" value={summary.Absent} detail={`${summary.Unmarked} unmarked`} /></section>
    <section className="directory-panel attendance-panel" id="attendance"><div className="panel-head attendance-panel-head"><div><h2>Daily attendance</h2><p>Update each student’s status for the selected day.</p></div><label className="date-control">Attendance date<input type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} /></label></div><div className="toolbar"><SearchBox value={query} onChange={onQueryChange} placeholder="Search students to mark attendance..." /><span className="result-count">{visibleStudents.length} students</span></div><div className="table-wrap"><table className="attendance-table"><thead><tr><th>Student</th><th>Student ID</th><th>Program</th><th>Attendance status</th></tr></thead><tbody>{visibleStudents.map((student) => <AttendanceRow key={student.id} student={student} status={attendance[student.id] || 'Unmarked'} onChange={onStatusChange} />)}</tbody></table>{visibleStudents.length === 0 && <div className="empty-state">No students match “{query}”.</div>}</div><div className="panel-foot"><span><strong>{summary.marked}</strong> of <strong>{students.length}</strong> attendance records marked</span><span className="unmarked-note">{summary.Unmarked} awaiting a status</span></div></section>
  </>;
}

function StatCard({ icon, tone, label, value, detail }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small className="muted">{detail}</small></div></div>; }
function SearchBox({ value, onChange, placeholder }) { return <label className="search-box"><span>⌕</span><input aria-label="Search students" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }

function StudentRow({ student, onView, onEdit, onRemove }) {
  return <tr><td><button className="student-link" type="button" onClick={() => onView(student)}><div className="student-cell"><div className="avatar">{initials(student.name)}</div><div><strong>{student.name}</strong><small>{student.email}</small></div></div></button></td><td className="id-cell">{student.id}</td><td>{student.program}</td><td>{student.year}</td><td><span className={`status ${student.status.toLowerCase()}`}><i />{student.status}</span></td><td className="date-cell">{student.joined}</td><td><div className="row-actions"><button aria-label={`View ${student.name}`} onClick={() => onView(student)}>View</button><button aria-label={`Edit ${student.name}`} onClick={() => onEdit(student)}>✎</button><button aria-label={`Delete ${student.name}`} onClick={() => onRemove(student)}>⌫</button></div></td></tr>;
}

function AttendanceRow({ student, status, onChange }) {
  return <tr><td><div className="student-cell"><div className="avatar">{initials(student.name)}</div><div><strong>{student.name}</strong><small>{student.email}</small></div></div></td><td className="id-cell">{student.id}</td><td>{student.program}</td><td><label className={`attendance-select ${status.toLowerCase()}`}><span className="sr-only">Attendance status for {student.name}</span><select aria-label={`Attendance status for ${student.name}`} value={status} onChange={(event) => onChange(student.id, event.target.value)}>{attendanceOptions.map((option) => <option key={option}>{option}</option>)}</select></label></td></tr>;
}

function StudentModal({ student, form, onChange, onClose, onSubmit }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={onSubmit}><div className="modal-head"><div><p className="eyebrow">Student record</p><h2>{student === 'new' ? 'Add a student' : 'Edit student'}</h2></div><button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button></div><label>Full name<input required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="e.g. Alex Morgan" /></label><label>Email address<input required type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} placeholder="alex@xyzacademy.edu" /></label><div className="form-row"><label>Program<select value={form.program} onChange={(event) => onChange({ ...form, program: event.target.value })}><option>Computer Science</option><option>Business Analytics</option><option>Architecture</option><option>Product Design</option><option>Psychology</option><option>Mechanical Engineering</option></select></label><label>Year<select value={form.year} onChange={(event) => onChange({ ...form, year: event.target.value })}><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option></select></label></div><label>Status<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value })}><option>Active</option><option>Pending</option><option>Inactive</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">{student === 'new' ? 'Add student' : 'Save changes'}</button></div></form></div>;
}

function StudentProfile({ student, onClose, onEdit }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button type="button" className="close-button" onClick={onClose} aria-label="Close profile">×</button><div className="profile-hero"><div className="avatar profile-avatar">{initials(student.name)}</div><div><p className="eyebrow">Student profile</p><h2 id="profile-title">{student.name}</h2><span className={`status ${student.status.toLowerCase()}`}><i />{student.status}</span></div></div><dl className="profile-details"><div><dt>Student ID</dt><dd>{student.id}</dd></div><div><dt>Email address</dt><dd>{student.email}</dd></div><div><dt>Program</dt><dd>{student.program}</dd></div><div><dt>Year</dt><dd>{student.year}</dd></div><div><dt>Joined</dt><dd>{student.joined}</dd></div></dl><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Close</button><button type="button" className="primary-button" onClick={() => onEdit(student)}>Edit profile</button></div></section></div>;
}

export default StudentManagementApp;
