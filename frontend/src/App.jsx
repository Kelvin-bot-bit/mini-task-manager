import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Check, CheckCircle2, Circle, ClipboardList, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import api from './api'

const emptyForm = { title: '', description: '' }

export default function App() {
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/tasks', { params: { status } })
      setTasks(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not connect to the API. Check that Flask is running and VITE_API_URL is correct.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { loadTasks() }, [loadTasks])

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((task) => task.completed).length,
    pending: tasks.filter((task) => !task.completed).length,
  }), [tasks])

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tasks
    return tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(query))
  }, [tasks, search])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (editingId !== null) {
        await api.patch(`/tasks/${editingId}`, form)
        setNotice('Task updated successfully.')
      } else {
        await api.post('/tasks', form)
        setNotice('Task created successfully.')
      }
      resetForm()
      await loadTasks()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(task) {
    setEditingId(task.id)
    setForm({ title: task.title, description: task.description })
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleTask(task) {
    try {
      await api.patch(`/tasks/${task.id}`, { completed: !task.completed })
      await loadTasks()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update task status.')
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    try {
      await api.delete(`/tasks/${task.id}`)
      setNotice('Task deleted.')
      await loadTasks()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to delete task.')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Mini Task Manager home">
          <span className="brand-mark"><ClipboardList size={21} /></span>
          <span>task<span className="brand-light">mate</span></span>
        </a>
        <div className="topbar-status"><span className="status-dot" /> Personal workspace</div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Activity size={14} /> YOUR SPACE, YOUR PACE</div>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p>A little progress every day adds up. Capture your tasks, keep moving, and celebrate the finish line.</p>
      </section>

      <section className="stats-grid" aria-label="Task summary">
        <StatCard label="Tasks shown" value={stats.total} icon={<ClipboardList />} />
        <StatCard label="To do" value={stats.pending} icon={<Circle />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 />} />
      </section>

      <section className="workspace">
        <div className="form-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">{editingId !== null ? 'MAKE A CHANGE' : 'GET IT OUT OF YOUR HEAD'}</span><h2>{editingId !== null ? 'Edit task' : 'Add a task'}</h2></div>
            <span className="heading-icon"><Plus size={20} /></span>
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="task-title">Task title <span className="required">*</span></label>
            <input id="task-title" maxLength="120" placeholder="e.g. Deploy my first Flask app" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="label-row"><label htmlFor="task-description">Description</label><span>{form.description.length}/1000</span></div>
            <textarea id="task-description" maxLength="1000" rows="4" placeholder="Add a few details (optional)..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button className="primary-btn" type="submit" disabled={saving || !form.title.trim()}>
              {saving ? <LoaderCircle className="spin" size={17} /> : editingId !== null ? <Check size={17} /> : <Plus size={17} />}
              {saving ? 'Saving...' : editingId !== null ? 'Save changes' : 'Create task'}
            </button>
            {editingId !== null && <button className="cancel-btn" type="button" onClick={resetForm}><X size={16} /> Cancel editing</button>}
          </form>
          <div className="tip"><span>✦</span><p><strong>Small tip</strong><br />Break big goals into small, doable steps.</p></div>
        </div>

        <div className="tasks-panel">
          <div className="tasks-heading">
            <div><span className="section-kicker">YOUR WORK IN PROGRESS</span><h2>Task list <span className="count-pill">{visibleTasks.length}</span></h2></div>
            <button className="icon-btn" onClick={loadTasks} aria-label="Refresh tasks" title="Refresh"><RefreshCw size={17} /></button>
          </div>

          <div className="search-wrap"><Search size={17} /><input aria-label="Search tasks" placeholder="Find a task..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="filter-tabs" role="group" aria-label="Filter tasks">
            {[['all', 'All tasks'], ['pending', 'To do'], ['completed', 'Completed']].map(([key, label]) =>
              <button key={key} className={`filter-tab ${status === key ? 'active' : ''}`} onClick={() => setStatus(key)}>{label}</button>
            )}
          </div>

          {error && <div className="alert error-alert" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
          {notice && <div className="alert success-alert" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}

          {loading ? <div className="empty-state"><LoaderCircle className="spin" size={26} /><p>Loading your tasks...</p></div>
            : visibleTasks.length === 0 ? <div className="empty-state"><span className="empty-icon"><ClipboardList size={25} /></span><h3>{search ? 'No matches found' : status === 'completed' ? 'Nothing completed yet' : status === 'pending' ? 'You’re all caught up' : 'A fresh start'}</h3><p>{search ? 'Try another search term.' : 'Add a task to get the ball rolling.'}</p></div>
              : <div className="task-list">{visibleTasks.map((task) =>
                <article className={`task-card ${task.completed ? 'is-complete' : ''}`} key={task.id}>
                  <button className={`complete-btn ${task.completed ? 'checked' : ''}`} onClick={() => toggleTask(task)} aria-label={task.completed ? `Mark ${task.title} as pending` : `Complete ${task.title}`} title={task.completed ? 'Mark as pending' : 'Mark as complete'}>
                    {task.completed ? <Check size={15} /> : <Circle size={20} />}
                  </button>
                  <div className="task-content"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<span className={`task-status ${task.completed ? 'done' : ''}`}>{task.completed ? 'COMPLETED' : 'IN PROGRESS'}</span></div>
                  <div className="task-actions"><button className="icon-btn" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`} title="Edit"><Pencil size={16} /></button><button className="icon-btn delete-btn" onClick={() => removeTask(task)} aria-label={`Delete ${task.title}`} title="Delete"><Trash2 size={16} /></button></div>
                </article>
              )}</div>}
          <div className="list-footer"><span>Built for steady progress.</span><span>{stats.completed} completed</span></div>
        </div>
      </section>
      <footer className="footer"><span>taskmate</span><span>One step at a time.</span></footer>
    </main>
  )
}

function StatCard({ label, value, icon }) {
  return <article className="stat-card"><span className="stat-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>
}
