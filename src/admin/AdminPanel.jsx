import { useEffect, useState } from 'react'
import { BookOpen, LoaderCircle, LogOut, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { request } from '../api'
import ErrorAlert from './ErrorAlert'
import QuizEditor, { blankQuiz } from './QuizEditor'
import './admin.css'

const TOKEN_KEY = 'grammarmaster-admin-token'

export default function AdminPanel() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))
  const [quizzes, setQuizzes] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) loadQuizzes()
  }, [token])

  async function adminRequest(path, options = {}) {
    try {
      return await request(`/admin${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) {
      if (e.status === 401) {
        clearSession()
        setError(e.message)
      }
      throw e
    }
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setEditing(null)
    setQuizzes([])
  }

  async function signIn(password) {
    setError('')
    try {
      const data = await request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
      sessionStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
    } catch (e) {
      setError(e.message)
    }
  }

  async function signOut() {
    await request('/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    clearSession()
  }

  async function loadQuizzes() {
    setLoading(true)
    try {
      setQuizzes(await adminRequest('/quizzes'))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveQuiz(quiz) {
    const isNew = !quiz.id
    await adminRequest(isNew ? '/quizzes' : `/quizzes/${quiz.id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(quiz)
    })
    setEditing(null)
    await loadQuizzes()
  }

  async function deleteQuiz(quiz) {
    const warning = `Delete "${quiz.title}"? Its questions and saved student results will be deleted too.`
    if (!window.confirm(warning)) return
    try {
      await adminRequest(`/quizzes/${quiz.id}`, { method: 'DELETE' })
      setQuizzes(current => current.filter(q => q.id !== quiz.id))
    } catch (e) {
      setError(e.message)
    }
  }

  if (!token) {
    return <AdminLogin onSignIn={signIn} error={error} onDismissError={() => setError('')} />
  }

  if (editing) {
    return <QuizEditor quiz={editing} onSave={saveQuiz} onCancel={() => setEditing(null)} />
  }

  return (
    <section>
      <div className="admin-header">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1 className="page-title">Manage quizzes</h1>
          <p className="lead">Add new quizzes and edit the ones students see on the dashboard.</p>
        </div>
        <div className="admin-actions">
          <button className="secondary-button" onClick={signOut}><LogOut size={16} /> Sign out</button>
          <button className="primary-button" onClick={() => setEditing(blankQuiz())}><Plus size={16} /> New quiz</button>
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {loading ? (
        <div className="loading-state"><LoaderCircle className="spin" size={30} /><span>Loading quizzes...</span></div>
      ) : (
        <div className="admin-list">
          {quizzes.map(quiz => (
            <article className="admin-row" key={quiz.id}>
              <div className="admin-row-icon"><BookOpen size={20} /></div>
              <div className="admin-row-info">
                <h3>{quiz.title}</h3>
                <p>{quiz.description || 'No description'}</p>
              </div>
              <span className="admin-row-count">{quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}</span>
              <button className="icon-button" onClick={() => setEditing(quiz)} aria-label={`Edit ${quiz.title}`}><Pencil size={16} /></button>
              <button className="icon-button danger" onClick={() => deleteQuiz(quiz)} aria-label={`Delete ${quiz.title}`}><Trash2 size={16} /></button>
            </article>
          ))}
          {quizzes.length === 0 && <div className="empty-state">No quizzes yet. Click "New quiz" to create the first one.</div>}
        </div>
      )}
    </section>
  )
}

function AdminLogin({ onSignIn, error, onDismissError }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    await onSignIn(password)
    setBusy(false)
  }

  return (
    <section className="admin-login">
      <div className="admin-login-icon"><ShieldCheck size={28} /></div>
      <div className="eyebrow">ADMIN AREA</div>
      <h1 className="page-title">Sign in to manage quizzes</h1>
      <p className="lead">Enter the admin password to add and edit quizzes.</p>

      <form onSubmit={submit}>
        <ErrorAlert message={error} onClose={onDismissError} />
        <div className="field">
          <label htmlFor="adminPassword">Password</label>
          <input id="adminPassword" type="password" className="admin-input" autoFocus
                 value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="primary-button" disabled={busy || !password}>
          {busy && <LoaderCircle className="spin" size={17} />}
          Sign in
        </button>
      </form>
    </section>
  )
}
