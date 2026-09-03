import { useMemo, useState } from 'react'

const INITIAL_STUDENTS = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@example.com', course: 'Computer Science', year: '3rd year', status: 'Active' },
  { id: 2, name: 'Maya Patel', email: 'maya.patel@example.com', course: 'Business Administration', year: '2nd year', status: 'Active' },
  { id: 3, name: 'Rohan Mehta', email: 'rohan.mehta@example.com', course: 'Design', year: '1st year', status: 'Inactive' },
  { id: 4, name: 'Diya Singh', email: 'diya.singh@example.com', course: 'Data Science', year: '4th year', status: 'Active' },
]

const EMPTY_FORM = { name: '', email: '', course: '', year: '', status: 'Active' }
const INITIAL_ATTENDANCE = {
  1: 'Present',
  2: 'Present',
  3: 'Late',
  4: 'Absent',

}
const ATTENDANCE_OPTIONS = ['Unmarked', 'Present', 'Late', 'Absent']
const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Inactive']
const TODAY = new Date().toISOString().slice(0, 10)

function App() {
  const [students, setStudents] = useState(INITIAL_STUDENTS)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [notice, setNotice] = useState('')
  const [activeView, setActiveView] = useState('students')
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [attendanceByDate, setAttendanceByDate] = useState({ [TODAY]: INITIAL_ATTENDANCE })
 

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase()

    return students.filter((student) => {
      const matchesSearch = !term || [student.name, student.email, student.course, student.year].some((value) =>
        value.toLowerCase().includes(term),
      )
      const matchesStatus = statusFilter === 'All' || student.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [students, query, statusFilter])

  const dailyAttendance = attendanceByDate[selectedDate] || {}
  const attendanceSummary = useMemo(() => {
    const counts = { Present: 0, Late: 0, Absent: 0, Unmarked: 0, Active:0, inactive:0 }
    students.forEach((student) => {
      counts[dailyAttendance[student.id] || 'Unmarked'] += 1
    })
    const marked = counts.Present + counts.Late + counts.Absent + counts.Active + counts.inactive
    const rate = marked ? Math.round(((counts.Present + counts.Late) / marked) * 100) : 0
    return { ...counts, marked, rate }
  }, [students, dailyAttendance])

  const validateForm = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Enter the student name.'
    if (!form.email.trim()) {
      nextErrors.email = 'Enter an email address.'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!form.course.trim()) nextErrors.course = 'Enter a course.'
    if (!form.year) nextErrors.year = 'Choose a year.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validateForm()) return

    const cleanStudent = {
      name: form.name.trim(),
      email: form.email.trim(),
      course: form.course.trim(),
      year: form.year,
      status: form.status,
    }

    if (editingId !== null) {
      setStudents((current) => current.map((student) => (
        student.id === editingId ? { ...student, ...cleanStudent } : student
      )))
      setNotice('Student details updated.')
    } else {
      setStudents((current) => [...current, { id: crypto.randomUUID(), ...cleanStudent }])
      setNotice('Student added to the list.')
    }
    resetForm()
  }

  const startEditing = (student) => {
    setForm({ name: student.name, email: student.email, course: student.course, year: student.year, status: student.status })
    setEditingId(student.id)
    setErrors({})
    setNotice('')
    document.getElementById('student-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!studentToDelete) return
    setStudents((current) => current.filter((student) => student.id !== studentToDelete.id))
    setAttendanceByDate((current) => Object.fromEntries(
      Object.entries(current).map(([date, record]) => {
        const { [studentToDelete.id]: removedStatus, ...remainingStatuses } = record
        return [date, remainingStatuses]
      }),
    ))
    if (editingId === studentToDelete.id) resetForm()
    setNotice(`${studentToDelete.name} was removed.`)
    setStudentToDelete(null)
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const updateAttendance = (studentId, status) => {
    setAttendanceByDate((current) => ({
      ...current,
      [selectedDate]: { ...(current[selectedDate] || {}), [studentId]: status },
    }))
    const student = students.find((item) => item.id === studentId)
    if (student) setNotice(`${student.name} marked ${status.toLowerCase()}.`)
  }

  const markAllPresent = () => {
    setAttendanceByDate((current) => ({
      ...current,
      [selectedDate]: Object.fromEntries(students.map((student) => [student.id, 'Present'])),
    }))
    setNotice('All students marked present.')
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">XYZ Academy</p>
          <h1 id="page-title">{activeView === 'students' ? 'Keep your class on track.' : 'Attendance, at a glance.'}</h1>
          <p className="hero-copy">{activeView === 'students' ? 'Add, find, and maintain student records in one simple workspace.' : 'Mark daily attendance, spot absences, and keep every record up to date.'}</p>
        </div>
        <div className="student-count" aria-label={`${students.length} students enrolled`}>
          <span>{students.length}</span>
          {activeView === 'students' ? 'students enrolled' : 'students tracked'}
        </div>
      </section>

      <div className="view-switch" role="tablist" aria-label="Student management views">
        <button className={activeView === 'students' ? 'active' : ''} role="tab" aria-selected={activeView === 'students'} type="button" onClick={() => setActiveView('students')}>Student directory</button>
        <button className={activeView === 'attendance' ? 'active' : ''} role="tab" aria-selected={activeView === 'attendance'} type="button" onClick={() => setActiveView('attendance')}>Attendance monitor</button>
      </div>

      {activeView === 'students' ? <section className="workspace" aria-label="Student management workspace">
        <article className="panel form-panel" id="student-form">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editingId !== null ? 'Update record' : 'New record'}</p>
              <h2>{editingId !== null ? 'Edit student' : 'Add a student'}</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={updateField} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} placeholder="e.g. Priya Kumar" />
            {errors.name && <p className="field-error" id="name-error">{errors.name}</p>}

            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" value={form.email} onChange={updateField} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} placeholder="student@example.com" />
            {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}

            <label htmlFor="course">Course</label>
            <input id="course" name="course" value={form.course} onChange={updateField} aria-invalid={Boolean(errors.course)} aria-describedby={errors.course ? 'course-error' : undefined} placeholder="e.g. Computer Science" />
            {errors.course && <p className="field-error" id="course-error">{errors.course}</p>}

            <label htmlFor="year">Year</label>
            <select id="year" name="year" value={form.year} onChange={updateField} aria-invalid={Boolean(errors.year)} aria-describedby={errors.year ? 'year-error' : undefined}>
              <option value="">Select year</option>
              <option>1st year</option>
              <option>2nd year</option>
              <option>3rd year</option>
              <option>4th year</option>
            </select>
            {errors.year && <p className="field-error" id="year-error">{errors.year}</p>}

            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={updateField}>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="form-actions">
              <button className="button primary" type="submit">{editingId !== null ? 'Save changes' : 'Add student'}</button>
              {editingId !== null && <button className="button secondary" type="button" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </article>

        <article className="panel list-panel">
          <div className="list-toolbar">
            <div>
              <p className="eyebrow">Directory</p>
              <h2>Student list</h2>
            </div>
            <div className="toolbar-controls">
              <label className="search-box" htmlFor="student-search">
                <span aria-hidden="true">⌕</span>
                <input id="student-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students" />
              </label>
              <label className="status-filter" htmlFor="student-status-filter">
                <span>Status</span>
                <select id="student-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {notice && <p className="notice" role="status">{notice}</p>}

          {filteredStudents.length > 0 ? (
            <div className="student-list" role="list">
              {filteredStudents.map((student) => (
                <article className="student-card" key={student.id} role="listitem">
                  <div className="avatar" aria-hidden="true">{student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
                  <div className="student-info">
                    <h3>{student.name}</h3>
                    <p>{student.email}</p>
                    <div className="tags"><span>{student.course}</span><span>{student.year}</span><span className={`student-status ${student.status.toLowerCase()}`}><i />{student.status}</span></div>
                  </div>
                  <div className="card-actions" aria-label={`Actions for ${student.name}`}>
                    <button className="text-button" type="button" onClick={() => startEditing(student)}>Edit</button>
                    <button className="text-button danger" type="button" onClick={() => setStudentToDelete(student)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">⌕</span>
              <h3>{students.length === 0 ? 'No students yet' : 'No matches found'}</h3>
              <p>{students.length === 0 ? 'Use the form to add your first student.' : 'Try a different name, course, email, or year.'}</p>
            </div>
          )}
        </article>
      </section> : <section className="attendance-workspace" aria-label="Attendance monitoring workspace">
        <article className="panel attendance-overview">
          <div className="attendance-overview-header">
            <div>
              <p className="eyebrow">Daily register</p>
              <h2>Attendance monitor</h2>
              <p className="attendance-copy">Record the daily status for every student.</p>
            </div>
            <div className="attendance-actions">
              <label htmlFor="attendance-date">Date</label>
              <input id="attendance-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              <button className="button primary" type="button" onClick={markAllPresent}>Mark all present</button>
            </div>
          </div>
          <div className="attendance-stats" aria-label="Attendance summary">
            <div><span>Attendance rate</span><strong>{attendanceSummary.rate}%</strong><small>{attendanceSummary.marked} records marked</small></div>
            <div><span>Present</span><strong>{attendanceSummary.Present}</strong><small>Checked in today</small></div>
            <div><span>Late</span><strong>{attendanceSummary.Late}</strong><small>Arrived after start</small></div>
            <div><span>Absent</span><strong>{attendanceSummary.Absent}</strong><small>{attendanceSummary.Unmarked} still unmarked</small></div>
          </div>
        </article>

        <article className="panel attendance-list-panel">
          <div className="list-toolbar">
            <div><p className="eyebrow">Class register</p><h2>Mark attendance</h2></div>
            <label className="search-box" htmlFor="attendance-search"><span aria-hidden="true">⌕</span><input id="attendance-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students" /></label>
          </div>
          {notice && <p className="notice" role="status">{notice}</p>}
          {filteredStudents.length > 0 ? <div className="attendance-list" role="list">
            {filteredStudents.map((student) => {
              const status = dailyAttendance[student.id] || 'Unmarked'
              return <article className="attendance-card" key={student.id} role="listitem">
                <div className="avatar" aria-hidden="true">{student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
                <div className="student-info"><h3>{student.name}</h3><p>{student.course} · {student.year}</p></div>
                <label className={`attendance-status ${status.toLowerCase()}`}>
                  <span className="sr-only">Attendance status for {student.name}</span>
                  <select aria-label={`Attendance status for ${student.name}`} value={status} onChange={(event) => updateAttendance(student.id, event.target.value)}>{ATTENDANCE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
                </label>
              </article>
            })}
          </div> : <div className="empty-state"><span aria-hidden="true">⌕</span><h3>No students found</h3><p>Try a different name, course, email, or year.</p></div>}
        </article>
      </section>}

      {studentToDelete && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <p className="eyebrow">Confirm removal</p>
            <h2 id="delete-title">Remove {studentToDelete.name}?</h2>
            <p id="delete-description">This will remove the student from the current list. This action cannot be undone.</p>
            <div className="form-actions">
              <button className="button danger-button" type="button" onClick={confirmDelete}>Remove student</button>
              <button className="button secondary" type="button" onClick={() => setStudentToDelete(null)}>Keep student</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
