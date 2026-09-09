import { useEffect, useMemo, useState } from 'react'

const INITIAL_STUDENTS = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@example.com', course: 'Computer Science', year: '3rd year', batch: 'Batch A', status: 'Active' },
  { id: 2, name: 'Maya Patel', email: 'maya.patel@example.com', course: 'Business Administration', year: '2nd year', batch: 'Batch B', status: 'Active' },
  { id: 3, name: 'Rohan Mehta', email: 'rohan.mehta@example.com', course: 'Design', year: '1st year', batch: 'Batch A', status: 'Inactive' },
  { id: 4, name: 'Diya Singh', email: 'diya.singh@example.com', course: 'Data Science', year: '4th year', batch: 'Batch C', status: 'Active' },
]

const EMPTY_FORM = { name: '', email: '', course: '', year: '', batch: 'Batch A', status: 'Active' }
const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Inactive']
const ATTENDANCE_FILTER_OPTIONS = ['All', 'Present', 'Absent', 'Unmarked']
const ATTENDANCE_STORAGE_KEY = 'taskmate-attendance-by-date'
const TODAY = new Date().toISOString().slice(0, 10)

function readAttendanceStorage() {
  try {
    const saved = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY)
    if (!saved) {
      return { [TODAY]: { 1: 'Present', 2: 'Present', 3: 'Absent', 4: 'Absent' } }
    }
    return JSON.parse(saved)
  } catch {
    return { [TODAY]: { 1: 'Present', 2: 'Present', 3: 'Absent', 4: 'Absent' } }
  }
}

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
  const [attendanceFilter, setAttendanceFilter] = useState('All')
  const [attendanceByDate, setAttendanceByDate] = useState(readAttendanceStorage)

  useEffect(() => {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendanceByDate))
  }, [attendanceByDate])

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase()

    return students.filter((student) => {
      const matchesSearch = !term || [student.name, student.email, student.course, student.year, student.batch].some((value) =>
        value.toLowerCase().includes(term),
      )
      const matchesStatus = statusFilter === 'All' || student.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [students, query, statusFilter])

  const dailyAttendance = attendanceByDate[selectedDate] || {}

  const attendanceFilteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase()

    return students.filter((student) => {
      const matchesSearch = !term || student.name.toLowerCase().includes(term)
      const status = dailyAttendance[student.id] || 'Unmarked'
      const matchesAttendanceFilter = attendanceFilter === 'All' || status === attendanceFilter

      return matchesSearch && matchesAttendanceFilter
    })
  }, [students, query, attendanceFilter, dailyAttendance])

  const studentAttendanceStats = useMemo(() => {
    return students.reduce((accumulator, student) => {
      const days = Object.values(attendanceByDate)
      let present = 0
      let absent = 0
      let total = 0

      days.forEach((record) => {
        const status = record?.[student.id]
        if (status === 'Present') {
          present += 1
          total += 1
        } else if (status === 'Absent') {
          absent += 1
          total += 1
        }
      })

      const rate = total ? Math.round((present / total) * 100) : 0
      accumulator[student.id] = { present, absent, total, rate }
      return accumulator
    }, {})
  }, [students, attendanceByDate])

  const attendanceSummary = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Unmarked: 0 }

    students.forEach((student) => {
      const status = dailyAttendance[student.id] || 'Unmarked'
      if (counts[status] !== undefined) counts[status] += 1
    })

    const total = students.length
    const marked = counts.Present + counts.Absent
    const rate = total ? Math.round((counts.Present / total) * 100) : 0

    return { ...counts, total, marked, rate }
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
      batch: form.batch,
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
    setForm({ name: student.name, email: student.email, course: student.course, year: student.year, batch: student.batch || 'Batch A', status: student.status })
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

  const saveAttendance = () => {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendanceByDate))
    setNotice('Attendance saved.')
  }

  const resetAttendance = () => {
    const clearRecord = Object.fromEntries(students.map((student) => [student.id, 'Unmarked']))
    setAttendanceByDate((current) => ({
      ...current,
      [selectedDate]: clearRecord,
    }))
    setNotice('Attendance reset for selected date.')
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

      {activeView === 'students' ? (
        <section className="workspace" aria-label="Student management workspace">
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

              <label htmlFor="batch">Batch</label>
              <select id="batch" name="batch" value={form.batch} onChange={updateField}>
                <option>Batch A</option>
                <option>Batch B</option>
                <option>Batch C</option>
              </select>

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
                  <span aria-hidden="true">?</span>
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
                      <div className="tags">
                        <span>{student.course}</span>
                        <span>{student.year}</span>
                        <span>{student.batch || 'Batch A'}</span>
                        <span className={`student-status ${student.status.toLowerCase()}`}><i />{student.status}</span>
                      </div>
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
                <span aria-hidden="true">?</span>
                <h3>{students.length === 0 ? 'No students yet' : 'No matches found'}</h3>
                <p>{students.length === 0 ? 'Use the form to add your first student.' : 'Try a different name, course, email, or year.'}</p>
              </div>
            )}
          </article>
        </section>
      ) : (
        <section className="attendance-workspace" aria-label="Attendance monitoring workspace">
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
              <div><span>Total</span><strong>{attendanceSummary.total}</strong><small>Students tracked</small></div>
              <div><span>Present</span><strong>{attendanceSummary.Present}</strong><small>Checked in today</small></div>
              <div><span>Absent</span><strong>{attendanceSummary.Absent}</strong><small>{attendanceSummary.Unmarked} unmarked</small></div>
              <div><span>Attendance %</span><strong>{attendanceSummary.rate}%</strong><small>{attendanceSummary.marked} records saved</small></div>
            </div>
          </article>

          <article className="panel attendance-list-panel">
            <div className="list-toolbar">
              <div>
                <p className="eyebrow">Class register</p>
                <h2>Mark attendance</h2>
              </div>

              <div className="attendance-toolbar-controls">
                <label className="search-box" htmlFor="attendance-search">
                  <span aria-hidden="true">?</span>
                  <input id="attendance-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by student name" />
                </label>

                <label className="status-filter" htmlFor="attendance-status-filter">
                  <span>Status</span>
                  <select id="attendance-status-filter" value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)}>
                    {ATTENDANCE_FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {notice && <p className="notice" role="status">{notice}</p>}

            {attendanceFilteredStudents.length > 0 ? (
              <div className="attendance-list" role="list">
                {attendanceFilteredStudents.map((student) => {
                  const status = dailyAttendance[student.id] || 'Unmarked'
                  const studentStats = studentAttendanceStats[student.id] || { present: 0, absent: 0, total: 0, rate: 0 }

                  return (
                    <article className="attendance-card" key={student.id} role="listitem">
                      <div className="avatar" aria-hidden="true">{student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
                      <div className="student-info">
                        <h3>{student.name}</h3>
                        <p>ID: {student.id}</p>
                        <div className="tags">
                          <span>{student.course}</span>
                          <span>{student.year}</span>
                          <span>{student.batch || 'Batch A'}</span>
                        </div>
                      </div>

                      <div className="attendance-status-group">
                        <label className={`attendance-option ${status === 'Present' ? 'present' : ''}`}> 
                          <input type="radio" name={`attendance-${student.id}-${selectedDate}`} value="Present" checked={status === 'Present'} onChange={(event) => updateAttendance(student.id, event.target.value)} />
                          <span>Present</span>
                        </label>
                        <label className={`attendance-option ${status === 'Absent' ? 'absent' : ''}`}> 
                          <input type="radio" name={`attendance-${student.id}-${selectedDate}`} value="Absent" checked={status === 'Absent'} onChange={(event) => updateAttendance(student.id, event.target.value)} />
                          <span>Absent</span>
                        </label>
                      </div>

                      <div className="student-attendance-calculator">
                        <span className="calculator-label">Individual attendance</span>
                        <div className="calculator-grid">
                          <span><small>Rate</small><strong>{studentStats.rate}%</strong></span>
                          <span><small>Present</small><strong>{studentStats.present}</strong></span>
                          <span><small>Absent</small><strong>{studentStats.absent}</strong></span>
                          <span><small>Total</small><strong>{studentStats.total}</strong></span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">?</span>
                <h3>No students found</h3>
                <p>Try a different name, course, email, or year.</p>
              </div>
            )}

            <div className="attendance-page-actions">
              <button className="button primary" type="button" onClick={saveAttendance}>Save Attendance</button>
              <button className="button secondary" type="button" onClick={resetAttendance}>Reset</button>
            </div>
          </article>
        </section>
      )}

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
