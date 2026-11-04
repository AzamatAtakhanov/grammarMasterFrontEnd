import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight,
  CircleHelp, Clock3, GraduationCap, History, Home, LoaderCircle,
  RotateCcw, ShieldCheck, Sparkles, Target, Trophy, XCircle
} from 'lucide-react'
import { request } from './api'
import AdminPanel from './admin/AdminPanel'

const pageTitles = {
  home: 'Dashboard',
  quiz: 'Quiz',
  result: 'Your result',
  history: 'My results',
  admin: 'Admin'
}

function App() {
  const [quizzes, setQuizzes] = useState([])
  const [results, setResults] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [studentName, setStudentName] = useState('')
  const [result, setResult] = useState(null)
  const [page, setPage] = useState('home')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const [quizData, resultData] = await Promise.all([
        request('/quizzes'),
        request('/results').catch(() => [])
      ])
      setQuizzes(quizData)
      setResults(resultData)
    } catch (e) {
      setError(e.message || 'Could not connect to the backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  const totalQuestions = useMemo(
    () => quizzes.reduce((sum, quiz) => sum + (quiz.questionCount || 0), 0),
    [quizzes]
  )

  async function openQuiz(quiz) {
    setLoading(true)
    setError('')
    try {
      const data = await request(`/quizzes/${quiz.id}`)
      setActiveQuiz(data)
      setAnswers({})
      setResult(null)
      setPage('quiz')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function chooseAnswer(questionId, option) {
    setAnswers(current => ({ ...current, [questionId]: option }))
  }

  async function submitQuiz() {
    if (!activeQuiz) return
    if (!studentName.trim()) {
      setError('Please enter your name before submitting.')
      return
    }
    if (Object.keys(answers).length !== activeQuiz.questions.length) {
      setError('Please answer every question before submitting.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        studentName: studentName.trim(),
        answers: activeQuiz.questions.map(question => ({
          questionId: question.id,
          selectedOption: answers[question.id]
        }))
      }
      const data = await request(`/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      setResult(data)
      setPage('result')
      const updatedResults = await request('/results').catch(() => [])
      setResults(updatedResults)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function goHome() {
    setPage('home')
    setActiveQuiz(null)
    setResult(null)
    setAnswers({})
    setError('')
    loadDashboard()
  }

  const answeredCount = Object.keys(answers).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={goHome} aria-label="GrammarMaster home">
          <span className="brand-mark"><GraduationCap size={23} /></span>
          <span>Grammar<span className="brand-light">Master</span></span>
        </button>

        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className={page === 'home' ? 'nav-item active' : 'nav-item'} onClick={goHome}>
            <Home size={18} /> Dashboard
          </button>
          <button className={page === 'history' ? 'nav-item active' : 'nav-item'} onClick={() => { setPage('history'); setError('') }}>
            <History size={18} /> My results
          </button>
          <button className={page === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => { setPage('admin'); setError('') }}>
            <ShieldCheck size={18} /> Admin
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="side-tip-icon"><Sparkles size={17} /></div>
          <strong>Small steps, big progress.</strong>
          <p>Practice a little every day and build your English confidence.</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><GraduationCap size={20} /> GrammarMaster</div>
          <div className="breadcrumb">Learning space <ChevronRight size={14} /> <span>{pageTitles[page]}</span></div>
          <div className="top-pill"><span className="online-dot" /> API connected through Spring Boot</div>
        </header>

        <div className="content">
          {error && <div className="alert"><CircleHelp size={18} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><XCircle size={17} /></button></div>}

          {loading && page !== 'quiz' && page !== 'result' && page !== 'admin' ? (
            <div className="loading-state"><LoaderCircle className="spin" size={30} /><span>Loading your learning space...</span></div>
          ) : null}

          {!loading && page === 'home' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><Sparkles size={14} /> YOUR ENGLISH JOURNEY</div>
                  <h1>Learn grammar.<br /><span>Speak with confidence.</span></h1>
                  <p className="lead">Choose a topic, take a quick quiz, and see how much you know.</p>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="hero-orbit orbit-one" />
                  <div className="hero-orbit orbit-two" />
                  <div className="hero-book"><BookOpen size={54} strokeWidth={1.5} /></div>
                  <span className="float-star star-a">✦</span><span className="float-star star-b">✧</span>
                  <span className="float-word">ENGLISH</span>
                </div>
              </section>

              <section className="stats-grid">
                <Stat icon={<BookOpen size={19} />} label="Available quizzes" value={quizzes.length} color="violet" />
                <Stat icon={<Target size={19} />} label="Questions completed" value={results.reduce((s, r) => s + (r.totalQuestions || 0), 0)} color="blue" />
                <Stat icon={<Trophy size={19} />} label="Quiz attempts" value={results.length} color="gold" />
              </section>

              <section className="section-heading">
                <div><div className="eyebrow">PICK YOUR PRACTICE</div><h2>Grammar topics</h2></div>
                <span className="muted-count">{quizzes.length} topics available</span>
              </section>

              <section className="quiz-grid">
                {quizzes.map((quiz, index) => (
                  <article className="quiz-card" key={quiz.id}>
                    <div className={`quiz-icon icon-${index % 3}`}>
                      {index % 3 === 0 ? <BookOpen size={22} /> : index % 3 === 1 ? <Clock3 size={22} /> : <GraduationCap size={22} />}
                    </div>
                    <div className="card-tag">{index === 0 ? 'FOUNDATION' : 'GRAMMAR PRACTICE'}</div>
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description || 'Test your knowledge and strengthen your grammar skills.'}</p>
                    <div className="card-footer">
                      <span><CircleHelp size={15} /> Practice quiz</span>
                      <button onClick={() => openQuiz(quiz)} className="start-link">Start quiz <ArrowRight size={16} /></button>
                    </div>
                  </article>
                ))}
                {quizzes.length === 0 && <div className="empty-state">No quizzes found. Check that the Spring Boot backend is running and has sample data.</div>}
              </section>
            </>
          )}

          {page === 'quiz' && activeQuiz && (
            <section className="quiz-view">
              <button className="back-link" onClick={goHome}><ArrowLeft size={16} /> Back to topics</button>
              <div className="quiz-topline"><span className="eyebrow">GRAMMAR PRACTICE</span><span className="question-counter">{answeredCount} / {activeQuiz.questions.length} answered</span></div>
              <h1 className="quiz-title">{activeQuiz.title}</h1>
              <p className="lead">{activeQuiz.description}</p>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${activeQuiz.questions.length ? answeredCount / activeQuiz.questions.length * 100 : 0}%` }} /></div>
              <div className="student-field">
                <label htmlFor="studentName">Your name</label>
                <input id="studentName" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Enter your name" />
              </div>
              <div className="question-list">
                {activeQuiz.questions.map((question, index) => (
                  <article className="question-card" key={question.id}>
                    <div className="question-number">QUESTION {String(index + 1).padStart(2, '0')}</div>
                    <h3>{question.text}</h3>
                    <div className="options-grid">
                      {['A', 'B', 'C', 'D'].map(option => (
                        <button key={option} className={`option ${answers[question.id] === option ? 'selected' : ''}`} onClick={() => chooseAnswer(question.id, option)}>
                          <span className="option-letter">{option}</span>
                          <span>{question[`option${option}`]}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="submit-row">
                <span className="muted-count">{answeredCount} of {activeQuiz.questions.length} questions answered</span>
                <button className="primary-button" disabled={submitting || answeredCount !== activeQuiz.questions.length} onClick={submitQuiz}>
                  {submitting ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}
                  Submit answers
                </button>
              </div>
            </section>
          )}

          {page === 'result' && result && (
            <section className="result-view">
              <div className="result-celebration"><Trophy size={34} /></div>
              <div className="eyebrow">QUIZ COMPLETED</div>
              <h1>Well done, {result.studentName}!</h1>
              <p className="lead">Here is your performance in {result.quizTitle}.</p>
              <div className="score-panel">
                <div className="score-ring" style={{ '--score': `${result.percentage}%` }}>
                  <div><strong>{result.percentage}%</strong><span>Your score</span></div>
                </div>
                <div className="score-copy"><span className="eyebrow">YOUR RESULT</span><h2>{result.score} <small>/ {result.totalQuestions}</small></h2><p>Correct answers</p></div>
              </div>
              <div className="section-heading"><div><div className="eyebrow">LEARNING REVIEW</div><h2>Answer explanations</h2></div></div>
              <div className="feedback-list">
                {result.feedback.map((item, index) => (
                  <article className={`feedback-card ${item.correct ? 'is-correct' : 'is-wrong'}`} key={item.questionId}>
                    <div className="feedback-status">{item.correct ? <CheckCircle2 size={19} /> : <XCircle size={19} />}</div>
                    <div className="feedback-body">
                      <span className="question-number">QUESTION {index + 1}</span>
                      <h3>{item.question}</h3>
                      <p>Your answer: <strong>{item.selectedOption || 'Not answered'}</strong> · Correct answer: <strong>{item.correctOption}</strong></p>
                      {item.explanation && <div className="explanation">{item.explanation}</div>}
                    </div>
                  </article>
                ))}
              </div>
              <div className="result-actions">
                <button className="secondary-button" onClick={() => openQuiz({ id: activeQuiz.id })}><RotateCcw size={17} /> Try again</button>
                <button className="primary-button" onClick={goHome}>Back to dashboard <ArrowRight size={17} /></button>
              </div>
            </section>
          )}

          {page === 'history' && (
            <section>
              <div className="eyebrow">YOUR LEARNING ACTIVITY</div>
              <h1 className="page-title">My results</h1>
              <p className="lead">Review your previous quiz attempts and track your progress.</p>
              <div className="history-list">
                {results.map(item => (
                  <article className="history-card" key={item.id}>
                    <div className="history-icon"><Trophy size={20} /></div>
                    <div className="history-info"><h3>{item.quiz?.title || 'Grammar quiz'}</h3><p>{item.studentName} · {item.completedAt ? new Date(item.completedAt).toLocaleString() : 'Completed'}</p></div>
                    <div className="history-score">{item.score}/{item.totalQuestions}</div>
                  </article>
                ))}
                {results.length === 0 && <div className="empty-state">No results yet. Complete your first quiz to see it here.</div>}
              </div>
            </section>
          )}

          {page === 'admin' && <AdminPanel />}
        </div>
        <footer className="footer"><span>© 2026 GrammarMaster</span><span>Built with React & Spring Boot</span></footer>
      </main>
    </div>
  )
}

function Stat({ icon, label, value, color }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>
}

export default App
